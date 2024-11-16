// @ts-check

import js from "@eslint/js";
import reactCompiler from "eslint-plugin-react-compiler";
import reactHooks from "eslint-plugin-react-hooks";
import ts from "typescript-eslint";

export default [
  js.configs.recommended,
  ...ts.configs.recommendedTypeChecked,
  {
    ignores: ["rsbuild.config.ts", "*.js"],

    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        projectService: true,
      },
    },
  },
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    plugins: {
      "react-compiler": reactCompiler,
    },
    rules: {
      "react-compiler/react-compiler": "error",
    },
  },
  {
    files: ["src/client/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@server/*"] }] },
      ],
    },
  },
  {
    files: ["src/server/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@client/*"] }] },
      ],
    },
  },
  {
    files: ["src/universal/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@client/*", "@server/*"] }] },
      ],
    },
  },
];
