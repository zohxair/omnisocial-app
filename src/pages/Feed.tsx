import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
  Bell,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface Story {
  id: string;
  username: string;
  avatar: string;
  hasNew: boolean;
  isLive?: boolean;
}

interface Post {
  id: string;
  user: { username: string; avatar: string; verified: boolean; isPro: boolean };
  image?: string;
  caption: string;
  likes: number;
  comments: number;
  time: string;
  tags: string[];
  isLiked: boolean;
  isSaved: boolean;
  gradient?: string;
}

const STORIES: Story[] = [
  { id: "s1", username: "you", avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=nova", hasNew: false },
  { id: "s2", username: "axel.void", avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=axel&backgroundColor=c0aede", hasNew: true, isLive: true },
  { id: "s3", username: "luna.core", avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=luna&backgroundColor=ffd5dc", hasNew: true },
  { id: "s4", username: "hex.wave", avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=hex&backgroundColor=d1f0b1", hasNew: true },
  { id: "s5", username: "prism", avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=prism&backgroundColor=b6e3f4", hasNew: false },
  { id: "s6", username: "void.fox", avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=fox&backgroundColor=fde68a", hasNew: true },
];

const INITIAL_POSTS: Post[] = [
  {
    id: "p1",
    user: { username: "axel.void", avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=axel&backgroundColor=c0aede", verified: true, isPro: false },
    gradient: "linear-gradient(135deg, #1a0050 0%, #2d0076 40%, #580099 100%)",
    caption: "found a new corner of the internet that doesn't exist yet. building there.",
    likes: 2841,
    comments: 94,
    time: "3m",
    tags: ["#voidcore", "#digital"],
    isLiked: false,
    isSaved: false,
  },
  {
    id: "p2",
    user: { username: "luna.core", avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=luna&backgroundColor=ffd5dc", verified: false, isPro: true },
    image: "https://picsum.photos/seed/luna1/600/700",
    caption: "the city looks different at 3AM. quieter. more honest.",
    likes: 5203,
    comments: 187,
    time: "27m",
    tags: ["#nightlife", "#urban"],
    isLiked: true,
    isSaved: true,
  },
  {
    id: "p3",
    user: { username: "hex.wave", avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=hex&backgroundColor=d1f0b1", verified: true, isPro: true },
    gradient: "linear-gradient(135deg, #003050 0%, #005080 40%, #0080c0 100%)",
    caption: "static is just silence with texture. been thinking about this all week.",
    likes: 1092,
    comments: 43,
    time: "1h",
    tags: ["#audio", "#philosophy"],
    isLiked: false,
    isSaved: false,
  },
  {
    id: "p4",
    user: { username: "prism.drift", avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=prism&backgroundColor=b6e3f4", verified: false, isPro: false },
    image: "https://picsum.photos/seed/prism42/600/750",
    caption: "chasing light in places it wasn't invited ✦",
    likes: 8470,
    comments: 312,
    time: "2h",
    tags: ["#photography", "#light"],
    isLiked: false,
    isSaved: false,
  },
];

function StoryRing({ story, onClick }: { story: Story; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
    >
      <div className="relative">
        {story.hasNew ? (
          <div className="story-ring">
            <span className="story-ring-inner">
              <img
                src={story.avatar}
                alt={story.username}
                className="w-14 h-14 rounded-full object-cover"
              />
            </span>
          </div>
        ) : (
          <div className="p-[2px] rounded-full border border-[#2a1a40]">
            <img
              src={story.avatar}
              alt={story.username}
              className="w-14 h-14 rounded-full object-cover opacity-60"
            />
          </div>
        )}
        {story.isLive && (
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
            <span className="bg-brand-pink-DEFAULT text-white text-[9px] font-display font-bold px-1.5 py-0.5 rounded-full tracking-widest">
              LIVE
            </span>
          </div>
        )}
        {story.id === "s1" && (
          <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-brand-violet-DEFAULT flex items-center justify-center border-2 border-[#080010]">
            <span className="text-white text-[10px] font-bold">+</span>
          </div>
        )}
      </div>
      <span className="text-[10px] text-[#a08dc0] font-body w-14 truncate text-center">
        {story.id === "s1" ? "your story" : story.username}
      </span>
    </motion.button>
  );
}

function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.isLiked);
  const [saved, setSaved] = useState(post.isSaved);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showHeart, setShowHeart] = useState(false);

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => c + (newLiked ? 1 : -1));
  };

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
  };

  const formatCount = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return String(n);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card rounded-3xl overflow-hidden mb-4 mx-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="story-ring" style={{ padding: "1.5px" }}>
            <span className="story-ring-inner" style={{ padding: "1.5px" }}>
              <img
                src={post.user.avatar}
                alt={post.user.username}
                className="w-9 h-9 rounded-full object-cover"
              />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#f0eaff] text-sm font-display font-semibold">
                {post.user.username}
              </span>
              {post.user.verified && (
                <span className="text-brand-violet-400 text-xs">✦</span>
              )}
              {post.user.isPro && (
                <span
                  className="text-[9px] font-display font-bold px-1.5 py-0.5 rounded-full tracking-widest"
                  style={{
                    background: "linear-gradient(135deg, #7916ff, #f50080)",
                    color: "white",
                  }}
                >
                  PRO
                </span>
              )}
            </div>
            <span className="text-[#5a4870] text-xs font-body">{post.time} ago</span>
          </div>
        </div>
        <button className="text-[#5a4870] hover:text-[#a08dc0] transition-colors p-1">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Media */}
      <div className="relative cursor-pointer" onDoubleClick={handleDoubleTap}>
        {post.image ? (
          <img
            src={post.image}
            alt=""
            className="w-full object-cover max-h-96"
            loading="lazy"
          />
        ) : post.gradient ? (
          <div
            className="w-full h-48 flex items-center justify-center"
            style={{ background: post.gradient }}
          >
            <div className="text-center px-6">
              <Sparkles className="text-brand-violet-300 mx-auto mb-2" size={28} />
              <p className="text-[#e0d0ff] font-display font-medium text-sm leading-relaxed">
                {post.caption}
              </p>
            </div>
          </div>
        ) : null}

        {/* Double-tap heart */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.6, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart
                size={80}
                fill="#f50080"
                className="text-brand-pink-DEFAULT drop-shadow-[0_0_20px_rgba(245,0,128,0.8)]"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleLike}
              className="flex items-center gap-1.5"
            >
              <Heart
                size={22}
                fill={liked ? "#f50080" : "none"}
                className={liked ? "text-brand-pink-DEFAULT" : "text-[#5a4870]"}
                strokeWidth={liked ? 0 : 1.8}
              />
              <span
                className={`text-sm font-body font-medium ${
                  liked ? "text-brand-pink-DEFAULT" : "text-[#5a4870]"
                }`}
              >
                {formatCount(likeCount)}
              </span>
            </motion.button>

            <button className="flex items-center gap-1.5 text-[#5a4870]">
              <MessageCircle size={22} strokeWidth={1.8} />
              <span className="text-sm font-body">{formatCount(post.comments)}</span>
            </button>

            <button className="text-[#5a4870]">
              <Share2 size={20} strokeWidth={1.8} />
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setSaved((s) => !s)}
          >
            <Bookmark
              size={22}
              fill={saved ? "#7916ff" : "none"}
              className={saved ? "text-brand-violet-DEFAULT" : "text-[#5a4870]"}
              strokeWidth={saved ? 0 : 1.8}
            />
          </motion.button>
        </div>

        {/* Caption */}
        {post.image && (
          <p className="text-[#d0c0f0] text-sm font-body leading-relaxed mb-2">
            <span className="text-[#f0eaff] font-semibold font-display mr-1.5">
              {post.user.username}
            </span>
            {post.caption}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span key={tag} className="text-brand-violet-400 text-xs font-body">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

export default function Feed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts] = useState<Post[]>(INITIAL_POSTS);

  return (
    <div className="page-container">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,0,16,0.98) 0%, rgba(8,0,16,0.0) 100%)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div>
            <h1 className="font-display font-bold text-xl gradient-text tracking-tight">
              OmniSocial
            </h1>
            <p className="text-[#5a4870] text-[11px] font-body -mt-0.5 flex items-center gap-1">
              <TrendingUp size={10} />
              4,821 online now
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="relative p-2 rounded-xl"
              style={{ background: "rgba(121,22,255,0.1)" }}
            >
              <Bell size={20} className="text-brand-violet-400" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-pink-DEFAULT" />
            </motion.button>
            <button onClick={() => navigate("/profile")}>
              <img
                src={user?.avatar}
                alt={user?.username}
                className="w-8 h-8 rounded-full object-cover border border-brand-violet-700"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Stories */}
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hidden pb-1">
          {STORIES.map((story) => (
            <StoryRing
              key={story.id}
              story={story}
              onClick={() => navigate("/stories")}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 mb-4 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(121,22,255,0.2), transparent)" }} />

      {/* Feed */}
      <main className="pb-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </main>
    </div>
  );
}
