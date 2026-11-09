import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { studioApi } from "./src/studio/studio-api.mjs";

function shouldIncludeInSitemap(page) {
  const pathname = new URL(page).pathname.replace(/\/+$/, "/");

  if (pathname.endsWith("/404/") || pathname.endsWith("/search/") || pathname.endsWith("/studio/")) return false;

  // Tag archives are currently very small and mostly duplicate article lists.
  // Keep the tag index discoverable, but omit individual tag result pages.
  return !/\/tags\/[^/]+\/$/.test(pathname);
}

// GitHub Pages project site:
// https://daliymove.github.io/daliymove-tech-share/
export default defineConfig({
  site: "https://daliymove.github.io",
  base: "/daliymove-tech-share",
  integrations: [
    mdx(),
    sitemap({
      filter: shouldIncludeInSitemap,
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: "github-dark-dimmed",
      wrap: true,
    },
  },
  // Local writing studio. The plugin only registers HTTP routes in `astro dev`
  // (apply: "serve"), so static builds and the Pages deployment are untouched.
  vite: {
    plugins: [studioApi()],
  },
});
