import type { APIRoute } from "astro";

const siteUrl = "https://www.aadit.cc";
const lastModified = "2026-08-23";
const pagePaths = [
  "/",
  "/contact/",
  "/experience/",
  "/privacy/",
  "/projects/",
  "/research/",
  "/resume/",
  "/skills/",
  "/whimsy/",
];

const urls = pagePaths
  .map(
    (path) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <lastmod>${lastModified}</lastmod>
  </url>`,
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

export const GET: APIRoute = () =>
  new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
