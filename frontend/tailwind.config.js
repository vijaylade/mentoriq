/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        figtree: ['Figtree', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {},
      boxShadow: {
        'clay-card': '10px 10px 30px rgba(0,0,0,0.05), inset 4px 4px 12px rgba(255,255,255,1), inset -4px -4px 12px rgba(0,0,0,0.03)',
        'clay-card-hover': '15px 15px 40px rgba(0,0,0,0.08), inset 4px 4px 12px rgba(255,255,255,1), inset -4px -4px 12px rgba(0,0,0,0.03)',
        'clay-button': '6px 6px 16px rgba(37,99,235,0.25), inset 2px 2px 8px rgba(255,255,255,0.3), inset -2px -2px 8px rgba(0,0,0,0.2)',
        'clay-button-light': '6px 6px 16px rgba(0,0,0,0.04), inset 2px 2px 8px rgba(255,255,255,1), inset -2px -2px 8px rgba(0,0,0,0.02)',
        'clay-recessed': 'inset 6px 6px 12px rgba(0,0,0,0.04), inset -6px -6px 12px rgba(255,255,255,0.9)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}