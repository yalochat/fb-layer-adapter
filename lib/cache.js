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
                resolve(this)
            })
        })
    }

    storeSet(key, value){
        return new Promise((resolve, reject) => {

            const localKey = {id:'', segment:JSON.stringify(key)}
            this.client.set(localKey, value, this.ttl, (err) => {

                if(err){
                    return reject(err)
                }
                resolve(true)
            })
        })
    }

    storeGet(key){

        return new Promise((resolve, reject) => {

            const localKey = {id:'', segment:JSON.stringify(key)}
            this.client.get(localKey, (err, value) => {

                if(err){
                    return reject(err)
                }
                resolve(value)
            })
        })
    }

}
