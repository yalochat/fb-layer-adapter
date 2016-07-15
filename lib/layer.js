'use strict'

const _ = require('lodash')
const Joi = require('joi')
const Hoek = require('hoek')
const Promise = require('bluebird')
const Wreck = require('wreck')

const Cache = require('./cache')
const MsgInterface = require('./msg-interface')
const Messenger = require('./messenger')
const Templates = require('./templates')

const LayerPlatform = require('../services/layer-platform')

const internals = {}

module.exports = class Layer extends MsgInterface {

  constructor (options) {

    return super().then((parent) =>{

      parent.defaults = {
        token: process.env.LAYER_TOKEN,
        appId: process.env.LAYER_APP_ID,
        debug: false,
        layerUrl: 'https://api.layer.com',
        participants: ['service.yalochat']
      }

      parent.schema = Joi.object({
        token: Joi.string().required(),
        debug: Joi.boolean(),
        appId: Joi.string().required(),
        layerUrl: Joi.string().required(),
        participants: Joi.array().items(Joi.string()).required(),
        sender: Joi.object().keys({
          id: Joi.string(),
          name: Joi.string()
        }),
        messengerToken: Joi.string().required()
      })

      // Add to participants the sender id if exists
      if (options.sender && options.sender.id) {
        parent.defaults.participants = _.union(parent.defaults.participants, [options.sender.id])
      }

      // Set configuration for instance and merge with default configuration
      parent.config = Hoek.applyToDefaults(parent.defaults, options)
      parent.config.participants = _.union(parent.defaults.participants, options.participants)

      // Create messenger instance with provided messenger token
      parent.messengerInstance = new Messenger({ token: parent.config.messengerToken })

      Joi.assert(parent.config, parent.schema, 'Invalid layer options')

      // Configure logger instance
      parent.getLoggerInstance({console: parent.config.debug, name: '/lib/layer'})


      parent.logger.info('Layer adapter created with the following options', parent.config)

      // Set default configuration for client of wreck
      parent.wreck = Wreck.defaults({
        headers: {
          accept: 'application/vnd.layer+json; version=1.1',
          'content-type': 'application/json',
          authorization: `Bearer ${parent.config.token}`
        },
        baseUrl: parent.config.layerUrl
      })

      // Load all templates
      return Templates.loadTemplates({console: parent.config.debug})
        .then((templates) => {

          parent.templates = templates
          return parent
      })

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

      this.messengerInstance
        .then(messenger => {
          return messenger.getUser(recipient)
        })
        .then(user => {

            const payload = Templates.applyTemplate('createLayerConversation', {
              participants,
              user: _.merge({ id: recipient, user})
            })

            LayerPlatform.createConversation(payload)
              .then(conversation => {

                this.logger.info(`Conversation was created successfully, id: ${conversation.id}`)

                // Save conversation in cache storage
                this.cache.storeSet(conversation.id, conversation)
                  .then(status => {
                    if (status) {
                      return resolve(conversation)
                    } else {
                      return reject(new Error('Unable to store, conversation with id: ${conversation.id}'))
                    }
                  })
              })
              .catch(err => {
                return reject(err)
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

    const conversation = this._validateConversation(recipient)

    return this._validateConversation(recipient)
      .then(conversation => {

        this.logger.info(`Sending message to conversation with id ${conversation.id}`)

        return this._sendMessage(recipient, message, conversation.id, contentType)
      })
  }

  udpateMetadata (recipient, metadata) {

    return this._validateConversation(recipient)
      .then(conversation => {

        return LayerPlatform.updateMetadata(conversation.id, metadata)
      })
  }

}
