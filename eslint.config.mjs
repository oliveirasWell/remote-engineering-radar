import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      "import/resolver": { typescript: { project: "./tsconfig.json" } },
    },
    rules: {
      curly: ['error', 'all'],
      'import/first': 'error',
      'react/destructuring-assignment': ['error', 'always'],
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./components",
              from: "./lib/weather",
              except: ["./types.ts", "./constants.ts", "./client", "./temperature"],
              message:
                "components/ may import lib/weather types, constants, client, and temperature helpers only. The openweather adapter and schemas are server-side detail.",
            },
            {
              target: "./app/components",
              from: "./lib/weather",
              except: ["./types.ts", "./constants.ts", "./client", "./temperature"],
              message:
                "app/components/ may import lib/weather types, constants, client, and temperature helpers only. The openweather adapter and schemas are server-side detail.",
            },
            {
              target: "./app/useWeatherSearch",
              from: "./lib/weather",
              except: ["./types.ts", "./constants.ts", "./client", "./temperature"],
              message:
                "app/useWeatherSearch may import lib/weather types, constants, client, and temperature helpers only.",
            },
            {
              target: "./lib/weather",
              from: "./components",
              message: "lib/weather/ must not depend on the UI layer.",
            },
            {
              target: "./lib/weather",
              from: "./app",
              message: "lib/weather/ must not depend on the app layer.",
            },
            {
              target: "./components/ui",
              from: "./app/components",
              message:
                "components/ui/ takes primitive props and knows nothing about the weather domain.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/weather/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["react", "react/*", "react-dom", "react-dom/*"], message: "lib/weather/ is framework-free." },
            { group: ["next", "next/*"], message: "lib/weather/ is framework-free." },
            { group: ["@/components/*", "@/app/*"], message: "lib/weather/ must not depend on UI or app layers." },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;
