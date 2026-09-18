// Pixelverkstan – startpunkt: meny, lobby, skärmbyten och spelloop.
import { SHOPS } from './shops/index.js';
import { Game, fmt, readSave, saveKeyFor } from './core/game.js';
import { Floor } from './core/floor.js';
import { BuildView } from './core/build.js';
import * as UI from './core/ui.js';
import { runCommand } from './core/session.js';
import { SPOTS as WALK_SPOTS } from './core/floor-walk.js';
import { SHOPKEEPER, portrait } from './core/people.js';
import { Net, cleanCode } from './core/net.js';
import { CoopHost, CoopClient, applyEcon } from './core/coop.js';
import { Play } from './games/runtime.js';
import { ArcadeRoom } from './core/arcade-room.js';

const $ = (s) => document.querySelector(s);
const esc = UI.esc;
let game = null, floor = null, build = null, arcade = null, screen = 'menu', hudDirty = true;
let playFrom = 'shop';   // vart man kommer tillbaka efter ett spel
let net = null, coop = null, lobbyPlayers = [];
// minispelen (arkadmaskiner och speldatorn)
const play = new Play({
  onExit: (r) => { if (screen === 'play') show(playFrom); if (r.score > 0) UI.toast(`🕹️ ${r.score} poäng!`, 'good'); },
  onScore: (product, score, record) => { if (record) UI.toast(`🏆 Nytt rekord på ${product.name}: ${score}!`, 'good'); },
  playerName: () => myAvatar().name,
});
function startPlay(opts) { playFrom = screen === 'arcade' ? 'arcade' : 'shop'; show('play'); play.open(opts); }
function openArcade() {
  if (!game?.hasArcadeRoom) return UI.toast('Arkadrummet hör till Datorhuset – bygg ut under 🏪 Butiken.', '');
  arcade ||= new ArcadeRoom($('#arcade-canvas'), game, {
    avatar: () => myAvatar(),
    onPlay: (p) => startPlay({ mode: 'arcade', product: p, engine: p.attract, title: p.name, skin: { title: p.name, dive: p.id === 'a-galaga' } }),
    onExit: () => show('shop'),
  });
  arcade.game = game;
  show('arcade');
  const n = (game.fit.arcade || []).length;
  $('#arcade-sub').textContent = `${n} ${n === 1 ? 'maskin' : 'maskiner'} · ${fmt(game.arcadeEarned || 0)} kr i myntinkast hittills · klicka på ett skåp för att spela`;
}
$('#arcade-back').onclick = () => show('shop');
$('#arcade-buy').onclick = () => UI.openFittings(game, 'arkad');

// avataren (js/core/avatar.js) laddas om den finns
let AV = null;
const avatarReady = import('./core/avatar.js').then((m) => (AV = m)).catch(() => null);
function myAvatar() {
  const av = AV?.loadAvatar?.() || { name: '', look: SHOPKEEPER, color: '#7ee8fa' };
  return { name: av.name || 'Du', look: av.look || SHOPKEEPER, color: myColor || av.color || '#7ee8fa' };
}
let myColor = null;   // färgen värden gav oss i co-op
// en fast id per webbläsare, så att en omladdning ersätter den gamla anslutningen
const PID = (() => { try { let v = localStorage.getItem('pixelverkstan_pid'); if (!v) { v = Math.random().toString(36).slice(2, 10); localStorage.setItem('pixelverkstan_pid', v); } return v; } catch { return Math.random().toString(36).slice(2, 10); } })();
// i co-op väljer man alltid vem man är (sparad avatar eller en ny) – annars heter alla "Du"
function requireName(then, text = 'Välj din avatar innan ni spelar tillsammans – så ser kompisarna vem du är.') {
  if (!AV?.openAvatarPicker) return then();
  AV.openAvatarPicker({ title: '🧑 Vem spelar?', text, onPick: () => then() });
}

