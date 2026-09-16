// Spelar första kunden via riktiga klick/drag och tar skärmdumpar.
// node tools/play.mjs [bredd] [höjd] [prefix]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const [W = "1400", H = "860", prefix = "p"] = process.argv.slice(2);
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +W, height: +H }, hasTouch: false });
const errors = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`[${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto("http://localhost:8777/index.html");
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + prefix + "0-menu.png" });
await page.click('[data-shop="dator"]');
await page.waitForTimeout(5500); // kunden går in
await page.screenshot({ path: OUT + prefix + "1-shop.png" });
// klicka på kunden
const pos = await page.evaluate(() => {
  const f = PV.floor, c = PV.game.customers[0], r = f.canvas.getBoundingClientRect();
  return { x: r.left + f.offX + c.x * f.scale, y: r.top + f.offY + (c.y - 12) * f.scale, phase: c.phase };
});
console.log("kund", pos);
await page.mouse.click(pos.x, pos.y);
await page.waitForTimeout(400);
await page.screenshot({ path: OUT + prefix + "2-order.png" });
await page.click("button:has-text(\"Ta emot\")");
await page.waitForTimeout(700);
await page.screenshot({ path: OUT + prefix + "3-build.png" });

// bygg: följ tipsen – dra delar, tryck handgrepp/kablar
async function dragTo(selIndex, target) {
  const items = await page.$$(".tray-item");
  const box = await items[selIndex].boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 30, box.y - 30, { steps: 4 });
  await page.mouse.move(target.x, target.y, { steps: 8 });
  await page.mouse.up();
}
for (let step = 0; step < 20; step++) {
  const s = await page.evaluate(() => {
    const b = PV.build, st = b.nextStep(), r = b.canvas.getBoundingClientRect();
    if (!st) return null;
    const abs = (p) => ({ x: r.left + p[0], y: r.top + p[1] });
    if (st.type === "place") {
      const idx = b.trayEntries().findIndex((e) => e.key === st.entry.key);
      return { type: "place", idx, target: abs(PV.build.L.SLOTS.find(x => x.id === st.slot.id) && (() => { const s2 = st.slot; const [u0,u1,v0,v1,z] = s2.hl; return b.R.proj((u0+u1)/2,(v0+v1)/2,z).map((q,i)=> (i? b.oy : b.ox) + q*b.s); })()), name: st.entry.part.name };
    }
    if (st.type === "act" || st.type === "cable") {
      const h = b.hotspots().find((x) => x.obj === (st.act || st.cable));
      return { type: st.type, target: abs(h.pt) };
    }
    return { type: st.type };
  });
  if (!s) break;
  console.log("steg", step, s.type, s.name || "");
  if (s.type === "place") await dragTo(s.idx, s.target);
  else if (s.type === "act" || s.type === "cable") await page.mouse.click(s.target.x, s.target.y);
  else if (s.type === "boot") { await page.screenshot({ path: OUT + prefix + "4-built.png" }); await page.click("#build-boot"); break; }
  await page.waitForTimeout(250);
  if (step === 3) await page.screenshot({ path: OUT + prefix + "3b-mid.png" });
}
await page.waitForTimeout(4000);
await page.screenshot({ path: OUT + prefix + "5-boot.png" });
await page.waitForTimeout(4000);
await page.screenshot({ path: OUT + prefix + "6-result.png" });
const st = await page.evaluate(() => ({ money: PV.game.money, orders: PV.game.orders.length, errors: PV.build.order?.build?.errors }));
console.log("state", st);
await page.click("text=Till butiken").catch(() => {});
await page.waitForTimeout(6000);
await page.screenshot({ path: OUT + prefix + "7-pickup.png" });
console.log("money after pickup", await page.evaluate(() => PV.game.money), "tutorialStep", await page.evaluate(() => PV.game.tutorialStep));
console.log(errors.join("\n") || "inga fel");
await browser.close();
