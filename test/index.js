'use strict'

// Load modules

const Code = require('code')
const Lab = require('lab')
const Messenger = require('../lib')
const Vcr = require('vcrecorder')


// Test shortcuts

const lab = exports.lab = Lab.script()
const describe = lab.describe
const expect = Code.expect
const it = lab.test


describe('Messenger module', () => {

    it('Load plugin without token', (done) => {
        try{
            messenger = new Messenger({})
        }
        catch(e){
            expect(e.message).to.match(/token/i)
            done()
        }
    })

    it('Load plugin without token', (done) => {
        try{
            const messenger = new Messenger({'token':'9dkd9dkd9d'})
            expect(messenger).to.be.instanceof(Messenger)
            done()
        }
        catch(e){ }
    })

    it('Send text message focus', (done) => {

        Vcr.insert('send-text-msg')
        try{

            const promise = new Messenger({'token':'EAAAAQEEIZCjIBAOMqsyq8oZC8NU5vyaZBw5YDmy444Tc0kCTRzHZCPjxt6T0OAlXMoU8X6d1tv8sjlfZBtZBPZA80OtKn8ZCgSgFSF6eVGybpxRVOnriiq4D1XixWMerZBDm7xXOvOAozGE7q2IMtGLZBVTRZBL8SJNOZA1V4BycnLZBTewZDZD'})

            promise.then((messenger) => {
                messenger.sendText('1031879416899272','hello', null).then((response) => {

                    expect(response).to.be.an.object()
                    expect(response.recipient_id).to.be.string()
                    Vcr.eject((rec) =>  {
                        done()
                    })
                })
            })

        }
        catch(e){
            console.log(e.message)
            done()
        }
    })

})
