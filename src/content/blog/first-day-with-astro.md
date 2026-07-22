---
title: "用 Astro 搭建个人博客的第一天"
description: "记录从技术选型到内容集合、页面结构、搜索方案的第一版搭建思路。"
pubDate: 2026-07-09
category: "编程"
tags:
  - Astro
  - TypeScript
  - 前端
  - 博客搭建
featured: true
cover: "/images/posts/astro-day.svg"
draft: false
---

## 选择 Astro 的理由

个人博客以内容为中心，页面大多是静态的。Astro 的默认输出非常轻，适合这种场景：文章页面不需要把整个前端应用都发给浏览器。

这一版的目标很明确：本地写 Markdown，本地运行预览，构建后得到一个可以部署的静态站点。

## 内容集合

Astro Content Collections 可以给 Markdown 加上类型约束。这样每篇文章都必须包含标题、摘要、发布日期、分类和标签，后续生成列表页、分类页和搜索索引都会更稳。

```ts
const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()),
  }),
});
```

## 页面结构

第一版页面先覆盖最常用的阅读路径：

- 首页展示定位、精选文章、最新文章和主题入口
- 文章列表页负责归档
- 分类页和标签页负责浏览
- 文章详情页负责阅读体验
- 搜索页负责快速定位内容

## 后续可以扩展什么

等文章数量起来以后，可以继续补 RSS、站点地图、评论、部署流水线和图片管理。现在先让写作链路顺起来，这比一开始把系统做得很重更重要。
