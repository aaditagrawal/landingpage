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
    // Site is 6 pages — prefetch every internal link at page load so subsequent
    // navigations come from cache. Uses <link rel="prefetch"> at low priority,
    // so it doesn't block fonts or critical CSS on first paint.
    prefetchAll: true,
    defaultStrategy: "load",
  },
  experimental: {
    // Upgrade prefetch to full prerender via the Speculation Rules API where
    // supported (Chromium): the next page is fully rendered before the click.
    clientPrerender: true,
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
