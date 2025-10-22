/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Backgrounds
        'bg-primary': 'rgb(var(--color-bg-primary) / <alpha-value>)',
        'bg-secondary': 'rgb(var(--color-bg-secondary) / <alpha-value>)',
        'bg-tertiary': 'rgb(var(--color-bg-tertiary) / <alpha-value>)',
        'bg-elevated': 'rgb(var(--color-bg-elevated) / <alpha-value>)',
        'bg-hover': 'rgb(var(--color-bg-hover) / <alpha-value>)',
        'bg-active': 'rgb(var(--color-bg-active) / <alpha-value>)',

        // Textos
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--color-text-tertiary) / <alpha-value>)',
        'text-disabled': 'rgb(var(--color-text-disabled) / <alpha-value>)',
        'text-placeholder': 'rgb(var(--color-text-placeholder) / <alpha-value>)',

        // Bordes
        'border-primary': 'rgb(var(--color-border-primary) / <alpha-value>)',
        'border-secondary': 'rgb(var(--color-border-secondary) / <alpha-value>)',
        'border-hover': 'rgb(var(--color-border-hover) / <alpha-value>)',
        'border-focus': 'rgb(var(--color-border-focus) / <alpha-value>)',

        // Acentos
        'accent-1': 'rgb(var(--color-accent-1) / <alpha-value>)',
        'accent-2': 'rgb(var(--color-accent-2) / <alpha-value>)',
        'accent-3': 'rgb(var(--color-accent-3) / <alpha-value>)',
        'danger-1': 'rgb(var(--color-danger-1) / <alpha-value>)',
        'danger-2': 'rgb(var(--color-danger-2) / <alpha-value>)',

        // Ring
        'ring': 'rgb(var(--color-ring) / <alpha-value>)',
        'ring-offset': 'rgb(var(--color-ring-offset) / <alpha-value>)',
      },
      keyframes: {
        aurora: {
          '0%': { transform: 'translate3d(-10%, -10%, 0) scale(1)' },
          '50%': { transform: 'translate3d(12%, 8%, 0) scale(1.1)' },
          '100%': { transform: 'translate3d(-8%, -12%, 0) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        aurora: 'aurora 18s ease-in-out infinite',
        float: 'float 9s ease-in-out infinite',
      },
      boxShadow: {
        card: '0 24px 65px rgba(var(--shadow-card-rgb), 0.45)',
        'hover-accent': '0 35px 90px rgba(var(--shadow-hover-rgb), 0.25)',
      },
    },
  },
  plugins: [],
};
