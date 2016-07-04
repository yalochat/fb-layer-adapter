'use strict'

import gulp from 'gulp'
import watch from 'gulp-watch'
import jshint from 'gulp-jshint'
import stylish from 'jshint-stylish'

const src = [
  'handlers/**/*.js',
  'lib/**/*.js',
  'models/**/*.js',
  'routes/**/*.js',
  'services/**/*.js',
  'test/**/*.js',
  'fixtures/**/*.js'
]

gulp.task('jshint', () => {
  return watch(src)
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
})
