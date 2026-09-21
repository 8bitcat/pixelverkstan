// Ser köket rätt ut i 3D? Bygger en burgare lager för lager på bänken och mäter färgen på bilden där
// det översta lagret ligger – den ska stämma med lagrets egen färg. Fångar också grafikkortets
// felmeddelanden (GL_INVALID_…), som webbläsaren bara skriver som varningar. Bakgrund: texturatlasen
// växer när lager läggs på, och en textur kan inte byta storlek i efterhand – då hamnar fel bilder på
// alla ytor. node tools/kok-farger.mjs [url]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const { PNG } = (() => { try { return require("pngjs"); } catch { return {}; } })();
const URL = process.argv.find((a) => a.startsWith('http')) || "http://localhost:8777/index.html";
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [], gl = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
page.on("console", (m) => { const t = m.text(); if (/GL_INVALID|GL ERROR|WebGL: INVALID|texSubImage|texStorage/i.test(t)) gl.push(t.slice(0, 160)); });
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
const waitFrames = async (n = 3) => { const f0 = await page.evaluate(() => PV.view3d.frames); await page.waitForFunction((f) => PV.view3d.frames >= f, f0 + n, { timeout: 240000 }); };

await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="restaurang"]'); await page.click('[data-year="1996"]');
await page.waitForFunction(() => window.PV?.game && PV.game.shop.id === 'restaurang', null, { timeout: 30000 }); await page.waitForTimeout(600);
await page.evaluate(() => { const g = PV.game; g.money = 90000; g.tutorialStep = 99; g.stats.served = 9; g.spawnTimer = 9999; g.emit('change'); PV.floor.build(); });
await page.click('[data-h="view3d"]');
await page.waitForFunction(() => PV.view3d?.ready, null, { timeout: 240000 });
await page.waitForTimeout(1500);
// en beställning med många lager, öppnad i 3D-köket
const info = await page.evaluate(() => {
  const g = PV.game; let best = null;
  for (let i = 0; i < 60; i++) { const o = g.shop.generateOrder(g, ['Nils']); if (!o || o.product || !o.items.every((it) => it.part)) continue; if (!best || o.items.length > best.items.length) best = o; }
  const c = g.spawn(best);
  for (const it of c.order.items) { g.stock[it.part] = (g.stock[it.part] || 0) + 2; g.shown[it.part] = g.stock[it.part]; }
  c.phase = 'queue'; c.x = 453; c.y = 176; c.patience = 9999;
  const o = g.accept(c); o.guided = true;
  PV.openBuild(o);
  return { id: o.id, items: o.items.map((it) => it.part) };
});
await page.waitForFunction(() => document.body.dataset.screen === 'build' && PV.build.gl, null, { timeout: 60000 });
await waitFrames(3);
// titta rakt ner på bänken så att toppen av burgaren syns tydligt
await page.evaluate(() => { const v = PV.view3d, b = v.room.bench; v.setPose(b.stand[0], b.stand[1], 0, -0.85); });   // mot bänken (den står mot fönsterväggen, −z), blicken snett ner
await waitFrames(3);

// färgen i bilden runt en punkt (medel över en liten ruta), via skärmdump i sidan
async function colorAt(pt) {
  const r = await page.evaluate(() => { const b = PV.build.canvas.getBoundingClientRect(); return { x: b.left, y: b.top }; });
  const x = Math.round(r.x + pt[0]), y = Math.round(r.y + pt[1]);
  if (!(x > 5 && y > 5 && x < 1275 && y < 795)) return null;
  const buf = await page.screenshot({ clip: { x: x - 3, y: y - 3, width: 7, height: 7 }, timeout: 180000 });
  return page.evaluate(async (b64) => {
    const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data; let R = 0, G = 0, B = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; n++; }
    return [Math.round(R / n), Math.round(G / n), Math.round(B / n)];
  }, buf.toString('base64'));
}
const hue = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 18) return null; let h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; h *= 60; return (h + 360) % 360; };
const hueDiff = (a, b) => { if (a === null || b === null) return 0; const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };

