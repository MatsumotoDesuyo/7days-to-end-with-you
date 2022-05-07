module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'airbnb-base', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'no-use-before-define': 'off',
    '@typescript-eslint/no-unused-vars': ['warn'],
    'import/extensions': [
      'error',
      { extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'] },
    ],
    'spaced-comment': ['off', 'always', { markers: ['/ <reference'] }],
    'prettier/prettier': 'error',
    'no-unused-vars': ['warn'],
    'max-classes-per-file': ['warn'],
    'class-methods-use-this': ['warn'],
    'no-plusplus': 'off',
    'no-useless-constructor': 'warn',
    'no-empty-function': 'warn',
    'import/prefer-default-export': 'off',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
