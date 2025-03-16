'use client';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-700 bg-black/80 backdrop-blur-sm">
      <div className="container mx-auto max-w-6xl flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">Byldr Finance</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {/* <Link href="/" className="text-sm font-medium text-gray-200 hover:text-white">
              Dashboard
            </Link> */}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <UserButton/>
        </div>
      </div>
    </header>
  );
} 