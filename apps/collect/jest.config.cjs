module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/lib/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.ts$": "<rootDir>/jest-ts-transform.cjs",
  },
};
