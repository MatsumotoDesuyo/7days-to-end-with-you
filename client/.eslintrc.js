module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'airbnb',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint', 'prettier'],
  rules: {
    'no-use-before-define': 'off',
    '@typescript-eslint/no-unused-vars': ['warn'],
    'react/jsx-filename-extension': ['error', { extensions: ['.jsx', '.tsx'] }],
    'import/extensions': [
      'error',
      { extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'] },
    ],
    'react/prop-types': 'off',
    'spaced-comment': ['off', 'always', { markers: ['/ <reference'] }],
    'prettier/prettier': 'error',
    'react/prefer-stateless-function': ['warn'],
    'no-unused-vars': ['warn'],
    'max-classes-per-file': ['warn'],
    'class-methods-use-this': ['warn'],
    'no-useless-constructor': 'warn',
    'no-empty-function': 'warn',
    'no-plusplus': 'off',
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          'src/**/*.test.ts',
          'src/**/*.test.tsx',
          'src/**/*.test.js',
          'src/**/*.test.jsx',
          'webpack.*.js',
        ],
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