// Alla ändringar av spelet går via act() (i co-op skickas de till värden)
function act(name, args = {}) {
  if (coop instanceof CoopClient) return coop.act(name, args);
  const r = runCommand(game, name, args, 'me');
  if (coop instanceof CoopHost) { coop.econDirty = true; coop.ordersDirty = true; }
  return r;
}
UI.setAct((name, args) => act(name, args));
let refreshQueued = false;
function queueRefresh() { if (refreshQueued) return; refreshQueued = true; requestAnimationFrame(() => { refreshQueued = false; UI.refreshOpen(); }); }

function show(name) {
  screen = name;
  document.body.dataset.screen = name;
  for (const id of ['menu', 'shop', 'build', 'lobby', 'play', 'arcade']) $('#' + id)?.classList.toggle('hidden', id !== name);
  if (name === 'shop') { floor.resize(); hudDirty = true; }
  if (name === 'play') requestAnimationFrame(() => play.resize());
  if (name === 'arcade') requestAnimationFrame(() => arcade?.resize());
  if (name === 'build') requestAnimationFrame(() => build.resize());
}

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
  keys: () => { try { return Object.keys(localStorage); } catch { return []; } },
};
// Äldre sparning (en per butik) flyttas till sitt startårs plats
function migrateSaves() {
  for (const s of SHOPS.filter((x) => x.module?.startYears)) {
    const old = readSave(s.id, null);
    if (!old) continue;
    const slot = old.startYear ?? 2021;
    if (!store.get(saveKeyFor(s.id, slot))) store.set(saveKeyFor(s.id, slot), store.get(saveKeyFor(s.id, null)));
    store.del(saveKeyFor(s.id, null));
  }
}
// spelsparningar: pixelverkstan_<butik>[_<startår>] (inte avatar, läge eller senaste år)
const SAVE_RE = new RegExp(`^pixelverkstan_(${SHOPS.map((s) => s.id).join('|')})(_[0-9]+)?$`);
const hasAnySave = () => store.keys().some((k) => SAVE_RE.test(k));
const mainShop = () => SHOPS.find((s) => s.module)?.module;

// ---------- Meny ----------
async function renderMenu() {
  migrateSaves();
  await avatarReady;
  const av = myAvatar();
  $('#menu').innerHTML = `<div class="menu-card">
    <h1>Pixel<span class="r">verkstan</span></h1>
    <p class="sub">Ta emot beställningar, bygg ihop dem i verkstaden och lär dig hur saker fungerar på riktigt.</p>
    <div class="shop-pick">${SHOPS.map((s) => `<button class="shop-opt ${s.module ? '' : 'locked'}" data-shop="${s.id}">
      <div class="ic">${s.icon}</div><b>${s.name}</b><small>${s.desc}</small></button>`).join('')}</div>
    <div class="menu-row">
      <button class="btn menu-avatar" id="m-avatar"><span data-face></span><span><b>${AV?.loadAvatar?.().name ? esc(av.name) : 'Skapa din avatar!'}</b><small>👤 Min avatar</small></span></button>
      <button class="btn btn-go" id="m-coop">👥 Spela tillsammans</button>
    </div>
    <div class="menu-foot">${hasAnySave() ? '<span>💾 Varje startår sparas för sig – välj år när du öppnar butiken.</span><button class="btn btn-small" id="reset">Radera alla sparningar</button>' : '<span>Tips: Börja med datorbutiken – första kunderna visar hur man gör.</span>'}</div>
  </div>`;
  $('#menu [data-face]').replaceWith(portrait(av.look));
  $('#menu').querySelectorAll('[data-shop]').forEach((b) => (b.onclick = () => {
    const s = SHOPS.find((x) => x.id === b.dataset.shop);
    if (!s.module) { UI.toast(`${s.name} kommer snart!`); return; }
    const qYear = +new URLSearchParams(location.search).get('year');   // för tester: ?year=1990
    if (!s.module.startYears) start(s.module);
    else if (qYear) start(s.module, { fresh: true, startYear: qYear, slot: qYear });
    else chooseStartYear(s.module, (opts) => start(s.module, opts));
  }));
  $('#m-avatar').onclick = () => {
    if (!AV?.openAvatarPicker) return UI.toast('Avatarredigeraren laddas …');
    AV.openAvatarPicker({ title: '🧑 Mina avatarer', text: 'Välj vem som spelar, ändra en avatar eller skapa en ny.', onPick: () => renderMenu(), onCancel: () => renderMenu() });
  };
  $('#m-coop').onclick = () => openCoopMenu();
  const r = $('#reset');
  if (r) r.onclick = () => {
    UI.openModal('Radera alla sparningar?', '<p style="font-size:18px">Alla butiker och alla startår nollställs – pengar, lager och årtal. Säker?</p>', [
      { label: 'Avbryt', onClick: UI.closeModal },
      { label: 'Ja, radera allt', cls: 'btn-red', onClick: () => { for (const k of store.keys()) if (SAVE_RE.test(k)) store.del(k); UI.closeModal(); renderMenu(); } },
    ]);
  };
}

