// @ts-check
import { defineConfig, fontProviders } from "astro/config";

// https://astro.build/config
export default defineConfig({
  build: {
    format: "directory",
    assets: "assets",
    // Inline all page CSS into the HTML: fonts and styles are discovered on the
    // first byte of HTML, no extra stylesheet request before render.
    inlineStylesheets: "always",
  },
  compressHTML: true,
  prefetch: {
    // Prefetch on hover keeps first load lean while still making nav feel instant.
    prefetchAll: false,
    defaultStrategy: "hover",
  },
  // Self-hosted, subset, preloaded fonts with metric-matched local fallbacks
  // (no layout shift while the webfont loads).
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "DM Sans",
      cssVariable: "--font-dm-sans",
      weights: [400, 600],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Geist Mono",
      cssVariable: "--font-geist-mono",
      weights: [400, 500],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"],
    },
  ],
});
