// Full-page screenshots of every route. Usage: node shoot.mjs <outdir> [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const outDir = process.argv[2] || "./shots-out";
const base = process.argv[3] || "http://localhost:5174";
mkdirSync(outDir, { recursive: true });

const routes = [
  ["home", "/"],
  ["campaigns", "/campaigns"],
  ["campaign-new", "/campaigns/new"],
  ["campaign-detail", "/campaigns/packaging-direction"],
  ["campaign-detail-draft", "/campaigns/summer-launch-draft"],
  ["polsts", "/polsts"],
  ["polst-new", "/polsts/new"],
  ["polst-detail", "/polsts/which-headline-wins"],
  ["distribution", "/distribution"],
  ["audience", "/audience"],
  ["analytics-overview", "/analytics"],
  ["analytics-acquisition", "/analytics/acquisition"],
  ["analytics-retention", "/analytics/retention"],
  ["analytics-insights", "/analytics/insights"],
  ["analytics-reports", "/analytics/reports"],
  ["settings", "/settings"],
  ["team", "/team"],
  ["not-found", "/nope-404"],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(15000);

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`[${page.url()}] ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(`[${page.url()}] PAGEERROR ${e.message}`));

for (const [name, path] of routes) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(700); // let charts/animations settle
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true });
  console.log(`shot ${name}`);
}

await browser.close();
if (errors.length) {
  console.log("\nCONSOLE ERRORS:");
  for (const e of errors) console.log(" - " + e);
} else {
  console.log("\nNo console errors.");
}