function chooseStartYear(mod, onPick, title = '📅 Välj startår') {
  migrateSaves();
  const last = +store.get('pixelverkstan_last_' + mod.id);
  const rows = mod.startYears.map((y) => {
    const sv = readSave(mod.id, y.year, mod.lastYear);
    const info = sv
      ? `<span class="slot-save">▶ Fortsätt · nu år <span class="slot-year">${sv.year}</span> · ${fmt(sv.money)} kr · ${sv.served} ${sv.served === 1 ? 'dator' : 'datorer'}${last === y.year ? ' · ⭐ senast' : ''}</span>`
      : '<span class="slot-new">✚ Nytt spel</span>';
    return `<div class="year-row"><button class="shop-opt ${sv ? 'has-save' : ''}" data-year="${y.year}"><b>${y.year} – ${y.title}</b><small>${y.desc}</small>${info}</button>
      ${sv ? `<button class="btn btn-small" data-reset="${y.year}" title="Börja om från ${y.year}">↺ Börja om</button>` : ''}</div>`;
  }).join('');
  const body = `<p style="font-size:20px;margin-top:0">Vilket år öppnar du butiken? Åren går framåt när du bygger datorer – och grossisten säljer bara delar som fanns just då. Varje startår har en egen sparning.</p>
    <div class="plist">${rows}</div>`;
  const dlg = UI.openModal(title, body, [{ label: '← Till menyn', onClick: UI.closeModal }]);
  dlg.classList.add('dlg-wide');
  dlg.querySelectorAll('[data-year]').forEach((b) => (b.onclick = () => {
    const y = +b.dataset.year, sv = readSave(mod.id, y, mod.lastYear);
    UI.closeModal();
    store.set('pixelverkstan_last_' + mod.id, y);
    onPick(sv ? { slot: y, startYear: y } : { fresh: true, startYear: y, slot: y });
  }));
  dlg.querySelectorAll('[data-reset]').forEach((b) => (b.onclick = () => {
    const y = +b.dataset.reset;
    UI.openModal(`Börja om från ${y}?`, `<p style="font-size:18px">Spelet som startade ${y} nollställs – pengar, lager och årtal. De andra startåren påverkas inte.</p>`, [
      { label: 'Avbryt', onClick: () => { UI.closeModal(); chooseStartYear(mod, onPick, title); } },
      { label: 'Ja, börja om', cls: 'btn-red', onClick: () => { store.del(saveKeyFor(mod.id, y)); UI.closeModal(); chooseStartYear(mod, onPick, title); } },
    ]);
  }));
}

// ---------- Spelet ----------
const app = {
  get game() { return game; }, get floor() { return floor; }, get build() { return build; },
  me: () => myAvatar(),
  toast: (text, kind) => UI.toast(text, kind),
  // avatarer från nätet kontrolleras innan de används
  clean: (p) => (AV?.cleanAvatar ? { ...p, ...AV.cleanAvatar(p) } : p),
  onPlayers: (list) => { lobbyPlayers = list; if (screen === 'lobby') renderLobby(); hudDirty = true; },
  onWelcome: (m) => startMirror(m),
  onEvent: (type, data) => { if (type === 'delivery') floor?.spawnVan(); if (type === 'levelup') setTimeout(() => UI.showLevelUp(game, data), 900); },
  onChat: (from, text) => showChat(from, text),
  onHostLeft: (why) => { UI.toast(why === 'lost' ? 'Tappade kontakten med värden.' : 'Värden stängde butiken.', 'bad'); endCoop(); },
};

