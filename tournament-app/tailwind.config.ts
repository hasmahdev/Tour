import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          background: 'var(--brand-background)',
          surface: 'var(--brand-surface)',
          border: 'var(--brand-border)',
          hover: 'var(--brand-hover)',
        },
      },
      borderRadius: {
        '20': '20px',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 20px -3px rgba(108, 114, 255, 0.1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
