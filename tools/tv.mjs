// TV-hörnan: prova konsolspel, lagerdialogens REA/hett-märkning och årsskiftets tidningsnotis.
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
await page.evaluate(() => {
  const g = PV.game; g.money = 300000; g.tutorialStep = 99; g.buyItem('lokal2'); g.buyItem('lokal3');
  const F = g.shop.fit, y = g.year;
  g.buySlot(3, F.optionsFor(g.fit, 3, 'medium', y).find((o) => o.id === 'unit:tv').id);
  g.buySlot(4, F.optionsFor(g.fit, 4, 'wide', y).find((o) => o.id === 'unit:spelhylla').id);
  for (const p of g.shop.onSale(y).filter((p) => (p.cat === 'konsol' || p.cat === 'spel') && g.canSell(p))) { g.stock[p.id] = 2; g.shown[p.id] = 2; }
  // ett gammalt lager också (värde sjunkit)
  const old = g.shop.parts.find((p) => p.cat === 'konsol' && p.hype[2] < y - 2); if (old) { g.stock[old.id] = 1; g.shown[old.id] = 1; }
  g.emit('change');
});
await page.waitForTimeout(900);
// TV-hörnan → spela
const pos = await page.evaluate(() => { const f = PV.floor, u = f.units[3], r = f.canvas.getBoundingClientRect(); return { x: r.left + f.offX + (u.x + 50) * f.scale, y: r.top + f.offY + (u.y + 40) * f.scale }; });
await page.mouse.click(pos.x, pos.y);
await page.waitForSelector('[data-play]', { timeout: 12000 }); await page.waitForTimeout(300);
const menu = await page.evaluate(() => ({ h3: [...document.querySelectorAll('.dlg h3')].map((h) => h.textContent.trim()), games: [...document.querySelectorAll('[data-play]')].map((b) => b.dataset.play) }));
ok(menu.h3.length > 0 && menu.games.length > 0, `TV-menyn: ${menu.h3.join(' | ')} → ${menu.games.join(', ')}`);
await page.screenshot({ path: OUT + "tv1-meny.png" });
await page.click('[data-play]');
await page.waitForFunction(() => document.body.dataset.screen === 'play', null, { timeout: 8000 });
await page.waitForTimeout(1500);
await page.keyboard.press('Enter'); await page.waitForTimeout(300);
await page.keyboard.down('ArrowRight'); await page.keyboard.press('Space'); await page.waitForTimeout(800); await page.keyboard.up('ArrowRight');
const p1 = await page.evaluate(() => ({ mode: PV.play.mode, state: PV.play.state, engine: PV.play.engineName, sub: document.querySelector('#play-sub').textContent }));
ok(p1.mode === 'console' && p1.state === 'run', `konsolspel kör: ${p1.engine} (${p1.sub})`);
await page.screenshot({ path: OUT + "tv2-spel.png" });
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
// lagret: märkning
await page.click('[data-h="stock"]'); await page.waitForSelector('.stockrow');
await page.click('[data-tab="konsol"]'); await page.waitForTimeout(200);
const tags = await page.evaluate(() => [...document.querySelectorAll('.stockrow .sp')].map((e) => e.textContent).filter((t) => /REA|hett|samlar/.test(t)));
ok(tags.length > 0, `lagermärkning: ${tags.slice(0, 3).join(' | ')}`);
await page.screenshot({ path: OUT + "tv3-lager.png" });
await page.click('[data-close]');
// nyårsnotis: hoppa till ett år med lansering
const yl = await page.evaluate(() => { const g = PV.game; const next = g.shop.parts.filter((p) => p.cat === 'konsol' && p.year > g.year).sort((a, b) => a.year - b.year)[0]; g.xp = (next.year - g.startYear) * 30; g.emit('levelup', { ...g.levelInfo(), from: next.year - 1 }); return next.year; });
await page.waitForSelector('.news', { timeout: 5000 }); await page.waitForTimeout(200);
const news = await page.evaluate(() => document.querySelector('.news')?.textContent.trim().slice(0, 120));
ok(!!news, `tidningsnotis ${yl}: ${news}`);
await page.screenshot({ path: OUT + "tv4-nyhet.png" });
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
