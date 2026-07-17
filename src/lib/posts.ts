import { getCollection, type CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blog">;

export function withBase(path = "/") {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  if (!path || path === "/") {
    return normalizedBase ? `${normalizedBase}/` : "/";
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function getSlug(post: BlogPost) {
  return post.id.replace(/\.(md|mdx)$/i, "").replace(/\/index$/, "");
}

export function getPostUrl(post: BlogPost) {
  return withBase(`/blog/${getSlug(post)}/`);
}

export function getCategoryUrl(category: string) {
  return withBase(`/categories/${encodeURIComponent(category)}/`);
}

export function getTagUrl(tag: string) {
  return withBase(`/tags/${encodeURIComponent(tag)}/`);
}

export async function getAllPosts() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function getFeaturedPosts(posts: BlogPost[]) {
  return posts.filter((post) => post.data.featured);
}

export function getReadingTime(body = "") {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const cnChars = (body.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const minutes = Math.max(1, Math.ceil((words + cnChars / 2) / 220));
  return `${minutes} 分钟阅读`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function collectCategories(posts: BlogPost[]) {
  return Array.from(
    posts.reduce((map, post) => {
      map.set(post.data.category, (map.get(post.data.category) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"));
}

export function collectTags(posts: BlogPost[]) {
  return Array.from(
    posts.reduce((map, post) => {
      post.data.tags.forEach((tag) => map.set(tag, (map.get(tag) ?? 0) + 1));
      return map;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"));
}