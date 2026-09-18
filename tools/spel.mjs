// Spela: arkadmaskin (mynt → spel → poäng) och speldatorn (sätt ihop → FPS-räknare / felskärm).
// node tools/spel.mjs [url] [år]   – skärmdumpar i tools/out/spel-*.png
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
await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="dator"]'); await page.click(`[data-year="${YEAR}"]`);
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(1200);
// rik butik med två arkadmaskiner och spelbord
const r0 = await page.evaluate(() => {
  const g = PV.game; g.money = 500000; g.buyItem('lokal2'); g.buyItem('lokal3'); g.buyItem('lokal4'); g.buyItem('lokal5'); g.buyItem('lager2'); g.buyItem('lager3'); g.buyItem('lager4');
  const F = g.shop.fit, y = g.year;
  const arc = F.optionsFor(g.fit, 5, 'small', y).filter((o) => /arkad:/.test(o.id)).sort((p, q) => q.hype - p.hype);
  g.buySlot(5, arc[0].id); g.buySlot(7, (arc[1] || arc[0]).id);
  g.buySlot(6, F.optionsFor(g.fit, 6, 'wide', y).find((o) => o.id === 'unit:spelbord').id);
  return { arc: arc.slice(0, 2).map((a) => a.title), slots: g.fit.slots.map((s) => s && (s.product || s.unit || s.kind)) };
});
ok(r0.slots[5]?.startsWith('a-') && r0.slots[6] === 'spelbord', `arkad + spelbord (${JSON.stringify(r0)})`);
await page.waitForTimeout(600);
// klicka på arkadmaskinen (plats 6) via golvets klickhantering
const pos = await page.evaluate(() => { const f = PV.floor, u = f.units[5], r = f.canvas.getBoundingClientRect(); return { x: r.left + f.offX + (u.x + 20) * f.scale, y: r.top + f.offY + (u.y + 40) * f.scale }; });
await page.mouse.click(pos.x, pos.y);
await page.waitForFunction(() => document.body.dataset.screen === 'play', null, { timeout: 8000 });
await page.waitForTimeout(500);
const p0 = await page.evaluate(() => ({ state: PV.play.state, mode: PV.play.mode, title: document.querySelector('#play-title').textContent }));
ok(p0.state === 'coin' && p0.mode === 'arcade', `arkadmaskinen öppnades: ${p0.title} (${p0.state})`);
await page.screenshot({ path: OUT + "spel1-coin.png" });
await page.keyboard.press('Enter'); await page.waitForTimeout(300);
// spela: håll höger + skjut i två sekunder
await page.keyboard.down('ArrowRight'); for (let i = 0; i < 12; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(150); } await page.keyboard.up('ArrowRight');
await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(600); await page.keyboard.up('ArrowLeft');
const p1 = await page.evaluate(() => ({ state: PV.play.state, engine: PV.play.engineName, score: PV.play.game?.score, over: PV.play.game?.over, t: Math.round(PV.play.t) }));
ok(p1.state === 'run' && p1.engine && p1.t >= 2, `spelet kör: ${p1.engine}, poäng ${p1.score} (${JSON.stringify(p1)})`);
await page.screenshot({ path: OUT + "spel2-arkad.png" });
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
ok(await page.evaluate(() => document.body.dataset.screen === 'shop'), 'tillbaka i butiken efter Esc');
// den andra maskinen också (annan motor)
const pos2 = await page.evaluate(() => { const f = PV.floor, u = f.units[7], r = f.canvas.getBoundingClientRect(); return { x: r.left + f.offX + (u.x + 20) * f.scale, y: r.top + f.offY + (u.y + 40) * f.scale }; });
await page.mouse.click(pos2.x, pos2.y);
await page.waitForFunction(() => document.body.dataset.screen === 'play', null, { timeout: 8000 });
await page.keyboard.press('Space'); await page.waitForTimeout(1500); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Space'); await page.waitForTimeout(600);
const p2 = await page.evaluate(() => ({ engine: PV.play.engineName, state: PV.play.state, title: document.querySelector('#play-title').textContent }));
ok(p2.state === 'run', `andra maskinen kör: ${p2.title} → ${p2.engine}`);
await page.screenshot({ path: OUT + "spel3-arkad2.png" });
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
// speldatorn: köp in delar, sätt ihop
const r1 = await page.evaluate(() => {
  const g = PV.game, y = g.year, C = g.shop.compat, pool = g.shop.onSale(y);
  const by = (cat) => pool.filter((p) => p.cat === cat).sort((a, b) => b.cost - a.cost);
  // bästa dator som går ihop: dyrast processor som passar ett moderkort osv
  let pick = null;
  for (const cpu of by('cpu')) { for (const mb of by('mb')) { if (!C.cpuFitsMb(cpu, mb)) continue; const ram = by('ram').find((r) => C.ramFitsMb(r, mb)); const cs = by('case').find((c) => C.caseFitsMb(c, mb)); const st = by('storage').find((s) => C.storageFitsMb(s, mb)); const gpu = by('gpu').find((x) => C.cardsFit([x.bus], mb)); const cooler = cpu.needs !== 'none' ? by('cooler').find((c) => C.coolerFitsCpu(c, cpu)) : null; const psu = by('psu').find((p) => C.psuFits(p, mb, cpu, gpu).ok && p.watt >= C.wattNeed(cpu, gpu, 0, y)); if (ram && cs && st && gpu && psu && (cooler || cpu.needs === 'none')) { pick = { cpu, mb, ram, case: cs, storage: st, gpu, psu, ...(cooler ? { cooler } : {}) }; break; } } if (pick) break; }
  if (!pick) return { none: true };
  for (const p of Object.values(pick)) { g.stock[p.id] = (g.stock[p.id] || 0) + 1; }
  const parts = Object.fromEntries(Object.entries(pick).map(([c, p]) => [c, p.id]));
  return { problems: g.deskProblems(parts), built: g.deskBuild(parts), pc: g.deskPc, cpu: pick.cpu.name, gpu: pick.gpu.name };
});
ok(!r1.none && r1.built && r1.problems.length === 0, `speldatorn ihopsatt: ${r1.cpu} + ${r1.gpu}`);
await page.waitForTimeout(500);
await page.screenshot({ path: OUT + "spel4-spelbord.png" });
// spelmenyn
const pos3 = await page.evaluate(() => { const f = PV.floor, u = f.units[6], r = f.canvas.getBoundingClientRect(); return { x: r.left + f.offX + (u.x + 90) * f.scale, y: r.top + f.offY + (u.y + 30) * f.scale }; });
await page.mouse.click(pos3.x, pos3.y);
await page.waitForSelector('[data-play]', { timeout: 8000 }); await page.waitForTimeout(300);
const menu = await page.evaluate(() => [...document.querySelectorAll('.gamerow')].map((r) => r.querySelector('.nm').textContent.trim() + ' → ' + r.querySelector('.fpsbadge').textContent.trim()));
ok(menu.length > 0, `spelmenyn: ${menu.join(' | ')}`);
await page.screenshot({ path: OUT + "spel5-spelmeny.png" });
// spela det spel som går bäst
const best = await page.evaluate(() => { const rows = [...document.querySelectorAll('.gamerow')]; const r = rows.find((x) => /FPS/.test(x.querySelector('.fpsbadge').textContent)) || rows[0]; return r.querySelector('[data-play]').dataset.play; });
await page.click(`[data-play="${best}"]`);
await page.waitForFunction(() => document.body.dataset.screen === 'play', null, { timeout: 8000 });
await page.waitForTimeout(2600);
await page.keyboard.down('ArrowUp'); await page.waitForTimeout(800); await page.keyboard.up('ArrowUp'); await page.keyboard.press('Space'); await page.waitForTimeout(700);
const p3 = await page.evaluate(() => ({ state: PV.play.state, engine: PV.play.engineName, target: PV.play.targetFps, fps: PV.play.fpsSamples.length, err: PV.play.error }));
ok(p3.state === 'run' && p3.fps > 0, `speldatorn kör ${best}: ${p3.engine}, mål ${p3.target} fps, uppmätt ${p3.fps} (${JSON.stringify(p3)})`);
await page.screenshot({ path: OUT + "spel6-pc-fps.png" });
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// felskärm: ett spel som inte går (om det finns)
const bad = await page.evaluate(() => { const g = PV.game; const m = PV.play; return null; });
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
