# UI 特效审查报告 — daliyMove 博客

> 审查时间：2026-07-30 ｜ 审查范围：`src/styles/global.css`、`BaseLayout.astro`、`PostLayout.astro`、`PostCard.astro`、`index.astro`、`blog/index.astro`、`search.astro`
> 结论：整体完成度高于常见个人博客（reduced-motion 全覆盖、IO 渐显、focus trap 齐全），但有 **1 个签名元素丢失、1 个导航 bug、3 个性能/体验问题**值得优先处理。

---

## P0 — 实际缺陷（建议尽快修）

### 1. 签名元素 `.kw` 手绘波浪下划线已丢失 🔴
- **现象**：首页 Hero「沉淀成<span class="kw">可复用的分享</span>」引用了 `.kw`，但 `src/styles/global.css` 中**没有任何 `.kw` 定义**——该元素当前无任何视觉效果。
- **证据**：旧构建产物 `dist/_astro/BaseLayout.Bj9S-B-w.css` 中还存在 `.kw` 规则（SVG 波浪 `background-image`，`#4F7A62` / 深色 `#A5C0A3`），当前 src 已丢失。设计系统 §5.8 明确把它列为签名元素。
- **修法**：把旧产物中的两条 `.kw` 规则（含 `:root.dark` 变体）补回 `global.css` 即可。

### 2. 页面退出动画拦截了「当前页 + 锚点」链接 🔴
- **位置**：`BaseLayout.astro` 234–247 行。
- **现象**：点击形如 `/blog/#section` 的链接（路径 = 当前页、仅 hash 不同）时，`target.href !== location.href` 判定通过 → `preventDefault` + 170ms 淡出 + **整页刷新**，而不是原生平滑滚动到锚点。
- **修法**：比较时去掉 hash：`if (target.origin === location.origin && target.pathname === location.pathname) return;`

### 3. 每次站内导航白付 ~0.5s 淡入淡出税 🔴
- **现象**：退出 170ms + 入场 360ms，每次点导航都完整支付；且 234 行对**每个 `<a>` 单独挂监听器**（归档页上百个链接 = 上百个闭包）。
- **评估**：入场渐显有价值，退出淡出的感知收益很低、延迟成本真实。
- **修法**（按收益排序）：
  1. 退出延迟 170ms → 100ms 以内，或直接删掉退出淡出（保留入场）；
  2. 改用 `document` 上的**事件委托**（单个监听器，`event.target.closest("a")`）；
  3. 进阶：Chrome 126+ 可用跨文档 View Transitions（`@view-transition { navigation: auto }`）做渐进增强。

---

## P1 — 性能与体验

### 4. 主题切换瞬间「半明半暗」
- `body` 的 `background-color/color` 有 320ms 过渡，但卡片、头部、按钮全是 Tailwind `dark:` 类——**瞬时切换**。结果是切换后 320ms 内页面底色在渐变、卡片已跳变，视觉上是撕裂的。
- **修法**：去掉 body 的 color/background 过渡（全站瞬时切换最干净），或反过来给关键 surface 变量统一加过渡；进阶可用 View Transitions 做圆形展开。

### 5. 阅读进度条末端无限 glow 是持续重绘源
- `.reading-progress::after` 的 `progress-glow` 动画的是 `box-shadow`——每帧触发 paint，2.4s 无限循环，页面可见期间一直在烧。
- **修法**：改成静态光晕（一次性 box-shadow），或只动画 `opacity`（可合成）；也可以只在滚动中亮、静止 3s 后熄灭。

### 6. Lightbox 打开时页面横向跳动（Windows 明显）
- `document.body.style.overflow = "hidden"` 让滚动条消失，内容瞬间右移 ~15px。
- **修法**：`html { scrollbar-gutter: stable }`（一行解决），或打开时给 body 补 `padding-right: 滚动条宽度`。

### 7. 衬线标题栈在 Windows 上落到 SimSun
- PatchLog #6 说注入了 Google Fonts，但当前 `BaseLayout.astro` head 里**已没有任何字体链接**（dist 首页也确认无）；tailwind 栈是 `ui-serif → Songti SC → STSong → SimSun`。
- 结果：macOS = 宋体-简，Windows = 中易宋体（大字号下笔画发虚），与设计系统承诺的 Fraunces + Noto Serif SC 差距大。Hero 大标题是第一眼元素，平台观感分裂值得处理。
- **修法**：自托管子集化的 Noto Serif SC（仅标题字符集，woff2 约 100–200KB）放 `public/fonts` + `@font-face`，兼顾大陆访问与观感一致。

---

## P2 — 打磨项

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| 8 | 卡片扫光 `420ms` 超过自己 QA 定的 0.2–0.3s 微交互标准 | `global.css:733` | hover 反馈降到 300ms 内；580ms/900ms 的入场动画可保留 |
| 9 | 深色模式下扫光是 `rgba(255,255,255,.28)` 白渐变，暗卡上偏"闪光" | `global.css:285` | 深色换成 moss 色系低透明度渐变 |
| 10 | `.heading-anchor` 仅 hover 显示，触屏永远不可见 | `global.css:445` | `@media (hover: none)` 下 `opacity: .45` 常显 |
| 11 | 归档筛选直接 `hidden` 切换，生硬 | `blog/index.astro` | 加 150ms 淡出再切换，或 `View Transitions` |
| 12 | `is-compact` 只加阴影，没真正"compact" | `global.css:271` | 联动收紧 header padding（如 py-3→py-2），滚动时释放纵向空间 |
| 13 | `.post-card` hover 位移双写（Tailwind `hover:-translate-y-1` + `.motion-ready .post-card.is-revealed:hover`），`.post-card::after` 定义分散两处 | `PostCard.astro:19` / `global.css:279,731` | 合并去重，防未来改一处漏一处 |
| 14 | CSS 选择器依赖中文 aria-label 前缀 `a[aria-label^="阅读文章"]` | `global.css:752` | 改 `data-*` 属性钩子，文案改动不会弄丢特效 |

---

## 已经做得好的（不用动）

- `prefers-reduced-motion` 覆盖非常完整（含 glow、trail、reveal 的专项降级）
- reveal 用 IntersectionObserver + `unobserve`，delay 用 `min()` 封顶 240ms，节制
- 滚动监听 rAF 节流 + `{ passive: true }`，进度条走 `scaleX` transform 不触发 layout
- Lightbox 有 focus trap、`inert` 背景、Esc/焦点归还，远超平均水平
- bfcache `pageshow` 复位 `is-page-leaving`，移动端关闭 backdrop-filter，细节意识好

## 建议落地顺序

1. **补回 `.kw`**（5 分钟，签名元素复活）→ 2. **修锚点链接拦截 bug** → 3. **导航淡出提速/删除 + 事件委托** → 4. **scrollbar-gutter**（一行）→ 5. 主题切换统一瞬时 → 6. glow 改静态 → 7. 自托管衬线字体。
