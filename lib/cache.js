'use strict'

const Catbox = require('catbox')
const CatboxRedis = require('catbox-redis')
const CatboxMemory = require('catbox-memory')
const Promise = require('bluebird')
const Logger =  require('bucker')
const Hoek = require('hoek')
const Config = require('../config')

module.exports = class Cache  {

  constructor(options){

    this.ttl = 2147483647

    this.defaults = {
      debug: true,
      redis: {
        host: Config.get('/app/redis/host'),
        port: Config.get('/app/redis/port'),
        database: Config.get('/app/redis/database')
      }
    }

    this.config = Hoek.applyToDefaults(this.defaults, options)
    this.logger = Logger.createLogger({console: this.config.debug},'/lib/cache')

    this.logger.info(`Cache loaded with environment ${Config.get('/app/env')}`)

    const catboxAdapter = (Config.get('/app/env') == 'test') ? CatboxMemory : CatboxRedis
    this.client = new Catbox.Client(catboxAdapter, this.config.redis)

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

      const localKey = {id:'', segment:JSON.stringify(key)}

      //this.logger.info(`Seting key ${JSON.stringify(localKey)} on store`)

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

      const localKey = {id:'', segment:JSON.stringify(key)}

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
