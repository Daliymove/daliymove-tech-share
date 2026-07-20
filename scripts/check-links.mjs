import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "dist");
const base = "/daliymove-tech-share";
const htmlFiles = [];
const failures = [];

async function walk(directory) {
  for (const entry of await readdir(directory)) {
    const fullPath = path.join(directory, entry);
    const info = await stat(fullPath);
    if (info.isDirectory()) await walk(fullPath);
    else if (entry.endsWith(".html")) htmlFiles.push(fullPath);
  }
}

function isExternal(value) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value);
}

function getTargetPath(value, source) {
  const decoded = decodeURIComponent(value.split("#", 1)[0].split("?", 1)[0]);
  if (!decoded) return null;

  if (decoded.startsWith("/")) {
    const sitePath = decoded === base ? "/" : decoded.startsWith(`${base}/`) ? decoded.slice(base.length) : decoded;
    return path.join(outputDir, sitePath.replace(/^\/+/, ""));
  }

  return path.resolve(path.dirname(source), decoded);
}

async function existsAsPageOrFile(target) {
  const candidates = [
    target,
    `${target}.html`,
    path.join(target, "index.html"),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return true;
    } catch {
      // Try the next canonical static-site representation.
    }
  }
  return false;
}

function getAnchorIds(html) {
  return new Set(Array.from(html.matchAll(/\bid=["']([^"']+)["']/gi), ([, id]) => id));
}

await walk(outputDir);

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const documentHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const links = Array.from(documentHtml.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi), ([, url]) => url.trim());

  for (const url of links) {
    if (!url || url.startsWith("#") || isExternal(url) || /^(?:data|javascript):/i.test(url)) continue;
    const target = getTargetPath(url, file);
    if (target && !(await existsAsPageOrFile(target))) {
      failures.push(`${path.relative(outputDir, file)} -> ${url}`);
    }
  }

  for (const [, hash] of documentHtml.matchAll(/\bhref=["']#([^"']+)["']/gi)) {
    if (!getAnchorIds(html).has(hash)) failures.push(`${path.relative(outputDir, file)} -> #${hash} (missing anchor)`);
  }
}

if (failures.length) {
  console.error("Broken internal links found:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`Internal link check passed: ${htmlFiles.length} HTML files scanned.`);
