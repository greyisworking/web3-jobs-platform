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
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// ── THE SUBSTANCE — exact movie colors ──
  			'sub-sky': '#89CFF0',        // egg poster sky blue
  			'sub-hotpink': '#FF5DA2',    // pink studio scenes
  			'sub-cream': '#FFFEF0',      // locker room cream
  			'sub-offwhite': '#F5F5F5',   // tile walls off-white
  			'sub-coral': '#F4A4A4',      // lips coral pink
  			'sub-red': '#E63B2E',        // red doors/floors
  			'sub-deepred': '#8B0A1A',    // red poster deep red
  			'sub-vial': '#BFFF00',       // neon vial yellow-green
  			'sub-charcoal': '#2D2D2D',   // clinical dark
  			'sub-muted': '#6B7280',      // gray muted text
  			'sub-border': '#E0E0E0',     // clinical border
  			'sub-border-dark': '#3a3a3a',
  			// ── Tile card backgrounds (direct movie colors) ──
  			'tile-1': '#89CFF0',         // sky blue
  			'tile-2': '#FF5DA2',         // hot pink
  			'tile-3': '#FFFEF0',         // cream
  			'tile-4': '#F4A4A4',         // coral
  			'tile-5': '#F5F5F5',         // off white
  			// ── Tile card backgrounds (dark mode — deep muted versions) ──
  			'tile-1-dark': '#1a2e3d',
  			'tile-2-dark': '#3d1a2a',
  			'tile-3-dark': '#2a2a1e',
  			'tile-4-dark': '#3d2424',
  			'tile-5-dark': '#252525',
  			// ── Dark mode surfaces ──
  			'sub-dark-bg': '#0f0f0f',
  			'sub-dark-surface': '#1a1a1a',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)', 'sans-serif'],
  			body: ['var(--font-body)', 'sans-serif'],
  		},
  		keyframes: {
  			shimmer: {
  				'0%': { backgroundPosition: '-200% 0' },
  				'100%': { backgroundPosition: '200% 0' }
  			}
  		},
  		animation: {
  			shimmer: 'shimmer 3s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