function setupGame(shopModule, opts) {
  game = new Game(shopModule, opts);
  floor = new Floor($('#floor'), game);
  const av = myAvatar();
  floor.players = [{ id: 'me', local: true, name: av.name, look: av.look, color: av.color, x: WALK_SPOTS.home[0], y: WALK_SPOTS.home[1], dir: 'down', seed: Math.random() * 6 }];
  build = new BuildView(game, {
    act,
    onOp: (order, op) => { if (coop instanceof CoopHost) coop.localOp(order, op); else if (coop) coop.op(order, op); },
    onCursor: (data) => { if (coop instanceof CoopHost) coop.localCursor(data); else if (coop) coop.cursor(data); },
    onExit: () => { leaveWorkshop(); show('shop'); },
    onDone: (order, result) => {
      const payout = act('complete', { orderId: order.id, result });
      build.order = null;
      leaveWorkshop();
      show('shop');
      if (payout) UI.showResult(order, payout, result);
      else if (coop instanceof CoopClient) UI.toast(`📦 Datorn är klar – ${order.name} hämtar den vid utlämningen!`, 'good');
    },
  });
  game.on((type, data) => {
    if (type === 'change' || type === 'fit') { hudDirty = true; queueRefresh(); }
    if (coop instanceof CoopHost && coop.onGameEvent(type, data) === false) return;
    if (type === 'toast') UI.toast(data.text, data.kind);
    if (type === 'levelup') setTimeout(() => UI.showLevelUp(game, data), 900);
    if (type === 'delivery') floor.spawnVan();
    if (type === 'event') setTimeout(() => UI.openEvent(game, data), 1500);
    if (type === 'review') setTimeout(() => UI.showReview(game, data), 600);
  });
  floor.onBoxClick = (d) => { if (!UI.modalOpen()) UI.openDelivery(game, d); };
  floor.onShowcaseClick = (what) => {
    if (UI.modalOpen()) return;
    if (what.empty) return UI.openFittings(game, 'platser', what.slot);
    if (what.closed) { UI.toast('Den här delen av lokalen är stängd – bygg ut butiken under 🏪 Butiken.', ''); return UI.openFittings(game, 'lager'); }
    if (what.unit === 'tv') {
      const cons = floor.units[what.slot]?.shownCons || [];
      return UI.openTvMenu(game, cons, (g, con) => startPlay({ mode: 'console', product: g, console: con, engine: g.engine, title: g.name, skin: { title: g.name } }));
    }
    if (what.unit === 'spelhylla') return UI.openShowcase(game, { cats: ['spel'], title: 'Spelhyllan' });
    if (what.unit === 'arkad') {
      const p = game.shop.part[game.fit.slots[what.slot]?.product];
      if (!p) return;
      return startPlay({ mode: 'arcade', product: p, engine: p.attract, title: p.name, skin: { title: p.name, dive: p.id === 'a-galaga' } });
    }
    if (what.unit === 'spelbord') {
      const openMenu = () => UI.openPlayMenu(game, (g, m, ev) => startPlay({ mode: 'pc', product: g, engine: g.engine, title: g.name, skin: { title: g.name }, machine: { ...m, ...ev, year: g.year } }), () => UI.openDeskBuild(game, openMenu));
      if (!game.deskPc) return UI.openDeskBuild(game, openMenu);
      return openMenu();
    }
    if (what.unit) { UI.toast(what.unit === 'kaffe' ? '☕ Mmm, en kopp kaffe.' : '🍬 Nom nom.', 'good'); return; }
    UI.openShowcase(game, what);
  };
  floor.onCustomerClick = (c) => {
    if (!floor.clickable(c) || UI.modalOpen()) return;
    UI.openOrderDialog(game, c, {
      onAccept: (cust) => {
        const id = act('accept', { customerId: cust.id });
        if (coop instanceof CoopClient) { UI.toast('Beställningen är mottagen – den dyker upp i listan.', 'good'); return; }
        if (id === 'sale') { UI.toast(`💰 Sålt! ${cust.name} betalar vid utlämningen.`, 'good'); return; }
        const o = game.orders.find((x) => x.id === id);
        if (!o) return;
        if (o.tutorial !== undefined) { openBuild(o); }
        else if (o.repair) UI.toast('Datorn står på bänken i verkstaden – tryck på 🔍 Laga.', 'good');
        else UI.toast('Beställningen är mottagen – tryck på 🔧 Bygg när du är redo.', 'good');
      },
      onDecline: (cust) => act('decline', { customerId: cust.id }),
      onShop: (cat, back) => UI.openShop(game, cat, back),
    });
  };
}

