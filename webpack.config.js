const webpack = require('webpack');
const path = require('path');

const config = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  resolve: {
    fallback: { "path": require.resolve("path-browserify") }
  },
  devServer: {
    contentBase: './dist',
    // no publicPath
    port: 9000,
  }
};

module.exports = config;