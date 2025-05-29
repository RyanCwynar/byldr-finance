'use client';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { BeakerIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import QuotesTicker from './quotes-ticker';
import { useDictionary } from './TranslationsProvider';

export default function Header() {
  const dict = useDictionary();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-700 bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col">
        <div className="px-4">
          <div className="container mx-auto max-w-6xl flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold">{dict.header.title}</span>
              </Link>
              <nav className="flex items-center gap-6">
                <Link href="/simulation" className="text-sm font-medium text-gray-200 hover:text-white flex items-center gap-1">
                  <BeakerIcon className="w-4 h-4" />
                  <span>{dict.header.simulation}</span>
                </Link>
                <Link href="/quotes" className="text-sm font-medium text-gray-200 hover:text-white flex items-center gap-1">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  <span>{dict.header.quotes}</span>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <UserButton/>
            </div>
          </div>
        </div>
        <QuotesTicker />
      </div>
    </header>
  );
} 