async function start(shopModule, opts = {}) {
  if (shopModule.init) { UI.toast('Laddar delar …'); await shopModule.init(); }
  await avatarReady;
  setupGame(shopModule, opts);
  show('shop');
  if (coop instanceof CoopHost) coop.started();
  addBuildChatButton();
}

// klient i co-op: spelet speglar värdens
async function startMirror(m) {
  try { await startMirrorInner(m); } catch (e) {
    console.error(e);
    UI.toast('Kunde inte öppna butiken: ' + e.message, 'bad');
    net?.send({ t: 'err', msg: e.message });
  }
}
async function startMirrorInner(m) {
  const mod = SHOPS.find((s) => s.id === m.shop)?.module || mainShop();
  if (mod.init) { UI.toast('Laddar delar …'); await mod.init(); }
  await avatarReady;
  myColor = m.color || null;
  setupGame(mod, { mirror: true, startYear: m.startYear });
  floor.mirror = true;
  applyEcon(game, m.econ);
  coop.custFull(m.cust);
  coop.orders(m.orders);
  UI.closeModal();
  show('shop');
  addBuildChatButton();
  UI.toast(`👥 Du är med i butiken (rum ${net.code})! Tryck Enter eller 💬 för att chatta.`, 'good');
}

function openBuild(order) {
  if (!game.orders.includes(order)) return;
  const go = (o) => {
    if (!game.orders.includes(o)) return;
    // avataren går in i verkstaden
    const me = floor.localPlayer();
    if (me) { me.path = []; me.act = null; me.x = WALK_SPOTS.workshop[0]; me.y = WALK_SPOTS.workshop[1]; me.away = 'workshop'; me.orderId = o.id; }
    show('build');
    build.open(o);
  };
  if (coop instanceof CoopClient) coop.openBuild(order, go);
  else go(order);
}
function leaveWorkshop() {
  const me = floor?.localPlayer();
  if (me && me.away) { me.away = null; me.orderId = null; me.x = WALK_SPOTS.workshop[0]; me.y = WALK_SPOTS.workshop[1]; me.dir = 'left'; }
}

const hudHandlers = {
  shop: () => UI.openShop(game),
  fit: () => UI.openFittings(game),
  arcade: () => openArcade(),
  models: () => UI.openModels(game),
  news: () => UI.openNews(game),
  stock: () => UI.openStock(game),
  room: () => openRoomInfo(),
  chat: () => openChat(),
  menu: () => {
    if (coop) {
      UI.openModal('Lämna butiken?', `<p style="font-size:18px">${coop instanceof CoopHost ? 'Du är värd – om du går till menyn stängs butiken för alla. Spelet sparas.' : 'Du lämnar din kompis butik.'}</p>`, [
        { label: 'Stanna', onClick: UI.closeModal },
        { label: coop instanceof CoopHost ? 'Stäng butiken' : 'Lämna', cls: 'btn-red', onClick: () => { UI.closeModal(); endCoop(); } },
      ]);
      return;
    }
    game.save(); build.order = null; arcade = null; renderMenu(); show('menu');
  },
};

