# daliyMove 技术博客整体成熟度审计

> 审计日期：2026-07-29  
> 审计对象：`master` @ `c3ead56f21fd463875fd7b87d4d2ec185ae71cbf`  
> 审计方式：源码、配置、工作流、构建脚本、静态资产与现有本地产物的只读交叉检查  
> 范围边界：**不评价文章正文质量，不建议新增文章正文审阅、正文 SEO 审查或内容质量发布门禁。** 本报告涉及的分类、Frontmatter、图片和 URL 建议均属于结构化数据或技术契约治理。

## 1. 执行摘要

**综合成熟度：84 / 100。**

结论是：项目已经具备个人技术博客的完整核心闭环，**可以上线，也足以支撑当前 8 篇公开文章规模的持续发布**。首页、文章归档、分类、标签、搜索、RSS、404、草稿隔离、社交元数据、站点地图、GitHub Pages 自动部署和依赖更新机制均已落地；未发现能够证实的 P0 阻断项。

但项目还不宜定义为“完全收口、低维护长期稳定”：新文章模板与 schema 冲突，文章邻接顺序受编辑排序污染，正文封面与 OG 回退混用，`featured` 没有一致的展示语义，分类名已出现碎片化；此外还有 3 项应在交付收口前修复的体验问题，以及构建契约硬编码和资料漂移。

### 最终判定

| 问题 | 结论 |
|---|---|
| 现在能否上线 | **能。** 当前核心访问和发布链路齐全，未发现 P0。 |
| 是否已经“完善得差不多” | **是。** 产品形态和主要工程链路已经成形。 |
| 是否适合长期低维护运营 | **尚差一个收口迭代。** 建议先完成本报告的 P1。 |
| 是否需要评论、账号、CMS 等新功能 | **当前不需要。** 对个人静态博客的投入产出低。 |
| 是否需要立刻分页 | **不需要。** 当前 8 篇文章可继续全量静态渲染，达到增长触发条件后再做。 |
| 是否建议增加文章正文审阅门禁 | **不建议，也不在本次范围内。** |

## 2. 评分

| 维度 | 得分 | 判断 |
|---|---:|---|
| 核心产品完整性 | 18 / 20 | 导航、归档、分类、标签、搜索、RSS、关于、404 均已闭环。 |
| 架构与数据契约 | 16 / 20 | URL/base/canonical 主链路正确；排序、cover、featured 和分类契约仍不一致。 |
| 体验、可访问性与性能 | 16 / 20 | 响应式、主题防闪、搜索状态和灯箱焦点基础较好；缺省封面、移动锚点和回顶焦点需要修复。 |
| 工程质量与验证 | 17 / 20 | 严格 TypeScript、schema、链接/契约脚本和 CI 已具备；契约脚本脆弱，缺少少量针对核心纯逻辑的测试。 |
| 部署与长期运营 | 17 / 20 | 锁定工具链、最小权限 Actions、Dependabot 和 Pages 部署完善；资料、资产和永久链接策略仍需治理。 |
| **总分** | **84 / 100** | **可上线、接近完善；完成 P1 后可进入低维护稳定态。** |

> 分数是针对当前仓库规模和“个人静态技术博客”定位的工程判断，不是通用网站基准。由于本轮无法重新执行构建和浏览器验证，运行态置信度低于静态源码结论。

## 3. 已经做好的部分

### 3.1 产品与信息架构

- 主导航覆盖首页、文章、分类、标签、搜索和关于：`src/lib/site.ts:11-18`。
- 文章归档支持分类筛选、URL 查询参数、历史记录和无结果状态：`src/pages/blog/index.astro:13-47,50-121`。
- 搜索同时具备 Pagefind 和本地索引回退，且处理了加载、失败、空查询和并发结果覆盖：`src/pages/search.astro:280-376`。
- 文章页包含目录、阅读进度、代码复制、图片灯箱、上一篇/下一篇和相关推荐：`src/layouts/PostLayout.astro:95-235,244-455`。
- 相关推荐会排除当前文章，并根据分类、系列和共享标签计分，再按发布时间打破同分：`src/lib/posts.ts:143-157`。

