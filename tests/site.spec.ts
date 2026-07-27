import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("首页可访问且没有严重 axe 问题", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const results = await new AxeBuilder({ page }).include("main").analyze();
  const seriousViolations = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
  expect(seriousViolations).toEqual([]);
});

test("搜索和分类筛选保留可分享的 URL 状态", async ({ page }) => {
  await page.goto("/search/?q=Astro");
  await expect(page.locator("#search-input")).toHaveValue("Astro");
  await expect(page.locator("#search-status")).toContainText("找到");

  await page.goto("/blog/?category=AI%20%E5%B7%A5%E7%A8%8B");
  await expect(page.locator("#archive-status")).toContainText("AI 工程");
  await expect(page.getByRole("button", { name: /AI 工程/ })).toHaveAttribute("aria-pressed", "true");
});

test("文章封面可通过键盘打开和关闭图片预览", async ({ page }) => {
  await page.goto("/blog/first-day-with-astro/");
  const cover = page.locator("[data-image-preview]");
  await cover.focus();
  await cover.press("Enter");

  const dialog = page.getByRole("dialog", { name: "图片预览" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("按 Esc 关闭图片预览")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(cover).toBeFocused();
});
