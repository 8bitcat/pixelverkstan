// Egna modeller och händelser i webbläsaren: guiden i tre steg, Datormagazins recension,
// postorder, kund som frågar efter modellen, uppföljare, händelse med val, avtal, HUD-chip
// och omladdning. node tools/modeller.mjs [url] [år]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv[2] || "http://localhost:8777/index.html";
const YEAR = +(process.argv[3] || 1991);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="dator"]'); await page.click(`[data-year="${YEAR}"]`);
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(800);
// pengar, hoppa över guiden, större lokal – och håll händelserna borta tills vi testar dem
await page.evaluate(() => { const g = PV.game; g.money = 200000; g.tutorialStep = 99; g.stats.served = 5; g.buyItem('lokal2'); g.buyItem('lokal3'); for (const e of g.shop.events.EVENTS) if (e.year <= g.year && !g.events.seen.includes(e.id)) g.events.seen.push(e.id); g.emit('change'); });
await page.waitForTimeout(300);
// 1) guiden
ok(!!(await page.$('[data-h="models"]')), 'knappen 🧩 Modeller finns i HUD:en');
await page.click('[data-h="models"]'); await page.waitForSelector('.dlg'); await page.waitForTimeout(150);
await page.screenshot({ path: OUT + "mod1-tom.png" });
await page.click('button:has-text("Ny modell")'); await page.waitForSelector('[data-use]');
await page.click('[data-use="gamer"]'); await page.waitForTimeout(120); await page.click('[data-aud="tonaring"]'); await page.waitForTimeout(120);
await page.screenshot({ path: OUT + "mod2-koncept.png" });
await page.click('button:has-text("Nästa: delar")'); await page.waitForSelector('[data-swap]'); await page.waitForTimeout(150);
const nParts = await page.evaluate(() => document.querySelectorAll('[data-swap]').length);
ok(nParts >= 6, `auto-förslaget gav ${nParts} delar`);
await page.screenshot({ path: OUT + "mod3-delar.png" });
const gpuIdx = await page.evaluate(() => [...document.querySelectorAll('.dlg .prow')].findIndex((r) => /Grafikkort/.test(r.textContent)));
if (gpuIdx >= 0) {
  await page.click(`[data-swap="${gpuIdx}"]`); await page.waitForSelector('[data-pick]'); await page.waitForTimeout(150);
  const n = await page.evaluate(() => document.querySelectorAll('[data-pick]').length);
  ok(n > 0, `${n} grafikkort som passar att välja mellan`);
  await page.screenshot({ path: OUT + "mod4-valjare.png" });
  await page.click('[data-pick]'); await page.waitForSelector('[data-swap]');
}
ok(!(await page.$('.prob')), 'inga problem med bygget');
await page.click('button:has-text("Nästa: pris")'); await page.waitForSelector('#m-price');
await page.click('[data-dp="500"]'); await page.waitForTimeout(150);
await page.click('[data-camp="annons"]'); await page.waitForTimeout(150);
await page.screenshot({ path: OUT + "mod5-pris.png" });
const before = await page.evaluate(() => PV.game.money);
await page.click('button:has-text("Lansera")'); await page.waitForTimeout(400);
const m1 = await page.evaluate(() => { const m = PV.game.models[0]; return m && { id: m.id, name: m.name, state: m.state, price: m.price, camp: m.campaign, n: PV.game.models.length, money: PV.game.money }; });
ok(m1 && m1.state === 'recension' && m1.camp === 'annons' && m1.money < before && m1.name.startsWith('Pixel'), `lanserad: ${JSON.stringify(m1)}`);
await page.screenshot({ path: OUT + "mod6-lista.png" });
await page.click('[data-close]'); await page.waitForTimeout(200);
// 2) recensionen
await page.evaluate(() => { PV.game.models[0].reviewAt = 0; });
await page.waitForSelector('.critic', { timeout: 10000 }); await page.waitForTimeout(300);
const rev = await page.evaluate(() => { const m = PV.game.models[0]; return { state: m.state, total: m.review.total, scores: m.review.scores, title: document.querySelector('.dlg h2')?.textContent, critics: document.querySelectorAll('.critic').length }; });
ok(rev.state === 'sale' && rev.critics === 4 && rev.scores.length === 4 && rev.total >= 4 && rev.total <= 40, `recension: ${JSON.stringify(rev)}`);
await page.screenshot({ path: OUT + "mod7-recension.png" });
await page.click('button:has-text("Stäng")'); await page.waitForTimeout(200);
// 3) postorder: delar i lagret, tvinga fram en försäljningstick
const r3 = await page.evaluate(() => { const g = PV.game, m = g.models[0]; for (const id of m.parts) g.stock[id] = (g.stock[id] || 0) + 3; m.hype = 5; const money = g.money; g.modelTick(); return { sold: m.sold, earned: m.earned, money: g.money - money, units: g.modelUnits(m) }; });
ok(r3.sold >= 1 && r3.money > 0 && r3.units === 3 - r3.sold, `postorder sålde ${r3.sold} st (+${r3.money} kr), delar kvar till ${r3.units}`);
// 4) kund som frågar efter modellen med namn
const r4 = await page.evaluate(() => { const g = PV.game; let o = null; for (let i = 0; i < 300 && !o; i++) { const t = g.shop.generateOrder(g, ['Samos']); if (t?.model) o = t; } if (!o) return null; const c = g.spawn(o); c.phase = 'queue'; c.x = 318; c.y = 176; c._fl = true; c._path = []; c._tkey = 'q0'; g.emit('change'); return { title: o.title, msg: o.msg, price: g.shop.priceFor(o, {}), model: o.model }; });
ok(r4 && r4.model === m1.id && r4.price === m1.price && r4.title === m1.name, `kund vill ha modellen: ${JSON.stringify(r4)}`);
await page.waitForTimeout(400);
await page.evaluate(() => { const g = PV.game, c = g.customers.find((x) => x.order.model); c.phase = 'queue'; c.patience = Infinity; g.customers = [c, ...g.customers.filter((x) => x !== c)]; PV.floor.onCustomerClick(c); });
await page.waitForSelector('.dlg', { timeout: 5000 }); await page.waitForTimeout(250);
await page.screenshot({ path: OUT + "mod8-kund.png" });
await page.click('[data-close]'); await page.waitForTimeout(200);
// 5) uppföljare
await page.click('[data-h="models"]'); await page.waitForSelector('[data-seq]'); await page.click('[data-seq]'); await page.waitForSelector('[data-swap]');
await page.click('button:has-text("Nästa: pris")'); await page.waitForSelector('#m-name');
const seqName = await page.evaluate(() => document.querySelector('#m-name').value);
ok(seqName === m1.name + ' II', `uppföljaren heter ${seqName}`);
await page.click('button:has-text("Lansera")'); await page.waitForTimeout(400);
const r5 = await page.evaluate(() => ({ n: PV.game.models.length, gen: PV.game.models[1]?.gen, prev: PV.game.models[0].state }));
ok(r5.n === 2 && r5.gen === 2 && r5.prev === 'retired', `uppföljare lanserad (${JSON.stringify(r5)})`);
await page.screenshot({ path: OUT + "mod9-uppfoljare.png" });
await page.click('[data-close]'); await page.waitForTimeout(200);
// 6) händelse med val: DOOM 1993
await page.evaluate(() => { const g = PV.game; g.events.seen = g.events.seen.filter((id) => id !== 'doom93'); g.xp = (1993 - g.startYear) * 30; g.emit('change'); });
await page.waitForSelector('.choice', { timeout: 10000 }); await page.waitForTimeout(300);
const ev = await page.evaluate(() => ({ title: document.querySelector('.dlg h2')?.textContent, choices: [...document.querySelectorAll('.choice')].map((b) => ({ id: b.dataset.choice, disabled: b.disabled })), closable: !!document.querySelector('.dlg [data-close]') }));
ok(/DOOM/.test(ev.title) && ev.choices.length === 2 && !ev.choices[0].disabled && !ev.closable, `händelsen visas: ${JSON.stringify(ev)}`);
await page.screenshot({ path: OUT + "mod10-handelse.png" });
const moneyBefore = await page.evaluate(() => PV.game.money);
await page.click('[data-choice="lan"]'); await page.waitForTimeout(500);
const r6 = await page.evaluate(() => { const g = PV.game; return { active: g.events.active.map((a) => a.id), until: g.events.active[0]?.until, spawn: g.eventMul('spawn'), gpu: g.eventMul('cats', 'gpu'), sales: g.eventMul('sales', 'gamer'), chip: document.querySelector('.news-chip')?.textContent, pending: g.events.pending, money: g.money, stars: g.stats.stars }; });
ok(r6.active.includes('doom93') && r6.until === 1994 && r6.spawn === 1.4 && r6.gpu === 2 && r6.sales === 1.5 && /DOOM/.test(r6.chip || '') && !r6.pending && r6.money === moneyBefore - 2000, `valet gäller: ${JSON.stringify(r6)}`);
await page.screenshot({ path: OUT + "mod11-chip.png" });
await page.click('.news-chip'); await page.waitForSelector('.dlg'); await page.waitForTimeout(150);
ok(await page.evaluate(() => /DOOM/.test(document.querySelector('.dlg').textContent)), 'händelseloggen visar DOOM');
await page.screenshot({ path: OUT + "mod12-logg.png" });
await page.click('[data-close]'); await page.waitForTimeout(200);
// 7) avtal (Hem-PC-reformen 1998) kräver en kontorsmodell som säljs
const r7 = await page.evaluate(() => {
  const g = PV.game, MOD = g.shop.models;
  g.xp = (1998 - g.startYear) * 30;
  const parts = MOD.suggestParts('kontor', g.year, (p) => g.canSell(p));
  const id = g.createModel({ name: 'Pixel Kontor', use: 'kontor', aud: 'foretag', parts, campaign: 'ingen' });
  const m = g.modelOf(id); m.reviewAt = 0; g.reviewModel(m);
  for (const pid of m.parts) g.stock[pid] = (g.stock[pid] || 0) + 5;
  // allt fram till 1998 är sett utom Hem-PC-reformen (äldre osedda händelser kommer annars först)
  g.events.seen = [...new Set([...g.events.seen, ...g.shop.events.EVENTS.filter((e) => e.year <= 1998 && e.id !== 'hempc98').map((e) => e.id)])];
  return { id, state: m.state, units: g.modelUnits(m) };
});
ok(r7.state === 'sale' && r7.units === 5, `kontorsmodell klar (${JSON.stringify(r7)})`);
// recensionen för kontorsmodellen dyker upp först – stäng den så att händelsen får plats
await page.waitForSelector('.critic', { timeout: 10000 }); await page.click('button:has-text("Stäng")'); await page.waitForTimeout(200);
await page.waitForSelector('[data-choice="avtal"]', { timeout: 10000 }); await page.waitForTimeout(300);
ok(await page.evaluate(() => !document.querySelector('[data-choice="avtal"]').disabled), 'avtalet går att teckna med en kontorsmodell');
await page.screenshot({ path: OUT + "mod13-avtal.png" });
await page.click('[data-choice="avtal"]'); await page.waitForTimeout(400);
const r8 = await page.evaluate(() => { const g = PV.game; const money = g.money; g.modelTick(); const b = g.bulk[0]; return { bulk: b && { left: b.left, name: b.name }, got: g.money - money, sold: g.modelOf(g.models[2].id).sold }; });
ok(r8.bulk && r8.bulk.left === 9 && r8.got > 0 && r8.sold >= 3, `avtalet levererar 3 åt gången (${JSON.stringify(r8)})`);
// 8) omladdning behåller modeller, händelser och avtal
await page.reload(); await page.click('[data-shop="dator"]'); await page.click(`[data-year="${YEAR}"]`);
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(800);
const r9 = await page.evaluate(() => ({ models: PV.game.models.length, names: PV.game.models.map((m) => m.name), seen: PV.game.events.seen.includes('doom93'), active: PV.game.events.active.length, bulk: PV.game.bulk.length }));
ok(r9.models === 3 && r9.seen && r9.active >= 1 && r9.bulk === 1, `sparat och laddat (${JSON.stringify(r9)})`);
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
