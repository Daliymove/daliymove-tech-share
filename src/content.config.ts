import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(220),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string().min(1).max(40),
    tags: z.array(z.string().min(1).max(30)).max(8).default([]),
    cover: z.string().startsWith("/").optional(),
    series: z.string().min(1).max(60).optional(),
    featured: z.boolean().default(false),
    pinned: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };