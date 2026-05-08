import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { AnimatePresence } from "framer-motion";

import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { AIProvider } from "./contexts/AIContext";

const FeedPage      = lazy(() => import("./pages/Feed"));
const ChatsPage     = lazy(() => import("./pages/Chats"));
const StoriesPage   = lazy(() => import("./pages/Stories"));
const ProfilePage   = lazy(() => import("./pages/Profile"));
const SearchPage    = lazy(() => import("./pages/Search"));

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <AIProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-neutral-950 text-white">
                <Suspense fallback={<div className="p-10 text-center">Loading OmniSocial...</div>}>
                  <Routes>
                    <Route path="/" element={<FeedPage />} />
                    <Route path="/chats" element={<ChatsPage />} />
                    <Route path="/stories" element={<StoriesPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/search" element={<SearchPage />} />
                  </Routes>
                </Suspense>
              </div>
            </BrowserRouter>
          </AIProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
