/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FE7105',
        secondary: '#C66904',
        tertiary: '#E6A505',
        neutralCustom: '#9E6C46', // Tránh trùng với màu neutral mặc định của Tailwind
        culinaryBg: '#FDF1E6',    // Màu nền kem ấm
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}