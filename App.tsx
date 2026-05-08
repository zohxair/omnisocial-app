/**
 * App.tsx — OmniSocial Root Layout
 *
 * Responsibilities:
 *  - Wraps all global providers (Auth, Socket, AI, QueryClient)
 *  - Desktop: persistent left sidebar navigation
 *  - Mobile: bottom tab-bar navigation (Capacitor-aware)
 *  - Route-level code splitting for performance
 *  - Story bar rendered at top on Feed route only
 */

import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { PushNotifications } from "@capacitor/push-notifications";
import { AnimatePresence, motion } from "framer-motion";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { AIProvider } from "./contexts/AIContext";
import UniversalSearch from "./components/search/UniversalSearch";

// ─── Lazy-loaded pages ───────────────────────────────────────────────────────
const FeedPage      = lazy(() => import("./pages/Feed"));
const ChatsPage     = lazy(() => import("./pages/Chats"));
const StoriesPage   = lazy(() => import("./pages/Stories"));
const ProfilePage   = lazy(() => import("./pages/Profile"));
const SearchPage    = lazy(() => import("./pages/Search"));

// ─── React Query client ──────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,        // 30 s
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Nav items ───────────────────────────────────────────────────────────────
interface NavItem {
  path: string;
  label: string;
  icon: (active: boolean) => JSX.Element;
}

const NAV_ITEMS: NavItem[] = [
  {
    path: "/",
    label: "Feed",
    icon: (a) => (
      <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: "/chats",
    label: "Chats",
    icon: (a) => (
      <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    path: "/stories",
    label: "Stories",
    icon: (a) => (
      <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    path: "/search",
    label: "Search",
    icon: (a) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    path: "/profile",
    label: "Profile",
    icon: (a) => (
      <svg viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

// ─── Page transition variants ────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// ─── Capacitor bootstrap ─────────────────────────────────────────────────────
async function initCapacitor() {
  if (!Capacitor.isNativePlatform()) return;

  // Status bar: dark icons on light background
  await StatusBar.setStyle({ style: Style.Dark });

  // Push notifications
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive === "granted") {
    await PushNotifications.register();
  }

  PushNotifications.addListener("registration", ({ value: token }) => {
    // Send token to backend: POST /api/device-tokens
    fetch("/api/device-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(console.error);
  });
}

// ─── Sidebar (Desktop) ───────────────────────────────────────────────────────
function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white dark:bg-neutral-950 border-r border-neutral-100 dark:border-neutral-800 px-4 py-6 gap-2 fixed top-0 left-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-8">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
          <span className="text-white text-sm font-bold">O</span>
        </div>
        <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
          OmniSocial
        </span>
      </div>

      {/* Universal Search (inline) */}
      <div className="mb-4">
        <UniversalSearch compact />
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
               ${isActive
                 ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                 : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-800 dark:hover:text-neutral-200"
               }`
            }
          >
            {({ isActive }) => (
              <>
                {icon(isActive)}
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User avatar + name */}
      {user && (
        <div className="flex items-center gap-3 px-3 py-2 mt-4 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer">
          <img
            src={user.avatar ?? `https://api.dicebear.com/8.x/notionists/svg?seed=${user.id}`}
            alt={user.displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">
              {user.displayName}
            </span>
            <span className="text-xs text-neutral-400 truncate">@{user.username}</span>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Bottom Tab Bar (Mobile) ─────────────────────────────────────────────────
function TabBar() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-t border-neutral-100 dark:border-neutral-800 flex">
      {NAV_ITEMS.map(({ path, label, icon }) => {
        const isActive =
          path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

        return (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
          >
            <span
              className={`transition-colors duration-150 ${
                isActive ? "text-violet-600 dark:text-violet-400" : "text-neutral-400 dark:text-neutral-500"
              }`}
            >
              {icon(isActive)}
            </span>
            <span
              className={`text-[10px] font-medium ${
                isActive ? "text-violet-600 dark:text-violet-400" : "text-neutral-400 dark:text-neutral-500"
              }`}
            >
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

// ─── Animated page wrapper ───────────────────────────────────────────────────
function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
      ))}
    </div>
  );
}

// ─── Inner app (needs Router context) ────────────────────────────────────────
function InnerApp() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen pb-16 md:pb-0">
        <Suspense fallback={<PageSkeleton />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/"        element={<AnimatedPage><FeedPage /></AnimatedPage>} />
              <Route path="/chats"   element={<AnimatedPage><ChatsPage /></AnimatedPage>} />
              <Route path="/chats/:id" element={<AnimatedPage><ChatsPage /></AnimatedPage>} />
              <Route path="/stories" element={<AnimatedPage><StoriesPage /></AnimatedPage>} />
              <Route path="/search"  element={<AnimatedPage><SearchPage /></AnimatedPage>} />
              <Route path="/profile" element={<AnimatedPage><ProfilePage /></AnimatedPage>} />
              <Route path="/profile/:username" element={<AnimatedPage><ProfilePage /></AnimatedPage>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>

      <TabBar />
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [capacitorReady, setCapacitorReady] = useState(false);

  useEffect(() => {
    initCapacitor().finally(() => setCapacitorReady(true));
  }, []);

  // On native, wait for Capacitor setup before rendering UI
  if (Capacitor.isNativePlatform() && !capacitorReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 animate-pulse" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <AIProvider>
            <BrowserRouter>
              <InnerApp />
            </BrowserRouter>
          </AIProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
