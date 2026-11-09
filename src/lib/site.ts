export const site = {
  title: "daliyMove技术分享",
  shortTitle: "daliyMove",
  description: "持续输出前端、工程实践与工具方法的技术分享站，记录每天前进一点的思考与复盘。",
  author: "daliyMove",
  github: "https://github.com/Daliymove",
  tagline: "每天一点技术，持续向前",
  url: "https://daliymove.github.io/daliymove-tech-share",
  locale: "zh_CN",
  twitter: "",
  nav: [
    { href: "/", label: "首页", icon: "home", devOnly: false },
    { href: "/blog/", label: "文章", icon: "article", devOnly: false },
    { href: "/categories/", label: "分类", icon: "grid", devOnly: false },
    { href: "/tags/", label: "标签", icon: "tag", devOnly: false },
    { href: "/studio/", label: "创作", icon: "pen", devOnly: true },
    { href: "/about/", label: "关于", icon: "user", devOnly: false },
  ],
} as const;
