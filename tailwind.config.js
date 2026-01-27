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
  			// Web3 색상 팔레트
  			web3: {
  				'deep-navy': '#0a0f1e',
  				midnight: '#111827',
  				charcoal: '#1f2937',
  				'ice-white': '#f8fafc',
  				frost: '#e2e8f0',
  				'ice-blue': '#38bdf8',
  				'electric-blue': '#3b82f6',
  				'neon-cyan': '#22d3ee',
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		// 극세선 테두리 (0.5px)
  		borderWidth: {
  			hairline: '0.5px'
  		},
  		// 추가 블러 단계
  		backdropBlur: {
  			xs: '2px',
  			'2xl': '40px'
  		},
  		// 글로우/그림자 효과
  		boxShadow: {
  			glow: '0 0 15px rgba(59, 130, 246, 0.3)',
  			'glow-lg': '0 0 30px rgba(59, 130, 246, 0.4)',
  			'glow-cyan': '0 0 15px rgba(34, 211, 238, 0.3)',
  			'glow-purple': '0 0 15px rgba(168, 85, 247, 0.3)',
  			glass: '0 8px 32px rgba(0, 0, 0, 0.1)',
  		},
  		// 쉬머 애니메이션
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
