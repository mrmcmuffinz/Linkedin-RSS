// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default [
  // Apply recommended rules
  js.configs.recommended,
  
  // Prettier config to avoid conflicts
  prettierConfig,
  
  // Main configuration
  {
    files: ["src/**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",  // For import/export
      globals: {
        ...globals.node,
      }
    },
    rules: {
      // Custom rules
      "no-unused-vars": "warn",
      "no-console": "off",  // console is fine in actions
    }
  },
  
  // Config files
  {
    files: ["*.config.js", "*.config.mjs"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.node,
      }
    }
  },
  
  // Ignore patterns
  {
    ignores: ["dist/", "node_modules/", "coverage/"]
  }
];
