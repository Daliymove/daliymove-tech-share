export const categoryDefinitions = {
  "AI 工程": {
    slug: "ai-engineering",
    colorClass: "bg-bark-700",
  },
  "前端与工具": {
    slug: "frontend-tooling",
    colorClass: "bg-leaf-500",
  },
  "知识与学习": {
    slug: "knowledge-learning",
    colorClass: "bg-leaf-400",
  },
  "个人系统": {
    slug: "personal-systems",
    colorClass: "bg-leaf-300",
  },
} as const;

export type CategoryName = keyof typeof categoryDefinitions;

export const categoryNames = Object.keys(categoryDefinitions) as [CategoryName, ...CategoryName[]];

export function getCategoryDefinition(category: CategoryName) {
  return categoryDefinitions[category];
}
