import rss from "@astrojs/rss";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { render } from "astro:content";
import { absoluteUrl, getAllPosts, getPostAbsoluteUrl, getSlug, sortPostsByPublicationDate } from "../lib/posts";
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

export async function GET() {
  // RSS readers expect a chronological feed. Pinned ordering is useful for
  // on-site cards, but should not move older entries above newer ones.
  const posts = sortPostsByPublicationDate(await getAllPosts());
  const container = await AstroContainer.create();
  const feedUrl = absoluteUrl("/rss.xml");
  const feedIconUrl = absoluteUrl("/favicon.svg");
  const items = await Promise.all(posts.map(async (post) => {
    const articleUrl = getPostAbsoluteUrl(post);
    const { Content } = await render(post);
    const renderedContent = await container.renderToString(Content);

    return {
      title: post.data.title,
      description: post.data.description,
      content: prepareRssContent(renderedContent, articleUrl),
      pubDate: post.data.pubDate,
      link: articleUrl,
      categories: [post.data.category, ...post.data.tags],
      customData: post.data.updatedDate
        ? `<updated>${post.data.updatedDate.toISOString()}</updated>`
        : undefined,
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
      webfeeds: "http://webfeeds.org/rss/1.0",
    },
    customData: [
      `<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
      `<image><url>${feedIconUrl}</url><title>${site.title}</title><link>${site.url}</link></image>`,
      `<webfeeds:icon>${feedIconUrl}</webfeeds:icon>`,
    ].join(""),
    trailingSlash: true,
  });
}
