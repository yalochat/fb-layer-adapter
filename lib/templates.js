'use strict'
var Logger = require('bucker').createLogger()
const Path = require('path')
const Joi = require('joi')
const Hoek = require('hoek')
const Promise = require('bluebird')
const readFile = Promise.promisify(require("fs").readFile)
const readDir = Promise.promisify(require("fs").readdir)
const jsonTemplate = require('valid-json-template')

const internals = {}
const externals = module.exports = {}


internals.schema = Joi.object({
    token: Joi.string().required(),
    fbUrl: Joi.string(),
    debug: Joi.boolean()
})

externals.getTemplate = (name) => {

    Logger.info('in getTemplate')
    if(!internals.templates){
        return new Error('Templates need to be loaded before getting one')
    }
    return internals.templates[name] ? internals.templates[name] : new Error('Invalid template file')
}

externals.applyTemplate = (name, data) => {

    Logger.info('in applyTemplate')
    const template = externals.getTemplate(name)

    const payload = jsonTemplate(template)(data)

    try{
        return JSON.parse(payload)
    }
    catch(e){
        return e
    }

}
externals.loadTemplates = () => {

    Logger.info('in loadTemplates')

    internals.templates = []
    let templatesPath = Path.join(__dirname, '../templates')
    Logger.info(`Loading templates in ${templatesPath}`)
    return new Promise( (resolve, reject) => {

        readDir(templatesPath).then((files) => {

            Logger.info(files,'Files to load')
            Promise.map(files, (file) => {
                Logger.info(`Loading file ${templatesPath}/${file}`)

                return readFile(`${templatesPath}/${file}`, "utf8").then((templateContent) => {

                    Logger.info(`content -> ${templateContent} for ${file}`)
                    internals.templates[Path.basename(file,'.json')] = templateContent
                })
            }).then( (response) => {

                Logger.info('Done loading templates !!!!')
                resolve(internals.templates)
            }).catch((e) => {

                Logger.error(e.message)
                reject(e)
            })
        }).catch((e) => {
            Logger.error(e.message)
            reject(e)
        })
    })

}