### 3.2 路由、URL 与元数据

- GitHub Pages 的 `site` 与 `base` 配置明确：`astro.config.mjs:15-24`。
- 内部 URL 和绝对 URL 统一经过 `withBase()` / `absoluteUrl()`：`src/lib/posts.ts:8-21`。
- canonical、Open Graph、Twitter Card 和文章时间/分类/标签元数据已完整输出：`src/layouts/BaseLayout.astro:42-80`。
- 文章页提供 `BlogPosting` 与 `BreadcrumbList` 结构化数据：`src/layouts/PostLayout.astro:38-78,93-94`。
- `robots.txt` 指向带项目 base 的站点地图：`public/robots.txt:4`。
- 公开文章、分类和标签静态路由只基于非草稿集合生成：`src/pages/blog/[slug].astro:6-11`、`src/pages/categories/[category].astro:7-12`、`src/pages/tags/[tag].astro:7-12`、`src/lib/posts.ts:79-85`。
- RSS 明确使用纯发布日期降序，不受 pinned/featured 编辑排序影响：`src/pages/rss.xml.ts:5-18`、`src/lib/posts.ts:75-76`。

### 3.3 体验与可访问性基础

- 主题在首屏渲染前读取偏好并同步 `color-scheme` / `theme-color`，能够降低主题闪烁：`src/layouts/BaseLayout.astro:82-96`。
- 主导航有命名、当前页状态和 skip link；全局动效尊重 `prefers-reduced-motion`：`src/layouts/BaseLayout.astro:100-149,165-222`。
- 搜索状态使用 live region，Pagefind 失败时有可理解的本地回退提示：`src/pages/search.astro:289-295,338-376`。
- 灯箱已有 dialog 语义、背景 inert、Esc 关闭、焦点陷阱和关闭后焦点恢复：`src/layouts/PostLayout.astro:354-425`。
- 现有设计 QA 记录了对比度、focus ring、深浅色和动效降级检查：`design/QAReport.md:29-38,54-72`。该文档是历史设计快照，不应替代当前源码或浏览器验证。

### 3.4 工程、CI 与部署

- Node 与 pnpm 范围已声明，pnpm 版本固定：`package.json:6-10`。
- `build` 包含 `astro check`、静态构建和 Pagefind 索引；`verify` 串联现有技术校验：`package.json:11-23`。
- 内部链接脚本会扫描构建后的页面、静态文件和页内锚点：`scripts/check-links.mjs:58-83`。
- PR CI 使用只读权限、冻结锁文件、超时和并发取消；Actions 均固定到不可变提交 SHA：`.github/workflows/ci.yml:8-19,24-68`。
- Pages 部署把构建与发布权限分离，发布 job 才持有 `pages: write` / `id-token: write`：`.github/workflows/deploy.yml:12-17,70-88`。
- Critical 依赖告警会阻断，Moderate 及以上仍可见但暂不阻断：`.github/workflows/ci.yml:49-56`、`.github/workflows/deploy.yml:49-56`。
- Dependabot 每周覆盖 npm 与 GitHub Actions，并将 Tailwind 4 大版本迁移显式留给人工处理：`.github/dependabot.yml:1-20`。

## 4. 问题总览

- **P0：0 项** — 未发现当前核心页面、构建配置或部署主链路的已证实阻断。
- **P1：8 项** — 不阻止当前上线，但应在把项目定义为“完善、低维护”前处理。
- **P2：10 项** — 增长、互操作、语义和资料治理优化，可按触发条件实施。

优先级定义：

