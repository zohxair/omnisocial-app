import React from 'react';
import { Settings, Grid, Bookmark, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-[#080010] pb-24">
      <div className="p-8 pt-16 text-center">
        <div className="flex justify-end mb-4"><Settings className="text-[#5a4870]" /></div>
        <div className="relative inline-block mb-4 p-1 rounded-[30px] bg-gradient-to-tr from-[#7916ff] to-[#f50080]">
          <img src={user?.avatar} className="w-24 h-24 rounded-[26px] object-cover bg-[#080010]" alt="avatar" />
        </div>
        <h2 className="text-2xl font-display font-bold text-[#f0eaff]">{user?.displayName}</h2>
        <p className="text-[#7916ff] text-sm mb-6">@{user?.username}</p>
        <div className="flex justify-center gap-10 border-y border-[#7916ff]/10 py-6 mb-8">
           <div><p className="font-bold text-[#f0eaff]">{user?.posts}</p><p className="text-xs text-[#5a4870]">Posts</p></div>
           <div><p className="font-bold text-[#f0eaff]">48.2k</p><p className="text-xs text-[#5a4870]">Followers</p></div>
           <div><p className="font-bold text-[#f0eaff]">{user?.following}</p><p className="text-xs text-[#5a4870]">Following</p></div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 px-1">
        {[...Array(12)].map((_, i) => <div key={i} className="aspect-square bg-[#0d0028]/40 border border-[#7916ff]/5" />)}
      </div>
    </div>
  );
}
