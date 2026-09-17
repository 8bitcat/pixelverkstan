// Pixelverkstan – startpunkt: meny, skärmbyten och spelloop.
import { SHOPS } from './shops/index.js';
import { Game, fmt, readSave, saveKeyFor } from './core/game.js';
import { Floor } from './core/floor.js';
import { BuildView } from './core/build.js';
import * as UI from './core/ui.js';

const $ = (s) => document.querySelector(s);
let game = null, floor = null, build = null, screen = 'menu', hudDirty = true;

function show(name) {
  screen = name;
  for (const id of ['menu', 'shop', 'build']) $('#' + id).classList.toggle('hidden', id !== name);
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
const hasAnySave = () => store.keys().some((k) => /^pixelverkstan_[a-z]+(_\d+)?$/.test(k) && k !== 'pixelverkstan_mode');

function renderMenu() {
  migrateSaves();
  $('#menu').innerHTML = `<div class="menu-card">
    <h1>Pixel<span class="r">verkstan</span></h1>
    <p class="sub">Ta emot beställningar, bygg ihop dem i verkstaden och lär dig hur saker fungerar på riktigt.</p>
    <div class="shop-pick">${SHOPS.map((s) => `<button class="shop-opt ${s.module ? '' : 'locked'}" data-shop="${s.id}">
      <div class="ic">${s.icon}</div><b>${s.name}</b><small>${s.desc}</small></button>`).join('')}</div>
    <div class="menu-foot">${hasAnySave() ? '<span>💾 Varje startår sparas för sig – välj år när du öppnar butiken.</span><button class="btn btn-small" id="reset">Radera alla sparningar</button>' : '<span>Tips: Börja med datorbutiken – första kunderna visar hur man gör.</span>'}</div>
  </div>`;
  $('#menu').querySelectorAll('[data-shop]').forEach((b) => (b.onclick = () => {
    const s = SHOPS.find((x) => x.id === b.dataset.shop);
    if (!s.module) { UI.toast(`${s.name} kommer snart!`); return; }
    const qYear = +new URLSearchParams(location.search).get('year');   // för tester: ?year=1990
    if (!s.module.startYears) start(s.module);
    else if (qYear) start(s.module, { fresh: true, startYear: qYear, slot: qYear });
    else chooseStartYear(s.module);
  }));
  const r = $('#reset');
  if (r) r.onclick = () => {
    UI.openModal('Radera alla sparningar?', '<p style="font-size:18px">Alla butiker och alla startår nollställs – pengar, lager och årtal. Säker?</p>', [
      { label: 'Avbryt', onClick: UI.closeModal },
      { label: 'Ja, radera allt', cls: 'btn-red', onClick: () => { for (const k of store.keys()) if (k.startsWith('pixelverkstan_') && k !== 'pixelverkstan_mode') store.del(k); UI.closeModal(); renderMenu(); } },
    ]);
  };
}

async function start(shopModule, opts = {}) {
  if (shopModule.init) { UI.toast('Laddar delar …'); await shopModule.init(); }
  game = new Game(shopModule, opts);
  floor = new Floor($('#floor'), game);
  build = new BuildView(game, {
    onExit: () => show('shop'),
    onDone: (order, result) => {
      const payout = game.complete(order, result);
      build.order = null;
      show('shop');
      UI.showResult(order, payout, result);
    },
  });
  game.on((type, data) => {
    if (type === 'change') hudDirty = true;
    if (type === 'toast') UI.toast(data.text, data.kind);
    if (type === 'levelup') setTimeout(() => UI.showLevelUp(game, data), 900);
  });
  floor.onShowcaseClick = (what) => { if (!UI.modalOpen()) UI.openShowcase(game, what); };
  floor.onCustomerClick = (c) => {
    if (!floor.clickable(c) || UI.modalOpen()) return;
    UI.openOrderDialog(game, c, {
      onAccept: (cust) => {
        const o = game.accept(cust);
        if (!o) return;
        if (o.tutorial !== undefined) { openBuild(o); }
        else UI.toast('Beställningen är mottagen – tryck på 🔧 Bygg när du är redo.', 'good');
      },
      onDecline: (cust) => game.decline(cust),
      onShop: (cat, back) => UI.openShop(game, cat, back),
    });
  };
  show('shop');
}

function chooseStartYear(mod) {
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
  const dlg = UI.openModal('📅 Välj startår', body, [{ label: '← Till menyn', onClick: UI.closeModal }]);
  dlg.classList.add('dlg-wide');
  dlg.querySelectorAll('[data-year]').forEach((b) => (b.onclick = () => {
    const y = +b.dataset.year, sv = readSave(mod.id, y, mod.lastYear);
    UI.closeModal();
    store.set('pixelverkstan_last_' + mod.id, y);
    start(mod, sv ? { slot: y, startYear: y } : { fresh: true, startYear: y, slot: y });
  }));
  dlg.querySelectorAll('[data-reset]').forEach((b) => (b.onclick = () => {
    const y = +b.dataset.reset;
    UI.openModal(`Börja om från ${y}?`, `<p style="font-size:18px">Spelet som startade ${y} nollställs – pengar, lager och årtal. De andra startåren påverkas inte.</p>`, [
      { label: 'Avbryt', onClick: () => { UI.closeModal(); chooseStartYear(mod); } },
      { label: 'Ja, börja om', cls: 'btn-red', onClick: () => { store.del(saveKeyFor(mod.id, y)); UI.closeModal(); chooseStartYear(mod); } },
    ]);
  }));
}

function openBuild(order) {
  if (!game.orders.includes(order)) return;
  show('build');
  build.open(order);
}

const hudHandlers = {
  shop: () => UI.openShop(game),
  menu: () => { game.save(); build.order = null; renderMenu(); show('menu'); },
};

// ---------- Loop ----------
let last = performance.now(), ordersTimer = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game && screen !== 'menu') {
    game.update(dt, { shopVisible: screen === 'shop' && !UI.modalOpen() });
    floor.update(dt);
    // kunden gav upp medan vi byggde
    if (screen === 'build' && build.order && !game.orders.includes(build.order)) { build.order = null; show('shop'); }
    if (screen === 'shop') {
      floor.draw();
      ordersTimer -= dt;
      if (hudDirty) { UI.renderHud(game, hudHandlers); hudDirty = false; }
      if (ordersTimer <= 0) { UI.renderOrders(game, openBuild); ordersTimer = 0.5; }
    }
    if (screen === 'build') build.frame(dt);
  }
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => { if (floor) floor.resize(); if (build && screen === 'build') build.resize(); });
window.addEventListener('beforeunload', () => game?.save());
document.fonts?.ready.then(() => { hudDirty = true; });

renderMenu();
requestAnimationFrame(loop);

// för test/felsökning
window.PV = { get game() { return game; }, get build() { return build; }, get floor() { return floor; }, openBuild, fmt };
