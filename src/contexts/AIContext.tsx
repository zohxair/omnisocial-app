/**
 * AIContext.tsx — OmniSocial AI Layer
 *
 * Wraps all AI interactions so any component can call AI helpers
 * without coupling to a specific provider (OpenAI vs Anthropic).
 * All actual LLM calls are proxied through your own backend at /ai/*
 * so API keys are never exposed to the client.
 *
 * Provides:
 *  - AIProvider
 *  - useAI hook: { summarisePost, generateCaption, askAI, isLoading, error }
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { api } from "../lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AISummariseResult {
  summary: string;
  postId: string;
}

export interface AICaptionResult {
  caption: string;
}

export interface AIAskResult {
  answer: string;
  conversationId?: string;
}

export interface AIContextValue {
  /** Summarise a feed post by ID */
  summarisePost: (postId: string) => Promise<AISummariseResult>;

  /** Generate a caption suggestion for a media upload */
  generateCaption: (imageUrl: string, hint?: string) => Promise<AICaptionResult>;

  /**
   * Free-form question directed at the AI assistant.
   * Optionally continues a prior conversation via conversationId.
   */
  askAI: (question: string, conversationId?: string) => Promise<AIAskResult>;

  /** True while any AI request is in-flight */
  isLoading: boolean;

  /** Last error message, if any */
  error: string | null;

  /** Clear the error state manually */
  clearError: () => void;
}

// ─── Cache ─────────────────────────────────────────────────────────────────────
// Avoid duplicate server round-trips for the same postId within a session.

type SummaryCache = Map<string, string>;

// ─── Context ───────────────────────────────────────────────────────────────────

const AIContext = createContext<AIContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

export function AIProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const summaryCache = useRef<SummaryCache>(new Map());

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      setError(null);
      try {
        return await fn();
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "An unexpected AI error occurred.";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── Summarise post ────────────────────────────────────────────────────────
  const summarisePost = useCallback(
    async (postId: string): Promise<AISummariseResult> => {
      const cached = summaryCache.current.get(postId);
      if (cached) return { summary: cached, postId };

      return withLoading(async () => {
        const { data } = await api.post<{ summary: string }>(
          `/ai/summarise-post/${postId}`
        );
        summaryCache.current.set(postId, data.summary);
        return { summary: data.summary, postId };
      });
    },
    [withLoading]
  );

  // ── Generate caption ──────────────────────────────────────────────────────
  const generateCaption = useCallback(
    async (imageUrl: string, hint?: string): Promise<AICaptionResult> =>
      withLoading(async () => {
        const { data } = await api.post<{ caption: string }>("/ai/caption", {
          imageUrl,
          hint,
        });
        return { caption: data.caption };
      }),
    [withLoading]
  );

  // ── Free-form ask ─────────────────────────────────────────────────────────
  const askAI = useCallback(
    async (question: string, conversationId?: string): Promise<AIAskResult> =>
      withLoading(async () => {
        const { data } = await api.post<{
          answer: string;
          conversationId?: string;
        }>("/ai/ask", { question, conversationId });
        return { answer: data.answer, conversationId: data.conversationId };
      }),
    [withLoading]
  );

  // ─────────────────────────────────────────────────────────────────────────

  const value: AIContextValue = {
    summarisePost,
    generateCaption,
    askAI,
    isLoading,
    error,
    clearError: () => setError(null),
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useAI(): AIContextValue {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error("useAI must be used within <AIProvider>");
  return ctx;
}
