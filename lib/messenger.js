'use strict'

const Wreck = require('wreck')
const Joi = require('joi')
const Hoek = require('hoek')
const Promise = require('bluebird')

const AdapterInterface = require('./adapter-interface')
const Templates = require('./templates')

const LayerPlatform = require('../services/layer-platform')
const Helpers = require('../services/helpers')

const internals = {}

module.exports = class Messenger extends AdapterInterface {

  constructor (options) {
    super(options)

    this.defaults = {
      fbUrl: 'https://graph.facebook.com/v2.6',
      debug: false,
      fbGrants: 'first_name, last_name, profile_pic, gender'
    }

    this.schema = Joi.object({
      token: Joi.string().required(),
      fbUrl: Joi.string(),
      fbGrants: Joi.string(),
      debug: Joi.boolean(),
      cache: Joi.object()
    })

    this.cache = options.cache

    this.config = Hoek.applyToDefaults(this.defaults, options)
    Joi.assert(this.config, this.schema, 'Invalid facebook options')

    this._getLoggerInstance({console: this.config.debug, name: '/lib/messenger'})

    this.logger.info('Mesenger plugin loaded with the following options', this.config)

    this.wreck = Wreck.defaults({
      headers: { 'content-type':'application/json' },
      baseUrl: this.config.fbUrl
    })
  }

  sendMessage (recipient, message, notificationType) {

    let payload = {
      message: {
        recipient
      }
    }

    let templateData = null

    return this._loadTemplates()
      .then(templates => {
        this.templates = templates

        // Try parse the message to JSON
        try {
          payload.message.body = JSON.parse(message)
          templateData = Templates.applyTemplate(this.templates['sendJsonMessage'], payload)

          this.logger.info('Is a JSON message')
          this.logger.info(JSON.stringify(templateData))
        } catch (e) {
          payload.message.text = message
          templateData = Templates.applyTemplate(this.templates['sendText'], payload)

          this.logger.info('Is a simple text message')
        }

        this.logger.info('Send to messenger payload ->', templateData)

        return new Promise((resolve, reject) => {

          let url = `/me/messages?access_token=${this.config.token}`
          this.logger.info(`Send message url -> ${url}`)

          this.wreck.post(url, {payload: JSON.stringify(templateData)}, (err, response, payload) => {

            if (err) {
              this.logger.error(err)
              return reject(err)
            }

            this.logger.info(`Request response ${response.statusCode}`)

            try {
              let jsonData =JSON.parse(payload.toString())
              if (jsonData.error){
                return reject(new Error(JSON.stringify(jsonData.error)))
              }
              this.logger.info('Messenger response', jsonData)

              return resolve(jsonData)
            } catch(e) {
              this.logger.error(e)
              return reject(e)
            }
          })
        })
      })
  }

  getUser (userId) {

    return new Promise((resolve, reject) => {


      let url = `/${userId}?access_token=${this.config.token}&fields=${this.config.fbGrants}`
      this.logger.info(`Get user url -> ${url}`)

      this.wreck.get(url, {}, (err, response, payload) => {

        if (err) {
          this.logger.error(err)
          return reject(err)
        }

        this.logger.info(`Get user request response ${response.statusCode}`)

        try {
          let jsonData =JSON.parse(payload.toString())
          return resolve(jsonData)
        } catch(e) {
          this.logger.error(e)
          return reject(e)
        }
      })
    })
  }

  sendTextFromHook (payload) {

    let message = payload.message.parts[0].body
    let conversationId = payload.message.conversation.id
    const regex =  /\w*\.\d*$/

    if (payload.message.sender.user_id == 'service.yalochat' || regex.test(payload.message.sender.user_id)) {
      this.logger.info(`Sending message to messenger for conversation ${conversationId}`)
      this.logger.info(message)

      return this.cache.get('conversations', conversationId)
        .then(conversation => {
          this.logger.info('conversation from cache', JSON.stringify(conversation))

          return this.sendMessage(conversation.metadata.user.id, message)
        })
        .catch(error => {

          return LayerPlatform.getConversation(conversationId)
            .then(conversation => {
              this.logger.info('conversation from layer', JSON.stringify(conversation))

              this.cache.set('conversations', conversation.id, conversation)

              return this.sendMessage(conversation.metadata.user.id, message)
            })
            .catch(errorPlatform  => {

              return Helpers.errorPromise('Unable to find conversation, message could not be send')
            })
        })
    } else {
      return Helpers.errorPromise(`Ignoring message from ${payload.message.sender.user_id}`)
    }
  }
}
