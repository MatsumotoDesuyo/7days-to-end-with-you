const { merge } = require('webpack-merge');
const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'production',
  entry: './src/exports.ts',
  output: {
    filename: 'exports.js',
  },
  externals: {
    react: 'react',
    'react-dom': 'react-dom',
    'react-router-dom': 'react-router-dom',
  },
  performance: {
    hints: 'warning',
  },
});
