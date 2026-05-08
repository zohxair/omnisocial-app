import React from 'react';
import { motion } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Stories() {
  const navigate = useNavigate();
  return (
    <div className="h-screen w-full bg-black relative flex flex-col">
      <div className="absolute top-0 left-0 w-full p-4 z-50 flex flex-col gap-4">
        <div className="flex gap-1">
          <div className="h-1 flex-1 bg-[#7916ff] rounded-full" />
          <div className="h-1 flex-1 bg-white/20 rounded-full" />
        </div>
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7916ff] to-[#f50080]" />
            <span className="font-bold text-sm">axel.void</span>
          </div>
          <button onClick={() => navigate('/')}><X /></button>
        </div>
      </div>
      <div className="flex-1 bg-gradient-to-b from-[#130035] to-black flex items-center justify-center">
         <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 4 }} className="text-[#a08dc0] italic opacity-50">Viewing Story...</motion.div>
      </div>
      <div className="p-6 pb-10 flex items-center gap-4 bg-black">
        <input className="flex-1 bg-white/10 border border-white/20 rounded-full py-3 px-6 text-white outline-none" placeholder="Send a reaction..." />
        <Send className="text-white" />
      </div>
    </div>
  );
}
