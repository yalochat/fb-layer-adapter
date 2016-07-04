'use strict'

const Lab = require('lab')
const Code = require('code')
const Config = require('../config')

const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it
const before = lab.before
const after = lab.after
const expect = Code.expect

describe('Config', () => {

  it('gets config data', (done) => {

    expect(Config.get('/')).to.be.an.object()

    done()
  })


  it('it gets config meta data', (done) => {

    expect(Config.meta('/')).to.match(/FB Messenger Layer adapter/i)

    done()
  })

  it('it gets config layer credentials', (done) => {
    expect(Config.get('/app/layer/token')).to.equals('7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F')
    expect(Config.get('/app/layer/appId')).to.equals('bec9d548-6265-11e5-9a48-0edffe00788f')
    done()
  })

  it('it gets config redis', (done) => {
    expect(Config.get('/app/redis/host')).to.equals('127.0.0.1')
    expect(Config.get('/app/redis/port')).to.equals('6379')
    expect(Config.get('/app/redis/database')).to.equals('adapter-cache-test')

    done()
  })

})
