/**
 * Feed.tsx — Feed Page
 *
 * Thin page wrapper that:
 *  - Renders the <SocialFeed> component as the primary content
 *  - Provides a sticky page header (mobile) with the OmniSocial wordmark
 *    and a notification bell (desktop header is in the Sidebar)
 *  - Shows a full-screen loading gate while auth is still resolving
 *  - Redirects unauthenticated users to the auth flow (if AuthContext
 *    reports isLoading = false and isAuthenticated = false)
 *
 * Kept intentionally thin — all feed logic lives in SocialFeed.tsx.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SocialFeed from "../components/feed/SocialFeed";
import { useAuth } from "../contexts/AuthContext";

// ─── Loading screen ─────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="flex flex-col max-w-[640px] mx-auto">
      {/* Story bar skeleton */}
      <div className="flex gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0 animate-pulse">
            <div className="w-[52px] h-[52px] rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <div className="w-8 h-2 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        ))}
      </div>

      {/* Composer skeleton */}
      <div className="flex gap-3 px-4 py-4 border-b border-neutral-100 dark:border-neutral-800 animate-pulse">
        <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <div className="h-3 w-48 rounded bg-neutral-100 dark:bg-neutral-700" />
          <div className="h-3 w-full rounded bg-neutral-100 dark:bg-neutral-700" />
        </div>
      </div>

      {/* Post skeletons */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="px-4 py-4 border-b border-neutral-100 dark:border-neutral-800 animate-pulse">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-3 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-3 w-full rounded bg-neutral-100 dark:bg-neutral-700" />
              <div className="h-3 w-5/6 rounded bg-neutral-100 dark:bg-neutral-700" />
              {i % 2 === 0 && (
                <div className="h-48 w-full rounded-2xl bg-neutral-100 dark:bg-neutral-700 mt-1" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Mobile header (hidden on md+ where the Sidebar takes over) ─────────────

function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-20 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between px-4 h-12">
      {/* Logo word-mark */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">O</span>
        </div>
        <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
          OmniSocial
        </span>
      </div>

      {/* Notification bell */}
      <button
        aria-label="Notifications"
        className="relative text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {/* Unread badge */}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-500 border-2 border-white dark:border-neutral-950" />
      </button>
    </header>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Guard: redirect to auth if session has fully resolved and user is not logged in
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (!isAuthenticated) {
    // Will be redirected by the effect above; return null to avoid flash
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col min-h-screen"
    >
      <MobileHeader />
      <SocialFeed />
    </motion.div>
  );
}
