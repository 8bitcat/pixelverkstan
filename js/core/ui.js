// DOM-gränssnitt: HUD, beställningskort, dialoger (kund, grossist, resultat).
import { portrait } from './people.js';
import { fmt } from './game.js';

const $ = (s) => document.querySelector(s);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Alla ändringar av spelet går via kommandon (i co-op skickas de till värden)
let act = null;
export function setAct(fn) { act = fn; }
// Öppen dialog som ska ritas om när spelet ändras (t.ex. när värden svarat)
let liveRefresh = null;
export function refreshOpen() { if (liveRefresh && modalOpen()) liveRefresh(); }
const live = (fn) => { liveRefresh = fn; };

export function toast(text, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind; el.textContent = text;
  $('#toasts').append(el);
  setTimeout(() => el.remove(), 3100);
}

// ---------- Chatt (co-op) ----------
export function chatLog(name, color, text) {
  const log = $('#chatlog');
  const el = document.createElement('div');
  el.className = 'chatline';
  el.innerHTML = `<b style="background:${esc(color || '#7ee8fa')}">${esc(name)}</b> ${esc(text)}`;
  log.append(el);
  while (log.children.length > 6) log.firstChild.remove();
  setTimeout(() => el.classList.add('old'), 14000);
  setTimeout(() => el.remove(), 15000);
}
export function openChatBar(onSend) {
  const bar = $('#chatbar'), input = $('#chat-input');
  bar.classList.remove('hidden');
  input.value = '';
  input.focus();
  const send = () => { const v = input.value.trim(); if (v) onSend(v); closeChatBar(); };
  $('#chat-send').onclick = send;
  input.onkeydown = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); send(); }
    if (e.key === 'Escape') closeChatBar();
  };
}
export function closeChatBar() { $('#chatbar').classList.add('hidden'); $('#chat-input').blur(); }
export const chatBarOpen = () => !$('#chatbar').classList.contains('hidden');

// Kompisar som bygger just nu → kort i hörnet med "Bygg med"
export function renderFriendBuilds(list, onJoin) {
  const box = $('#friendbuilds');
  const key = list.map((x) => `${x.order.id}:${x.names.join(',')}:${x.mine}`).join('|');
  if (box.dataset.key === key) return;
  box.dataset.key = key;
  box.innerHTML = '';
  for (const x of list) {
    const el = document.createElement('div');
    el.className = 'friendbuild';
    el.style.setProperty('--pc', x.color || '#7ee8fa');
    el.innerHTML = `<div><b>🔧 ${x.names.map(esc).join(' och ')} ${x.names.length > 1 ? 'bygger' : 'bygger'}</b><small>${esc(x.order.title)} åt ${esc(x.order.name)}</small></div>
      ${x.mine ? '<span class="fb-here">Du är med</span>' : '<button class="btn btn-go btn-small">Bygg med</button>'}`;
    el.querySelector('button')?.addEventListener('click', () => onJoin(x.order));
    box.append(el);
  }
}

// ---------- Modal ----------
export function openModal(title, bodyHtml, buttons = [], { closable = true } = {}) {
  const m = $('#modal');
  liveRefresh = null;
  const keepScroll = m.querySelector('.dlg')?.dataset.title === title ? m.querySelector('.dlg')?.scrollTop : 0;
  m.innerHTML = `<div class="dlg"><div class="dlg-head"><h2>${title}</h2>${closable ? '<button class="btn btn-small x" data-close>✕</button>' : ''}</div>
    <div class="dlg-body">${bodyHtml}</div><div class="dlg-foot"></div></div>`;
  const foot = m.querySelector('.dlg-foot');
  for (const b of buttons) {
    if (b.hidden) continue;
    const el = document.createElement('button');
    el.className = 'btn ' + (b.cls || ''); el.innerHTML = b.label; el.disabled = !!b.disabled;
    el.onclick = () => b.onClick?.();
    foot.append(el);
  }
  const x = m.querySelector('[data-close]');
  if (x) x.onclick = closeModal;
  m.onclick = (e) => { if (e.target === m && closable) closeModal(); };
  m.classList.remove('hidden');
  const dlg = m.querySelector('.dlg');
  dlg.dataset.title = title;
  if (keepScroll) dlg.scrollTop = keepScroll;
  return dlg;
}
export function closeModal() { liveRefresh = null; $('#modal').classList.add('hidden'); $('#modal').innerHTML = ''; }
export const modalOpen = () => !$('#modal').classList.contains('hidden');

