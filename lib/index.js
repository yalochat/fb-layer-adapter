'use strict'

const Wreck = require('wreck')
const Joi = require('joi')
const Hoek = require('hoek')
const Templates = require('./templates')
const Promise = require('bluebird')
const Logger =  require('bucker').createLogger()

const internals = {}


module.exports = class Messenger {

    constructor(options){

        this.defaults = {
            token: process.env.APP_FB_TOKEN,
            fbUrl: 'https://graph.facebook.com/v2.6/me',
            debug: true
        }

        this.schema = Joi.object({
            token: Joi.string().required(),
            fbUrl: Joi.string(),
            debug: Joi.boolean()
        })


        Joi.assert(options, this.schema, 'Invalid facebook options')
        this.config = Hoek.applyToDefaults(this.defaults, options)
        this.wreck = Wreck.defaults({
            'headers': { 'content-type':'application/json'},
            'baseUrl': this.config.fbUrl
        })

        return new Promise( (resolve, reject) => {
            Templates.loadTemplates().then( (templates) => {
                this.templates = templates
                resolve(this)
            }).catch((e) => {
                reject(e)
            })
        })
    }

    sendText(recipient, message, notificationType){

        const payload =  { message: { }}
        payload.message.recipient = recipient
        payload.message.text = message

        return new Promise((resolve, reject) => {

            const templateData = Templates.applyTemplate('sendText', payload)

            this.wreck.post(`/messages?access_token=${this.config.token}`,{payload:JSON.stringify(templateData)}, (err, response, payload) => {

                if(err){
                    reject(err)
                }

                Logger.info(`Request response ${response.statusCode}`)

                try{
                    const jsonData =JSON.parse(payload.toString())
                    resolve(jsonData)
                }
                catch(e){
                    recect(e)
                }
            })

        })
    }
}
