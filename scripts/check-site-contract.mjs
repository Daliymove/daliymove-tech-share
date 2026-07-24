import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "dist");

async function readOutput(relativePath) {
  return readFile(path.join(outputDir, relativePath), "utf8");
}

const [home, search] = await Promise.all([
  readOutput("index.html"),
  readOutput(path.join("search", "index.html")),
]);

assert.match(home, /images\/logo-marks\/folded-path\.svg/, "The folded-path logo must be used on the home page.");
assert.doesNotMatch(home, /post-card-cover/, "Home post cards must remain text-first.");
assert.doesNotMatch(home, /Fraunces|Manrope/, "Removed font families must not be loaded by the home page.");
await access(path.join(outputDir, "pagefind", "pagefind.js"));

const indexScript = search.match(/<script\b[^>]*\bid=["']local-search-index["'][^>]*>([\s\S]*?)<\/script>/i);
assert.ok(indexScript, "The search page must include its fallback index.");

const localIndex = JSON.parse(indexScript[1]);
assert.ok(localIndex.length > 0, "The fallback index must include published posts.");
assert.ok(localIndex.every((post) => post.body === ""), "Production fallback indexes must not inline article bodies.");

console.log(`Site contract check passed: ${localIndex.length} search entries verified.`);
