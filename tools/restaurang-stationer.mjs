// Stekbordet och fritösen i pixelläget, utan hjälp (proffsläget), med riktiga musklick: lägg på biffen, vänta på
// färgen, vänd, krydda på salt- och pepparkaret, ta potatis ur backen och släpp den i fritöskorgen, sänk, lyft.
// Mäter också att biffen och pommesen faktiskt byter färg i bilden, och att en bränd biff ger anmärkning.
// node tools/restaurang-stationer.mjs [url]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const URL = process.argv.find((a) => a.startsWith('http')) || "http://localhost:8777/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };

await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="restaurang"]'); await page.click('[data-year="1996"]');
await page.waitForFunction(() => window.PV?.game && PV.game.shop.id === 'restaurang', null, { timeout: 30000 }); await page.waitForTimeout(600);
const open = () => page.evaluate(() => {
  const g = PV.game; g.money = 90000; g.tutorialStep = 99; g.stats.served = 9; g.spawnTimer = 9999; g.customers.length = 0; g.orders.length = 0;
  let o = null;
  for (let i = 0; i < 300 && !o; i++) { const x = g.shop.generateOrder(g, ['Nils']); if (x && !x.product && x.items.every((it) => it.part) && x.items.some((it) => it.cat === 'biff') && x.items.some((it) => g.shop.part[it.part]?.look?.shape === 'fries')) o = x; }
  if (!o) return false;
  const c = g.spawn(o); for (const it of c.order.items) { g.stock[it.part] = (g.stock[it.part] || 0) + 2; g.shown[it.part] = g.stock[it.part]; }
  c.phase = 'queue'; const ord = g.accept(c); PV.openBuild(ord); return true;
});
ok(await open(), 'en beställning med biff och pommes');
await page.waitForTimeout(700);
await page.evaluate(() => { const b = [...document.querySelectorAll('#modal .btn, #modal button')].find((x) => /Utan hj/.test(x.textContent)); b?.click(); });
await page.waitForTimeout(600);
ok(await page.evaluate(() => PV.build.b.help === false), 'proffsläget: inga markeringar');

const origin = () => page.evaluate(() => { const b = PV.build.canvas.getBoundingClientRect(); return [b.left, b.top]; });
const proj = (at) => page.evaluate((a) => PV.build.P.proj(...a), at);
const state = () => page.evaluate(() => { const v = PV.build, L = v.L, c = L.cookInfo(v.b); return { rosta: L.actDone(v.b, 'rosta'), grill: L.actCount(v.b, 'grill'), salt: L.actDone(v.b, 'salt'), fritera: L.actCount(v.b, 'fritera'), a: c.grill.a, b: c.grill.b, fry: c.fry.prog, pick: L.pickups(v.b).map((p) => p.id), msg: (v.msg?.html || '').replace(/<[^>]+>/g, '') }; });
const tap = async (at) => { const [ox, oy] = await origin(), p = await proj(at); await page.mouse.move(ox + p[0], oy + p[1]); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(250); return state(); };
const wait = async (sec) => { await page.evaluate((s) => { PV.build.b.time += s; PV.build.dirty = true; }, sec); await page.waitForTimeout(250); };
// medelfärgen i en liten ruta runt en punkt på köksbilden
const colorAt = (at, r = 5) => page.evaluate(({ at, r }) => {
  const v = PV.build, [x, y] = v.P.proj(...at), cv = v.canvas, k = cv.width / cv.getBoundingClientRect().width;
  const d = cv.getContext('2d').getImageData(Math.round((x - r) * k), Math.round((y - r) * k), Math.round(2 * r * k), Math.round(2 * r * k)).data;
  let R = 0, G = 0, B = 0, n = 0; for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; n++; }
  return [Math.round(R / n), Math.round(G / n), Math.round(B / n)];
}, { at, r });
const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];

const A = await page.evaluate(() => { const L = PV.build.L; return { rosta: L.ACTION.rosta.points[0], patty: L.ACTION.grill.points[0], salt: L.ACTION.salt.points[0], basket: L.ACTION.fritera.points[0], handle: L.ACTION.fritera.points[1] }; });
// stationerna ligger på olika ställen i bilden
const P = { patty: await proj(A.patty), salt: await proj(A.salt), basket: await proj(A.basket), handle: await proj(A.handle) };
const gap = Math.round(Math.hypot(P.patty[0] - P.salt[0], P.patty[1] - P.salt[1]));
ok(gap > 30, `saltkaret har en egen klickyta, ${gap} px från biffen`);

