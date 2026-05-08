/**
 * SocketContext.tsx — OmniSocial Real-time Layer
 *
 * Provides a single Socket.io connection shared across the entire app.
 *
 * Namespaces:
 *   /chat  — DMs, group messages, typing, read receipts, voice notes
 *   /feed  — Live public post/like/repost events
 *
 * Usage:
 *   const { chatSocket, feedSocket, sendMessage, markRead } = useSocket();
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageStatus = "sent" | "delivered" | "read";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: "text" | "image" | "video" | "voice" | "ai";
  content: string;            // text, or Cloudinary URL for media
  duration?: number;          // voice note seconds
  status: MessageStatus;
  createdAt: string;          // ISO string
  readBy: string[];           // user IDs
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface FeedEvent {
  type: "new_post" | "like" | "repost" | "delete_post";
  postId: string;
  userId?: string;
  data?: Record<string, unknown>;
}

export interface SocketContextValue {
  /** Raw socket instances — use for advanced event subscriptions */
  chatSocket: Socket | null;
  feedSocket: Socket | null;

  /** Connection state */
  isConnected: boolean;

  // ── Chat actions ──────────────────────────────────────────────────────────
  sendMessage: (payload: Omit<Message, "id" | "status" | "createdAt" | "readBy">) => void;
  markRead: (conversationId: string, messageIds: string[]) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;

  // ── Feed actions ──────────────────────────────────────────────────────────
  likePost: (postId: string) => void;
  repostPost: (postId: string) => void;

  // ── Event subscription helpers ────────────────────────────────────────────
  /** Subscribe to incoming messages for the current conversation */
  onMessage: (handler: (msg: Message) => void) => () => void;
  /** Subscribe to typing indicators */
  onTyping: (handler: (payload: TypingPayload) => void) => () => void;
  /** Subscribe to read receipt updates */
  onReadReceipt: (handler: (payload: { conversationId: string; messageIds: string[]; userId: string }) => void) => () => void;
  /** Subscribe to live feed events */
  onFeedEvent: (handler: (event: FeedEvent) => void) => () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SocketContext = createContext<SocketContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

const SOCKET_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const SOCKET_OPTS = {
  transports: ["websocket"],
  reconnectionAttempts: 10,
  reconnectionDelay: 1500,
  reconnectionDelayMax: 10_000,
  withCredentials: true,
};

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();

  const chatSocketRef = useRef<Socket | null>(null);
  const feedSocketRef = useRef<Socket | null>(null);

  const [isConnected, setIsConnected] = useState(false);

  // ── Connect / disconnect on auth change ─────────────────────────────────
  useEffect(() => {
    if (!user || !token) return;

    const authPayload = { auth: { token } };

    // /chat namespace
    const chat = io(`${SOCKET_URL}/chat`, { ...SOCKET_OPTS, ...authPayload });
    chatSocketRef.current = chat;

    // /feed namespace
    const feed = io(`${SOCKET_URL}/feed`, { ...SOCKET_OPTS, ...authPayload });
    feedSocketRef.current = feed;

    // Track connectivity from the chat socket (primary)
    chat.on("connect",    () => setIsConnected(true));
    chat.on("disconnect", () => setIsConnected(false));
    chat.on("connect_error", (err) => {
      console.error("[SocketContext] chat connect error:", err.message);
    });

    feed.on("connect_error", (err) => {
      console.error("[SocketContext] feed connect error:", err.message);
    });

    return () => {
      chat.disconnect();
      feed.disconnect();
      chatSocketRef.current = null;
      feedSocketRef.current = null;
      setIsConnected(false);
    };
  }, [user?.id, token]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chat actions ─────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    (payload: Omit<Message, "id" | "status" | "createdAt" | "readBy">) => {
      chatSocketRef.current?.emit("message:send", payload);
    },
    []
  );

  const markRead = useCallback((conversationId: string, messageIds: string[]) => {
    chatSocketRef.current?.emit("message:read", { conversationId, messageIds });
  }, []);

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    chatSocketRef.current?.emit("typing", { conversationId, isTyping });
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    chatSocketRef.current?.emit("conversation:join", { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    chatSocketRef.current?.emit("conversation:leave", { conversationId });
  }, []);

  // ── Feed actions ─────────────────────────────────────────────────────────

  const likePost = useCallback((postId: string) => {
    feedSocketRef.current?.emit("post:like", { postId });
  }, []);

  const repostPost = useCallback((postId: string) => {
    feedSocketRef.current?.emit("post:repost", { postId });
  }, []);

  // ── Subscription helpers ─────────────────────────────────────────────────

  const onMessage = useCallback((handler: (msg: Message) => void) => {
    const socket = chatSocketRef.current;
    socket?.on("message:receive", handler);
    return () => { socket?.off("message:receive", handler); };
  }, []);

  const onTyping = useCallback((handler: (payload: TypingPayload) => void) => {
    const socket = chatSocketRef.current;
    socket?.on("typing:update", handler);
    return () => { socket?.off("typing:update", handler); };
  }, []);

  const onReadReceipt = useCallback(
    (handler: (payload: { conversationId: string; messageIds: string[]; userId: string }) => void) => {
      const socket = chatSocketRef.current;
      socket?.on("message:read_ack", handler);
      return () => { socket?.off("message:read_ack", handler); };
    },
    []
  );

  const onFeedEvent = useCallback((handler: (event: FeedEvent) => void) => {
    const socket = feedSocketRef.current;
    socket?.on("feed:event", handler);
    return () => { socket?.off("feed:event", handler); };
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────

  const value: SocketContextValue = {
    chatSocket: chatSocketRef.current,
    feedSocket: feedSocketRef.current,
    isConnected,
    sendMessage,
    markRead,
    sendTyping,
    joinConversation,
    leaveConversation,
    likePost,
    repostPost,
    onMessage,
    onTyping,
    onReadReceipt,
    onFeedEvent,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      {/* Optional: connection status toast */}
      {!isConnected && user && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          Reconnecting…
        </div>
      )}
    </SocketContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within <SocketProvider>");
  return ctx;
}

// ─── Convenience hooks ────────────────────────────────────────────────────────

/**
 * useConversation — manages join/leave lifecycle for a single conversation.
 * Call inside a ChatWindow component.
 */
export function useConversation(conversationId: string | undefined) {
  const { joinConversation, leaveConversation, onMessage, onTyping, onReadReceipt } = useSocket();

  useEffect(() => {
    if (!conversationId) return;
    joinConversation(conversationId);
    return () => leaveConversation(conversationId);
  }, [conversationId, joinConversation, leaveConversation]);

  return { onMessage, onTyping, onReadReceipt };
}

/**
 * useLiveFeed — subscribes to feed events for the global feed page.
 */
export function useLiveFeed(onEvent: (e: FeedEvent) => void) {
  const { onFeedEvent } = useSocket();

  useEffect(() => {
    return onFeedEvent(onEvent);
  }, [onFeedEvent, onEvent]);
}
