'use strict'

const Promise = require('bluebird')

const externals = {}

externals.errorPromise = (text) => {
  return Promise.reject(new Error(text))
}

externals.dot = (obj, tgt, path) => {
  tgt = tgt || {}
  path = path || []
  Object.keys(obj).forEach(function (key) {
    if (Object(obj[key]) === obj[key] && (Object.prototype.toString.call(obj[key]) === '[object Object]') || Object.prototype.toString.call(obj[key]) === '[object Array]') {
      return externals.dot(obj[key], tgt, path.concat(key))
    } else {
      tgt[path.concat(key).join('.')] = obj[key]
    }
  })
  return tgt
}

module.exports = externals
