/** @type {import('jest').Config} */
module.exports = {
  // jest-expo is here for withTypescriptMapping, which resolves the "@/" paths
  // from tsconfig. A bare babel-jest config does not.
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts', '<rootDir>/src/**/*.test.ts'],
};
