import { getCollection, type CollectionEntry } from "astro:content";
import { site } from "./site";

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

export function absoluteUrl(path = "/") {
  const origin = (import.meta.env.SITE || "https://daliymove.github.io").replace(/\/$/, "");
  const relative = withBase(path).replace(/\/\/+/g, "/");
  return new URL(relative, `${origin}/`).href;
}

export function getSlug(post: BlogPost) {
  return post.id.replace(/\.(md|mdx)$/i, "").replace(/\/index$/, "");
}

export function getPostUrl(post: BlogPost) {
  return withBase(`/blog/${getSlug(post)}/`);
}

export function getPostAbsoluteUrl(post: BlogPost) {
  return absoluteUrl(`/blog/${getSlug(post)}/`);
}

export function getCategoryUrl(category: string) {
  return withBase(`/categories/${encodeURIComponent(category)}/`);
}

export function getTagUrl(tag: string) {
  return withBase(`/tags/${encodeURIComponent(tag)}/`);
}

export function getCoverUrl(post: BlogPost) {
  if (post.data.cover) {
    return post.data.cover.startsWith("http") ? post.data.cover : withBase(post.data.cover);
  }
  return withBase("/images/og/default.svg");
}

export function getCoverAbsoluteUrl(post?: BlogPost) {
  if (!post) return absoluteUrl("/images/og/default.svg");
  if (post.data.cover) {
    return post.data.cover.startsWith("http") ? post.data.cover : absoluteUrl(post.data.cover);
  }
  return absoluteUrl("/images/og/default.svg");
}

export async function getAllPosts() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.sort((a, b) => {
    if (a.data.pinned !== b.data.pinned) return a.data.pinned ? -1 : 1;
    if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  });
}

export function getPinnedPosts(posts: BlogPost[]) {
  return posts.filter((post) => post.data.pinned);
}

export function getRegularPosts(posts: BlogPost[]) {
  return posts
    .filter((post) => !post.data.pinned)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function getFeaturedPosts(posts: BlogPost[]) {
  return posts.filter((post) => post.data.featured || post.data.pinned);
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

export function getAdjacentPosts(posts: BlogPost[], current: BlogPost) {
  const index = posts.findIndex((post) => post.id === current.id);
  return {
    prev: index >= 0 && index < posts.length - 1 ? posts[index + 1] : undefined,
    next: index > 0 ? posts[index - 1] : undefined,
  };
}

export function getRelatedPosts(posts: BlogPost[], current: BlogPost, limit = 3) {
  const scored = posts
    .filter((post) => post.id !== current.id)
    .map((post) => {
      let score = 0;
      if (post.data.category === current.data.category) score += 4;
      if (post.data.series && post.data.series === current.data.series) score += 6;
      const sharedTags = post.data.tags.filter((tag) => current.data.tags.includes(tag)).length;
      score += sharedTags * 2;
      return { post, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf());

  return scored.slice(0, limit).map((item) => item.post);
}

export function siteMeta() {
  return site;
}