// ---------- Chatt ----------
function addBuildChatButton() {
  $('#build-chat')?.remove();
  if (!coop) return;
  const b = document.createElement('button');
  b.id = 'build-chat'; b.className = 'btn'; b.textContent = '💬'; b.title = 'Chatta (Enter)';
  b.onclick = () => openChat();
  $('#build-boot').before(b);
}
const coopPlayers = () => (coop instanceof CoopHost ? coop.playerList() : coop?.list || []);
function openChat() { if (coop) UI.openChatBar(sendChat); }
function sendChat(text) {
  text = String(text || '').trim().slice(0, 80);
  if (!text || !coop) return;
  if (coop instanceof CoopHost) net.broadcast({ t: 'chat', from: 'host', text });
  else net.send({ t: 'chat', text });
  showChat('me', text);
}
function showChat(from, text) {
  const mine = from === 'me' || (coop instanceof CoopClient && from === coop.you);
  const info = mine ? myAvatar() : coopPlayers().find((p) => p.id === from);
  const name = info?.name || 'Kompis', color = info?.color || '#7ee8fa';
  const pl = mine ? floor?.localPlayer() : floor?.players.find((p) => p.id === from);
  if (pl) pl.say = { text, until: performance.now() + 7000 };
  if (!mine) build?.chatCursor?.(from, text);
  UI.chatLog(name, color, text);
}
document.addEventListener('keydown', (e) => {
  if (!coop || e.key !== 'Enter' || UI.modalOpen() || UI.chatBarOpen() || screen === 'play') return;
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
  e.preventDefault();
  openChat();
});

// ---------- Kompisar som bygger ----------
const friendAt = new Map();   // spelare → beställningen de byggde senast
function updateFriendBuilds() {
  const box = $('#friendbuilds');
  if (!coop || !floor || !game || (screen !== 'shop' && screen !== 'build')) { if (box.innerHTML) { box.innerHTML = ''; box.dataset.key = ''; } return; }
  box.classList.toggle('in-build', screen === 'build');
  const groups = new Map();
  for (const p of floor.players) {
    if (p.local || p.away !== 'workshop' || !p.orderId) {
      if (!p.local) friendAt.delete(p.id);
      continue;
    }
    const order = game.orders.find((o) => o.id === p.orderId);
    if (!order) continue;
    if (friendAt.get(p.id) !== order.id) {
      friendAt.set(p.id, order.id);
      if (!(screen === 'build' && build.order === order)) UI.toast(`🔧 ${p.name} började bygga ${order.title.toLowerCase()} – tryck på Bygg med för att hjälpa till!`, 'good');
    }
    const g = groups.get(order.id) || { order, names: [], color: p.color, mine: screen === 'build' && build.order === order };
    g.names.push(p.name);
    groups.set(order.id, g);
  }
  UI.renderFriendBuilds([...groups.values()], (order) => {
    if (screen === 'build') { leaveWorkshop(); build.order = null; }
    openBuild(order);
  });
}

// ---------- Co-op: lobby ----------
function openCoopMenu() {
  const body = `<p style="font-size:19px;margin-top:0">Driv butiken ihop med kompisar: ta emot kunder, packa upp lådor och bygg datorer tillsammans – ni ser varandras muspekare i verkstaden.</p>
    <div class="coop-pick">
      <div class="coop-card"><b>🏠 Starta ett rum</b><small>Du blir värd. Butiken och sparningen är din – kompisarna går med med en kod.</small><button class="btn btn-go" id="c-host">Starta rum</button></div>
      <div class="coop-card"><b>🚪 Gå med</b><small>Skriv in koden din kompis fick.</small><input id="c-code" maxlength="4" placeholder="ABCD" autocomplete="off" autocapitalize="characters"><button class="btn btn-gold" id="c-join">Gå med</button></div>
    </div>`;
  const dlg = UI.openModal('👥 Spela tillsammans', body, [{ label: 'Stäng', onClick: UI.closeModal }]);
  dlg.classList.add('dlg-wide');
  const code = dlg.querySelector('#c-code');
  code.oninput = () => { code.value = cleanCode(code.value); };
  code.onkeydown = (e) => { if (e.key === 'Enter') dlg.querySelector('#c-join').click(); };
  dlg.querySelector('#c-host').onclick = () => {
    const mod = mainShop();
    UI.closeModal();
    requireName(() => chooseStartYear(mod, (opts) => hostRoom(mod, opts), '👥 Vilket spel vill ni köra?'));
  };
  dlg.querySelector('#c-join').onclick = () => {
    const c = cleanCode(code.value);
    if (c.length !== 4) return UI.toast('Rumskoden har fyra bokstäver.', 'bad');
    requireName(() => joinRoom(c));
  };
}

