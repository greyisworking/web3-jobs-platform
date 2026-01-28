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
  			// ── A24 MINIMAL — black/white + one accent ──
  			'a24-bg': '#FAFAFA',
  			'a24-surface': '#FFFFFF',
  			'a24-text': '#1a1a1a',
  			'a24-muted': '#999999',
  			'a24-border': '#e5e5e5',
  			'a24-accent': '#FF5DA2',     // SUBSTANCE hot pink (used sparingly)
  			'a24-accent-dim': '#FF5DA2',
  			// ── Subtle card tints (A24 editorial) ──
  			'card-white': '#FFFFFF',
  			'card-cream': '#FFF9F2',
  			'card-blue': '#F3F8FC',
  			'card-pink': '#FDF3F6',
  			// ── Dark mode ──
  			'a24-dark-bg': '#111111',
  			'a24-dark-surface': '#1a1a1a',
  			'a24-dark-text': '#e5e5e5',
  			'a24-dark-muted': '#666666',
  			'a24-dark-border': '#2a2a2a',
  			// Dark card tints
  			'card-white-dark': '#1a1a1a',
  			'card-cream-dark': '#1c1a17',
  			'card-blue-dark': '#171a1e',
  			'card-pink-dark': '#1c1719',
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
