'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const LayerAPI = require('layer-api')
const Logger = require('bucker').createLogger()

const Config = require('../config')

const Layer = new LayerAPI({
  token: Config.get('/app/layer/token'),
  appId: Config.get('/app/layer/appId')
});

const externals = {}

externals.getConversation = (cid) => {
  Logger.info(`Trying to get conversation ${cid} from Layer`)
  return new Promise((resolve, reject) => {
    // Get conversation from Layer by ID
    Layer.conversations.get(cid, (error, res) => {

      if (error) {
        return reject(error)
      }

      // Get conversation data
      let conversation = res.body

      return resolve(conversation)
    })
  })
}

externals.createConversation = (conversation) => {

  Logger.info(`Trying to create a conversation with participants: ${conversation.participants}`)

  return new Promise((resolve, reject) => {

    // Create conversation in Layer with data
    Layer.conversations.create(conversation, (err, response) => {

      if (err) {
        if (err.status === 409) {
          // Status code is 409 when conversations exists but its metadata has conflict
          return resolve(_.merge(err.body.data, { statusCode: err.status }))
        }

        return reject(err)
      }

      return resolve(_.merge(response.body, { statusCode: response.status }))
    })
  })
}

externals.updateMetadata = (cid, metadata) => {

  Logger.info(`Updating metadata of conversation with id ${cid}`)

  return new Promise((resolve, reject) => {

    Layer.conversations.setMetadataProperties(cid, metadata, (err, res) => {

      if (err) {
        return reject(err)
      }

      return resolve(res)
    })
  })
}

externals.deleteMetadata = (cid, metadata) => {

  Logger.info(`Removing metadata of conversation with id ${cid}`)

  return new Promise((resolve, reject) => {

    Layer.conversations.deleteMetadataProperties(cid, metadata, (err, res) => {

      if (err) {
        return reject(err)
      }

      return resolve(res)
    })
  })
}

externals.sendMessage = (cid, sender, message, contentType) => {

  let data = {
    sender: {
      user_id: sender
    },
    parts: [
      {
        body: message,
        mime_type: contentType
      },
    ]
  }

  return new Promise((resolve, reject) => {

    Layer.messages.send(cid, data, (err, response) => {

      if (err) {
        return reject(err)
      }

      let body = response.body
      body.statusCode = response.statusCode

      return resolve(body)
    })
  })
}


module.exports = externals
