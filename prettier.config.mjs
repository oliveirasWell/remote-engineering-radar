/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  plugins: ['prettier-plugin-tailwindcss'],
  singleQuote: true,
  tailwindFunctions: ['clsx', 'cva', 'cn'],
  tailwindStylesheet: './app/globals.css',
};

export default config;
