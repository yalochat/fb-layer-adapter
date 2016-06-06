'use strict'
const Cache = require('./cache')
const Logger =  require('bucker')

module.exports = class MessengerInterface {

    constructor(options){

        this.defaults = {
          debug: false
        }
      //Create a memory cache instance
       return new Promise((resolve, reject) => {

         new Cache(this.defaults).then((cache) => {

                this.cache = cache
                return resolve(this)
         }).catch((e) => {
           console.error(e)
           reject(e)
         })
       })

    }

    sendText(recipient, message, notificationType){
        throw new Error('Method sendText must be overwritten!');
    }


  getLoggerInstance(options){
    this.logger = Logger.createLogger(options, options.name)
  }
    sendTextFromHook(payload) {
        throw new Error('Method sendTextFromHook must be overwritten!');
    }
}
