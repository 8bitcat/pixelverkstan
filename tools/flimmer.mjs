// Flimmertest för 3D-butiken: skuggakne och ytor som ligger i varandra (z-fighting) syns som ett
// mönster som hoppar så fort kameran rör sig en aning. Testet renderar samma vy två gånger med
// en halv millimeters förflyttning och räknar hur stor del av bilden som ändras. Vid så liten rörelse
// är parallaxen osynlig (under en tiondels pixel), så allt som ändras är instabil rendering. En stabil bild ändrar nästan
// ingenting (några promille runt kanter); flimrande ytor ger procenttal.
// node tools/flimmer.mjs [url]   (jämför gärna localhost mot https://8bitcat.github.io/pixelverkstan/)
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv.find((a) => a.startsWith('http')) || "http://localhost:8777/index.html";
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
const waitFrames = async (n = 3) => { const f0 = await page.evaluate(() => PV.view3d.frames); await page.waitForFunction((f) => PV.view3d.frames >= f, f0 + n, { timeout: 180000 }); };
const CLIP = { x: 0, y: 70, width: 1280, height: 600 };

await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="restaurang"]'); await page.click('[data-year="1996"]');
await page.waitForFunction(() => window.PV?.game && PV.game.shop.id === 'restaurang', null, { timeout: 30000 }); await page.waitForTimeout(600);
await page.evaluate(() => {
  const g = PV.game; g.money = 90000; g.tutorialStep = 99; g.stats.served = 9;
  Object.values(g.shop.part).filter((p) => ['brod', 'biff', 'ost', 'gront', 'extra', 'sas'].includes(p.cat) && p.year <= 1996).slice(0, 30).forEach((p, i) => { if (i % 3) return; g.stock[p.id] = 2 + (i % 7) * 3; g.shown[p.id] = g.stock[p.id]; });
  g.emit('change'); PV.floor.build(); PV.floor.sig = null; PV.floor.refreshStock();
});
await page.click('[data-h="view3d"]');
await page.waitForFunction(() => PV.view3d?.ready, null, { timeout: 240000 });
await page.waitForTimeout(1500);

// tre bilder: två från exakt samma plats (baslinje: gäster som rör sig, neon, miljöbakning) och en
// efter en halv millimeters förflyttning. Flimret är skillnaden mellan dem – ett mönster som "kokar" när kameran rör sig.
const shot = async () => { await waitFrames(4); return (await page.screenshot({ clip: CLIP, timeout: 180000 })).toString('base64'); };
const diff = (a, b) => page.evaluate(async ([ba, bb]) => {
  const load = async (b64) => { const r = await fetch('data:image/png;base64,' + b64); return createImageBitmap(await r.blob()); };
  const [ia, ib] = [await load(ba), await load(bb)];
  const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data;
  x.clearRect(0, 0, c.width, c.height); x.drawImage(ib, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 42) n++;
  return +(100 * n / (da.length / 4)).toFixed(2);
}, [a, b]);
async function jitter(name, x, z, yaw, pitch) {
  await page.evaluate(([x, z, y, p]) => { PV.view3d.setPose(x, z, y, p); PV.view3d.envDirty = true; PV.view3d.envT = 0; }, [x, z, yaw, pitch]);
  await waitFrames(8);
  await page.waitForFunction(() => !PV.view3d.envDirty, null, { timeout: 120000 });   // vänta tills miljöljuset är bakat
  const a = await shot(), b = await shot();
  await page.evaluate(([x, z, y, p]) => PV.view3d.setPose(x + 0.0005, z, y, p), [x, z, yaw, pitch]);   // en halv millimeter: parallaxen är osynlig, men skärmrumsmönster hoppar
  const c = await shot();
  const still = await diff(a, b), moved = await diff(a, c);
  await page.screenshot({ path: OUT + `flimmer-${name}.png`, timeout: 180000 });
  const flick = +(moved - still).toFixed(2);
  console.log(`${name}: ${flick} % flimmer (rörelse ${moved} %, stillastående ${still} %)`);
  return flick;
}

const disk = await jitter('disk', 2.3, 3.8, 0, -0.12);        // disken och fönstren bakom
const fonster = await jitter('fonster', 0.2, 4.6, 0, 0.12);   // framväggen med skyltfönstren
const rum = await jitter('rum', 1.2, 6.0, Math.PI, -0.1);     // bort från fönstren (jämförelse)
ok(disk < 1, `disken står stilla (${disk} % flimmer)`);
ok(fonster < 1, `fönsterkanterna står stilla (${fonster} % flimmer)`);
ok(rum < 1, `rummet står stilla (${rum} % flimmer)`);
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
