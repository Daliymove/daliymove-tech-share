# DesignSystemManifest — Direction A「林间笔记 / 有机手账风」

> 所有高保真产物必须严格引用本文件。配色采用 oklch + hex 双标注。

## 1. 设计主张
保留站点原有的"森林 / 生长"气质，但去掉紫蓝渐变与默认字体。底色暖化为**纸感米白**，主色收敛为**苔藓绿**，辅以克制的**暖木色**。标题用有性格的衬线（Fraunces + 思源宋体），正文用非默认的人文无衬线（Manrope + 思源黑体）。用一条"林间小径"脉络线 + 手写感下划线作为签名元素，替代原有的气泡图。

**明确规避**（命中禁止清单的默认审美）：紫 / 蓝紫渐变、Inter/Roboto/Arial、奶油底+高对比衬线+赤陶橙、近黑底+单一酸性绿、报纸风零圆角密排。本系统为"米白纸感 + 苔藓绿 + 暖木色"，属有意选择，非模型惯性。

---

## 2. 配色系统（Color）

### 浅色 Light
| 角色 | 名称 | HEX | OKLCH |
|---|---|---|---|
| 背景 | paper | `#F7F3EA` | `oklch(0.95 0.018 95)` |
| 背景-次 | paper-2 | `#EFE9DC` | `oklch(0.91 0.022 92)` |
| 文字-主 | ink | `#232B22` | `oklch(0.22 0.025 145)` |
| 文字-次 | ink-soft | `#4A564A` | `oklch(0.37 0.025 145)` |
| 文字-弱 | ink-faint | `#646E62` | `oklch(0.45 0.022 145)` |
| 主色 | moss | `#4F7A52` | `oklch(0.56 0.10 150)` |
| 主色-深 | moss-deep | `#3A5C3E` | `oklch(0.45 0.09 150)` |
| 主色-浅 | moss-pale | `#E4EBDD` | `oklch(0.91 0.035 145)` |
| 辅色-暖 | bark | `#9A6B3F` | `oklch(0.55 0.09 65)` |
| 辅色-暖浅 | bark-pale | `#F1E6D6` | `oklch(0.90 0.04 70)` |
| 描边 | line | `#DCD3C2` | `oklch(0.85 0.025 95)` |

### 深色 Dark
| 角色 | 名称 | HEX | OKLCH |
|---|---|---|---|
| 背景 | paper | `#161B16` | `oklch(0.20 0.015 150)` |
| 背景-次 | paper-2 | `#1E241D` | `oklch(0.26 0.018 150)` |
| 文字-主 | ink | `#E9ECE2` | `oklch(0.92 0.02 145)` |
| 文字-次 | ink-soft | `#B9C2B0` | `oklch(0.74 0.025 145)` |
| 文字-弱 | ink-faint | `#8A9382` | `oklch(0.58 0.022 145)` |
| 主色 | moss | `#88B189` | `oklch(0.72 0.09 150)` |
| 主色-深 | moss-deep | `#6E9B70` | `oklch(0.64 0.10 150)` |
| 主色-浅 | moss-pale | `#243024` | `oklch(0.25 0.03 150)` |
| 辅色-暖 | bark | `#C99A6A` | `oklch(0.70 0.08 65)` |
| 描边 | line | `#2C3429` | `oklch(0.30 0.02 150)` |

**色彩权重规则**：moss 为唯一强调色，仅用于 CTA、激活态、脉络线节点、关键词下划线；bark 仅用于极少量暖色点缀（如"置顶"标记、blockquote 左侧）。背景永远以 paper / paper-2 为主，卡片用半透明白 `rgba(255,255,255,0.6)`（深色 `rgba(255,255,255,0.04)`）。**禁止**任何紫、蓝、橙红渐变。

---

## 3. 字体系统（Typography）

| 角色 | 拉丁 | 中文 | 字重 | 用途 |
|---|---|---|---|---|
| 显示 / 标题 | **Fraunces** (optical) | **Noto Serif SC** | 500 / 600 / 700 | H1–H3、品牌字、引文 |
| 正文 | **Manrope** | **Noto Sans SC** | 400 / 500 / 600 / 700 | 段落、导航、按钮 |
| 等宽 / 标注 | **IBM Plex Mono** | — | 400 / 500 | 日期、kbd、标签元信息、眉标 |

> 均通过 Google Fonts 引入（原型阶段）；生产环境建议自托管以控字体闪烁。

