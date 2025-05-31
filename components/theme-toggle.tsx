'use client'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from './theme-provider';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <SunIcon className="w-6 h-6 text-yellow-400" />
      ) : (
        <MoonIcon className="w-6 h-6 text-gray-800" />
      )}
    </button>
  );
}