// ---------- HUD ----------
export function renderHud(game, h, room = null) {
  const li = game.levelInfo();
  $('#hud').innerHTML = `
    <div class="chip money">💰 ${fmt(game.money)} kr</div>
    <div class="chip" title="${li.next ? `Nästa år: ${esc(li.next.title)}` : 'Nutid!'}">📅 ${li.year ?? li.level} <small style="font-family:var(--font);font-size:15px">${esc(li.era?.title || li.title)}</small> <span class="xpbar"><i style="width:${Math.round(li.frac * 100)}%"></i></span></div>
    <div class="chip">😊 ${game.stats.served}</div>
    ${room ? `<button class="chip room-chip" data-h="room" title="Rummet – koden och spelarna">👥 ${esc(room.code)} · ${room.count}</button><button class="btn" data-h="chat" title="Chatta (Enter)">💬</button>` : ''}
    <div class="hud-spacer"></div>
    <button class="btn" data-h="stock" title="Förråd och skyltning">📦 Lager</button>
    <button class="btn" data-h="shop">🛒 Grossist</button>
    <button class="btn" data-h="menu" title="Meny – byt startår eller butik">☰</button>`;
  $('#hud').querySelectorAll('[data-h]').forEach((b) => (b.onclick = () => h[b.dataset.h]()));
}

// ---------- Beställningskort ----------
export function renderOrders(game, onBuild, players = []) {
  const box = $('#orders');
  const cards = [];
  for (const o of game.orders) {
    const c = game.customers.find((x) => x.id === o.customerId);
    const n = o.build ? Object.keys(o.build.placed).length : 0;
    const f = c && isFinite(c.patienceMax) ? Math.max(0, c.patience / c.patienceMax) : 1;
    const builders = players.filter((p) => p.away === 'workshop' && p.orderId === o.id);
    const who = builders.length ? ` · 🔧 ${builders.map((p) => `<i style="color:${esc(p.color || '#555')};font-style:normal">■</i>${esc(p.name)}`).join(' ')}` : '';
    cards.push({ o, c, html: `<div><b>${esc(o.title)}</b><small>${esc(o.name)} · ${n}/${o.items.length} delar${who}</small>
      <div class="pbar ${f < 0.35 ? 'low' : ''}"><i style="width:${Math.round(f * 100)}%"></i></div></div>
      <button class="btn btn-go btn-small">🔧 Bygg</button>` });
  }
  const front = game.queue()[0];
  const gd = game.guide ? game.guide() : null;
  const key = cards.map((x) => x.html).join('|') + (front?.phase === 'queue' ? 'Q' + front.id : '') + (gd ? gd.title : '');
  if (key === box.dataset.key) return;
  box.dataset.key = key;
  box.innerHTML = '';
  if (gd && !(front?.phase === 'queue')) {
    box.insertAdjacentHTML('beforeend', `<div class="ocard guide-card" style="grid-template-columns:1fr"><div><b>${gd.icon} ${esc(gd.title)}</b><small>${esc(gd.text)}</small></div></div>`);
  }
  if (front?.phase === 'queue' && !game.orders.length) {
    box.insertAdjacentHTML('beforeend', `<div class="ocard" style="grid-template-columns:1fr"><div><b>👆 En kund väntar!</b><small>Tryck på kunden med ❗ vid disken för att ta beställningen.</small></div></div>`);
  }
  for (const { o, c, html } of cards) {
    const el = document.createElement('div'); el.className = 'ocard';
    el.append(portrait(c?.look || game.customers[0]?.look || {}));
    el.insertAdjacentHTML('beforeend', html);
    el.querySelector('button').onclick = () => onBuild(o);
    box.append(el);
  }
}

