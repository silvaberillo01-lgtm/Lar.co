import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F2EC',
        surface: '#FFFDF8',
        surface2: '#EDE9E0',
        accent: '#C4622D',
        mateus: '#3B6EA5',
        esposa: '#7B5EA7',
        text: '#1A1714',
        muted: '#7A7469',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
