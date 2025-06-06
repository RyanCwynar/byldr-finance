import React from 'react';

interface TagCloudProps {
  tags: string[];
  selected: Set<string>;
  onToggle: (tag: string) => void;
}

export default function TagCloud({ tags, selected, onToggle }: TagCloudProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
          className={`px-2 py-1 rounded-full text-xs border border-gray-600 ${
            selected.has(tag)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