// ---------- Kunddialog ----------
export function openOrderDialog(game, c, h) {
  const render = () => {
    if (!game.customers.includes(c) && !game.customers.some((x) => x.id === c.id)) { closeModal(); return; }
    c = game.customers.find((x) => x.id === c.id) || c;
    if (c.phase !== 'queue') { closeModal(); return; }
    const shop = game.shop, o = c.order;
    const miss = game.missingFor(o), missChoice = game.missingChoices(o), toBuy = game.toBuyFor(o);
    const buyCost = toBuy.reduce((s, m) => s + shop.part[m.id].cost * m.buy, 0);
    const needLeft = {};
    let rows = '';
    for (const it of o.items) {
      if (it.part) {
        const p = shop.part[it.part];
        needLeft[p.id] = (needLeft[p.id] || 0) + 1;
        const n = needLeft[p.id];
        const st = game.shownFree(p.id) >= n ? ['ok', '✓ framme']
          : game.stockFree(p.id) >= n ? ['ok', '✓ i förrådet']
            : game.stockFree(p.id) + game.incoming(p.id) >= n ? ['wait', '🚚 på väg<br><small>packa upp lådan</small>']
              : ['bad', `✗ saknas<br><small>inköp ${fmt(p.cost)} kr</small>`];
        rows += `<div class="prow"><span data-icon="${p.id}"></span><div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.cats[p.cat].name)} · ${esc(shop.specLine(p))}</div></div>
          <div class="st ${st[0]}">${st[1]}</div></div>`;
      } else {
        const n = Object.keys(game.stock).filter((id) => shop.part[id]?.cat === it.cat).reduce((s, id) => s + game.stockFree(id), 0);
        rows += `<div class="prow"><span style="font-size:26px;text-align:center">${shop.cats[it.cat].icon}</span><div><div class="nm">Valfri: ${esc(shop.cats[it.cat].name.toLowerCase())}</div><div class="sp">Du väljer vilken när du bygger</div></div>
          <div class="st ${n ? 'ok' : 'bad'}">${n ? `✓ ${n} i lager` : '✗ inget i lager'}</div></div>`;
      }
    }
    const waiting = miss.length && !toBuy.length;
    let tip = '';
    if (o.tutorial === 0) tip = '💡 Allt kunden vill ha finns i lagret (✓). Tryck på <b>Ta emot beställningen</b>.';
    else if (o.tutorial !== undefined && toBuy.length) tip = '💡 Grafikkortet finns inte i lagret! Köp in det från grossisten – det kommer i en låda som du packar upp.';
    else if (waiting) tip = '🚚 Delarna är på väg. Packa upp lådan vid dörren när den kommit – sedan kan du ta emot beställningen.';
    else if (toBuy.length && buyCost > game.money) tip = `😬 Du har inte råd att köpa in det som saknas (${fmt(buyCost)} kr). Tacka nej, eller sälj fler datorer först.`;
    const price = shop.priceFor(o, {});
    const body = `<div class="who">${'<span data-face></span>'}<div class="speech">${esc(o.msg)}</div></div>
      <h3 style="margin:4px 0 8px">Beställning: ${esc(o.title)}</h3>
      <div class="plist">${rows}</div>
      <div class="sum"><span>Kunden betalar${o.items.some((i) => i.choice) ? ' ca' : ''}</span><b>${fmt(price)} kr</b></div>
      <div class="sp" style="color:var(--muted)">Delarnas pris + ${fmt(shop.feeFor(o))} kr i montering.</div>
      ${tip ? `<div class="speech" style="margin:10px 0 0;background:#fff4c7">${tip}</div>` : ''}`;
    const buttons = [
      { label: 'Tacka nej', cls: 'btn-red', hidden: o.tutorial !== undefined, onClick: () => { closeModal(); h.onDecline(c); } },
      { label: `🛒 Köp in det som saknas (${fmt(buyCost)} kr)`, cls: 'btn-gold', hidden: !toBuy.length, disabled: buyCost > game.money,
        onClick: () => { act('buyMissing', { customerId: c.id }); render(); } },
      { label: '🛒 Till grossisten', hidden: !missChoice.length, onClick: () => h.onShop(missChoice[0], () => openOrderDialog(game, c, h)) },
      { label: waiting ? '🚚 Väntar på lådan …' : '✓ Ta emot beställningen', cls: 'btn-go', disabled: miss.length || missChoice.length, onClick: () => { closeModal(); h.onAccept(c); } },
    ];
    const dlg = openModal(`Ny kund: ${esc(c.name)}`, body, buttons);
    dlg.querySelector('[data-face]').replaceWith(portrait(c.look));
    dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(shop.icon(shop.part[el.dataset.icon], 44, 38)));
    live(render);
  };
  render();
}

