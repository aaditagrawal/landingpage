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
    // Only prefetch links that opt in (e.g. nav with data-astro-prefetch). Avoids competing
    // requests on first paint versus fonts and below-the-fold content.
    prefetchAll: false,
    defaultStrategy: "viewport",
  },
});
