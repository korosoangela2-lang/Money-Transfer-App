module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/testSetup.js"],
  moduleFileExtensions: ["js", "jsx"],
  testMatch: ["<rootDir>/src/**/*.test.{js,jsx}"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
};
