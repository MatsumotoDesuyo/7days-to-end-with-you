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
    contentBase: path.join(__dirname, 'public'),
    port: 3000,
    host: '0.0.0.0',
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
      },
    },
    inline: true,
    hot: true,
  },
  devtool: 'inline-source-map',
  performance: {
    hints: false,
  },
});
