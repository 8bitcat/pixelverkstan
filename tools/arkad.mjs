// Arkadrummet: Datorhuset → köp maskiner under fliken → gå in i rummet → spela → tillbaka.
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
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(1000);
ok(await page.evaluate(() => !document.querySelector('[data-h="arcade"]')), 'ingen arkadknapp i den lilla lokalen');
await page.evaluate(() => { const g = PV.game; g.money = 600000; g.tutorialStep = 99; g.buyItem('lokal2'); g.buyItem('lokal3'); });
await page.waitForTimeout(400);
ok(await page.evaluate(() => !!document.querySelector('[data-h="arcade"]')), 'arkadknappen dyker upp med Datorhuset');
// köp via fliken
await page.click('[data-h="fit"]'); await page.waitForSelector('[data-tab="arkad"]'); await page.click('[data-tab="arkad"]'); await page.waitForSelector('[data-buyarc]');
await page.screenshot({ path: OUT + "arkad1-flik.png" });
const ids = await page.evaluate(() => [...document.querySelectorAll('[data-buyarc]')].slice(0, 5).map((b) => b.dataset.buyarc));
for (const id of ids) { await page.click(`[data-buyarc="${id}"]`); await page.waitForTimeout(150); }
const r0 = await page.evaluate(() => ({ n: PV.game.fit.arcade.length, list: PV.game.fit.arcade, drag: PV.game.fitStats.drag }));
ok(r0.n === ids.length && r0.drag >= 5, `köpte ${r0.n} maskiner (${r0.list.join(', ')}), drag ${r0.drag}`);
await page.click('[data-close]');
// in i rummet
await page.click('[data-h="arcade"]');
await page.waitForFunction(() => document.body.dataset.screen === 'arcade', null, { timeout: 5000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: OUT + "arkad2-rummet.png" });
const clip = await page.evaluate(() => { const a = document.querySelector('#arcade-canvas').getBoundingClientRect(); return { x: a.left, y: a.top, width: a.width, height: a.height }; });
await page.screenshot({ path: OUT + "arkad3-rummet-zoom.png", clip });
// klicka på tredje skåpet → gå dit → spela
const pos = await page.evaluate(() => { const c = document.querySelector('#arcade-canvas').getBoundingClientRect(); return { x: c.left + (26 + 2 * 58 + 20) * 1.0, y: c.top }; });
const scale = await page.evaluate(() => { const A = window.PV; return null; });
const target = await page.evaluate(() => { const c = document.querySelector('#arcade-canvas').getBoundingClientRect(); const r = c; return { l: r.left, t: r.top, w: r.width, h: r.height }; });
// beräkna skalan som rummet använder: rummet är 512×300 centrerat
const s = Math.min((target.w - 16) / 512, (target.h - 16) / 300), sc = s >= 2 ? Math.floor(s * 2) / 2 : s;
const offX = Math.round((target.w - 512 * sc) / 2), offY = Math.round((target.h - 300 * sc) / 2);
await page.mouse.click(target.l + offX + (26 + 2 * 58 + 20) * sc, target.t + offY + (150 - 40) * sc);
await page.waitForFunction(() => document.body.dataset.screen === 'play', null, { timeout: 8000 });
await page.waitForTimeout(400);
const p1 = await page.evaluate(() => ({ mode: PV.play.mode, title: document.querySelector('#play-title').textContent, state: PV.play.state }));
ok(p1.mode === 'arcade' && p1.state === 'coin', `spelet öppnades från rummet: ${p1.title}`);
await page.keyboard.press('Enter'); await page.waitForTimeout(600);
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
ok(await page.evaluate(() => document.body.dataset.screen === 'arcade'), 'tillbaka i arkadrummet efter spelet');
// tillbaka till butiken via knappen, och sparat
await page.click('#arcade-back'); await page.waitForTimeout(300);
ok(await page.evaluate(() => document.body.dataset.screen === 'shop'), 'tillbaka i butiken');
await page.reload(); await page.click('[data-shop="dator"]'); await page.click(`[data-year="${YEAR}"]`);
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(600);
ok(await page.evaluate(() => PV.game.fit.arcade.length === 5), 'maskinerna finns kvar efter omladdning');
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
