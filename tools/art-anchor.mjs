// Kontroll: varje del ritas lika stor på standardplats och på ett godtyckligt ankare (o.at).
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`http://localhost:8777/tools/art-styles.html?cat=none&icons=0&v=${Date.now()}`);
await page.waitForFunction(() => window.done === true);
const bad = await page.evaluate(() => window.checkAnchors());
console.log(bad.length ? bad.join("\n") : "alla delar positionsoberoende");
console.log(errors.join("\n") || "inga fel");
await browser.close();
