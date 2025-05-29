'use client';
import { createContext, useContext } from 'react';
import type { Dictionary } from '@/lib/get-dictionary';

const DictionaryContext = createContext<Dictionary | null>(null);

export function TranslationsProvider({ dictionary, children }: { dictionary: Dictionary; children: React.ReactNode }) {
  return (
    <DictionaryContext.Provider value={dictionary}>{children}</DictionaryContext.Provider>
  );
}

export function useDictionary() {
  const dict = useContext(DictionaryContext);
  if (!dict) {
    throw new Error('Dictionary not provided');
  }
  return dict;
}
