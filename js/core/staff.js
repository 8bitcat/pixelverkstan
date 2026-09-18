// Personal: tekniker som bygger och lagar i verkstaden på egen hand, säljare som tar emot
// kunder vid disken och säljer på ett grafikkort. Stats 1–5 (bygg, service, sälj), energi,
// humör, lön varje månad (60 s), kurser och nivåer – à la Game Dev Story.
// Körs bara hos värden (game.update); allt som ändrar spelet går via game-metoderna.
import { FIRST_NAMES, makeLook } from './people.js';

export const ROLES = {
  tekniker: { name: 'Tekniker', icon: '🔧', main: 'bygg', desc: 'Bygger och lagar kundernas datorer i verkstaden medan du gör annat. Bygg-stat ger fart och stjärnor, service-stat räknas vid reparationer.' },
  saljare: { name: 'Säljare', icon: '🛍️', main: 'salj', desc: 'Tar emot kunden vid disken när delarna finns hemma – och säljer på ett grafikkort ur lagret. Sälj-stat ger fler påslag.' },
};
export const STATS = { bygg: { name: 'Bygg', icon: '🔧' }, service: { name: 'Service', icon: '🩺' }, salj: { name: 'Sälj', icon: '🛍️' } };
export const MONTH = 60;                          // sekunder per lönemånad
export const MAX_STAFF = [0, 0, 1, 2, 3, 4, 6];    // plats per lokal (Källarhålan: ingen)
const SURNAMES = ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson', 'Pettersson', 'Jonsson', 'Jansson', 'Hansson', 'Bengtsson', 'Lindberg', 'Lindqvist', 'Berg', 'Nyström', 'Holm', 'Ek', 'Sjöberg', 'Wallin', 'Åberg', 'Nguyen', 'Ali', 'Hussein', 'Kowalski', 'Öztürk'];
const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const fmt = (n) => Math.round(n).toLocaleString('sv-SE');
const toast = (game, text, kind = '') => game.emit('toast', { text, kind });

export const priceIdx = (game) => (game.shop.fit?.priceFor ? game.shop.fit.priceFor(1000, game.year) / 1000 : 1);
export const salaryFor = (stats, idx) => Math.round((900 + 350 * (stats.bygg + stats.service + stats.salj)) * idx / 50) * 50;
export const maxStaff = (game) => MAX_STAFF[Math.min(MAX_STAFF.length - 1, game.lokal || 1)] || 0;
export const courseOf = (game, id) => (game.shop.staff?.COURSES || []).find((c) => c.id === id) || null;
export const coursesFor = (game) => (game.shop.staff?.COURSES || []).filter((c) => !c.year || c.year <= game.year).map((c) => ({ ...c, cost: Math.round(c.cost * priceIdx(game) / 50) * 50 }));

