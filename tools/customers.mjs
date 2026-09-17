// Simulerar butiken i Node: spelar igenom de guidade kunderna och kör sedan flera år
// och räknar att kunder fortsätter komma. node tools/customers.mjs [startår]
globalThis.localStorage = { _: {}, getItem(k) { return this._[k] ?? null; }, setItem(k, v) { this._[k] = String(v); }, removeItem(k) { delete this._[k]; } };
const shop = (await import('../js/shops/dator/index.js')).default;
const { Game } = await import('../js/core/game.js');
const { FIRST_NAMES } = await import('../js/core/people.js');
await shop.init();
const year0 = +(process.argv[2] || 1991);
const g = new Game(shop, { fresh: true, startYear: year0, slot: year0 });
let spawned = 0, served = 0, stuck = 0;
const origSpawn = g.spawn.bind(g);
g.spawn = (o) => { const c = origSpawn(o); if (c) spawned++; return c; };
const log = [];
const step = (sec) => { for (let t = 0; t < sec; t += 0.5) { g.update(0.5, { shopVisible: true }); for (const d of g.deliveries) if (d.state === 'arrived') g.unpack(d.id, true); } };
// köp startpaketet
g.buyMany(shop.starterKit(g));
step(15);
let lastSpawnAt = g.time;
for (let round = 0; round < 60 && g.year < year0 + 4; round++) {
  step(5);
  const c = g.queue().find((x) => x.phase !== 'arriving') || g.customers.find((x) => x.phase === 'arriving');
  if (!c) { if (g.time - lastSpawnAt > 150) { stuck++; log.push(`år ${g.year}: inga kunder på ${Math.round(g.time - lastSpawnAt)} s (guidesteg ${g.tutorialStep}, framme ${Object.keys(g.shown).length})`); lastSpawnAt = g.time; if (stuck > 3) break; } continue; }
  lastSpawnAt = g.time;
  c.phase = 'queue';
  // köp det som saknas, packa upp, ta emot, leverera direkt
  if (g.toBuyFor(c.order).length) { g.buyMissing(c.order); step(14); }
  const o = g.accept(c);
  if (!o) { g.decline(c); continue; }
  const p = g.complete(o, { stars: 3, time: 60, errors: 0, help: true, warnings: [] });
  g.pay(p, c); served++;
  g.customers = g.customers.filter((x) => x !== c);
  // fyll på: köp in delar i samma kategorier som ordern (ställs ut)
  if (g.money > 20000) for (const it of o.items.slice(0, 4)) if (it.part && g.onSale(shop.part[it.part]) && shop.part[it.part].cost < g.money / 4) g.buy(it.part, 1);
}
console.log(`startår ${year0} → år ${g.year}: ${spawned} kunder kom, ${served} betjänade, guidesteg ${g.tutorialStep}, pengar ${Math.round(g.money)}`);
for (const l of log) console.log('  ' + l);
process.exit(stuck ? 1 : 0);
