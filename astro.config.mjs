// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  build: {
    format: "directory",
    assets: "assets",
  },
  compressHTML: true,
  prefetch: {
    // Site is 6 pages — prefetch every internal link at page load so subsequent
    // navigations come from cache. Uses <link rel="prefetch"> at low priority,
    // so it doesn't block fonts or critical CSS on first paint.
    prefetchAll: true,
    defaultStrategy: "load",
  },
});
