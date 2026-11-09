type PostSummary = {
  slug: string;
  title: string;
  pubDate: string;
  category: string;
  tags: string[];
  draft: boolean;
  pinned: boolean;
  mtimeMs: number;
};

type PostDetail = {
  slug: string;
  data: Record<string, unknown>;
  body: string;
  mtimeMs: number;
};

type Asset = { path: string; name: string; size: number };
type ApiError = Error & { status?: number; details?: string[] };

type MarkdownPattern = { before: string; after: string; placeholder: string; block?: boolean };

const markdownPatterns: Record<string, MarkdownPattern> = {
  h2: { before: "## ", after: "", placeholder: "小标题", block: true },
  h3: { before: "### ", after: "", placeholder: "小标题", block: true },
  bold: { before: "**", after: "**", placeholder: "加粗文本" },
  italic: { before: "*", after: "*", placeholder: "斜体文本" },
  code: { before: "`", after: "`", placeholder: "code" },
  fence: { before: "```ts\n", after: "\n```", placeholder: "// 代码", block: true },
  link: { before: "[", after: "](https://)", placeholder: "链接文字" },
  list: { before: "- ", after: "", placeholder: "列表项", block: true },
  quote: { before: "> ", after: "", placeholder: "引用", block: true },
  image: { before: "![", after: "](/images/posts/)", placeholder: "图片说明" },
};

