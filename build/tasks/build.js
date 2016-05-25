'use strict'

import gulp from 'gulp'

gulp.task('build', ['build-docker'], (callback) => {

  console.log('buid successful');
  return callback();
});
