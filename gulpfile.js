/* eslint-env node */
'use strict'

const gulp = require('gulp')
const prefix = require('gulp-autoprefixer')
const sass = require('gulp-sass')
const sourcemaps = require('gulp-sourcemaps')
const rename = require('gulp-rename')
const hasher = require('gulp-hasher')
const path = require('path')
const fs = require('fs')
const SassString = require('node-sass').types.String

const calculateAssetMap = (hashes) => {
  return Object.keys(hashes).reduce((mapping, fullPath) => {
    const parsedPath = path.parse(fullPath)
    const hash = hashes[fullPath]
    mapping[parsedPath.base] = `${parsedPath.name}-${hash}${parsedPath.ext}`
    return mapping
  }, {})
}

const addPathToAssetMap = (type, assetMap) => {
  return Object.keys(assetMap).reduce((mapping, origin) => {
    const destination = assetMap[origin]
    mapping[origin] = `/assets/${type}/${destination}`
    return mapping
  }, {})
}

const renameFilesAccordingToMap = (assetMap, path) => {
  path.basename = assetMap[`${path.basename}${path.extname}`]
  path.extname = ''
  return path
}

const writeAssetMap = (assetMap, filename) => {
  fs.writeFileSync(
    path.join(__dirname, 'public', 'assets', 'manifests', filename),
    JSON.stringify(assetMap))
}

const readAssetMap = (type, done) => {
  fs.readFile(
    path.join(__dirname, 'public', 'assets', 'manifests', `${type}.json`),
    (err, file) => {
      if (err) {
        done(err)
      } else {
        done(null, JSON.parse(file))
      }
    }
  )
}

const cssConfig = {
  entryPoint: 'index.scss',
  sources: [
    'index.scss',
    'app/components/**/*.scss'
  ],
  includePaths: [
    'app/components',
    'node_modules'
  ],
  target: {
    directory: 'public/assets/stylesheets',
    filename: 'application.css'
  },
  prefixes: 'last 2 versions'
}

const sassOptions = {
  includePaths: cssConfig.includePaths,

  functions: {
    'asset-url($file)': (file, done) => {
      readAssetMap('image', (err, assetMap) => {
        if (err) {
          throw err
        }

        const assetName = file.getValue()
        const remappedUrl = new SassString(`url("${assetMap[assetName]}")`)
        done(remappedUrl)
      })
    }
  }
}

gulp.task('watch-css', () => {
  gulp.watch(cssConfig.sources, ['compile-css'])
})

gulp.task('compile-css', () => gulp
  .src(cssConfig.entryPoint)
  .pipe(sourcemaps.init())
  .pipe(sass(sassOptions).on('error', sass.logError))
  .pipe(prefix(cssConfig.prefixes))
  .pipe(rename(cssConfig.target.filename))
  .pipe(hasher())
  .pipe(rename((path) => renameFilesAccordingToMap(calculateAssetMap(hasher.hashes), path)))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest(cssConfig.target.directory))
  .on('end', () => writeAssetMap(addPathToAssetMap('stylesheets', calculateAssetMap(hasher.hashes)), 'stylesheet.json'))
)

const imagesConfig = {
  sources: [
    'app/assets/images'
  ],
  target: {
    directory: 'public/assets/images'
  }
}

gulp.task('watch-images', () => {
  gulp.watch(imagesConfig.sources, ['compile-images'])
})

gulp.task('compile-images', () => gulp
  .src('app/assets/images/*')
  .pipe(hasher())
  .pipe(rename((path) => renameFilesAccordingToMap(calculateAssetMap(hasher.hashes), path)))
  .pipe(gulp.dest(imagesConfig.target.directory))
  .on('end', () => writeAssetMap(addPathToAssetMap('images', calculateAssetMap(hasher.hashes)), 'image.json'))
)
