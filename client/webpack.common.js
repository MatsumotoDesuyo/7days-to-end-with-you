const path = require('path');

module.exports = {
  target: 'web',
  output: {
    path: path.join(__dirname, 'dist'),
    library: {
      type: 'umd',
    },
    // libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: ['ts-loader'],
      },
      {
        test: /\.(css|s[ac]ss)$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  plugins: [],
};
