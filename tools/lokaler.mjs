// De sex lokalerna är olika: egen planlösning, fler platser ju större lokal, alla väntplatser går
// att gå till, och en spelhylla får plats i Källarhålan utan att riva en hylla. Skärmdumpar
// tools/out/lokal-*.png. node tools/lokaler.mjs [url]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv[2] || "http://localhost:8777/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
const crash = async (e) => { const NL = String.fromCharCode(10); console.log('KRASCH ' + String(e.message).split(NL)[0]); console.log(errors.join(NL)); process.exit(1); };
process.on('unhandledRejection', crash); process.on('uncaughtException', crash);
await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="dator"]'); await page.click('[data-year="1999"]');
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(800);
await page.evaluate(() => { const g = PV.game; g.money = 900000; g.tutorialStep = 99; for (const e of g.shop.events.EVENTS) if (!g.events.seen.includes(e.id)) g.events.seen.push(e.id); g.emit('change'); });
await page.waitForTimeout(300);
const EXPECT = [5, 7, 8, 9, 10, 11];
// Källarhålan: en spelhylla på en ledig plats – de tre hyllorna står kvar
const r0 = await page.evaluate(() => { const g = PV.game, F = g.shop.fit; const o = F.optionsFor(g.fit, 6, 'wide', g.year).find((x) => x.id === 'unit:spelhylla'); const okb = g.buySlot(6, o.id); return { okb, kinds: g.fit.slots.slice(0, 7).map((s) => s && (s.unit || s.kind)) }; });
ok(r0.okb && r0.kinds[0] === 'cat' && r0.kinds[1] === 'cat' && r0.kinds[2] === 'cat' && r0.kinds[6] === 'spelhylla', `spelhyllan fick en egen plats i Källarhålan (${r0.kinds.join(',')})`);
for (let l = 1; l <= 6; l++) {
  if (l > 1) await page.evaluate((l) => PV.game.buyItem('lokal' + l), l);
  await page.waitForTimeout(700);
  const r = await page.evaluate(async () => {
    const LY = await import('./js/core/floor-layout.js');
    const f = PV.floor, plan = LY.PLAN;
    // varje väntplats ska gå att nå från kön; varje slot ska ha en enhet
    const bad = [];
    for (const s of LY.SPOTS) { const [tx, ty] = s.via || [s.x, s.y]; const path = LY.route(318, 176, tx, ty); let px = 318, py = 176, reach = true; for (const [x, y] of path) { if (!LY.clear(px, py, x, y)) { reach = false; break; } px = x; py = y; } if (!reach) bad.push(`${s.kind}${s.slot ?? ''}@${s.x},${s.y}`); }
    const door = LY.route(206, 100, 318, 176);
    return { lokal: f.lokal, open: f.openSlots, units: f.unitList.length, indices: LY.SLOTS.map((s) => s.i), hero: !!LY.HERO, sofa: !!LY.SOFA, bench: !!LY.BENCH, props: (plan.props || []).length, style: plan.style, bad, door: door.length > 0 };
  });
  ok(r.lokal === l && r.open === EXPECT[l - 1] && r.units === EXPECT[l - 1] && !r.bad.length && r.door, `lokal ${l} (${r.style}): ${r.open} platser [${r.indices.join(',')}] hero=${r.hero} sofa=${r.sofa} bänk=${r.bench} prylar=${r.props}${r.bad.length ? ' – onåbara: ' + r.bad.join(' ') : ''}`);
  await page.screenshot({ path: OUT + `lokal-${l}.png` });
}
// inredningen följde med: hyllorna på 0–2 och spelhyllan på 6 finns kvar i Megastore
const r7 = await page.evaluate(() => PV.game.fit.slots.slice(0, 7).map((s) => s && (s.unit || s.kind)).join(','));
ok(r7 === 'cat,cat,cat,,,,spelhylla', `inredningen följde med genom alla lokaler (${r7})`);
// kunder hittar fram i Megastore: spawna en och låt golvet gå några sekunder
await page.evaluate(() => { const g = PV.game; const c = g.spawn(g.shop.generateOrder(g, ['Nils'])); c.phase = 'arriving'; });
await page.waitForTimeout(4000);
const r8 = await page.evaluate(() => { const c = PV.game.customers.at(-1); return { phase: c.phase, x: Math.round(c.x), y: Math.round(c.y) }; });
ok(r8.phase === 'queue' || r8.phase === 'arriving', `kunden går in (${JSON.stringify(r8)})`);
await page.screenshot({ path: OUT + "lokal-6b-kund.png" });
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
