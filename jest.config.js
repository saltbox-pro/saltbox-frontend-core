const getJestMappersFromTSConfig = require("tsconfig-paths-jest-mapper");
const moduleNameMapper = getJestMappersFromTSConfig();

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/*.test.ts?(x)"],
  transform: {
    "^.+\\.tsx?$": "babel-jest",
  },
  moduleNameMapper: {
    ...moduleNameMapper,
    "\\.(css|scss)$": "identity-obj-proxy",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  collectCoverage: true,
  coverageProvider: "v8",
  coverageDirectory: "coverage",
  // TODO: uncomment when / if the overall coverage become more than 50%-80%
  // collectCoverageFrom: [
  //   "src/**/*.{ts,tsx}",
  //   "!src/**/*.test.{ts,tsx}",
  //   "!src/**/*.d.ts",
  //   "!src/**/index.ts",
  // ],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  clearMocks: true,
};

module.exports = config;
