'use strict'

const Bucker = require('bucker')
const Promise = require('bluebird')
const Templates = require('./templates')

module.exports = class MessengerInterface {

  constructor(options){
    this.defaults = {
      debug: false
    }

    return this;
  }

  _getLoggerInstance (options) {
    this.logger = Bucker.createLogger(options, options.name);
  }

  _loadTemplates (options) {
    if (! this.templates) {
      return Templates.loadTemplates({console: this.config.debug})
    }

    return Promise.resolve(this.templates)
  }

  sendText (recipient, message, notificationType) {
    throw new Error('Method sendText must be overwritten!');
  }

  sendTextFromHook (payload) {
    throw new Error('Method sendTextFromHook must be overwritten!');
  }
}
