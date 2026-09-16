// Testar valfria delar + misslyckad uppstart (för svagt nätagg) → byt → lyckad.
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
const log = await page.evaluate(async () => {
  const g = PV.game, out = [];
  g.tutorialStep = 3; g.xp = 140; g.customers.length = 0; g.spawnTimer = 999;
  Object.assign(g.stock, { 'cv550': 1, 'focus-gx-750': 1, 'h5-flow': 1, 'pop-mini-air': 1, 'r5-7600': 1, 'b650-gaming-x': 1, 'fury-16-ddr5': 1, 'hyper-212': 1, 'sn580-1tb': 1, 'rx-7900xtx': 1 });
  const order = { template: 'gaming', title: 'Gamingdator', name: 'Test', msg: 'Nätagget och chassit får du välja!', items: [
    { cat: 'case', part: null, choice: true }, { cat: 'mb', part: 'b650-gaming-x' }, { cat: 'cpu', part: 'r5-7600' }, { cat: 'cooler', part: 'hyper-212' },
    { cat: 'ram', part: 'fury-16-ddr5' }, { cat: 'storage', part: 'sn580-1tb' }, { cat: 'gpu', part: 'rx-7900xtx' }, { cat: 'psu', part: null, choice: true } ] };
  const c = g.spawn(order); c.phase = 'queue'; c.x = 128; c.y = 100;
  const o = g.accept(c);
  PV.openBuild(o);
  const b = PV.build, L = b.L, S = (id) => L.SLOTS.find((s) => s.id === id);
  const entry = (pred) => b.trayEntries().find(pred);
  // fel chassi först (mATX-chassi, ATX-kort)
  b.place(entry((e) => e.part.id === 'pop-mini-air'), S('case'));
  const r1 = b.place(entry((e) => e.part.id === 'b650-gaming-x'), S('mb'));
  out.push('ATX i mATX-chassi: ' + r1 + ' / ' + b.msg.html);
  b.remove(S('case'));
  out.push('lager pop-mini-air efter retur: ' + g.stockFree('pop-mini-air'));
  b.place(entry((e) => e.part.id === 'h5-flow'), S('case'));
  b.place(entry((e) => e.part.id === 'b650-gaming-x'), S('mb'));
  b.place(entry((e) => e.part.id === 'r5-7600'), S('cpu'));
  b.doAct(L.ACTIONS[0]);
  for (const id of ['hyper-212', 'fury-16-ddr5', 'sn580-1tb', 'rx-7900xtx']) { const e = entry((x) => x.part.id === id); b.place(e, L.slotsFor(e.part)[0]); }
  out.push('tray (val nätagg): ' + b.trayEntries().map((e) => e.part.id + (e.choice ? '*' : '')).join(','));
  b.place(entry((e) => e.part.id === 'cv550'), S('psu'));
  for (const cb of b.openCables()) b.doCable(cb);
  out.push('komplett: ' + b.isComplete() + ' kablar ' + [...b.b.cables]);
  b.startBoot();
  return out;
});
console.log(log.join("\n"));
await page.waitForTimeout(1900);
await page.screenshot({ path: OUT + "c1-bootfail.png" });
const log2 = await page.evaluate(() => {
  const b = PV.build, g = PV.game, S = (id) => b.L.SLOTS.find((s) => s.id === id), out = [];
  out.push('fel: ' + b.msg.html.slice(0, 160) + ' misstag=' + b.b.errors);
  b.remove(S('psu'));
  const e = b.trayEntries().find((x) => x.part.id === 'focus-gx-750');
  b.place(e, S('psu'));
  for (const cb of b.openCables()) b.doCable(cb);
  out.push('valda: ' + JSON.stringify(b.order.chosen) + ' pris ' + g.shop.priceFor(b.order, b.order.chosen));
  b.startBoot();
  return out;
});
console.log(log2.join("\n"));
await page.waitForTimeout(3500);
await page.screenshot({ path: OUT + "c2-boot.png" });
await page.waitForTimeout(4500);
console.log(await page.evaluate(() => ({ modal: document.querySelector('.dlg-head h2')?.textContent, stockCv550: PV.game.stockFree('cv550'), stockFocus: PV.game.stockFree('focus-gx-750') })));
console.log(errors.join("\n") || "inga fel");
await browser.close();
