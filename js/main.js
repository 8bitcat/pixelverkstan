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

const $ = (s) => document.querySelector(s);
const esc = UI.esc;
let game = null, floor = null, build = null, screen = 'menu', hudDirty = true;
let net = null, coop = null, lobbyPlayers = [];

// avataren (js/core/avatar.js) laddas om den finns
let AV = null;
const avatarReady = import('./core/avatar.js').then((m) => (AV = m)).catch(() => null);
function myAvatar() {
  const av = AV?.loadAvatar?.() || { name: '', look: SHOPKEEPER, color: '#7ee8fa' };
  return { name: av.name || 'Du', look: av.look || SHOPKEEPER, color: myColor || av.color || '#7ee8fa' };
}
let myColor = null;   // färgen värden gav oss i co-op

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
  for (const id of ['menu', 'shop', 'build', 'lobby']) $('#' + id)?.classList.toggle('hidden', id !== name);
  if (name === 'shop') { floor.resize(); hudDirty = true; }
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
    if (!AV?.openAvatarEditor) return UI.toast('Avatarredigeraren laddas …');
    AV.openAvatarEditor({ onDone: () => renderMenu() });
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
  onHostLeft: () => { UI.toast('Värden stängde butiken.', 'bad'); endCoop(); },
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
    if (type === 'change') { hudDirty = true; queueRefresh(); }
    if (coop instanceof CoopHost && coop.onGameEvent(type, data) === false) return;
    if (type === 'toast') UI.toast(data.text, data.kind);
    if (type === 'levelup') setTimeout(() => UI.showLevelUp(game, data), 900);
    if (type === 'delivery') floor.spawnVan();
  });
  floor.onBoxClick = (d) => { if (!UI.modalOpen()) UI.openDelivery(game, d); };
  floor.onShowcaseClick = (what) => { if (!UI.modalOpen()) UI.openShowcase(game, what); };
  floor.onCustomerClick = (c) => {
    if (!floor.clickable(c) || UI.modalOpen()) return;
    UI.openOrderDialog(game, c, {
      onAccept: (cust) => {
        const id = act('accept', { customerId: cust.id });
        if (coop instanceof CoopClient) { UI.toast('Beställningen är mottagen – den dyker upp i listan.', 'good'); return; }
        const o = game.orders.find((x) => x.id === id);
        if (!o) return;
        if (o.tutorial !== undefined) { openBuild(o); }
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
}

// klient i co-op: spelet speglar värdens
async function startMirror(m) {
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
  UI.toast(`👥 Du är med i butiken (rum ${net.code})!`, 'good');
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
  stock: () => UI.openStock(game),
  room: () => openRoomInfo(),
  menu: () => {
    if (coop) {
      UI.openModal('Lämna butiken?', `<p style="font-size:18px">${coop instanceof CoopHost ? 'Du är värd – om du går till menyn stängs butiken för alla. Spelet sparas.' : 'Du lämnar din kompis butik.'}</p>`, [
        { label: 'Stanna', onClick: UI.closeModal },
        { label: coop instanceof CoopHost ? 'Stäng butiken' : 'Lämna', cls: 'btn-red', onClick: () => { UI.closeModal(); endCoop(); } },
      ]);
      return;
    }
    game.save(); build.order = null; renderMenu(); show('menu');
  },
};

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
    chooseStartYear(mod, (opts) => hostRoom(mod, opts), '👥 Vilket spel vill ni köra?');
  };
  dlg.querySelector('#c-join').onclick = () => joinRoom(code.value);
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
  lobbyState.connecting = false;
  const av = myAvatar();
  net.send({ t: 'hello', name: av.name, look: av.look, color: av.color });
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
  if (coop instanceof CoopHost) game?.save();
  net?.close();
  net = null; coop = null; lobbyState = null; lobbyPlayers = []; myColor = null;
  if (build) build.order = null;
  if (floor) floor.players = floor.players.filter((p) => p.local);
  game = null; floor = null; build = null;
  UI.closeModal();
  renderMenu(); show('menu');
}

// ---------- Loop ----------
let last = performance.now(), ordersTimer = 0;
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
  }
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => { if (floor) floor.resize(); if (build && screen === 'build') build.resize(); });
window.addEventListener('beforeunload', () => { if (!(coop instanceof CoopClient)) game?.save(); });
document.fonts?.ready.then(() => { hudDirty = true; });

renderMenu().then(() => {
  // inbjudningslänk: ?rum=ABCD
  const room = cleanCode(new URLSearchParams(location.search).get('rum'));
  if (room.length === 4) joinRoom(room);
});
requestAnimationFrame(loop);

// för test/felsökning
window.PV = { get game() { return game; }, get build() { return build; }, get floor() { return floor; }, get net() { return net; }, get coop() { return coop; }, openBuild, fmt };
