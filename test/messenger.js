'use strict'

// Load modules

const Messenger = require('../lib/messenger')
const Vcr = require('vcrecorder')
const Code = require('code')
const Lab = require('lab')
const Logger =  require('bucker').createLogger({console:true}, 'test/messenger')

const Cache = require('cache-redis')({ debug: true})

var internals = {
  testTokenFacebook: 'EAAX6tDZBef9YBAF7MRhcYgPqFLswMAgDFCfce5ciiQHmAZBas3ZCIoT88OC1EovO22ZCBsdWSeTAmVVLNhoLIx3KxZC3lZAZC95cuZCyZChjkWMwin5KIWUYGpWsthRJrJLsku0vZBAbDRljO8x4H6zYa9AfXbnJfQXZAvIFsX1Abp10gZDZD'
}
// Test shortcuts

const lab = exports.lab = Lab.script()
const describe = lab.describe
const expect = Code.expect
const it = lab.test
const beforeEach = lab.beforeEach

describe('Messenger module', () => {

  beforeEach(done => {

    internals.conversation = {
      'id': 'layer:///conversations/e67b5da2-95ca-40c4-bfc5-a2a8baaeb50f',
      'url': 'https://api.layer.com/apps/24f43c32-4d95-11e4-b3a2-0fd00000020d/conversations/f3cc7b32-3c92-11e4-baad-164230d1df67',
      'messages_url': 'https://api.layer.com/apps/24f43c32-4d95-11e4-b3a2-0fd00000020d/conversations/f3cc7b32-3c92-11e4-baad-164230d1df67/messages',
      'created_at': '2014-09-15T04:44:47+00:00',
      'participants': [
          '1234',
          '5678'
      ],
      'distinct': false,
      'metadata': {
        'user': {
          'id': '979330562174845',
          'name': 'Juan'
        }
      }
    }

    internals.hook = {
      'event': {
        'created_at': '2015-09-17T20:46:47.561Z',
        'type': 'message.sent',
        'id': 'c12f340d-3b62-4cf1-9b93-ef4d754cfe69',
        'actor': {
          'user_id': 'service.yalochat'
        }
      },
      'message': {
        'id': 'layer:///messages/940de862-3c96-11e4-baad-164230d1df67',
        'conversation': {
          'id': 'layer:///conversations/e67b5da2-95ca-40c4-bfc5-a2a8baaeb50f',
          'url': 'https://api.layer.com/apps/082d4684-0992-11e5-a6c0-1697f925ec7b/conversations/e67b5da2-95ca-40c4-bfc5-a2a8baaeb50f'
        },
        'parts': [
          {
            'id': 'layer:///messages/940de862-3c96-11e4-baad-164230d1df67/parts/0',
            'mime_type': 'text/plain',
            'body': 'hola mundo'
          },
          {
            'mime_type': 'image/png',
            'id': 'layer:///messages/940de862-3c96-11e4-baad-164230d1df67/parts/1',
            'content': {
              'id': 'layer:///content/940de862-3c96-11e4-baad-164230d1df60',
              'download_url': 'http://google-testbucket.storage.googleapis.com/some/download/path',
              'expiration': '2014-09-09T04:44:47+00:00',
              'refresh_url': 'https://api.layer.com/apps/082d4684-0992-11e5-a6c0-1697f925ec7b/content/7a0aefb8-3c97-11e4-baad-164230d1df60',
              'size': 172114124
            }
          }
        ],
        'sent_at': '2014-09-09T04:44:47+00:00',
        'sender': {
          'user_id': 'service.yalochat'
        },
        'recipient_status': {
          '12345': 'read',
          '999': 'sent',
          '111': 'sent'
        }
      },
      'config': {
        'key1': 'value1',
        'key2': 'value2'
      }
    }

    done()
  })

  it('Load plugin without token', done => {

    try {
      const messenger = new Messenger({})
    } catch (e) {
      expect(e.message).to.match(/token/i)
      done()
    }
  })

  it('load plugin with invalid token', done => {

    const messenger = new Messenger({ token:'9dkd9dkd9d'})
    expect(messenger).to.be.instanceof(Messenger)
    done()
  })

  it('sends text message', done => {
    Vcr.insert('send-text-msg')

    const messenger = new Messenger({ token: 'EAAOsQSQvhL4BAOQ3L464jIlqtc6Qhlz0XvAhwkN4QpidJKBoOtJSfH7j4uCfzDcgK9YYxUtawNVXZCGXI3NW5eYLkIpjOXMdBZC5ZCCvaGprBj5J7d5bYjVEcWpAa6g71yWEDskgLKZAZA35mYKY1LqHO6eMyUHFXAFpMlAPEygZDZD' })

    messenger.sendMessage('1023365714452487', 'hello world', null)
      .then(response => {
        expect(response).to.be.an.object()
        expect(response.recipient_id).to.be.string()
        Vcr.eject((rec) =>  {
          done()
        })
      })
      .catch(done)
  })

  it('sends json message', done => {
    Vcr.insert('send-json-msg')

    const messenger = new Messenger({token: 'EAAOsQSQvhL4BAOQ3L464jIlqtc6Qhlz0XvAhwkN4QpidJKBoOtJSfH7j4uCfzDcgK9YYxUtawNVXZCGXI3NW5eYLkIpjOXMdBZC5ZCCvaGprBj5J7d5bYjVEcWpAa6g71yWEDskgLKZAZA35mYKY1LqHO6eMyUHFXAFpMlAPEygZDZD'})

    messenger.sendMessage('1023365714452487', '{"attachment":{"type":"image","payload":{"url": "https://node-os.com/images/nodejs.png"}}}', null)
      .then((response) => {
        expect(response).to.be.an.object()
        expect(response.recipient_id).to.be.string()
        Vcr.eject((rec) =>  {
          done()
        })
      }).catch(done)
  })

  it('unable to find conversation from hook', done =>{

    Cache.start()
      .then(cache => {
        return new Messenger({token: internals.testTokenFacebook, cache})
          .sendTextFromHook(internals.hook)
      })
      .catch(error => {
        expect(error).to.be.error()
        expect(error.message).to.match(/Unable to find conversation, message could not be send/i)
        done()
      })
  })

  it('ignore own message from hook', done =>{
    internals.hook.message.sender.user_id = 'yoelfme'

    new Messenger({token: 'EAAOsQSQvhL4BAOQ3L464jIlqtc6Qhlz0XvAhwkN4QpidJKBoOtJSfH7j4uCfzDcgK9YYxUtawNVXZCGXI3NW5eYLkIpjOXMdBZC5ZCCvaGprBj5J7d5bYjVEcWpAa6g71yWEDskgLKZAZA35mYKY1LqHO6eMyUHFXAFpMlAPEygZDZD'})
      .sendTextFromHook(internals.hook)
      .catch(error => {
        console.error(error)
          expect(error).to.be.error()
          expect(error.message).to.match(/yoel/i)
          done()
        })
  })

  it('send message from loaded conversation fc', done => {

    Vcr.insert('send-text-msg-loaded')

    Cache.start()
      .then(cache => {
        const messenger = new Messenger({token: 'EAAOsQSQvhL4BAOQ3L464jIlqtc6Qhlz0XvAhwkN4QpidJKBoOtJSfH7j4uCfzDcgK9YYxUtawNVXZCGXI3NW5eYLkIpjOXMdBZC5ZCCvaGprBj5J7d5bYjVEcWpAa6g71yWEDskgLKZAZA35mYKY1LqHO6eMyUHFXAFpMlAPEygZDZD', cache})
        internals.conversation.metadata.user.id = 1023365714452487
        messenger.cache.set('conversations', internals.conversation.id, internals.conversation)
          .then(status => messenger.sendTextFromHook(internals.hook))
          .then(response => {
            expect(response).to.be.an.object()
            expect(response.recipient_id).to.be.string()
            Vcr.eject((rec) =>  {
              done()
            })
          })
      })
  })

  it('get user', done => {

    Vcr.insert('get-user-profile')

    new Messenger({token: internals.testTokenFacebook})
      .getUser('979330562174845')
        .then(response => {
          expect(response.gender).to.equals('male')
          Vcr.eject((rec) =>  {
            done()
          })
        })
  })
})
