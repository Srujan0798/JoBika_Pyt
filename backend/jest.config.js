module.exports = {
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/**/*.js',
    'database/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js'
  ],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true
};
