import { copyFile, mkdir, readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const contentDir = path.join(projectRoot, "src", "content", "blog");
export const assetsDir = path.join(projectRoot, "public", "images", "posts");
export const templatePath = path.join(projectRoot, "docs", "templates", "new-post.md");
// Gitignored recovery folder: deleted posts are moved here instead of being lost.
export const trashDir = path.join(projectRoot, ".workbuddy", "studio-trash");

// Mirrors src/lib/categories.ts. Keep this list in sync when categories change.
export const categories = ["AI 工程", "前端与工具", "知识与学习", "个人系统"];

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Historical article files predate the lowercase convention (e.g. FDE-study-line.md).
// Locating an existing file must therefore accept uppercase letters and underscores.
const existingSlugPattern = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const postExtensionPattern = /\.(?:md|mdx)$/i;
const optionalFields = new Set(["updatedDate", "cover", "ogImage", "series", "pinned", "draft"]);
const knownFields = ["title", "description", "pubDate", "updatedDate", "category", "tags", "cover", "ogImage", "series", "pinned", "draft"];
const rasterImagePattern = /\.(?:avif|jpe?g|png|webp)(?:[?#].*)?$/i;
const assetExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

export class StudioError extends Error {
  constructor(message, status = 400, details) {
    super(message);
    this.name = "StudioError";
    this.status = status;
    this.details = details;
  }
}

function fail(message, status = 400, details) {
  throw new StudioError(message, status, details);
}

/** Only for new files and explicit renames: enforce the canonical lowercase slug. */
function assertSlug(slug) {
  if (typeof slug !== "string" || slug.length === 0 || slug.length > 80 || !slugPattern.test(slug)) {
    fail("文件名只能使用小写字母、数字与连字符，且不超过 80 个字符。");
  }
}

/** For reading/editing existing files: accept legacy names, still block path traversal. */
function assertExistingSlug(slug) {
  if (typeof slug !== "string" || slug.length === 0 || slug.length > 120 || !existingSlugPattern.test(slug)) {
    fail("文章标识不合法：只能包含字母、数字、连字符与下划线。");
  }
}

function postPath(slug, extension = ".md") {
  assertExistingSlug(slug);
  const resolved = path.resolve(contentDir, `${slug}${extension}`);
  if (!resolved.startsWith(`${contentDir}${path.sep}`)) fail("非法的文章路径。", 400);
  return resolved;
}

async function fileExists(filePath) {
  try {
    const info = await stat(filePath);
    return info.isFile();
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function findPostFile(slug) {
  for (const extension of [".md", ".mdx"]) {
    const candidate = postPath(slug, extension);
    if (await fileExists(candidate)) return candidate;
  }
  return undefined;
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDate(value, field, issues) {
  const raw = value instanceof Date ? formatLocalDate(value) : String(value ?? "").trim();
  if (!raw) {
    issues.push(`${field} 不能为空。`);
    return undefined;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.valueOf())) {
      issues.push(`${field} 必须是 YYYY-MM-DD 日期。`);
      return undefined;
    }
    return formatLocalDate(parsed);
  }
  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.valueOf()) || formatLocalDate(parsed) !== raw) {
    issues.push(`${field} 不是有效日期：${raw}`);
    return undefined;
  }
  return raw;
}

function checkHeadingLevels(body, issues) {
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
    if (depth > previousDepth + 1) issues.push(`正文标题层级从 H${previousDepth} 跳到 H${depth}，会导致 SEO 校验失败。`);
    previousDepth = depth;
  }
}

/**
 * Mirrors the zod schema in src/content.config.ts plus the content checks in
 * scripts/check-content-seo.mjs. The Node-side store cannot import astro:content,
 * so the constraints are intentionally duplicated in one place.
 */
export function validatePost(rawData, body) {
  const issues = [];
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) fail("frontmatter 必须是对象。", 422);
  if (typeof body !== "string") fail("正文必须是字符串。", 422);

  const result = {};
  const text = (field, min, max) => {
    const value = rawData[field];
    if (typeof value !== "string" || value.trim().length < min || value.length > max) {
      issues.push(`${field} 必须是 ${min}–${max} 个字符的字符串。`);
      return;
    }
    result[field] = value;
  };

  text("title", 1, 100);
  text("description", 1, 220);
  result.pubDate = normalizeDate(rawData.pubDate, "pubDate", issues);

  if (rawData.updatedDate !== undefined && rawData.updatedDate !== null && rawData.updatedDate !== "") {
    result.updatedDate = normalizeDate(rawData.updatedDate, "updatedDate", issues);
    if (result.pubDate && result.updatedDate && result.updatedDate < result.pubDate) {
      issues.push("updatedDate 不能早于 pubDate。");
    }
  }

  if (!categories.includes(rawData.category)) {
    issues.push(`category 必须是以下之一：${categories.join("、")}。`);
  } else {
    result.category = rawData.category;
  }

  const tags = rawData.tags ?? [];
  if (!Array.isArray(tags) || tags.length > 8 || tags.some((tag) => typeof tag !== "string" || tag.trim().length < 1 || tag.length > 30)) {
    issues.push("tags 最多 8 个，每项为 1–30 个字符的字符串。");
  } else {
    result.tags = tags;
  }

  if (rawData.cover !== undefined && rawData.cover !== null && rawData.cover !== "") {
    if (typeof rawData.cover !== "string" || !rawData.cover.startsWith("/")) issues.push('cover 必须是以 "/" 开头的站内路径。');
    else result.cover = rawData.cover;
  }

  if (rawData.ogImage !== undefined && rawData.ogImage !== null && rawData.ogImage !== "") {
    const image = rawData.ogImage;
    const valid = typeof image === "string"
      && (image.startsWith("/") || /^https:\/\//i.test(image))
      && rasterImagePattern.test(image);
    if (!valid) issues.push("ogImage 必须是站内绝对路径或 HTTPS 光栅图片（avif/jpg/png/webp）。");
    else result.ogImage = image;
  }

  if (rawData.series !== undefined && rawData.series !== null && rawData.series !== "") {
    if (typeof rawData.series !== "string" || rawData.series.length < 1 || rawData.series.length > 60) issues.push("series 必须是 1–60 个字符的字符串。");
    else result.series = rawData.series;
  }

  for (const field of ["pinned", "draft"]) {
    const value = rawData[field];
    if (value !== undefined && typeof value !== "boolean") issues.push(`${field} 必须是布尔值。`);
    else result[field] = value === undefined ? false : value;
  }

  for (const [key, value] of Object.entries(rawData)) {
    if (knownFields.includes(key)) continue;
    if (value === null || ["string", "number", "boolean"].includes(typeof value) || value instanceof Date) result[key] = value;
  }

  checkHeadingLevels(body, issues);
  if (issues.length) fail("文章校验未通过，文件未被写入。", 422, issues);
  return result;
}

export function parsePost(source, filePath = "<memory>") {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) fail(`${filePath} 缺少 frontmatter。`, 422);
  let data;
  try {
    data = YAML.parse(match[1]);
  } catch (error) {
    fail(`${filePath} 的 frontmatter 不是合法 YAML：${error.message}`, 422);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) fail(`${filePath} 的 frontmatter 必须是键值对象。`, 422);
  const comments = match[1].split(/\r?\n/).filter((line) => /^\s*#/.test(line));
  return { data, body: source.slice(match[0].length).replace(/^\r?\n/, ""), comments };
}

export function serializePost(data, body, comments = []) {
  const lines = YAML.stringify(data, { lineWidth: 0 }).trimEnd().split("\n");
  const emitted = new Set(Object.keys(data));
  const keptComments = comments.filter((line) => {
    const key = line.match(/^\s*#\s*([A-Za-z][A-Za-z0-9_]*)\s*:/)?.[1];
    return !(key && emitted.has(key));
  });
  const frontmatter = [...lines, ...keptComments].join("\n");
  const normalizedBody = body.replace(/^\n+/, "").replace(/\s*$/, "\n");
  return `---\n${frontmatter}\n---\n\n${normalizedBody}`;
}

async function atomicWrite(target, content) {
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.studio-${process.pid}-${Math.random().toString(36).slice(2)}.tmp`;
  try {
    await writeFile(temporary, content, "utf8");
    try {
      await rename(temporary, target);
    } catch (error) {
      // Windows: renaming over an existing file requires DELETE sharing, which
      // file watchers / AV scanners may not grant. copyFile only needs write
      // access and still replaces the whole file from the complete temp copy.
      if (!["EPERM", "EACCES", "EEXIST"].includes(error.code)) throw error;
      await copyFile(temporary, target);
    }
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

async function postSummary(fileName, info) {
  const slug = fileName.replace(postExtensionPattern, "");
  const fullPath = path.join(contentDir, fileName);
  const source = await readFile(fullPath, "utf8");
  const parsed = parsePost(source, fullPath);
  const data = parsed.data;
  return {
    slug,
    file: path.relative(projectRoot, fullPath).replace(/\\/g, "/"),
    title: data.title ?? "",
    description: data.description ?? "",
    pubDate: data.pubDate instanceof Date ? formatLocalDate(data.pubDate) : String(data.pubDate ?? ""),
    updatedDate: data.updatedDate instanceof Date ? formatLocalDate(data.updatedDate) : (data.updatedDate ? String(data.updatedDate) : undefined),
    category: data.category ?? "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    cover: data.cover,
    ogImage: data.ogImage,
    series: data.series,
    pinned: data.pinned === true,
    draft: data.draft === true,
    mtimeMs: info.mtimeMs,
  };
}

export async function listPosts() {
  const entries = await readdir(contentDir, { withFileTypes: true });
  const summaries = [];
  for (const entry of entries) {
    if (!entry.isFile() || !postExtensionPattern.test(entry.name)) continue;
    const info = await stat(path.join(contentDir, entry.name));
    summaries.push(await postSummary(entry.name, info));
  }
  return summaries.sort((a, b) => (b.pubDate || "").localeCompare(a.pubDate || "") || a.slug.localeCompare(b.slug));
}

export async function readPost(slug) {
  const file = await findPostFile(slug);
  if (!file) fail(`文章不存在：${slug}`, 404);
  const source = await readFile(file, "utf8");
  const parsed = parsePost(source, file);
  const info = await stat(file);
  return {
    slug,
    file: path.relative(projectRoot, file).replace(/\\/g, "/"),
    data: parsed.data,
    body: parsed.body,
    comments: parsed.comments,
    mtimeMs: info.mtimeMs,
  };
}

function slugify(title) {
  return String(title ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

async function allocateSlug(title, explicit) {
  if (explicit) {
    assertSlug(explicit);
    if (await findPostFile(explicit)) fail(`slug 已存在：${explicit}`, 409);
    return explicit;
  }
  const base = slugify(title) || `post-${formatLocalDate(new Date()).replace(/-/g, "")}`;
  let candidate = base;
  let suffix = 1;
  while (await findPostFile(candidate)) {
    suffix += 1;
    candidate = `${base}-${String(suffix).padStart(2, "0")}`;
  }
  return candidate;
}

/** Creates a draft from docs/templates/new-post.md, preserving template comments. */
export async function createPost(input = {}) {
  const template = await readFile(templatePath, "utf8");
  const { data: templateData, body: templateBody, comments } = parsePost(template, templatePath);
  const today = formatLocalDate(new Date());
  const merged = {
    ...templateData,
    title: input.title ?? templateData.title,
    description: input.description ?? templateData.description,
    pubDate: today,
    updatedDate: today,
    category: input.category ?? templateData.category,
    tags: input.tags ?? templateData.tags,
    pinned: false,
    draft: true,
  };
  for (const field of optionalFields) {
    if (input[field] !== undefined) merged[field] = input[field];
    else if (field !== "updatedDate" && field !== "pinned" && field !== "draft") delete merged[field];
  }
  const body = input.body ?? templateBody;
  const data = validatePost(merged, body);
  const slug = await allocateSlug(input.title, input.slug);
  await atomicWrite(postPath(slug), serializePost(data, body, comments));
  return readPost(slug);
}

/** Updates frontmatter/body, and optionally renames the file via input.newSlug. */
export async function updatePost(slug, input = {}) {
  const file = await findPostFile(slug);
  if (!file) fail(`文章不存在：${slug}`, 404);
  const info = await stat(file);
  if (input.mtimeMs !== undefined && input.mtimeMs !== null) {
    const expected = Number(input.mtimeMs);
    if (!Number.isFinite(expected) || Math.abs(info.mtimeMs - expected) > 2) {
      fail("文章已在其它位置被修改，请刷新后重试（409 冲突）。", 409, { currentMtimeMs: info.mtimeMs });
    }
  }
  const source = await readFile(file, "utf8");
  const parsed = parsePost(source, file);
  const merged = { ...parsed.data, ...(input.data ?? {}) };
  for (const [key, value] of Object.entries(input.data ?? {})) {
    if (value === null) delete merged[key];
  }
  const body = input.body ?? parsed.body;
  const data = validatePost(merged, body);
  const nextSource = serializePost(data, body, parsed.comments);
  const requestedSlug = typeof input.newSlug === "string" ? input.newSlug.trim() : "";

  if (requestedSlug && requestedSlug !== slug) {
    assertSlug(requestedSlug);
    if (await findPostFile(requestedSlug)) fail(`文件名已存在：${requestedSlug}`, 409);
    const extension = path.extname(file).toLowerCase();
    const target = postPath(requestedSlug, extension);
    await atomicWrite(target, nextSource);
    // Keep the old file recoverable before removing it from the collection.
    await mkdir(trashDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    await copyFile(file, path.join(trashDir, `${slug}-renamed-${stamp}${extension}`));
    await unlink(file);
    return readPost(requestedSlug);
  }

  await atomicWrite(file, nextSource);
  return readPost(slug);
}

async function walkAssets(directory, relative, results) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const nextRelative = relative ? `${relative}/${entry.name}` : entry.name;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walkAssets(fullPath, nextRelative, results);
      continue;
    }
    if (!entry.isFile() || !/\.(?:avif|jpe?g|png|webp|svg)$/i.test(entry.name)) continue;
    const info = await stat(fullPath);
    results.push({
      path: `/images/posts/${nextRelative.replace(/\\/g, "/")}`,
      name: entry.name,
      size: info.size,
      mtimeMs: info.mtimeMs,
    });
  }
}

export async function listAssets() {
  const results = [];
  await walkAssets(assetsDir, "", results);
  return results.sort((a, b) => a.path.localeCompare(b.path));
}

function detectRasterExtension(bytes, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (!assetExtensions.has(ext)) return undefined;
  const hex = bytes.subarray(0, 12).toString("hex");
  if (ext === ".png" && hex.startsWith("89504e470d0a1a0a")) return ext;
  if ((ext === ".jpg" || ext === ".jpeg") && hex.startsWith("ffd8ff")) return ext;
  if (ext === ".webp" && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return ext;
  if (ext === ".avif" && bytes.subarray(4, 12).toString("ascii").includes("ftypavif")) return ext;
  return undefined;
}

/** Uploads a raster cover. SVG uploads are rejected because public SVG can execute scripts. */
export async function saveAsset(slug, input = {}) {
  assertExistingSlug(slug);
  const encoded = input.base64;
  if (typeof encoded !== "string" || encoded.length === 0) fail("缺少图片数据 base64。");
  if (encoded.length > 7 * 1024 * 1024) fail("图片超过 5 MiB 限制。", 413);
  let bytes;
  try {
    bytes = Buffer.from(encoded, "base64");
  } catch {
    fail("图片数据不是合法 base64。");
  }
  if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024) fail("图片为空或超过 5 MiB 限制。", 413);
  const extension = detectRasterExtension(bytes, String(input.fileName ?? ""));
  if (!extension) fail("仅支持 png / jpg / webp / avif 光栅图片，且文件内容必须与扩展名一致。");
  const targetDir = path.resolve(assetsDir, slug);
  if (!targetDir.startsWith(`${assetsDir}${path.sep}`)) fail("非法的图片目录。", 400);
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const target = path.join(targetDir, `cover-${stamp}${extension}`);
  await mkdir(targetDir, { recursive: true });
  await writeFile(target, bytes);
  return { path: `/images/posts/${slug}/${path.basename(target)}`, size: bytes.length };
}

/**
 * Removes a post from the content collection by moving it to .workbuddy/studio-trash.
 * Drafts can be removed directly; published posts need an explicit confirmSlug.
 */
export async function deletePost(slug, options = {}) {
  const file = await findPostFile(slug);
  if (!file) fail(`文章不存在：${slug}`, 404);
  const source = await readFile(file, "utf8");
  const { data } = parsePost(source, file);
  const isDraft = data.draft === true;
  if (!isDraft && options.confirmSlug !== slug) {
    fail("删除已发布文章需要在请求体中提供与该 slug 一致的 confirmSlug。", 409, {
      requiresConfirmSlug: true,
      slug,
    });
  }
  await mkdir(trashDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const backup = path.join(trashDir, `${slug}-${stamp}${path.extname(file)}`);
  await writeFile(backup, source, "utf8");
  await unlink(file);
  return {
    slug,
    deleted: true,
    draft: isDraft,
    backup: path.relative(projectRoot, backup).replace(/\\/g, "/"),
  };
}
