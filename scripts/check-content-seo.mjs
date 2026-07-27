import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "src", "content", "blog");
const contentFiles = [];
const failures = [];
const allowedCategories = new Set(["AI 工程", "前端与工具", "知识与学习", "个人系统"]);

async function walk(directory) {
  for (const entry of await readdir(directory)) {
    const fullPath = path.join(directory, entry);
    const info = await stat(fullPath);
    if (info.isDirectory()) await walk(fullPath);
    else if (/\.(?:md|mdx)$/i.test(entry)) contentFiles.push(fullPath);
  }
}

function checkHeadings(body, relativePath) {
  let inFence = false;
  let previousDepth = 1;

  for (const line of body.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const heading = line.match(/^(#{1,6})\s+\S/);
    if (!heading) continue;

    const depth = heading[1].length;
    if (depth === 1) {
      failures.push(`${relativePath}: body content must not contain an H1; PostLayout supplies the page H1.`);
      continue;
    }
    if (depth > previousDepth + 1) {
      failures.push(`${relativePath}: heading level jumps from H${previousDepth} to H${depth}.`);
    }
    previousDepth = depth;
  }
}

function checkOgImage(frontmatter, relativePath) {
  const match = frontmatter.match(/^ogImage:\s*["']?(.+?)["']?\s*$/m);
  if (!match) return;

  const image = match[1].trim();
  if (!/^(?:\/|https:\/\/)/.test(image)) {
    failures.push(`${relativePath}: ogImage must be a site-absolute path or HTTPS URL.`);
  }
  if (!/\.(?:avif|jpe?g|png|webp)(?:[?#].*)?$/i.test(image)) {
    failures.push(`${relativePath}: ogImage must reference a raster image, not an SVG or extensionless URL.`);
  }
}

function checkCategory(frontmatter, relativePath) {
  const match = frontmatter.match(/^category:\s*["']?(.+?)["']?\s*$/m);
  if (!match) {
    failures.push(`${relativePath}: category is required.`);
    return;
  }

  const category = match[1].trim();
  if (!allowedCategories.has(category)) {
    failures.push(`${relativePath}: category "${category}" must be one of ${Array.from(allowedCategories).join("、")}。`);
  }
}

function checkDates(frontmatter, relativePath) {
  const pubDate = frontmatter.match(/^pubDate:\s*["']?([^\s"']+)["']?\s*$/m)?.[1];
  const updatedDate = frontmatter.match(/^updatedDate:\s*["']?([^\s"']+)["']?\s*$/m)?.[1];
  const publishedAt = pubDate ? Date.parse(pubDate) : Number.NaN;

  if (!pubDate || Number.isNaN(publishedAt)) {
    failures.push(`${relativePath}: pubDate must be a valid date.`);
    return;
  }

  if (updatedDate) {
    const updatedAt = Date.parse(updatedDate);
    if (Number.isNaN(updatedAt)) failures.push(`${relativePath}: updatedDate must be a valid date.`);
    else if (updatedAt < publishedAt) failures.push(`${relativePath}: updatedDate must not be earlier than pubDate.`);
  }
}

await walk(contentDir);

for (const file of contentFiles) {
  const source = await readFile(file, "utf8");
  const relativePath = path.relative(root, file);
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  try {
    assert.ok(frontmatter, "frontmatter is required");
  } catch (error) {
    failures.push(`${relativePath}: ${error.message}`);
    continue;
  }

  checkHeadings(source.slice(frontmatter[0].length), relativePath);
  checkOgImage(frontmatter[1], relativePath);
  checkCategory(frontmatter[1], relativePath);
  checkDates(frontmatter[1], relativePath);
}

if (failures.length) {
  console.error("Content SEO checks failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Content SEO checks passed: ${contentFiles.length} articles verified.`);
