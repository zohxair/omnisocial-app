import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // Capacitor requires a relative base so assets resolve correctly
    // inside the Android WebView (file:// protocol)
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          react:  ["react", "react-dom", "react-router-dom"],
          query:  ["@tanstack/react-query"],
          motion: ["framer-motion"],
          socket: ["socket.io-client"],
        },
      },
    },
  },

  // Use "./" as base so Capacitor's WebView can load assets from file://
  base: "./",

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL ?? "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
