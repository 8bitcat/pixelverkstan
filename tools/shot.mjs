// Skärmdump av en sida: node tools/shot.mjs <url-sökväg> <utfil> [bredd] [höjd] [väntms]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const [path = "index.html", out = "shot.png", w = "1400", h = "900", wait = "800"] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
page.on("console", (m) => console.log(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto("http://localhost:8777/" + path);
await page.waitForTimeout(+wait);
await page.screenshot({ path: "D:/GamesProjects/pixelverkstan/tools/out/" + out, fullPage: true });
await browser.close();
