import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ─── Typography ────────────────────────────────
      fontFamily: {
        arabic: ['var(--font-ibm-plex-arabic)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '1.33', fontWeight: '700' }],
        h1: ['24px', { lineHeight: '1.33', fontWeight: '700' }],
        h2: ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '1.44', fontWeight: '600' }],
        body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['14px', { lineHeight: '1.43', fontWeight: '400' }],
        micro: ['12px', { lineHeight: '1.5', fontWeight: '400' }],
      },

      // ─── Spacing (4px base grid) ──────────────────
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },

      // ─── Border Radius ────────────────────────────
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        button: '6px',
        card: '12px',
        input: '6px',
        pill: '9999px',
      },

      // ─── Colors ───────────────────────────────────
      colors: {
        // Beitco brand palette (from DESIGN.md)
        beitco: {
          blue: {
            DEFAULT: '#1A56DB',
            hover: '#1E40AF',
            light: '#DBEAFE',
          },
          green: {
            DEFAULT: '#059669',
            hover: '#047857',
            light: '#D1FAE5',
          },
          gold: {
            DEFAULT: '#F59E0B',
            hover: '#D97706',
            light: '#FEF3C7',
          },
          red: {
            DEFAULT: '#DC2626',
            light: '#FEE2E2',
          },
        },
        // shadcn/ui CSS variable colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: 'hsl(var(--surface))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },

      // ─── Shadows (DESIGN.md 4-level warm system) ─────
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.1)',
        elevated: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        dialog: '0 8px 24px rgba(0,0,0,0.12), 0 16px 48px rgba(0,0,0,0.08)',
        fab: '0 12px 32px rgba(0,0,0,0.16), 0 24px 64px rgba(0,0,0,0.1)',
      },

      // ─── Animations ───────────────────────────────
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'heart-pop': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-in',
        'slide-up': 'slide-up 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'heart-pop': 'heart-pop 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
