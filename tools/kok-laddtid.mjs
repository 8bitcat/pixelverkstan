// Hur lång tid tar det att öppna köket? Tar emot en beställning i 2D och i 3D, två gånger i rad
// (första gången är cachen kall), och mäter tiden från "Ta emot" till första bildrutan i köket plus
// de långa uppgifterna (> 50 ms) som låser sidan. Skriver också ut vad som tog tid: rigg, 2D-rastrering,
// 3D-bänkens lådor → texturer, och shaderkompilering.
// node tools/kok-laddtid.mjs [url]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const URL = process.argv.find((a) => a.startsWith('http')) || "http://localhost:8777/index.html";
const LIMIT = +(process.argv.find((a) => /^--max=/.test(a))?.slice(6) || 0);   // valfri gräns i ms för varm cache
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };

await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="restaurang"]'); await page.click('[data-year="1996"]');
await page.waitForFunction(() => window.PV?.game && PV.game.shop.id === 'restaurang', null, { timeout: 30000 }); await page.waitForTimeout(600);
await page.evaluate(() => {
  const g = PV.game; g.money = 90000; g.tutorialStep = 99; g.stats.served = 9;
  g.emit('change'); PV.floor.build();
  // mätare: långa uppgifter och tid i de tunga delarna
  window.__lt = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({ t: e.startTime, ms: Math.round(e.duration) }); }).observe({ entryTypes: ['longtask'] });
  window.__prof = {};
  const wrap = (obj, name, key) => { const f = obj[name]; obj[name] = function (...a) { const t0 = performance.now(); try { return f.apply(this, a); } finally { (window.__prof[key] ||= []).push(Math.round(performance.now() - t0)); } }; };
  wrap(PV.build, 'render', 'bygg.render');
  wrap(PV.build, 'open', 'bygg.open');
  window.__wrap = wrap;
});

// en kund tas emot och köket öppnas – mät tills bygget faktiskt är ritat
async function openKitchen(label) {
  const t = await page.evaluate(async () => {
    const g = PV.game;
    const o = g.shop.generateOrder(g, ['Nils']); const c = g.spawn(o);
    for (const it of c.order.items) if (it.part) { g.stock[it.part] = (g.stock[it.part] || 0) + 3; g.shown[it.part] = g.stock[it.part]; }
    c.phase = 'queue'; c.x = 453; c.y = 176; c._path = []; c._tkey = 'q0'; c.moving = false; c.patience = 9999;
    const order = g.accept(c);
    order.guided = true;   // hoppa över lägesvalet (det är spelarens eget klick)
    const R = PV.view3d?.renderer, lista = () => R ? R.info.programs.map((x) => x.name + '|' + (x.cacheKey || '')) : [];
    // gästens 3D-figur har egna shaders (kläder, hår) som kompileras första gången just den figuren syns. Det hör
    // inte till köket: låt figuren ritas klart innan mätningen börjar (tills inga nya program kommit på 1,5 s).
    if (R) { let n = lista().length, still = performance.now(); const stop = performance.now() + 30000; while (performance.now() - still < 1500 && performance.now() < stop) { await new Promise((r) => setTimeout(r, 100)); if (lista().length !== n) { n = lista().length; still = performance.now(); } } }
    window.__lt.length = 0; window.__prof = {};
    const progFöre = lista();
    const t0 = performance.now();
    PV.openBuild(order);
    const tOpen = Math.round(performance.now() - t0);
    const deadline = performance.now() + 20000;
    while ((PV.build.dirty || !PV.build.buf && !PV.build.gl) && performance.now() < deadline) await new Promise((r) => requestAnimationFrame(r));
    const tKlar = Math.round(performance.now() - t0);
    await new Promise((r) => setTimeout(r, 1200));
    const nya = lista().filter((x) => !progFöre.includes(x));
    // vilka föremål använder de nya programmen? (namn uppåt i trädet – så syns det om det är köket eller en figur)
    const vems = {};
    if (R && nya.length) {
      const keys = new Set(R.info.programs.filter((x) => nya.includes(x.name + '|' + (x.cacheKey || ''))).map((x) => x.cacheKey));
      PV.view3d.scene.traverse((o) => { for (const m of [].concat(o.material || [])) { const pr = R.properties.get(m).currentProgram; if (pr && keys.has(pr.cacheKey)) { let n = o, path = []; while (n && path.length < 4) { if (n.name) path.push(n.name); n = n.parent; } const k = (m.type || '') + ' ' + (path.join(' < ') || o.type); vems[k] = (vems[k] || 0) + 1; } } });
    }
    return { öppna: tOpen, ritad: tKlar, långa: window.__lt.map((x) => x.ms), prof: window.__prof, bänk: PV.view3d?.bench?.stats || null, gl: !!PV.build.gl, nyaProgram: nya, vems };
  });
  const lt = t.långa.reduce((a, b) => a + b, 0);
  console.log(`${label}: ritad efter ${t.ritad} ms (öppna ${t.öppna} ms) · sidan låst ${lt} ms [${t.långa.join(', ')}]`);
  console.log(`   ${JSON.stringify(t.prof)}${t.bänk ? ' · bänk ' + JSON.stringify(t.bänk) : ''}`);
  if (t.nyaProgram?.length) { t.nyaProgram.forEach((n, i) => console.log(`   nytt program ${i + 1}: ${n.slice(0, 60)}`)); console.log('   används av: ' + JSON.stringify(t.vems)); }
  await page.click('#build-back');
  await page.waitForFunction(() => document.body.dataset.screen === 'shop', null, { timeout: 30000 });
  await page.evaluate(() => { const g = PV.game; g.orders.length = 0; g.customers.length = 0; });
  await page.waitForTimeout(800);
  return { open: t.öppna, ready: t.ritad, locked: lt };
}

const r2a = await openKitchen('2D, första gången');
const r2b = await openKitchen('2D, andra gången');
await page.click('[data-h="view3d"]');
await page.waitForFunction(() => PV.view3d?.ready, null, { timeout: 240000 });
await page.waitForFunction(() => PV.view3d.warmDone, null, { timeout: 180000 });   // vänta tills förvärmningen är klar (som när spelaren gått runt en stund)
await page.waitForTimeout(1500);
await page.evaluate(() => { window.__wrap(PV.view3d.bench, 'renderWith', 'bänk.renderWith'); window.__wrap(PV.view3d, 'enterKitchen', 'enterKitchen'); window.__wrap(PV.view3d.renderer, 'compile', 'shaders'); });
const r3a = await openKitchen('3D, första gången');
const r3b = await openKitchen('3D, andra gången');
console.log(JSON.stringify({ r2a, r2b, r3a, r3b }));
if (LIMIT) { ok(r2b.first < LIMIT, `2D öppnas under ${LIMIT} ms (${r2b.first})`); ok(r3a.first < LIMIT * 3, `3D öppnas under ${LIMIT * 3} ms första gången (${r3a.first})`); }
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
