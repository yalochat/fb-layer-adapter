'use strict'

const Bucker = require('bucker')
const Path = require('path')
const Joi = require('joi')
const Hoek = require('hoek')
const Promise = require('bluebird')
const readFile = Promise.promisify(require('fs').readFile)
const readDir = Promise.promisify(require('fs').readdir)
const jsonTemplate = require('valid-json-template')

const internals = {}
const externals = module.exports = {}

internals.schema = Joi.object({
  token: Joi.string().required(),
  fbUrl: Joi.string(),
  debug: Joi.boolean(),
  loggerInstance: null
})

internals.logger = (options) => {

  if (! internals.loggerInstance) {
    return internals.loggerInstance = Bucker.createLogger(options, '/lib/templates')
  }

  return internals.loggerInstance
}

externals.getTemplate = (name) => {

  internals.logger().info('in getTemplate', internals.templates)

  if (!internals.templates) {
    throw new Error('Templates need to be loaded before getting one')
  }

  return internals.templates[name] ? internals.templates[name] : new Error('Invalid template file')
}

externals.applyTemplate = (template, data) => {

  internals.logger().info('in applyTemplate')
  try {
    const payload = jsonTemplate(template)(data)

    return JSON.parse(payload)
  } catch(e) {
    return e
  }
}

externals.loadTemplates = (options) => {

  internals.logger(options).info('in loadTemplates', options)

  internals.templates = []
  let templatesPath = Path.join(__dirname, '../templates')
  internals.logger(options).info(`Loading templates in ${templatesPath}`)

  return new Promise( (resolve, reject) => {

    readDir(templatesPath)
      .then((files) => {
        internals.logger(options).info(files,'Files to load')
        Promise.map(files, (file) => {
          internals.logger(options).info(`Loading file ${templatesPath}/${file}`)

          return readFile(`${templatesPath}/${file}`, 'utf8').then((templateContent) => {

            internals.logger(options).info(`content -> ${templateContent} for ${file}`)
            internals.templates[Path.basename(file,'.json')] = templateContent
          })
        }).then( (response) => {

          internals.logger(options).info('Done loading templates !!!!')
          resolve(internals.templates)
        }).catch((e) => {

          internals.logger(options).error(e.message)
          reject(e)
        })
      })
      .catch((e) => {
        internals.logger(options).error(e.message)
        reject(e)
      })
  })
}
