import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 4174;
const url = `http://127.0.0.1:${port}/daliymove-tech-share/`;
const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function waitForServer(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) return resolve();
      } catch {
        // The preview server is still starting.
      }
      if (Date.now() >= deadline) return reject(new Error(`Preview server did not respond within ${timeoutMs}ms.`));
      setTimeout(poll, 250);
    };
    void poll();
  });
}

const preview = spawn(command, ["preview", "--", "--port", String(port)], {
  cwd: root,
  stdio: "ignore",
});

let chrome;
try {
  await waitForServer();
  chrome = await chromeLauncher.launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ["--headless=new", "--no-sandbox"],
  });
  const result = await lighthouse(url, {
    port: chrome.port,
    onlyCategories: ["performance"],
    formFactor: "desktop",
    screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
  });
  const lhr = result?.lhr;
  assert.ok(lhr, "Lighthouse did not return a report.");

  const performance = Math.round((lhr.categories.performance.score ?? 0) * 100);
  const totalBytes = lhr.audits["total-byte-weight"].numericValue ?? 0;
  assert.ok(performance >= 85, `Performance budget exceeded: ${performance} < 85.`);
  assert.ok(totalBytes <= 550 * 1024, `Transfer-size budget exceeded: ${Math.round(totalBytes / 1024)} KiB > 550 KiB.`);
  console.log(`Lighthouse budget passed: performance ${performance}, ${Math.round(totalBytes / 1024)} KiB transferred.`);
} finally {
  await chrome?.kill();
  preview.kill();
}