- **P0**：当前会阻断构建、部署或核心访问路径。
- **P1**：当前有明确错误、性能/可访问性风险或高概率维护事故；建议下一迭代完成。
- **P2**：当前规模可接受，但应在增长或相关修改发生时处理。

## 5. P1 — 下一迭代应完成

### P1-1. 官方新文章模板本身与集合 schema 冲突

**证据**

- README 指示直接复制模板：`README.md:38-40`。
- schema 规定 `series` 可选，但一旦出现必须至少 1 个字符：`src/content.config.ts:23`。
- 模板固定提供 `series: ""`：`docs/templates/new-post.md:12`。
- 模板还把可选 `cover` / `ogImage` 写成当前并不存在的有效路径占位值：`docs/templates/new-post.md:10-11`；schema 只验证路径格式：`src/content.config.ts:5-10,21-22`。

**影响**

按官方流程复制模板时，空 `series` 会在集合加载阶段使构建失败；`draft: true` 不能绕过 schema 加载。图片占位值即使通过格式检查，也可能在发布后形成缺图或无效社交图。

**最小修复**

- 删除空 `series` 键，改成注释示例。
- 将可选图片字段也改成注释示例，只有真实资产存在时再取消注释。
- 同步 README 示例，避免模板和文档形成两套发布契约。

**验收**：直接复制模板、只修改标题/日期/分类后，现有构建流程能够加载该 draft；可选字段不产生虚假资源引用。

### P1-2. 上一篇/下一篇继承了 pinned/featured 编辑排序，不是时间链

**证据**

- `getAllPosts()` 按 pinned → featured → pubDate 排序：`src/lib/posts.ts:79-85`。
- 文章布局直接把该数组传给邻接函数：`src/layouts/PostLayout.astro:31-33`。
- `getAdjacentPosts()` 只按数组索引取邻居：`src/lib/posts.ts:135-140`。
- 现有本地 `dist/blog/ai-architecture-route/index.html:793` 曾出现 2026-07-28 文章的“下一篇”为 2026-07-09 文章。该产物已确认不是当前提交的可信构建结果，只作为症状示例；源码逻辑本身足以证明问题仍存在。

**影响**

读者的时间阅读路径会因置顶/精选状态变化而跳转，编辑操作还会无意改变所有文章的邻接关系。

**最小修复**

邻接导航单独使用纯发布日期排序，并为同日文章定义稳定 tie-break（例如 slug）；首页/卡片仍可保留编辑排序。

**验收**：切换任意文章的 pinned/featured 不改变上一篇/下一篇；所有文章按定义好的日期方向形成唯一稳定链。

### P1-3. 正文 cover 与 OG 默认图语义混用，并产生约 2.8 MB 首屏负担

**证据**

- schema 和 README 都把正文 `cover` 定义为可选，README 明确表示省略时不补默认大图：`src/content.config.ts:21`、`README.md:61-67`。
- `getCoverUrl()` 却在无 cover 时始终返回默认 OG PNG：`src/lib/posts.ts:44-49`。
- `hasCover` 因而恒真，并将该图作为 eager hero 渲染：`src/layouts/PostLayout.astro:34-35,162-166`。
- OG 已有独立的正确回退 helper：`src/lib/posts.ts:63-72`。
- `public/images/og/blog-cover-editorial-v2.png` 当前大小为 **2,792,819 bytes**；至少 `ai-architecture-route.md` 和 `vllm-checkpoint-docs.md` 未声明 cover。

**影响**

未设封面的文章在移动网络首访会多传输并解码约 2.8 MB PNG，拖慢首屏/LCP；无封面布局分支也成为死分支。

**最小修复**

让正文 cover helper 在未设置时返回 `undefined`，而 OG helper 继续回退到 raster 默认图。若产品确实要显示占位封面，应另用体积小的 WebP/AVIF 展示图，不要复用 1200×630 的社交图。

**验收**：无 cover 的文章不渲染 hero、不请求默认 OG 图；其 `og:image` 仍为有效绝对 raster URL。