// ---------- Leveranslåda ----------
export function openDelivery(game, box, onClose) {
  const shop = game.shop;
  const render = () => {
    const d = game.deliveries.find((x) => x.id === box.id);
    if (!d) { closeModal(); return; }
    const items = Object.entries(d.items).map(([id, n]) => [shop.part[id], n]).filter(([p]) => p);
    const count = items.reduce((s, [, n]) => s + n, 0);
    const rows = items.map(([p, n]) => `<div class="prow"><span data-icon="${p.id}"></span><div><div class="nm">${n > 1 ? `${n} × ` : ''}${esc(p.name)}</div><div class="sp">${esc(shop.cats[p.cat].name)} · ${esc(shop.specLine(p))}</div></div><div class="own">i lager<br><b>${game.stockFree(p.id)}</b></div></div>`).join('');
    const coming = d.state !== 'arrived';
    const body = `<div class="box-label"><b>GROSSISTEN AB</b><span>Leverans #${d.id} · ${count} ${count === 1 ? 'del' : 'delar'}</span></div>
      <div class="plist">${rows}</div>
      <p class="sp" style="color:var(--muted);margin-top:8px">${coming ? '🚚 Lådan är fortfarande på väg.' : 'Kunderna ser bara det som står framme i butiken. Det du lägger i förrådet kan du ställa ut senare under 📦 Lager.'}</p>`;
    const dlg = openModal(`📦 Låda från grossisten`, body, [
      { label: 'Stäng', onClick: () => { closeModal(); onClose?.(); } },
      { label: 'Lägg i förrådet', hidden: coming, onClick: () => { act('unpack', { box: d.id, show: false }); closeModal(); onClose?.(); } },
      { label: '🏛️ Packa upp och ställ ut', cls: 'btn-go', hidden: coming, onClick: () => { act('unpack', { box: d.id, show: true }); closeModal(); onClose?.(); } },
    ]);
    dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(shop.icon(shop.part[el.dataset.icon], 44, 38)));
    live(render);
  };
  render();
}

