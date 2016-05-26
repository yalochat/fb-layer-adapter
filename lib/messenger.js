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

    constructor (options){

        return super().then((parent) => {

            parent.defaults = {
                token: process.env.APP_FB_TOKEN,
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

    sendText (recipient, message, notificationType){

        const payload =  { message: { }}
        payload.message.recipient = recipient
        payload.message.text = message

        Logger.info('Send to messenger payload ->', payload)

        return new Promise((resolve, reject) => {
 
            const templateData = Templates.applyTemplate('sendText', payload)

            this.wreck.post(`/me/messages?access_token=${this.config.token}`,{payload:JSON.stringify(templateData)}, (err, response, payload) => {

                if (err){
                    Logger.error(err)
                    reject(err)
                }

                Logger.info(`Request response ${response.statusCode}`)

                try{

                    const jsonData =JSON.parse(payload.toString())
                    Logger.info('Messenger response', jsonData)
                    resolve(jsonData)
                }
                catch(e){
                    Logger.error(e)
                    reject(e)
                }
            })

        })
    }

    getUser (userId){

        return new Promise((resolve, reject) => {

            const url = `/${userId}?access_token=${this.config.token}&fields=${this.config.fbGrants}`

            this.wreck.get(url,{}, (err, response, payload) => {

                if (err){
                    Logger.error(err)
                    reject(err)
                }

                Logger.info(`Get user request response ${response.statusCode}`)

                try{
                    const jsonData =JSON.parse(payload.toString())
                    resolve(jsonData)
                }
                catch(e){
                    Logger.error(e)
                    reject(e)
                }

            })
        })
    }

    sendTextFromHook (payload) {

        const text = payload.message.parts[0].body
        const conversationId = payload.message.conversation.id

        return this.cache.storeGet(conversationId).then((data) => {

            if (data){

                const userId = data.item.metadata.user.id
                return this.sendText(userId, text)
            }
            else{
                return new Error('Unable to find stored conversation, message could not be send')
            }
        })
    }
}
