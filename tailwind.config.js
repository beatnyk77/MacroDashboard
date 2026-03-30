/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
    		colors: {
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			},
    			terminal: {
    				bg: '#0f172a',
    				header: '#1e293b',
    				border: '#334155',
    				gold: '#fbbf24',
    				emerald: '#34d399',
    				rose: '#fb7185',
    				muted: '#94a3b8',
    				blue: '#60a5fa',
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		fontSize: {
    			// 8-step modular scale (base: 0.875rem, ratio: 1.25)
    			'xs': ['0.6875rem', { lineHeight: '1.25' }],      // 11px - step -2
    			'sm': ['0.8125rem', { lineHeight: '1.35' }],     // 13px - step -1
    			'base': ['0.9375rem', { lineHeight: '1.5' }],    // 15px - step 0 (body)
    			'lg': ['1.125rem', { lineHeight: '1.4' }],       // 18px - step 1
    			'xl': ['1.375rem', { lineHeight: '1.3' }],       // 22px - step 2
    			'2xl': ['1.719rem', { lineHeight: '1.25' }],     // 27.5px - step 3
    			'3xl': ['2.148rem', { lineHeight: '1.2' }],      // 34.4px - step 4
    			'4xl': ['2.685rem', { lineHeight: '1.15' }],     // 42.96px - step 5
    		},
    		letterSpacing: {
    			'heading': '-0.02em',
    			'body': '0',
    			'uppercase': '0.1em',
    		},
    		spacing: {
    			// Vertical spacing scale (4px base unit)
    			'0': '0',
    			'1': '0.25rem',   // 4px
    			'2': '0.5rem',    // 8px
    			'3': '0.75rem',   // 12px
    			'4': '1rem',      // 16px
    			'5': '1.25rem',   // 20px
    			'6': '1.5rem',    // 24px
    			'8': '2rem',      // 32px
    			'10': '2.5rem',   // 40px
    			'12': '3rem',     // 48px
    			'16': '4rem',     // 64px
    			'20': '5rem',     // 80px
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		}
    	}
    },
    plugins: [require("tailwindcss-animate")],
}
