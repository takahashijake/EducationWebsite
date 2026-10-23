import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "public/python/**",
    "out/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "LLM-Town/**",
    "next-env.d.ts",
    "public/cpp/runtime/**",
    "public/cpp/wasi.js",
  ]),
]);
