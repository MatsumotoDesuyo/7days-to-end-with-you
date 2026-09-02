import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'public/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.jest },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['warn'],
      // React.Component<{}, State> 等の既存コードを許容
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    // webpack / jest 設定は CommonJS
    files: ['**/*.js', '**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  }
);
