'use strict'

require('dotenv').load()

import gulp from 'gulp'
import nodemon from 'gulp-nodemon'

gulp.task('serve', ['watch'], () => {
  nodemon({ script: 'server',
    ext: 'html js',
  }).on('start', () => {
    console.log('started!')
  })
})