### P1-4. `featured` 字段没有一致的主展示语义

**证据**

- README 承诺 pinned 与 featured 会优先出现在文章列表：`README.md:59`。
- `getAllPosts()` 确实把 featured 提前：`src/lib/posts.ts:81-84`。
- 但首页和主文章归档随后调用 `getRegularPosts()`，又按纯日期排序：`src/pages/index.astro:8-10`、`src/pages/blog/index.astro:7-9`、`src/lib/posts.ts:92-95`。
- `getFeaturedPosts()` 存在但没有调用方：`src/lib/posts.ts:98-100`。
- 当前有两篇文章设置 `featured: true`：`src/content/blog/first-day-with-astro.md:11`、`src/content/blog/why-markdown-for-knowledge.md:11`。

**影响**

维护者无法从文档判断 featured 到底会影响哪个页面；字段在部分列表影响排序、在主要列表却没有稳定落点，还意外污染邻接导航。

**最小修复**

二选一并统一代码与 README：

1. 给 featured 一个明确、数量受控的展示区或视觉语义；或
2. 当前只保留 pinned 作为编辑推荐，删除 featured 及相关死 helper。

**验收**：字段语义能用一句话描述，所有消费端一致，且不参与时间邻接。

### P1-5. 分类为自由字符串，已经出现同领域碎片化

**证据**

- category schema 仅限制非空与长度：`src/content.config.ts:19`。
- 分类名直接聚合并生成路由：`src/lib/posts.ts:117-123`、`src/pages/categories/[category].astro:7-12`。
- 当前同时存在 `AI知识` 与 `AI 工程`：`src/content/blog/ai-architecture-route.md:6`、`src/content/blog/FDE-study-line.md:6`、`src/content/blog/vllm-checkpoint-docs.md:6`。
- 首页分类颜色映射只认识一组手写名称：`src/pages/index.astro:14-19`。

**影响**

随着发布次数增加，空格、大小写和近义名称会不断生成新归档 URL，降低分类聚合价值并增加后续迁移成本。

**最小修复**

在一个站点级配置中维护正式分类词表（显示名、稳定 slug、颜色）；schema 消费该配置或枚举。标签可以继续灵活，系列至少应统一命名规则。

**验收**：新增文章只能使用已定义分类；分类显示名、URL 与颜色来自同一事实来源。此项是元数据契约治理，不涉及文章正文审阅。

### P1-6. 站点契约脚本硬编码文章与旧默认资产，既脆弱又漏检真实生产图

**证据**

- 契约脚本固定读取 `blog/vllm-checkpoint-docs/index.html`：`scripts/check-site-contract.mjs:13-19`。
- 脚本要求旧的 `dist/images/og/default.png` 存在：`scripts/check-site-contract.mjs:25-26`。
- 实际生产默认图是 `blog-cover-editorial-v2.png`：`src/lib/posts.ts:6`。
- 每篇文章的 OG 检查只验证 URL 扩展名，没有确认站内文件存在、体积和声明尺寸：`scripts/check-site-contract.mjs:56-59`。

**影响**

重命名/删除某一篇文章，或清理旧 `default.png`，会让健康站点错误失败；反过来，真实默认图缺失或本地 `ogImage` 指向不存在文件时，契约仍可能通过。

**最小修复**

- 从生成后的文章目录动态选取/遍历文章，不硬编码 slug。
- 从实际页面元数据解析站内 OG URL，确认对应文件存在；把尺寸/体积阈值作为静态资产技术契约，而非正文审阅。
- 移除对旧 `default.png` 的无关要求，并让默认图路径只有一个事实来源。

**验收**：文章重命名不导致契约脚本假失败；生产默认图缺失或站内 OG URL 失效时脚本能可靠失败。

### P1-7. 移动/平板双层 sticky header 与正文锚点偏移不匹配

**证据**

