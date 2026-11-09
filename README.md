# daliyMove技术分享

一个本地运行的技术分享博客，使用 Astro、TypeScript、Markdown/MDX、Tailwind CSS、Shiki 和 Pagefind 构建。

## 本地运行

如果系统已经安装 Node.js 和 pnpm，可以使用：

```powershell
corepack enable
corepack prepare pnpm@10.18.3 --activate
pnpm install
pnpm dev
```

默认访问地址：

```text
http://127.0.0.1:4321
```

## 构建、搜索与校验

构建会生成静态页面、`sitemap-index.xml`、RSS 和 Pagefind 全文索引：

```powershell
pnpm build
pnpm links       # 检查构建产物中的内部链接
pnpm verify      # 构建并检查链接
pnpm content:seo # 检查正文标题层级与社交图字段
pnpm run audit          # 阻断 Critical 级别依赖告警
pnpm run audit:report   # 报告 Moderate 及以上依赖告警
pnpm preview
```

访问 `/search/` 使用全文搜索；`Ctrl/Cmd + K` 可从任意页面直达搜索框。开发模式会回退到本地文章索引。

## 写文章

从 [`docs/templates/new-post.md`](docs/templates/new-post.md) 复制模板到 `src/content/blog/`，或新增 Markdown / MDX 文件。支持的 Frontmatter：

```yaml
---
title: "文章标题"
description: "用一句话说明文章解决的问题"
pubDate: 2026-07-20
updatedDate: 2026-07-20       # 可选
category: "前端与工具"
tags: ["Astro", "实践"]
cover: "/images/posts/example/cover.webp" # 可选
ogImage: "/images/posts/covers/og-default.webp" # 可选；1536×1024 的社交分享图
series: "个人博客搭建"        # 可选
pinned: false
draft: false
---
```

`draft: true` 不会进入页面、RSS、站点地图和搜索索引；`pinned` 会进入首页和文章归档的置顶区域。

`category` 只能使用 `src/lib/categories.ts` 中定义的正式分类；分类显示名、URL slug 和颜色均由该文件统一维护。

## 本地创作台（仅开发态）

运行 `pnpm dev` 时，`astro.config.mjs` 通过 `vite.plugins` 注入一组**仅在本机开发服务器**存在的接口，用于读写文章与封面。插件设置了 `apply: "serve"`，`pnpm build` 与 GitHub Pages 产物中不含任何写接口；接口也只接受来自 `127.0.0.1` / `::1` 的请求。

| 方法 | 接口 | 说明 |
| --- | --- | --- |
| GET | `/api/studio/posts` | 列出全部文章（含草稿）与 `mtimeMs` |
| GET | `/api/studio/posts/<slug>` | 读取 frontmatter、原始正文与 `mtimeMs` |
| POST | `/api/studio/posts` | 以 `docs/templates/new-post.md` 为模板新建草稿 |
| PUT | `/api/studio/posts/<slug>` | 写回 frontmatter 与正文；可带 `newSlug` 重命名文件 |
| GET | `/api/studio/assets` | 列出可选封面 |
| POST | `/api/studio/assets` | 上传封面（`slug` + `fileName` + `base64`） |
| DELETE | `/api/studio/posts/<slug>` | 删除文章（已发布文章需带 `confirmSlug`） |

约定：

- 新建文章默认 `draft: true`。`slug` 由标题生成（纯中文标题回退为 `post-YYYYMMDD`），也可显式指定；**新建与主动改名**仅允许小写字母、数字与连字符。
- 历史文章中已含大写字母的文件名（如 `FDE-study-line.md`）仍可正常读取、编辑、删除与上传封面，不会被强制改名，以免破坏既有 URL。
- 修改标题不会改变文件名与文章 URL；需要改名时应单独重命名并同步引用。
- `PUT` 必须带上一次 `GET` 返回的 `mtimeMs` 作为乐观锁，冲突返回 409。
- 写入前按 `src/content.config.ts` 的字段约束与 `scripts/check-content-seo.mjs` 的标题层级规则校验，失败返回 422 且不落盘；可选字段传 `null` 表示删除。
- 上传仅接受 png / jpg / webp / avif 光栅图（≤ 5 MiB），服务端校验 magic bytes 并重命名文件，返回路径可直接写入 `cover`。

运行 `pnpm studio:smoke` 可验证完整读写闭环（自动创建并清理临时测试文章）。

