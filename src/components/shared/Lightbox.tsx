/**
 * Lightbox.tsx — Full-screen media viewer
 *
 * Supports:
 *  - Single image or video
 *  - Multi-image gallery with prev/next navigation & keyboard arrows
 *  - Pinch-to-zoom via CSS (touch-action) — native feel on Capacitor
 *  - Escape key + backdrop click to close
 *  - Download button
 *  - Framer Motion enter/exit animations matching the rest of OmniSocial
 *
 * Props:
 *   src      — single URL  (renders one item)
 *   sources  — URL array   (renders gallery; ignored when `src` is set)
 *   onClose  — required close callback
 */

import { useEffect, useState, useCallback, type KeyboardEvent as ReactKE } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LightboxProps {
  /** Single media URL */
  src?: string;
  /** Gallery mode — array of media URLs */
  sources?: string[];
  onClose: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) ||
         url.includes("/video/upload/");
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function NavButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors backdrop-blur-sm"
      style={{ [direction === "prev" ? "left" : "right"]: "1rem" }}
      aria-label={direction === "prev" ? "Previous" : "Next"}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5">
        {direction === "prev"
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  );
}

function MediaItem({ url }: { url: string }) {
  return isVideo(url) ? (
    <video
      src={url}
      controls
      autoPlay
      playsInline          // required for Capacitor iOS inline playback
      className="max-w-full max-h-[85vh] rounded-2xl outline-none shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    />
  ) : (
    <motion.img
      src={url}
      alt="Full-screen media"
      draggable={false}
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{ scale: 1,    opacity: 1 }}
      exit={{    scale: 0.88, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl select-none"
      style={{ touchAction: "pinch-zoom" }}   // enable native pinch-zoom
      onClick={(e) => e.stopPropagation()}
    />
  );
}

// ─── Lightbox ──────────────────────────────────────────────────────────────────

export default function Lightbox({ src, sources, onClose }: LightboxProps) {
  // Normalise to a single array
  const items = src ? [src] : (sources ?? []);
  const [index, setIndex] = useState(0);
  const current = items[index] ?? "";

  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(items.length - 1, i + 1)), [items.length]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowLeft")   prev();
      if (e.key === "ArrowRight")  next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  // ── Lock body scroll while open ───────────────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!current) return null;

  return (
    <motion.div
      key="lightbox-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{    opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
    >
      {/* Prev / Next */}
      {hasPrev && <NavButton direction="prev" onClick={prev} />}
      {hasNext && <NavButton direction="next" onClick={next} />}

      {/* Media */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0  }}
          exit={{    opacity: 0, x: -20 }}
          transition={{ duration: 0.18 }}
          className="flex items-center justify-center w-full h-full px-16"
        >
          <MediaItem url={current} />
        </motion.div>
      </AnimatePresence>

      {/* Top bar: counter + close + download */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Counter */}
        {items.length > 1 ? (
          <span className="text-white/70 text-sm font-medium tabular-nums">
            {index + 1} / {items.length}
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {/* Download */}
          <a
            href={current}
            download
            target="_blank"
            rel="noreferrer"
            className="text-white/70 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
            aria-label="Download"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>

          {/* Close */}
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dot indicators (gallery mode) */}
      {items.length > 1 && (
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === index
                  ? "bg-white scale-125"
                  : "bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
