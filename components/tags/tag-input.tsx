'use client';
import { useState } from 'react';

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
}

export default function TagInput({ value, onChange, suggestions, placeholder }: TagInputProps) {
  const [focused, setFocused] = useState(false);
  const tokens = value.split(',').map(t => t.trim());
  const current = tokens[tokens.length - 1] ?? '';
  const filtered = suggestions
    .filter(tag => tag.toLowerCase().startsWith(current.toLowerCase()) && !tokens.slice(0, -1).includes(tag));

  const handleSelect = (tag: string) => {
    const newTokens = tokens.slice(0, -1);
    newTokens.push(tag);
    const joined = newTokens.filter(Boolean).join(',');
    onChange(joined);
    setFocused(false);
  };

  return (
    <div className="relative">
      <input
        className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 100)}
        placeholder={placeholder}
      />
      {focused && current && filtered.length > 0 && (
        <ul className="absolute z-20 bg-gray-800 border border-gray-600 mt-1 rounded-md max-h-40 overflow-auto w-full">
          {filtered.map((tag) => (
            <li
              key={tag}
              onMouseDown={() => handleSelect(tag)}
              className="px-2 py-1 cursor-pointer hover:bg-gray-700"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
