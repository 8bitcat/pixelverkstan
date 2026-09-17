// Spelar en hel beställning via riktiga klick/drag: montering, skruvar, kablar,
// skrivbord, inkoppling och start. node tools/fullbuild.mjs [kund-index 0-2] [prefix] [mode help|pro]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const [idx = "0", prefix = "f", mode = "help", W = "1400", H = "860"] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +W, height: +H } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://localhost:8777/index.html");
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(500);
await page.click('[data-shop="dator"]'); await page.waitForTimeout(500);
await page.evaluate((i) => {
  const g = PV.game; g.tutorialStep = 9; g.spawnTimer = 9999;
  const order = g.shop.tutorialOrder(+i);
  for (const it of order.items) g.stock[it.part] = (g.stock[it.part] || 0) + 1;
  order.guided = false;
  const c = g.spawn(order); c.phase = 'queue'; c.x = 128; c.y = 100;
  PV.openBuild(g.accept(c));
}, idx);
await page.waitForTimeout(400);
await page.click(mode === 'help' ? 'button:has-text("Med hjälp")' : 'button:has-text("Utan hjälp")');
await page.waitForTimeout(300);

const box = async (key) => { const els = await page.$$('.tray-item'); const keys = await page.evaluate(() => PV.build.trayEntries().map((e) => e.key)); const i = keys.indexOf(key); return i >= 0 ? await els[i].boundingBox() : null; };
async function drag(key, t) {
  const b = await box(key);
  if (!b) throw new Error("hittar inte " + key);
  await page.mouse.move(b.x + b.width / 2, b.y + 30); await page.mouse.down();
  await page.mouse.move(b.x + 40, b.y - 40, { steps: 3 }); await page.mouse.move(t.x, t.y, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(90);
}
let shots = 0;
for (let step = 0; step < 90; step++) {
  const s = await page.evaluate(() => {
    const v = PV.build, st = v.nextStep(), r = v.canvas.getBoundingClientRect();
    const abs = (p) => ({ x: r.left + p[0], y: r.top + p[1] });
    const P = (u, vv, z) => { const [x, y] = v.R.proj(u, vv, z); return abs([v.ox + x * v.s, v.oy + y * v.s]); };
    if (!st) return { kind: 'none', phase: v.phase, msg: v.msg?.html };
    if (v.phase === 'build') {
      if (st.kind === 'slot') { const [u0, u1, v0, v1, z] = v.L.SLOT[st.id].hl; return { kind: 'drag', key: st.entryKey, t: P((u0 + u1) / 2, (v0 + v1) / 2, z), label: st.label }; }
      if (st.kind === 'act') { const a = v.L.ACTION[st.id], done = v.L.actSet(v.b, a.id); const i = a.points.findIndex((_, j) => !done.has(j)); return { kind: 'click', t: P(...a.points[i]), label: st.label }; }
      if (st.kind === 'cable') { const c = v.L.CABLE[st.id]; const k = c.wants.find((w) => v.L.availablePorts(v.b).includes(w) && !v.L.portBusy(w, v.b)); return { kind: 'drag', key: st.entryKey, t: P(...v.L.portPos(k, v.b)), label: st.label }; }
      if (st.kind === 'stand') return { kind: 'stand' };
    } else {
      const f = v.finale;
      if (st.kind === 'plug') {
        const { PLUGS } = f.constructor;
        const plug = ({ pc_power: 'c13', hdmi: 'hdmi', kb: 'usb', mouse: 'usb', mon_power: 'mains' })[st.id];
        if (plug === 'mains') { const [x, y] = f.proj(25, 11.1, 6.4); return { kind: 'drag', key: st.entryKey, t: abs([x, y]), label: st.id }; }
        const want = st.id === 'hdmi' ? (v.b.placed.gpu ? 'HDMI_GPU' : 'HDMI_MB') : null;
        const ports = window.__rear(v.b).filter((p) => p.type === plug && !Object.values(f.d.plugs).includes(p.key) && (!want || p.key === want));
        const [x, y, w, h] = f.rearRect(ports[0]);
        return { kind: 'drag', key: st.entryKey, t: abs([x + w / 2, y + h / 2]), label: st.id };
      }
      if (st.kind === 'switch') { const si = f.si; return { kind: 'click', t: abs([f.insetX + (30 + 4) * si, f.insetY + (131 + 6) * si]), label: 'switch' }; }
      if (st.kind === 'power') return { kind: 'power', t: abs(f.powerButton()) };
    }
    return { kind: 'unknown', st };
  });
  if (s.kind === 'none' || s.kind === 'unknown') { console.log('slut:', JSON.stringify(s)); break; }
  if (step === 0) await page.evaluate(async () => { const m = await import('/js/shops/dator/desk-art.js'); window.__rear = m.rearPorts; });
  if (s.kind === 'drag') await drag(s.key, s.t);
  else if (s.kind === 'click') { await page.mouse.click(s.t.x, s.t.y); await page.waitForTimeout(90); }
  else if (s.kind === 'stand') { await page.screenshot({ path: OUT + prefix + '1-built.png' }); await page.click('#build-boot'); await page.waitForTimeout(400); }
  else if (s.kind === 'power') {
    await page.screenshot({ path: OUT + prefix + '2-desk.png' });
    await page.mouse.click(s.t.x, s.t.y);
    await page.waitForTimeout(3000); await page.screenshot({ path: OUT + prefix + '3-post.png' });
    await page.waitForTimeout(4200); await page.screenshot({ path: OUT + prefix + '4-desktop.png' });
    break;
  }
  const err = await page.evaluate(() => PV.build.msg?.kind === 'err' ? PV.build.msg.html : null);
  if (err) console.log('FEL vid', s.label || s.kind, ':', err);
  if (step === 12 && !shots++) await page.screenshot({ path: OUT + prefix + '0-mid.png' });
}
const res = await page.evaluate(() => ({ msg: PV.build.msg?.html, errors: PV.build.b.errors, cables: [...PV.build.b.cables], phase: PV.build.phase }));
console.log(JSON.stringify(res));
const deliver = await page.$('[data-act="deliver"]');
if (deliver) { await deliver.click(); await page.waitForTimeout(500); await page.screenshot({ path: OUT + prefix + '5-result.png' }); }
console.log(errors.join("\n") || "inga fel");
await browser.close();
