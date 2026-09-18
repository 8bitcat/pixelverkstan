// Reparationsuppdrag i Node: skapa hundratals inlämnade datorer 1983–2026, kontrollera att felet
// ligger inne (det som saknas syns i bygget), att den hela datorn är komplett, och att ett
// lagat fel gör bygget helt igen. node tools/repair.mjs [antal per år]
globalThis.localStorage = { _: {}, getItem(k) { return this._[k] ?? null; }, setItem(k, v) { this._[k] = String(v); }, removeItem(k) { delete this._[k]; } };
const shop = (await import('../js/shops/dator/index.js')).default;
const F = await import('../js/shops/dator/faults.js');
const { rigFor } = await import('../js/shops/dator/rig.js');
await shop.init();
const N = +(process.argv[2] || 3);
const names = ['Test'];
let n = 0, bad = 0;
const byFault = {};
for (let y = 1983; y <= 2026; y++) {
  for (let i = 0; i < N; i++) {
    const g = { year: y, shop, shownFree: () => 0, stockFree: () => 0 };
    const o = F.repairOrder(g, names);
    if (!o) { console.log('FEL', y, 'ingen reparation kunde skapas'); bad++; continue; }
    const f = F.FAULT[o.repair.fault], L = rigFor(o);
    byFault[f.id] = (byFault[f.id] || 0) + 1;
    // hela datorn ska vara komplett
    const full = F.completeBuild(o);
    const probs = L.standCheck(full), unready = L.CABLES.filter((c) => L.cableReady(c, full) && !full.cables.has(c.id)).map((c) => c.id);
    if (probs.length || unready.length) { console.log('FEL', y, o.title, 'ofullständig:', probs.map((p) => p.msg).join(' '), unready.join(',')); bad++; }
    // det inlämnade bygget har felet
    const b = F.makeRepairBuild(o);
    if (b.phase !== 'desk' || F.faultFixed(o, b, f)) { console.log('FEL', y, f.id, 'felet är inte inlagt'); bad++; }
    // lagat → helt igen
    if (f.kind === 'cable') b.cables.set(f.cable, full.cables.get(f.cable));
    else if (f.kind === 'act') b.acts.set(f.act, full.acts.get(f.act));
    else if (f.kind === 'part') b.placed[f.slot] = full.placed[f.slot];
    else if (f.kind === 'swap') for (const id of f.cables) b.cables.set(id, full.cables.get(id));
    if (!F.faultFixed(o, b, f) || L.standCheck(b).length) { console.log('FEL', y, f.id, 'gick inte att laga'); bad++; }
    n++;
  }
}
console.log(`Reparationer: ${n}, fel: ${bad}`);
console.log('Fel per typ:', JSON.stringify(byFault));
process.exit(bad ? 1 : 0);
