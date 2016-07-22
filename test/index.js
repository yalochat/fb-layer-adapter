'use strict'

// Load modules

const Adapter = require('../lib/')
const Vcr = require('vcrecorder')
const Code = require('code')
const Lab = require('lab')

var internals = {}
// Test shortcuts

const lab = exports.lab = Lab.script()
const describe = lab.describe
const expect = Code.expect
const it = lab.test
const beforeEach = lab.beforeEach

describe('Index module', () => {

  it('loads messenger plugin', (done) => {
    const Messenger = new Adapter.Messenger({ token: 'ABC123'})

    expect(Messenger).to.be.instanceOf(Adapter.Messenger)
    done()
  })

  it('loads layer plugin', (done) => {
    const Layer = new Adapter.Layer({ token: 'ABC123', appId: '1234', sender: {}, messengerToken: 'CBA321'})

    expect(Layer).to.be.instanceOf(Adapter.Layer)
    done()
  })
})
