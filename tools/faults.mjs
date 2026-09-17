// Bygger en komplett dator via API:t och testar att varje glömd sak ger rätt symptom.
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 860 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto("http://localhost:8777/index.html");
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(400);
await page.click('[data-shop="dator"]'); await page.waitForTimeout(300);
// komplett bygge: gamingdator med HDD, RGB-kylare, takfläktar och 12V-2x6-grafikkort
await page.evaluate(() => {
  const g = PV.game; g.tutorialStep = 9; g.spawnTimer = 9999;
  const ids = ['lancool-216-rgb', 'b650-gaming-x', 'r5-7600', 'hyper-212-rgb', 'fury-16-ddr5', 'barracuda-1tb', 'rtx-5070', 'focus-gx-750', 'sp120-rgb-3'];
  for (const id of ids) g.stock[id] = 1;
  const order = { template: 'gaming', title: 'Gamingdator', name: 'Test', msg: '', items: ids.map((id) => ({ cat: g.shop.part[id].cat, part: id })) };
  const c = g.spawn(order); c.phase = 'queue';
  const o = g.accept(c); o.build = null; PV.openBuild(o);
  const v = PV.build; v.b.help = true; v.start();
  const L = v.L, b = v.b;
  for (const id of ids) { const p = g.shop.part[id]; b.placed[L.slotsFor(p)[0].id] = p; }
  for (const a of L.ACTIONS) if (L.missingReq(a.requires.filter((r) => !r.startsWith('act:')), b) === null) b.acts.set(a.id, new Set(a.points.map((_, i) => i)));
  for (const c2 of L.CABLES) if (L.cableReady(c2, b)) b.cables.set(c2.id, c2.wants.find((w) => !L.portBusy(w, b)));
  v.dirty = true; v.refresh();
  window.__full = { cables: [...b.cables] };
});
await page.waitForTimeout(300);
await page.screenshot({ path: OUT + "k1-full.png" });
await page.evaluate(() => PV.build.topAction());
const base = await page.evaluate(() => { const f = PV.build.finale, d = f.d; d.plugs = { pc_power: 'PSU_IN', hdmi: 'HDMI_GPU', mon_power: 'STRIP', kb: 'USB_1', mouse: 'USB_2' }; d.psuOn = true; return true; });
async function test(name, mutate, restore) {
  await page.evaluate(mutate);
  await page.evaluate(() => { PV.build.finale.run = null; PV.build.finale.pressPower(); });
  await page.waitForTimeout(7600);
  const msg = await page.evaluate(() => PV.build.msg?.html.replace(/<[^>]+>/g, '').slice(0, 150));
  console.log(`${name.padEnd(22)} → ${msg}`);
  if (restore) await page.evaluate(restore);
  return msg;
}
await test('allt inkopplat', () => {}, null);
await page.screenshot({ path: OUT + "k2-ok.png" });
await test('ingen strömkabel', () => { window.__s = PV.build.finale.d.plugs.pc_power; delete PV.build.finale.d.plugs.pc_power; }, () => { PV.build.finale.d.plugs.pc_power = window.__s; });
await test('nätagg av', () => { PV.build.finale.d.psuOn = false; }, () => { PV.build.finale.d.psuOn = true; });
for (const id of ['fpanel', 'atx24', 'eps8', 'gpu_pwr', 'cpu_fan', 'sata_data', 'argb_cooler', 'usb3']) {
  await test('utan ' + id, `(() => { window.__c = PV.build.b.cables.get('${id}'); PV.build.b.cables.delete('${id}'); })()`, `(() => { PV.build.b.cables.set('${id}', window.__c); })()`);
  if (id === 'cpu_fan') await page.screenshot({ path: OUT + "k3-cpufan.png" });
}
await test('skärm i moderkortet', () => { PV.build.finale.d.plugs.hdmi = 'HDMI_MB'; }, () => { PV.build.finale.d.plugs.hdmi = 'HDMI_GPU'; });
await test('skärm utan ström', () => { delete PV.build.finale.d.plugs.mon_power; }, () => { PV.build.finale.d.plugs.mon_power = 'STRIP'; });
await test('inget tangentbord', () => { delete PV.build.finale.d.plugs.kb; }, () => { PV.build.finale.d.plugs.kb = 'USB_1'; });
await test('ingen mus', () => { delete PV.build.finale.d.plugs.mouse; }, () => { PV.build.finale.d.plugs.mouse = 'USB_2'; });
await test('fläkt i SYS istället', () => { PV.build.b.cables.set('cpu_fan', 'SYS_FAN2'); PV.build.b.cables.delete('top_fans'); }, null);
await page.screenshot({ path: OUT + "k4-last.png" });
console.log('fel räknade:', await page.evaluate(() => PV.build.b.errors));
console.log(errors.join("\n") || "inga sidfel");
await browser.close();
