import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, PlusCircle } from 'lucide-react';

export default function Feed() {
  return (
    <div className="pb-20 pt-4 px-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
          OmniSocial
        </h1>
        <PlusCircle className="text-violet-400" size={28} />
      </div>

      {[1, 2].map((post) => (
        <motion.div 
          key={post}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-neutral-800 border border-violet-500/30" />
            <div>
              <p className="font-bold text-sm">User_{post}</p>
              <p className="text-xs text-neutral-500">Just now</p>
            </div>
          </div>
          <div className="aspect-square bg-neutral-800 rounded-2xl mb-4" />
          <div className="flex gap-4">
            <Heart size={24} className="hover:text-pink-500 cursor-pointer transition-colors" />
            <MessageCircle size={24} />
            <Share2 size={24} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
