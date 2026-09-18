// Händelser och modeller i Node: alla händelser är giltiga, auto-förslaget ger byggbara modeller
// varje år för varje användning, recensionerna håller sig inom 1–10 och uppföljare går att bygga.
// node tools/handelser.mjs
const S = (await import('../js/shops/dator/index.js')).default;
const E = await import('../js/shops/dator/events.js');
const M = await import('../js/shops/dator/models.js');
await S.init();
let bad = 0;
const ok = (c, msg) => { if (!c) bad++; console.log((c ? 'OK   ' : 'FEL  ') + msg); };

// ---- händelser ----
const ids = E.EVENTS.map((e) => e.id);
ok(new Set(ids).size === ids.length, `${ids.length} händelser med unika id`);
ok(E.EVENTS.every((e) => e.year >= 1983 && e.year <= 2026 && e.title && e.text && e.icon), 'alla har år 1983–2026, titel, text och ikon');
const badKeys = [];
for (const e of E.EVENTS) {
  for (const k of Object.keys(e.effect || {})) if (!E.EFFECT_KEYS.includes(k)) badKeys.push(`${e.id}.${k}`);
  for (const c of e.choices || []) for (const k of Object.keys(c.effect || {})) if (!E.EFFECT_KEYS.includes(k)) badKeys.push(`${e.id}/${c.id}.${k}`);
  if (!e.choices?.length) badKeys.push(`${e.id}: inga val`);
  for (const c of e.choices || []) { if (!c.id || !c.label) badKeys.push(`${e.id}: val utan id/etikett`); if (c.cost < 0) badKeys.push(`${e.id}/${c.id}: negativ kostnad`); if (c.need && !/^(model:(gamer|kontor|skola|budget|media)|money:\d+)$/.test(c.need)) badKeys.push(`${e.id}/${c.id}: okänt krav ${c.need}`); }
  for (const [pid] of Object.entries(e.effect?.stock || {})) if (!S.part[pid]) badKeys.push(`${e.id}: okänd del ${pid}`);
  for (const c of e.choices || []) for (const [pid] of Object.entries(c.effect?.stock || {})) if (!S.part[pid]) badKeys.push(`${e.id}/${c.id}: okänd del ${pid}`);
}
ok(!badKeys.length, badKeys.length ? `okända effekter: ${badKeys.join(', ')}` : 'alla effekter använder kända nycklar');
const years = {}; for (const e of E.EVENTS) years[e.year] = (years[e.year] || 0) + 1;
ok(E.nextEvent(1983, []).id === 'hemdator83' && E.nextEvent(1990, ['hemdator83', 'compis85', 'dmz86', 'amiga87', 'nes88', 'sb89']).id === 'win30', 'nextEvent tar den äldsta osedda');
const gaps = []; for (let y = 1983; y <= 2026; y += 5) if (!E.EVENTS.some((e) => e.year >= y && e.year < y + 5)) gaps.push(y);
ok(!gaps.length, gaps.length ? `femårsperioder utan händelse: ${gaps.join(', ')}` : 'minst en händelse per femårsperiod');

// ---- modeller ----
let fails = [], n = 0, sumTotal = 0, hof = 0, low = 0;
for (let y = 1983; y <= 2026; y += 2) {
  for (const u of M.USES) {
    const parts = M.suggestParts(u.id, y);
    if (!parts) { fails.push(`${y} ${u.id}: inget förslag`); continue; }
    const probs = M.problems(parts, y);
    if (probs.length) { fails.push(`${y} ${u.id}: ${probs[0]}`); continue; }
    for (const a of M.AUDS) {
      const list = M.partsOf(parts), pi = M.priceInfo(list, 0, a.id, y);
      const m = { name: M.nameFor(parts, u.id), use: u.id, aud: a.id, parts, price: pi.suggested, year: y, hype: 0.7, state: 'sale' };
      const r = M.review(m, y, { rykte: 5 });
      n++; sumTotal += r.total; if (r.hof) hof++; if (r.total <= 14) low++;
      if (r.scores.some((s) => s < 1 || s > 10) || r.quotes.length !== 4 || !m.name) fails.push(`${y} ${u.id}/${a.id}: ${JSON.stringify(r.scores)} ${m.name}`);
      m.review = r;
      if (!(M.salesRate(m, y, { lokal: 3 }) > 0)) fails.push(`${y} ${u.id}/${a.id}: säljer inget`);
    }
    // uppföljaren två år senare ska gå att bygga
    if (y + 2 <= 2026) { const seq = M.sequelOf({ parts, use: u.id }, y + 2); const p2 = M.problems(seq, y + 2); if (p2.length) fails.push(`${y + 2} uppföljare ${u.id}: ${p2[0]}`); }
  }
}
ok(!fails.length, fails.length ? `${fails.length} fel, t.ex. ${fails.slice(0, 4).join(' | ')}` : `${n} modeller föreslagna, recenserade och sålda utan fel`);
ok(sumTotal / n > 18 && sumTotal / n < 34, `snittbetyg ${(sumTotal / n).toFixed(1)}/40, ${hof} Hall of Fame, ${low} sågade`);
// dold kompatibilitet syns i betyget
const y = 1996, parts = M.suggestParts('gamer', y), list = M.partsOf(parts);
const rate = (aud) => { let s = 0; for (let i = 0; i < 20; i++) s += M.review({ use: 'gamer', aud, parts, price: M.priceInfo(list, 0, aud, y).suggested, year: y }, y).total; return s / 20; };
ok(rate('tonaring') > rate('pensionar') + 3, `speldator: tonåringar ${rate('tonaring').toFixed(1)} > pensionärer ${rate('pensionar').toFixed(1)}`);
const dear = M.review({ use: 'kontor', aud: 'student', parts: M.suggestParts('kontor', y), price: M.priceInfo(M.partsOf(M.suggestParts('kontor', y)), 0, 'student', y).cost * 2.2, year: y }, y);
ok(dear.scores[1] <= 4, `dubbelt pris ger prisbetyg ${dear.scores[1]}/10`);
ok(M.nextName('Pixel 486 Game') === 'Pixel 486 Game II' && M.nextName('Pixel 486 Game II') === 'Pixel 486 Game III', 'uppföljarnamn');
console.log(bad ? `${bad} fel` : 'inga fel');
process.exit(bad ? 1 : 0);