const rows = [];
for (let guard = 0; guard < 40; guard++) {
  const step = await page.evaluate(() => {
    const v = PV.build, L = v.L, s = v.nextStep();
    if (!s || s.kind === 'stand') return null;
    if (s.kind === 'act') { const a = L.ACTION[s.id], done = L.actSet(v.b, a.id), i = a.points.findIndex((p, k) => !done.has(k)); v.doAction(a, i); v.b.time += 8; /* tillagningen tar tid */ return { act: s.id }; }
    const e = v.trayEntries().find((x) => x.key === s.entryKey) || v.partEntries().find((x) => L.slotsFor(x.part).some((sl) => sl.id === s.id));
    if (!e) return { err: 'ingen del för ' + s.id };
    v.place(e, L.SLOT[s.id]);
    const slot = L.SLOT[s.id], p = v.b.placed[s.id];
    if (slot.k === undefined) return { slot: s.id };
    // mitt på lagrets ovansida
    const z = slot.anchor[2] - 0.5 + (slot.top ? 0.6 : 0.05);
    return { slot: s.id, name: p.name, shape: p.look?.shape, color: p.look?.color || null, top: !!slot.top, at: [slot.anchor[0] - L.r * 0.38, slot.anchor[1] - L.r * 0.38, z + (slot.top ? 0.35 : 0.25)], atlas: null };   // en bit från mitten: där sitter etikettens röda punkt
  });
  if (!step) break;
  if (step.err) { errors.push(step.err); break; }
  await waitFrames(3);
  if (!step.at || !step.color || !['bun', 'patty', 'cheese'].includes(step.shape)) continue;   // heltäckande lager går att mäta; sallad och sås är fläckiga
  const pt = await page.evaluate((at) => PV.build.P.proj(...at), step.at);
  const got = await colorAt(pt);
  if (!got) { console.log('  (utanför bild)', step.name, pt.map(Math.round)); continue; }
  const want = [parseInt(step.color.slice(1, 3), 16), parseInt(step.color.slice(3, 5), 16), parseInt(step.color.slice(5, 7), 16)];
  const atlas = await page.evaluate(() => PV.view3d.bench.stats.atlas);
  const sv = ([r, g, b]) => { const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255; return [mx ? (mx - mn) / mx : 0, mx]; };
  const [sG, vG] = sv(got), [sW, vW] = sv(want);
  rows.push({ lager: step.name, form: step.shape, vill: step.color, fick: '#' + got.map((x) => x.toString(16).padStart(2, '0')).join(''), nyans: Math.round(hueDiff(hue(got), hue(want))), dS: +(sG - sW).toFixed(2), dV: +(vG - vW).toFixed(2), atlas: atlas.join('×') });
}
for (const r of rows) console.log(`  ${r.lager.padEnd(28)} ${r.form.padEnd(7)} vill ${r.vill}  fick ${r.fick}  nyans ${String(r.nyans).padStart(3)}°  mättnad ${r.dS > 0 ? '+' : ''}${r.dS}  ljushet ${r.dV > 0 ? '+' : ''}${r.dV}  atlas ${r.atlas}`);
// Säkrast: bilden efter alla storleksändringar ska vara likadan som när texturen byggs upp från noll.
const CLIP = { x: 280, y: 70, width: 990, height: 590 };
// gästerna i bakgrunden rör sig mellan bilderna – göm dem, och låt den gröna bekräftelsepilen hinna försvinna
await page.evaluate(() => { PV.view3d.people.group.visible = false; });
await page.waitForTimeout(1200); await waitFrames(3);
const shotA = (await page.screenshot({ clip: CLIP, timeout: 180000 })).toString('base64');
await page.screenshot({ path: 'D:/GamesProjects/pixelverkstan/tools/out/kok-farger.png', timeout: 180000 });
await page.evaluate(() => { const b = PV.view3d.bench; b.atlas.dispose(); b.atlas = null; b.atlasSize = null; b.cache = new Map(); PV.build.dirty = true; });
await waitFrames(4);
const shotB = (await page.screenshot({ clip: CLIP, timeout: 180000 })).toString('base64');
const diff = await page.evaluate(async ([a, b]) => {
  const load = async (x) => createImageBitmap(await (await fetch('data:image/png;base64,' + x)).blob());
  const [ia, ib] = [await load(a), await load(b)], c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data;
  x.clearRect(0, 0, c.width, c.height); x.drawImage(ib, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
  let n = 0; for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 60) n++;
  return +(100 * n / (da.length / 4)).toFixed(2);
}, [shotA, shotB]);
console.log(`bilden efter ${new Set(rows.map((r) => r.atlas)).size} atlasstorlekar mot en nybyggd textur: ${diff} % av pixlarna skiljer sig`);
ok(rows.length >= 2, `mätte ${rows.length} heltäckande lager`);
ok(rows.filter((r) => r.form === 'patty').every((r) => r.nyans <= 35), `biffarna har sin egen färg i bilden (${rows.filter((r) => r.form === 'patty').map((r) => r.nyans + '°').join(', ')})`);
// rätt färgskala: biffar och toppbröd (heltäckande, tydliga färger) ska visas i sin egen färg, inte urblekta
{ const solid = rows.filter((r) => r.form === 'patty' || (r.form === 'bun' && r !== rows[0])), mS = solid.reduce((a, r) => a + Math.abs(r.dS), 0) / (solid.length || 1), mV = solid.reduce((a, r) => a + Math.abs(r.dV), 0) / (solid.length || 1);
  ok(solid.length > 0 && mS <= 0.12 && mV <= 0.12, `ingredienserna har rätt färgskala i 3D (medelfel mättnad ${mS.toFixed(2)}, ljushet ${mV.toFixed(2)} – urblekt var 0,35 / 0,17)`); }
ok(new Set(rows.map((r) => r.atlas)).size > 1, 'texturatlasen ändrade storlek under bygget (det är då felet kan uppstå)');
ok(diff < 1.5, `texturerna sitter rätt även efter att atlasen vuxit (${diff} % skillnad mot nybyggd textur)`);
ok(gl.length === 0, `inga felmeddelanden från grafikkortet${gl.length ? ': ' + gl.slice(0, 3).join(' | ') : ''}`);
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
