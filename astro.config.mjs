import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// GitHub Pages project site:
// https://daliymove.github.io/daliymove-tech-share/
export default defineConfig({
  site: "https://daliymove.github.io",
  base: "/daliymove-tech-share",
  integrations: [mdx(), tailwind({ applyBaseStyles: false })],
  markdown: {
    shikiConfig: {
      theme: "github-dark-dimmed",
      wrap: true,
    },
  },
});