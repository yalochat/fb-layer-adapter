'use strict'

const Wreck = require('wreck')
const Joi = require('joi')
const Hoek = require('hoek')
const Templates = require('./templates')
const Promise = require('bluebird')
const Logger =  require('bucker').createLogger()
const MsgIntarface = require('./msg-interface')

const internals = {}


module.exports = class Messenger extends MsgIntarface {

  constructor (options) {

    return super().then((parent) => {

      parent.defaults = {
        token: process.env.APP_FB_TOKEN || process.env.FB_PAGE_TOKEN,
        fbUrl: 'https://graph.facebook.com/v2.6',
        debug: true,
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
      Logger.info('Mesenger plugin loaded with the following options', parent.config)

      parent.wreck = Wreck.defaults({
        'headers': { 'content-type':'application/json'},
        'baseUrl': parent.config.fbUrl
      })

      return Templates.loadTemplates().then((templates) => {

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
      Logger.info('Is a JSON message')
      Logger.info(JSON.stringify(templateData))
    } catch (e) {
      payload.message.text = message
      templateData = Templates.applyTemplate('sendText', payload)
      Logger.info('Is a simple text message')
    }

    Logger.info('Send to messenger payload ->', payload)

    return new Promise((resolve, reject) => {

      this.wreck.post(`/me/messages?access_token=${this.config.token}`, {payload: JSON.stringify(templateData)}, (err, response, payload) => {

        if (err) {
          Logger.error(err)
          return reject(err)
        }

        Logger.info(`Request response ${response.statusCode}`)

        try {
          let jsonData =JSON.parse(payload.toString())
          Logger.info('Messenger response', jsonData)

          return resolve(jsonData)
        } catch(e) {
          Logger.error(e)
          return reject(e)
        }
      })
    })
  }

  getUser (userId) {

    return new Promise((resolve, reject) => {

      let url = `/${userId}?access_token=${this.config.token}&fields=${this.config.fbGrants}`

      this.wreck.get(url,{}, (err, response, payload) => {

        if (err) {
          Logger.error(err)
          reject(err)
        }

        Logger.info(`Get user request response ${response.statusCode}`)

        try {
          let jsonData =JSON.parse(payload.toString())
          resolve(jsonData)
        } catch(e) {
          Logger.error(e)
          reject(e)
        }
      })
    })
  }

  sendTextFromHook (payload) {

    let message = payload.message.parts[0].body
    let conversationId = payload.message.conversation.id

    if (payload.message.sender.user_id == 'service.yalochat') {
      Logger.info(`Sending message to messenger for conversation ${conversationId}`)
      Logger.info(message)

      return this.cache.storeGet(conversationId).then((data) => {

        Logger.info('Data from cache', data)
        if (data) {
          let userId = data.item.metadata.user.id
          return this.sendMessage(userId, message)
        } else {
          return this._makeErrorPromise('Unable to find stored conversation, message could not be send')
        }
      })
    } else {
      return this._makeErrorPromise('Ignoring message from service.yalochat')
    }
  }
}
