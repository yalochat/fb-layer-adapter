'use strict'

// Load modules

const Layer = require('../lib/layer')
const Vcr = require('vcrecorder')
const Code = require('code')
const Lab = require('lab')


// Test shortcuts

const lab = exports.lab = Lab.script()
const describe = lab.describe
const expect = Code.expect
const it = lab.test


describe('Layer module', () => {

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

    it('send message focus', (done) => {

        const layer = new Layer({token:'7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F', appId: 'bec9d548-6265-11e5-9a48-0edffe00788f'})

        layer.then((layerInstance) => {
            return layerInstance.sendText('fred@yalochat.com', 'hola mundo')
        }).then((result) => {

            expect(result.id).to.exist()
            done()
        }).catch((e) => { console.error(e)})
    })
})
