var Confidence = require('confidence');

var config = {
    '$meta': 'FB Messenger api ',
    'app': {
        'env':  process.env.APP_ENV || 'local',
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
        }
    },
    'logger': {
        'options': {
            console: process.env.LOGGER_DEBUG!= '' ? process.env.LOGGER_DEBUG: true
        }
    }
};

var store = new Confidence.Store(config);


exports.get = function (key, criteria) {
    if(!criteria) criteria = {};
    return store.get(key, criteria);
};


exports.meta = function (key, criteria) {
    if(!criteria) criteria = {};
    return store.meta(key, criteria);
};