- `<lg` 视口的 sticky header 包含第二行移动导航：`src/layouts/BaseLayout.astro:100-149`。
- 正文标题只固定设置 `scroll-margin-top: 6rem`：`src/styles/global.css:125-130`。
- 桌面和移动 TOC 都跳转正文 hash：`src/layouts/PostLayout.astro:103-106,195-203`。
- skip link 指向 `main#content`，但 main 没有 `tabindex="-1"`：`src/layouts/BaseLayout.astro:100,149`。

**影响**

手机/平板点击目录、hash 或 skip link 时，标题可能被双层头部遮挡；部分键盘/读屏组合只滚动，不能可靠把焦点移入正文，文字放大后更明显。

**最小修复**

定义响应式 `--header-offset`，统一用于 `html { scroll-padding-top }`、正文标题和 `#content` 的 `scroll-margin-top`；给 `main#content` 增加 `tabindex="-1"`。

**验收**：在手机、平板、桌面以及 200% 文字缩放下，TOC/hash 目标均完整可见，skip link 能可靠进入正文焦点位置。

### P1-8. 键盘激活回顶按钮后，按钮可能在仍持焦点时被隐藏

**证据**

- 按钮随滚动阈值切换 `tabIndex` 和 `aria-hidden`：`src/layouts/PostLayout.astro:240,264-268`。
- 点击只触发平滑滚动，没有迁移焦点：`src/layouts/PostLayout.astro:283-285`。
- 阈值内按钮还会被设为 `visibility: hidden`：`src/styles/global.css:515-553`。

**影响**

键盘用户按 Enter/Space 回顶后，焦点所在控件会从视觉界面和可访问树消失，后续 Tab 或读屏位置不可预测。

**最小修复**

给文章 h1 或正文入口设置可编程焦点；回顶时将焦点迁移到该位置，再隐藏按钮，并在 reduced-motion 与平滑滚动两种模式下保持一致。

**验收**：键盘回顶后焦点位于文章开头，下一次 Tab 顺序可预测，不存在隐藏焦点。

## 6. P2 — 按增长和维护节奏处理