export function makeCandidate(game, role) {
  const main = ROLES[role].main, r = () => 1 + Math.floor(Math.random() * 3);
  const stats = { bygg: r(), service: r(), salj: r() };
  stats[main] = Math.min(5, stats[main] + 1 + (Math.random() < 0.3 ? 1 : 0));
  return { id: game.nextId++, name: `${rnd(FIRST_NAMES)} ${rnd(SURNAMES)}`, role, look: makeLook(), stats, energy: 100, mood: 80, xp: 0, level: 1, lon: salaryFor(stats, priceIdx(game)), year: game.year, job: null, progress: 0, course: null, jobs: 0, sales: 0 };
}
// sökande: två tekniker och två säljare, nya varje år
export function candidatesFor(game) {
  const st = (game.staffing ||= { cands: [], candYear: null, payT: 0 });
  if (st.candYear !== game.year || !st.cands.length) { st.cands = [makeCandidate(game, 'tekniker'), makeCandidate(game, 'tekniker'), makeCandidate(game, 'saljare'), makeCandidate(game, 'saljare')]; st.candYear = game.year; }
  return st.cands;
}
export function hire(game, candId) {
  const st = game.staffing, c = (st?.cands || []).find((x) => x.id === candId);
  if (!c) return false;
  if (game.staff.length >= maxStaff(game)) { toast(game, maxStaff(game) ? 'Lokalen är full – bygg ut butiken för fler anställda.' : 'Källarhålan har inte plats för anställda – bygg ut till Gatuplan först.', 'bad'); return false; }
  if (game.money < c.lon) { toast(game, `Första månadslönen (${fmt(c.lon)} kr) måste finnas i kassan.`, 'bad'); return false; }
  st.cands = st.cands.filter((x) => x !== c);
  game.staff.push(c);
  toast(game, `${ROLES[c.role].icon} ${c.name} börjar som ${ROLES[c.role].name.toLowerCase()} – ${fmt(c.lon)} kr i månaden.`, 'good');
  return true;
}
export function fire(game, id) {
  const s = game.staff.find((x) => x.id === id);
  if (!s) return false;
  release(game, s);
  game.staff = game.staff.filter((x) => x !== s);
  toast(game, `${s.name} har slutat.`, '');
  return true;
}
export function train(game, id, courseId) {
  const s = game.staff.find((x) => x.id === id), c = coursesFor(game).find((x) => x.id === courseId);
  if (!s || !c) return false;
  if (s.course) { toast(game, `${s.name} går redan en kurs.`, 'bad'); return false; }
  if (s.stats[c.stat] >= 5) { toast(game, `${s.name} kan redan allt om ${STATS[c.stat].name.toLowerCase()}.`, 'bad'); return false; }
  if (game.money < c.cost) { toast(game, 'Inte tillräckligt med pengar!', 'bad'); return false; }
  game.money -= c.cost;
  release(game, s);
  s.course = { id: c.id, left: c.time, time: c.time };
  toast(game, `🎓 ${s.name} går ${c.name} (${c.time} s).`, 'good');
  return true;
}
// släpper jobbet (spelaren tar över, kurs, sparkad)
export function release(game, s) {
  if (s.job) { const o = game.orders.find((x) => x.id === s.job); if (o && o.staff === s.id) delete o.staff; }
  s.job = null; s.progress = 0; s.pct = 0;
}
function levelUp(game, s) {
  const need = 40 * s.level;
  if (s.xp < need) return;
  s.xp -= need; s.level++;
  const k = rnd(Object.keys(STATS));
  s.stats[k] = Math.min(5, s.stats[k] + 1);
  s.lon = Math.round(s.lon * 1.08 / 50) * 50;
  toast(game, `⭐ ${s.name} är nu nivå ${s.level} – ${STATS[k].name} +1 (lönen stiger lite).`, 'good');
}

// ---------- tekniker ----------
function pickJob(game, s) {
  for (const o of game.orders) {
    if (o.touched || o.staff || o.tutorial !== undefined) continue;
    // valfria delar: ta något ur lagret som passar, annars kan hen inte bygga den
    const choice = o.items.filter((it) => !it.part && !o.chosen?.[it.cat]);
    const picks = [];
    let ok = true;
    for (const it of choice) {
      const others = o.items.filter((x) => x.part).map((x) => game.shop.part[x.part]).filter(Boolean);
      const p = Object.keys(game.stock).map((id) => game.shop.part[id]).filter((q) => q && q.cat === it.cat && game.stockFree(q.id) > 0 && (!game.shop.fitsWith || game.shop.fitsWith(q, others, game.year))).sort((a, b) => a.cost - b.cost)[0];
      if (!p) { ok = false; break; }
      picks.push([it.cat, p.id]);
    }
    if (!ok) continue;
    for (const [cat, id] of picks) if (game.takeStock(id)) (o.chosen ||= {})[cat] = id;
    o.staff = s.id; s.job = o.id; s.progress = 0; s.pct = 0;
    toast(game, `🔧 ${s.name} tar ${o.title} till verkstaden.`, '');
    return true;
  }
  return false;
}
function tickTekniker(game, s, dt) {
  if (!s.job) { s.idleT = (s.idleT || 0) + dt; if (s.idleT < 2) return false; s.idleT = 0; return pickJob(game, s); }
  const o = game.orders.find((x) => x.id === s.job);
  if (!o || o.staff !== s.id) { s.job = null; s.progress = 0; return true; }
  const stat = o.repair ? s.stats.service : s.stats.bygg;
  const base = o.repair ? 75 : 50 + 10 * o.items.length;   // sekunder för en ovan
  const speed = (0.5 + 0.25 * stat) * (s.energy < 25 ? 0.5 : 1);
  s.progress += dt * speed / base;
  if (s.progress >= 1) {
    let stars = stat >= 4 ? 3 : stat >= 2 ? 2 : 1;
    if (Math.random() < 0.25) stars = Math.min(3, stars + 1);
    if (s.energy < 25) stars = Math.max(1, stars - 1);
    s.job = null; s.progress = 0; s.pct = 0; s.jobs++;
    s.energy = Math.max(0, s.energy - 18); s.xp += 8 + stars * 2; s.mood = Math.min(100, s.mood + 2);
    delete o.staff;
    game.complete(o, { stars, time: 0, errors: 0, help: true, staff: s.name });
    toast(game, `${o.repair ? '🔍' : '🔧'} ${s.name} ${o.repair ? 'lagade' : 'byggde klart'} ${o.title} ${'★'.repeat(stars)} – ${o.name} hämtar vid utlämningen.`, 'good');
    levelUp(game, s);
    return true;
  }
  const pct = Math.floor(s.progress * 20);
  if (pct !== s.pct) { s.pct = pct; return true; }
  return false;
}

