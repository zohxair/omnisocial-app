import React from 'react';
import { Search } from 'lucide-react';

export default function Chats() {
  return (
    <div className="p-4 pt-8">
      <h2 className="text-2xl font-bold mb-4">Messages</h2>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-neutral-500" size={20} />
        <input className="w-full bg-neutral-900 rounded-xl py-3 pl-10 pr-4 outline-none border border-neutral-800 focus:border-violet-500" placeholder="Search chats..." />
      </div>
      <p className="text-center text-neutral-500 mt-20">No active conversations yet.</p>
    </div>
  );
}
