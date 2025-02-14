import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  // Configuration for CommonJS and ES Modules
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "module", // Use 'module' if your app uses ES Modules
      globals: {
        ...globals.browser,
        ...globals.node,
        Notyf: "readonly",
        Chart: "readonly",
        bootstrap: "readonly",
      },
    },
  },

  // Recommended configurations
  pluginJs.configs.recommended,

  // Custom rules
  {
    rules: {
      "no-template-curly-in-string": "error",
      camelcase: ["error", { ignoreGlobals: true }],
      "max-depth": ["error", 6], // Updated to allow 6 levels of nesting
      "max-nested-callbacks": ["error", { max: 5 }],
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "sort-imports": "error",
      "no-loop-func": "warn",
    },
  },
];
