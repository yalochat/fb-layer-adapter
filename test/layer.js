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

    }).then( _ => {
      done()
    })
  })

  it('load plugin without sender', (done) => {

    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f'})
    layer.catch((e) => {
      expect(e.message).to.match(/sender/i)
      done()
    }).then( _ => {
      done()
    })
  })


  it('load plugin with bad sender object keys', (done) => {

    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {i: 123, nam: 'Fred'}})

    layer.catch((e) => {

      expect(e).to.be.an.error()
      expect(e.message).to.match(/id/i)
      done()
    })
  })

  it('load plugin with recipients', (done) => {

    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', participants: ['loosers.mx', 'loosers.bot']})

    layer.then( Layer => {

      expect(Layer.config.participants).to.be.an.array()
      expect(Layer.config.participants).to.include('service.yalochat')
      done()
    }).catch(done)
  })

  it('load plugin with recipients and sender', (done) => {

    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', participants: ['loosers.mx'], sender: {id: 'loosers.bot', name: 'Fred'}})

    layer.then( Layer => {

      expect(Layer.config.participants).to.be.an.array()
      expect(Layer.config.participants).to.include('loosers.bot')
      done()
    }).catch(done)
  })

  it('load plugin with recipients and sender', (done) => {

    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', participants: ['loosers.mx'], sender: {name: 'Fred'}})

    layer.then( Layer => {

      expect(Layer.config.participants).to.be.an.array()
      expect(Layer.config.participants).to.not.include('loosers.bot')
      done()
    }).catch(done)
  })

  it('load plugin with token', (done) => {

    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {id: '123', name: 'Fred'}})

    layer.then((layerInstance) => {

      expect(layerInstance).to.be.instanceof(Layer)
      done()
    }).catch(done)
  })


  it('send message focus', (done) => {

    Vcr.insert('layer-send-text-msg')
    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {id: 'test.bot', name: 'Fred'}})

    layer.then((layerInstance) => {
      return layerInstance.sendText('979330562174845', 'hola mundo')
    }).then((result) => {

      expect(result.id).to.exist()
      expect(result.sender.user_id).equals('test.bot')
      Vcr.eject((rec) =>  {
        done()
      })
    }).catch(done)
  })

  it('send invalid message from hook', (done) => {

    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {id: 'test.bot', name: 'Fred'}})

    layer.then((layerInstance) => {

      return layerInstance.sendTextFromHook(internals.messengerInvalidHook)

    }).then((result) => {

      expect(result).to.exist()
      expect(result).to.be.empty()
      done()

    }).catch(done)
  })

  it('send invalid message item from hook', (done) => {

    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {id: 'test.bot', name: 'Fred'}})

    layer.then((layerInstance) => {

      return layerInstance.sendTextFromHook(internals.messengerHookInvalidMessage)

    }).then((result) => {

      expect(result).to.exist()
      expect(result).to.be.empty()
      done()

    }).catch(done)
  })


  it('send message from hook', (done) => {

    Vcr.insert('layer-send-hook-msg')
    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {id: 'test.bot', name: 'Fred'}})

    layer.then((layerInstance) => {

      return layerInstance.sendTextFromHook(internals.messengerHook)

    }).then((result) => {

      expect(result.id).to.exist()
      Vcr.eject((rec) =>  {
        done()
      })

    }).catch(done)
  })

  it('send message from hook', (done) => {

    let messengerPostbackHook = {
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
              'postback':{
                'payload':'menu 3'
              }
            }
          ]
        }
      ]
    }

    Vcr.insert('layer-send-postback-hook-msg')
    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {id: 'test.bot', name: 'Fred'}})

    layer.then((layerInstance) => {

      return layerInstance.sendTextFromHook(messengerPostbackHook)

    }).then((result) => {

      expect(result.id).to.exist()
      Vcr.eject((rec) =>  {
        done()
      })

    }).catch(done)
  })
})
