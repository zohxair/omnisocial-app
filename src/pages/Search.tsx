import React from 'react';

export default function SearchPage() {
  return (
    <div className="p-4 grid grid-cols-3 gap-1">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="aspect-square bg-neutral-900 border border-neutral-800 animate-pulse" />
      ))}
    </div>
  );
}
