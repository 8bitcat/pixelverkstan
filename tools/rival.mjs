// Konkurrenten och bokslutet: skylten på andra sidan gatan, styrkan sjunker med rykte, drag med val
// (priskrig / värvning), arg kund som säger vart hen går, bokslut i nyårsdialogen, gala 2000, omladdning.
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
await page.evaluate(() => { const g = PV.game; g.money = 300000; g.tutorialStep = 99; g.stats.served = 5; for (const e of g.shop.events.EVENTS) if (!g.events.seen.includes(e.id)) g.events.seen.push(e.id); g.buyItem('lokal2'); g.buyItem('lokal3'); g.emit('change'); });
await page.waitForTimeout(400);
// 1) konkurrenten finns och skylten sitter på huset mittemot
const r1 = await page.evaluate(() => ({ rival: PV.game.rival, stage: PV.game.shop.events && PV.floor.street.width, spawn: PV.game.spawnMul }));
ok(r1.rival && r1.rival.strength > 0 && r1.rival.stage === 1992, `konkurrent 1999: ${JSON.stringify(r1.rival)}`);
const clip = await page.evaluate(() => { const f = PV.floor, r = f.canvas.getBoundingClientRect(); return { x: r.left + f.offX, y: r.top + f.offY, width: 260 * f.scale, height: 70 * f.scale }; });
await page.screenshot({ path: OUT + "rival1-skylt.png", clip });
// 2) styrkan glider mot målet: högt rykte sänker den
const r2 = await page.evaluate(() => { const g = PV.game; g.stats.stars = 120; return { before: g.rival.strength, rykte: g.rykte }; });
await page.evaluate(() => { const g = PV.game; for (let i = 0; i < 12; i++) { g.rival.t = 30; g.rival.lastMove = g.year; import('./js/core/rival.js').then((R) => R.tickRival(g, 0)); } });
await page.waitForTimeout(500);
const r2b = await page.evaluate(() => PV.game.rival.strength);
ok(r2b < r2.before, `styrkan sjönk med rykte ${r2.rykte}: ${r2.before.toFixed(2)} → ${r2b.toFixed(2)}`);
// 3) drag: priskrig
await page.evaluate(() => { const g = PV.game; g.rival.lastMove = g.year - 3; g.staff = []; });
await page.evaluate(() => import('./js/core/rival.js').then((R) => { const g = PV.game; for (let i = 0; i < 40 && !g.events.pending; i++) { g.rival.t = 30; R.tickRival(g, 0); } }));
await page.waitForSelector('.choice', { timeout: 10000 }); await page.waitForTimeout(300);
const ev = await page.evaluate(() => ({ title: document.querySelector('.dlg h2')?.textContent, pending: PV.game.events.pending, choices: [...document.querySelectorAll('.choice')].map((b) => b.dataset.choice) }));
ok(/ElektroCity/.test(ev.title) && /^rival:/.test(ev.pending) && ev.choices.length === 2, `konkurrentens drag: ${JSON.stringify(ev)}`);
await page.screenshot({ path: OUT + "rival2-drag.png" });
await page.click('.choice'); await page.waitForTimeout(400);
const r3 = await page.evaluate(() => ({ active: PV.game.events.active.map((a) => a.id), pending: PV.game.events.pending, seen: PV.game.events.seen.filter((x) => x.startsWith('rival:')), chip: document.querySelector('.news-chip')?.textContent }));
ok(r3.active.length === 1 && !r3.pending && r3.seen.length === 1 && r3.chip, `valet gäller (${JSON.stringify(r3)})`);
// 4) värvning: anställ en tekniker och låt konkurrenten ringa
await page.evaluate(() => import('./js/core/staff.js').then((S) => { const g = PV.game; const c = S.candidatesFor(g)[0]; g.hire(c.id); }));
await page.evaluate(() => import('./js/core/rival.js').then((R) => { const g = PV.game; g.events.active = []; g.rival.lastMove = g.year - 3; for (let i = 0; i < 60 && !(g.events.pending || '').startsWith('rival:varvning'); i++) { g.events.pending = null; g.events.seen = g.events.seen.filter((x) => !x.startsWith('rival:')); g.rival.lastMove = g.year - 3; g.rival.t = 30; R.tickRival(g, 0); } }));
await page.waitForSelector('[data-choice="lat"]', { timeout: 10000 }); await page.waitForTimeout(300);
await page.screenshot({ path: OUT + "rival3-varvning.png" });
await page.click('[data-choice="lat"]'); await page.waitForTimeout(300);
ok(await page.evaluate(() => PV.game.staff.length === 0), 'teknikern gick över gatan');
// 5) arg kund säger vart hen går
const r5 = await page.evaluate(() => { const g = PV.game; g.rival.strength = 1; let c = null; for (let i = 0; i < 12 && !c?.say; i++) { const o = g.shop.generateOrder(g, ['Olle']); c = g.spawn(o); c.phase = 'queue'; c.x = 318; c.y = 200; g.walkOut(c, 'angry'); } return { say: c.say, mood: c.mood, bubble: c.bubbleT }; });
ok(r5.say === 'ElektroCity' && r5.mood === 'angry', `arg kund: "${r5.say}!"`);
await page.waitForTimeout(400);
await page.screenshot({ path: OUT + "rival4-arg.png" });
// 6) bokslut och gala i nyårsdialogen (1999 → 2000)
await page.evaluate(() => { const g = PV.game; g.customers = []; g.ledger = g.newLedger(g.year); g.stats.earned += 0; const c = g.spawn(g.shop.generateOrder(g, ['Pia'])); c.phase = 'ready'; g.pay({ price: 9000, tip: 500, bonus: 0, total: 9500, xp: 30, stars: 3 }, c); });
await page.waitForSelector('.bokslut', { timeout: 10000 }); await page.waitForTimeout(300);
const r6 = await page.evaluate(() => ({ year: PV.game.year, bok: document.querySelector('.bokslut')?.textContent.slice(0, 200), gala: document.querySelector('.gala')?.textContent.slice(0, 120), years: PV.game.years.length, awards: PV.game.awards.length, last: PV.game.years.at(-1) }));
ok(r6.year === 2000 && /Bokslut 1999/.test(r6.bok) && r6.last.revenue === 9500 && r6.years === 1, `bokslut: ${JSON.stringify(r6.last)}`);
ok(/Galan 2000/.test(r6.gala || '') && r6.awards === 1, `gala 2000: ${r6.gala}`);
await page.screenshot({ path: OUT + "rival5-bokslut-gala.png" });
await page.click('button:has-text("Grymt")'); await page.waitForTimeout(200);
// 7) händelseloggen visar konkurrenten och priset
await page.evaluate(() => { const g = PV.game; const id = Object.keys(g.events.dyn)[0]; g.events.active.push({ id, choice: 'x', until: 2005, effect: {} }); g.emit('change'); }); await page.waitForTimeout(300);
await page.click('.news-chip'); await page.waitForSelector('.dlg'); await page.waitForTimeout(200);
const txt = await page.evaluate(() => document.querySelector('.dlg')?.textContent || '');
ok(/Konkurrent: ElektroCity/.test(txt) && /Priser/.test(txt) && /Galan|Kvarterets|Överlevaren|räkna med|Decenniets/.test(txt), 'händelseloggen visar konkurrenten och priset');
await page.screenshot({ path: OUT + "rival6-logg.png" });
await page.click('[data-close]');
// 8) omladdning
await page.reload(); await page.click('[data-shop="dator"]'); await page.click(`[data-year="${YEAR}"]`);
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(800);
const r8 = await page.evaluate(() => ({ rival: !!PV.game.rival, years: PV.game.years.length, awards: PV.game.awards.length, dyn: Object.keys(PV.game.events.dyn || {}).length }));
ok(r8.rival && r8.years === 1 && r8.awards === 1 && r8.dyn >= 1, `sparat och laddat (${JSON.stringify(r8)})`);
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
