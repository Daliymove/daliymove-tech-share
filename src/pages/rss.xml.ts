import rss from "@astrojs/rss";
import { getAllPosts, getPostAbsoluteUrl, getSlug, sortPostsByPublicationDate } from "../lib/posts";
import { site } from "../lib/site";

export async function GET() {
  // RSS readers expect a chronological feed. Pinned and featured ordering is
  // useful for on-site cards, but should not move older entries above newer ones.
  const posts = sortPostsByPublicationDate(await getAllPosts());
  return rss({
    title: site.title,
    description: site.description,
    site: site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: getPostAbsoluteUrl(post),
      categories: [post.data.category, ...post.data.tags],
      customData: post.data.updatedDate
        ? `<updated>${post.data.updatedDate.toISOString()}</updated>`
        : undefined,
      author: site.author,
      guid: getSlug(post),
    })),
    trailingSlash: true,
  });
}
