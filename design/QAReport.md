# QAReport（最终）

> 原型：`prototype-organic-notebook.html`
> 设计系统版本：Direction A「林间笔记 / 有机手账风」DesignSystemManifest v1
> 检查时间：2026-07-20

---

## 一、AI 味检测（AISlopReport）
> 检测对象：prototype-organic-notebook.html ｜ 总结：0 / 10 项检出

| # | 检测项 | 判定 | 详情 |
|---|--------|------|------|
| 1 | 紫色或蓝紫渐变 | 未检测到 | 仅 moss 绿 + bark 棕渐变，无 hue 240–290° |
| 2 | 三列 icon 卡片 | 未检测到 | 无等宽 icon+title+desc 卡片行 |
| 3 | 奶油底+赤陶橙 | 未检测到 | 主色为苔藓绿；bark 棕仅极小面积点缀，非赤陶橙 |
| 4 | 近黑底+酸性绿/朱红 | 未检测到 | 深底用柔雾绿 #88B189（非酸性绿），且有第二暖色 |
| 5 | 报纸风零圆角 | 未检测到 | 全局 8–28px 圆角 |
| 6 | 默认字体 | 未检测到 | Fraunces + Manrope + IBM Plex Mono + 思源；system-ui 仅作 fallback |
| 7 | 无意义 emoji | 未检测到 | 全部内联 SVG 图标 |
| 8 | lorem / 假数据 | 未检测到 | 真实文章标题/描述/日期/分类/标签 |
| 9 | 无意义 stock 图 | 未检测到 | 封面为内联 SVG 森林母题（装饰 aria-hidden），无 picsum |
| 10 | 千篇一律 dashboard | 未检测到 | 首屏+置顶大卡+小径列表+侧栏，非统计卡网格 |

**状态：通过** ✅

---

## 二、可访问性审查（AccessibilityReport）
> 通过率：4.5 / 5 维度（表单项不适用）

1. **文字对比度**：浅色 `--ink-faint` 原为 #7C8576（对纸底 3.63:1，未达 AA 4.5）——**已修复**为 #646E62（≈5.0:1）。其余组合均 ≥ 4.5:1（正文 14.4:1、moss 关键词 4.56:1、按钮 4.88:1）。
2. **语义化 HTML**：landmarks / 列表 / 图片 alt 均合规。原侧栏 `<h4>` 跳级（h2→h4）——**已修复**改为 `<h3>`。**P2**：分类列表为 `<div>` 容器，建议改为 `<ul><li>` 以增强语义。
3. **键盘可达性**：skip-link 存在；缺 focus-visible 的 `.nav a / .search-pill / .tag` —— **已修复**统一补充 focus ring。Tab 顺序即 DOM 顺序。
4. **动效偏好**：含 `prefers-reduced-motion` 降级 ✅。
5. **表单设计**：原型无表单 —— **不适用**。

**状态：通过（修复后）** ✅

---

## 三、层级与节奏审查（HierarchyRhythmReport）
> 总通过率：11 / 12 子项

- **视觉层级**：字号梯度清晰（hero→h2 1.4→h3 1.17→正文→meta），颜色层级差 ≥0.10，强调色面积 <15% ✅。
- **节奏感**：间距全部取自标尺（sp-1…sp-9），垂直节奏 Section>Block>Element ✅；小径列表以节点圆点制造重复中的变化 ✅。
- **色彩权重**：纸感低饱和 + 苔藓小面积高饱和，≤4 色相，合 60:30:10 ✅。
- **排版节奏**：梯度连续 ✅；正文行高 1.75（CJK 阅读舒适，略高于 1.7 上限，可接受）｜**P2**：body line-height 可微调至 1.7。

**状态：通过（含 1 项 P2 可选优化）**

---

## 四、交互状态审查（InteractionStatesReport）
> 交互元素：btn-primary / btn-ghost / icon-btn×2 / nav a / search-pill / post-card / cat-item / tag ≈ 9 类

| 元素 | default | hover | active | focus | disabled |
|------|------|------|------|------|------|
| btn-primary | ✅ | ✅ | ✅ | ✅ | ✅ 新增 |
| btn-ghost | ✅ | ✅ | ✅ 新增 | ✅ | ✅ 新增 |
| icon-btn | ✅ | ✅ | ✅ 新增 | ✅ | — |
| nav a | ✅ | ✅ | — | ✅ 新增 | — |
| search-pill | ✅ | ✅ | — | ✅ 新增 | — |
| post-card | ✅ | ✅ | — | ✅(focus-within) | — |
| cat-item | ✅ | ✅ | ✅ 新增 | ✅ | — |
| tag | ✅ | ✅ | — | ✅ 新增 | — |

- focus ring 专项：全部可聚焦元素均有 ≥2px moss 环，对比度 ≥3:1 ✅。
- hover/active 差异：active 均含缩放/变色，与 hover 不同 ✅。
- loading/error：无异步/表单，N/A。

**状态：通过（修复后）** ✅

---

## 五、终检独有项

| 子项 | 判定 | 详情 |
|------|------|------|
| 过渡动画 0.2–0.3s | ✅ 通过 | 微交互统一为 .2s（原 .16s 已提至 .2s） |
| 反馈即时性 | ✅ 通过 | hover/active 即时；无异步故无 loading 需求 |
| 悬停目标 ≥44px | ⚠️ 基本通过 | icon-btn 已提至 44px；**P1 已知**：标签 chip 触控高约 33px，移动端略低于 44px（标签云密集场景常见，建议移动端加大纵向 padding） |

---

## 总结

- 总通过率：5 / 5 大类通过（含修复与 2 项 P2 可选优化）。
- 阻塞交付（P0）：**0**。
- 建议修复（P1）：标签触控尺寸（移动端）。
- 可选优化（P2）：① 分类列表改 `<ul><li>`；② body line-height 微调 1.7。

### 交付判定
- [x] **可以交付** —— 所有 P0 已修复，对比度 / 焦点 / 状态 / AI 味均达标；P1/P2 为非阻塞可选项。
