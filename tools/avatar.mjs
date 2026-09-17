// Avatarredigeraren: klicka igenom flikarna, ändra, slumpa, spara, ladda om och kontrollera.
// Kollar också att kunderna (makeLook) ser pixel-exakt likadana ut som före avatartilläggen.
// Kör: node tools/avatar.mjs   (servern på http://localhost:8777)
import { createRequire } from "module";
import { execSync } from "child_process";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium, devices } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = "http://localhost:8777/index.html";
const BASE_COMMIT = "c14735a"; // people.js innan avatartilläggen
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? "  ✓ " : "  ✗ ") + msg); if (!cond) fails++; };

const browser = await chromium.launch();
const errors = [];
const watch = (page, tag) => {
  page.on("pageerror", (e) => errors.push(`[${tag}] ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`[${tag}] ${m.text()}`));
};
const importAvatar = (page) => page.evaluate(async () => { window.AVM = await import('/js/core/avatar.js'); return Object.keys(window.AVM); });
const openEditor = (page) => page.evaluate(() => { window.__done = null; AVM.openAvatarEditor({ onDone: (av) => (window.__done = av) }); });
const tile = (page, key, label) => page.locator(`.av-panel .av-tile[data-k="${key}"]`, { hasText: label }).first();
const sw = (page, key, i) => page.locator(`.av-panel .av-sw[data-k="${key}"]`).nth(i);
const tab = (page, id) => page.locator(`.av-tab[data-tab="${id}"]`);
const selected = (page, key) => page.$$eval(`.av-panel .av-tile.on[data-k="${key}"]`, (els) => els.map((e) => e.textContent.trim()));

// ================= Skrivbord =================
console.log("Skrivbord 1400×860");
const desk = await browser.newPage({ viewport: { width: 1400, height: 860 } });
watch(desk, "desk");
await desk.goto(URL, { waitUntil: "domcontentloaded" });
await desk.evaluate(() => localStorage.removeItem('pixelverkstan_avatar'));
await desk.reload({ waitUntil: "domcontentloaded" });
await desk.waitForTimeout(400);
const api = await importAvatar(desk);
for (const fn of ["AVATAR_KEY", "loadAvatar", "saveAvatar", "avatarColor", "openAvatarEditor", "avatarPortrait"]) ok(api.includes(fn), `export ${fn}`);

const def = await desk.evaluate(() => {
  const a = AVM.loadAvatar(), b = AVM.loadAvatar();
  const stored = JSON.parse(localStorage.getItem(AVM.AVATAR_KEY));
  const pc = AVM.avatarPortrait(a, 48);
  return { a, stored, same: JSON.stringify(a) === JSON.stringify(b), sameRef: a.look === b.look, color: AVM.avatarColor(a), pc: [pc.style.width, pc.style.height, pc.width === pc.height], key: AVM.AVATAR_KEY };
});
ok(def.key === "pixelverkstan_avatar", "AVATAR_KEY");
ok(def.a && typeof def.a.look === "object" && def.a.name === "" && /^#[0-9a-f]{6}$/.test(def.a.color), "loadAvatar() skapar standardavatar (namn '', look, färg)");
ok(def.a.look.kid === false, "standardavataren är vuxen");
ok(def.same && def.sameRef, "loadAvatar() stabil (samma look-objekt vid upprepade anrop)");
ok(JSON.stringify(def.stored) === JSON.stringify(def.a), "standardavataren sparades direkt");
ok(def.color === def.a.color, "avatarColor()");
ok(def.pc[0] === "48px" && def.pc[1] === "48px" && def.pc[2], "avatarPortrait(av, 48) → 48×48");

// --- Avbryt lämnar avataren orörd ---
await openEditor(desk);
await desk.waitForSelector(".dlg-avatar .av-panel .av-tile");
await tab(desk, "hair").click();
await tile(desk, "style", "Tuppkam").click();
await desk.locator(".dlg-avatar .av-cancel").click();
ok(await desk.evaluate(() => document.querySelector('#modal').classList.contains('hidden')), "Avbryt stänger dialogen");
ok(await desk.evaluate((d) => JSON.stringify(AVM.loadAvatar()) === JSON.stringify(d), def.a), "Avbryt sparar inget");

// --- Stora genomgången ---
await openEditor(desk);
await desk.waitForSelector(".dlg-avatar .av-panel .av-tile");
await desk.waitForTimeout(300);
await desk.screenshot({ path: OUT + "av-desk-0-open.png" });

// Återställ
await tab(desk, "hair").click();
const styleBefore = await selected(desk, "style");
await tile(desk, "style", "Afro").click();
ok((await selected(desk, "style"))[0] === "Afro", "val markeras direkt (Afro)");
await desk.locator(".dlg-avatar .av-reset").click();
ok(JSON.stringify(await selected(desk, "style")) === JSON.stringify(styleBefore), "↺ Återställ går tillbaka");

const shot = async (name) => { await desk.waitForTimeout(120); await desk.screenshot({ path: OUT + `av-desk-${name}.png` }); };
await tab(desk, "skin").click(); await desk.locator('.av-panel .av-tile[data-k="skin"]').nth(3).click(); await shot("1-hud");
await tab(desk, "hair").click(); await tile(desk, "style", "Flätor").click(); await sw(desk, "hair", 5).click(); await shot("2-har");
await tab(desk, "face").click(); await tile(desk, "glasses", "Runda").click(); await tile(desk, "beard", "Pipskägg").click(); await tile(desk, "blush", "Rosiga").click(); await shot("3-ansikte");
await tab(desk, "hat").click(); await tile(desk, "hat", "Rosett").click(); await sw(desk, "cap", 9).click(); await shot("4-huvud");
await tab(desk, "top").click(); await tile(desk, "top", "Skjorta").click(); await sw(desk, "shirt", 1).click(); await sw(desk, "accent", 11).click(); await shot("5-troja");
await tab(desk, "bottom").click(); await tile(desk, "bottom", "Kjol").click(); await sw(desk, "pants", 10).click(); await shot("6-byxor");
await tab(desk, "shoes").click(); await sw(desk, "shoes", 3).click(); await shot("7-skor");
await tab(desk, "bag").click(); await tile(desk, "bag", "Axelväska").click(); await sw(desk, "bagColor", 4).click(); await shot("8-vaska");
await tab(desk, "phones").click(); await tile(desk, "phones", "På").click(); await sw(desk, "phoneColor", 2).click(); await shot("9-lurar");
await tab(desk, "apron").click(); await tile(desk, "apron", "Utan").click(); await shot("10-forklade");
await tab(desk, "size").click(); await tile(desk, "kid", "Barn").click();
ok(await desk.locator('.av-panel .av-tile[data-k="build"]:disabled').count() === 3, "kroppsbyggnad låst för barn");
await shot("11-storlek-barn");
await tile(desk, "kid", "Vuxen").click(); await tile(desk, "build", "Bred").click();

// förhandsvisningen: paus + vrid
await desk.locator(".dlg-avatar [data-play]").click();
await desk.locator('.dlg-avatar [data-turn="1"]').click();
const px1 = await desk.evaluate(() => document.querySelector('.av-cv').toDataURL());
await desk.locator('.dlg-avatar [data-turn="1"]').click();
await desk.waitForTimeout(100);
const px2 = await desk.evaluate(() => document.querySelector('.av-cv').toDataURL());
ok(px1 !== px2, "⟳ vrider figuren");
await desk.locator(".dlg-avatar [data-play]").click();

// 🎲 Slumpa ändrar utseendet men inte namn/storlek
const beforeRand = await desk.evaluate(() => document.querySelector('.av-face canvas').toDataURL());
let changedCount = 0;
for (let i = 0; i < 3; i++) {
  await desk.locator(".dlg-avatar .av-rand").click();
  const now = await desk.evaluate(() => document.querySelector('.av-face canvas').toDataURL());
  if (now !== beforeRand) changedCount++;
}
ok(changedCount >= 2, "🎲 Slumpa ger nya utseenden");
ok((await selected(desk, "kid"))[0] === "Vuxen", "Slumpa behåller vuxen/barn");
await shot("12-slumpad");

// bestämda val efter slumpningen – dessa ska finnas kvar efter omladdning
await tab(desk, "hair").click(); await tile(desk, "style", "Tofsar").click();
await tab(desk, "hat").click(); await tile(desk, "hat", "Krona").click();
await tab(desk, "face").click(); await tile(desk, "glasses", "Solglasögon").click(); await tile(desk, "beard", "Inget").click();
await tab(desk, "bottom").click(); await tile(desk, "bottom", "Klänning").click();
await tab(desk, "bag").click(); await tile(desk, "bag", "Ryggsäck").click();
await tab(desk, "phones").click(); await tile(desk, "phones", "På").click();
await tab(desk, "apron").click(); await tile(desk, "apron", "Förkläde").click();
await tab(desk, "size").click(); await tile(desk, "build", "Smal").click();
// egen färg (color input)
await tab(desk, "top").click();
await desk.locator('.av-panel input[data-own="shirt"]').evaluate((el) => { el.value = '#12ab34'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
ok(await desk.locator('.av-panel .av-own.on input[data-own="shirt"]').count() === 1, "egen tröjfärg (färgväljaren) markeras");

// namn krävs
await desk.fill("#av-name", "   ");
await desk.locator(".dlg-avatar .av-save").click();
ok(await desk.evaluate(() => !document.querySelector('#modal').classList.contains('hidden')), "tomt namn → dialogen stannar öppen");
ok((await desk.textContent(".av-err")).length > 0, "tomt namn → felmeddelande");
await shot("13-namnfel");
await desk.fill("#av-name", "Testarn Långnamn");
ok((await desk.inputValue("#av-name")).length <= 12, "namnet max 12 tecken");
await desk.fill("#av-name", "Pixel-Pelle");
await desk.locator(".av-mk .av-sw").nth(7).click();
await shot("14-klar");
const markerColor = await desk.locator(".av-mk .av-sw").nth(7).getAttribute("data-mark");
await desk.locator(".dlg-avatar .av-save").click();
await desk.waitForTimeout(200);
const done = await desk.evaluate(() => window.__done);
ok(await desk.evaluate(() => document.querySelector('#modal').classList.contains('hidden')), "Spara stänger dialogen");
ok(done && done.name === "Pixel-Pelle", "onDone(av) anropas med sparad avatar");
await desk.screenshot({ path: OUT + "av-desk-15-sparad.png" });

// ladda om och läs tillbaka
await desk.reload({ waitUntil: "domcontentloaded" });
await desk.waitForTimeout(300);
await importAvatar(desk);
const back = await desk.evaluate(() => AVM.loadAvatar());
const L = back.look;
ok(JSON.stringify(back) === JSON.stringify(done), "loadAvatar() efter omladdning = sparad avatar");
ok(back.name === "Pixel-Pelle" && back.color === markerColor, "namn + markörfärg sparade");
ok(L.style === "pigtails" && L.hat === "crown" && L.glasses === "sun" && L.beard === false, "frisyr/huvudbonad/glasögon/skägg sparade");
ok(L.bottom === "dress" && L.bag === "backpack" && L.apron === true && L.build === 4 && L.kid === false, "klänning/väska/förkläde/storlek sparade");
ok(L.shirt === "#12ab34", "egen färg sparad");
ok(L.phones === true, "hörlurar sparade");
ok(await desk.evaluate(() => { const L = AVM.loadAvatar().look; return JSON.stringify(JSON.parse(JSON.stringify(L))) === JSON.stringify(L); }), "look är JSON-serialiserbar");
const cleaned = await desk.evaluate(() => AVM.cleanAvatar({ name: '<b>x</b>'.repeat(5), look: { style: 'hack', skin: 'red', glasses: true, kid: true, beard: 'full' }, color: 'nope' }));
ok(!/[<>]/.test(cleaned.name) && cleaned.name.length <= 12 && cleaned.look.style === "short" && cleaned.look.glasses === "square" && cleaned.look.beard === false && /^#/.test(cleaned.color), "cleanAvatar() rensar skräpdata");

// portrait-remsa för lobbyn
await desk.evaluate(() => {
  const box = document.createElement('div'); box.id = 'av-lobby-test';
  box.style.cssText = 'position:fixed;left:10px;top:10px;z-index:99;display:flex;gap:8px;padding:8px;background:#241f2c';
  for (const s of [32, 48, 64, 96]) box.append(AVM.avatarPortrait(AVM.loadAvatar(), s));
  document.body.append(box);
});
await desk.screenshot({ path: OUT + "av-desk-16-portratt.png", clip: { x: 0, y: 0, width: 300, height: 130 } });

// öppna igen – visar den sparade
await openEditor(desk);
await desk.waitForSelector(".dlg-avatar .av-panel .av-tile");
ok((await desk.inputValue("#av-name")) === "Pixel-Pelle", "redigeraren öppnar med sparat namn");
await tab(desk, "hair").click();
ok((await selected(desk, "style"))[0] === "Tofsar", "redigeraren visar sparad frisyr");
await desk.waitForTimeout(700);
await desk.screenshot({ path: OUT + "av-desk-17-igen.png" });
ok(await desk.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "skrivbord: ingen horisontell sidscroll");
await desk.locator(".dlg-avatar [data-close]").click();

// ================= Mobil (iPhone 13) =================
console.log("Mobil iPhone 13");
const mctx = await browser.newContext({ ...devices["iPhone 13"] });
const mob = await mctx.newPage();
watch(mob, "mobil");
await mob.goto(URL, { waitUntil: "domcontentloaded" });
await mob.waitForTimeout(300);
await importAvatar(mob);
await openEditor(mob);
await mob.waitForSelector(".dlg-avatar .av-panel .av-tile");
await mob.waitForTimeout(400);
await mob.screenshot({ path: OUT + "av-mob-0-open.png" });
const fitCheck = () => mob.evaluate(() => {
  const d = document.querySelector('.dlg-avatar').getBoundingClientRect();
  const over = [...document.querySelectorAll('.dlg-avatar *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 0.5 || r.left < -0.5); }).map((e) => e.className || e.tagName).slice(0, 5);
  const p = document.querySelector('.av-panel');
  return { page: document.documentElement.scrollWidth <= innerWidth, dlg: d.left >= 0 && d.right <= innerWidth && d.top >= 0 && d.bottom <= innerHeight, over, panel: p.scrollWidth <= p.clientWidth, panelH: Math.round(p.clientHeight),
    foot: [...document.querySelectorAll('.dlg-avatar .dlg-foot .btn')].map((b) => Math.round(b.getBoundingClientRect().top)) };
});
let fc = await fitCheck();
ok(fc.page && fc.dlg && !fc.over.length && fc.panel, `mobil: dialogen ryms, ingen horisontell scroll ${fc.over.length ? JSON.stringify(fc.over) : ''}`);
ok(fc.panelH >= 250, `mobil: valpanelen har plats (${fc.panelH}px)`);
ok(new Set(fc.foot).size === 1, "mobil: knapparna på en rad");
for (const [id, name] of [["hair", "1-har"], ["face", "2-ansikte"], ["top", "3-troja"], ["size", "4-storlek"]]) {
  await tab(mob, id).tap();
  await mob.waitForTimeout(120);
  await mob.screenshot({ path: OUT + `av-mob-${name}.png` });
  fc = await fitCheck();
  ok(fc.page && fc.panel && !fc.over.length, `mobil flik ${id}: ryms ${fc.over.length ? JSON.stringify(fc.over) : ''}`);
}
await tab(mob, "hair").tap(); await tile(mob, "style", "Vågigt").tap();
await tab(mob, "hat").tap(); await tile(mob, "hat", "Mössa").tap();
await mob.screenshot({ path: OUT + "av-mob-5-mossa.png" });
await mob.locator(".dlg-avatar .av-save").tap();
await mob.waitForTimeout(200);
const mback = await mob.evaluate(() => AVM.loadAvatar());
ok(mback.look.style === "wavy" && mback.look.hat === "beanie", "mobil: sparade val");

// ================= Surfplatta + liggande mobil =================
for (const [name, opts] of [["surfplatta", { viewport: { width: 768, height: 1024 } }], ["liggande", { ...devices["iPhone 13 landscape"] }]]) {
  const ctx = await browser.newContext(opts);
  const pg = await ctx.newPage();
  watch(pg, name);
  await pg.goto(URL, { waitUntil: "domcontentloaded" });
  await importAvatar(pg);
  await openEditor(pg);
  await pg.waitForSelector(".dlg-avatar .av-panel .av-tile");
  await tab(pg, "top").click();
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: OUT + `av-${name}.png` });
  const r = await pg.evaluate(() => {
    const d = document.querySelector('.dlg-avatar').getBoundingClientRect(), p = document.querySelector('.av-panel');
    const save = document.querySelector('.dlg-avatar .av-save').getBoundingClientRect();
    return { page: document.documentElement.scrollWidth <= innerWidth, dlg: d.right <= innerWidth && d.bottom <= innerHeight + 0.5, panel: p.scrollWidth <= p.clientWidth && p.clientHeight > 60, save: save.bottom <= innerHeight };
  });
  ok(r.page && r.dlg && r.panel && r.save, `${name}: dialogen ryms, Spara synlig ${JSON.stringify(r)}`);
  await ctx.close();
}

// ================= Kunderna oförändrade =================
console.log("Kunder (makeLook) mot " + BASE_COMMIT);
const baseSrc = execSync(`git show ${BASE_COMMIT}:js/core/people.js`, { cwd: "D:/GamesProjects/pixelverkstan" }).toString();
const px = await browser.newPage({ viewport: { width: 1200, height: 800 } });
watch(px, "pixlar");
await px.goto("http://localhost:8777/tools/art.html", { waitUntil: "domcontentloaded" });
const cmp = await px.evaluate(async (src) => {
  const OLD = await import(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
  const NEW = await import('/js/core/people.js?' + Date.now());
  const mk = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  let lookDiff = 0, checked = 0, diffs = 0;
  const pairs = [];
  for (const seed of [12345, 777, 4242]) {
    const r1 = mk(seed), r2 = mk(seed);
    for (let i = 0; i < 40; i++) { const a = OLD.makeLook(r1), b = NEW.makeLook(r2); if (JSON.stringify(a) !== JSON.stringify(b)) lookDiff++; pairs.push([a, b]); }
  }
  pairs.push([OLD.SHOPKEEPER, NEW.SHOPKEEPER]);
  for (const extra of [{ style: 'cap' }, { glasses: true, beard: true }, { kid: true, bottom: 'skirt' }, { bottom: 'shorts', shoes: '#f2f2f2' }, {}, null]) {
    pairs.push(extra ? [{ ...pairs[3][0], ...extra }, { ...pairs[3][1], ...extra }] : [{}, {}]);
  }
  const draw = (P, L, dir, f) => { const c = document.createElement('canvas'); c.width = 30; c.height = 46; const x = c.getContext('2d'); P.drawPerson(x, 15, 42, L, dir, f); return x.getImageData(0, 0, 30, 46).data; };
  const eq = (A, B) => { for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false; return true; };
  for (const [a, b] of pairs) {
    for (const dir of ['down', 'up', 'left', 'right']) for (let f = 0; f <= 5; f++) { checked++; if (!eq(draw(OLD, a, dir, f), draw(NEW, b, dir, f))) diffs++; }
    checked++;
    if (!eq(OLD.portrait(a).getContext('2d').getImageData(0, 0, 80, 96).data, NEW.portrait(b).getContext('2d').getImageData(0, 0, 80, 96).data)) diffs++;
  }
  // galleri över de nya valen
  document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#8a8070';
  const base = { ...NEW.SHOPKEEPER, apron: false, hat: null, style: 'short', hair: '#6b4226', shirt: '#46a35a', accent: '#f0b429' };
  const rows = [
    ...['braids', 'pigtails', 'wavy'].map((s) => ({ ...base, style: s })),
    { ...base, style: 'braids', kid: true, hat: 'bow', cap: '#c65fa0' },
    { ...base, hat: 'headband', cap: '#d9433b', style: 'long' }, { ...base, hat: 'crown', cap: '#f0b429', style: 'afro' },
    { ...base, beard: 'goatee', hair: '#3b2619', top: 'shirt', shirt: '#e8e3d6', accent: '#3a7bd5' },
    { ...base, bottom: 'dress', shirt: '#b83d7a', style: 'wavy', hat: 'bow', cap: '#f4f1ea' },
  ];
  const cols = [['down', 0], ['down', 1], ['down', 5], ['up', 0], ['up', 1], ['right', 0], ['right', 1], ['left', 2]];
  const Z = 4, CW = 24, RH = 44;
  const c = document.createElement('canvas'); c.width = (cols.length * CW + 26) * Z; c.height = rows.length * RH * Z; document.body.append(c);
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.scale(Z, Z);
  rows.forEach((L, r) => {
    x.fillStyle = r % 2 ? '#d8ccb6' : '#e9e1d2'; x.fillRect(0, r * RH, cols.length * CW + 26, RH);
    cols.forEach(([d, f], i) => NEW.drawPerson(x, 12 + i * CW, r * RH + 41, L, d, f));
    x.drawImage(NEW.portrait(L), cols.length * CW + 3, r * RH + 4, 20, 24);
  });
  return { looks: pairs.length, lookDiff, checked, diffs };
}, baseSrc);
ok(cmp.lookDiff === 0, `makeLook(rng) ger samma utseenden (${cmp.looks} st)`);
ok(cmp.diffs === 0, `pixel-identiska kunder: ${cmp.checked - cmp.diffs}/${cmp.checked} sprites+porträtt`);
await px.screenshot({ path: OUT + "av-people.png", fullPage: true });

console.log(errors.length ? "Fel i sidan:\n" + errors.join("\n") : "inga sidfel");
console.log(fails ? `${fails} KONTROLL(ER) MISSLYCKADES` : "ALLA KONTROLLER OK");
await browser.close();
process.exit(fails ? 1 : 0);
