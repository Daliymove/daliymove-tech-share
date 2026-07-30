# PatchLog

> 关联产物：prototype-organic-notebook.html ｜ DesignSystemManifest.md
> 说明：以下均为原型生成后 QA 阶段的局部 Patch，未整页重写。

## Patch #1
- **时间**：2026-07-20
- **位置**：`prototype-organic-notebook.html` `:root` + `DesignSystemManifest.md` 配色表
- **修改内容**：`--ink-faint` 浅色 `#7C8576` → `#646E62`（oklch 0.58→0.45）
- **原因**：QA 对比度不达标（对纸底 3.63:1 < AA 4.5:1），改为 5.0:1
- **关联产物**：QAReport 第二章
- **AI 味复检**：通过（0/10）

## Patch #2
- **时间**：2026-07-20
- **位置**：`prototype-organic-notebook.html` 侧栏标题 + `.side-block h4` CSS
- **修改内容**：`<h4>` → `<h3>`，CSS 选择器 `.side-block h4` → `.side-block h3`
- **原因**：标题层级跳级（h2→h4），修复为连续 h2→h3
- **关联产物**：QAReport 第二章语义化
- **AI 味复检**：通过

## Patch #3
- **时间**：2026-07-20
- **位置**：`.icon-btn` CSS
- **修改内容**：宽高 `42px` → `44px`（满足移动端 ≥44px 触控）
- **原因**：QA 悬停目标尺寸 P1
- **关联产物**：QAReport 第五章
- **AI 味复检**：通过

## Patch #4
- **时间**：2026-07-20
- **位置**：全局 transition 时长
- **修改内容**：`.16s` → `.2s`（nav / icon-btn / trail 节点 / post-card 标题 / cat-item 等）
- **原因**：对齐微交互 0.2–0.3s 标准
- **关联产物**：QAReport 第五章
- **AI 味复检**：通过

## Patch #5
- **时间**：2026-07-20
- **位置**：交互状态 CSS 块（紧接 `.btn-ghost:focus-visible` 之后）
- **修改内容**：新增
  - `.btn:disabled` / `.btn[disabled]`（opacity .5 + not-allowed）
  - `.btn-ghost:active`（moss-pale 背景）
  - `.icon-btn:active`（scale .96）
  - `.cat-item:active`（scale .99）
  - `.nav a / .search-pill / .tag` 的 `:focus-visible` 环
- **原因**：补齐缺失的 disabled / active / focus 状态（QA 第四章）
- **关联产物**：QAReport 第四章
- **AI 味复检**：通过

## Patch #6（落地到真实 Astro 代码）
- **时间**：2026-07-20
- **位置**：全站代码（非原型）
- **修改内容**：
  - `tailwind.config.mjs`：重定义 `ink`(暖墨)/`leaf`(森林绿=moss)/`amber`；新增 `bark`(暖木)/`paper`(纸感)；`fontFamily` 设 `sans→Manrope+Noto Sans SC`、`display→Fraunces+Noto Serif SC`、`mono→IBM Plex Mono`；阴影去蓝调。
  - `src/styles/global.css`：`:root` 改为纸感米白/暖墨；去掉全部 violet/blue 紫蓝辉光；`body` 字体改新栈；`h1,h2,h3` 统一 Fraunces 衬线；`.brand-mark`/`.reading-progress` 改 `moss→bark`；`.prose-blog` 链接改 moss；`.pinned-*` 改暖纸/bark；新增 `.kw`(手绘波浪下划线) 与 `.trail`/`.trail-item`(林间小径节点线)。
  - `src/layouts/BaseLayout.astro`：head 注入 Google Fonts(Fraunces/Manrope/IBM Plex Mono/Noto Serif SC/Noto Sans SC) + 更新 theme-color。
  - `src/components/PostCard.astro`：顶条 `leaf→blue→violet` 改 `leaf→bark`；系列标签 `bg-blue-*` 改 `bg-bark-*`。
  - `src/pages/index.astro`：删除 Tech Map 气泡图；首屏改纯文字叙事 + `.kw` 关键词下划线；置顶改"主编领读"；最近更新改 `.trail` 节点线列表；侧栏分类/标签减负。
  - `src/layouts/PostLayout.astro` 与 `src/pages/404.astro`：残留 `blue` 渐变/标签改 `bark`。
- **原因**：把 Direction A 设计系统真正落到代码，抹除命中禁止清单的紫蓝渐变与 Inter 默认字体。
- **关联产物**：DesignSystemManifest.md（令牌映射见下）、HandoffBundle.md
- **AI 味复检**：构建校验通过，无新增 AI slop（紫/蓝/橙红渐变已清零）。

## Patch #7
- **时间**：2026-07-30
- **位置**：`src/pages/index.astro` Hero `.kw` span + `src/styles/global.css`（新增 `.kw`/`.kw-wave` 规则、`kw-draw`/`kw-flow` 关键帧、reduced-motion 降级）
- **修改内容**：静态波浪背景图（此前已在代码迁移中丢失）→ 动态手绘波浪：内联 SVG 双路径（主线 + 32% 回声线），入场 `stroke-dashoffset` 描绘（1.05s，错峰 170ms），随后 7s/11s 双速无缝流动（path 按 48px 周期延展，`translateX(-48px)` 无缝循环）；`pathLength="100"` 归一化、`vector-effect="non-scaling-stroke"` 锁定笔宽、`currentColor` 自动适配深浅色
- **原因**：用户反馈静态波浪不够好看，要求动态特效；同时修复审查发现的 `.kw` 样式丢失问题（UI-Effects-Review P0#1）
- **关联产物**：DesignSystemManifest.md §5.8、design/UI-Effects-Review.md
- **AI 味复检**：通过（沿用 moss 主色 + 既有 cubic-bezier(0.22,1,0.36,1) 缓动，reduced-motion 已降级为静态）

### 令牌名映射（文档 ↔ 代码）
| 文档角色 | Tailwind 令牌 | 备注 |
|---|---|---|
| moss 主色 | `leaf-500/600` | 复用原 `leaf` 名，值改为森林绿 |
| moss-deep | `leaf-600/700` | |
| bark 辅色 | `bark-*` | 新增 |
| paper 背景 | `paper-*` + `global.css --surface` | 新增 |
| ink 文字 | `ink-*` | 重定义为暖墨 |
| 手绘下划线 | `.kw` | 新增 CSS 类 |
| 林间小径 | `.trail` / `.trail-item` | 新增 CSS 类 |
