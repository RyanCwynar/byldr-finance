'use client'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { useTheme } from './theme'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
    >
      {theme === 'dark' ? (
        <SunIcon className="w-6 h-6" />
      ) : (
        <MoonIcon className="w-6 h-6" />
      )}
    </button>
  )
}
