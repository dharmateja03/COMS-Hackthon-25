// tailwind.config.js
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        // Custom colors from hacks folder
        'dark-bg': '#0a0a0f',
        'dark-card': '#1e293b',
        'teal-glow': '#06b6d4',
        'magenta-glow': '#ec4899',
      },
      boxShadow: {
        'glow-teal': '0 0 20px rgba(6, 182, 212, 0.5)',
        'glow-magenta': '0 0 20px rgba(236, 72, 153, 0.5)',
        'glow-mixed': '0 0 30px rgba(6, 182, 212, 0.3), 0 0 30px rgba(236, 72, 153, 0.3)',
      },
    },
  },
  plugins: [],
}

