// Fem spelare: lobby, chatt med pratbubblor, "Bygg med"-kort, spöken försvinner, omladdning ersätter.
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv[2] || "http://localhost:8777/index.html";
const browser = await chromium.launch();
const errors = [];
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
const ctxs = [];
async function player(name, color, pid) {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 760 } });
  ctxs.push(ctx);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`[${name}] ${e.message}`));
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(async ([n, c, pid]) => { const A = await import(new URL('js/core/avatar.js', location.href).href); A.saveAvatar({ ...A.loadAvatar(), name: n, color: c }); if (pid) localStorage.setItem('pixelverkstan_pid', pid); }, [name, color, pid]);
  await page.reload(); await page.waitForTimeout(500);
  return page;
}
const host = await player('Pappa', '#f5c542');
await host.click('#m-coop'); await host.click('#c-host'); await host.click('[data-pick="0"]'); await host.click('[data-year="2016"]');
await host.waitForFunction(() => window.PV?.net?.code, null, { timeout: 30000 });
const code = await host.evaluate(() => PV.net.code);
ok(true, `rum ${code}`);
const names = [['Samos', '#ff7ab6', 'pid-samos'], ['Ella', '#8be36b'], ['Noah', '#b58cff'], ['Liv', '#ff9a4d']];
const kids = [];
for (const [n, c, pid] of names) {
  const p = await player(n, c, pid);
  await p.goto(URL + '?rum=' + code);
  await p.click('[data-pick="0"]');
  kids.push(p);
}
await host.waitForFunction(() => document.querySelectorAll('.lobby-player').length === 5, null, { timeout: 60000 });
ok(true, 'fem spelare i lobbyn');
ok(!(await kids[0].evaluate(() => location.search.includes('rum='))), '?rum= togs bort ur adressen efter anslutning');
await host.screenshot({ path: OUT + "c5-0-lobby.png" });
await host.click('#l-start');
for (const k of kids) await k.waitForFunction(() => window.PV?.game && !document.querySelector('#shop').classList.contains('hidden'), null, { timeout: 40000 });
await host.waitForTimeout(1500);
ok(await host.evaluate(() => PV.floor.players.length) === 5, 'värden ser fem avatarer');
ok((await Promise.all(kids.map((k) => k.evaluate(() => PV.floor.players.length)))).every((n) => n === 5), 'alla kompisar ser fem avatarer');
const hostNames = await host.evaluate(() => PV.floor.players.map((p) => p.name).sort().join(','));
ok(hostNames === 'Ella,Liv,Noah,Pappa,Samos', `namnen stämmer (${hostNames})`);
// låt avatarerna gå lite
for (const [i, k] of kids.entries()) await k.evaluate((i) => PV.floor.goTo(120 + i * 60, 220 + (i % 2) * 40), i);
await host.waitForTimeout(1500);
// chatt
await kids[0].keyboard.press('Enter');
await kids[0].fill('#chat-input', 'Hej pappa! Jag packar upp lådan');
await kids[0].keyboard.press('Enter');
await host.waitForFunction(() => PV.floor.players.some((p) => p.name === 'Samos' && p.say), null, { timeout: 10000 });
await kids[2].waitForFunction(() => PV.floor.players.some((p) => p.name === 'Samos' && p.say), null, { timeout: 10000 });
await host.evaluate(() => { document.querySelector('[data-h="chat"]').click(); });
await host.fill('#chat-input', 'Bra Samos!'); await host.keyboard.press('Enter');
await kids[3].waitForFunction(() => PV.floor.players.some((p) => p.name === 'Pappa' && p.say), null, { timeout: 10000 });
ok(true, 'chatten når alla som pratbubblor');
await host.waitForTimeout(400);
await host.screenshot({ path: OUT + "c5-1-chat.png" });
// ge butiken en beställning och låt Ella börja bygga
await host.evaluate(() => { const g = PV.game; for (const [id, n] of g.shop.starterKit(g)) { g.stock[id] = (g.stock[id] || 0) + n; g.shown[id] = (g.shown[id] || 0) + n; } g.tutorialStep = 9; const o = g.shop.tutorialOrder(1, g); o.guided = false; const c = g.spawn(o); c.phase = 'queue'; g.accept(c); g.emit('change'); });
await kids[1].waitForFunction(() => PV.game.orders.length === 1, null, { timeout: 10000 });
await kids[1].evaluate(() => PV.openBuild(PV.game.orders[0]));
await kids[1].waitForTimeout(800);
if (await kids[1].$('button:has-text("Med hjälp")')) await kids[1].click('button:has-text("Med hjälp")');
await kids[3].waitForSelector('.friendbuild button:has-text("Bygg med")', { timeout: 15000 });
await kids[3].screenshot({ path: OUT + "c5-2-friendcard.png" });
ok(true, 'Liv ser att Ella bygger (kort i hörnet)');
await kids[3].click('.friendbuild button:has-text("Bygg med")');
await kids[3].waitForFunction(() => PV.build.order && PV.build.b.help !== null, null, { timeout: 15000 });
ok(true, 'Liv hoppade in i Ellas bygge');
await kids[1].evaluate(() => { const v = PV.build, e = v.trayEntries().find((x) => x.part?.cat === 'case'); v.place(e, v.L.SLOT.case); });
await kids[3].waitForFunction(() => !!PV.build.b.placed.case, null, { timeout: 10000 });
ok(true, 'Ellas chassi syns hos Liv (via värden)');
const r = await kids[3].evaluate(() => { const r = PV.build.canvas.getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.45 }; });
for (let i = 0; i < 6; i++) { await kids[3].mouse.move(r.x + i * 10, r.y + i * 6); await kids[3].waitForTimeout(80); }
await kids[1].waitForFunction(() => [...PV.build.cursors.values()].some((c) => c.name === 'Liv'), null, { timeout: 10000 });
ok(true, 'Ella ser Livs muspekare');
await kids[3].keyboard.press('Enter'); await kids[3].fill('#chat-input', 'Jag tar moderkortet!'); await kids[3].keyboard.press('Enter');
await kids[1].waitForTimeout(700);
await kids[1].screenshot({ path: OUT + "c5-3-build-chat.png" });
// Noah stänger fliken utan att säga hejdå → försvinner
await ctxs[3].close();
await host.waitForFunction(() => PV.floor.players.length === 4, null, { timeout: 25000 });
ok(true, 'Noah försvann när fliken stängdes');
// Samos laddar om sidan (samma webbläsare) → ersätter sig själv, inga spöken
await kids[0].goto(URL + '?rum=' + code);
await kids[0].click('[data-pick="0"]');
await kids[0].waitForFunction(() => window.PV?.game && !document.querySelector('#shop').classList.contains('hidden'), null, { timeout: 40000 });
await host.waitForTimeout(2500);
const after = await host.evaluate(() => PV.floor.players.map((p) => p.name).sort().join(','));
ok(after === 'Ella,Liv,Pappa,Samos', `ingen dubblett efter omladdning (${after})`);
console.log(errors.length ? errors.join('\n') : 'inga fel');
await browser.close();
process.exit(errors.length ? 1 : 0);
