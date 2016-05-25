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

    constructor(options){

        return super().then((parent) => {

            parent.defaults = {
                token: process.env.APP_FB_TOKEN,
                fbUrl: 'https://graph.facebook.com/v2.6/me',
                debug: true
            }


            parent.schema = Joi.object({
                token: Joi.string().required(),
                fbUrl: Joi.string(),
                debug: Joi.boolean()
            })

            Joi.assert(options, parent.schema, 'Invalid facebook options')


            parent.config = Hoek.applyToDefaults(parent.defaults, options)

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

    sendText(recipient, message, notificationType){

        const payload =  { message: { }}
        payload.message.recipient = recipient
        payload.message.text = message

        return new Promise((resolve, reject) => {
 
            const templateData = Templates.applyTemplate('sendText', payload)
            Logger.warn(templateData, this.config.token)
            this.wreck.post(`/messages?access_token=${this.config.token}`,{payload:JSON.stringify(templateData)}, (err, response, payload) => {

                if (err){
                    reject(err)
                }

                Logger.info(`Request response ${response.statusCode}`)

                try{
                    const jsonData =JSON.parse(payload.toString())
                    Logger.info(err, jsonData)
                    resolve(jsonData)
                }
                catch(e){
                    reject(e)
                }
            })

        })
    }

    sendTextFromHook(payload) {

        const text = payload.message.parts[0].body
        const conversationId = payload.message.conversation.id

        return this.cache.storeGet(conversationId).then((data) => {

            if (data){

                const userId = data.item.metadata.user.id
                Logger.error(userId)
                return this.sendText(userId, text)
            }
            else{
                return new Error('Unable to find stored conversation, message could not be send')
            }

        })
    }
}
