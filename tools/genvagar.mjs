// Tangentgenvägar: varje HUD-knapp har en bokstav, M öppnar snabbmenyn, dialogernas knappar och flikar har egna
// tangenter, siffror öppnar beställningar. I 3D släpps musen när en dialog öppnas och låses igen av sig själv när den
// stängs (ingen Esc), och telefonen på disken öppnar samma meny. node tools/genvagar.mjs [url]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const URL = process.argv.find((a) => a.startsWith('http')) || "http://localhost:8777/index.html";
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
const modal = () => page.evaluate(() => { const m = document.querySelector('#modal'); return m.classList.contains('hidden') ? null : (m.querySelector('h2')?.textContent || '?'); });
const press = async (k, ms = 250) => { await page.keyboard.press(k); await page.waitForTimeout(ms); };

await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="restaurang"]'); await page.click('[data-year="1996"]');
await page.waitForFunction(() => window.PV?.game && PV.game.shop.id === 'restaurang', null, { timeout: 30000 }); await page.waitForTimeout(600);
await page.evaluate(() => { const g = PV.game; g.money = 90000; g.tutorialStep = 99; g.stats.served = 9; g.spawnTimer = 9999; g.customers.length = 0; g.orders.length = 0; g.emit('change'); PV.floor.build(); });
await page.waitForTimeout(400);

// ---------- 2D: HUD-knapparna ----------
const hud = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#hud .btn[data-h]')].map((b) => [b.dataset.h, b.querySelector('kbd')?.textContent || ''])));
ok(hud.shop === 'G' && hud.stock === 'L' && hud.fit === 'B' && hud.quick === 'M', `HUD-knapparna visar sin bokstav: ${JSON.stringify(hud)}`);
await press('g'); let t = await modal(); ok(/Grossist/i.test(t || ''), `G öppnar grossisten ("${t}")`);
const tabs = await page.evaluate(() => [...document.querySelectorAll('#modal [data-tab]')].slice(0, 3).map((b) => b.querySelector('kbd')?.textContent));
if (tabs.length > 1) { await press('2'); const on = await page.evaluate(() => [...document.querySelectorAll('#modal [data-tab]')].findIndex((b) => b.classList.contains('on'))); ok(tabs[1] === '2' && on === 1, `flikarna har siffror (${tabs.join(' ')}) och 2 byter till andra fliken`); }
await press('g'); ok((await modal()) === null, 'samma bokstav stänger rutan igen');
await press('l'); t = await modal(); ok(/Lager|Förråd|Kyl/i.test(t || ''), `L öppnar lagret ("${t}")`);
await press('Escape'); ok((await modal()) === null, 'Esc stänger rutan');
await press('m'); t = await modal();
const qm = await page.evaluate(() => [...document.querySelectorAll('#modal .quickmenu [data-key]')].map((b) => b.dataset.key + ':' + (b.dataset.q || 'order')));
ok(/Meny/.test(t || '') && qm.includes('G:shop') && qm.includes('L:stock') && qm.includes('B:fit') && qm.includes('H:menu'), `M öppnar snabbmenyn: ${qm.join(' ')}`);
await press('b'); t = await modal(); ok(/Butik|Restaurang|Lokal|Inred/i.test(t || '') && !/Meny/.test(t || ''), `bokstaven i snabbmenyn öppnar rätt ruta ("${t}")`);
await press('b'); ok((await modal()) === null, 'och samma bokstav stänger den');
await press('m'); await press('m'); ok((await modal()) === null, 'M stänger snabbmenyn');

// ---------- dialogens egna knappar ----------
await page.evaluate(async () => {
  const LY = await import('./js/core/floor-layout.js');
  const g = PV.game; let o = null; for (let i = 0; i < 80 && !o; i++) { const x = g.shop.generateOrder(g, ['Nils']); if (x && !x.product && x.items.every((it) => it.part)) o = x; }
  const c = g.spawn(o); for (const it of c.order.items) { g.stock[it.part] = (g.stock[it.part] || 0) + 3; g.shown[it.part] = g.stock[it.part]; }
  c.phase = 'queue'; c.x = LY.QUEUE[0][0]; c.y = LY.QUEUE[0][1]; c._path = []; c._tkey = 'q0'; c.moving = false; c.patience = 9999; c._fl = true;
  PV.floor.onCustomerClick(c);
});
await page.waitForFunction(() => !document.querySelector('#modal').classList.contains('hidden'), null, { timeout: 15000 });
const foot = await page.evaluate(() => [...document.querySelectorAll('#modal .dlg-foot .btn')].map((b) => ({ key: b.dataset.key, text: b.textContent.trim(), go: b.classList.contains('btn-go') })));
const take = foot.find((b) => /Ta emot/.test(b.text));
ok(foot.every((b) => b.key) && new Set(foot.map((b) => b.key)).size === foot.length && !!take, `knapparna i beställningsrutan har var sin bokstav: ${foot.map((b) => b.text).join(' · ')}`);
await press(take.key.toLowerCase(), 500);
ok(await page.evaluate(() => PV.game.orders.length === 1), `${take.key} tar emot beställningen`);
await page.waitForTimeout(300);
if (await modal()) await press('Escape');
const card = await page.evaluate(() => document.querySelector('#orders .ocard button kbd')?.textContent);
ok(card === '1', 'beställningskortet visar siffran 1');
await press('1', 700);
const opened = await page.evaluate(() => ({ screen: document.body.dataset.screen, modal: document.querySelector('#modal h2')?.textContent || '', order: PV.build?.order?.id ?? null }));
ok(opened.order !== null, `1 öppnar beställningen i köket: ${JSON.stringify(opened)}`);
// lägesvalet har också bokstäver
const mode = await page.evaluate(() => [...document.querySelectorAll('#modal [data-key]')].map((b) => b.dataset.key + '=' + b.textContent.trim().slice(0, 14)));
console.log('     lägesvalet: ' + mode.join(' | '));
await page.evaluate(() => { const b = [...document.querySelectorAll('#modal .btn, #modal button')].find((x) => /Med hj/.test(x.textContent)); b?.click(); });
await page.waitForTimeout(400);
await press('g'); ok((await modal()) === null, 'i köket gör bokstäverna ingenting (man skriver inte sönder bygget)');
await page.evaluate(() => document.querySelector('#build-back')?.click()); await page.waitForTimeout(500);

