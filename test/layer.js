'use strict'

// Load modules
const Layer = require('../lib/layer')
const Vcr = require('vcrecorder')
const Code = require('code')
const Lab = require('lab')

const Cache = require('cache-redis')({ debug: true})

// Test shortcuts

const lab = exports.lab = Lab.script()
const beforeEach = lab.beforeEach
const before = lab.before
const describe = lab.describe
const expect = Code.expect
const it = lab.test

const internals = {}

const messengerToken = 'EAAX6tDZBef9YBAF7MRhcYgPqFLswMAgDFCfce5ciiQHmAZBas3ZCIoT88OC1EovO22ZCBsdWSeTAmVVLNhoLIx3KxZC3lZAZC95cuZCyZChjkWMwin5KIWUYGpWsthRJrJLsku0vZBAbDRljO8x4H6zYa9AfXbnJfQXZAvIFsX1Abp10gZDZ'
const page = {
  'id': '1234567',
  'name': 'Test page',
  'email': 'test@page.com',
  'phone': '456785678'
}

describe('Layer module', () => {

  lab.before(done => {

    internals.debug = false
    if (process.env.DEBUG) {
      if (process.env.DEBUG == 'true') {
        internals.debug = true
      }
    }

    done()
  })

  beforeEach(done => {

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
                "seq":51
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

  it('load plugin without token', done => {
    try {
      const layer = new Layer({})
    } catch (e) {
      expect(e).to.be.an.error()
      done()
    }
  })

  it('load plugin without sender', done => {
    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', messengerToken, page})

    expect(layer).to.be.instanceof(Layer)
    done()
  })


  it('load plugin with bad sender object keys', done => {

    try {
      const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {i: 123, nam: 'Fred'}, debug: internals.debug, messengerToken, page})
    } catch (e) {
      expect(e).to.be.an.error()
      expect(e.message).to.match(/id/i)
      done()
    }
  })

  it('load plugin with recipients', done => {
    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', participants: ['loosers.mx', 'loosers.bot'], debug: internals.debug, messengerToken, page})

    expect(layer.config.participants).to.be.an.array()
    expect(layer.config.participants).to.include('service.yalochat')
    done()
  })

  it('load plugin with recipients and sender', done => {

    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', participants: ['loosers.mx'], sender: {id: 'loosers.bot', name: 'Fred'}, debug: internals.debug, messengerToken, page})

    expect(layer.config.participants).to.be.an.array()
    expect(layer.config.participants).to.include('loosers.bot')
    done()
  })

  it('load plugin with recipients and sender', done => {

    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', participants: ['loosers.mx'], sender: {name: 'Fred'}, debug: internals.debug, messengerToken, page})

    expect(layer.config.participants).to.be.an.array()
    expect(layer.config.participants).to.not.include('loosers.bot')
    done()
  })

  it('load plugin with token', done => {

    const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {id: '123', name: 'Fred'}, debug: internals.debug, messengerToken, page})

    expect(layer).to.be.instanceof(Layer)
    done()
  })


  it('send message', done => {
    Cache.start()
      .then(cache => {
        Vcr.insert('layer-send-text-msg')

        const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {id: 'test.bot.1', name: 'Fred'}, debug: internals.debug, messengerToken, cache, page})
        return layer.sendText('979330562174845', 'hola mundo', null, '979330562174841')
      })
      .then((result) => {

        expect(result.id).to.exist()
        expect(result.sender.user_id).equals('test.bot.1')
        Vcr.eject((rec) =>  {
          done()
        })
      })
  })

  it('send invalid message from hook', done => {

    Cache.start()
      .then(cache => {
        const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {id: 'test.bot', name: 'Fred'}, debug: internals.debug, messengerToken, cache, page})

        return layer.sendTextFromHook(internals.messengerInvalidHook)
      })
      .then((result) => {

        expect(result).to.exist()
        expect(result).to.be.empty()
        done()
      })
  })

  it('send invalid message item from hook', done => {

    Cache.start()
      .then(cache => {
        const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {id: 'test.bot', name: 'Fred'}, debug: internals.debug, messengerToken, cache, page })

         return layer.sendTextFromHook(internals.messengerHookInvalidMessage)
      })
      .then(result => {
        expect(result).to.exist()
        expect(result).to.be.empty()
        done()
      })
  })


  it('send message from hook fc', done => {
    Cache.start()
      .then(cache => {
        Vcr.insert('layer-send-hook-msg')

        const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {id: 'test.bot', name: 'Fred'}, debug: internals.debug, messengerToken, cache, page})

        return layer.sendTextFromHook(internals.messengerHook)
      })
      .then((result) => {

        expect(result.id).to.exist()
        Vcr.eject((rec) =>  {
          done()
        })
      })
  })

  it('send message from hook', done => {

    Cache.start()
      .then(cache => {
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
        const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {id: 'test.bot', name: 'Fred'}, debug: internals.debug, messengerToken, cache, page})

        return layer.sendTextFromHook(messengerPostbackHook)
      })
      .then(result => {
        expect(result.id).to.exist()
        Vcr.eject((rec) =>  {
          done()
        })
      }).catch(done)
  })


  it('send message from hook with sender', done => {

    Cache.start()
      .then(cache => {

        Vcr.insert('layer-send-postback-hook-msg')

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

        const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {id: 'test.bot', name: 'Fred'}, debug: internals.debug, messengerToken, cache, page })

        return layer.sendTextFromHook(messengerPostbackHook)
      })
      .then(result => {
        expect(result.id).to.exist()
        expect(result.sender.user_id).to.equals('test.bot')
        Vcr.eject((rec) =>  {
          done()
        })
      })
  })

    it('send message from hook without sender', done => {
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

      Vcr.insert('layer-send-postback-hook-msg-no-sender')

      Cache.start()
      .then(cache => {
        const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', debug: internals.debug, messengerToken, cache, page })

        return layer.sendTextFromHook(messengerPostbackHook)
      })
      .then((result) => {

        expect(result.id).to.exist()
        expect(result.sender.user_id).to.equals(messengerPostbackHook.entry[0].messaging[0].sender.id)

        Vcr.eject((rec) =>  {
          done()
        })
      })
  })


  it('send attachment from hook', done => {

    Cache.start()
      .then(cache => {
        Vcr.insert('layer-send-hook-attachment')

        const messengerImageHook = {
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
                    "attachments":[
                      {
                        "type":"image",
                        "payload":{
                          "url":"http://www.camionetica.com/wp-content/uploads/2013/03/Hola-Mundo-4ta-Migraci%C3%B3n-Camionetica.png"
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }

        const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f', sender: {id: 'test.bot', name: 'Fred'}, debug: internals.debug, messengerToken, cache, page})

        return layer.sendTextFromHook(messengerImageHook)
      })
      .then((result) => {
        expect(result[0].conversation.id).to.exist()
        expect(result[0].parts[0].body).to.match(/png/i)
        Vcr.eject((rec) =>  {
          done()
        })
      })
  })
})
