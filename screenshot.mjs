import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(root, "temporary screenshots");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const url = process.argv[2] || "http://localhost:3000";
const label = process.argv[3];
const width = process.argv[4] ? Number(process.argv[4]) : 1440;

function findChrome() {
  const base = path.join(process.env.USERPROFILE || process.env.HOME, ".cache", "puppeteer", "chrome");
  if (fs.existsSync(base)) {
    const builds = fs.readdirSync(base).sort().reverse();
    // platform-specific layouts inside a puppeteer cache build directory
    const rels = [
      ["chrome-win64", "chrome.exe"],
      ["chrome-mac-x64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"],
      ["chrome-mac-arm64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"],
      ["chrome-linux64", "chrome"],
    ];
    for (const build of builds) {
      for (const rel of rels) {
        const exe = path.join(base, build, ...rel);
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
  // fall back to a system Chrome install
  const system = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ];
  for (const exe of system) if (fs.existsSync(exe)) return exe;
  throw new Error("No Chrome found in the puppeteer cache or in the usual system locations");
}

function nextIndex() {
  const files = fs.readdirSync(outDir).filter((f) => /^screenshot-\d+/.test(f));
  const nums = files.map((f) => parseInt(f.match(/^screenshot-(\d+)/)[1], 10));
  return nums.length ? Math.max(...nums) + 1 : 1;
}

const executablePath = findChrome();
const browser = await puppeteer.launch({ executablePath, headless: true });
const page = await browser.newPage();

// Keep a real viewport height so vh/svh units resolve correctly. Resizing the
// viewport to the full document height (a common full-page trick) makes
// 100vh equal the whole page and blows up any vh-sized section.
await page.setViewport({ width, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
await new Promise((r) => setTimeout(r, 400));

// Walk the page so IntersectionObserver-driven reveals fire; otherwise
// everything below the fold captures at opacity 0.
await page.evaluate(async () => {
  // smooth scrolling would animate each hop, so the walk never actually
  // reaches the lower sections before it finishes
  if (window.__lenis) window.__lenis.destroy();
  const prev = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";
  const step = window.innerHeight * 0.6;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 110));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 500));
  document.documentElement.style.scrollBehavior = prev;
});

const fullHeight = await page.evaluate(() => document.body.scrollHeight);

// Chrome's compositor has a max texture size; a tall page at 2x re-triggers
// tiling artifacts, so step down the scale factor for long pages.
const dsf = fullHeight * 2 > 12000 ? 1 : 2;
if (dsf !== 2) await page.setViewport({ width, height: 900, deviceScaleFactor: dsf });

// position:fixed elements are painted once per tile in Chrome's beyond-viewport
// capture, so they appear repeated down a full-page shot. Pin them to the top
// of the document for the duration of the capture instead.
await page.evaluate(() => {
  window.scrollTo(0, 0);
  document.querySelectorAll("*").forEach((el) => {
    if (getComputedStyle(el).position === "fixed") {
      el.dataset.wasFixed = "1";
      el.style.position = "absolute";
    }
  });
});
await new Promise((r) => setTimeout(r, 250));

const idx = nextIndex();
const filename = label ? `screenshot-${idx}-${label}.png` : `screenshot-${idx}.png`;
const outPath = path.join(outDir, filename);
await page.screenshot({ path: outPath, fullPage: true });

await browser.close();
console.log("Saved " + outPath);
