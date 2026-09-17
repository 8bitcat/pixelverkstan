// Pixelverkstan – startpunkt: meny, skärmbyten och spelloop.
import { SHOPS } from './shops/index.js';
import { Game, fmt } from './core/game.js';
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

function renderMenu() {
  const saves = SHOPS.filter((s) => s.module).map((s) => { try { return localStorage.getItem('pixelverkstan_' + s.id); } catch { return null; } });
  $('#menu').innerHTML = `<div class="menu-card">
    <h1>Pixel<span class="r">verkstan</span></h1>
    <p class="sub">Ta emot beställningar, bygg ihop dem i verkstaden och lär dig hur saker fungerar på riktigt.</p>
    <div class="shop-pick">${SHOPS.map((s) => `<button class="shop-opt ${s.module ? '' : 'locked'}" data-shop="${s.id}">
      <div class="ic">${s.icon}</div><b>${s.name}</b><small>${s.desc}</small></button>`).join('')}</div>
    <div class="menu-foot">${saves.some(Boolean) ? '<span>💾 Ditt spel sparas automatiskt.</span><button class="btn btn-small" id="reset">Börja om från noll</button>' : '<span>Tips: Börja med datorbutiken – första kunderna visar hur man gör.</span>'}</div>
  </div>`;
  $('#menu').querySelectorAll('[data-shop]').forEach((b) => (b.onclick = () => {
    const s = SHOPS.find((x) => x.id === b.dataset.shop);
    if (!s.module) { UI.toast(`${s.name} kommer snart!`); return; }
    const hasSave = (() => { try { return !!localStorage.getItem('pixelverkstan_' + s.id); } catch { return false; } })();
    const qYear = +new URLSearchParams(location.search).get('year');   // för tester: ?year=1990
    if (hasSave || !s.module.startYears) start(s.module);
    else if (qYear) start(s.module, { fresh: true, startYear: qYear });
    else chooseStartYear(s.module);
  }));
  const r = $('#reset');
  if (r) r.onclick = () => {
    UI.openModal('Börja om?', '<p style="font-size:18px">Pengar, lager och nivå nollställs. Säker?</p>', [
      { label: 'Avbryt', onClick: UI.closeModal },
      { label: 'Ja, börja om', cls: 'btn-red', onClick: () => { for (const s of SHOPS) try { localStorage.removeItem('pixelverkstan_' + s.id); } catch {} UI.closeModal(); renderMenu(); } },
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
  const body = `<p style="font-size:20px;margin-top:0">Vilket år öppnar du butiken? Åren går framåt när du bygger datorer – och grossisten säljer bara delar som fanns just då.</p>
    <div class="plist">${mod.startYears.map((y) => `<button class="shop-opt" data-year="${y.year}" style="width:100%"><b>${y.year} – ${y.title}</b><small>${y.desc}</small></button>`).join('')}</div>`;
  const dlg = UI.openModal('📅 Välj startår', body, [{ label: 'Avbryt', onClick: UI.closeModal }]);
  dlg.querySelectorAll('[data-year]').forEach((b) => (b.onclick = () => { UI.closeModal(); start(mod, { fresh: true, startYear: +b.dataset.year }); }));
}

function openBuild(order) {
  if (!game.orders.includes(order)) return;
  show('build');
  build.open(order);
}

const hudHandlers = {
  shop: () => UI.openShop(game),
  menu: () => { game.save(); renderMenu(); show('menu'); },
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
