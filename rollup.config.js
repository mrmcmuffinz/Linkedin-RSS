// rollup.config.js
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";

export default {
  // Entry point
  input: "src/index.js",
  
  // Output configuration
  output: {
    file: "dist/index.js",
    format: "esm",  // ES modules format
    sourcemap: true,
    banner: "#!/usr/bin/env node",  // Makes it executable
  },
  
  // Plugins
  plugins: [
    // Handle JSON imports
    json(),
    
    // Resolve node_modules
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ["node"],
    }),
    
    // Convert CommonJS to ESM
    commonjs(),
  ],
  
  // Don't mark anything as external - bundle everything
  // GitHub Actions need all dependencies bundled
  external: [],
};
