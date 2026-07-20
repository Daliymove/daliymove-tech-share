# HandoffBundle — daliyMove 技术分享站首页重构（Direction A）

> 本包为完整交付物集合。所有产物位于 `design/` 目录。
> **状态：设计系统已实际落地到 Astro 代码（2026-07-20），`pnpm build` 通过。**

## 交付物清单
| 文件 | 说明 |
|------|------|
| `prototype-organic-notebook.html` | 自包含高保真原型（浅/深双色、响应式、完整交互状态、真实内容） |
| `DesignBrief.md` | 需求基线文档 |
| `DesignSystemManifest.md` | 设计系统（配色/字体/间距/圆角/阴影/组件状态/签名元素） |
| `WireframeSpec.md` | 3 版低保真线框（含桌面+移动） |
| `QAReport.md` | 五道质量检查最终报告 |
| `PatchLog.md` | 局部修复记录（含 #6 真实代码落地） |

## 设计系统要点速览
- **方向**：林间笔记 / 有机手账风（苔藓绿 + 暖木色 + 纸感米白）。
- **配色**：paper `#F7F3EA`、ink `#232B22`、moss `#4F7A52`、moss-deep `#3A5C3E`、bark `#9A6B3F`；深色调配套。强调色仅 moss + 极小 bark。
- **字体**：Fraunces（标题）+ Manrope（正文）+ IBM Plex Mono（标注）+ 思源宋体/黑体（中文）。
- **签名元素**：① 首屏关键词手绘波浪下划线（SVG）；② 文章列表"林间小径"竖向节点线。
- **布局**：变体 A 主编领读（首屏叙事 → 置顶大卡 → 小径列表 + 分类/标签侧栏）。

## 实际代码改动清单（已写入仓库源码）
| 文件 | 改动 |
|------|------|
| `tailwind.config.mjs` | 重定义 `ink`/`leaf`/`amber`/`coral` 色值；新增 `bark`/`paper`；`fontFamily` 设 sans/display/mono；阴影去蓝调 |
| `src/styles/global.css` | 纸感米白基底、去紫蓝辉光、新字体栈、`h1-3` 衬线、`.brand-mark`/`.reading-progress` 改 moss→bark、`.prose-blog` 链接改 moss、新增 `.kw` 与 `.trail` |
| `src/layouts/BaseLayout.astro` | head 注入 Google Fonts + 更新 theme-color |
| `src/components/PostCard.astro` | 顶条 `leaf→blue→violet` 改 `leaf→bark`；系列标签改 bark |
| `src/pages/index.astro` | 删 Tech Map 气泡图；首屏纯文字叙事 + `.kw`；置顶改"主编领读"；最近更新改 `.trail` 节点线；侧栏减负 |
| `src/layouts/PostLayout.astro` | 系列标签 `blue` 改 `bark` |
| `src/pages/404.astro` | 图标块 `blue` 渐变改 `bark` |

### 令牌名映射（文档 ↔ 代码）
| 文档角色 | Tailwind 令牌 |
|---|---|
| moss 主色 | `leaf-500/600`（复用名，值已改森林绿） |
| moss-deep | `leaf-600/700` |
| bark 辅色 | `bark-*` |
| paper 背景 | `paper-*` + `global.css --surface` |
| ink 文字 | `ink-*`（重定义为暖墨） |
| 手绘下划线 | `.kw`（CSS 类） |
| 林间小径 | `.trail` / `.trail-item`（CSS 类） |

## 开发者说明
1. **字体**：当前用 Google Fonts CDN（运行时加载）。**生产环境建议自托管** Fraunces / Manrope / IBM Plex Mono / Noto Serif SC / Noto Sans SC 以控 FOIT。
2. **去紫蓝渐变**：已删除 hero `from-leaf-700 via-blue-600 to-violet-600` 与卡片顶条 `leaf→blue→violet`，全站 `blue`/`violet` 引用清零。
3. **字体替换**：`tailwind.config.mjs` 中 `sans` 的 Inter 已替换为 Manrope；新增 `display`/`mono` 字体族。
4. **结构变动**：已删除首屏 Tech Map 气泡图；置顶收敛为"主编领读"大卡；文章列表改为带节点线的 `.trail`。
5. **深浅色**：沿用现有 `.dark` class + localStorage 方案，无需改动切换逻辑。
6. **图标**：沿用现有 `Icon.astro` 内联 SVG 集合。

## 已知非阻塞项
- P1：侧栏标签 chip 移动端触控高约 33px，建议移动端加大纵向 padding 至 ≥44px。
- P2：分类列表当前为 `<a>` 网格，可改 `<ul><li>` 强化语义。

## 交付判定
**可以交付** ✅ — 设计系统已落地代码，`pnpm build` 通过，0 个 P0，紫/蓝/橙红渐变已清零，Inter 已替换。