// ---------- Lager och skyltning ----------
const STOCK_STATE = { tab: 'all' };
export function openStock(game) {
  const shop = game.shop, st = STOCK_STATE;
  const render = () => {
    const owned = Object.keys(game.stock).filter((id) => game.stock[id] > 0).map((id) => shop.part[id]).filter(Boolean);
    const cats = shop.catOrder.filter((c) => owned.some((p) => p.cat === c));
    if (st.tab !== 'all' && !cats.includes(st.tab)) st.tab = 'all';
    const list = owned.filter((p) => st.tab === 'all' || p.cat === st.tab).sort((a, b) => shop.catOrder.indexOf(a.cat) - shop.catOrder.indexOf(b.cat) || b.cost - a.cost);
    const boxes = game.deliveries.length;
    const tabs = [`<button class="tab ${st.tab === 'all' ? 'on' : ''}" data-tab="all">Allt (${owned.length})</button>`,
      ...cats.map((c) => `<button class="tab ${c === st.tab ? 'on' : ''}" data-tab="${c}">${shop.cats[c].icon} ${esc(shop.cats[c].name)}</button>`)].join('');
    const rows = list.map((p) => {
      const n = game.stockFree(p.id), sh = game.shownFree(p.id);
      return `<div class="prow stockrow"><span data-icon="${p.id}"></span>
        <div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.cats[p.cat].name)} · ${p.year}</div></div>
        <div class="own">framme<br><b>${sh}</b> / ${n}</div>
        <div class="stock-btns"><button class="btn btn-small" data-less="${p.id}" ${sh ? '' : 'disabled'} title="Ta in en till förrådet">−</button><button class="btn btn-small btn-go" data-more="${p.id}" ${sh < n ? '' : 'disabled'} title="Ställ ut en till">+</button></div></div>`;
    }).join('');
    const hidden = owned.reduce((s, p) => s + game.stockFree(p.id) - game.shownFree(p.id), 0);
    const body = `<p style="font-size:18px;margin-top:0">Kunderna beställer det de ser i montrarna och på hyllan. Det som ligger i förrådet kan du fortfarande bygga med.${boxes ? ` <b>${boxes} ${boxes === 1 ? 'låda väntar' : 'lådor väntar'}</b> vid dörren.` : ''}</p>
      <div class="tabs">${tabs}</div>
      <div class="plist">${rows || '<p style="font-size:19px">Lagret är tomt – köp in delar hos 🛒 grossisten.</p>'}</div>`;
    const dlg = openModal('📦 Lager och skyltning', body, [
      { label: 'Stäng', onClick: closeModal },
      { label: `🏛️ Ställ ut allt (${hidden})`, cls: 'btn-go', hidden: !hidden, onClick: () => { for (const p of owned) if (game.shownFree(p.id) < game.stockFree(p.id)) act('setShown', { id: p.id, n: game.stockFree(p.id) }); render(); } },
    ]);
    dlg.classList.add('dlg-wide');
    dlg.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { st.tab = b.dataset.tab; render(); }));
    dlg.querySelectorAll('[data-more]').forEach((b) => (b.onclick = () => { act('setShown', { id: b.dataset.more, n: game.shownFree(b.dataset.more) + 1 }); render(); }));
    dlg.querySelectorAll('[data-less]').forEach((b) => (b.onclick = () => { act('setShown', { id: b.dataset.less, n: game.shownFree(b.dataset.less) - 1 }); render(); }));
    dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(shop.icon(shop.part[el.dataset.icon], 44, 38)));
    live(render);
  };
  render();
}

