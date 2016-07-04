'use strict'

require('dotenv').load()

import gulp from 'gulp'
import nodemon from 'gulp-nodemon'

gulp.task('test', ['watch'], () => {
  nodemon({ exec: 'npm test',
    ext: 'js',
    ignore: ['test/cassettes/*']
  }).on('start', function () {
    console.log('Starting testing gulp task!')
  })
})
