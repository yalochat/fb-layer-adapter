'use strict'

const Catbox = require('catbox')
const Redis = require('catbox-redis')
const Promise = require('bluebird')
const Logger =  require('bucker')
const Hoek = require('hoek')

module.exports = class Cache  {

  constructor(options){
    this.ttl = 2147483647

    this.defaults = {
      debug: false,
      redis: {
        host: process.env.REDIS_HOST,
        port: 6379,
        password: '',
        database: 'fb-layer-adapter'
      }
    }

    this.config = Hoek.applyToDefaults(this.defaults, options)
    this.logger = Logger.createLogger({console: this.config.debug}, '/lib/cache')

    this.client = new Catbox.Client(Redis, this.config.redis)

    return new Promise((resolve, reject) => {

      this.client.start((err) => {
      this.logger.info('Starting cache...')

      if (err) {
        return reject(err)
      }

      return resolve(this)
      })
    })
  }

  storeSet(key, value){
    return new Promise((resolve, reject) => {

      const localKey = { id:'', segment:JSON.stringify(key) }

      this.client.set(localKey, value, this.ttl, (err) => {

        if (err) {

          return reject(err)
        }

        return resolve(true)
      })
    })
  }

  storeGet(key){

    return new Promise((resolve, reject) => {

      const localKey = { id:'', segment:JSON.stringify(key) }

      this.logger.info(`Loading from store key ${JSON.stringify(localKey)}`)

      this.client.get(localKey, (err, value) => {

        if (err) {

          return reject(err)
        } else if (! value) {
          return reject(value)
        }

        return resolve(value.item)
      })
    })
  }
}
