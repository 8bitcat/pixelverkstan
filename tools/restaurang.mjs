// Hamburgerbaren i webbläsaren: starta från menyn, golvet ritas, ta emot första kunden, bygg
// burgaren steg för steg i köket (rosta, grill, lager), servera och få betalt. Skärmdumpar
// tools/out/rest-*.png. node tools/restaurang.mjs [url]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv.find((a) => a.startsWith('http')) || "http://localhost:8777/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
const crash = async (e) => { const NL = String.fromCharCode(10); console.log('KRASCH ' + String(e.message).split(NL)[0]); console.log(errors.join(NL)); try { await page.screenshot({ path: OUT + 'rest-krasch.png' }); } catch {} process.exit(1); };
process.on('unhandledRejection', crash); process.on('uncaughtException', crash);
await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
ok(await page.evaluate(() => !document.querySelector('[data-shop="restaurang"]').classList.contains('locked')), 'Hamburgerbaren går att välja i menyn');
await page.click('[data-shop="restaurang"]');
await page.waitForSelector('[data-year="1996"]', { timeout: 10000 });
await page.click('[data-year="1996"]');
await page.waitForFunction(() => window.PV?.game && PV.game.shop.id === 'restaurang', null, { timeout: 30000 }); await page.waitForTimeout(800);
const st = await page.evaluate(() => ({ money: PV.game.money, year: PV.game.year, sign: PV.game.shop.sign, slots: PV.game.fit.slots.filter(Boolean).length, kit: PV.game.shop.starterKit(PV.game).length, hud: document.querySelector('#hud')?.textContent?.slice(0, 80) }));
ok(st.year === 1996 && st.money > 0 && st.kit > 0, `butiken öppen: ${JSON.stringify(st)}`);
await page.screenshot({ path: OUT + 'rest-1-golv.png' });
// grossisten: ingredienser med ikoner
await page.click('[data-h="shop"]'); await page.waitForTimeout(600);
const gross = await page.evaluate(() => ({ rows: document.querySelectorAll('#modal .prow').length, icons: [...document.querySelectorAll('#modal canvas')].filter((c) => c.width > 0).length, title: document.querySelector('#modal h2')?.textContent }));
ok(gross.rows >= 4 && gross.icons >= 4, `grossisten visar ingredienser med ikoner: ${JSON.stringify(gross)}`);
await page.screenshot({ path: OUT + 'rest-2-grossist.png' });
// köp startpaketet
const kit = await page.evaluate(() => { const b = document.querySelector('#modal [data-kit]'); if (b) { const t = b.textContent; b.click(); return t; } return null; });
await page.waitForTimeout(400);
console.log('startpaket:', kit);
await page.evaluate(() => { const b = [...document.querySelectorAll('#modal .btn')].find((x) => /stäng/i.test(x.textContent)); b?.click(); });
await page.waitForTimeout(300);
// leveransen: packa upp direkt (tålamod i test)
await page.evaluate(() => { const g = PV.game; for (const d of g.deliveries) { d.eta = g.time - 1; } g.update(0.1, { shopVisible: true }); });
await page.waitForTimeout(300);
const deliv = await page.evaluate(() => ({ deliveries: PV.game.deliveries.map((d) => d.state), stock: Object.keys(PV.game.stock).length }));
console.log('leverans', JSON.stringify(deliv));
await page.evaluate(() => { const g = PV.game; for (const d of g.deliveries) { d.eta = g.time - 1; } g.update(0.1, { shopVisible: true }); for (const d of g.deliveries) if (d.state === 'arrived') g.unpack(d.id, true); });
await page.waitForTimeout(300);
const stock = await page.evaluate(() => ({ stock: Object.entries(PV.game.stock).filter(([, n]) => n > 0).length, shown: Object.entries(PV.game.shown).filter(([, n]) => n > 0).length, hasShown: PV.game.hasShown() }));
ok(stock.stock > 5, `lagret fyllt: ${JSON.stringify(stock)}`);
const disp = await page.evaluate(() => { PV.floor.sig = null; PV.floor.refreshStock(); const c = PV.floor.display?.img; if (!c) return null; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return { w: c.width, h: c.height, painted: n }; });
ok(disp && disp.painted > 300, `kyldisken på disken visar råvarorna i skålar: ${JSON.stringify(disp)}`);
const lay = await page.evaluate(async () => { const LY = await import('./js/core/floor-layout.js'); return { q: LY.QUEUE[0], p: LY.PICKUP[0], keeper: LY.KEEPER_HOME }; });
ok(lay.q[0] > 400 && lay.p[0] < 400, `kön vid kassan till höger, luckan ovanpå kyldisken till vänster: ${JSON.stringify(lay)}`);
// första kunden (tutorial): teleportera till kön och ta emot
await page.evaluate(() => { const g = PV.game; g.spawnTimer = 0; g.update(0.05, { shopVisible: true }); });
await page.waitForFunction(() => PV.game.customers.length > 0, null, { timeout: 20000 });
await page.evaluate(() => { const c = PV.game.customers[0]; c.phase = 'queue'; c.x = 453; c.y = 176; c._path = []; c._tkey = 'q0'; c.moving = false; });
await page.waitForTimeout(400);
await page.evaluate(() => { const c = PV.game.queue()[0]; PV.floor.onCustomerClick(c); });
await page.waitForTimeout(400);
const dlg = await page.evaluate(() => ({ title: document.querySelector('#modal h2')?.textContent, body: document.querySelector('#modal')?.textContent?.slice(0, 200) }));
ok(/Ny kund/.test(dlg.title || ''), `beställningsdialogen: ${dlg.title}`);
await page.screenshot({ path: OUT + 'rest-3-kund.png' });
await page.evaluate(() => { const b = [...document.querySelectorAll('#modal .btn')].find((b) => /Ta emot/.test(b.textContent)); b?.click(); });
await page.waitForFunction(() => document.body.dataset.screen === 'build', null, { timeout: 10000 }); await page.waitForTimeout(800);
const bv = await page.evaluate(() => { const v = PV.build; return { title: document.querySelector('#build-title')?.textContent, slots: v.L.SLOTS.length, tray: v.trayEntries().length, steps: v.steps().map((s) => s.key), next: v.nextStep()?.key, btn: document.querySelector('#build-boot')?.textContent, guide: document.querySelector('#build-guide')?.textContent?.slice(0, 80) }; });
ok(bv.slots >= 5 && bv.tray >= 5 && bv.next === 'act:rosta', `köket öppet: ${JSON.stringify(bv)}`);
await page.screenshot({ path: OUT + 'rest-4-kok.png' });
// släpp brödet rakt på brödrosten (proffsläget): stationen ska ta emot råvaran och rosta
const drop = await page.evaluate(() => {
  const v = PV.build, L = v.L, e = v.trayEntries().find((x) => x.part.cat === 'brod');
  const [x, y] = v.P.proj(...L.ACTION.rosta.points[0]);
  v.dropAt(e, [x + 6, y - 4]);
  const rostat = L.actDone(v.b, 'rosta');
  const biff = v.trayEntries().find((x) => x.part.cat === 'biff'), [gx, gy] = v.P.proj(...L.ACTION.grill.points[0]);
  v.dropAt(biff, [gx, gy]);
  return { rostat, grill: L.actCount(v.b, 'grill'), msg: (v.msg?.html || '').replace(/<[^>]+>/g, '').slice(0, 60) };
});
ok(drop.rostat && drop.grill === 1, `brödet släppt på brödrosten rostar, biffen släppt på grillen läggs på: ${JSON.stringify(drop)}`);
await page.screenshot({ path: OUT + 'rest-4c-hand.png' });
// ta det rostade brödet från brödrosten med handen (tryck på det, inte i lådan) och lägg det på tallriken
const pick = await page.evaluate(() => {
  const v = PV.build, L = v.L, pus = L.pickups(v.b), pu = pus.find((p) => p.id === 'rosta');
  if (!pu) return { pus: pus.map((p) => p.id) };
  const r = v.canvas.getBoundingClientRect();
  const tap = (pt, id) => { const o = { clientX: r.left + pt[0], clientY: r.top + pt[1], pointerId: id, bubbles: true, isPrimary: true }; v.canvas.dispatchEvent(new PointerEvent('pointerdown', o)); v.canvas.dispatchEvent(new PointerEvent('pointerup', o)); };
  const hint = v.hintText();
  tap(v.P.proj(...pu.at), 1);
  const held = v.selected, msg = (v.msg?.html || '').replace(/<[^>]+>/g, '');
  tap(v.P.proj(...L.SLOT.l0.anchor), 2);
  return { pus: pus.map((p) => p.id), held, msg, l0: v.b.placed.l0?.id, station: v.b.station, hint: hint.replace(/<[^>]+>/g, '') };
});
ok(pick.held && pick.l0 && pick.station?.rosta === pick.l0, `brödet togs från brödrosten med handen och lades på tallriken: ${JSON.stringify(pick)}`);
// bygg via byggvyns egna funktioner i hjälpens ordning
const midShot = page.waitForFunction(() => window.__midShot, null, { timeout: 20000 }).then(() => page.screenshot({ path: OUT + 'rest-4b-markering.png' })).catch(() => {});
const nogul = await page.evaluate(() => {
  const v = PV.build, s = v.L.SLOT.l1;
  return { ring: !!s?.ring, slots: v.L.SLOTS.filter((x) => x.k !== undefined).every((x) => x.ring) };
});
ok(nogul.ring && nogul.slots, 'burgarens lager markeras med pil (ring), inte en gul ruta över maten');
const built = await page.evaluate(async () => {
  const v = PV.build, L = v.L, log = [];
  for (let guard = 0; guard < 40; guard++) {
    const s = v.nextStep(); if (!s || s.kind === 'stand') break;
    if (s.kind === 'act') { const a = L.ACTION[s.id]; const done = L.actSet(v.b, a.id); const i = a.points.findIndex((p, k) => !done.has(k)); v.doAction(a, i); v.b.time += 8; /* tillagningen tar tid */ log.push('act:' + a.id + ':' + i); }
    else if (s.kind === 'slot') { const e = v.trayEntries().find((x) => x.key === s.entryKey) || v.partEntries().find((x) => L.slotsFor(x.part).some((sl) => sl.id === s.id)); if (!e) { log.push('ingen del för ' + s.id); break; } if (s.id === 'l3') { v.selected = e.key; await new Promise((r) => setTimeout(r, 250)); window.__midShot = true; await new Promise((r) => setTimeout(r, 900)); v.selected = null; } const r = v.place(e, L.SLOT[s.id]); log.push('slot:' + s.id + ':' + (r ? 'ok' : 'nej')); }
    await new Promise((r) => setTimeout(r, 30));
  }
  return { log, built: v.isBuilt(), placed: Object.keys(v.b.placed).length, msg: v.msg?.html?.slice(0, 120) };
});
await midShot;
ok(built.built, `burgaren byggd: ${JSON.stringify(built)}`);
await page.waitForTimeout(500);
await page.screenshot({ path: OUT + 'rest-5-burgare.png' });
// servera
await page.click('#build-boot'); await page.waitForTimeout(500);
const fin = await page.evaluate(() => ({ phase: PV.build.phase, btn: document.querySelector('#build-boot')?.textContent, hint: PV.build.finale.hintText() }));
ok(fin.phase === 'desk' && /Tillbaka/.test(fin.btn), `finalen: ${JSON.stringify(fin)}`);
await page.screenshot({ path: OUT + 'rest-6-servering.png' });
await page.evaluate(() => { const f = PV.build.finale; f.onPointerDown([f.serveBtn[0] + 10, f.serveBtn[1] + 10]); });
await page.waitForTimeout(450);
const mid = await page.evaluate(() => ({ plateT: PV.build.finale.plateT, run: !!PV.build.finale.run }));
ok(mid.run && mid.plateT > 0 && mid.plateT < 1, `tallriken glider mot luckan (${mid.plateT})`);
await page.screenshot({ path: OUT + 'rest-7-glider.png' });
await page.waitForFunction(() => PV.game.customers[0]?.phase === 'ready', null, { timeout: 15000 }); await page.waitForTimeout(400);
const said = await page.evaluate(() => PV.game.customers[0]?.sayPickup || '');
ok(said.length > 5, `kundens omdöme sägs vid luckan: ${said}`);
const meal = await page.evaluate(() => PV.game.customers[0]?.meal || null);
ok(meal && meal.layers.length >= 5 && meal.layers[0].startsWith('brod') && meal.layers.at(-1).startsWith('brod'), `måltiden som byggdes följer med kunden: ${JSON.stringify(meal)}`);
const after = await page.evaluate(() => { const c = PV.game.customers[0]; return { money: PV.game.money, screen: document.body.dataset.screen, modal: document.querySelector('#modal h2')?.textContent, phase: c?.phase, payout: c?.payout?.total }; });
ok(after.phase === 'ready' && after.payout > 0 && /disken|nöjd/i.test(after.modal || ''), `kunden hämtar och betalar ${after.payout} kr vid luckan: ${JSON.stringify(after)}`);
await page.screenshot({ path: OUT + 'rest-8-betalt.png' });
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
