/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts', '<rootDir>/src/**/*.test.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/\\.expo/',
    '<rootDir>/\\.expo-shared/',
    '<rootDir>/dist/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/build/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/\\.expo/',
    '<rootDir>/dist/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/build/',
  ],
  clearMocks: true,
};
