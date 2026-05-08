import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.omnisocial.app",
  appName: "OmniSocial",

  // Vite output directory — must match vite.config.ts → build.outDir
  webDir: "dist",

  android: {
    // Allow cleartext HTTP in dev; set to false (or omit) for production builds
    allowMixedContent: false,
    // Target a modern WebView
    minWebViewVersion: 80,
  },

  plugins: {
    // ── Status Bar ─────────────────────────────────────────────────────────
    StatusBar: {
      style: "dark",
      backgroundColor: "#ffffff",
    },

    // ── Push Notifications ─────────────────────────────────────────────────
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },

    // ── Splash Screen (optional — add @capacitor/splash-screen if needed) ──
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#0a0a0a",
      showSpinner: false,
    },
  },

  // Uncomment to point at a live dev server during native debugging:
  // server: {
  //   url: "http://192.168.x.x:5173",
  //   cleartext: true,
  // },
};

export default config;
