import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 860 } });
await page.goto("http://localhost:8777/index.html");
const r = await page.evaluate(async () => {
  const { Raster } = await import('/js/core/raster.js');
  const L = await import('/js/shops/dator/layout.js');
  const { PART } = await import('/js/shops/dator/catalog.js');
  const A = await import('/js/shops/dator/art.js');
  const R = new Raster(L.VIEW.w, L.VIEW.h); Object.assign(R, L.VIEW, { edges: true });
  const ids = ['4000x-rgb', 'x870e-hero', 'r9-9950x3d', 'hyper-212-rgb', 'tridentz5-64-ddr5', '990pro-2tb', 'astral-5080', 'dark-power-13', 'sp120-rgb-3'];
  const b = { placed: {}, acts: new Map(), cables: new Map() };
  for (const id of ids) b.placed[L.slotsFor(PART[id])[0].id] = PART[id];
  let t0 = performance.now(); for (let i = 0; i < 3; i++) { R.clear(); L.drawScene(R, b, {}); R.flush(); }
  const scene = (performance.now() - t0) / 3;
  t0 = performance.now(); for (const id of Object.keys(PART).slice(0, 20)) A.iconCanvas(PART[id], 96, 80);
  const icons = (performance.now() - t0) / 20;
  return { sceneMs: Math.round(scene), iconMs: Math.round(icons) };
});
console.log(JSON.stringify(r));
await browser.close();
