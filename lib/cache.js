'use strict'

const Catbox = require('catbox')
const Memory = require('catbox-memory')
const Promise = require('bluebird')
const Logger =  require('bucker').createLogger()

module.exports = class Cache  {

  constructor(options){
    this.client = new Catbox.Client(Memory)
    this.ttl = 2147483647

    return new Promise((resolve, reject) => {

      this.client.start((err) => {

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

      Logger.info(`Seting key ${JSON.stringify(localKey)} on store`)

      this.client.set(localKey, value, this.ttl, (err) => {

        if(err){

          Logger.error(err)
          return reject(err)
        }

        return resolve(true)
      })
    })
  }

  storeGet(key){

    return new Promise((resolve, reject) => {

      const localKey = {id:'', segment:JSON.stringify(key)}
      Logger.info(`Loading from store key ${localKey}`)

      this.client.get(localKey, (err, value) => {
        if (err || !value) {

          Logger.error(err)
          return reject(err || null)
        }

        return resolve(value.item)
      })
    })
  }

}
