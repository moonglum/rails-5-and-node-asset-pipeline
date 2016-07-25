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
const url = require('url')

const readConfig = (configName) => {
  const file = fs.readFileSync(
    path.join(__dirname, 'package.json')
  )
  const parsedFile = JSON.parse(file)
  return parsedFile[configName]
}

const calculateAssetMap = (hashes) => {
  return Object.keys(hashes).reduce((mapping, fullPath) => {
    const parsedPath = path.parse(fullPath)
    const hash = hashes[fullPath]
    mapping[parsedPath.base] = `${parsedPath.name}-${hash}${parsedPath.ext}`
    return mapping
  }, {})
}

const buildUrl = (baseUrl, asset) => {
  return url.format({
    protocol: baseUrl.protocol,
    auth: baseUrl.auth,
    host: baseUrl.host,
    pathname: `${baseUrl.pathname}/${asset}`,
    search: baseUrl.search,
    hash: baseUrl.hash
  })
}

const addPathToAssetMap = (type, assetMap) => {
  return Object.keys(assetMap).reduce((mapping, origin) => {
    const destination = assetMap[origin]
    mapping[origin] = buildUrl(baseUrls[type], destination)
    return mapping
  }, {})
}

const renameFilesAccordingToMap = (assetMap, path) => {
  path.basename = assetMap[`${path.basename}${path.extname}`]
  path.extname = ''
  return path
}

const writeAssetMap = (assetMap, type) => {
  fs.writeFileSync(
    manifests[type],
    JSON.stringify(assetMap))
}

const readAssetMap = (type, done) => {
  fs.readFile(
    manifests[type],
    (err, file) => {
      if (err) {
        done(err)
      } else {
        done(null, JSON.parse(file))
      }
    }
  )
}

const cssConfig = readConfig('cssConfig')
const imagesConfig = readConfig('imagesConfig')

const baseUrls = {
  stylesheets: url.parse(cssConfig.baseUrl),
  images: url.parse(imagesConfig.baseUrl)
}

const manifests = {
  stylesheets: cssConfig.manifest,
  images: imagesConfig.manifest
}

const sassOptions = {
  includePaths: cssConfig.includePaths,

  functions: {
    'asset-url($file)': (file, done) => {
      readAssetMap('images', (err, assetMap) => {
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
  .on('end', () => writeAssetMap(addPathToAssetMap('stylesheets', calculateAssetMap(hasher.hashes)), 'stylesheets'))
)

gulp.task('watch-images', () => {
  gulp.watch(imagesConfig.sources, ['compile-images'])
})

gulp.task('compile-images', () => gulp
  .src('app/assets/images/*')
  .pipe(hasher())
  .pipe(rename((path) => renameFilesAccordingToMap(calculateAssetMap(hasher.hashes), path)))
  .pipe(gulp.dest(imagesConfig.target.directory))
  .on('end', () => writeAssetMap(addPathToAssetMap('images', calculateAssetMap(hasher.hashes)), 'images'))
)
