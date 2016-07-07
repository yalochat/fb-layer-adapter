'use strict'

const Joi = require('joi')
const Hoek = require('hoek')
const Promise = require('bluebird')
const MsgInterface = require('./msg-interface')
const Wreck = require('wreck')
const Cache = require('./cache')
const _ = require('lodash')

const internals = {}

module.exports = class Layer extends MsgInterface {

  constructor(options){

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
        messenger: Joi.any().optional()
      })


      if(options.sender && options.sender.id){
        parent.defaults.participants = _.union(parent.defaults.participants, [options.sender.id])
      }


      parent.config = Hoek.applyToDefaults(parent.defaults, options)
      parent.config.participants = _.union(parent.defaults.participants, options.participants)

      Joi.assert(parent.config, parent.schema, 'Invalid layer options')


      parent.getLoggerInstance({console: parent.config.debug, name: '/lib/layer'})


      parent.logger.info('Layer adapter created with the following options', parent.config)
      parent.wreck = Wreck.defaults({
        'headers': {
          'accept':'application/vnd.layer+json; version=1.1',
          'content-type':'application/json',
          'authorization': `Bearer ${parent.config.token}`
        },
        'baseUrl': parent.config.layerUrl
      })

      return this
    })
  }

  _validateConversation(recipient) {

    let specificParticipants = []
    specificParticipants.push(recipient)

    if(this.config.sender){
      specificParticipants.push(this.config.sender.id)
    }

    let participants = _.union(specificParticipants, this.config.participants)

    this.logger.info(`A conversation will be created with the following participants ${participants}`)

    return new Promise((resolve, reject) => {

      this.config.messenger.then((messenger) => {
        return messenger.getUser(recipient)
      }).then((user) => {

        try {

          //must move the payload to templates
          const payload = {
            participants: participants,
            distinct: true,
            metadata: {
              type:'fb-conversation',
              state:'active',
              user:{
                id: recipient,
                nickname: user.first_name,
                name: `${user.first_name} ${user.last_name}`,
                pic: user.profile_pic,
                gender: user.gender
              },
              store:{
                name:`FB - ${user.first_name}`
              }
            }
          }

          this.wreck.post(`/apps/${this.config.appId}/conversations`, {payload:JSON.stringify(payload)}, (err, response, payload) => {

            if(err){
              reject(err)
            }

            this.logger.info(`Create conversation request response ${response.statusCode}`)

            try{
              const conversation = JSON.parse(payload.toString())
              this.logger.info('Create conversation response', conversation)

              this.cache.storeSet(conversation.id, conversation).then((cacheStatus) => {

                if(cacheStatus){
                  return resolve(conversation)
                }
                else{
                  return reject(new Error('Unable to store conversation'))
                }

              })
            }
            catch(e){
              this.logger.error(e)
              return reject(e)
            }
          })
        }
        catch(e) {
          this.logger.error(e)
          return e
        }
      })
        .catch(error => {

          this.logger.warn(error)
          return reject(error)
        })
    })
  }

  sendText (recipient, message, contentType)  {

    const conversation = this._validateConversation(recipient)

    return conversation.then((conversation) => {
      this.logger.info('Sending message to conversation ->', conversation)
      return this.conversation = this._sendMessage(recipient, message, conversation.messages_url, contentType)
    })
  }

  _sendMessage (recipient, message, url, parContentType){

    const contentType = parContentType ? parContentType : 'text/plain'
    this.logger.info('in _sendMessage content/type', contentType)
    this.logger.info(this.config.sender)
    const senderId = this.config.sender ? this.config.sender.id : recipient

    this.logger.info('in _sendMessage sender', senderId)

    return new Promise((resolve, reject) => {

      const payload = {
        sender:{
          user_id: senderId
        },
        parts:[
          {
            body: message,
            mime_type: contentType
          }
        ]
      }

      this.logger.info('in _sendMessage payload', payload)

      this.wreck.post(url, {payload:JSON.stringify(payload)}, (err, response, payload) => {

        if(err){
          reject(err)
        }

        this.logger.info(`Request response ${response.statusCode}`)

        try{
          const jsonData =JSON.parse(payload.toString())
          resolve(jsonData)
        }
        catch(e){
          reject(e)
        }
      })
    })
  }

  sendTextFromHook (payload) {

    const userId = payload.entry[0].messaging[0].sender.id

    if (payload.entry[0].messaging[0].message && payload.entry[0].messaging[0].message.text){

      const text = payload.entry[0].messaging[0].message.text
      return this.sendText(userId, text)
    }
    else if (payload.entry[0].messaging[0].postback && payload.entry[0].messaging[0].postback.payload){

      const text = payload.entry[0].messaging[0].postback.payload
      return this.sendText(userId, `Usuario selecciono: ${text}`)
    }
    else if (payload.entry[0].messaging[0].message && payload.entry[0].messaging[0].message.attachments){

      this.logger.info(`Processing attachments`, payload.entry[0].messaging[0].message.attachments)
      return Promise.map(payload.entry[0].messaging[0].message.attachments, (attachment) => {
        if (attachment.type == 'image'){
          return this.sendText(userId, attachment.payload.url)
        }
      })
    }
    return new Promise((resolve) => { return resolve({}) })
  }

}
