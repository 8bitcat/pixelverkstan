// Förhandsvisning av pixelpersoner (alla riktningar/bildrutor) + porträtt.
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = []; page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto("http://127.0.0.1:8778/tools/art.html", { waitUntil: "domcontentloaded" });
await page.evaluate(async () => {
  const P = await import('/js/core/people.js?' + Date.now());
  document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#8a8070';
  let seed = 7; const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const looks = [P.SHOPKEEPER]; for (let i = 0; i < 13; i++) looks.push(P.makeLook(rng));
  looks.push({ ...P.makeLook(rng), kid: true, style: 'ponytail', bag: 'backpack' });
  looks.push({ ...P.makeLook(rng), kid: true, hat: 'cap', style: 'short' });
  const cols = [['down',0],['down',1],['down',3],['down',2],['down',5],['up',0],['up',1],['up',2],['right',0],['right',1],['right',3],['right',2],['left',0],['left',1]];
  const Z = 3, CW = 22, RH = 42;
  const c = document.createElement('canvas'); c.width = (cols.length * CW + 30) * Z; c.height = looks.length * RH * Z; document.body.append(c);
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.scale(Z, Z);
  looks.forEach((L, r) => {
    x.fillStyle = r % 2 ? '#d8ccb6' : '#e9e1d2'; x.fillRect(0, r * RH, cols.length * CW + 30, RH);
    cols.forEach(([d, f], i) => P.drawPerson(x, 11 + i * CW, r * RH + 38, L, d, f));
    const pc = P.portrait(L); x.drawImage(pc, cols.length * CW + 4, r * RH + 2, 20, 24);
  });
  const big = document.createElement('div'); document.body.append(big);
  for (const L of looks.slice(0, 6)) { const pc = P.portrait(L); pc.style.cssText = 'width:160px;height:192px;image-rendering:pixelated;margin:4px'; big.append(pc); }
});
await page.waitForTimeout(200);
await page.screenshot({ path: "D:/GamesProjects/pixelverkstan/tools/out/fl2-people.png", fullPage: true });
console.log(errors.join("\n") || "inga fel");
await browser.close();
