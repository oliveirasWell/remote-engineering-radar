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
              target: "./lib/db",
              from: "./components",
              message: "lib/db/ must not depend on the UI layer.",
            },
            {
              target: "./lib/db",
              from: "./app",
              message: "lib/db/ must not depend on the app layer.",
            },
            {
              target: "./components",
              from: "./lib/db",
              message:
                "components/ must not import the database client. Read data in server components or dedicated data modules.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/db/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react/*", "react-dom", "react-dom/*"],
              message: "lib/db/ is framework-free.",
            },
            {
              group: ["next", "next/*"],
              message: "lib/db/ is framework-free aside from server-only.",
            },
            {
              group: ["@/components/*", "@/app/*"],
              message: "lib/db/ must not depend on UI or app layers.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;
