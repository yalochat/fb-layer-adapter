'use strict'

import gulp from 'gulp'

// this task wil watch for changes
// to js, html, and css files and call the
// reportChange method. Also, by depending on the
gulp.task('watch', () => {
  gulp.watch('.', ['build']).on('change', (event) => {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...')
  })
})
