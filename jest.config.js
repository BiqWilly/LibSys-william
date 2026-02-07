// jest.config.js
module.exports = {
  testMatch: ["**/test/william*.test.js"], // just match all tests in /test folder
  setupFiles: ["<rootDir>/jest.setup.js"],
  collectCoverage: true,
  collectCoverageFrom: [
    "utils/williamUtil.js",
    "resource-mgmt/utils/DeleteResourceUtil.js",
    "index.js",
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