// ---------- 3D: musen låses igen av sig själv, telefonen på disken ----------
await press('v', 500);
await page.waitForFunction(() => PV.view3d?.ready, null, { timeout: 240000 });
await page.waitForTimeout(1500);
ok(await page.evaluate(() => PV.view3d.active), 'V går in i 3D-läget');
const phone = await page.evaluate(() => {
  const v = PV.view3d, ph = v.room.phone; if (!ph) return null;
  v.setPose(ph.x, ph.z - 0.75, Math.PI, -0.55);   // ställ dig bakom disken och titta ner på telefonen
  return ph;
});
const frames = async (n = 2) => { const f0 = await page.evaluate(() => PV.view3d.frames); await page.waitForFunction((f) => PV.view3d.frames >= f, f0 + n, { timeout: 120000 }); };   // (mjukvarurenderingen är långsam – vänta på bildrutor, inte på klockan)
await frames(3);
const hov = await page.evaluate(() => { const v = PV.view3d; v.updateHover(); return { type: v.hover?.type || null, dist: v.hover?.dist ?? null, text: v.hoverText(v.hover) }; });
ok(!!phone && hov.type === 'phone', `telefonen står på disken och går att sikta på: ${JSON.stringify(hov)}`);
if (hov.type !== 'phone') console.log('     strålen träffar: ' + JSON.stringify(await page.evaluate(() => {
  const v = PV.view3d; v.camera.updateMatrixWorld();
  const targets = [...v.units.pickTargets(), v.people.group, ...v.room.group.children.filter((o) => o.userData.pick)];
  return { pos: [v.pos.x, v.pos.z, v.yaw, v.pitch], cam: v.camera.position.toArray().map((x) => +x.toFixed(2)), frames: v.frames, active: v.active, screen: document.body.dataset.screen, mode: v.mode, kitchen: !!v.kitchen, hits: v.raycaster.intersectObjects(targets, true).slice(0, 4).map((h) => { let o = h.object, n = []; while (o && n.length < 4) { n.push(o.name || o.type); o = o.parent; } return h.distance.toFixed(2) + ' ' + n.join('<'); }) };
})));
await page.evaluate(() => PV.view3d.interact()); await page.waitForTimeout(300);
t = await modal(); ok(/Telefonen/.test(t || ''), `ett klick på telefonen öppnar menyn ("${t}")`);
await press('Escape');
// muslåset: klicka i bilden, öppna grossisten med G, stäng med G – musen ska vara låst igen utan klick
const box = await page.evaluate(() => { const r = PV.view3d.canvas.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
await page.mouse.click(box[0], box[1]); await page.waitForTimeout(500);
let locked = await page.evaluate(() => PV.view3d.locked);
if (!locked) {
  // (webbläsare utan muslås i testläge: låtsas att låset finns och räkna begäran)
  console.log('     muslås stöds inte här – låset simuleras');
  await page.evaluate(() => { const v = PV.view3d; window.__locks = 0; v.canvas.requestPointerLock = () => { window.__locks++; v.locked = true; return Promise.resolve(); }; document.exitPointerLock = () => { v.locked = false; }; v.locked = true; });
}
await press('g', 300); await frames(2);
const s1 = await page.evaluate(() => ({ locked: PV.view3d.locked, modal: !document.querySelector('#modal').classList.contains('hidden') }));
ok(s1.modal && !s1.locked, 'G i 3D öppnar grossisten och släpper musen av sig själv');
await press('g', 300); await frames(3); await page.waitForTimeout(400);
const s2 = await page.evaluate(() => ({ locked: PV.view3d.locked, modal: !document.querySelector('#modal').classList.contains('hidden') }));
ok(!s2.modal && s2.locked, 'när rutan stängs låses musen igen – ingen Esc och inget extra klick');
await press('m', 300); await frames(2); await press('Escape', 300); await frames(3); await page.waitForTimeout(400);
const s3 = await page.evaluate(() => ({ locked: PV.view3d.locked, modal: !document.querySelector('#modal').classList.contains('hidden') }));
ok(!s3.modal && s3.locked, 'även när rutan stängs med Esc');
const hint = await page.evaluate(() => { const v = PV.view3d; const was = v.locked; v.locked = false; v.hint(); const tx = document.querySelector('#hint3d').textContent; v.locked = was; v.hint(); return tx; });
ok(/M öppnar menyn/.test(hint) && !/Esc släpper/.test(hint), 'hjälpraden i 3D berättar om M i stället för Esc');
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
