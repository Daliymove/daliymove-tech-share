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

## 构建与搜索

Pagefind 搜索索引会在构建后生成：

```powershell
pnpm build
pnpm preview
```

然后访问 `/search/` 使用本地全文搜索。开发模式下也会自动回退到本地文章索引。

## 写文章

在 `src/content/blog/` 下新增 Markdown 或 MDX 文件，并使用下面的 Frontmatter：

```yaml
---
title: "文章标题"
description: "文章摘要"
pubDate: 2026-07-10
category: "编程"
tags:
  - JavaScript
  - 学习笔记
featured: false
draft: false
---
```

`draft: true` 的文章不会出现在构建结果里。

## 目录结构

```text
src/
  components/      可复用组件
  content/blog/    Markdown/MDX 文章
  layouts/         页面布局
  lib/             站点配置和文章工具函数
  pages/           Astro 路由页面
  styles/          全局样式
```

## 后续可扩展

- RSS 和 sitemap
- 在线部署到 Netlify、Vercel 或 GitHub Pages
- 图片管理与封面图
- 评论系统
- 文章系列和上一篇/下一篇导航
