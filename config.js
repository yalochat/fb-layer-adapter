var Confidence = require('confidence');

var config = {
  '$meta': 'FB Messenger Layer adapter',
  'app': {
    'env':  process.env.APP_ENV || 'test',
    'fb': {
      'apiURL': {
        $filter: 'env',
        $default: '127.0.0.1',
        local: process.env.APP_FB_URL || 'https://graph.facebook.com/v2.6',
        staging: process.env.APP_FB_URL || 'https://graph.facebook.com/v2.6',
        production: process.env.APP_FB_URL || 'https://graph.facebook.com/v2.6',
        test: process.env.APP_FB_URL || 'https://graph.facebook.com/v2.6'
      },
      'token': process.env.APP_FB_TOKEN
    },
    'redis':{
      host: {
        $filter: 'env',
        $default: '127.0.0.1',
        local: process.env.APP_REDIS_URL || '127.0.0.1',
        staging: process.env.APP_REDIS_URL || '127.0.0.1',
        production: process.env.APP_REDIS_URL || '127.0.0.1',
        test: process.env.APP_REDIS_URL || '127.0.0.1'
      },
      port: {
        $filter: 'env',
        $default: '6379',
        local: process.env.APP_REDIS_PORT || '6379',
        staging: process.env.APP_REDIS_PORT || '6379',
        production: process.env.APP_REDIS_PORT || '6379',
        test: process.env.APP_REDIS_PORT || '6379'
      },
      database: {
        $filter: 'env',
        $default: 'adapter-cache',
        test: 'adapter-cache-test'
      }
    },
    'layer':{
      token: {
        $filter: 'env',
        $default: '7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F',
        local: process.env.LAYER_TOKEN || '7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F',
        test: process.env.LAYER_TOKEN || '7R3ESPh1NGHciYiGladYRaBPlxWLTqeS2n8PlszSVR1TMN7F',
        production: process.env.LAYER_TOKEN,
        staging: process.env.LAYER_TOKEN
      },
      appId: {
        $filter: 'env',
        $default: 'bec9d548-6265-11e5-9a48-0edffe00788f',
        test: process.env.LAYER_APP_ID || 'bec9d548-6265-11e5-9a48-0edffe00788f',
        local: process.env.LAYER_APP_ID || 'bec9d548-6265-11e5-9a48-0edffe00788f',
        stagin: process.env.LAYER_APP_ID,
        production: process.env.LAYER_APP_ID
      }
    }
  },
  'logger': {
    'options': {
      console: process.env.LOGGER_DEBUG!= '' ? process.env.LOGGER_DEBUG: true
    }
  }
};

var store = new Confidence.Store(config)


exports.get = function (key, criteria) {
  if(!criteria) criteria = {env: store.get('/app/env')}
  return store.get(key, criteria)
};


exports.meta = function (key, criteria) {
  if(!criteria) criteria = {}
  return store.meta(key, criteria)
};