async function hostRoom(mod, opts) {
  await avatarReady;
  net = new Net();
  UI.toast('Skapar rum …');
  try { await net.host(); } catch (e) { UI.toast(e.message, 'bad'); net = null; return; }
  coop = new CoopHost(net, app);
  lobbyPlayers = coop.playerList();
  lobbyState = { host: true, mod, opts };
  show('lobby'); renderLobby();
}

async function joinRoom(raw) {
  const code = cleanCode(raw);
  if (code.length !== 4) return UI.toast('Rumskoden har fyra bokstäver.', 'bad');
  await avatarReady;
  UI.closeModal();
  net = new Net();
  coop = new CoopClient(net, app);
  lobbyState = { host: false, code, connecting: true };
  lobbyPlayers = [];
  show('lobby'); renderLobby();
  try { await net.join(code); } catch (e) { UI.toast(e.message, 'bad'); endCoop(); return; }
  // ta bort ?rum= så att en omladdning inte går med en gång till
  if (location.search.includes('rum=')) history.replaceState(null, '', location.pathname);
  lobbyState.connecting = false;
  const av = myAvatar();
  net.send({ t: 'hello', pid: PID, name: AV?.loadAvatar?.().name || '', look: av.look, color: av.color });
  renderLobby();
}

let lobbyState = null;
function renderLobby() {
  const L = lobbyState;
  if (!L) return;
  const code = net?.code || L.code || '····';
  const link = `${location.origin}${location.pathname}?rum=${code}`;
  const players = lobbyPlayers.length ? lobbyPlayers : [{ id: 'me', ...myAvatar(), host: L.host }];
  $('#lobby').innerHTML = `<div class="menu-card lobby-card">
    <h1>Lobby</h1>
    <p class="sub">${L.host ? 'Be kompisarna öppna Pixelverkstan, trycka på 👥 Spela tillsammans och skriva koden:' : L.connecting ? 'Ansluter till rummet …' : 'Du är med! Väntar på att värden öppnar butiken …'}</p>
    <div class="room-code">${code.split('').map((c) => `<span>${c}</span>`).join('')}</div>
    ${L.host ? `<div class="room-link"><input readonly value="${esc(link)}"><button class="btn btn-small" id="l-copy">📋 Kopiera länk</button></div>` : ''}
    <h3>Spelare (${players.length})</h3>
    <div class="lobby-players">${players.map((p) => `<div class="lobby-player" style="--pc:${esc(p.color || '#7ee8fa')}"><span data-look="${esc(p.id)}"></span><b>${esc(p.name)}</b><small>${p.host ? '👑 värd' : 'spelare'}</small></div>`).join('')}</div>
    <div class="menu-row">
      <button class="btn" id="l-leave">← Lämna</button>
      ${L.host ? `<button class="btn btn-go" id="l-start">▶ Öppna butiken</button>` : ''}
    </div>
  </div>`;
  $('#lobby').querySelectorAll('[data-look]').forEach((el) => { const p = players.find((x) => String(x.id) === el.dataset.look); el.replaceWith(portrait(p?.look || SHOPKEEPER)); });
  $('#l-leave').onclick = () => endCoop();
  const copy = $('#l-copy');
  if (copy) copy.onclick = () => { navigator.clipboard?.writeText(link).then(() => UI.toast('Länken är kopierad!', 'good'), () => {}); };
  const st = $('#l-start');
  if (st) st.onclick = () => { lobbyState = null; start(L.mod, L.opts); };
}

