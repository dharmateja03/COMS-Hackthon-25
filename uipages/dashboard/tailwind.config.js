/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0a0a0f',
        'dark-card': '#1e293b',
        'teal-glow': '#06b6d4',
        'magenta-glow': '#ec4899',
      },
      boxShadow: {
        'glow-teal': '0 0 20px rgba(6, 182, 212, 0.5)',
        'glow-magenta': '0 0 20px rgba(236, 72, 153, 0.5)',
        'glow-mixed': '0 0 30px rgba(6, 182, 212, 0.3), 0 0 30px rgba(236, 72, 153, 0.3)',
      },
    },
  },
  plugins: [],
}