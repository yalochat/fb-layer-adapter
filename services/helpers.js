'use strict'

const Promise = require('bluebird')

module.exports = {
  errorPromise: (text) => {
    return Promise.reject(new Error(text))
  }
}
