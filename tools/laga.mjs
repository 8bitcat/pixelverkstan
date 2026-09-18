// Reparationsuppdrag i webbläsaren: kund med trasig dator → ta emot → bänken → koppla in → symptom
// → öppna datorn → laga → ställ upp → starta → leverera → betalt. node tools/laga.mjs [url] [år]
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
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(1000);
// hoppa över guiden och framkalla en reparationskund (inte P8/P9-bytet – det kräver att man drar ur kablar)
const r0 = await page.evaluate(() => {
  const g = PV.game; g.tutorialStep = 99; g.money = 20000;
  let o = null; for (let i = 0; i < 60 && !o; i++) { const t = g.shop.repairOrder(g, ['Samos']); if (t && g.shop.faults.FAULT[t.repair.fault].kind !== 'swap') o = t; }
  const c = g.spawn(o); c.phase = 'queue'; c.x = 318; c.y = 176; c._fl = true; c._path = []; c._tkey = 'q0'; g.emit('change');
  return { title: o.title, fault: o.repair.fault, name: o.repair.name, msg: o.msg, parts: o.items.length };
});
ok(!!r0.fault, `reparationskund: ${r0.title} – ${r0.fault} (${r0.name}) «${r0.msg}»`);
await page.waitForTimeout(500);
await page.screenshot({ path: OUT + "laga0-kund.png" });
await page.evaluate(() => PV.floor.onCustomerClick(PV.game.queue()[0]));
await page.waitForSelector('.dlg', { timeout: 5000 }); await page.waitForTimeout(200);
await page.screenshot({ path: OUT + "laga1-dialog.png" });
const money0 = await page.evaluate(() => PV.game.money);
await page.click('button:has-text("Ta emot jobbet")'); await page.waitForTimeout(400);
const r1 = await page.evaluate(() => ({ orders: PV.game.orders.length, phase: PV.game.orders[0]?.build?.phase, money: PV.game.money, plugs: Object.keys(PV.game.orders[0]?.build?.desk?.plugs || {}).length }));
ok(r1.orders === 1 && r1.phase === 'desk' && r1.money > money0 && r1.plugs === 0, `jobbet mottaget: datorn står på bänken, diagnosavgift betald (${JSON.stringify(r1)})`);
// in i verkstaden
await page.evaluate(() => PV.openBuild(PV.game.orders[0]));
await page.waitForTimeout(500);
// välj läge (med hjälp) om dialogen kommer
const modeBtn = await page.$('button:has-text("Med hjälp")');
if (modeBtn) { await modeBtn.click(); await page.waitForTimeout(400); }
ok(await page.evaluate(() => PV.build.phase === 'desk'), 'bänken visas först');
await page.screenshot({ path: OUT + "laga2-bank.png" });