function setup(root: HTMLElement) {
  const apiBase = root.dataset.apiBase ?? "/api/studio";
  const blogBase = root.dataset.blogBase ?? "/blog";
  const siteBase = (root.dataset.siteBase ?? "/").replace(/\/$/, "");

  const required = <T extends Element>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`创作台缺少元素：${selector}`);
    return element;
  };

  const list = required<HTMLElement>('[data-role="post-list"]');
  const count = required<HTMLElement>('[data-role="post-count"]');
  const filter = required<HTMLInputElement>('[data-role="filter"]');
  const editor = required<HTMLElement>('[data-role="editor"]');
  const empty = required<HTMLElement>('[data-role="empty"]');
  const errors = required<HTMLElement>('[data-role="errors"]');
  const slugLabel = required<HTMLElement>('[data-role="slug"]');
  const saveState = required<HTMLElement>('[data-role="save-state"]');
  const bodyInput = required<HTMLTextAreaElement>('[data-role="body"]');
  const coverSelect = required<HTMLSelectElement>('[data-field="cover"]');
  const coverPreview = required<HTMLImageElement>('[data-role="cover-preview"]');
  const fileInput = required<HTMLInputElement>('[data-role="file"]');
  const openPostLink = required<HTMLAnchorElement>('[data-role="open-post"]');
  const newButton = required<HTMLButtonElement>('[data-action="new"]');
  const saveButton = required<HTMLButtonElement>('[data-action="save"]');
  const reloadButton = required<HTMLButtonElement>('[data-action="reload"]');
  const uploadButton = required<HTMLButtonElement>('[data-action="upload"]');
  const deleteButton = required<HTMLButtonElement>('[data-action="delete"]');
  const toggleFields = required<HTMLButtonElement>('[data-action="toggle-fields"]');
  const fieldsPanel = required<HTMLElement>('[data-role="fields"]');
  const fieldsSummary = required<HTMLElement>('[data-role="fields-summary"]');

  const field = <T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(name: string) =>
    required<T>(`[data-field="${name}"]`);

  let posts: PostSummary[] = [];
  let assets: Asset[] = [];
  let current: PostDetail | null = null;
  let dirty = false;
  let saving = false;
  let pendingSwitchSlug: string | null = null;
  let deleteArmed = false;

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    });
    const payload = await response.json().catch(() => ({})) as { error?: string; details?: string[] };
    if (!response.ok) {
      const error = Object.assign(new Error(payload.error ?? `请求失败（${response.status}）`), {
        status: response.status,
        details: payload.details,
      }) as ApiError;
      throw error;
    }
    return payload as unknown as T;
  }

  function showError(error: unknown) {
    const apiError = error as ApiError;
    const message = apiError instanceof Error ? apiError.message : String(error);
    const paragraph = document.createElement("p");
    paragraph.textContent = apiError.status === 409
      ? `${message} 可点击「放弃修改」重新载入最新版本。`
      : message;
    errors.replaceChildren(paragraph);
    if (apiError.details?.length) {
      const listElement = document.createElement("ul");
      for (const detail of apiError.details) {
        const item = document.createElement("li");
        item.textContent = detail;
        listElement.append(item);
      }
      errors.append(listElement);
    }
    errors.hidden = false;
  }

  function clearErrors() {
    errors.replaceChildren();
    errors.hidden = true;
  }

  function setSaveState(text: string) {
    saveState.textContent = text;
  }

  function setBusy(isBusy: boolean) {
    saving = isBusy;
    for (const button of [newButton, saveButton, reloadButton, uploadButton, deleteButton]) button.disabled = isBusy;
  }

  function markDirty() {
    if (!current || saving) return;
    dirty = true;
    setSaveState("有未保存的修改");
  }

  /** No native dialogs: clicking the same post twice discards unsaved edits. */
  function confirmDiscard(targetSlug: string) {
    if (!dirty) return true;
    if (pendingSwitchSlug === targetSlug) {
      pendingSwitchSlug = null;
      return true;
    }
    pendingSwitchSlug = targetSlug;
    setSaveState("有未保存修改，再次点击同一篇文章可放弃并切换");
    return false;
  }

  function resetDeleteArmed() {
    if (!deleteArmed) return;
    deleteArmed = false;
    deleteButton.textContent = "删除";
    deleteButton.classList.remove("is-armed");
  }

  function asText(value: unknown) {
    return typeof value === "string" || typeof value === "number" ? String(value) : "";
  }

  function asDate(value: unknown) {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    const text = asText(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
  }

  function siteUrl(path: string) {
    return `${siteBase}${path}`;
  }

  /** Let the writing area grow with the content instead of scrolling inside a box. */
  function resizeBody() {
    if (editor.hidden) return;
    const minimum = Math.round(window.innerHeight * 0.62);
    bodyInput.style.height = "auto";
    bodyInput.style.height = `${Math.max(bodyInput.scrollHeight, minimum)}px`;
  }

  function updateFieldsSummary() {
    if (!current) {
      fieldsSummary.textContent = "";
      return;
    }
    const title = asText(current.data.title) || current.slug;
    const category = asText(current.data.category);
    fieldsSummary.textContent = `${current.slug}.md · ${title} · ${category} · ${current.data.draft === true ? "草稿" : "已发布"}`;
  }

  function updateCoverPreview() {
    const value = coverSelect.value;
    if (value && value.startsWith("/")) {
      coverPreview.src = siteUrl(value);
      coverPreview.hidden = false;
    } else {
      coverPreview.removeAttribute("src");
      coverPreview.hidden = true;
    }
  }

  function renderCoverOptions(selected?: string) {
    const options: HTMLOptionElement[] = [new Option("不使用封面", "")];
    const known = new Set<string>();
    for (const asset of assets) {
      known.add(asset.path);
      options.push(new Option(asset.path, asset.path));
    }
    if (selected && !known.has(selected)) options.push(new Option(`${selected}（自定义）`, selected));
    coverSelect.replaceChildren(...options);
    coverSelect.value = selected ?? "";
    updateCoverPreview();
  }

  function renderPostList() {
    const keyword = filter.value.trim().toLowerCase();
    const filtered = posts.filter((post) => {
      if (!keyword) return true;
      return `${post.title} ${post.slug} ${post.tags.join(" ")}`.toLowerCase().includes(keyword);
    });
    const fragment = document.createDocumentFragment();
    for (const post of filtered) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `qs-studio-post${current?.slug === post.slug ? " is-active" : ""}`;
      button.dataset.slug = post.slug;

      const title = document.createElement("span");
      title.className = "qs-studio-post-title";
      title.textContent = post.title || post.slug;

      const meta = document.createElement("span");
      meta.className = "qs-studio-post-meta";
      const date = document.createElement("span");
      date.textContent = post.pubDate || "无日期";
      meta.append(date);
      if (post.draft) {
        const badge = document.createElement("span");
        badge.className = "qs-studio-post-draft";
        badge.textContent = "草稿";
        meta.append(badge);
      }

      button.append(title, meta);
      button.addEventListener("click", () => void openPost(post.slug));
      fragment.append(button);
    }
    list.replaceChildren(fragment);
    list.setAttribute("aria-busy", "false");
    count.textContent = `${filtered.length} / ${posts.length} 篇`;
  }

  const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  /**
   * Dev content-layer sync lags behind a newly written draft. Warm the article
   * URL in the background so "open in new tab" does not land on a 404 page.
   */
  async function warmArticleRoute(url: string) {
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const probe = await fetch(url, { cache: "no-store" });
        if (probe.ok) return;
      } catch {
        // Route is not generated yet; retry after the next watch cycle.
      }
      await wait(400);
    }
  }

  function updateOpenLink() {
    if (!current) {
      openPostLink.removeAttribute("href");
      return;
    }
    const url = `${blogBase}/${encodeURIComponent(current.slug)}/`;
    openPostLink.href = url;
    if (current.data.draft === true) void warmArticleRoute(url);
  }

  function fillForm(post: PostDetail) {
    const data = post.data;
    field<HTMLInputElement>("title").value = asText(data.title);
    field<HTMLTextAreaElement>("description").value = asText(data.description);
    field<HTMLSelectElement>("category").value = asText(data.category);
    field<HTMLInputElement>("pubDate").value = asDate(data.pubDate);
    field<HTMLInputElement>("series").value = asText(data.series);
    field<HTMLInputElement>("tags").value = Array.isArray(data.tags)
      ? (data.tags as unknown[]).map(asText).join(", ")
      : "";
    field<HTMLInputElement>("draft").checked = data.draft === true;
    field<HTMLInputElement>("pinned").checked = data.pinned === true;
    bodyInput.value = post.body;
    slugLabel.textContent = post.slug;
    field<HTMLInputElement>("slug").value = post.slug;
    renderCoverOptions(asText(data.cover) || undefined);
    editor.hidden = false;
    empty.hidden = true;
    updateFieldsSummary();
    resizeBody();
  }

  async function loadPosts() {
    const response = await api<{ posts: PostSummary[] }>("/posts");
    posts = response.posts;
  }

  async function loadAssets() {
    const response = await api<{ assets: Asset[] }>("/assets");
    assets = response.assets;
  }

  async function openPost(slug: string, checkDirty = true) {
    if (checkDirty && !confirmDiscard(slug)) return;
    pendingSwitchSlug = null;
    resetDeleteArmed();
    clearErrors();
    setSaveState("加载中…");
    try {
      const response = await api<{ post: PostDetail }>(`/posts/${encodeURIComponent(slug)}`);
      current = response.post;
      fillForm(current);
      dirty = false;
      setSaveState("已载入");
      renderPostList();
      updateOpenLink();
    } catch (error) {
      setSaveState("载入失败");
      showError(error);
    }
  }

  /** New drafts open with metadata expanded so the file name can be set first. */
  function focusSlugInput() {
    applyFieldsCollapsed(false);
    const slugInput = field<HTMLInputElement>("slug");
    slugInput.focus();
    slugInput.select();
  }

  async function createPost() {
    // Silent: reuse an untouched template draft, otherwise create one. Unsaved
    // edits are saved first so nothing is lost, and no native dialog is shown.
    if (dirty && !(await save())) return;
    pendingSwitchSlug = null;
    resetDeleteArmed();
    const blankDraft = posts.find((post) => post.draft && post.title === "在这里写文章标题");
    if (blankDraft) {
      await openPost(blankDraft.slug, false);
      focusSlugInput();
      setSaveState(`已打开空白草稿 ${blankDraft.slug}，可填写文件名`);
      return;
    }
    clearErrors();
    setBusy(true);
    setSaveState("创建中…");
    try {
      const response = await api<{ post: PostDetail }>("/posts", {
        method: "POST",
        body: JSON.stringify({}),
      });
      await loadPosts();
      current = response.post;
      fillForm(current);
      dirty = false;
      renderPostList();
      updateOpenLink();
      setSaveState("草稿已创建，先填写保存文件名再保存");
      focusSlugInput();
    } catch (error) {
      setSaveState("创建失败");
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  async function deleteCurrent() {
    if (!current || saving) return;
    const slug = current.slug;
    const isDraft = current.data.draft === true;
    // Drafts are removed immediately. Published posts need one in-page confirm.
    if (!isDraft && !deleteArmed) {
      deleteArmed = true;
      deleteButton.textContent = "确认删除";
      deleteButton.classList.add("is-armed");
      setSaveState("已发布文章：再次点击「确认删除」执行，切换文章可取消");
      return;
    }
    resetDeleteArmed();
    const confirmSlug = isDraft ? undefined : slug;
    clearErrors();
    setBusy(true);
    setSaveState("删除中…");
    try {
      await api<{ result: { slug: string } }>(`/posts/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        body: JSON.stringify({ confirmSlug }),
      });
      current = null;
      dirty = false;
      await loadPosts();
      renderPostList();
      if (posts.length > 0) {
        await openPost(posts[0].slug, false);
      } else {
        editor.hidden = true;
        empty.hidden = false;
        slugLabel.textContent = "—";
        openPostLink.removeAttribute("href");
      }
      setSaveState(`已删除 ${slug}，可在 .workbuddy/studio-trash 恢复`);
    } catch (error) {
      setSaveState("删除失败");
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  function collectData(): Record<string, unknown> {
    const data: Record<string, unknown> = {
      title: field<HTMLInputElement>("title").value.trim(),
      description: field<HTMLTextAreaElement>("description").value.trim(),
      pubDate: field<HTMLInputElement>("pubDate").value,
      category: field<HTMLSelectElement>("category").value,
      tags: field<HTMLInputElement>("tags").value
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      pinned: field<HTMLInputElement>("pinned").checked,
      draft: field<HTMLInputElement>("draft").checked,
      cover: coverSelect.value || null,
      series: field<HTMLInputElement>("series").value.trim() || null,
    };
    // Keep fields that the UI does not expose instead of silently dropping them.
    for (const key of ["updatedDate", "ogImage"]) {
      if (current?.data[key] !== undefined) data[key] = current.data[key];
    }
    return data;
  }

  async function save(): Promise<boolean> {
    if (!current || saving) return false;
    const requestedSlug = field<HTMLInputElement>("slug").value.trim();
    const newSlug = requestedSlug && requestedSlug !== current.slug ? requestedSlug : undefined;
    if (newSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(newSlug)) {
      showError(new Error("文件名只能包含小写字母、数字与连字符，且不能以连字符开头或结尾。"));
      setSaveState("文件名不合法");
      return false;
    }
    clearErrors();
    setBusy(true);
    setSaveState("保存中…");
    try {
      const response = await api<{ post: PostDetail }>(`/posts/${encodeURIComponent(current.slug)}`, {
        method: "PUT",
        body: JSON.stringify({
          mtimeMs: current.mtimeMs,
          data: collectData(),
          body: bodyInput.value,
          newSlug,
        }),
      });
      current = response.post;
      dirty = false;
      slugLabel.textContent = current.slug;
      field<HTMLInputElement>("slug").value = current.slug;
      updateFieldsSummary();
      await loadPosts();
      renderPostList();
      updateOpenLink();
      setSaveState(`已保存 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`);
      return true;
    } catch (error) {
      setSaveState("保存失败");
      showError(error);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function uploadCover(file: File) {
    if (!current) return;
    if (file.size > 5 * 1024 * 1024) {
      showError(new Error("图片超过 5 MiB 限制。"));
      return;
    }
    clearErrors();
    setBusy(true);
    setSaveState("上传中…");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...Array.from(bytes.subarray(offset, offset + 0x8000)));
      }
      const response = await api<{ asset: { path: string; size: number } }>("/assets", {
        method: "POST",
        body: JSON.stringify({ slug: current.slug, fileName: file.name, base64: btoa(binary) }),
      });
      assets.push({ path: response.asset.path, name: file.name, size: response.asset.size });
      renderCoverOptions(response.asset.path);
      dirty = true;
      setSaveState("封面已上传，记得保存文章");
    } catch (error) {
      setSaveState("上传失败");
      showError(error);
    } finally {
      setBusy(false);
      fileInput.value = "";
    }
  }

  function applyMarkdown(action: string) {
    const pattern = markdownPatterns[action];
    if (!pattern) return;
    const start = bodyInput.selectionStart;
    const end = bodyInput.selectionEnd;
    const selected = bodyInput.value.slice(start, end);
    const needsNewline = pattern.block && start > 0 && bodyInput.value[start - 1] !== "\n";
    const before = needsNewline ? `\n${pattern.before}` : pattern.before;
    const content = selected || pattern.placeholder;
    bodyInput.setRangeText(`${before}${content}${pattern.after}`, start, end, "end");
    const contentStart = start + before.length;
    bodyInput.focus();
    bodyInput.setSelectionRange(contentStart, contentStart + content.length);
    markDirty();
    resizeBody();
  }

  for (const input of root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[data-field]")) {
    input.addEventListener("input", markDirty);
    input.addEventListener("change", markDirty);
  }
  coverSelect.addEventListener("change", updateCoverPreview);
  bodyInput.addEventListener("input", () => {
    markDirty();
    resizeBody();
  });
  filter.addEventListener("input", renderPostList);

  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-md]")) {
    button.addEventListener("click", () => applyMarkdown(button.dataset.md ?? ""));
  }

  newButton.addEventListener("click", () => void createPost());
  saveButton.addEventListener("click", () => void save());
  reloadButton.addEventListener("click", () => {
    if (current) void openPost(current.slug, false);
  });
  uploadButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) void uploadCover(file);
  });

  const fieldsStorageKey = "studio.fields.collapsed";

  function applyFieldsCollapsed(collapsed: boolean, persist = true) {
    fieldsPanel.hidden = collapsed;
    fieldsSummary.hidden = !collapsed;
    toggleFields.textContent = collapsed ? "展开" : "收起";
    toggleFields.setAttribute("aria-expanded", String(!collapsed));
    if (persist) {
      try {
        localStorage.setItem(fieldsStorageKey, collapsed ? "1" : "0");
      } catch {
        // Storage is optional; the collapse still works for this session.
      }
    }
  }

  toggleFields.addEventListener("click", () => applyFieldsCollapsed(!fieldsPanel.hidden));
  deleteButton.addEventListener("click", () => void deleteCurrent());
  try {
    // Collapse article metadata by default so the writing area owns the page.
    const stored = localStorage.getItem(fieldsStorageKey);
    applyFieldsCollapsed(stored === null ? true : stored === "1", false);
  } catch {
    applyFieldsCollapsed(true, false);
  }

  document.addEventListener("keydown", (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
    if (!root.contains(document.activeElement)) return;
    event.preventDefault();
    void save();
  });

  window.addEventListener("resize", resizeBody);
  window.addEventListener("beforeunload", (event) => {
    if (dirty) event.preventDefault();
  });

  void (async () => {
    try {
      await Promise.all([loadPosts(), loadAssets()]);
      renderPostList();
      if (posts.length > 0) await openPost(posts[0].slug, false);
      else {
        empty.textContent = "暂无文章，点击「新建草稿」开始。";
        setSaveState("等待新建文章");
      }
    } catch (error) {
      showError(error);
      setSaveState("接口连接失败");
    }
  })();
}

function initStudio() {
  const root = document.querySelector<HTMLElement>("[data-studio-app]");
  if (!root || root.dataset.studioBound === "true") return;
  root.dataset.studioBound = "true";
  try {
    setup(root);
  } catch (error) {
    console.error("[studio] 初始化失败：", error);
  }
}

document.addEventListener("astro:page-load", initStudio);
initStudio();