let s = await tap(A.rosta); ok(s.rosta, 'klick på brödrosten rostar brödet');
const bare = await colorAt(A.patty);
s = await tap(A.patty); ok(s.grill === 1, 'klick på stekbordet lägger på biffen');
const raw = await colorAt(A.patty);
ok(Math.abs(lum(raw) - lum(bare)) > 12 && raw[0] > raw[2] + 25, `en rå, rosa biff ligger på stekytan (stekyta ${bare} → biff ${raw})`);
const guide = async () => { await page.waitForTimeout(700); return page.evaluate(() => document.querySelector('#build-guide')?.innerText.replace(/\s+/g, ' ').trim() || ''); };
const g1 = await guide(); ok(/bryns/.test(g1) && /%/.test(g1) && g1.includes('🧑‍🍳'), `beskedet lever medan det bryns, och det är kocken som pratar: "${g1}"`);
s = await tap(A.patty); ok(s.grill === 1 && /Vänta/.test(s.msg), `för tidigt klick vänder inte – spelaren får besked: "${s.msg}"`);
s = await tap(A.salt); ok(!s.salt && /Stek biffen/.test(s.msg), `saltet går inte före stekningen – besked: "${s.msg}"`);
s = await tap(A.patty);   // (för tidigt igen – beskedet ska sedan slå om av sig självt när biffen är klar att vända)
await wait(5.5);
const g2 = await guide(); ok(/Vänd biffen nu/.test(g2), `när undersidan fått färg slår beskedet om av sig självt: "${g2}"`);
s = await tap(A.patty); ok(s.grill === 2 && s.a >= 1, `efter 5,5 s går biffen att vända (undersidan ${Math.round(s.a * 100)} %)`);
const flipped = await colorAt(A.patty);
ok(lum(flipped) < lum(raw) - 25, `den vända biffen visar den brynta sidan upp (rå ${raw} → brynt ${flipped})`);
s = await tap(A.salt); ok(s.salt, 'klick på salt- och pepparkaret kryddar biffen (pixelläget, proffsläget)');
ok(!s.pick.includes('grill'), 'biffen går inte att ta förrän andra sidan fått färg');
await wait(5.5);
s = await state(); ok(s.pick.includes('grill') && s.b >= 1, 'stekt på båda sidor: biffen går att ta från stekbordet');

// fritösen: dra potatisen från backen till korgen
ok(s.pick.includes('back'), 'det ligger potatis i backen bredvid fritösen');
const crate = await page.evaluate(() => PV.build.L.pickups(PV.build.b).find((p) => p.id === 'back').at);
{
  const [ox, oy] = await origin(), c = await proj(crate), b = P.basket;
  await page.mouse.move(ox + c[0], oy + c[1]); await page.mouse.down();
  for (let k = 1; k <= 8; k++) await page.mouse.move(ox + c[0] + (b[0] - c[0]) * k / 8, oy + c[1] + (b[1] - c[1]) * k / 8);
  await page.mouse.up(); await page.waitForTimeout(300);
}
s = await state(); ok(s.fritera === 1, `potatisen dras från backen och släpps i fritöskorgen (${s.msg})`);
const pale = await colorAt(A.basket, 4);
s = await tap(A.handle); ok(s.fritera === 2, 'klick på handtaget sänker korgen i oljan');
s = await tap(A.handle); ok(s.fritera === 2 && /Vänta/.test(s.msg), `för tidigt lyft går inte – besked: "${s.msg}"`);
await wait(6.5);
s = await tap(A.handle); ok(s.fritera === 3 && s.pick.includes('fritera'), 'efter 6,5 s lyfts korgen och pommesen går att ta');
const liftAt = await page.evaluate(() => PV.build.L.pickups(PV.build.b).find((p) => p.id === 'fritera').at);
const gold = await colorAt(liftAt, 4);
console.log(`     pommes i korgen: blek ${pale} → gyllene ${gold}`);
ok(gold[0] > gold[2] + 60 && gold[0] > 150, 'den upplyfta korgen är full av gyllene pommes');

// bränd biff: ligger den kvar för länge blir det en anmärkning hos gästen
const burnt = await page.evaluate(async () => {
  const v = PV.build, L = v.L; v.b.time += 20; v.dirty = true;
  await new Promise((r) => setTimeout(r, 300));
  return { w: L.cookWarnings(v.b) };
});
ok(burnt.w.some((x) => /bränd/.test(x)), `en biff som ligger kvar 20 s blir bränd: ${burnt.w.join(' ')}`);
const black = await colorAt(A.patty);
ok(lum(black) < lum(flipped) - 10, `den brända biffen är mörkare än den brynta (${flipped} → ${black})`);
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
