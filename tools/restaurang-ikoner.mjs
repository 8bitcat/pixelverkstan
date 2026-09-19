// Ritar alla hamburgerbarens ingredienser som ikoner i ett rutnät per kategori och sparar
// tools/out/rest-ikoner-<kategori>.png – för att ögna igenom grafiken. node tools/restaurang-ikoner.mjs [url]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv.find((a) => a.startsWith('http')) || "http://localhost:8777/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
await page.goto(URL);
const cats = await page.evaluate(async () => {
  const M = await import('./js/shops/restaurang/menu.js'), A = await import('./js/shops/restaurang/art.js');
  document.body.innerHTML = '<div id="sheet" style="background:#f4f1ea;padding:10px;font:12px monospace;color:#222"></div>';
  const out = {};
  for (const cat of M.CAT_ORDER) {
    const parts = M.DB.parts.filter((p) => p.cat === cat);
    const box = document.createElement('div'); box.id = 'cat-' + cat; box.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#fff;margin-bottom:10px;width:1360px';
    box.innerHTML = `<h3 style="width:100%;margin:0 0 4px">${M.CATS[cat].icon} ${M.CATS[cat].name} (${parts.length})</h3>`;
    for (const p of parts) {
      const cell = document.createElement('div'); cell.style.cssText = 'width:120px;text-align:center;border:1px solid #ddd;padding:4px;background:#f8f6f0';
      const c = A.iconCanvas(p, 96, 80); c.style.imageRendering = 'pixelated'; cell.appendChild(c);
      const t = document.createElement('div'); t.textContent = `${p.name} ${p.year}`; t.style.cssText = 'font-size:10px;line-height:1.1;height:24px;overflow:hidden'; cell.appendChild(t);
      box.appendChild(cell);
    }
    document.getElementById('sheet').appendChild(box);
    out[cat] = parts.length;
  }
  return out;
});
console.log(JSON.stringify(cats));
for (const cat of Object.keys(cats)) await page.locator('#cat-' + cat).screenshot({ path: `${OUT}rest-ikoner-${cat}.png` });
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
