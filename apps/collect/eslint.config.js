const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["node_modules/**", "node_modules_broken*/**", ".expo/**", "android/**", "ios/**", "dist/**"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
