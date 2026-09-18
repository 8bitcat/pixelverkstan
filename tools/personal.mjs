// Personal: Källarhålan har ingen plats, anställ tekniker + säljare, säljaren tar emot kunden,
// teknikern bygger klart, kurs, lön, spelaren tar över, sparka, omladdning. node tools/personal.mjs [url] [år]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv[2] || "http://localhost:8777/index.html";
const YEAR = +(process.argv[3] || 1999);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
const crash = async (e) => { const NL = String.fromCharCode(10); console.log('KRASCH ' + String(e.message).split(NL)[0]); try { console.log('DIALOG: ' + (await page.evaluate(() => document.querySelector('.dlg')?.innerText?.slice(0, 300) || '(ingen)'))); } catch {} console.log(errors.join(NL)); process.exit(1); };
process.on('unhandledRejection', crash); process.on('uncaughtException', crash);
await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="dator"]'); await page.click(`[data-year="${YEAR}"]`);
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(800);
await page.evaluate(() => { const g = PV.game; g.money = 300000; g.tutorialStep = 99; for (const e of g.shop.events.EVENTS) if (!g.events.seen.includes(e.id)) g.events.seen.push(e.id); g.emit('change'); });
await page.waitForTimeout(300);
// 1) Källarhålan: ingen plats
await page.click('[data-h="staff"]'); await page.waitForSelector('.dlg'); await page.waitForTimeout(150);
ok(await page.evaluate(() => /inte plats/.test(document.querySelector('.dlg').textContent)), 'Källarhålan har inte plats för anställda');
await page.screenshot({ path: OUT + "personal1-kallare.png" });
await page.click('[data-close]');
await page.evaluate(() => { PV.game.buyItem('lokal2'); PV.game.buyItem('lokal3'); });
await page.waitForTimeout(300);
// 2) anställ en tekniker och en säljare
await page.click('[data-h="staff"]'); await page.waitForSelector('[data-tab="sokande"]'); await page.click('[data-tab="sokande"]'); await page.waitForSelector('[data-hire]'); await page.waitForTimeout(150);
await page.screenshot({ path: OUT + "personal2-sokande.png" });
const cands = await page.evaluate(() => PV.game.staffing.cands.map((c) => ({ id: c.id, role: c.role, lon: c.lon })));
ok(cands.length === 4 && cands.filter((c) => c.role === 'tekniker').length === 2, `fyra sökande (${cands.map((c) => c.role).join(', ')})`);
const m0 = await page.evaluate(() => PV.game.money);
await page.click(`[data-hire="${cands.find((c) => c.role === 'tekniker').id}"]`); await page.waitForTimeout(200);
await page.click('[data-tab="sokande"]'); await page.waitForSelector('[data-hire]');
await page.click(`[data-hire="${cands.find((c) => c.role === 'saljare').id}"]`); await page.waitForTimeout(200);
const r1 = await page.evaluate(() => ({ n: PV.game.staff.length, roles: PV.game.staff.map((s) => s.role), money: PV.game.money, max: document.querySelector('.fit-head')?.textContent }));
ok(r1.n === 2 && r1.roles.includes('tekniker') && r1.roles.includes('saljare') && r1.money === m0, `två anställda (${JSON.stringify(r1)}) – lönen dras varje månad, inte vid anställning`);
await page.screenshot({ path: OUT + "personal3-anstallda.png" });
await page.click('[data-close]'); await page.waitForTimeout(200);
ok(await page.evaluate(() => /Personal 2/.test(document.querySelector('[data-h="staff"]').textContent)), 'HUD visar 👥 Personal 2');
// 3) säljaren tar emot en kund vars delar finns hemma
await page.evaluate(() => {
  const g = PV.game; let o = null;
  for (let i = 0; i < 120 && !o; i++) { const t = g.shop.generateOrder(g, ['Gunnar']); if (t && !t.product && !t.repair && !t.model && t.items.every((it) => it.part)) o = t; }
  for (const it of o.items) g.stock[it.part] = (g.stock[it.part] || 0) + 1;
  const c = g.spawn(o); c.phase = 'queue'; c.x = 318; c.y = 176; c._fl = true; c._path = []; c._tkey = 'q0'; c.patience = Infinity;
  g.customers = [c, ...g.customers.filter((x) => x !== c)]; g.emit('change');
});
await page.waitForFunction(() => PV.game.orders.length >= 1, null, { timeout: 15000 });
const r2 = await page.evaluate(() => ({ sales: PV.game.staff.find((s) => s.role === 'saljare').sales, title: PV.game.orders[0].title }));
ok(r2.sales >= 1, `säljaren tog emot ${r2.title}`);
// 4) teknikern tar jobbet och bygger klart
await page.waitForFunction(() => !!PV.game.orders[0]?.staff, null, { timeout: 15000 }); await page.waitForTimeout(600);
await page.screenshot({ path: OUT + "personal4-golvet.png" });
const clip = await page.evaluate(() => { const f = PV.floor, r = f.canvas.getBoundingClientRect(); return { x: r.left + f.offX + 250 * f.scale, y: r.top + f.offY + 60 * f.scale, width: 262 * f.scale, height: 120 * f.scale }; });
await page.screenshot({ path: OUT + "personal4b-disken.png", clip });
ok(await page.evaluate(() => /Ta över/.test(document.querySelector('#orders').textContent) && /%/.test(document.querySelector('#orders').textContent)), 'beställningskortet visar teknikern och procent');
await page.evaluate(() => { PV.game.staff.find((s) => s.role === 'tekniker').progress = 0.995; });
await page.waitForFunction(() => PV.game.orders.length === 0, null, { timeout: 15000 });
const r3 = await page.evaluate(() => { const c = PV.game.customers.find((x) => x.phase === 'ready'); const t = PV.game.staff.find((s) => s.role === 'tekniker'); return { ready: !!c?.payout, stars: c?.payout?.stars, jobs: t.jobs, energy: t.energy, xp: t.xp }; });
ok(r3.ready && r3.jobs === 1 && r3.stars >= 1 && r3.energy < 100, `teknikern byggde klart (${JSON.stringify(r3)})`);
// 5) spelaren tar över nästa jobb
await page.evaluate(() => {
  const g = PV.game; g.customers = g.customers.filter((c) => c.phase !== 'ready'); let o = null;
  for (let i = 0; i < 120 && !o; i++) { const t = g.shop.generateOrder(g, ['Sven']); if (t && !t.product && !t.repair && !t.model && t.items.every((it) => it.part)) o = t; }
  for (const it of o.items) g.stock[it.part] = (g.stock[it.part] || 0) + 1;
  const c = g.spawn(o); c.phase = 'queue'; c.patience = Infinity; g.customers = [c, ...g.customers.filter((x) => x !== c)]; g.accept(c);
});
await page.waitForFunction(() => !!PV.game.orders[0]?.staff, null, { timeout: 15000 });
await page.evaluate(() => PV.openBuild(PV.game.orders[0])); await page.waitForTimeout(500);
const r4 = await page.evaluate(() => ({ staff: PV.game.orders[0]?.staff, touched: PV.game.orders[0]?.touched, job: PV.game.staff.find((s) => s.role === 'tekniker').job, screen: document.body.dataset.screen }));
ok(!r4.staff && r4.touched && !r4.job && r4.screen === 'build', `spelaren tog över bygget (${JSON.stringify(r4)})`);
const modeBtn = await page.$('button:has-text("Med hjälp")'); if (modeBtn) { await modeBtn.click(); await page.waitForTimeout(300); }
await page.click('#build-back'); await page.waitForTimeout(300);
// 6) kurs
await page.click('[data-h="staff"]'); await page.waitForSelector('[data-course]'); await page.click('[data-course]'); await page.waitForSelector('[data-take]'); await page.waitForTimeout(150);
await page.screenshot({ path: OUT + "personal5-kurs.png" });
const before = await page.evaluate(() => { const s = PV.game.staff[0]; return { sum: s.stats.bygg + s.stats.service + s.stats.salj, money: PV.game.money }; });
await page.click('[data-take]:not([disabled])'); await page.waitForTimeout(300);
const r5 = await page.evaluate(() => ({ course: !!PV.game.staff[0].course, money: PV.game.money }));
ok(r5.course && r5.money < before.money, `kursen är betald och påbörjad (${before.money - r5.money} kr)`);
await page.click('[data-close]');
await page.evaluate(() => { PV.game.staff[0].course.left = 0.01; });
await page.waitForFunction(() => !PV.game.staff[0].course, null, { timeout: 10000 });
const after = await page.evaluate(() => { const s = PV.game.staff[0]; return s.stats.bygg + s.stats.service + s.stats.salj; });
ok(after === before.sum + 1, `kursen gav +1 stat (${before.sum} → ${after})`);
// 7) lön
const m1 = await page.evaluate(() => { PV.game.staffing.payT = 59.9; return PV.game.money; });
await page.waitForFunction((m) => PV.game.money < m, m1, { timeout: 8000 });
const paid = await page.evaluate((m) => m - PV.game.money, m1);
ok(paid === await page.evaluate(() => PV.game.staff.reduce((s, x) => s + x.lon, 0)), `lönerna drogs: ${paid} kr`);
// 8) sparka via dialogen
await page.click('[data-h="staff"]'); await page.waitForSelector('[data-fire]'); await page.click('[data-fire]'); await page.waitForSelector('button:has-text("Ja, sparka")'); await page.click('button:has-text("Ja, sparka")'); await page.waitForTimeout(200);
ok(await page.evaluate(() => PV.game.staff.length === 1), 'en anställd sparkad');
await page.click('[data-close]');
// 9) omladdning
await page.reload(); await page.click('[data-shop="dator"]'); await page.click(`[data-year="${YEAR}"]`);
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(800);
const r9 = await page.evaluate(() => ({ n: PV.game.staff.length, job: PV.game.staff[0]?.job, cands: PV.game.staffing.cands.length }));
ok(r9.n === 1 && !r9.job && r9.cands >= 2, `sparat och laddat (${JSON.stringify(r9)})`);
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