// ---------- Grossist ----------
// Grossisten: tusentals delar → kategori, sökning, filter och sidor
const SHOP_STATE = { tab: null, q: '', filter: 'sale', sort: 'new', page: 0 };
export function openShop(game, tab = null, onClose = null) {
  const shop = game.shop, st = SHOP_STATE, PER = 20;
  if (tab) { st.tab = tab; st.page = 0; }
  st.tab ||= shop.catOrder[0];
  const render = (keepFocus = false) => {
    const y = game.year, q = st.q.trim().toLowerCase();
    let list = shop.parts.filter((p) => p.cat === st.tab);
    const counts = { sale: 0, soon: 0, own: 0 };
    for (const p of list) { if (game.onSale(p)) counts.sale++; else if (p.year > y && p.year <= y + 2) counts.soon++; if (game.stockFree(p.id) || game.incoming(p.id)) counts.own++; }
    if (st.filter === 'sale') list = list.filter((p) => game.onSale(p));
    if (st.filter === 'soon') list = list.filter((p) => p.year > y && p.year <= y + 2);
    if (st.filter === 'own') list = list.filter((p) => game.stockFree(p.id) > 0 || game.incoming(p.id) > 0);
    if (q) list = list.filter((p) => (p.name + ' ' + p.brand + ' ' + shop.specLine(p)).toLowerCase().includes(q));
    const sorters = { new: (a, b) => b.year - a.year || b.tier - a.tier, cheap: (a, b) => a.cost - b.cost, dear: (a, b) => b.cost - a.cost, name: (a, b) => a.name.localeCompare(b.name, 'sv') };
    list.sort(sorters[st.sort]);
    const pages = Math.max(1, Math.ceil(list.length / PER));
    st.page = Math.min(st.page, pages - 1);
    const shown = list.slice(st.page * PER, st.page * PER + PER);
    const tabs = shop.catOrder.map((c) => `<button class="tab ${c === st.tab ? 'on' : ''}" data-tab="${c}">${shop.cats[c].icon} ${esc(shop.cats[c].name)}</button>`).join('');
    let rows = '';
    for (const p of shown) {
      const sale = game.onSale(p);
      const btn = sale
        ? `<button class="btn btn-small btn-gold" data-buy="${p.id}" ${p.cost > game.money ? 'disabled' : ''}>Köp ${fmt(p.cost)} kr</button>`
        : `<button class="btn btn-small" disabled>${p.year > y ? `📅 ${p.year}` : 'Utgången'}</button>`;
      rows += `<div class="prow shoprow" style="${sale ? '' : 'opacity:.55'}"><span data-icon="${p.id}"></span>
        <div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.specLine(p))} · ${p.year}</div></div>
        <div class="own">i lager<br><b>${game.stockFree(p.id)}</b>${game.incoming(p.id) ? ` <small title="på väg">+${game.incoming(p.id)}🚚</small>` : ''}</div>${btn}</div>`;
    }
    if (!shown.length) rows = `<p style="font-size:19px">Inga delar matchar.${st.filter === 'sale' ? ' Prova filtret "Kommande".' : ''}</p>`;
    const chip = (f, label) => `<button class="tab ${st.filter === f ? 'on' : ''}" data-filter="${f}">${label}</button>`;
    const kit = shop.starterKit ? shop.starterKit(game) : [];
    const kitCost = kit.reduce((s, [id, n]) => s + shop.part[id].cost * n, 0);
    const kitBox = kit.length && game.tutorialStep < (shop.tutorialCount || 0)
      ? `<div class="kit"><div><b>📦 Startpaket</b><small>${kit.reduce((s, [, n]) => s + n, 0)} delar till dina första kunders datorer – allt i en låda.</small></div><button class="btn btn-gold" data-kit ${kitCost > game.money ? 'disabled' : ''}>Köp ${fmt(kitCost)} kr</button></div>` : '';
    const pending = game.deliveries.filter((d) => d.state === 'coming');
    const body = `${kitBox}${pending.length ? `<div class="sp" style="margin:0 0 8px">🚚 ${pending.reduce((s, d) => s + Object.values(d.items).reduce((a, n) => a + n, 0), 0)} delar på väg – de kommer i en låda till butiken.</div>` : ''}<div class="tabs">${tabs}</div>
      <div class="shopbar">
        <input id="shop-q" type="search" placeholder="Sök märke, modell, sockel …" value="${esc(st.q)}">
        ${chip('sale', `Till salu ${y} (${counts.sale})`)}${chip('soon', `Kommande (${counts.soon})`)}${chip('own', `I lager (${counts.own})`)}${chip('all', 'Alla')}
        <select id="shop-sort"><option value="new">Nyast</option><option value="cheap">Billigast</option><option value="dear">Dyrast</option><option value="name">Namn</option></select>
      </div>
      <div class="plist">${rows}</div>
      <div class="pager"><button class="btn btn-small" data-page="-1" ${st.page ? '' : 'disabled'}>← Föregående</button><span>Sida ${st.page + 1} av ${pages} · ${list.length} delar</span><button class="btn btn-small" data-page="1" ${st.page < pages - 1 ? '' : 'disabled'}>Nästa →</button></div>`;
    const dlg = openModal(`🛒 Grossisten ${y} <small style="font-size:15px;margin-left:8px">💰 ${fmt(game.money)} kr</small>`, body,
      [{ label: onClose ? '← Tillbaka till kunden' : 'Stäng', onClick: () => { closeModal(); onClose?.(); } }]);
    dlg.classList.add('dlg-wide');
    dlg.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { st.tab = b.dataset.tab; st.page = 0; render(); }));
    dlg.querySelectorAll('[data-filter]').forEach((b) => (b.onclick = () => { st.filter = b.dataset.filter; st.page = 0; render(); }));
    dlg.querySelectorAll('[data-page]').forEach((b) => (b.onclick = () => { st.page += +b.dataset.page; render(); dlg.scrollTop = 0; }));
    dlg.querySelectorAll('[data-buy]').forEach((b) => (b.onclick = () => { if (act('buy', { id: b.dataset.buy }) !== false) { toast(`🚚 ${shop.part[b.dataset.buy].name} kommer i nästa låda`, 'good'); render(); } }));
    dlg.querySelector('[data-kit]')?.addEventListener('click', () => { act('buyMany', { list: kit }); toast('🚚 Startpaketet är beställt – lådan kommer snart!', 'good'); closeModal(); onClose?.(); });
    live(() => render());
    dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(shop.icon(shop.part[el.dataset.icon], 44, 38)));
    const sort = dlg.querySelector('#shop-sort'); sort.value = st.sort;
    sort.onchange = () => { st.sort = sort.value; st.page = 0; render(); };
    const input = dlg.querySelector('#shop-q');
    let timer = null;
    input.oninput = () => { clearTimeout(timer); timer = setTimeout(() => { st.q = input.value; st.page = 0; render(true); }, 220); };
    if (keepFocus) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
  };
  render();
}

