import React from 'react';

export default function Profile() {
  return (
    <div className="p-4 pt-12 text-center">
      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-600 to-pink-600 mx-auto mb-4 shadow-lg shadow-violet-500/20" />
      <h2 className="text-2xl font-bold">Your Profile</h2>
      <p className="text-neutral-500 mb-6">@omni_user</p>
      <div className="grid grid-cols-3 border-y border-neutral-800 py-4">
        <div><p className="font-bold">0</p><p className="text-xs text-neutral-500">Posts</p></div>
        <div><p className="font-bold">128</p><p className="text-xs text-neutral-500">Followers</p></div>
        <div><p className="font-bold">250</p><p className="text-xs text-neutral-500">Following</p></div>
      </div>
    </div>
  );
}
