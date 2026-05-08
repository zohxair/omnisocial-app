import React from 'react';
import { motion } from 'framer-motion';
import { Search, Edit3, Circle } from 'lucide-react';

const MOCK_CHATS = [
  { id: 1, name: "Axel Void", msg: "The new drop is insane! 🔥", time: "2m", online: true },
  { id: 2, name: "Luna Core", msg: "Did you see the AI prompt?", time: "1h", online: true },
  { id: 3, name: "Hex Wave", msg: "Let's sync later.", time: "3h", online: false },
];

export default function Chats() {
  return (
    <div className="p-6 pt-12 min-h-screen bg-[#080010]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-[#f0eaff]">Messages</h1>
        <Edit3 className="text-[#9f75ff]" />
      </div>
      <div className="relative mb-8">
        <Search className="absolute left-4 top-3.5 text-[#5a4870]" size={20} />
        <input className="w-full bg-[#0d0028] border border-[#7916ff]/20 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-[#7916ff] text-sm text-[#f0eaff]" placeholder="Search signals..." />
      </div>
      <div className="space-y-2">
        {MOCK_CHATS.map((chat) => (
          <motion.div key={chat.id} whileHover={{ x: 4 }} className="flex items-center gap-4 p-4 rounded-2xl bg-[#0d0028]/50 border border-transparent hover:border-[#7916ff]/30 transition-all cursor-pointer">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7916ff] to-[#f50080]" />
              {chat.online && <Circle size={12} fill="#7916ff" className="absolute bottom-0 right-0 text-[#7916ff] border-2 border-[#080010] rounded-full" />}
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <h3 className="font-bold text-[#f0eaff]">{chat.name}</h3>
                <span className="text-xs text-[#5a4870]">{chat.time}</span>
              </div>
              <p className="text-sm text-[#a08dc0] line-clamp-1">{chat.msg}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
