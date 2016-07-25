/* eslint-env node */
'use strict'

const path = require('path')
const fs = require('fs')
const url = require('url')

const calculateAssetMap = (assets) => {
  return assets.reduce((assetMap, asset) => {
    const baseName = asset.match(/^(.*)-.+\.js$/)[1]
    assetMap[`${baseName}.js`] = buildUrl(baseUrl, asset)
    return assetMap
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

const readConfig = (configName) => {
  const file = fs.readFileSync(
    path.join(__dirname, 'package.json')
  )
  const parsedFile = JSON.parse(file)
  return parsedFile[configName]
}

const jsConfig = readConfig('jsConfig')
const baseUrl = url.parse(jsConfig.baseUrl)

module.exports = {
  entry: jsConfig.entryPoints,
  output: {
    path: path.join(__dirname, jsConfig.target.directory),
    filename: jsConfig.target.filename
  },
  resolve: {
    root: jsConfig.includePaths.map((p) => path.resolve(p)),
    alias: jsConfig.alias
  },
  module: {
    loaders: [{
      loader: 'babel-loader',
      query: {
        presets: ['es2015'],
        cacheDirectory: true
      }
    }]
  },
  plugins: [
    function () {
      this.plugin('done', (stats) => {
        const assets = Object.keys(stats.compilation.assets)
        require('fs').writeFileSync(
          path.join(__dirname, jsConfig.manifest),
          JSON.stringify(calculateAssetMap(assets)))
      })
    }
  ]
}