### 字号梯度（Type Scale）
| Token | 值 | 行高 | 用途 |
|---|---|---|---|
| `--fs-hero` | `clamp(2.6rem, 6vw, 4rem)` | 1.08 | 首屏主标题（Fraunces 600） |
| `--fs-h1` | `2.25rem` | 1.15 | 页内大标题 |
| `--fs-h2` | `1.75rem` | 1.2 | 区块标题 |
| `--fs-h3` | `1.25rem` | 1.3 | 卡片标题 / 子标题 |
| `--fs-lead` | `1.0625rem` (17px) | 1.75 | 正文 / 首屏副文 |
| `--fs-meta` | `0.8125rem` (13px) | 1.5 | 元信息、日期（mono） |
| `--fs-label` | `0.75rem` (12px) | 1.4 | 眉标（uppercase + letter-spacing 0.16em） |

---

## 4. 间距 / 圆角 / 阴影 / 容器

- **间距标尺（4px 基准）**：`--sp-1:4` `--sp-2:8` `--sp-3:12` `--sp-4:16` `--sp-5:24` `--sp-6:32` `--sp-7:48` `--sp-8:64` `--sp-9:96`（单位 px）
- **圆角**：`--r-sm:8` `--r-md:14` `--r-lg:20` `--r-xl:28` `--r-pill:999`（px）
- **阴影（无蓝调）**：
  - `--sh-soft: 0 10px 30px rgba(35,43,34,0.07)`
  - `--sh-lift: 0 18px 50px rgba(35,43,34,0.12)`
- **容器**：`--maxw: 72rem`（1152px），左右内边距 `--sp-5`（移动端 `--sp-4`）。
- **过渡**：默认 `160ms ease`；尊重 `prefers-reduced-motion`。

---

## 5. 组件规范与交互状态（ComponentSpec）

### 5.1 Button（主 / 次）
- **primary**：底色 `moss`，文字 `paper`（深底浅字）；hover → `moss-deep` + `translateY(-1px)` + `--sh-lift`；active → `moss-deep` 无位移；focus-visible → 2px `moss` outline + 4px offset；disabled → 降透明度 0.45、禁指针。
- **secondary**：透明底 + `line` 描边 + `ink-soft` 文字；hover → 描边变 `moss`、文字变 `moss`；focus-visible 同 primary。

### 5.2 PostCard（文章卡）
- **default**：`paper`/白卡 + `line` 描边 + `--sh-soft`；标题 `ink`，分类 pill 用 `moss-pale` 底 + `moss` 字。
- **hover**：`translateY(-2px)` + `--sh-lift` + 描边 `moss`；标题变色 `moss`。
- **focus-within**：整卡焦点环（卡片内链接聚焦时显示 2px `moss` outline）。
- **featured**：略大内边距，左侧 3px `moss` 竖条。
- **pinned**：`bark-pale` 极淡底 + `bark` 左侧细条 + 右上"置顶"角标（非橙红，用 `bark` 文字 + `moss` 圆点）。

### 5.3 CategoryItem（分类项）
- default：行布局，左侧圆点（moss），右侧计数 `ink-faint`。
- hover：背景 `moss-pale`，文字 `moss-deep`。
- active（当前分类）：底色 `ink`、文字 `paper`。

### 5.4 TagChip（标签）
- default：`paper-2` 底 + `ink-soft` 字 + `#tag` 前缀（mono）。
- hover/focus：底 `moss-pale`、字 `moss-deep`、描边 `moss`。

### 5.5 SectionHeading（区块标题）
- 结构：眉标（label，mono/uppercase，moss）+ 主标题（Fraunces）+ 右侧元信息（meta，ink-faint）。
- 下方留 `--sp-6` 间距再接内容。

### 5.6 SiteHeader（顶栏）
- sticky，半透明 `paper` + 背景模糊 + `line` 底描边 + `--sh-soft`。
- 品牌标 `dM` 用 `moss → moss-deep` 实色渐变（非紫蓝）。
- 导航激活态：pill 底 `ink` 文字 `paper`（深底浅字）或 `moss` 底。
- 含搜索（⌘K）、RSS、深浅色切换。

### 5.7 Footer
- `paper-2` 面板 + `line` 描边，左品牌右链接，文字 `ink-soft`。

### 5.8 签名元素 —「林间小径」脉络线
- 一条 2px `moss-pale` 竖向线，文章列表每项左侧一个 `moss` 实心圆点（节点），hover 时圆点放大并出现 `mark` 光晕。
- 首屏关键词下方：手写感波浪下划线（内联 SVG，`moss` 描边，`stroke-linecap:round`）。

---

## 6. 图标（Inline SVG，禁止 emoji）
统一 1.5 stroke 线性图标，集合：home / article / grid / tag / search / user / sun / moon / rss / arrow-right / pin / book / code / layers / spark / clock / arrow-down。颜色继承 `currentColor`。

---

## 7. 可访问性基线
- 正文对比度 ≥ WCAG AA（ink on paper ≈ 13.5:1）。
- 所有交互元素 ≥ 44×44px 命中区。
- 焦点可见（focus-visible 环）。
- 语义化 `header/nav/main/section/article/footer`，跳转链接（skip-link）。
- 尊重 `prefers-reduced-motion`。
