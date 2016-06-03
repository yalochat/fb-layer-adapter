'use strict'

// Load modules

const Cache = require('../lib/cache')

const Code = require('code')
const Lab = require('lab')


// Test shortcuts

const lab = exports.lab = Lab.script()
const describe = lab.describe
const expect = Code.expect
const it = lab.test


describe('Cache module', () => {

    it('load class constructor', (done) => {

        const cache = new Cache()
        cache.then((cacheInstance) => {

            expect(cacheInstance).to.be.instanceof(Cache)
            done()
        })
    })

    it('store a key', (done) => {

        const cache = new Cache()

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

    it('store and get a key', (done) => {

        const cache = new Cache()

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

    it('get an invalid key, focus', (done) => {

        const cache = new Cache()

        cache.then((client) => {

            const key = { id: 'y', segment: 'test' };
            client.storeGet(key)
              .catch((value) => {
                expect(value).to.be.null()
                done()
            })
        })
    })

})
