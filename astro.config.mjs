import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

// GitHub Pages project site:
// https://daliymove.github.io/daliymove-tech-share/
export default defineConfig({
  site: "https://daliymove.github.io",
  base: "/daliymove-tech-share",
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes("/404"),
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: "github-dark-dimmed",
      wrap: true,
    },
  },
});