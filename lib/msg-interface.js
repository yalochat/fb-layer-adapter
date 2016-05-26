'use strict'
const Cache = require('./cache')
const Logger =  require('bucker').createLogger()

module.exports = class MessengerInterface {

    constructor(options){

        this.defaults = {
            debug: true
        }

        //Create a memory cache instance
       return new Promise((resolve, reject) => {

            new Cache().then((cache) => {

                this.cache = cache
                return resolve(this)
            })
        })

    }

    sendText(recipient, message, notificationType){
        throw new Error('Method sendText must be overwritten!');
    }

    sendTextFromHook(payload) {
        throw new Error('Method sendTextFromHook must be overwritten!');
    }
}
