'use strict'

const _ = require('lodash')
const Joi = require('joi')
const Hoek = require('hoek')
const Promise = require('bluebird')
const Wreck = require('wreck')

const MsgInterface = require('./msg-interface')
const Messenger = require('./messenger')
const Templates = require('./templates')

const LayerPlatform = require('../services/layer-platform')

const internals = {}

module.exports = class Layer extends MsgInterface {

  constructor (options) {
    super(options)

    this.defaults = {
      token: process.env.LAYER_TOKEN,
      appId: process.env.LAYER_APP_ID,
      debug: false,
      layerUrl: 'https://api.layer.com',
      participants: ['service.yalochat']
    }

    this.schema = Joi.object({
      token: Joi.string().required(),
      debug: Joi.boolean(),
      appId: Joi.string().required(),
      layerUrl: Joi.string().required(),
      participants: Joi.array().items(Joi.string()).required(),
      sender: Joi.object().keys({
        id: Joi.string(),
        name: Joi.string()
      }),
      messengerToken: Joi.string().required(),
      cache: Joi.object()
    })

    this.cache = options.cache

    // Add to participants the sender id if exists
    if (options.sender && options.sender.id) {
      this.defaults.participants = _.union(this.defaults.participants, [options.sender.id])
    }

    // Set configuration for instance and merge with default configuration
    this.config = Hoek.applyToDefaults(this.defaults, options)
    this.config.participants = _.union(this.defaults.participants, options.participants)

    // Create messenger instance with provided messenger token
    this.messenger = new Messenger({ token: this.config.messengerToken })

    Joi.assert(this.config, this.schema, 'Invalid layer options')

    // Configure logger instance
    this._getLoggerInstance({console: this.config.debug, name: '/lib/layer'})


    this.logger.info('Layer adapter created with the following options', this.config)

    // Set default configuration for client of wreck
    this.wreck = Wreck.defaults({
      headers: {
        accept: 'application/vnd.layer+json; version=1.1',
        'content-type': 'application/json',
        authorization: `Bearer ${this.config.token}`
      },
      baseUrl: this.config.layerUrl
    })
  }

  _validateConversation (recipient) {
    let specificParticipants = [recipient]

    if (this.config.sender) {
      specificParticipants.push(this.config.sender.id)
    }

    let participants = _.union(specificParticipants, this.config.participants)

    this.logger.info(`A conversation will be created with the following participants ${participants}`)

    return new Promise((resolve, reject) => {

      this.messenger.getUser(recipient)
        .then(user => {
          this._loadTemplates()
            .then(templates => {
              this.templates = templates

              const payload = Templates.applyTemplate(this.templates['createLayerConversation'], {
                participants,
                user: _.merge({ id: recipient, full_name: `${user.first_name} ${user.last_name}`}, user)
              })

              payload.metadata.store.name = `FB - ${payload.metadata.store.name}`

              LayerPlatform.createConversation(payload)
                .then(conversation => {

                  this.logger.info(`Conversation was created successfully, id: ${conversation.id}`)
                  // Verify if conversation has conflict
                  if (conversation.statusCode === 409) {
                    // Verify if conversation metadata has not key of 'mode'
                    if (! _.has(conversation, 'metadata.mode')) {
                      this.logger.info(`Trying to update metadata of conversation with id: ${conversation.id}`)

                      // Update metadata of conversation
                      LayerPlatform.updateMetadata(conversation.id, { mode: 'bot' })
                        .then(response => this.logger.info(`The metadata of conversation with id: ${conversation.id} has been updated`))
                        .catch(error => this.logger.info(`Has been ocurred an error when trying to update metadata of conversation with id: ${conversation.id}`))
                    }
                  }

                  // Save conversation in cache storage
                  this.cache.set('conversations', conversation.id, conversation)
                    .then(status => {
                      if (status) {
                        return resolve(conversation)
                      } else {
                        return reject(new Error(`Unable to store, conversation with id: ${conversation.id}`))
                      }
                    })
                })
                .catch(err => {
                  return reject(err)
                })
            })
        })
        .catch(error => {

          this.logger.warn(error)
          return reject(error)
        })
    })
  }

  _sendMessage (recipient, message, conversationId, contentType) {

    const senderId = this.config.sender ? this.config.sender.id : recipient
    contentType = contentType ? contentType : 'text/plain'

    this.logger.info('in _sendMessage content/type', contentType)
    this.logger.info('in _sendMessage sender', senderId)


    return LayerPlatform.sendMessage(conversationId, senderId, message, contentType)
  }

  sendTextFromHook (payload) {

    const userId = payload.entry[0].messaging[0].sender.id

    if (payload.entry[0].messaging[0].message && payload.entry[0].messaging[0].message.text) {

      const text = payload.entry[0].messaging[0].message.text
      return this.sendText(userId, text)
    } else if (payload.entry[0].messaging[0].postback && payload.entry[0].messaging[0].postback.payload) {

      const text = payload.entry[0].messaging[0].postback.payload
      return this.sendText(userId, `Usuario selecciono: ${text}`)
    } else if (payload.entry[0].messaging[0].message && payload.entry[0].messaging[0].message.attachments) {

      this.logger.info(`Processing attachments`, payload.entry[0].messaging[0].message.attachments)
      return Promise.map(payload.entry[0].messaging[0].message.attachments, (attachment) => {
        if (attachment.type == 'image') {
          return this.sendText(userId, attachment.payload.url)
        }
      })
    }

    return Promise.resolve({})
  }

  sendText (recipient, message, contentType) {

    return this._validateConversation(recipient)
      .then(conversation => {

        this.logger.info(`Sending message to conversation with id ${conversation.id}`)

        return this._sendMessage(recipient, message, conversation.id, contentType)
      })
  }

  updateMetadata (recipient, metadata) {

    return this._validateConversation(recipient)
      .then(conversation => {

        return LayerPlatform.updateMetadata(conversation.id, metadata)
      })
  }

}
