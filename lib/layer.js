'use strict'

const Joi = require('joi')
const Hoek = require('hoek')
const Promise = require('bluebird')
const Logger =  require('bucker').createLogger()
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
                debug: true,
                layerUrl: 'https://api.layer.com',
                participants: ['service.yalochat']
            }

            parent.schema = Joi.object({
                token: Joi.string().required(),
                debug: Joi.boolean(),
                appId: Joi.string().required(),
                layerUrl: Joi.string().required(),
                participants: Joi.array().items(Joi.string()).required()
            })


            parent.config = Hoek.applyToDefaults(parent.defaults, options)
            Joi.assert(parent.config, parent.schema, 'Invalid layer options')

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


        this.recipient = []
        this.recipient.push(recipient)

        const participants  = Hoek.merge(this.config.participants, this.recipient)

        const payload = {
            participants: participants,
            distinct: true
        }

        return new Promise((resolve, reject) => {

            this.wreck.post(`/apps/${this.config.appId}/conversations`, {payload:JSON.stringify(payload)}, (err, response, payload) => {

                if(err){
                    reject(err)
                }

                Logger.info(`Request response ${response.statusCode}`)

                try{
                    const conversation =JSON.parse(payload.toString())

                    this.cache.storeSet(conversation.id, conversation).then((cacheStatus) => {

                        if(cacheStatus){
                            resolve(conversation)
                        }
                        else{
                            reject(new Error('Unable to store conversation'))
                        }

                    })
                }
                catch(e){
                    reject(e)
                }
            })
        })
    }

    sendText (recipient, message, notificationType)  {

        const conversation = this._validateConversation(recipient)
        Logger.info(conversation)

        return conversation.then((conversation) => {

            return this.conversation = this._sendMessage(recipient, message, conversation.messages_url)
        })
    }

    _sendMessage (recipient, message, url){

            return new Promise((resolve, reject) => {

                const payload = {
                    sender:{
                        name: recipient
                    },
                    parts:[
                        {
                            body: message,
                            mime_type: 'text/plain'

                        }
                    ]
                }

                this.wreck.post(url, {payload:JSON.stringify(payload)}, (err, response, payload) => {

                    if(err){
                        reject(err)
                    }

                    Logger.info(`Request response ${response.statusCode}`)

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

    sendTextFromHook(payload) {
        Logger.warn(payload.entry[0].messaging)
        if (payload.entry[0].messaging[0].message && payload.entry[0].messaging[0].message.text){

            const text = payload.entry[0].messaging[0].message.text
            const userId = payload.entry[0].messaging[0].sender.id

            return this.sendText(userId, text)
        }
        return new Promise((resolve) => { return resolve({}) })
    }

}
