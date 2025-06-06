import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'blue-300': 'var(--blue-300)',
        'blue-400': 'var(--blue-400)',
        'blue-500': 'var(--blue-500)',
        'blue-600': 'var(--blue-600)',
        'blue-700': 'var(--blue-700)',
        'gray-100': 'var(--gray-100)',
        'gray-200': 'var(--gray-200)',
        'gray-300': 'var(--gray-300)',
        'gray-400': 'var(--gray-400)',
        'gray-500': 'var(--gray-500)',
        'gray-600': 'var(--gray-600)',
        'gray-700': 'var(--gray-700)',
        'gray-800': 'var(--gray-800)',
        'gray-900': 'var(--gray-900)',
        'green-200': 'var(--green-200)',
        'green-300': 'var(--green-300)',
        'green-400': 'var(--green-400)',
        'green-500': 'var(--green-500)',
        'green-600': 'var(--green-600)',
        'green-700': 'var(--green-700)',
        'green-900': 'var(--green-900)',
        'red-200': 'var(--red-200)',
        'red-400': 'var(--red-400)',
        'red-500': 'var(--red-500)',
        'red-600': 'var(--red-600)',
        'red-700': 'var(--red-700)',
        'red-900': 'var(--red-900)',
        'yellow-200': 'var(--yellow-200)',
        'yellow-800': 'var(--yellow-800)',
        'yellow-900': 'var(--yellow-900)',
        'black': 'var(--black)',
        'white': 'var(--white)',
        'background': 'var(--background)',
        'foreground': 'var(--foreground)',
      }
    }
  },
  plugins: [],
}

export default config
