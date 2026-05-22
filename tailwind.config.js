/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'em-blue': '#1a3a6b',
        'em-blue-dark': '#122a52',
        'em-orange': '#f5a623',
      },
    },
  },
  plugins: [],
};
