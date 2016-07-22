/* eslint-env node */
'use strict'

const path = require('path')

const calculateAssetMap = (assets) => {
  return assets.reduce((assetMap, asset) => {
    const baseName = asset.match(/^(.*)-.+\.js$/)[1]
    assetMap[`${baseName}.js`] = `/assets/javascripts/${asset}`
    return assetMap
  }, {})
}

module.exports = {
  entry: './index.js',
  output: {
    path: path.join(__dirname, 'public', 'assets', 'javascripts'),
    filename: 'application-[hash].js'
  },
  resolve: {
    root: [
      path.resolve('./node_modules'),
      path.resolve('./app/components')
    ],
    alias: {
      jquery: 'jquery/src/jquery'
    }
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
          path.join(__dirname, 'public', 'assets', 'manifests', 'javascript.json'),
          JSON.stringify(calculateAssetMap(assets)))
      })
    }
  ]
}
