'use strict'

import gulp from 'gulp'
import { exec } from 'child_process'

const IMAGE_TAG = process.env.DOCKER_IMAGE_TAG || 'ottogiron/hapiseed'

gulp.task('build-docker', (callback) => {
  let dockerBuild = exec('docker build --no-cache -f docker/Dockerfile -t '+ IMAGE_TAG +' .', (error, stout, stderr) => {

    return callback(error)
  })

  dockerBuild.stdout.on('data', (data) => {
    console.log(data.toString())
  })

  dockerBuild.stderr.on('data', (data) => {
    console.log(data.toString())
  })
})
