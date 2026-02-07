// jest.config.js
module.exports = {
  testMatch: [
    "<rootDir>/test/william*.test.js",
  ],
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
