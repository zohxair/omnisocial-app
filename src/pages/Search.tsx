import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#080010] p-4 pt-12 pb-24">
      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-3 text-[#5a4870]" size={18} />
        <input className="w-full bg-[#130035] border-none rounded-xl py-3 pl-12 pr-4 text-[#f0eaff] outline-none placeholder:text-[#5a4870]" placeholder="Explore the void..." />
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <div key={i} className={`bg-[#0d0028] border border-[#7916ff]/5 ${i % 7 === 0 ? 'col-span-2 row-span-2 aspect-auto' : 'aspect-square'}`}>
            <div className="w-full h-full bg-gradient-to-br from-[#7916ff]/10 to-transparent animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
