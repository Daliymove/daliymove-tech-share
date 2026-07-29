import assert from "node:assert/strict";
import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "dist");

async function readOutput(relativePath) {
  return readFile(path.join(outputDir, relativePath), "utf8");
}

const [home, search, feed, sitemap] = await Promise.all([
  readOutput("index.html"),
  readOutput(path.join("search", "index.html")),
  readOutput("rss.xml"),
  readOutput("sitemap-0.xml"),
]);

assert.match(home, /images\/logo-marks\/folded-path\.svg/, "The folded-path logo must be used on the home page.");
assert.doesNotMatch(home, /post-card-cover/, "Home post cards must remain text-first.");
assert.doesNotMatch(home, /Fraunces|Manrope/, "Removed font families must not be loaded by the home page.");
assert.doesNotMatch(home, /fonts\.googleapis\.com/, "The home page must not depend on Google Fonts.");
await access(path.join(outputDir, "pagefind", "pagefind.js"));

assert.match(search, /name="robots" content="noindex,follow"/, "The search page must remain out of search indexes.");
assert.doesNotMatch(sitemap, /\/search\//, "The sitemap must exclude the search page.");
assert.doesNotMatch(sitemap, /\/tags\/[^<]+\//, "The sitemap must exclude thin individual tag archives.");

const feedDates = Array.from(feed.matchAll(/<pubDate>([^<]+)<\/pubDate>/g), ([, value]) => Date.parse(value));
assert.ok(feedDates.length > 0, "The RSS feed must include published entries.");
assert.ok(feedDates.every((date, index) => index === 0 || date <= feedDates[index - 1]), "RSS entries must be sorted by publication date descending.");
const feedContents = Array.from(feed.matchAll(/<content:encoded>([\s\S]*?)<\/content:encoded>/g), ([, value]) => value);
assert.match(feed, /xmlns:content="http:\/\/purl\.org\/rss\/1\.0\/modules\/content\/"/, "The RSS feed must declare the content namespace.");
assert.equal(feedContents.length, feedDates.length, "Every RSS item must include full content.");
assert.ok(feedContents.every((content) => content.length >= 500), "RSS item content must contain more than a short summary.");
assert.ok(feedContents.every((content) => !/(?:&lt;|<)script\b/i.test(content)), "RSS item content must not include scripts.");
assert.ok(feedContents.some((content) => /href=(?:&quot;|["'])https:\/\//i.test(content)), "RSS content links must use absolute URLs.");
assert.match(feed, /xmlns:webfeeds="http:\/\/webfeeds\.org\/rss\/1\.0"/, "The RSS feed must declare the WebFeeds namespace.");
assert.match(feed, /<atom:link href="https:\/\/[^"<]+\/rss\.xml" rel="self" type="application\/rss\+xml"\/>/, "The RSS feed must expose an absolute self link.");
assert.match(feed, /<image><url>https:\/\/[^<]+\/favicon\.svg<\/url>/, "The RSS feed must expose the favicon as its channel image.");
assert.match(feed, /<webfeeds:icon>https:\/\/[^<]+\/favicon\.svg<\/webfeeds:icon>/, "The RSS feed must expose a WebFeeds icon.");

const indexScript = search.match(/<script\b[^>]*\bid=["']local-search-index["'][^>]*>([\s\S]*?)<\/script>/i);
assert.ok(indexScript, "The search page must include its fallback index.");

const localIndex = JSON.parse(indexScript[1]);
assert.ok(localIndex.length > 0, "The fallback index must include published posts.");
assert.ok(localIndex.every((post) => post.body === ""), "Production fallback indexes must not inline article bodies.");

const blogDir = path.join(outputDir, "blog");
const articleDirectories = (await readdir(blogDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const renderedArticles = await Promise.all(articleDirectories.map(async (directory) => ({
  directory,
  html: await readOutput(path.join("blog", directory, "index.html")),
})));

const homeCanonical = home.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
assert.ok(homeCanonical, "The home page must expose a canonical URL.");
const siteBaseUrl = new URL(homeCanonical);
const siteBasePath = siteBaseUrl.pathname.endsWith("/") ? siteBaseUrl.pathname : `${siteBaseUrl.pathname}/`;
const recommendedOgImageBytes = 1024 * 1024;
const maxOgImageBytes = 5 * 1024 * 1024;
const validatedOgAssets = new Map();
const oversizedOgAssets = new Map();

function formatMiB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

function readPngDimensions(buffer) {
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== pngSignature) return undefined;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

for (const { directory, html } of renderedArticles) {
  assert.match(html, /"@type":"BlogPosting"/, `${directory} must expose BlogPosting structured data.`);
  assert.match(html, /"@type":"BreadcrumbList"/, `${directory} must expose BreadcrumbList structured data.`);
  assert.match(html, /article:published_time/, `${directory} must expose its Open Graph publication time.`);

  const ogImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1];
  assert.ok(ogImage, `${directory} must render an og:image meta tag.`);
  assert.match(ogImage, /\.(?:avif|jpe?g|png|webp)(?:[?#].*)?$/i, `${directory} must use a raster OG image.`);

  const ogUrl = new URL(ogImage);
  assert.equal(ogUrl.protocol, "https:", `${directory} must use an HTTPS OG image URL.`);
  if (ogUrl.origin !== siteBaseUrl.origin) continue;

  assert.ok(ogUrl.pathname.startsWith(siteBasePath), `${directory} uses an internal OG image outside the configured base path.`);
  const relativeAssetPath = decodeURIComponent(ogUrl.pathname.slice(siteBasePath.length));
  const assetPath = path.resolve(outputDir, relativeAssetPath);
  assert.ok(assetPath.startsWith(`${outputDir}${path.sep}`), `${directory} resolves its OG image outside dist.`);

  let assetContract = validatedOgAssets.get(relativeAssetPath);
  if (!assetContract) {
    const assetStat = await stat(assetPath);
    assert.ok(assetStat.isFile(), `${directory} must reference an OG image file.`);
    assert.ok(
      assetStat.size <= maxOgImageBytes,
      `${directory} OG image is ${formatMiB(assetStat.size)}; the hard limit is ${formatMiB(maxOgImageBytes)}.`,
    );
    if (assetStat.size > recommendedOgImageBytes) {
      oversizedOgAssets.set(relativeAssetPath, assetStat.size);
    }

    let dimensions;
    if (path.extname(assetPath).toLowerCase() === ".png") {
      dimensions = readPngDimensions(await readFile(assetPath));
      assert.ok(dimensions, `${directory} references an invalid PNG OG image.`);
      assert.ok(dimensions.width >= 600 && dimensions.height >= 315, `${directory} OG image is too small (${dimensions.width}x${dimensions.height}).`);
      assert.ok(dimensions.width <= 4096 && dimensions.height <= 4096, `${directory} OG image is too large (${dimensions.width}x${dimensions.height}).`);
    }

    assetContract = { dimensions };
    validatedOgAssets.set(relativeAssetPath, assetContract);
  }

  if (assetContract.dimensions) {
    const declaredWidthValue = html.match(/<meta\b[^>]*property="og:image:width"[^>]*content="([^"]+)"/i)?.[1];
    const declaredHeightValue = html.match(/<meta\b[^>]*property="og:image:height"[^>]*content="([^"]+)"/i)?.[1];
    assert.equal(Boolean(declaredWidthValue), Boolean(declaredHeightValue), `${directory} must declare both OG image dimensions or neither.`);
    if (declaredWidthValue && declaredHeightValue) {
      assert.deepEqual(
        { width: Number(declaredWidthValue), height: Number(declaredHeightValue) },
        assetContract.dimensions,
        `${directory} OG image dimensions must match the rendered metadata.`,
      );
    }
  }
}

for (const [asset, bytes] of oversizedOgAssets) {
  console.warn(`OG image recommendation: ${asset} is ${formatMiB(bytes)}; keep social images at or below ${formatMiB(recommendedOgImageBytes)} when practical.`);
}

console.log(`Site contract check passed: ${localIndex.length} search entries, ${renderedArticles.length} article contracts, and ${validatedOgAssets.size} internal OG assets verified.`);
