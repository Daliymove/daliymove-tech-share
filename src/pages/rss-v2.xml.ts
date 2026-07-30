import { GET as getRss } from "./rss.xml";
import { absoluteUrl } from "../lib/posts";

export async function GET() {
  const response = await getRss();
  const originalXml = await response.text();
  const v2FeedUrl = absoluteUrl("/rss-v2.xml");

  // Feedly keeps the first payload it sees for a GUID. Give this migration
  // feed a distinct, stable identity per article so cached summaries from
  // rss.xml cannot be reused for the full-content entries.
  const xml = originalXml
    .replace(
      /<atom:link href="[^"]+" rel="self" type="application\/rss\+xml"\/>/,
      `<atom:link href="${v2FeedUrl}" rel="self" type="application/rss+xml"/>`,
    )
    .replace(
      /<guid isPermaLink="true">([^<]+)<\/guid>/g,
      (_match, originalGuid) => `<guid isPermaLink="false">rss-v2:${originalGuid}</guid>`,
    );

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