function openRoomInfo() {
  if (!coop) return;
  const list = coop instanceof CoopHost ? coop.playerList() : coop.list;
  const link = `${location.origin}${location.pathname}?rum=${net.code}`;
  const body = `<div class="room-code small">${net.code.split('').map((c) => `<span>${c}</span>`).join('')}</div>
    ${coop instanceof CoopHost ? `<div class="room-link"><input readonly value="${esc(link)}"><button class="btn btn-small" id="r-copy">📋 Kopiera länk</button></div>` : ''}
    <div class="lobby-players">${list.map((p) => `<div class="lobby-player" style="--pc:${esc(p.color || '#7ee8fa')}"><span data-look="${esc(p.id)}"></span><b>${esc(p.name)}</b><small>${p.host ? '👑 värd' : 'spelare'}</small></div>`).join('')}</div>`;
  const dlg = UI.openModal('👥 Rummet', body, [{ label: 'Stäng', onClick: UI.closeModal }]);
  dlg.querySelectorAll('[data-look]').forEach((el) => { const p = list.find((x) => String(x.id) === el.dataset.look); el.replaceWith(portrait(p?.look || SHOPKEEPER)); });
  const copy = dlg.querySelector('#r-copy');
  if (copy) copy.onclick = () => { navigator.clipboard?.writeText(link).then(() => UI.toast('Länken är kopierad!', 'good'), () => {}); };
}

function endCoop() {
  if (coop instanceof CoopHost) { game?.save(); net?.broadcast({ t: 'bye-host' }); }
  if (coop instanceof CoopClient) net?.send({ t: 'bye' });
  coop?.close?.();
  net?.close();
  net = null; coop = null; lobbyState = null; lobbyPlayers = []; myColor = null;
  if (build) build.order = null;
  if (floor) floor.players = floor.players.filter((p) => p.local);
  game = null; floor = null; build = null; arcade = null;
  UI.closeModal(); UI.closeChatBar();
  $('#friendbuilds').innerHTML = ''; $('#friendbuilds').dataset.key = '';
  friendAt.clear();
  $('#build-chat')?.remove();
  renderMenu(); show('menu');
}

// ---------- Loop ----------
let last = performance.now(), ordersTimer = 0, friendsTimer = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game && screen !== 'menu' && screen !== 'lobby') {
    game.update(dt, { shopVisible: screen === 'shop' && !UI.modalOpen() });
    floor.update(dt);
    coop?.update(dt);
    // beställningen försvann (kunden gav upp eller en kompis levererade)
    if (screen === 'build' && build.order && !game.orders.includes(build.order)) { build.order = null; leaveWorkshop(); show('shop'); }
    if (screen === 'shop') {
      floor.draw();
      ordersTimer -= dt;
      if (hudDirty) { UI.renderHud(game, hudHandlers, coop ? { code: net.code, count: (coop instanceof CoopHost ? coop.players.size + 1 : coop.list.length) } : null); hudDirty = false; }
      if (ordersTimer <= 0) { UI.renderOrders(game, openBuild, floor.players); ordersTimer = 0.5; }
    }
    if (screen === 'build') build.frame(dt);
    if (screen === 'play') { try { play.frame(dt); } catch (e) { console.error(e); } }
    if (screen === 'arcade' && arcade) { arcade.update(dt); arcade.draw(); }
    friendsTimer -= dt;
    if (friendsTimer <= 0) { updateFriendBuilds(); friendsTimer = 0.4; }
  }
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => { if (floor) floor.resize(); if (build && screen === 'build') build.resize(); if (screen === 'play') play.resize(); if (screen === 'arcade') arcade?.resize(); });
window.addEventListener('beforeunload', () => {
  if (!(coop instanceof CoopClient)) game?.save();
  if (coop instanceof CoopClient) net?.send({ t: 'bye' });
  if (coop instanceof CoopHost) net?.broadcast({ t: 'bye-host' });
});
document.fonts?.ready.then(() => { hudDirty = true; });

renderMenu().then(() => {
  // inbjudningslänk: ?rum=ABCD
  const room = cleanCode(new URLSearchParams(location.search).get('rum'));
  if (room.length === 4) requireName(() => joinRoom(room));
});
requestAnimationFrame(loop);

// för test/felsökning
window.PV = { get game() { return game; }, get build() { return build; }, get floor() { return floor; }, get net() { return net; }, get coop() { return coop; }, get play() { return play; }, openBuild, startPlay, fmt };
