'use strict'

const Promise = require('bluebird')
const LayerAPI = require('layer-api')
const Logger = require('bucker').createLogger()

const Layer = new LayerAPI({
  token: process.env.LAYER_TOKEN,
  appId: process.env.LAYER_APP_ID
});

const externals = {}

externals.getConversation = (cid) => {
  Logger.info(`Trying to get conversation ${cid} from Layer`)
  return new Promise((resolve, reject) => {

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

externals.sendMessage = (cid, sender, text) => {

  let data = {
    sender: {
      user_id: sender
    },
    parts: [
      {
        body: text,
        mime_type: 'text/plain'
      },
    ],
    notification: {
      text: text,
      sound: 'chime.aiff'
    }
  }

  return new Promise((resolve, reject) => {

    Layer.messages.send(cid, data, (error, response) => {

      if (error) {
        return reject(error)
      }

      let body = response.body
      body.statusCode = response.statusCode

      return resolve(body)
    })
  })
}


module.exports = externals
