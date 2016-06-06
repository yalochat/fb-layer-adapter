'use strict'

const Catbox = require('catbox')
const Memory = require('catbox-memory')
const Promise = require('bluebird')
const Logger =  require('bucker')
const Hoek = require('hoek')

module.exports = class Cache  {

  constructor(options){
    this.client = new Catbox.Client(Memory)
    this.ttl = 2147483647

    this.defaults = {
      debug: false
    }

    this.config = Hoek.applyToDefaults(this.defaults, options)

    this.logger = Logger.createLogger({console: this.config.debug},'/lib/cache')

    return new Promise((resolve, reject) => {

      this.client.start((err) => {
          this.logger.info('Starting cache...')

        if(err){
            return reject(err)
        }

        return resolve(this)
      })
    })
  }

  storeSet(key, value){
    return new Promise((resolve, reject) => {

      const localKey = {id:'', segment:JSON.stringify(key)}

      //this.logger.info(`Seting key ${JSON.stringify(localKey)} on store`)

      this.client.set(localKey, value, this.ttl, (err) => {

        if(err){

          return reject(err)
        }

        return resolve(true)
      })
    })
  }

  storeGet(key){

    return new Promise((resolve, reject) => {

      const localKey = {id:'', segment:JSON.stringify(key)}
      //this.logger.info(`Loading from store key ${localKey}`)

      this.client.get(localKey, (err, value) => {
        if (err || !value) {

          return reject(err)
        }

        return resolve(value.item)
      })
    })
  }

}
