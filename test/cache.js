'use strict'

// Load modules
const Code = require('code')
const Lab = require('lab')
const Promise = require('bluebird')
const Catbox = require('catbox')

const Cache = require('../lib/cache')

// Test shortcuts

const lab = exports.lab = Lab.script()
const describe = lab.describe
const expect = Code.expect
const it = lab.test


describe('Cache module', () => {

    it('load class constructor', (done) => {

      const cache = new Cache({})
      cache.then((cacheInstance) => {

        expect(cacheInstance).to.be.instanceof(Cache)
        done()
      })
    })

    it('error when trying to init the client', (done) => {
      const start = Catbox.Client.prototype.start
      Catbox.Client.prototype.start = (callback) => {
        callback(new Error())
      }

      new Cache({})
        .catch((error) => {
          expect(error).to.be.instanceof(Error)
          Catbox.Client.prototype.start = start
          done()
        })
    })

    it('store a key', (done) => {

      const cache = new Cache({})

      cache.then((client) => {

        const key = { id: 'x', segment: 'test' };
        const response = client.storeSet(key, '123')
        response.then((status) => {

            expect(status).to.be.true()
            done()
        }).catch((err) => {
            console.error(err)
        })

      })
    })

    it('error when trying to set a key', (done) => {
      const set = Catbox.Client.prototype.set
      Catbox.Client.prototype.set = (key, value, ttl, callback) => {
          return callback(new Error('fail'));
      }


      new Cache({})
        .then((client) => {
          const key = { id: 'x', segment: 'test' };
          
          client.storeSet(key, '123')
            .catch((err) => {
          
              expect(err).to.be.instanceof(Error)
              Catbox.Client.prototype.set = set
              done()
            })
        })
    })

    it('store and get a key', (done) => {

      const cache = new Cache({})

        cache.then((client) => {

            const key = { id: 'x', segment: 'test' }
            const response = client.storeSet(key, '123')
            response.then((status) => {

                expect(status).to.be.true()
                client.storeGet(key).then((value) => {
                    expect(value).to.equals('123')
                    done()
                })

            }).catch((err) => {
                console.error(err)
            })

        })
    })

    it('get an invalid key', (done) => {

      new Cache({})
        .then((client) => {

          const key = { id: 'y', segment: 'test' }

          client.storeGet(key)
            .catch((value) => {
              expect(value).to.be.null()
              done()
          })
       })
    })

    it('error when trying to get a key', (done) => {
      const get = Catbox.Client.prototype.get
      Catbox.Client.prototype.get = (key, callback) => {
          return callback(new Error('fail'), null);
      }


      new Cache({})
        .then((client) => {
          const key = { id: 'x', segment: 'test' }

          client.storeGet(key)
            .catch((value) => {

              expect(value).to.be.instanceof(Error)
              Catbox.Client.prototype.get = get
              done()
          })
        })
    })

})
