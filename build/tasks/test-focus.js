'use strict'

import gulp from 'gulp'
import nodemon from 'gulp-nodemon'
import gulpif from 'gulp-if'
import uglify from 'gulp-uglify'
import minimist from 'minimist'

var options = minimist(process.argv.slice(3));

gulp.task('test-focus', ['watch'], () => {
    nodemon({ exec: `node_modules/lab/bin/lab -a code -t 100 -v ${options.file} -g ${options.focus}`,
    ext: 'js',
    ignore: ['test/cassettes/*']
  }).on('start', function () {
    console.log(`Starting testing file ${options.file}`)
  })
})
