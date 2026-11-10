import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/", "jest-stare/", "coverage/"] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: globals.node },
    rules: {
      "no-unused-vars": ["error", { args: "after-used", argsIgnorePattern: "^_", caughtErrors: "none" }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-var": "error",
      "prefer-const": "error",
    },
  },
];
