/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ════════════════════════════════════════════
      // ═══ COLORS ═══
      // ════════════════════════════════════════════
      colors: {
        // ── Semantic tokens (auto-switch via CSS vars) ──
        'a24-bg':      'var(--a24-bg)',
        'a24-surface': 'var(--a24-surface)',
        'a24-text':    'var(--a24-text)',
        'a24-muted':   'var(--a24-muted)',
        'a24-border':  'var(--a24-border)',
        'a24-accent':  'var(--a24-accent)',

        // ── Backward compat: explicit dark values ──
        // (existing code uses dark:bg-a24-dark-*, still works)
        'a24-dark-bg':      '#0B0F19',
        'a24-dark-surface': '#151921',
        'a24-dark-text':    '#E2E8F0',
        'a24-dark-muted':   '#64748B',
        'a24-dark-border':  '#1E293B',

        // ── Pixelbara accent palette ──
        'px-gold': {
          DEFAULT: '#EAB308',
          light: '#FDE047',
          dark: '#CA8A04',
        },
        'px-terminal': {
          DEFAULT: '#22C55E',
          light: '#4ADE80',
          dark: '#16A34A',
          screen: '#86EFAC',
        },
        'px-fur': {
          DEFAULT: '#8B7355',
          light: '#C9A87C',
          dark: '#6B5344',
        },
        'px-nostril': '#2A1810',
        'px-lens': {
          DEFAULT: '#38BDF8',
          light: '#7DD3FC',
        },

        // ── Functional colors ──
        'neun-success': 'var(--neun-success)',
        'neun-warning': 'var(--neun-warning)',
        'neun-danger':  'var(--neun-danger)',
        'neun-info':    'var(--neun-info)',

        // ── shadcn/ui compat (HSL CSS vars) ──
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card:        { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover:     { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary:     { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent:      { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input:  'hsl(var(--input))',
        ring:   'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },

      // ════════════════════════════════════════════
      // ═══ TYPOGRAPHY ═══
      // ════════════════════════════════════════════
      fontFamily: {
        pixel:   ['var(--font-pixel)', 'monospace'],
        heading: ['var(--font-pixel)', 'var(--font-body)', 'sans-serif'],
        body:    ['var(--font-body)', 'sans-serif'],
        script:  ['var(--font-script)', 'cursive'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Pixel-friendly sizes (multiples of 8)
        'px-xs':   ['0.625rem', { lineHeight: '1rem' }],      // 10px
        'px-sm':   ['0.6875rem', { lineHeight: '1.125rem' }], // 11px (nav labels)
        'px-base': ['0.75rem', { lineHeight: '1.25rem' }],    // 12px
        'px-lg':   ['0.875rem', { lineHeight: '1.5rem' }],    // 14px
        'px-xl':   ['1rem', { lineHeight: '1.75rem' }],       // 16px
        'px-2xl':  ['1.25rem', { lineHeight: '2rem' }],       // 20px
        'px-3xl':  ['1.5rem', { lineHeight: '2.25rem' }],     // 24px
        'px-hero': ['2.5rem', { lineHeight: '3rem' }],        // 40px (hero headline)
      },

      // ════════════════════════════════════════════
      // ═══ SPACING ═══
      // ════════════════════════════════════════════
      spacing: {
        // Design system spacing scale (8px grid)
        '4.5': '1.125rem',  // 18px
        '13':  '3.25rem',   // 52px
        '15':  '3.75rem',   // 60px
        '18':  '4.5rem',    // 72px
        '22':  '5.5rem',    // 88px
        '26':  '6.5rem',    // 104px
        '30':  '7.5rem',    // 120px
        // Section spacing
        'section-sm': '3rem',    // 48px
        'section':    '5rem',    // 80px
        'section-lg': '7.5rem',  // 120px
      },

      // ════════════════════════════════════════════
      // ═══ LAYOUT ═══
      // ════════════════════════════════════════════
      maxWidth: {
        'content':  '48rem',   // 768px (articles, text)
        'wide':     '72rem',   // 1152px (cards grid)
        'full-w':   '80rem',   // 1280px (max page width)
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      // ════════════════════════════════════════════
      // ═══ ANIMATION ═══
      // ════════════════════════════════════════════
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'scroll-left': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          '0%':   { opacity: '1' },
          '100%': { opacity: '0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(34, 197, 94, 0)' },
        },
        'glow-green': {
          '0%, 100%': { boxShadow: '0 0 20px 4px rgba(34, 197, 94, 0.2)' },
          '50%':      { boxShadow: '0 0 30px 8px rgba(34, 197, 94, 0.4)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'pixel-blink': {
          '0%, 90%, 100%': { opacity: '1' },
          '95%':           { opacity: '0.3' },
        },
      },
      animation: {
        shimmer:        'shimmer 3s ease-in-out infinite',
        'scroll-left':  'scroll-left 30s linear infinite',
        'fade-in':      'fade-in 0.3s ease-out',
        'fade-out':     'fade-out 0.2s ease-in',
        blink:          'blink 1s step-end infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'pulse-green':  'pulse-green 2s ease-in-out infinite',
        'glow-green':   'glow-green 3s ease-in-out infinite',
        'float':        'float 3s ease-in-out infinite',
        'pixel-blink':  'pixel-blink 4s ease-in-out infinite',
      },

      // ════════════════════════════════════════════
      // ═══ BOX SHADOW ═══
      // ════════════════════════════════════════════
      boxShadow: {
        'green-sm': '0 0 8px 2px rgba(34, 197, 94, 0.2)',
        'green-md': '0 0 16px 4px rgba(34, 197, 94, 0.25)',
        'green-lg': '0 0 24px 6px rgba(34, 197, 94, 0.3)',
        'green-glow': '0 0 20px 4px rgba(34, 197, 94, 0.4)',
        'card-hover': '0 12px 24px -8px rgba(0, 0, 0, 0.15)',
        'card-hover-dark': '0 12px 24px -8px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