const box = async (key) => { const els = await page.$$('.tray-item'); const keys = await page.evaluate(() => PV.build.trayEntries().map((e) => e.key)); const i = keys.indexOf(key); return i >= 0 ? await els[i].boundingBox() : null; };
async function drag(key, t) {
  const b = await box(key);
  if (!b) throw new Error("hittar inte " + key);
  await page.mouse.move(b.x + b.width / 2, b.y + 30); await page.mouse.down();
  await page.mouse.move(b.x + 40, b.y - 40, { steps: 3 }); await page.mouse.move(t.x, t.y, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(90);
}
// samma drivrutin som e2e: följ nästa steg
async function step() {
  return page.evaluate(() => {
    const v = PV.build, st = v.nextStep(), r = v.canvas.getBoundingClientRect();
    const abs = (p) => ({ x: r.left + p[0], y: r.top + p[1] });
    const P = (u, vv, z) => { const [x, y] = v.P.proj(u, vv, z); return abs([v.ox + x * v.s, v.oy + y * v.s]); };
    if (!st) return { kind: 'none', phase: v.phase, msg: v.msg?.html };
    if (v.phase === 'build') {
      if (st.kind === 'slot') { const [u0, u1, v0, v1, z] = v.L.SLOT[st.id].hl; return { kind: 'drag', key: st.entryKey, t: P((u0 + u1) / 2, (v0 + v1) / 2, z), label: st.label }; }
      if (st.kind === 'act') { const a = v.L.ACTION[st.id], done = v.L.actSet(v.b, a.id); const i = a.points.findIndex((_, j) => !done.has(j)); return { kind: 'click', t: P(...a.points[i]), label: st.label }; }
      if (st.kind === 'cable') { const c = v.L.CABLE[st.id]; const k = c.wants.find((w) => v.L.availablePorts(v.b).includes(w) && !v.L.portBusy(w, v.b)); return { kind: 'drag', key: st.entryKey, t: P(...v.L.portPos(k, v.b)), label: st.label }; }
      if (st.kind === 'stand') return { kind: 'stand' };
    } else {
      const f = v.finale;
      if (st.kind === 'plug') {
        const plug = f.PLUGS[st.id];
        if (plug.target === 'strip') { const [x, y] = f.proj(...f.STRIP); return { kind: 'drag', key: st.entryKey, t: abs([x, y]), label: st.id }; }
        const ports = f.ports().filter((p) => p.type === plug.type && !Object.values(f.d.plugs).includes(p.key) && (st.id !== 'video' || p.owner === (v.b.placed.gpu ? 'gpu' : 'mb')));
        if (!ports.length) return { kind: 'unknown', st };
        const [x, y, w, h] = f.rearRect(ports[0]);
        return { kind: 'drag', key: st.entryKey, t: abs([x + w / 2, y + h / 2]), label: st.id };
      }
      if (st.kind === 'switch') { const si = f.si, S = f.SWITCH; return { kind: f.era.at ? 'power' : 'click', t: abs([f.insetX + (S.x + S.w / 2) * si, f.insetY + (S.y + S.h / 2) * si]), label: 'switch' }; }
      if (st.kind === 'power') return { kind: 'power', t: abs(f.powerButton()) };
    }
    return { kind: 'unknown', st };
  });
}
// 1) koppla in allt och starta → symptom
let symptom = null;
for (let i = 0; i < 20; i++) {
  const s = await step();
  if (s.kind === 'drag') await drag(s.key, s.t);
  else if (s.kind === 'click') { await page.mouse.click(s.t.x, s.t.y); await page.waitForTimeout(90); }
  else if (s.kind === 'power') {
    await page.screenshot({ path: OUT + "laga3-inkopplad.png" });
    await page.mouse.click(s.t.x, s.t.y);
    await page.waitForTimeout(1200); await page.screenshot({ path: OUT + "laga4-symptom-a.png" });
    await page.waitForFunction(() => PV.build.finale.run?.done, null, { timeout: 12000 });
    await page.waitForTimeout(300);
    symptom = await page.evaluate(() => ({ kind: PV.build.finale.run?.kind, msg: PV.build.msg?.html, mk: PV.build.msg?.kind }));
    await page.screenshot({ path: OUT + "laga5-symptom.png" });
    break;
  } else { console.log('driver:', JSON.stringify(s)); break; }
}
ok(symptom && symptom.kind && symptom.kind !== 'ok' && symptom.mk === 'err', `symptom på bänken: ${symptom?.kind} – ${String(symptom?.msg || '').replace(/<[^>]+>/g, '').slice(0, 90)}`);
// 2) öppna datorn och laga
await page.click('#build-boot'); await page.waitForTimeout(400);
ok(await page.evaluate(() => PV.build.phase === 'build'), 'datorn är öppnad på bänken');
await page.screenshot({ path: OUT + "laga6-oppen.png" });
let fixed = false;
for (let i = 0; i < 12; i++) {
  const s = await step();
  if (s.kind === 'drag') await drag(s.key, s.t);
  else if (s.kind === 'click') { await page.mouse.click(s.t.x, s.t.y); await page.waitForTimeout(90); }
  else if (s.kind === 'stand') { await page.click('#build-boot'); await page.waitForTimeout(400); fixed = true; break; }
  else { console.log('driver:', JSON.stringify(s)); break; }
}
ok(fixed && await page.evaluate(() => PV.build.phase === 'desk'), 'felet lagat och datorn står på bänken igen');
// 3) starta igen → fungerar → leverera (AT: brytaren är redan på – av och på igen)
await page.evaluate(() => { const f = PV.build.finale; if (f.era?.at && f.d.psuOn) { PV.build.op({ t: 'psu', on: false }); PV.build.refresh(); } });
for (let i = 0; i < 6; i++) {
  const s = await step();
  if (s.kind === 'drag') await drag(s.key, s.t);
  else if (s.kind === 'click') { await page.mouse.click(s.t.x, s.t.y); await page.waitForTimeout(90); }
  else if (s.kind === 'power') { await page.mouse.click(s.t.x, s.t.y); await page.waitForFunction(() => PV.build.finale.run?.done, null, { timeout: 15000 }); await page.waitForTimeout(300); break; }
  else { console.log('driver:', JSON.stringify(s)); break; }
}
const res = await page.evaluate(() => ({ kind: PV.build.finale.run?.kind, msg: PV.build.msg?.html?.replace(/<[^>]+>/g, '').slice(0, 60), errors: PV.build.b.errors }));
ok(res.kind === 'ok', `datorn fungerar efter lagningen (${JSON.stringify(res)})`);
await page.screenshot({ path: OUT + "laga7-fungerar.png" });
const deliver = await page.$('[data-act="deliver"]');
ok(!!deliver, 'leverera-knappen finns');
if (deliver) { await deliver.click(); await page.waitForTimeout(500); await page.click('button:has-text("Till butiken")'); }
const before = await page.evaluate(() => PV.game.money);
for (let i = 0; i < 80; i++) { if (await page.evaluate((b) => PV.game.money > b, before)) break; await page.waitForTimeout(250); }
const r2 = await page.evaluate(() => ({ money: PV.game.money, served: PV.game.stats.served, orders: PV.game.orders.length }));
ok(r2.money > before && r2.served === 1 && r2.orders === 0, `betalt och klart (${JSON.stringify(r2)})`);
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
