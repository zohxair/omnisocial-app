import React from 'react';

export default function Stories() {
  return (
    <div className="bg-black min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <div className="w-24 h-24 rounded-full border-4 border-pink-500 border-t-violet-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold">Stories</h2>
        <p className="text-neutral-400 mt-2">Tap to view your friends' updates.</p>
      </div>
    </div>
  );
}
