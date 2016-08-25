'use strict'

const _ = require('lodash')
const Joi = require('joi')
const Hoek = require('hoek')
const Promise = require('bluebird')
const Wreck = require('wreck')

const AdapterInterface = require('./adapter-interface')
const Messenger = require('./messenger')
const Templates = require('./templates')
const Helpers = require('../services/helpers')

const LayerPlatform = require('../services/layer-platform')

const internals = {}

module.exports = class Layer extends AdapterInterface {

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
      page: Joi.object().keys({
        id: Joi.string(),
        name: Joi.string(),
        email: Joi.string().email(),
        phone: Joi.string()
      }).required(),
      cache: Joi.object()
    })

    this.cache = options.cache

    this.metadata = {
      remove: ['store'],
      add: ['page', 'mode']
    }

    // Add to participants the sender id if exists
    if (options.sender && options.sender.id) {
      this.defaults.participants = _.union(this.defaults.participants, [options.sender.id])
    }

    // Set configuration for instance and merge with default configuration
    this.config = Hoek.applyToDefaults(this.defaults, options)
    this.config.participants = _.union(this.defaults.participants, options.participants)

    // Create messenger instance with provided messenger token
    this.messenger = new Messenger({ debug: options.debug, token: this.config.messengerToken })

    Joi.assert(this.config, this.schema, 'Invalid layer options')

    // Configure logger instance
    this._getLoggerInstance({console: this.config.debug, name: '/lib/layer'})

    this.logger.info(`Layer adapter created with the following participants ${this.config.participants}`)

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
    let participants = [recipient]

    // If adapter has configured send, push to array of participants
    if (this.config.sender) {
      participants.push(this.config.sender.id)
    }

    // Merge default participants with specific participants
    participants = _.union(participants, this.config.participants)

    this.logger.info(`A conversation will be created with the following participants ${participants}`)

    return new Promise((resolve, reject) => {

      this.cache.get('conversations', participants.join(','))
        .then(conversation =>  resolve(conversation))
        .catch(error => {
          this.messenger
            .getUser(recipient) // Get information of user from Facebook
            .then(user => {
               return this._loadTemplates().then(templates => {
                // Load all templates
                this.templates = templates

                // Build metadata used for conversation
                const payload = Templates.applyTemplate(this.templates['createLayerConversation'], {
                  participants,
                  user: _.merge({ id: recipient, full_name: `${user.first_name} ${user.last_name}`}, user),
                  page: this.config.page
                })

                // Trying to create a conversation with payload created by template
                return LayerPlatform.createConversation(payload)
                  .then(conversation => {
                    this.logger.info(`Conversation was created successfully, id: ${conversation.id}`)

                    // Verify if conversation has conflict, then resolve conflict
                    if (conversation.statusCode === 409) {

                      // Delete metadata of conversation
                      this.logger.info(`Trying to remove: ${this.metadata.remove} of metadata from conversation with id: ${conversation.id}`)

                      const remove = _.reduce(this.metadata.remove, (result, value, key) => {
                        result[value] = key

                        return result
                      }, {})

                      LayerPlatform.deleteMetadata(conversation.id, remove)
                        .then(response => `The keys has been removed of metadata from conversation with id: ${conversation.id}`)
                        .catch(error => this.logger.error(`Has been ocurred an error when trying to remove metadata of conversation with id: ${conversation.id}`))

                      // Update or add metadata of conversation
                      this.logger.info(`Trying to update metadata of conversation with id: ${conversation.id}`)

                      _.each(this.metadata.add, (key) => {
                        if (!_.has(conversation, `metadata.${key}`)) {
                          let update = {}
                          update[key] = payload.metadata[key]
                          update = Helpers.dot(update)

                          // Update metadata of conversation
                          LayerPlatform.updateMetadata(conversation.id, update)
                            .then(response => this.logger.info(`The metadata of conversation with id: ${conversation.id} has been updated`))
                            .catch(error => this.logger.error(`Has been ocurred an error when trying to update metadata of conversation with id: ${conversation.id}`))
                        }
                      })
                    }

                    // Save conversation in cache storage by conversationId
                    this.cache.set('conversations', conversation.id, conversation)
                      .then(status => {
                        if (status) {
                          // Save conversation in cache storage by participants
                          return this.cache.set('conversations', participants.join(','), conversation)
                        }
                      })
                      .then(status => {
                        if (status) {
                          return resolve(conversation)
                        }

                        return reject(new Error(`Unable to store, conversation with id: ${conversation.id}`))
                      })
                  })
              })
            })
            .catch(error => {
              // The conversation could not be created
              this.logger.warn(error)

              return reject(error)
            })
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

    const data = payload.entry[0].messaging[0]
    const userId = data.sender.id
    const message = data.message

    if (message && message.text) {
      return this.sendText(userId, message.text)
    } else if (data.postback && data.postback.payload) {
      return this.sendText(userId, `Usuario selecciono: ${data.postback.payload}`)
    } else if (message && message.attachments) {

      this.logger.info(`Processing attachments`, message.attachments)

      return Promise.map(message.attachments, (attachment) => {
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
