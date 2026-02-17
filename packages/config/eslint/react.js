/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "./base.js",
    "plugin:react-hooks/recommended",
  ],
  plugins: ["react-refresh"],
  env: {
    browser: true,
    es2022: true,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
  },
  ignorePatterns: ["node_modules/", "dist/", "coverage/"],
};
