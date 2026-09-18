// Varje konsol ska ha minst ett spel att sälja varje år den är het – annars står spelhyllan tom
// fast kunderna köper konsolen. Rent Node, ingen webbläsare: node tools/konsolspel.mjs
const { KONSOLER, SPEL, ARKAD } = await import('../js/shops/dator/products.js');
const { REQ } = await import('../js/games/specs.js');
let bad = 0;
for (const k of KONSOLER) {
  const [y0, , y1] = k.hype;
  const gaps = [];
  for (let y = y0; y <= y1; y++) if (!SPEL.some((s) => s.platform === k.look.shape && s.year <= y && s.until >= y)) gaps.push(y);
  const n = SPEL.filter((s) => s.platform === k.look.shape).length;
  if (gaps.length) { bad++; console.log(`FEL  ${k.name}: ${n} spel, saknar spel år ${gaps.join(', ')}`); }
  else console.log(`OK   ${k.name}: ${n} spel, täcker ${y0}–${y1}`);
}
// PC-spelen ska ha systemkrav, annars kan speldatorn inte bedöma dem
const noReq = SPEL.filter((s) => s.platform === 'pc' && !REQ[s.id]).map((s) => s.id);
if (noReq.length) { bad++; console.log(`FEL  PC-spel utan systemkrav: ${noReq.join(', ')}`); } else console.log(`OK   alla ${SPEL.filter((s) => s.platform === 'pc').length} PC-spel har systemkrav`);
// unika id:n över alla produkter
const ids = [...KONSOLER, ...SPEL, ...ARKAD].map((p) => p.id), dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) { bad++; console.log(`FEL  dubbla id: ${dup.join(', ')}`); }
console.log(`${KONSOLER.length} konsoler, ${SPEL.length} spel, ${ARKAD.length} arkadmaskiner – ${bad ? bad + ' fel' : 'inga fel'}`);
process.exit(bad ? 1 : 0);
