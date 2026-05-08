import React from "react";
import { BrowserRouter, Routes, Route, useLocation, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  Search,
  MessageCircle,
  User,
  Zap,
} from "lucide-react";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { AIProvider } from "./contexts/AIContext";
import Feed from "./pages/Feed";
import SearchPage from "./pages/Search";
import Chats from "./pages/Chats";
import Stories from "./pages/Stories";
import Profile from "./pages/Profile";

const pageVariants = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(2px)" },
};

const pageTransition = {
  duration: 0.28,
  ease: [0.4, 0, 0.2, 1],
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="flex-1"
            >
              <Feed />
            </motion.div>
          }
        />
        <Route
          path="/search"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="flex-1"
            >
              <SearchPage />
            </motion.div>
          }
        />
        <Route
          path="/chats"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="flex-1"
            >
              <Chats />
            </motion.div>
          }
        />
        <Route
          path="/stories"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="flex-1"
            >
              <Stories />
            </motion.div>
          }
        />
        <Route
          path="/profile"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="flex-1"
            >
              <Profile />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Feed" },
  { to: "/search", icon: Search, label: "Explore" },
  { to: "/stories", icon: Zap, label: "Stories" },
  { to: "/chats", icon: MessageCircle, label: "Chats" },
  { to: "/profile", icon: User, label: "Profile" },
];

function TabBar() {
  return (
    <nav className="tab-bar fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="flex items-center justify-around px-2 pt-3 pb-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-200 ${
                isActive ? "text-brand-violet-400" : "text-midnight-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background:
                          "radial-gradient(ellipse, rgba(121,22,255,0.25) 0%, transparent 70%)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={
                      isActive
                        ? "text-brand-violet-400 drop-shadow-[0_0_6px_rgba(121,22,255,0.7)]"
                        : "text-[#5a4870]"
                    }
                  />
                </motion.div>
                <span
                  className={`text-[10px] font-display font-semibold tracking-wide transition-colors ${
                    isActive ? "text-brand-violet-400" : "text-[#5a4870]"
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AIProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-dvh bg-[#080010] overflow-hidden">
              <div className="flex-1 pb-20 overflow-y-auto scrollbar-hidden">
                <AnimatedRoutes />
              </div>
              <TabBar />
            </div>
          </BrowserRouter>
        </AIProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
