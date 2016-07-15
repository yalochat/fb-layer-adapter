'use strict'
var Logger = require('bucker')
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

  internals.logger().info('in getTemplate', internals.templates)
    if(!internals.templates){
        throw new Error('Templates need to be loaded before getting one')
    }
    return internals.templates[name] ? internals.templates[name] : new Error('Invalid template file')
}

externals.applyTemplate = (name, data) => {

    internals.logger().info('in applyTemplate')

    try{

        const template = externals.getTemplate(name)

        const payload = jsonTemplate(template)(data)

        return JSON.parse(payload)
    }
    catch(e){
        return e
    }

}

internals.logger = (options) => {

  let debug =  {console: false}
  return Logger.createLogger(debug, '/lib/templates')
}
externals.loadTemplates = (options) => {

  internals.logger().info('in loadTemplates', options)

  internals.templates = []
  let templatesPath = Path.join(__dirname, '../templates')
  internals.logger().info(`Loading templates in ${templatesPath}`)

  return new Promise( (resolve, reject) => {

    readDir(templatesPath).then((files) => {
      internals.logger().info(files,'Files to load')
      Promise.map(files, (file) => {
        internals.logger().info(`Loading file ${templatesPath}/${file}`)

        return readFile(`${templatesPath}/${file}`, "utf8").then((templateContent) => {

          internals.logger().info(`content -> ${templateContent} for ${file}`)
          internals.templates[Path.basename(file,'.json')] = templateContent
        })
      }).then( (response) => {

        internals.logger().info('Done loading templates !!!!')
        resolve(internals.templates)
      }).catch((e) => {

        internals.logger().error(e.message)
        reject(e)
      })
    }).catch((e) => {
      internals.logger().error(e.message)
      reject(e)
    })
  })
}