// ---------- Resultat ----------
export function showResult(order, payout, result, onClose) {
  const stars = '⭐'.repeat(payout.stars) + '<span style="opacity:.25">' + '⭐'.repeat(3 - payout.stars) + '</span>';
  const body = `<div style="text-align:center;font-size:44px;letter-spacing:4px">${stars}</div>
    <p style="text-align:center;font-size:18px;margin:6px 0 14px">${esc(order.name)} kommer och hämtar datorn vid utlämningen.</p>
    <div class="plist">
      <div class="prow" style="grid-template-columns:1fr auto"><span>Delar + montering</span><b>${fmt(payout.price)} kr</b></div>
      <div class="prow" style="grid-template-columns:1fr auto"><span>Dricks ${payout.stars >= 3 ? '(snabbt och felfritt!)' : payout.stars === 2 ? '(bra jobbat)' : ''}</span><b>${fmt(payout.tip)} kr</b></div>
      ${payout.bonus ? `<div class="prow" style="grid-template-columns:1fr auto"><span>😎 Proffsbonus (utan hjälp)</span><b>${fmt(payout.bonus)} kr</b></div>` : ''}
      <div class="prow" style="grid-template-columns:1fr auto"><span>Erfarenhet</span><b>+${payout.xp} XP</b></div>
    </div>
    ${result.warnings?.length ? `<p class="sp" style="color:var(--red2);margin-top:10px">⚠️ ${result.warnings.map(esc).join(' ')}</p>` : ''}
    <p class="sp" style="color:var(--muted);margin-top:10px">Byggtid ${Math.round(result.time)} s · ${result.errors} misstag · ${result.help ? 'med hjälp' : 'utan hjälp'}</p>`;
  openModal('🎉 Datorn fungerar!', body, [{ label: 'Till butiken', cls: 'btn-go', onClick: () => { closeModal(); onClose?.(); } }]);
}

