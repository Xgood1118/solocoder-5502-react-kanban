/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        backlog: '#94a3b8',
        progress: '#3b82f6',
        review: '#a855f7',
        blocked: '#ef4444',
        done: '#22c55e',
      },
    },
  },
  plugins: [],
}
