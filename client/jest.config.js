module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testRegex: '(/test/.*|\\.(test|spec))\\.(ts|tsx|js|jsx)$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'ts-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!(xxxx.*?\\.js$))'],
  moduleNameMapper: {
    '\\.(css|less|scss|sss|styl)$': '<rootDir>/node_modules/jest-css-modules',
  },
  collectCoverage: true,
  // docs/test-cases.md §4 のテスト目標 (#13 でゲート化)
  coverageThreshold: {
    global: { statements: 95, lines: 95, functions: 90, branches: 80 },
  },
  coverageDirectory: 'coverage',
  // v8 プロバイダは jest 27 + Node 22 で v8-to-istanbul が非互換のため babel を使用
  coverageProvider: 'babel',
};
