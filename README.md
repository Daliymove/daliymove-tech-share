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
ogImage: "/images/og/posts/example.jpg"   # 可选；1200×630 的社交分享图
series: "个人博客搭建"        # 可选
pinned: false
draft: false
---
```

`draft: true` 不会进入页面、RSS、站点地图和搜索索引；`pinned` 会进入首页和文章归档的置顶区域。

`category` 只能使用 `src/lib/categories.ts` 中定义的正式分类；分类显示名、URL slug 和颜色均由该文件统一维护。

## 图片资源规范

- 文章图片：`public/images/posts/<文章-slug>/`，例如 `public/images/posts/astro-first-day/cover.webp`
- 站点和默认分享图：`public/images/og/`（当前默认图为 `default.png`）
- 在文章中以 `/images/posts/<文章-slug>/file.webp` 引用；构建会自动处理 GitHub Pages 的项目路径。
- `cover` 仅用于文章正文页，可使用 SVG/WebP/PNG；未设置时正文不会补一张默认大图。
- `ogImage` 仅用于社交分享和搜索引擎预览，建议使用 1200×630 的 PNG/JPG/WebP/AVIF；未设置时会回退到站点默认 PNG，不会使用 SVG 封面。
- 为图片保留有意义的文件名和 `alt` 文本。

## 目录结构

```text
.github/workflows/ CI 构建、链接检查与 Pages 部署
public/images/     站点、OG 与文章静态图片
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
