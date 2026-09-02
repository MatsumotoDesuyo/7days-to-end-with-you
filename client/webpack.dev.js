const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'development',
  entry: './src/index.tsx',
  output: {
    filename: 'index.js',
    publicPath: '/js/',
  },
  devServer: {
    static: path.join(__dirname, 'public'),
    port: 3000,
    host: '0.0.0.0',
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:5001',
      },
    ],
    hot: true,
  },
  devtool: 'inline-source-map',
  performance: {
    hints: false,
  },
});
