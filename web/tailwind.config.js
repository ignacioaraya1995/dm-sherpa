/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        // Dark backgrounds
        dark: {
          950: '#09090b',
          900: '#0f0f17',
          800: '#1a1a2e',
          700: '#252538',
          600: '#2e2e42',
        },
        // Glass surfaces
        glass: {
          surface: 'rgba(255,255,255,0.03)',
          'surface-hover': 'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.08)',
          'border-hover': 'rgba(255,255,255,0.15)',
          highlight: 'rgba(255,255,255,0.1)',
        },
        // Accent colors
        accent: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
          glow: 'rgba(99,102,241,0.4)',
          muted: 'rgba(99,102,241,0.15)',
        },
        // Status colors
        success: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
          glow: 'rgba(16,185,129,0.4)',
          muted: 'rgba(16,185,129,0.15)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
          glow: 'rgba(245,158,11,0.4)',
          muted: 'rgba(245,158,11,0.15)',
        },
        danger: {
          DEFAULT: '#ef4444',
          light: '#f87171',
          dark: '#dc2626',
          glow: 'rgba(239,68,68,0.4)',
          muted: 'rgba(239,68,68,0.15)',
        },
        // Data visualization colors
        data: {
          cyan: '#22d3ee',
          'cyan-glow': 'rgba(34,211,238,0.4)',
          violet: '#a78bfa',
          'violet-glow': 'rgba(167,139,250,0.4)',
          pink: '#f472b6',
          'pink-glow': 'rgba(244,114,182,0.4)',
          amber: '#fbbf24',
          'amber-glow': 'rgba(251,191,36,0.4)',
          emerald: '#34d399',
          'emerald-glow': 'rgba(52,211,153,0.4)',
        },
        // Text colors
        text: {
          primary: '#f4f4f5',
          secondary: '#a1a1aa',
          muted: '#71717a',
          disabled: '#52525b',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '104': '26rem',
        '120': '30rem',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(0,0,0,0.2)',
        'glass-sm': '0 2px 8px rgba(0,0,0,0.15)',
        'glass-lg': '0 8px 40px rgba(0,0,0,0.3)',
        'glow-accent': '0 0 20px rgba(99,102,241,0.3)',
        'glow-success': '0 0 20px rgba(16,185,129,0.3)',
        'glow-warning': '0 0 20px rgba(245,158,11,0.3)',
        'glow-danger': '0 0 20px rgba(239,68,68,0.3)',
        'inner-dark': 'inset 0 1px 3px rgba(0,0,0,0.3)',
      },
      backdropBlur: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.2s ease-out',
        'slide-down': 'slide-down 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'gradient-accent': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        'noise': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
      },
    },
  },
  plugins: [],
};
