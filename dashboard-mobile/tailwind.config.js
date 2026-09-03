/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./index.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#33b76d',
        'primary-dark': '#2a9d5c',
        'primary-light': '#e8f8f0',
      },
<<<<<<< Updated upstream
      borderRadius: {
        none: '0px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
        full: '9999px',
      },
      boxShadow: {
        none: '0px 0px 0px 0px rgba(0,0,0,0)',
        sm: '0px 1px 2px 0px rgba(0,0,0,0.05)',
        md: '0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)',
        lg: '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)',
      },
=======
>>>>>>> Stashed changes
    },
  },
  plugins: [],
};
