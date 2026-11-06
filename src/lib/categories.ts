export const categoryDefinitions = {
  // Quiet Signal 以文字、字号与细线分组；色标仅作为可选的中性明度提示保留。
  "AI 工程": {
    slug: "ai-engineering",
    colorClass: "bg-ink-primary",
  },
  "前端与工具": {
    slug: "frontend-tooling",
    colorClass: "bg-ink-secondary",
  },
  "知识与学习": {
    slug: "knowledge-learning",
    colorClass: "bg-ink-faint",
  },
  "个人系统": {
    slug: "personal-systems",
    colorClass: "bg-line-strong",
  },
} as const;

export type CategoryName = keyof typeof categoryDefinitions;

export const categoryNames = Object.keys(categoryDefinitions) as [CategoryName, ...CategoryName[]];

export function getCategoryDefinition(category: CategoryName) {
  return categoryDefinitions[category];
}
