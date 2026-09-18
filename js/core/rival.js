// Konkurrenten på andra sidan gatan. Byter skepnad med eran (lokal butik → varuhuskedja →
// nätbutik → jättesajt), har en styrka 0–1 som drar kunder från dig och som sjunker när ditt
// rykte, din dragningskraft och din personal växer. Vartannat år gör den ett drag – priskrig,
// reklam, värvning – som blir en händelse med val (samma dialog som events.js).
export const STAGES = [
  { from: 1983, name: 'Datahörnan', kind: 'lokal butik', base: 0.25, color: '#f0e030', desc: 'En liten butik två kvarter bort. Trevlig ägare, sämre sortiment.' },
  { from: 1992, name: 'ElektroCity', kind: 'varuhuskedja', base: 0.45, color: '#e23b5a', desc: 'Kedjan öppnar ett varuhus vid infarten. Lågpris, långa köer och ingen som kan något.' },
  { from: 2001, name: 'Kompletta.se', kind: 'nätbutik', base: 0.55, color: '#3a78d8', desc: 'Beställ på nätet, leverans i morgon. Ingen att prata med – men billigt.' },
  { from: 2013, name: 'Amazonas', kind: 'jättesajt', base: 0.65, color: '#f0b429', desc: 'Allt finns, alltid. Butiken vinner bara på service, rykte och sådant man inte kan beställa hem.' },
];
export const stageFor = (year) => [...STAGES].reverse().find((s) => year >= s.from) || STAGES[0];
const fmt = (n) => Math.round(n).toLocaleString('sv-SE');
export const bars = (v) => '▮'.repeat(Math.round(v * 5)) + '▯'.repeat(5 - Math.round(v * 5));

export function initRival(game) {
  const st = stageFor(game.year);
  game.rival = { strength: st.base, stage: st.from, lastMove: game.year, t: 0 };
}
// var 30:e sekund: styrkan glider mot ett mål som beror på hur bra du är; ibland ett drag
export function tickRival(game, dt) {
  const r = game.rival;
  if (!r) return;
  r.t = (r.t || 0) + dt;
  if (r.t < 30) return;
  r.t = 0;
  const st = stageFor(game.year);
  const ready = game.tutorialStep >= game.shop.tutorialCount && (game.stats.served || 0) > game.shop.tutorialCount && !game.events.pending;
  if (st.from !== r.stage && ready) { r.stage = st.from; r.strength = Math.max(r.strength, st.base); queueMove(game, 'oppnar', st); return; }
  const target = Math.max(0.05, Math.min(0.9, st.base + 0.15 - 0.02 * game.rykte - 0.012 * (game.fitStats?.drag || 0) - 0.05 * (game.staff?.length || 0)));
  r.strength = Math.max(0, Math.min(1, r.strength + (target - r.strength) * 0.15));
  if (ready && game.year - r.lastMove >= 2 && Math.random() < 0.5) queueMove(game, null, st);
}
function queueMove(game, kind, st) {
  const year = game.year, name = st.name;
  const moves = kind ? [kind] : ['priskrig', 'reklam', ...(game.staff?.length ? ['varvning'] : [])];
  const m = moves[Math.floor(Math.random() * moves.length)];
  const id = `rival:${m}:${year}`;
  if (game.events.seen.includes(id)) return;
  let ev = null;
  if (m === 'oppnar') ev = { id, year, dur: 1, icon: '🏬', title: `${name} öppnar`, text: `${st.desc} Kunderna får ett alternativ – och du får en anledning att vara bättre.`, choices: [
    { id: 'kampanj', label: 'Möt dem med en kampanj (2 000 kr)', cost: 2000, effect: { spawn: 1.2, stars: 3 }, text: 'Flygblad i hela kvarteret: "Vi bygger – de bara säljer."' },
    { id: 'ok', label: 'Låt dem komma', text: 'Du fortsätter som vanligt och håller ett öga på dem.' }] };
  else if (m === 'priskrig') ev = { id, year, dur: 1, icon: '💥', title: `${name} startar priskrig`, text: `${name} sänker priserna på allt. Kunderna jämför – och några går över gatan.`, choices: [
    { id: 'matcha', label: 'Matcha priserna (−150 kr per jobb i år)', effect: { bonus: -150, spawn: 1.15 }, text: 'Marginalerna krymper, men kunderna stannar.' },
    { id: 'sta', label: 'Stå fast vid priset – satsa på service', effect: { stars: 3, spawn: 0.85 }, text: 'Några går över gatan. De som stannar berättar om dig.' }] };
  else if (m === 'reklam') ev = { id, year, dur: 1, icon: '📺', title: `${name} kör reklam`, text: `${name} syns överallt – i tidningen, på bussarna, på TV. Din butik försvinner i bruset.`, choices: [
    { id: 'egen', label: 'Egen kampanj (3 000 kr)', cost: 3000, effect: { spawn: 1.05 }, text: 'Du hörs igen.' },
    { id: 'ignorera', label: 'Ignorera dem', effect: { spawn: 0.75 }, text: 'Det blir tyst i butiken ett tag.' }] };
  else if (m === 'varvning') {
    const s = game.staff[Math.floor(Math.random() * game.staff.length)], first = s.name.split(' ')[0], raise = Math.round(s.lon * 0.15 / 50) * 50;
    ev = { id, year, dur: 1, icon: '🕵️', title: `${name} försöker värva ${first}`, text: `${name} har ringt ${first} och erbjudit mer i lön. ${first} vill veta vad du säger.`, choices: [
      { id: 'hoj', label: `Höj lönen 15 % (${fmt(raise)} kr mer i månaden)`, effect: { staffRaise: s.id }, text: `${first} stannar – med ett leende.` },
      { id: 'lat', label: 'Låt hen gå', effect: { staffQuit: s.id }, text: `${s.name} tar sina verktyg och går över gatan.` }] };
  }
  if (!ev) return;
  game.rival.lastMove = year;
  (game.events.dyn ||= {})[id] = ev;
  game.events.pending = id; game._shownEvent = id;
  game.save(); game.emit('event', ev);
}
