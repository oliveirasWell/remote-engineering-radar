import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import functional from 'eslint-plugin-functional';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';

/**
 * Imperative control flow we do not want back. A bounded `for (let page = 1;
 * page <= max; ...)` in a paginated fetcher stays legal; an unbounded one
 * never is. Index loops over an array are caught by `unicorn/no-for-loop`.
 */
const BANNED_CONTROL_FLOW = [
  {
    selector: 'ForStatement[test=null]',
    message:
      'No `for (;;)`. Give the loop a bound, or use a named recursive step for keyset pagination.',
  },
  {
    selector: 'ForInStatement',
    message:
      'No for...in. Use Object.keys/entries, which skip the prototype chain.',
  },
  {
    selector: 'DoWhileStatement',
    message: 'No do...while. Use an array operation or a named recursive step.',
  },
  {
    selector: 'LabeledStatement',
    message: 'No labels. Extract a function and return from it.',
  },
  {
    selector: 'WithStatement',
    message: 'No with.',
  },
];

/**
 * A data loop is a transformation, and map/filter/reduce/flatMap/forEach say
 * so in one expression. `for...of` stays legal when it awaits, because that
 * is how sequential work is written and a promise-chaining reduce is worse.
 */
const NO_DATA_LOOPS = {
  selector: 'ForOfStatement:not(:has(AwaitExpression))',
  message:
    'Use map/filter/reduce/flatMap/forEach for a data loop. Keep for...of for sequential awaits.',
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  sonarjs.configs.recommended,
  {
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.json' } },
    },
    plugins: { unicorn, functional },
    rules: {
      // Braces and explicit blocks: no single-statement if/else/for bodies.
      curly: ['error', 'all'],
      'no-lonely-if': 'error',
      'no-else-return': ['error', { allowElseIf: false }],

      // Control flow.
      'no-restricted-syntax': ['error', ...BANNED_CONTROL_FLOW, NO_DATA_LOOPS],
      'unicorn/no-for-loop': 'error',
      'functional/no-let': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/prefer-at': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/no-lonely-if': 'error',
      'unicorn/no-negated-condition': 'error',
      'unicorn/no-useless-undefined': ['error', { checkArguments: false }],
      'unicorn/prefer-ternary': 'error',
      'unicorn/throw-new-error': 'error',
      'unicorn/no-instanceof-builtins': 'error',
      'unicorn/prefer-string-replace-all': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/explicit-length-check': 'error',

      // Functional style: values are not reassigned or mutated in place.
      'prefer-const': 'error',
      'no-var': 'error',
      'no-param-reassign': ['error', { props: true }],
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false }],
      'arrow-body-style': ['error', 'as-needed'],
      'sonarjs/prefer-immediate-return': 'error',
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      // Sonar, tuned. The complexity ceiling is the worst function we have
      // today: it blocks new complexity and ratchets down as those are split
      // up. Nested template literals and inline unions are how this codebase
      // writes i18n and route params.
      // Complexity, pinned at today's worst function: new complexity is
      // blocked and the ceiling ratchets down as those are split up.
      complexity: ['error', 19],
      'max-depth': ['error', 3],
      'max-nested-callbacks': ['error', 3],
      'max-statements': ['error', 50],
      'sonarjs/cognitive-complexity': ['error', 21],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-nested-template-literals': 'off',
      'sonarjs/use-type-alias': 'off',

      'import/first': 'error',
      'react/destructuring-assignment': ['error', 'always'],
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './lib/db',
              from: './components',
              message: 'lib/db/ must not depend on the UI layer.',
            },
            {
              target: './lib/db',
              from: './app',
              message: 'lib/db/ must not depend on the app layer.',
            },
            {
              target: './components',
              from: './lib/db',
              message:
                'components/ must not import the database client. Read data in server components or dedicated data modules.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['lib/db/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*'],
              message: 'lib/db/ is framework-free.',
            },
            {
              group: ['next', 'next/*'],
              message: 'lib/db/ is framework-free aside from server-only.',
            },
            {
              group: ['@/components/*', '@/app/*'],
              message: 'lib/db/ must not depend on UI or app layers.',
            },
          ],
        },
      ],
    },
  },
  {
    // Debt, not exemption: these four patterns can backtrack on a long title.
    // They run on titles, not descriptions, so the blast radius is small, but
    // each one still needs rewriting with its normalizer's tests.
    files: [
      'lib/jobs/countries.ts',
      'lib/sources/frontendbr/normalize-frontendbr-issue.ts',
      'lib/sources/hackernews/normalize-hackernews-comment.ts',
    ],
    rules: { 'sonarjs/super-linear-regex': 'off' },
  },
  {
    // Scripts are CLIs: their output is the product.
    files: ['scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    // Security hotspots in tests are fixtures, not findings.
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-hardcoded-ip': 'off',
      'sonarjs/no-hardcoded-passwords': 'off',
      'sonarjs/no-clear-text-protocols': 'off',
      'sonarjs/no-os-command-from-path': 'off',
      'sonarjs/no-regex-spaces': 'off',
      'sonarjs/code-eval': 'off',
      'sonarjs/hooks-before-test-cases': 'off',
      'functional/no-let': 'off',
      'max-nested-callbacks': 'off',
      'max-statements': 'off',
      'no-restricted-syntax': ['error', ...BANNED_CONTROL_FLOW],
    },
  },
  globalIgnores([
    '.next/**',
    'brag-output/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
  ]),
]);

export default eslintConfig;
