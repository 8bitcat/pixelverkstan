// Alla titlar i hyllan (spel + arkadmaskiner) får en egen variant, och motorn kör 600 steg med
// slumpad input och ritar på en låtsas-canvas utan att kasta. Rent Node: node tools/spelvarianter.mjs
const P = await import('../js/shops/dator/products.js');
const { variantFor, describe, eraFor } = await import('../js/games/variants.js');
const { engineFor } = await import('../js/games/runtime.js').catch(() => ({ engineFor: null }));
const MODS = {};
for (const n of ['rymd', 'labyrint2d', 'plattform', 'racer', 'fight', 'raycast', 'gun', 'dance', 'block', 'aventyr', 'dig', 'city', 'sport', 'brawl', 'sim']) MODS[n] = await import(`../js/games/${n}.js`);
const ALIAS = { rpg: 'aventyr', kong: 'plattform', maze: 'labyrint2d', invaders: 'rymd', road: 'racer', basket: 'sport', corridor: 'raycast', blocks: 'block', platform: 'plattform' };
const eng = (n) => (MODS[n] ? n : ALIAS[n] || 'plattform');
// låtsas-canvas: räknar anrop, klagar på NaN
const ctx = new Proxy({ fillStyle: '', calls: 0 }, { get(t, k) { if (k in t) return t[k]; return (...a) => { t.calls++; if (k === 'fillRect' && a.slice(0, 4).some((v) => Number.isNaN(v))) throw new Error('NaN i fillRect'); }; }, set(t, k, v) { t[k] = v; return true; } });
const KEYS = ['left', 'right', 'up', 'down', 'a', 'b'];
let bad = 0, n = 0;
const seen = new Map();
const titles = [...P.SPEL, ...P.ARKAD];
for (const p of titles) {
  const v = variantFor(p), name = eng(v.engine), key = describe(v);
  seen.set(key, (seen.get(key) || 0) + 1);
  try {
    const g = MODS[name].create({ title: p.name, ...v }, { software: false });
    let inp = {};
    for (let i = 0; i < 600; i++) {
      if (i % 15 === 0) { inp = {}; for (const k of KEYS) inp[k] = Math.random() < 0.4; for (const k of KEYS) inp[k + 'Hit'] = Math.random() < 0.15; inp.hit = inp.aHit; inp.start = i > 500 && Math.random() < 0.3; if (Math.random() < 0.3) { inp.mx = Math.random() * 240; inp.my = Math.random() * 160; } }
      g.update(1 / 60, inp);
      if (i % 5 === 0) g.draw(ctx);
      if (typeof g.score !== 'number' || Number.isNaN(g.score)) throw new Error('poängen är inte ett tal');
    }
    n++;
  } catch (e) { bad++; console.log(`FEL  ${p.id} (${name}): ${e.message}\n     ${String(e.stack).split('\n')[1] || ''}`); }
}
console.log(`OK   ${n} av ${titles.length} titlar körde 600 steg utan fel`);
// olika spel ska se olika ut: minst 70 olika varianter, och de kända paren ska skilja sig
const distinct = seen.size;
console.log(`${distinct >= 70 ? 'OK  ' : 'FEL '} ${distinct} olika varianter bland ${titles.length} titlar`);
if (distinct < 70) bad++;
const pairs = [['s-smb', 's-sonic'], ['s-zelda', 's-smb'], ['s-boulder', 's-tetris'], ['s-doom', 's-wolf3d'], ['s-nhl94', 's-fifa'], ['a-finalfight', 'a-sf2'], ['s-gta3', 's-crazytaxi'], ['s-columns', 's-tetris'], ['s-minecraft', 's-boulder']];
for (const [a, b] of pairs) { const va = describe(variantFor(P.PRODUCTS.find((x) => x.id === a))), vb = describe(variantFor(P.PRODUCTS.find((x) => x.id === b))); const ok = va !== vb; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FEL '} ${a} [${va}] ≠ ${b} [${vb}]`); }
// eran följer konsolen
const era = (id) => eraFor(P.PRODUCTS.find((x) => x.id === id));
const eras = { 's-boulder': 'c64', 's-tetris': 'gb', 's-smb': '8bit', 's-sonic': '16bit', 's-kq': 'cga', 's-tekken': '32bit', 's-odyssey': 'hd', 's-pitfall': 'atari' };
for (const [id, e] of Object.entries(eras)) { const got = era(id); if (got !== e) bad++; console.log(`${got === e ? 'OK  ' : 'FEL '} ${id} era ${got}`); }
const byEngine = {}; for (const p of titles) { const e = eng(variantFor(p).engine); byEngine[e] = (byEngine[e] || 0) + 1; }
console.log('motorer: ' + Object.entries(byEngine).map(([k, v]) => `${k} ${v}`).join(', '));
console.log(bad ? `${bad} fel` : 'inga fel');
process.exit(bad ? 1 : 0);
