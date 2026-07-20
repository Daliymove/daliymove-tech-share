# daliyMove技术分享

一个本地运行的技术分享博客，使用 Astro、TypeScript、Markdown/MDX、Tailwind CSS、Shiki 和 Pagefind 构建。

## 本地运行

如果系统已经安装 Node.js 和 pnpm，可以使用：

```powershell
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
category: "前端"
tags: ["Astro", "实践"]
cover: "/images/posts/example/cover.webp" # 可选
series: "个人博客搭建"        # 可选
featured: false
pinned: false
draft: false
---
```

`draft: true` 不会进入页面、RSS、站点地图和搜索索引；`pinned` 与 `featured` 会优先出现在文章列表。

## 图片资源规范

- 文章图片：`public/images/posts/<文章-slug>/`，例如 `public/images/posts/astro-first-day/cover.webp`
- 站点和默认分享图：`public/images/og/`
- 在文章中以 `/images/posts/<文章-slug>/file.webp` 引用；构建会自动处理 GitHub Pages 的项目路径。
- 建议为封面提供 1200×630 的 WebP/PNG，并保留有意义的文件名和 `alt` 文本。

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
