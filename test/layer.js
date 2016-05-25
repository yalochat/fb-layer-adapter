'use strict'

// Load modules

const Layer = require('../lib/layer')
const Vcr = require('vcrecorder')
const Code = require('code')
const Lab = require('lab')


// Test shortcuts

const lab = exports.lab = Lab.script()
const beforeEach = lab.beforeEach
const describe = lab.describe
const expect = Code.expect
const it = lab.test
const internals = {}

describe('Layer module', () => {

    beforeEach((done) => {
        internals.messengerHook = {
            'object':'page',
            'entry':[
                {
                    'id':'250270911989871',
                    'time':1457764198246,
                    'messaging':[
                        {
                            'sender':{
                                'id':'979330562174845'
                            },
                            'recipient':{
                                'id':'250270911989871'
                            },
                            'timestamp':1457764197627,
                            'message':{
                                'mid':'mid.1457764197618:41d102a3e1ae206a38',
                                'seq':73,
                                'text':'hello, world!'
                            }
                        }
                    ]
                }
            ]
        }
        internals.messengerHookInvalidMessage = {
            'object':'page',
            'entry':[
                {
                    'id':'250270911989871',
                    'time':1457764198246,
                    'messaging':[
                        {
                            'sender':{
                                'id':'979330562174845'
                            },
                            'recipient':{
                                'id':'250270911989871'
                            },
                            'timestamp':1457764197627,
                            "message":{
                                "mid":"mid.1458696618141:b4ef9d19ec21086067",
                                "seq":51,
                                "attachments":[
                                    {
                                        "type":"image",
                                        "payload":{
                                            "url":"IMAGE_URL"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        }


        internals.messengerInvalidHook = {
            "object":"page",
            "entry":[
                {
                    'id':'250270911989871',
                    "time":1458668856451,
                    "messaging":[
                        {
                            'sender':{
                                'id':'979330562174845'
                            },
                            'recipient':{
                                'id':'250270911989871'
                            },
                            "delivery":{
                                "mids":[
                                    "mid.1458668856218:ed81099e15d3f4f233"
                                ],
                                "watermark":1458668856253,
                                "seq":37
                            }
                        }
                    ]
                }
            ]
        }

        done()
    })
    it('load plugin without token', (done) => {

        new Layer({}).catch((e) => {
            expect(e.message).to.match(/layer/i)
            done()

        })
    })

    it('load plugin with token', (done) => {
        try{
            const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f'})
            layer.then((layerInstance) => {

                expect(layerInstance).to.be.instanceof(Layer)
                done()
            })
        }
        catch(e){
            console.error(e)
        }
    })

    it('send message', (done) => {

        const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f'})

        layer.then((layerInstance) => {
            return layerInstance.sendText('fred@yalochat.com', 'hola mundo')
        }).then((result) => {

            expect(result.id).to.exist()
            done()
        }).catch((e) => { console.error(e)})
    })

    it('send invalid message from hook', (done) => {

        const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f'})

        layer.then((layerInstance) => {

            return layerInstance.sendTextFromHook(internals.messengerInvalidHook)

        }).then((result) => {

            expect(result).to.exist()
            expect(result.id).to.not.exist()
            done()

        }).catch((e) => { console.error(e)})
    })

    it('send invalid message item from hook', (done) => {

        const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f'})

        layer.then((layerInstance) => {

            return layerInstance.sendTextFromHook(internals.messengerHookInvalidMessage)

        }).then((result) => {

            expect(result).to.exist()
            expect(result.id).to.not.exist()
            done()

        }).catch((e) => { console.error(e)})
    })


    it('send message from hook', (done) => {

        const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f'})

        layer.then((layerInstance) => {

            return layerInstance.sendTextFromHook(internals.messengerHook)

        }).then((result) => {

            expect(result.id).to.exist()
            done()

        }).catch((e) => { console.error(e)})
    })
})