`pnpm dev` 时导航会出现「创作」，进入 `/studio/`（dev 下完整地址为 `/daliymove-tech-share/studio/`，从导航进入会自动带 base）使用两栏工作台：左栏文章列表与筛选，右栏按「文章信息 / 正文」分组的编辑区。点击「新建草稿」即按模板创建 `.md` 文件；`Ctrl / ⌘ + S` 保存；封面可从已有资产选择或上传；编辑条上的「新标签打开」会在独立标签页打开文章页，不再内嵌预览。草稿仅在本机开发环境可见（dev 下临时放开文章路由的草稿过滤，客户端会后台预热路由，避免刚新建时打开 404）。生产构建中导航入口、编辑器与写接口均不存在，`/studio/` 只保留一个 `noindex` 说明页且不进入 sitemap。

编辑细节：

- 「文章信息」分组头提供「收起 / 展开」，**默认收起**让正文占据主要空间，折叠时显示当前文章标题摘要；状态保存在 `localStorage`，折叠只隐藏表单 DOM，字段值仍会随保存一起写回。正文输入框按内容自动撑高，不再出现内部滚动条；创作台与全站页面共用 88rem 容器。
- 点击「新建草稿」不弹任何对话框：若已有标题仍为模板占位符的空白草稿，直接打开它；否则直接新建。存在未保存修改时会先静默保存当前文章。切换文章时若有未保存修改，改用「再次点击同一篇文章确认」的页面内提示。
- 编辑条的「删除」：草稿直接删除；已发布文章改为页面内二次确认（按钮变成「确认删除」，再点一次执行），全程不使用浏览器原生弹窗。删除不直接丢弃文件，而是移到 `.workbuddy/studio-trash/`（已在 `.gitignore` 中），可手动恢复。
- 「文章信息」新增「保存文件名」输入框：新建草稿后可直接填写想要的文件名（不含 `.md`），保存时自动重命名文件，旧文件备份到回收目录；仅限小写字母、数字与连字符，重名返回 409。其他文章中指向旧 slug 的链接不会自动改写，重命名后请检查站内引用。
- 全站容器统一为 `88rem`（此前阅读页 `72rem`、创作页 `88rem`），文章正文阅读列仍保持 `44rem` 不变。

## 图片资源规范

- 文章图片：`public/images/posts/<文章-slug>/`，例如 `public/images/posts/astro-first-day/cover.webp`
- 分类封面库：`public/images/posts/covers/` 下按四个正式分类各一张（`ai-engineering.webp`、`frontend-tooling.webp`、`knowledge-learning.webp`、`personal-systems.webp`）。统一为 1536×1024、3:2 的编辑式剪纸拼贴风格，暖白纸感、无文字与水印，新文章可直接引用。
- 专题封面：同目录下另有 5 张专题图（`inference-systems.webp`、`fde-career.webp`、`agri-remote-sensing.webp`、`static-site-content.webp`、`model-attention.webp`），分别对应推理系统、职业转型、遥感农险、静态站点内容结构与模型注意力；与分类封面共用同一视觉语言，供具体文章选用。
- 默认分享图：`public/images/posts/covers/og-default.webp`，由 `src/lib/posts.ts` 的 `defaultImagePath` 引用；`og-ai-tech.webp` 为备用 AI 主题素材。两者由原 `public/images/og/*.png` 压缩为 WebP（q88），**原 `public/images/og/` 路径已废弃，不再使用**。
- 在文章中以 `/images/posts/<文章-slug>/file.webp` 引用；构建会自动处理 GitHub Pages 的项目路径。
- `cover` 仅用于文章正文页，可使用 SVG/WebP/PNG；未设置时正文不会补一张默认大图。
- `ogImage` 仅用于社交分享和搜索引擎预览，建议使用 1200×630 的 PNG/JPG/WebP/AVIF；未设置时会回退到站点默认 WebP 分享图，不会使用 SVG 封面。
- 为图片保留有意义的文件名和 `alt` 文本。

## 目录结构

```text
.github/workflows/ CI 构建、链接检查与 Pages 部署
public/images/     站点分享图与文章静态图片
scripts/           构建产物校验脚本
src/
  components/      可复用组件
  content/blog/    Markdown/MDX 文章
  layouts/         页面布局
  lib/             站点配置和文章工具函数
  pages/           Astro 路由页面（含 RSS）
  styles/          全局样式
```

## 部署

推送 `master` 或 `main` 会触发 GitHub Actions：使用锁定依赖构建、检查内部链接，并发布至 GitHub Pages。站点地址为 <https://daliymove.github.io/daliymove-tech-share/>。
