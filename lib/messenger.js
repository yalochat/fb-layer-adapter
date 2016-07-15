'use strict'

const Wreck = require('wreck')
const Joi = require('joi')
const Hoek = require('hoek')
const Promise = require('bluebird')

const MsgIntarface = require('./msg-interface')
const Templates = require('./templates')

const LayerPlatform = require('../services/layer-platform')

const internals = {}

module.exports = class Messenger extends MsgIntarface {

  constructor (options) {
    return super().then((parent) => {

      parent.defaults = {
        fbUrl: 'https://graph.facebook.com/v2.6',
        debug: false,
        fbGrants: 'first_name, last_name, profile_pic, gender'
      }


      parent.schema = Joi.object({
        token: Joi.string().required(),
        fbUrl: Joi.string(),
        fbGrants: Joi.string(),
        debug: Joi.boolean()
      })

      parent.config = Hoek.applyToDefaults(parent.defaults, options)
      Joi.assert(parent.config, parent.schema, 'Invalid facebook options')

      parent.getLoggerInstance({console: parent.config.debug, name: '/lib/messenger'})

      parent.logger.info('Mesenger plugin loaded with the following options', parent.config)

      parent.wreck = Wreck.defaults({
        headers: { 'content-type':'application/json' },
        baseUrl: parent.config.fbUrl
      })

      return Templates.loadTemplates({console: parent.config.debug}).then((templates) => {

        parent.templates = templates
        return parent
      })
    })
  }

  _makeErrorPromise(text) {
    return new Promise((resolve, reject) => {

      return reject(new Error(text))
    })
  }

  sendMessage (recipient, message, notificationType) {

    let payload = {
      message: {
        recipient
      }
    }

    let templateData = null

    // Try parse the message to JSON
    try {
      payload.message.body = JSON.parse(message)
      templateData = Templates.applyTemplate('sendJsonMessage', payload)
      this.logger.info('Is a JSON message')
      this.logger.info(JSON.stringify(templateData))
    } catch (e) {
      payload.message.text = message
      templateData = Templates.applyTemplate('sendText', payload)
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

    if (payload.message.sender.user_id == 'service.yalochat') {
      this.logger.info(`Sending message to messenger for conversation ${conversationId}`)
      this.logger.info(message)

      return this.cache.storeGet(conversationId)
        .then(conversation => {
          this.logger.info('conversation from cache', JSON.stringify(conversation))

          let userId = conversation.metadata.user.id
          return this.sendMessage(userId, message)
        })
        .catch(error => {

          return LayerPlatform.getConversation(conversationId)
            .then(conversation => {
              this.logger.info('conversation from layer', JSON.stringify(conversation))

              // Set in chache
              this.cache.storeSet(conversation.id, conversation)

              let userId = conversation.metadata.user.id

              return this.sendMessage(userId, message)
            })
            .catch(errorPlatform  => {

              return this._makeErrorPromise('Unable to find conversation, message could not be send')
            })
        })
    } else {
      return this._makeErrorPromise(`Ignoring message from ${payload.message.sender.user_id}`)
    }
  }
}