| 项目 | 证据 | 当前影响 / 触发条件 | 建议 |
|---|---|---|---|
| 首页分类总数使用了截断后的数组 | `src/pages/index.astro:11,47` | 当前分类不超过 6 时无误；第 7 个分类出现后总数仍显示 6。 | 保留 `allCategories`，展示数量用完整数组，侧栏再 `slice(0, 6)`。 |
| 搜索结果和显示计数都是截断值 | `src/pages/search.astro:269,304-305,375-376` | Pagefind 最多 10 条、本地最多 12 条，用户看不到真实命中总数。约 30–50 篇文章后更明显。 | 保留 total，增加“加载更多”或分页；当前规模无需立即实现。 |
| 文章归档一次渲染全部文章 | `src/pages/blog/index.astro:43-44` | 当前 8 篇没有性能问题。 | 达到约 50 篇或移动端 DOM/筛选明显变慢时再分页，不要提前复杂化。 |
| 永久链接完全来自文件路径 | `src/lib/posts.ts:24-33`、`src/pages/blog/[slug].astro:6-10` | 文件重命名会同时破坏 URL、RSS GUID、书签和外链。 | 立即写下“发布后文件名不改”的低成本规则；第一次必须改名之前再引入显式 slug/aliases/重定向。 |
| 系列只展示和参与推荐，没有归档入口 | `src/components/PostCard.astro:46`、`src/layouts/PostLayout.astro:122-126`、`src/lib/posts.ts:149` | 当前仅少量系列可接受；系列增多后不可浏览。 | 当任一系列达到 3 篇或系列数达到 3 个时，再新增系列归档。 |
| 标签 sitemap 与页面 noindex 策略不完全一致 | `astro.config.mjs:8-12`、`src/pages/tags/[tag].astro:18` | 所有单标签页都不进 sitemap，但超过 1 篇的页面可 index。不是故障，但策略难解释。 | 明确选择“标签页仅供站内导航”或“成熟标签可收录”，让 sitemap 与 robots 策略一致。 |
| TOC 与主题按钮语义可增强 | `src/layouts/PostLayout.astro:99-107,195-203,436-451`、`src/layouts/BaseLayout.astro:129,181-188` | 两个 TOC nav 未命名、当前项只靠视觉样式；主题按钮同时使用动态动作名和 pressed 状态。 | 为 nav 命名并同步 `aria-current`；主题按钮只保留一种清晰状态模型。 |
| 灯箱无条件增强所有正文图片 | `src/layouts/PostLayout.astro:343-352,428-433` | 链接图片可能出现嵌套交互，空 alt 装饰图会被错误暴露成按钮。 | 跳过 `img.closest("a")` 与空 alt 图片，或显式接管链接行为。 |
| 设计资料和当前实现漂移 | `design/HandoffBundle.md:4,19,27-28,42,46-48` 对照 `tailwind.config.mjs:10-15`、`scripts/check-site-contract.mjs:23-24`、`src/pages/index.astro:32` | 文档声称 Google Fonts/Fraunces/Manrope 和 `.kw` 已落地；当前实现使用系统字体且禁止 Google Fonts，源码搜索未发现 `.kw` 样式定义。 | 把旧文档标为“2026-07-20 设计快照”，另维护短小的当前实现说明；补回 `.kw` 或移除相关承诺。 |
| 公开资产与核心逻辑测试需要轻量收口 | `public/images/og/` 中 4 个并存文件；源码生产路径只指向 `blog-cover-editorial-v2.png`，旧 `default.png` 仍被设计预览/契约引用；未发现 `*.test.*` / `*.spec.*` | `public/` 中的历史资产会被原样发布；排序/URL helper 缺回归保护。 | 先确认外部引用再清理或移出设计资产；只为 URL/base、纯日期排序、邻接和推荐打分补少量单元测试，并加一个非正文审阅型浏览器 smoke（导航、主题、搜索回退、TOC、回顶焦点）。 |

补充：`scripts/check-links.mjs:7` 也硬编码了项目 base。当前仓库部署目标固定，因此不是故障；若未来迁移域名或复用模板，应从 Astro 配置或环境变量读取。

## 7. 技术验证记录与限制

### 7.1 本轮完成的静态验证

| 验证 | 结果 |
|---|---|
| 项目结构、关键源码、配置、工作流和脚本逐项读取 | **完成** |
| 内容集合结构盘点 | **完成**：发现 8 个 Markdown/MDX 文件；这里只检查路由和 Frontmatter 契约，不评价正文。 |
| base/canonical/robots/RSS/路由调用链交叉检查 | **完成，源码结论一致** |
| TODO/FIXME/HACK/XXX 搜索 | **通过**：无真实待办；唯一命中来自 `pnpm-lock.yaml` integrity 字符串。 |
| 单元/规格测试文件搜索 | **未发现** `*.test.*` / `*.spec.*`。这不是当前上线阻断。 |
| 生产默认图引用搜索 | **完成**：源码生产路径仅指向 `blog-cover-editorial-v2.png`；其他 OG 资产存在设计/契约或历史用途。 |
| 现有 `dist/` 诊断 | 找到 Pagefind、sitemap 和 43 个 HTML 文件，但只作为历史/诊断材料，不计为当前提交构建通过。 |

### 7.2 未能完成的运行验证

尝试执行：

```text
C:/Windows/System32/cmd.exe /d /s /c "node --version && corepack pnpm --version && corepack pnpm verify"
```

命令在进入 Node/pnpm 前被本机 LiveAgent shell 启动链错误转入不可用 WSL，返回：

```text
WSL (10) ERROR: CreateProcessEntryCommon:505: execvpe /bin/bash failed 2
```

