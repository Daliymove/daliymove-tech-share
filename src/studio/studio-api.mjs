import {
  StudioError,
  createPost,
  deletePost,
  listAssets,
  listPosts,
  readPost,
  saveAsset,
  updatePost,
} from "./post-store.mjs";

const MOUNT_PATH = "/api/studio";
const MAX_BODY_BYTES = 7 * 1024 * 1024;
const LOCAL_ADDRESS = /^(?:127\.0\.0\.1|::1|::ffff:127\.0\.0\.1)$/;

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.setHeader("Cache-Control", "no-store");
  res.end(body);
}

function sendError(res, error) {
  if (error instanceof StudioError) {
    if (error.status >= 500) console.error("[studio]", error);
    send(res, error.status, { error: error.message, ...(error.details ? { details: error.details } : {}) });
    return;
  }
  console.error("[studio] Unexpected error:", error);
  send(res, 500, { error: "创作台服务内部错误，请查看 dev server 控制台。" });
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new StudioError("请求体超过大小限制。", 413);
    chunks.push(chunk);
  }
  if (size === 0) return {};
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    return parsed;
  } catch {
    throw new StudioError("请求体必须是 JSON 对象。", 400);
  }
}

function routePath(req) {
  const raw = (req.url ?? "/").split("?")[0];
  return raw.startsWith(MOUNT_PATH) ? raw.slice(MOUNT_PATH.length) : raw;
}

async function dispatch(method, segments, body) {
  const [resource, slug] = segments;

  if (resource === "posts" && segments.length === 1) {
    if (method === "GET") return { status: 200, payload: { posts: await listPosts() } };
    if (method === "POST") return { status: 201, payload: { post: await createPost(body) } };
  }
  if (resource === "posts" && segments.length === 2) {
    if (method === "GET") return { status: 200, payload: { post: await readPost(slug) } };
    if (method === "PUT") return { status: 200, payload: { post: await updatePost(slug, body) } };
    if (method === "DELETE") return { status: 200, payload: { result: await deletePost(slug, body) } };
  }
  if (resource === "assets" && segments.length === 1) {
    if (method === "GET") return { status: 200, payload: { assets: await listAssets() } };
    if (method === "POST") return { status: 201, payload: { asset: await saveAsset(body.slug, body) } };
  }
  return { status: 404, payload: { error: `未知接口：${method} /api/studio/${segments.join("/")}` } };
}

async function handle(req, res) {
  const address = req.socket?.remoteAddress ?? "";
  if (!LOCAL_ADDRESS.test(address)) {
    send(res, 403, { error: "创作台接口仅允许本机访问。" });
    return;
  }
  const method = (req.method ?? "GET").toUpperCase();
  let segments;
  try {
    segments = routePath(req).split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    throw new StudioError("接口路径包含非法编码。", 400);
  }
  const body = ["POST", "PUT", "DELETE"].includes(method) ? await readJson(req) : {};
  const { status, payload } = await dispatch(method, segments, body);
  send(res, status, payload);
}

/**
 * Dev-only REST layer for the local writing studio. The configureServer hook
 * runs exclusively in `astro dev`; `apply: "serve"` keeps it out of builds.
 */
export function studioApi() {
  return {
    name: "studio-local-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(MOUNT_PATH, (req, res) => handle(req, res).catch((error) => sendError(res, error)));
    },
  };
}
