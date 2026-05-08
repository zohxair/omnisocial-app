/**
 * SocialFeed.tsx — Instagram × Twitter Hybrid Feed
 *
 * Features:
 *  - Infinite scroll with React Query + cursor pagination
 *  - Live post injection via Socket.io (useLiveFeed)
 *  - Like / Repost with optimistic updates
 *  - Thread composer (Twitter-style) with media upload to Cloudinary
 *  - Full-screen media lightbox
 *  - @AI summarise button per post
 *  - Story bar at top (24-hr rings)
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
} from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket, useLiveFeed, type FeedEvent } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import { uploadToCloudinary } from "../lib/cloudinary";
import { api } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Author {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isVerified?: boolean;
}

interface Post {
  id: string;
  author: Author;
  content: string;
  media: { url: string; type: "image" | "video"; aspectRatio?: number }[];
  likesCount: number;
  repostsCount: number;
  repliesCount: number;
  isLiked: boolean;
  isReposted: boolean;
  parentId?: string;       // thread reply
  createdAt: string;
}

interface Story {
  id: string;
  user: Author;
  hasUnseen: boolean;
  expiresAt: string;
}

interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const fetchFeed = async ({ pageParam }: { pageParam?: string }): Promise<FeedPage> => {
  const { data } = await api.get("/feed", { params: { cursor: pageParam, limit: 15 } });
  return data;
};

const fetchStories = async (): Promise<Story[]> => {
  const { data } = await api.get("/stories");
  return data;
};

const postLike    = (postId: string) => api.post(`/feed/${postId}/like`);
const postRepost  = (postId: string) => api.post(`/feed/${postId}/repost`);
const createPost  = (payload: { content: string; media?: string[]; parentId?: string }) =>
  api.post("/feed", payload);
const aiSummarise = (postId: string) => api.post(`/ai/summarise-post/${postId}`);

// ─── Story Bar ────────────────────────────────────────────────────────────────

function StoryBar({ stories }: { stories: Story[] }) {
  return (
    <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-none">
      {stories.map((s) => (
        <button
          key={s.id}
          className="flex flex-col items-center gap-1 flex-shrink-0"
          aria-label={`${s.user.displayName}'s story`}
        >
          <div
            className={`p-[2px] rounded-full ${
              s.hasUnseen
                ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-violet-600"
                : "bg-neutral-200 dark:bg-neutral-700"
            }`}
          >
            <div className="bg-white dark:bg-neutral-950 rounded-full p-[2px]">
              <img
                src={s.user.avatar}
                alt={s.user.displayName}
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 max-w-[52px] truncate">
            {s.user.username}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Thread Composer ──────────────────────────────────────────────────────────

function ThreadComposer({ onPost }: { onPost: (content: string, mediaUrls: string[]) => void }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4);
    setMediaFiles(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    if (!text.trim() && mediaFiles.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(mediaFiles.map((f) => uploadToCloudinary(f)));
      onPost(text.trim(), urls);
      setText("");
      setMediaFiles([]);
      setPreviews([]);
    } finally {
      setUploading(false);
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  const remaining = 280 - text.length;

  return (
    <div className="flex gap-3 px-4 py-4 border-b border-neutral-100 dark:border-neutral-800">
      <img
        src={user?.avatar ?? `https://api.dicebear.com/8.x/notionists/svg?seed=${user?.id}`}
        alt="me"
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex-1 flex flex-col gap-2">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="What's happening?"
          maxLength={280}
          className="w-full resize-none bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none leading-relaxed"
        />

        {/* Media previews */}
        {previews.length > 0 && (
          <div className={`grid gap-1.5 ${previews.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {previews.map((p, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden aspect-video bg-neutral-100 dark:bg-neutral-800">
                <img src={p} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => {
                    setMediaFiles((f) => f.filter((_, j) => j !== i));
                    setPreviews((p) => p.filter((_, j) => j !== i));
                  }}
                  className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-violet-500 hover:text-violet-600 transition-colors"
              aria-label="Add media"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs ${remaining < 20 ? "text-red-500" : "text-neutral-400"}`}>
              {remaining}
            </span>
            <button
              onClick={handleSubmit}
              disabled={uploading || (!text.trim() && mediaFiles.length === 0)}
              className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-semibold rounded-full transition-colors"
            >
              {uploading ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Media Lightbox ───────────────────────────────────────────────────────────

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler as EventListener);
    return () => window.removeEventListener("keydown", handler as EventListener);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.img
        src={src}
        alt="Full screen"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="max-w-full max-h-full object-contain rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white"
        aria-label="Close"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

// ─── Read Receipt / Double-tick icons ─────────────────────────────────────────

function DoubleTick({ read }: { read: boolean }) {
  return (
    <svg viewBox="0 0 24 12" className={`w-5 h-3 ${read ? "text-blue-500" : "text-neutral-400"}`}>
      <path d="M1 6l4 4 7-8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M8 6l4 4 7-8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ─── AI Summary Modal ─────────────────────────────────────────────────────────

function AISummaryModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiSummarise(postId)
      .then(({ data }) => setSummary(data.summary))
      .catch(() => setSummary("Could not generate summary."))
      .finally(() => setLoading(false));
  }, [postId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
            AI
          </div>
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">@AI Summary</span>
        </div>
        {loading ? (
          <div className="flex gap-1 items-center text-neutral-400 text-sm">
            <span className="animate-bounce delay-0">•</span>
            <span className="animate-bounce delay-100">•</span>
            <span className="animate-bounce delay-200">•</span>
          </div>
        ) : (
          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{summary}</p>
        )}
        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Single Post Card ─────────────────────────────────────────────────────────

function PostCard({
  post,
  onLike,
  onRepost,
  onMediaClick,
  onAISummarise,
}: {
  post: Post;
  onLike: (id: string) => void;
  onRepost: (id: string) => void;
  onMediaClick: (url: string) => void;
  onAISummarise: (id: string) => void;
}) {
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1)  return "now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="px-4 py-4 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <a href={`/profile/${post.author.username}`} className="flex-shrink-0">
          <img
            src={post.author.avatar}
            alt={post.author.displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        </a>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <a href={`/profile/${post.author.username}`} className="font-semibold text-sm text-neutral-900 dark:text-white hover:underline">
              {post.author.displayName}
            </a>
            {post.author.isVerified && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-violet-500">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            )}
            <span className="text-neutral-400 dark:text-neutral-500 text-sm">@{post.author.username}</span>
            <span className="text-neutral-300 dark:text-neutral-600 text-sm">·</span>
            <span className="text-neutral-400 dark:text-neutral-500 text-sm">{timeAgo(post.createdAt)}</span>
          </div>

          {/* Content */}
          {post.content && (
            <p className="mt-1.5 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </p>
          )}

          {/* Media grid — Instagram-style */}
          {post.media.length > 0 && (
            <div
              className={`mt-3 grid gap-1 rounded-2xl overflow-hidden ${
                post.media.length === 1 ? "grid-cols-1" :
                post.media.length === 2 ? "grid-cols-2" :
                post.media.length === 3 ? "grid-cols-2" : "grid-cols-2"
              }`}
            >
              {post.media.map((m, i) => (
                <button
                  key={i}
                  onClick={() => onMediaClick(m.url)}
                  className={`${
                    post.media.length === 3 && i === 0 ? "row-span-2" : ""
                  } relative overflow-hidden bg-neutral-100 dark:bg-neutral-800 aspect-square`}
                >
                  {m.type === "video" ? (
                    <video src={m.url} className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src={m.url}
                      alt=""
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Action bar */}
          <div className="mt-3 flex items-center gap-5">
            {/* Like */}
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                post.isLiked ? "text-pink-500" : "text-neutral-400 hover:text-pink-400"
              }`}
              aria-label="Like"
            >
              <motion.div
                animate={post.isLiked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                <svg viewBox="0 0 24 24" fill={post.isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </motion.div>
              <span>{post.likesCount}</span>
            </button>

            {/* Repost */}
            <button
              onClick={() => onRepost(post.id)}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                post.isReposted ? "text-emerald-500" : "text-neutral-400 hover:text-emerald-400"
              }`}
              aria-label="Repost"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{post.repostsCount}</span>
            </button>

            {/* Replies */}
            <button className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-violet-400 transition-colors" aria-label="Reply">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{post.repliesCount}</span>
            </button>

            {/* @AI summarise */}
            <button
              onClick={() => onAISummarise(post.id)}
              className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-violet-500 transition-colors ml-auto"
              aria-label="Summarise with AI"
              title="Ask @AI to summarise"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-[8px] font-bold">
                AI
              </div>
            </button>

            <DoubleTick read={false} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ─── SocialFeed (main export) ─────────────────────────────────────────────────

export default function SocialFeed() {
  const queryClient = useQueryClient();
  const { likePost, repostPost } = useSocket();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [aiPostId, setAiPostId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ── Stories ────────────────────────────────────────────────────────────────
  const { data: stories = [] } = useInfiniteQuery({
    queryKey: ["stories"],
    queryFn: fetchStories as unknown as () => Promise<Story[]>,
    initialPageParam: undefined,
    getNextPageParam: () => undefined,
    select: (d) => (d as unknown as { pages: Story[][] }).pages[0] ?? [],
  });

  // ── Infinite feed ──────────────────────────────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<FeedPage>({
    queryKey: ["feed"],
    queryFn: fetchFeed,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  // ── Intersection observer for infinite scroll ──────────────────────────────
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage) fetchNextPage(); },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasNextPage, fetchNextPage]);

  // ── Live feed injection ────────────────────────────────────────────────────
  const handleFeedEvent = useCallback(
    (event: FeedEvent) => {
      if (event.type === "new_post") {
        queryClient.invalidateQueries({ queryKey: ["feed"] });
      }
      if (event.type === "like" || event.type === "repost") {
        queryClient.setQueryData<{ pages: FeedPage[] }>(["feed"], (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.map((p) => {
                if (p.id !== event.postId) return p;
                return {
                  ...p,
                  likesCount:
                    event.type === "like" ? p.likesCount + 1 : p.likesCount,
                  repostsCount:
                    event.type === "repost" ? p.repostsCount + 1 : p.repostsCount,
                };
              }),
            })),
          };
        });
      }
    },
    [queryClient]
  );

  useLiveFeed(handleFeedEvent);

  // ── Optimistic like mutation ───────────────────────────────────────────────
  const likeMutation = useMutation({
    mutationFn: (postId: string) => postLike(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const snapshot = queryClient.getQueryData<{ pages: FeedPage[] }>(["feed"]);
      queryClient.setQueryData<{ pages: FeedPage[] }>(["feed"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id !== postId ? p : {
                ...p,
                isLiked: !p.isLiked,
                likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
              }
            ),
          })),
        };
      });
      likePost(postId);   // also broadcast via socket
      return { snapshot };
    },
    onError: (_, __, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(["feed"], ctx.snapshot);
    },
  });

  // ── Optimistic repost mutation ────────────────────────────────────────────
  const repostMutation = useMutation({
    mutationFn: (postId: string) => postRepost(postId),
    onMutate: async (postId) => {
      const snapshot = queryClient.getQueryData<{ pages: FeedPage[] }>(["feed"]);
      queryClient.setQueryData<{ pages: FeedPage[] }>(["feed"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id !== postId ? p : {
                ...p,
                isReposted: !p.isReposted,
                repostsCount: p.isReposted ? p.repostsCount - 1 : p.repostsCount + 1,
              }
            ),
          })),
        };
      });
      repostPost(postId);
      return { snapshot };
    },
    onError: (_, __, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(["feed"], ctx.snapshot);
    },
  });

  // ── Create post mutation ───────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: ({ content, mediaUrls }: { content: string; mediaUrls: string[] }) =>
      createPost({ content, media: mediaUrls }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col max-w-[640px] mx-auto">
      {/* Story bar */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-sm border-b border-neutral-100 dark:border-neutral-800">
        <StoryBar stories={stories as unknown as Story[]} />
      </div>

      {/* Thread composer */}
      <ThreadComposer
        onPost={(content, mediaUrls) =>
          createMutation.mutate({ content, mediaUrls })
        }
      />

      {/* Posts */}
      {isLoading ? (
        <div className="flex flex-col gap-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-4 py-4 border-b border-neutral-100 dark:border-neutral-800 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-3 w-full rounded bg-neutral-100 dark:bg-neutral-700" />
                  <div className="h-3 w-3/4 rounded bg-neutral-100 dark:bg-neutral-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={(id) => likeMutation.mutate(id)}
              onRepost={(id) => repostMutation.mutate(id)}
              onMediaClick={setLightboxSrc}
              onAISummarise={setAiPostId}
            />
          ))}
        </AnimatePresence>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-6 flex justify-center">
        {isFetchingNextPage && (
          <div className="w-6 h-6 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
        )}
        {!hasNextPage && !isLoading && (
          <p className="text-xs text-neutral-400">You're all caught up ✨</p>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
        )}
      </AnimatePresence>

      {/* AI summary modal */}
      <AnimatePresence>
        {aiPostId && (
          <AISummaryModal postId={aiPostId} onClose={() => setAiPostId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