// ---------- säljare ----------
function tickSaljare(game, s, dt) {
  s.t = (s.t || 0) + dt;
  if (s.t < 4) return false;
  s.t = 0;
  const c = game.queue()[0];
  if (!c || c.phase !== 'queue' || c.order.tutorial !== undefined) return false;
  const o = c.order;
  if (game.hasGone(o)) {
    if (s.stats.salj < 3) return false;
    game.decline(c); toast(game, `🛍️ ${s.name} tackade nej åt ${c.name} – går inte att bygga längre.`, '');
    return true;
  }
  if (game.missingFor(o).length || game.missingChoices(o).length) return false;   // spelaren får köpa in
  // merförsäljning: ett grafikkort ur lagret om beställningen saknar ett
  if (!o.product && !o.repair && !o.items.some((it) => it.cat === 'gpu') && Math.random() < 0.12 * s.stats.salj) {
    const others = o.items.filter((it) => it.part).map((it) => game.shop.part[it.part]).filter(Boolean);
    const g = Object.keys(game.stock).map((id) => game.shop.part[id]).filter((p) => p && p.cat === 'gpu' && game.stockFree(p.id) > 0 && game.canSell(p) && (!game.shop.fitsWith || game.shop.fitsWith(p, others, game.year))).sort((a, b) => a.cost - b.cost)[0];
    if (g && game.addItem({ customerId: c.id }, g.id)) { s.xp += 4; s.upsells = (s.upsells || 0) + 1; }
  }
  if (!game.accept(c)) return false;
  s.energy = Math.max(0, s.energy - 6); s.xp += 3; s.sales++;
  toast(game, `🛍️ ${s.name} tog emot ${o.title} från ${c.name}.`, 'good');
  levelUp(game, s);
  return true;
}

// ---------- varje bildruta hos värden ----------
export function tickStaff(game, dt) {
  const staff = game.staff;
  if (!staff?.length) return;
  const st = (game.staffing ||= { cands: [], candYear: null, payT: 0 });
  let changed = false;
  st.payT = (st.payT || 0) + dt;
  if (st.payT >= MONTH) {
    st.payT = 0;
    const total = staff.reduce((s, x) => s + x.lon, 0);
    if (game.money >= total) { game.money -= total; game.stats.wages = (game.stats.wages || 0) + total; for (const s of staff) s.mood = Math.min(100, s.mood + 4); toast(game, `💸 Löner: −${fmt(total)} kr`, ''); }
    else { for (const s of staff) s.mood -= 35; toast(game, `😟 Lönerna (${fmt(total)} kr) kunde inte betalas – personalen muttrar.`, 'bad'); }
    changed = true;
  }
  const rest = game.fit?.items?.kaffe ? 1.8 : 1.2;
  for (const s of [...staff]) {
    if (s.course) {
      s.course.left -= dt;
      if (s.course.left <= 0) { const c = courseOf(game, s.course.id); if (c) s.stats[c.stat] = Math.min(5, s.stats[c.stat] + 1); s.course = null; toast(game, `🎓 ${s.name} är klar med ${c?.name || 'kursen'} – ${STATS[c?.stat]?.name || ''} +1.`, 'good'); changed = true; }
      continue;
    }
    if (s.mood <= 0) { release(game, s); game.staff = game.staff.filter((x) => x !== s); toast(game, `🚪 ${s.name} sa upp sig – utebliven lön och ingen vila.`, 'bad'); changed = true; continue; }
    if (s.role === 'tekniker') { if (tickTekniker(game, s, dt)) changed = true; }
    else if (tickSaljare(game, s, dt)) changed = true;
    if (!s.job) s.energy = Math.min(100, s.energy + dt * rest);
    if (s.energy < 10) s.mood = Math.max(0, s.mood - dt * 0.4);
  }
  if (changed) { game.save(); game.emit('change'); }
}
export function statusOf(game, s) {
  if (s.course) { const c = courseOf(game, s.course.id); return `🎓 på kurs: ${c?.name || ''} (${Math.ceil(s.course.left)} s kvar)`; }
  if (s.job) { const o = game.orders.find((x) => x.id === s.job); return o ? `${o.repair ? '🔍 lagar' : '🔧 bygger'} ${o.title} · ${Math.round(s.progress * 100)} %` : 'på väg till verkstaden'; }
  if (s.role === 'saljare') return '🛍️ står vid disken';
  return s.energy < 25 ? '😴 vilar' : '☕ väntar på jobb';
}
