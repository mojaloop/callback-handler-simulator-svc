'use strict'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pathsToModuleNameMapper } = require('ts-jest')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { compilerOptions } = require('./tsconfig')

module.exports = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: false,
  collectCoverageFrom: ['./src/**/*.ts'],
  coveragePathIgnorePatterns : [
    '/node_modules/',
    '<rootDir>/src/local-packages/utils/index.ts'
  ],
  coverageReporters: ['json', 'lcov', 'text'],
  clearMocks: false,
  coverageThreshold: {
    global: {
      statements: 80,
      functions: 80,
      branches: 80,
      lines: 80
    }
  },
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/'
  }),
  reporters: ['jest-junit', 'default']
}
