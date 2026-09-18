// Olika titlar är olika spel: sju titlar från TV-hörnan spelas i webbläsaren, varje med sin egen
// motor och era-look – skärmdumpar i tools/out/titel-*.png. node tools/spel2.mjs [url]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv[2] || "http://localhost:8777/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
const crash = async (e) => { const NL = String.fromCharCode(10); console.log('KRASCH ' + String(e.message).split(NL)[0]); console.log(errors.join(NL)); process.exit(1); };
process.on('unhandledRejection', crash); process.on('uncaughtException', crash);
await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="dator"]'); await page.click('[data-year="1999"]');
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(600);
await page.evaluate(() => { const g = PV.game; g.tutorialStep = 99; for (const e of g.shop.events.EVENTS) if (!g.events.seen.includes(e.id)) g.events.seen.push(e.id); });
const TITLES = [['s-smb', 'k-nes'], ['s-sonic', 'k-megadrive'], ['s-zelda', 'k-nes'], ['s-boulder', 'k-c64'], ['s-tetris', 'k-gameboy'], ['s-nhl94', 'k-megadrive'], ['s-tekken', 'k-playstation'], ['s-gta3', 'k-ps2'], ['s-minecraft', 'k-switch']];
const seen = new Set();
for (const [gid, cid] of TITLES) {
  await page.evaluate(([gid, cid]) => { const g = PV.game, p = g.shop.part[gid], con = g.shop.part[cid]; PV.startPlay({ mode: 'console', product: p, console: con, engine: p.engine, title: p.name, skin: { title: p.name } }); }, [gid, cid]);
  await page.waitForFunction(() => PV.play.state === 'run' || PV.play.state === 'boot', null, { timeout: 10000 });
  await page.waitForTimeout(1400);
  await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  await page.keyboard.down('ArrowRight'); await page.keyboard.press('Space'); await page.waitForTimeout(700); await page.keyboard.up('ArrowRight');
  const r = await page.evaluate(() => ({ state: PV.play.state, engine: PV.play.engineName, era: PV.play.era, v: [PV.play.variant.engine, PV.play.variant.mode, PV.play.variant.hero, PV.play.variant.foe || PV.play.variant.foeKind].filter(Boolean).join('·'), sub: document.querySelector('#play-sub').textContent, score: PV.play.game?.score }));
  ok(r.state === 'run' && !seen.has(r.v + r.era), `${gid}: ${r.engine} [${r.v}] era ${r.era} – "${r.sub}"`);
  seen.add(r.v + r.era);
  await page.screenshot({ path: OUT + `titel-${gid.slice(2)}.png` });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
}
ok(seen.size === TITLES.length, `${seen.size} olika spel av ${TITLES.length}`);
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
