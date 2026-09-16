// Spelar de tre guidade kunderna via UI:t (klick + drag), plus ett felplacerings-test.
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 860 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://localhost:8777/index.html");
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(500);
await page.click('[data-shop="dator"]');

async function waitFront() {
  for (let i = 0; i < 80; i++) {
    const ok = await page.evaluate(() => { const c = PV.game.queue()[0]; return c && c.phase === 'queue' && !c.moving; });
    if (ok) return;
    await page.waitForTimeout(250);
  }
  throw new Error("ingen kund");
}
async function slotPt(slotId) {
  return page.evaluate((id) => { const b = PV.build, r = b.canvas.getBoundingClientRect(); const s = b.L.SLOTS.find((x) => x.id === id); const [u0,u1,v0,v1,z] = s.hl; const [x,y] = b.R.proj((u0+u1)/2,(v0+v1)/2,z); return { x: r.left + b.ox + x*b.s, y: r.top + b.oy + y*b.s }; }, slotId);
}
async function drag(idx, t) {
  const box = await (await page.$$(".tray-item"))[idx].boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 30); await page.mouse.down();
  await page.mouse.move(box.x + 40, box.y - 40, { steps: 3 }); await page.mouse.move(t.x, t.y, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(120);
}

for (let n = 0; n < 3; n++) {
  await waitFront();
  const pos = await page.evaluate(() => { const f = PV.floor, c = PV.game.queue()[0], r = f.canvas.getBoundingClientRect(); return { x: r.left + f.offX + c.x * f.scale, y: r.top + f.offY + (c.y - 12) * f.scale }; });
  await page.mouse.click(pos.x, pos.y); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + `t${n}-order.png` });
  const buy = await page.$('button:has-text("Köp in det som saknas")');
  if (buy) { console.log("köper saknade delar"); await buy.click(); await page.waitForTimeout(300); await page.screenshot({ path: OUT + `t${n}-order-bought.png` }); }
  await page.click('button:has-text("Ta emot")'); await page.waitForTimeout(400);
  if (n === 1) {
    // försök sätta CPU först (fel ordning) → ska ge felmeddelande
    const idx = await page.evaluate(() => PV.build.trayEntries().findIndex((e) => e.part.cat === 'cpu'));
    await drag(idx, await slotPt('cpu'));
    await page.screenshot({ path: OUT + `t${n}-error.png` });
    console.log("felmeddelande:", await page.evaluate(() => PV.build.msg?.html), "misstag", await page.evaluate(() => PV.build.b.errors));
  }
  for (let step = 0; step < 25; step++) {
    const s = await page.evaluate(() => {
      const b = PV.build, st = b.nextStep(); if (!st) return null;
      if (st.type === 'place') return { type: 'place', idx: b.trayEntries().findIndex((e) => e.key === st.entry.key), slot: st.slot.id };
      if (st.type === 'act' || st.type === 'cable') { const h = b.hotspots().find((x) => x.obj === (st.act || st.cable)); const r = b.canvas.getBoundingClientRect(); return { type: st.type, x: r.left + h.pt[0], y: r.top + h.pt[1], name: (st.act||st.cable).name }; }
      return { type: st.type };
    });
    if (!s || s.type === 'boot') break;
    if (s.type === 'place') await drag(s.idx, await slotPt(s.slot));
    else { await page.mouse.click(s.x, s.y); await page.waitForTimeout(100); }
    if (n === 1 && s.slot === 'bay') await page.screenshot({ path: OUT + `t${n}-bay.png` });
  }
  const cables = await page.evaluate(() => [...PV.build.b.cables]);
  await page.screenshot({ path: OUT + `t${n}-built.png` });
  console.log(`kund ${n}: kablar`, cables, "klar", await page.evaluate(() => PV.build.isComplete()));
  await page.click("#build-boot");
  await page.waitForTimeout(8200);
  await page.screenshot({ path: OUT + `t${n}-result.png` });
  await page.click('button:has-text("Till butiken")');
  for (let i = 0; i < 60; i++) { if (await page.evaluate((k) => PV.game.tutorialStep > k, n)) break; await page.waitForTimeout(250); }
  console.log(`efter kund ${n}:`, await page.evaluate(() => ({ money: PV.game.money, xp: PV.game.xp, level: PV.game.level, step: PV.game.tutorialStep })));
}
await page.waitForTimeout(3000);
await page.screenshot({ path: OUT + "t9-after.png" });
await page.click('button:has-text("Grymt")');
await page.click('button:has-text("Grossist")'); await page.click('.tab:has-text("Grafikkort")'); await page.waitForTimeout(300);
await page.screenshot({ path: OUT + "t9-grossist.png" });
console.log(errors.join("\n") || "inga fel");
await browser.close();
