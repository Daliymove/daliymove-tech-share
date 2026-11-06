# 本站视觉语言

> 更新日期：2026-11-06

## 规范来源

本站采用 **Quiet Signal** 核心视觉语言，唯一规范源为 `quiet-signal-design` skill 中的 `references/SPEC.md`（版本 0.1.0，2026-08-23 批准）。

此前站点自行维护的《daliyMove 技术分享站设计规范》（松绿/中性灰配色、卡片网格、脉络线、圆角与阴影体系）已整体作废，不再作为实现或验收依据。本文只记录实现层的映射与未定义边界，不复述也不扩张核心规范。

## 实现层映射

| 层次 | 位置 | 职责 |
|---|---|---|
| Reference Value / Core Style Token | 外部 `SPEC.md` 第 3–4 节 | 定义颜色、字体角色、空间关系、几何、动效的语义与原始值 |
| Web 实现变量 | `src/styles/global.css` 的 `--qs-*` | 把核心 Token 落为 CSS 变量，供深浅两套主题共享 |
| 语义工具类 | `tailwind.config.mjs` | 把变量映射为 `canvas` / `surface` / `ink` / `line` / `signal` 与 `font-display` / `font-body` / `font-mono` |
| 版式与组件 | `src/pages/`、`src/layouts/`、`src/components/` | 本站的具体页面决策，不属于核心规范 |

实现约定：

- 基础单位 `u = 8px`，满足 `inline(8) < block(16) < group(32) < section(64) < canvas(80)` 的空间层级关系。
- 大结构与横线相接处为直角；只有按钮、输入框、复制控件等独立小表面使用 `4px` 轻圆角。默认无阴影，仅目录抽屉与图片灯箱等真实浮层使用低对比阴影。
- 紫色 `#7C3AED` 只用于主 CTA、当前导航状态、焦点与 hover 反馈；不用于大面积铺色、渐变或长篇正文。
- 字体使用系统回退栈，不加载外部 Web Font；Display（中文衬线）、Body（无衬线）、Metadata（等宽 + 字距）三种声音在字体回退后仍可区分。
- 动效标尺 `160 / 220 / 300ms`，统一缓动 `cubic-bezier(0.22, 1, 0.36, 1)`；无循环装饰动画，`prefers-reduced-motion` 下全部关闭。

## 未定义边界

- 核心规范只定义浅色近白体系，**未定义深色主题**。`src/styles/global.css` 中的 `:root.dark` 是本站为保留既有主题切换功能而做的实现层兼容反相，不属于 Quiet Signal 核心规范，也不应被当作通用规则复用。
- 该 skill 未提供 Web Kit；断点、具体字号、触控目标与安全区由本站实现自行决定，属于页面决策而非核心规范。
- 核心规范未定义页面结构。本站保留文章、分类、标签、关于、搜索、404 与 RSS 等既有功能与路由，仅按"信息岛而非卡片墙、一条主要阅读轴、有限信号"重写版式。

## 功能契约

`scripts/check-site-contract.mjs` 中的功能性校验（canonical、RSS、sitemap、OG 元数据、Pagefind 索引、搜索回退索引）继续有效。此前与旧视觉语言绑定的断言（logo 文件、卡片封面类名、已移除字体族）已删除；不依赖外部字体 CDN 作为工程约束保留。

## 验收

- 运行 `pnpm build`，以及 `pnpm links`、`pnpm contracts`。
- 对照 `SPEC.md` 第 7 节禁止项与第 8 节综合表现逐项检查，并分别抓取浅色/深色与窄屏渲染结果核对。
