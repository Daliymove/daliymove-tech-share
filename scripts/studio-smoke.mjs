import assert from "node:assert/strict";
import { readFile, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import {
  StudioError,
  assetsDir,
  contentDir,
  createPost,
  deletePost,
  listAssets,
  listPosts,
  parsePost,
  readPost,
  saveAsset,
  trashDir,
  updatePost,
} from "../src/studio/post-store.mjs";
import { studioApi } from "../src/studio/studio-api.mjs";

const SMOKE_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const createdSlugs = [];
const results = [];

function pass(label) {
  results.push(label);
  console.log(`  ok  ${label}`);
}

function mockRequest(method, url, body, remoteAddress = "127.0.0.1") {
  const stream = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]);
  stream.method = method;
  stream.url = url;
  stream.socket = { remoteAddress };
  return stream;
}

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end(payload) {
      this.body = payload;
    },
  };
}

async function callApi(middleware, method, url, body, remoteAddress) {
  const req = mockRequest(method, url, body, remoteAddress);
  const res = mockResponse();
  await middleware(req, res);
  const payload = res.body ? JSON.parse(res.body) : {};
  return { status: res.statusCode, ...payload };
}

async function expectStudioError(label, status, action) {
  await assert.rejects(action, (error) => {
    assert.ok(error instanceof StudioError, `${label}: 应抛出 StudioError`);
    assert.equal(error.status, status, `${label}: 期望状态码 ${status}`);
    return true;
  });
  pass(label);
}

