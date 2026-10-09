/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

async function main() {
  const screenshotsDir = path.resolve(__dirname, "../docs/screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 375, height: 812 },
  ];

  const themes = ["light", "dark"];

  for (const vp of viewports) {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
      });

      const page = await context.newPage();

      // Go to results page for form 1
      await page.goto("http://localhost:3000/forms/1/results", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      // Set theme mode via localStorage and document class
      await page.evaluate((t) => {
        localStorage.setItem("theme-mode", t);
        if (t === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }, theme);
      await page.waitForTimeout(600);

      // 1. Results Summary Screenshot
      const summaryFilename = `results_summary_${vp.name}_${theme}.png`;
      await page.screenshot({
        path: path.join(screenshotsDir, summaryFilename),
        fullPage: false,
      });
      console.log(`Saved: ${summaryFilename}`);

      // 2. Click Responses Tab
      // Find button containing "Responses"
      const responsesTabBtn = page.locator("button:has-text('Responses')").first();
      await responsesTabBtn.click();
      await page.waitForTimeout(800);

      // Responses Table Screenshot
      const tableFilename = `responses_table_${vp.name}_${theme}.png`;
      await page.screenshot({
        path: path.join(screenshotsDir, tableFilename),
        fullPage: false,
      });
      console.log(`Saved: ${tableFilename}`);

      // 3. Click first response row in table to open Detail Drawer
      // Table rows are in tbody tr
      const firstRow = page.locator("tbody tr").first();
      await firstRow.click();
      await page.waitForTimeout(800);

      // Detail Drawer Screenshot
      const drawerFilename = `response_drawer_${vp.name}_${theme}.png`;
      await page.screenshot({
        path: path.join(screenshotsDir, drawerFilename),
        fullPage: false,
      });
      console.log(`Saved: ${drawerFilename}`);

      await context.close();
    }
  }

  await browser.close();
  console.log("All screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