因此本轮**不能声称**以下项目已在当前提交重新通过：

- `corepack pnpm verify`
- `astro check` / 当前提交构建
- Pagefind 当前索引生成
- 构建后链接与站点契约检查
- 浏览器响应式、键盘、LCP 或线上 GitHub Pages 实测

这是执行环境故障，不是已证实的项目失败。修复本机 Git Bash/WSL 路由后，建议首先在干净环境执行：

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm verify
corepack pnpm audit --audit-level=critical
```

### 7.3 为什么不能把现有 `dist/` 当作当前验证

- `dist/` 被 `.gitignore:2` 排除，无法用 Git 提交对应关系证明其来源。
- 当前源码的回顶按钮包含 `tabindex="-1"`、`aria-hidden="true"` 和 reduced-motion 逻辑：`src/layouts/PostLayout.astro:240-250`；现有文章产物的对应 HTML/脚本缺少这些内容。
- 现有产物还残留多组当前内容集合中不存在的旧分类页面。

因此，现有产物能帮助发现邻接排序等症状，但不能替代当前提交的干净构建。`design/HandoffBundle.md:4,58` 记录了 2026-07-20 的一次 `pnpm build` 通过，也只能视为历史记录。

## 8. 建议实施顺序

### 第一批：修正发布与文章语义契约（约半天至 1 天）

1. 修正新文章模板和 README。
2. 拆分正文 cover 与 OG fallback。
3. 将邻接导航改为纯日期稳定排序。
4. 明确 featured 的保留或删除策略。

这一批投入小、收益最大，可同时消除构建事故、错误导航和约 2.8 MB 首屏负担。

### 第二批：完成低维护收口（约半天至 1 天）

1. 建立分类单一事实来源并合并近义分类。
2. 解除站点契约脚本对具体文章和旧默认图的硬编码。
3. 修正移动锚点/skip link 与回顶焦点。
4. 在可用环境重新运行完整 `pnpm verify` 和 Critical audit。

### 第三批：按增长触发

- 文章约 30–50 篇：搜索显示真实总数并支持加载更多。
- 文章约 50 篇或归档交互变慢：再评估分页。
- 第一次需要重命名已发布文章之前：引入稳定 slug/aliases/重定向。
- 系列达到 3 篇或 3 个系列：新增系列归档。
- 清理设计资料与公开旧资产，并补少量核心纯逻辑测试和浏览器 smoke。

## 9. 建议的“完成”验收标准

完成以下条件后，可把项目从“可上线、接近完善”提升为“低维护、长期稳定”：

- [ ] 官方模板可直接创建合法 draft，可选字段不会留下虚假路径。
- [ ] pinned/featured 的变化不再影响上一篇/下一篇时间链。
- [ ] 无 cover 文章不加载正文默认 hero，OG 分享图仍正确。
- [ ] featured 有唯一、可解释的产品语义，或被完整移除。
- [ ] 分类显示名、slug 和颜色来自同一配置，近义分类不再分裂。
- [ ] 契约脚本不硬编码具体文章或旧默认图，能检查真实站内 OG 资源。
- [ ] 手机/平板 hash 目标不被 sticky header 遮挡，skip link 可进入正文焦点。
- [ ] 键盘回顶后焦点可靠落到文章开头。
- [ ] 在干净、可用的 Node 22 + pnpm 10.18.3 环境中重新通过 `pnpm verify` 和 Critical audit。
- [ ] 完成一次桌面/移动、键盘、主题、搜索和文章阅读主路径的浏览器 smoke；不包含文章正文质量审阅。

---

**最终结论：** 当前项目已经是一个功能完整、工程基础良好、可以上线的个人技术博客；真正需要做的不是继续堆叠产品功能，而是用一个短迭代消除模板、排序、封面、featured、分类、契约和焦点行为之间的不一致。完成 P1 后，项目即可合理认定为“完善得差不多，并具备低维护长期运营能力”。
