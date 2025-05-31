'use client';
import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import {
  BeakerIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import QuotesTicker from './quotes-ticker';
import { useState } from 'react';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn } = useUser();

  const navigation = [
    { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { href: '/simulation', label: 'Simulation', icon: BeakerIcon },
    { href: '/quotes', label: 'Quotes', icon: CurrencyDollarIcon },
    { href: '/transactions', label: 'Transactions', icon: BanknotesIcon },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-700 backdrop-blur-sm">
      <div className="flex flex-col">
        <div className="px-4">
          <div className="container mx-auto max-w-6xl flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold">Byldr Finance</span>
              </Link>
              {isSignedIn && (
                <nav className="hidden lg:flex items-center gap-6">
                  {navigation.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="text-sm font-medium flex items-center gap-1"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </nav>
              )}
            </div>
            <div className="flex items-center gap-4">
              {isSignedIn && (
                <button
                  className="lg:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label="Toggle navigation"
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? (
                    <XMarkIcon className="w-6 h-6" />
                  ) : (
                    <Bars3Icon className="w-6 h-6" />
                  )}
                </button>
              )}
              {isSignedIn ? (
                <UserButton afterSignOutUrl="/sign-in" />
              ) : (
                <Link href="/sign-in" className="text-sm font-medium">
                  Sign In
                </Link>
              )}
            </div>
          </div>
          {mobileOpen && isSignedIn && (
            <nav className="lg:hidden mt-2 flex flex-col gap-2">
              {navigation.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-800"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>
        {isSignedIn && <QuotesTicker />}
      </div>
    </header>
  );
}
