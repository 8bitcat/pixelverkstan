// Co-op med två webbläsare: värd + kompis. Lobby → gemensam butik → låda → kund → bygga ihop med synliga muspekare.
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv[2] || "http://localhost:8777/index.html";
const browser = await chromium.launch();
const errors = [];
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
async function newPlayer(name, color) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`[${name}] ${e.message}\n${e.stack}`));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().includes('404')) errors.push(`[${name}] ${m.text()}`); });
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(async ([n, c]) => { const A = await import(new URL('js/core/avatar.js', location.href).href); A.saveAvatar({ ...A.loadAvatar(), name: n, color: c }); }, [name, color]);
  await page.reload(); await page.waitForTimeout(600);
  return page;
}
const host = await newPlayer('Pappa', '#f5c542');
const kid = await newPlayer('Ville', '#ff7ab6');
// värden startar rum
await host.click('#m-coop'); await host.click('#c-host');
await host.click('[data-year="1991"]');
await host.waitForSelector('.room-code', { timeout: 30000 });
await host.waitForFunction(() => window.PV?.net?.code, null, { timeout: 30000 });
const code = await host.evaluate(() => PV.net.code);
ok(/^[A-Z]{4}$/.test(code), `rum skapat: ${code}`);
// kompisen går med
await kid.click('#m-coop'); await kid.fill('#c-code', code); await kid.click('#c-join');
await host.waitForFunction(() => document.querySelectorAll('.lobby-player').length === 2, null, { timeout: 30000 });
await kid.waitForFunction(() => document.querySelectorAll('.lobby-player').length === 2, null, { timeout: 30000 });
ok(true, 'båda syns i lobbyn');
await host.screenshot({ path: OUT + "co0-lobby-host.png" });
await kid.screenshot({ path: OUT + "co0-lobby-kid.png" });
await host.click('#l-start');
await host.waitForFunction(() => window.PV?.game && !document.querySelector('#shop').classList.contains('hidden'), null, { timeout: 30000 });
await kid.waitForFunction(() => window.PV?.game && !document.querySelector('#shop').classList.contains('hidden'), null, { timeout: 30000 });
await kid.waitForTimeout(1200);
const m0 = await Promise.all([host.evaluate(() => PV.game.money), kid.evaluate(() => PV.game.money)]);
ok(m0[0] === m0[1] && m0[0] > 0, `samma kassa (${m0})`);
ok(await host.evaluate(() => PV.floor.players.length === 2) && await kid.evaluate(() => PV.floor.players.length === 2), 'två avatarer i butiken hos båda');
// kompisen köper startpaketet
await kid.click('[data-h="shop"]'); await kid.waitForSelector('[data-kit]'); await kid.click('[data-kit]');
await host.waitForFunction(() => PV.game.deliveries.length === 1, null, { timeout: 10000 });
await kid.waitForFunction((m) => PV.game.money < m, m0[0], { timeout: 10000 });
ok(true, 'kompisens köp syns hos värden och kassan uppdateras hos kompisen');
await host.waitForFunction(() => PV.game.deliveries[0]?.state === 'arrived', null, { timeout: 30000 });
await kid.waitForFunction(() => PV.game.deliveries[0]?.state === 'arrived', null, { timeout: 10000 });
await kid.waitForTimeout(800);
// kompisen går fram och packar upp
const bpos = await kid.evaluate(() => { const f = PV.floor, [x, y] = f.boxPos(0), r = f.canvas.getBoundingClientRect(); return { x: r.left + f.offX + x * f.scale, y: r.top + f.offY + (y - 10) * f.scale }; });
await kid.mouse.click(bpos.x, bpos.y);
await kid.waitForSelector('.box-label', { timeout: 10000 });
await host.waitForTimeout(400);
await host.screenshot({ path: OUT + "co1-host-sees-kid.png" });
await kid.click('button:has-text("Packa upp och ställ ut")');
await host.waitForFunction(() => PV.game.deliveries.length === 0 && PV.game.hasShown(), null, { timeout: 10000 });
ok(true, 'kompisen packade upp – värdens montrar fylldes');
// kunden kommer, kompisen tar emot
await kid.waitForFunction(() => PV.game.queue()[0]?.phase === 'queue', null, { timeout: 45000 });
await host.waitForFunction(() => PV.game.queue()[0]?.phase === 'queue' && !PV.game.queue()[0].moving, null, { timeout: 45000 });
await kid.waitForTimeout(800);
const cpos = await kid.evaluate(() => { const f = PV.floor, c = PV.game.queue()[0], r = f.canvas.getBoundingClientRect(); return { x: r.left + f.offX + c.x * f.scale, y: r.top + f.offY + (c.y - 14) * f.scale }; });
await kid.mouse.click(cpos.x, cpos.y);
await kid.waitForSelector('button:has-text("Ta emot")', { timeout: 10000 });
await kid.screenshot({ path: OUT + "co2-kid-order.png" });
await kid.click('button:has-text("Ta emot")');
await host.waitForFunction(() => PV.game.orders.length === 1, null, { timeout: 10000 });
await kid.waitForFunction(() => PV.game.orders.length === 1, null, { timeout: 10000 });
ok(true, 'kompisen tog emot beställningen');
// båda går in i verkstaden
await host.evaluate(() => PV.openBuild(PV.game.orders[0]));
await host.waitForTimeout(600);
if (await host.$('button:has-text("Med hjälp")')) await host.click('button:has-text("Med hjälp")');
await host.waitForFunction(() => PV.build.b.help !== null, null, { timeout: 10000 });
await kid.waitForTimeout(500);
await kid.evaluate(() => PV.openBuild(PV.game.orders[0]));
await kid.waitForFunction(() => PV.build.order && PV.build.b.help === true, null, { timeout: 10000 });
ok(true, 'kompisen kom in i samma bygge (hjälpläget följde med)');
// värden sätter i chassit, kompisen ser det
await host.evaluate(() => { const v = PV.build, e = v.trayEntries().find((x) => x.part?.cat === 'case'); v.place(e, v.L.SLOT.case); });
await kid.waitForFunction(() => !!PV.build.b.placed.case, null, { timeout: 10000 });
ok(true, 'värdens chassi syns hos kompisen');
await kid.evaluate(() => { const v = PV.build, e = v.trayEntries().find((x) => x.part?.cat === 'mb'); v.place(e, v.L.SLOT.mb); });
await host.waitForFunction(() => !!PV.build.b.placed.mb, null, { timeout: 10000 });
ok(true, 'kompisens moderkort syns hos värden');
// kompisens muspekare
const box = await kid.evaluate(() => { const r = PV.build.canvas.getBoundingClientRect(); return { x: r.left + r.width * 0.55, y: r.top + r.height * 0.5 }; });
for (let i = 0; i < 6; i++) { await kid.mouse.move(box.x + i * 12, box.y + i * 5); await kid.waitForTimeout(90); }
await host.waitForFunction(() => PV.build.cursors.size === 1, null, { timeout: 10000 });
await host.waitForTimeout(300);
await host.screenshot({ path: OUT + "co3-host-build-cursor.png" });
await kid.screenshot({ path: OUT + "co3-kid-build.png" });
ok(true, 'värden ser kompisens muspekare');
// kompisen skruvar, värden ser
await kid.evaluate(() => { const v = PV.build, a = v.L.ACTION.mb_screws; a.points.forEach((_, i) => v.doAction(a, i)); });
await host.waitForFunction(() => PV.build.L.actDone(PV.build.b, 'mb_screws'), null, { timeout: 10000 });
ok(true, 'kompisens skruvar syns hos värden');
console.log(errors.length ? errors.join('\n') : 'inga fel');
await browser.close();
process.exit(errors.length ? 1 : 0);
