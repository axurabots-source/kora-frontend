/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        bg2: 'var(--bg2)',
        bg3: 'var(--bg3)',
        bg4: 'var(--bg4)',
        border: 'var(--border)',
        border2: 'var(--border2)',
        text: 'var(--text)',
        text2: 'var(--text2)',
        text3: 'var(--text3)',
        green: {
          DEFAULT: 'var(--green)',
          light: 'var(--green-light)',
          bg: 'var(--green-bg)',
        },
        red: {
          DEFAULT: 'var(--red)',
          light: 'var(--red-light)',
          bg: 'var(--red-bg)',
        },
        blue: {
          DEFAULT: 'var(--blue)',
          bg: 'var(--blue-bg)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        elite: 'var(--shadow)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
