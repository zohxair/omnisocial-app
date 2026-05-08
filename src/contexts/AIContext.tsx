import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export type AICapability =
  | "caption"
  | "hashtags"
  | "reply_suggest"
  | "content_idea"
  | "tone_analysis";

interface AIContextValue {
  isThinking: boolean;
  messages: AIMessage[];
  lastSuggestion: string | null;
  generateCaption: (imageDescription: string) => Promise<string>;
  generateHashtags: (topic: string) => Promise<string[]>;
  suggestReply: (comment: string) => Promise<string>;
  generateContentIdea: (niche: string) => Promise<string>;
  clearMessages: () => void;
  sendMessage: (content: string) => Promise<void>;
}

const AIContext = createContext<AIContextValue | null>(null);

const MOCK_CAPTIONS = [
  "lost between the pixels and the stars ✦",
  "neon dreams in a midnight world 🌙",
  "building empires from static and light",
  "where shadows meet their violet edges",
  "signal lost. soul found. ⚡",
];

const MOCK_HASHTAGS = [
  ["#voidcore", "#neonpunk", "#digitalsouls", "#midnightvibes", "#aestheticvoid"],
  ["#darkwave", "#pixelpoet", "#neonlights", "#cyberesthetic", "#glitchwave"],
  ["#altvibes", "#noirfuture", "#synthwave", "#digitalart", "#voidwalker"],
];

const MOCK_REPLIES = [
  "this is everything ✦",
  "okay but WHY is this so real",
  "felt this in my bones fr",
  "the way this hit different 🖤",
  "no because stop it's too accurate",
];

const MOCK_IDEAS = [
  "A 'before the algorithm' photo dump — raw, unedited, real.",
  "Interview your past self from 3 years ago. What would they say?",
  "Show your workspace at 2AM vs 2PM — same space, different energy.",
  "Document one skill you're actively learning. Day 1 footage hits hard.",
  "Contrast your aesthetic mood board with your actual life — comedic gold.",
];

export function AIProvider({ children }: { children: ReactNode }) {
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [lastSuggestion, setLastSuggestion] = useState<string | null>(null);

  const think = async <T,>(factory: () => T, delay = 1200): Promise<T> => {
    setIsThinking(true);
    await new Promise((res) => setTimeout(res, delay + Math.random() * 600));
    const result = factory();
    setIsThinking(false);
    return result;
  };

  const generateCaption = useCallback(async (_imageDescription: string) => {
    const caption = await think(
      () => MOCK_CAPTIONS[Math.floor(Math.random() * MOCK_CAPTIONS.length)]
    );
    setLastSuggestion(caption);
    return caption;
  }, []);

  const generateHashtags = useCallback(async (_topic: string) => {
    return think(
      () => MOCK_HASHTAGS[Math.floor(Math.random() * MOCK_HASHTAGS.length)]
    );
  }, []);

  const suggestReply = useCallback(async (_comment: string) => {
    const reply = await think(
      () => MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)]
    );
    setLastSuggestion(reply);
    return reply;
  }, []);

  const generateContentIdea = useCallback(async (_niche: string) => {
    return think(
      () => MOCK_IDEAS[Math.floor(Math.random() * MOCK_IDEAS.length)],
      1500
    );
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const reply = await think(
      () =>
        MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)] +
        " — Omni-Assistant",
      1800
    );

    const assistantMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: reply,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return (
    <AIContext.Provider
      value={{
        isThinking,
        messages,
        lastSuggestion,
        generateCaption,
        generateHashtags,
        suggestReply,
        generateContentIdea,
        clearMessages,
        sendMessage,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAI(): AIContextValue {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error("useAI must be used inside AIProvider");
  return ctx;
}
