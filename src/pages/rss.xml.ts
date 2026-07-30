import rss from "@astrojs/rss";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { render } from "astro:content";
import { absoluteUrl, getAllPosts, getOgImageAbsoluteUrl, getPostAbsoluteUrl, getSlug, sortPostsByPublicationDate } from "../lib/posts";
import { site } from "../lib/site";

function toAbsoluteContentUrl(value: string, articleUrl: string) {
  if (/^(?:https?:|mailto:|tel:)/i.test(value)) return value;
  if (value.startsWith("/")) return absoluteUrl(value);
  return new URL(value, articleUrl).href;
}

function prepareRssContent(html: string, articleUrl: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\s+on[a-z]+=(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/\b(href|src)=("|')([^"']+)\2/gi, (_match, attribute, quote, value) => {
      const absoluteValue = toAbsoluteContentUrl(value, articleUrl);
      return `${attribute}=${quote}${absoluteValue}${quote}`;
    });
}

function imageMimeType(imageUrl: string) {
  const extension = new URL(imageUrl).pathname.split(".").pop()?.toLowerCase();
  return {
    avif: "image/avif",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  }[extension ?? ""] ?? "image/png";
}

export async function GET() {
  // RSS readers expect a chronological feed. Pinned ordering is useful for
  // on-site cards, but should not move older entries above newer ones.
  const posts = sortPostsByPublicationDate(await getAllPosts());
  const container = await AstroContainer.create();
  const feedUrl = absoluteUrl("/rss.xml");
  const feedIconUrl = absoluteUrl("/favicon.png");
  const items = await Promise.all(posts.map(async (post) => {
    const articleUrl = getPostAbsoluteUrl(post);
    const { Content } = await render(post);
    const renderedContent = await container.renderToString(Content);
    const fullContent = prepareRssContent(renderedContent, articleUrl);
    const imageUrl = getOgImageAbsoluteUrl(post);
    const imageType = imageMimeType(imageUrl);

    return {
      title: post.data.title,
      // Many readers, including the target client, render description but ignore
      // content:encoded. Keep the complete, sanitized article here.
      description: fullContent,
      pubDate: post.data.pubDate,
      link: articleUrl,
      categories: [post.data.category, ...post.data.tags],
      customData: [
        `<media:content url="${imageUrl}" medium="image" type="${imageType}"/>`,
        `<media:thumbnail url="${imageUrl}"/>`,
        `<enclosure url="${imageUrl}" type="${imageType}"/>`,
        post.data.updatedDate ? `<atom:updated>${post.data.updatedDate.toISOString()}</atom:updated>` : "",
      ].join(""),
      author: site.author,
      guid: getSlug(post),
    };
  }));

  return rss({
    title: site.title,
    description: site.description,
    site: site.url,
    items,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
      media: "http://search.yahoo.com/mrss/",
    },
    customData: [
      `<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
      `<atom:icon>${feedIconUrl}</atom:icon>`,
      `<atom:logo>${feedIconUrl}</atom:logo>`,
      `<image><url>${feedIconUrl}</url><title>${site.title}</title><link>${site.url}</link><width>144</width><height>144</height></image>`,
    ].join(""),
    trailingSlash: true,
  });
}