async function main() {
  console.log("P0 创作台读写闭环验证\n");

  const initialPosts = await listPosts();
  assert.ok(initialPosts.length > 0, "文章列表应能读取现有文章");
  assert.ok(initialPosts.every((post) => typeof post.mtimeMs === "number"), "每篇文章应带 mtimeMs 乐观锁");
  pass(`读取现有 ${initialPosts.length} 篇文章及其乐观锁字段`);

  const legacy = await readPost("FDE-study-line");
  assert.ok(legacy.data.title, "历史大写 slug 应可读");
  pass("读取含大写字母的历史 slug（FDE-study-line）");

  await expectStudioError("新建仍拒绝大写文件名（400）", 400, () =>
    createPost({ slug: "Bad-Name", title: "probe" }));

  const slug = `studio-smoke-${Date.now().toString(36)}`;
  createdSlugs.push(slug);
  const created = await createPost({
    slug,
    title: "P0 创作台冒烟测试",
    description: "验证模板创建、frontmatter 序列化与写回。",
    category: "前端与工具",
    tags: ["冒烟测试"],
  });
  assert.equal(created.slug, slug);
  assert.equal(created.data.draft, true, "新建文章必须是草稿");
  assert.equal(created.data.title, "P0 创作台冒烟测试");
  assert.ok(created.body.includes("## 这篇文章想解决什么问题"), "正文应来自 new-post.md 模板");
  const createdSource = await readFile(path.join(contentDir, `${slug}.md`), "utf8");
  assert.ok(createdSource.includes("# ogImage:"), "模板注释应被保留");
  assert.doesNotMatch(createdSource, /^cover:/m, "未选择封面时不应写出 cover 字段");
  parsePost(createdSource);
  pass("一键新建：模板正文、草稿状态、注释保留、YAML 可解析");

  const reread = await readPost(slug);
  assert.equal(reread.data.title, created.data.title);
  pass("按 slug 读取文章（frontmatter + 原始正文 + mtimeMs）");

  const updated = await updatePost(slug, {
    mtimeMs: created.mtimeMs,
    data: { title: "标题已修改", draft: false, tags: ["冒烟测试", "P0"], cover: "/images/posts/peitu1.png" },
    body: "## 一级标题\n\n正文已更新。\n\n### 二级标题\n\n结论。\n",
  });
  assert.equal(updated.data.title, "标题已修改");
  assert.equal(updated.data.draft, false);
  assert.equal(updated.data.cover, "/images/posts/peitu1.png");
  assert.equal(updated.slug, slug, "改标题不得改变 slug");
  assert.ok(updated.body.includes("正文已更新"));
  await stat(path.join(contentDir, `${slug}.md`));
  pass("编辑写回：改标题、改正文、设封面、发布，文件名保持不变");

  await expectStudioError("乐观锁拒绝过期写入（409）", 409, () =>
    updatePost(slug, { mtimeMs: created.mtimeMs + 1_000_000, data: { title: "冲突写入" } }));

  const beforeInvalid = await readFile(path.join(contentDir, `${slug}.md`), "utf8");
  await expectStudioError("校验拒绝非法标题（422）", 422, () =>
    updatePost(slug, { data: { title: "x".repeat(101) } }));
  await expectStudioError("校验拒绝非法分类（422）", 422, () =>
    updatePost(slug, { data: { category: "不存在的分类" } }));
  await expectStudioError("校验拒绝标题层级跳跃（422）", 422, () =>
    updatePost(slug, { body: "## 二级\n\n#### 四级\n" }));
  await expectStudioError("校验拒绝 SVG 作为 ogImage（422）", 422, () =>
    updatePost(slug, { data: { ogImage: "/images/posts/weekly-review.svg" } }));
  const afterInvalid = await readFile(path.join(contentDir, `${slug}.md`), "utf8");
  assert.equal(beforeInvalid, afterInvalid, "校验失败时文件不得被写入");
  pass("四次校验失败均未落盘，文件字节未变化");

  await expectStudioError("拒绝路径穿越式 slug", 400, () =>
    createPost({ slug: "../evil", title: "非法路径" }));

  const assets = await listAssets();
  assert.ok(assets.length > 0, "应能列出已有封面资产");
  assert.ok(assets.every((asset) => asset.path.startsWith("/images/posts/")), "封面路径必须是站内绝对路径");
  pass(`列出 ${assets.length} 个已有封面资产`);

  const asset = await saveAsset(slug, { fileName: "cover.png", base64: SMOKE_PNG });
  assert.ok(asset.path.startsWith(`/images/posts/${slug}/`));
  const assetFile = path.join(assetsDir, slug, path.basename(asset.path));
  await stat(assetFile);
  await expectStudioError("拒绝伪造扩展名的图片", 400, () =>
    saveAsset(slug, { fileName: "cover.png", base64: Buffer.from("not an image").toString("base64") }));
  await expectStudioError("拒绝 SVG 上传", 400, () =>
    saveAsset(slug, { fileName: "cover.svg", base64: Buffer.from("<svg/>").toString("base64") }));
  pass("封面上传：服务端重命名、magic bytes 校验、拒绝 SVG");

  let middleware;
  studioApi().configureServer({
    middlewares: {
      use(mountPath, handler) {
        assert.equal(mountPath, "/api/studio");
        middleware = handler;
      },
    },
  });
  assert.equal(typeof middleware, "function", "configureServer 应注册中间件");
  const plugin = studioApi();
  assert.equal(plugin.apply, "serve", "插件必须只在 dev 生效");

  const listResponse = await callApi(middleware, "GET", "/posts");
  assert.equal(listResponse.status, 200);
  assert.ok(listResponse.posts.some((post) => post.slug === slug));
  pass("GET  /api/studio/posts → 200");

  const detailResponse = await callApi(middleware, "GET", `/posts/${slug}`);
  assert.equal(detailResponse.status, 200);
  assert.equal(detailResponse.post.data.title, "标题已修改");
  pass("GET  /api/studio/posts/:slug → 200");

  const httpSlug = `studio-smoke-http-${Date.now().toString(36)}`;
  createdSlugs.push(httpSlug);
  const createResponse = await callApi(middleware, "POST", "/posts", {
    slug: httpSlug,
    title: "HTTP 新建验证",
    description: "通过 HTTP 接口创建。",
    category: "前端与工具",
  });
  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.post.data.draft, true);
  pass("POST /api/studio/posts → 201（HTTP 新建草稿）");

  const updateResponse = await callApi(middleware, "PUT", `/posts/${httpSlug}`, {
    mtimeMs: createResponse.post.mtimeMs,
    data: { title: "HTTP 标题修改" },
  });
  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.post.data.title, "HTTP 标题修改");
  pass("PUT  /api/studio/posts/:slug → 200（HTTP 修改标题）");

  const assetsResponse = await callApi(middleware, "GET", "/assets");
  assert.equal(assetsResponse.status, 200);
  assert.ok(assetsResponse.assets.length > 0);
  pass("GET  /api/studio/assets → 200");

  const uploadResponse = await callApi(middleware, "POST", "/assets", {
    slug: httpSlug,
    fileName: "cover.png",
    base64: SMOKE_PNG,
  });
  assert.equal(uploadResponse.status, 201);
  assert.ok(uploadResponse.asset.path.startsWith(`/images/posts/${httpSlug}/`));
  pass("POST /api/studio/assets → 201（HTTP 上传封面）");

  const remoteResponse = await callApi(middleware, "GET", "/posts", undefined, "192.168.1.20");
  assert.equal(remoteResponse.status, 403);
  pass("非本机请求 → 403");

  const missingResponse = await callApi(middleware, "GET", "/unknown");
  assert.equal(missingResponse.status, 404);
  pass("未知接口 → 404");

  const conflictResponse = await callApi(middleware, "PUT", `/posts/${httpSlug}`, {
    mtimeMs: createResponse.post.mtimeMs + 1_000_000,
    data: { title: "冲突" },
  });
  assert.equal(conflictResponse.status, 409);
  pass("HTTP 乐观锁冲突 → 409");

  const deleteSlug = `studio-smoke-del-${Date.now().toString(36)}`;
  createdSlugs.push(deleteSlug);
  const deleteCreateResponse = await callApi(middleware, "POST", "/posts", {
    slug: deleteSlug,
    title: "Delete probe",
    description: "Verify the delete endpoint.",
    category: "前端与工具",
  });
  assert.equal(deleteCreateResponse.status, 201);
  const deleteResponse = await callApi(middleware, "DELETE", `/posts/${deleteSlug}`, {});
  assert.equal(deleteResponse.status, 200);
  assert.equal(deleteResponse.result.deleted, true);
  pass("DELETE /api/studio/posts/:slug → 200（HTTP 删除草稿）");

  const draftDeletion = await deletePost(httpSlug);
  assert.equal(draftDeletion.deleted, true);
  assert.equal(draftDeletion.draft, true);
  await assert.rejects(
    () => stat(path.join(contentDir, `${httpSlug}.md`)),
    (error) => error.code === "ENOENT",
  );
  await stat(path.join(trashDir, path.basename(draftDeletion.backup)));
  pass("删除草稿：移出内容目录并生成可恢复备份");

  await expectStudioError("删除已发布文章需二次确认（409）", 409, () => deletePost(slug));
  const publishedDeletion = await deletePost(slug, { confirmSlug: slug });
  assert.equal(publishedDeletion.deleted, true);
  assert.equal(publishedDeletion.draft, false);
  await stat(path.join(trashDir, path.basename(publishedDeletion.backup)));
  pass("已发布文章：确认 slug 后可删除并备份");

  const renameSlug = `studio-smoke-rename-${Date.now().toString(36)}`;
  const renamedSlug = `${renameSlug}-renamed`;
  createdSlugs.push(renameSlug, renamedSlug);
  const renameCreated = await createPost({ slug: renameSlug, title: "Rename probe", description: "Verify file renaming.", category: "前端与工具" });
  const renamed = await updatePost(renameSlug, {
    mtimeMs: renameCreated.mtimeMs,
    data: { title: "Renamed probe" },
    newSlug: renamedSlug,
  });
  assert.equal(renamed.slug, renamedSlug);
  assert.equal(renamed.data.title, "Renamed probe");
  await stat(path.join(contentDir, `${renamedSlug}.md`));
  await assert.rejects(
    () => stat(path.join(contentDir, `${renameSlug}.md`)),
    (error) => error.code === "ENOENT",
  );
  pass("重命名：保存时改写文件名，旧文件移除并生成备份");

  await expectStudioError("重命名拒绝非法文件名（400）", 400, () =>
    updatePost(renamedSlug, { newSlug: "Bad Name" }));
  await expectStudioError("重命名拒绝同名冲突（409）", 409, () =>
    updatePost(renamedSlug, { newSlug: "first-day-with-astro" }));
  pass("重命名：非法文件名与同名冲突均被拒绝");

  console.log(`\nP0 验证通过：${results.length} 项检查全部通过。`);
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error("\nP0 验证失败：", error);
} finally {
  for (const slug of createdSlugs) {
    await rm(path.join(contentDir, `${slug}.md`), { force: true });
    await rm(path.join(contentDir, `${slug}.mdx`), { force: true });
    await rm(path.join(assetsDir, slug), { recursive: true, force: true });
    try {
      for (const backup of await readdir(trashDir)) {
        if (backup.startsWith(slug)) await rm(path.join(trashDir, backup), { force: true });
      }
    } catch {
      // No recovery folder exists when no deletion test ran.
    }
  }
  console.log(`已清理 ${createdSlugs.length} 个测试文章、上传目录与回收备份。`);
}
process.exitCode = exitCode;
