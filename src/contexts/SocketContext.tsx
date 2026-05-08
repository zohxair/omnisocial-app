import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";

type EventHandler = (data: unknown) => void;

interface SocketContextValue {
  isConnected: boolean;
  on: (event: string, handler: EventHandler) => () => void;
  emit: (event: string, data?: unknown) => void;
  onlineCount: number;
}

const SocketContext = createContext<SocketContextValue | null>(null);

// Simulated real-time event emitter (replaces actual WebSocket in demo)
class MockSocket {
  private listeners = new Map<string, Set<EventHandler>>();
  private intervals: ReturnType<typeof setInterval>[] = [];

  connect() {
    // Simulate periodic events
    this.intervals.push(
      setInterval(() => {
        this.fire("like", { postId: Math.random().toString(36).slice(2), count: Math.floor(Math.random() * 5) + 1 });
      }, 8000)
    );

    this.intervals.push(
      setInterval(() => {
        this.fire("new_message", {
          from: ["@axel.void", "@luna.core", "@hex.wave"][Math.floor(Math.random() * 3)],
          preview: "just sent you a message",
        });
      }, 15000)
    );

    this.intervals.push(
      setInterval(() => {
        this.fire("story_view", {
          viewer: ["@prism.drift", "@void.fox"][Math.floor(Math.random() * 2)],
        });
      }, 20000)
    );
  }

  disconnect() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }

  on(event: string, handler: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  private fire(event: string, data: unknown) {
    this.listeners.get(event)?.forEach((h) => h(data));
  }

  emit(_event: string, _data?: unknown) {
    // No-op in mock; would send to server in production
  }
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<MockSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(4821);

  useEffect(() => {
    const socket = new MockSocket();
    socketRef.current = socket;
    socket.connect();
    setIsConnected(true);

    // Simulate fluctuating online count
    const countInterval = setInterval(() => {
      setOnlineCount((prev) => prev + Math.floor((Math.random() - 0.5) * 20));
    }, 5000);

    return () => {
      socket.disconnect();
      clearInterval(countInterval);
      setIsConnected(false);
    };
  }, []);

  const on = useCallback((event: string, handler: EventHandler) => {
    if (!socketRef.current) return () => {};
    return socketRef.current.on(event, handler);
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, on, emit, onlineCount }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
}
