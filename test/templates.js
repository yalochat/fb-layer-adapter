'use strict'

// Load modules

const Code = require('code')
const Lab = require('lab')
const Templates = require('../lib/templates')



// Test shortcuts

const lab = exports.lab = Lab.script()
const describe = lab.describe
const expect = Code.expect
const it = lab.test


describe('Get template library', () => {

    it('Load a specific valid template', (done) => {

        const result = Templates.loadTemplates()
        result.then((templates) => {

            const result = Templates.getTemplate('sendText')
            expect(result).to.be.string()

            done()
        })
    })

    it('Load a specific invalid template focus', (done) => {

        try{
            const result = Templates.getTemplate('test')
            done()
        }
        catch(e){
            expect(e.message).to.match(/templates/i)
            done()
        }
    })

    it('Load all templates', (done) => {

        const result = Templates.loadTemplates()
        result.then((templates) => {

            expect(templates['sendText']).to.be.string()
            done()
        })
    })

    it('Apply a template', (done) => {

        const result = Templates.loadTemplates()
        result.then((templates) => {
            console.info(templates)


            const data = {
                message:{
                    recipient:'452213211',
                    text:'hola mundo'
                }
            }
            const payload = Templates.applyTemplate('sendText', data)
            console.log(payload)
            //expect(payload).to.be.equals('')
            expect(payload.message.text).to.equals('hola mundo')

            done()
        })
    })

    it('Apply create conversation template', (done) => {

        const result = Templates.loadTemplates()
        result.then((templates) => {
            console.info(templates)


            const data = {
                message:{
                    recipient:'452213211',
                    text:'hola mundo'
                }
            }
            const payload = Templates.applyTemplate('sendText', data)
            console.log(payload)
            //expect(payload).to.be.equals('')
            expect(payload.message.text).to.equals('hola mundo')

            done()
        })
    })



})