export function showLevelUp(game, info) {
  const shop = game.shop, y = info.year;
  const fresh = shop.parts.filter((p) => p.year === y).sort((a, b) => b.tier - a.tier || b.cost - a.cost);
  const top = [];
  for (const cat of shop.catOrder) { const p = fresh.find((x) => x.cat === cat); if (p) top.push(p); }
  const gone = shop.parts.filter((p) => p.until === y - 1).length;
  const body = `<p style="font-size:21px;margin-top:0">Det har blivit <b>${y}</b>${info.era?.title ? ` – ${esc(info.era.title)}` : ''}! Grossisten har <b>${fresh.length}</b> nya delar${gone ? ` och ${gone} gamla har slutat säljas` : ''}.</p>
    ${top.length ? `<h3>Nyheter i år</h3><div class="plist">${top.map((p) => `<div class="prow" style="grid-template-columns:44px 1fr"><span data-icon="${p.id}"></span><div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.cats[p.cat].name)} · ${esc(shop.specLine(p))}</div></div></div>`).join('')}</div>` : ''}`;
  const dlg = openModal(`📅 Nytt år: ${y}`, body, [{ label: 'Grymt!', cls: 'btn-go', onClick: closeModal }]);
  dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(shop.icon(shop.part[el.dataset.icon], 44, 38)));
}

// ---------- Museivy: titta på delarna i en monter på nära håll ----------
export function openShowcase(game, what) {
  const shop = game.shop, dpr = Math.min(3, window.devicePixelRatio || 1);
  let title, body, parts;
  if (what.hero) {
    const p = shop.part[what.hero];
    parts = [[p, 580, 340]];
    title = '⭐ Stjärnobjektet';
    body = `<div class="museum"><span data-big="0"></span>
      <h3 style="margin:8px 0 2px">${esc(p.name)}</h3>
      <div class="sp" style="font-size:18px">${esc(shop.specLine(p))}</div>
      <p style="font-size:19px;margin:8px 0 0">Årets finaste grafikkort – bara till för att titta på. Det kom ut <b>${p.year}</b> och kostar ${fmt(p.cost)} kr hos grossisten.</p></div>`;
  } else {
    const list = Object.keys(game.shown).filter((id) => game.shownFree(id) > 0).map((id) => shop.part[id]).filter((p) => p && (what.cat ? p.cat === what.cat : !what.cats || what.cats.includes(p.cat))).sort((a, b) => b.cost - a.cost);
    parts = list.map((p) => [p, 270, 170]);
    title = `🏛️ ${esc(what.title || shop.cats[what.cat]?.name || 'Hyllan')}`;
    body = list.length
      ? `<div class="museum grid">${list.map((p, i) => `<div class="mcard"><span data-big="${i}"></span><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.specLine(p))}</div><div class="own">framme: <b>${game.shownFree(p.id)}</b></div></div>`).join('')}</div>`
      : '<p style="font-size:20px">Montern är tom – köp in delar hos 🛒 grossisten och ställ ut dem.</p>';
  }
  const dlg = openModal(title, body, [{ label: 'Stäng', onClick: closeModal }]);
  dlg.classList.add('dlg-wide');
  dlg.querySelectorAll('[data-big]').forEach((el) => {
    const [p, w, h] = parts[+el.dataset.big];
    const c = shop.icon(p, Math.round(w * dpr), Math.round(h * dpr));
    c.style.width = w + 'px'; c.style.maxWidth = '100%'; c.style.height = 'auto';
    el.replaceWith(c);
  });
}
