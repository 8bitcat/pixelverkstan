// DOM-gränssnitt: HUD, beställningskort, dialoger (kund, grossist, resultat).
import { portrait } from './people.js';
import { fmt } from './game.js';
import * as PR from './floor-props.js';
import { SLOTS, SLOT_DEPTH } from './floor-layout.js';
import { hex, mix, mul } from './floor-pix.js';
import { cabinetSprite } from '../shops/dator/art-products.js';
import { machineOf, evaluate, fmtMb } from '../games/specs.js';

const $ = (s) => document.querySelector(s);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Alla ändringar av spelet går via kommandon (i co-op skickas de till värden)
let act = null;
export function setAct(fn) { act = fn; }
export const doAct = (name, args) => act(name, args);
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
    ${game.shop.fit ? `<button class="chip fit-chip" data-h="fit" title="Butiken: dragningskraft, trivsel och rykte">🪧${game.fitStats.drag} 😊${game.fitStats.trivsel} ⭐${game.rykte}</button>` : ''}
    ${(game.activeEvents || []).length ? `<button class="chip news-chip" data-h="news" title="Pågående händelser">📰 ${esc(game.activeEvents[0].ev.title)}${game.activeEvents.length > 1 ? ` +${game.activeEvents.length - 1}` : ''}</button>` : ''}
    ${room ? `<button class="chip room-chip" data-h="room" title="Rummet – koden och spelarna">👥 ${esc(room.code)} · ${room.count}</button><button class="btn" data-h="chat" title="Chatta (Enter)">💬</button>` : ''}
    <div class="hud-spacer"></div>
    ${game.shop.fit ? '<button class="btn" data-h="fit" title="Bås, hyllor, inredning och lokal">🏪 Butiken</button>' : ''}
    ${game.hasArcadeRoom ? '<button class="btn" data-h="arcade" title="Arkadrummet – gå in och spela">🕹️ Arkad</button>' : ''}
    ${game.shop.models ? '<button class="btn" data-h="models" title="Egna datormodeller – lansera, recenseras, sälj">🧩 Modeller</button>' : ''}
    ${game.shop.staff ? `<button class="btn" data-h="staff" title="Personal – tekniker och säljare">👥 Personal${game.staff?.length ? ` ${game.staff.length}` : ''}</button>` : ''}
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
    const st = o.staff ? (game.staff || []).find((x) => x.id === o.staff) : null;
    const who2 = st ? ` · ${o.repair ? '🔍' : '🔧'} ${esc(st.name.split(' ')[0])} ${Math.round((st.progress || 0) * 100)} %` : '';
    cards.push({ o, c, html: `<div><b>${esc(o.title)}</b><small>${esc(o.name)} · ${n}/${o.items.length} delar${who}${who2}</small>
      <div class="pbar ${f < 0.35 ? 'low' : ''}"><i style="width:${Math.round(f * 100)}%"></i></div></div>
      <button class="btn btn-go btn-small">${st ? '👀 Ta över' : o.repair ? '🔍 Laga' : '🔧 Bygg'}</button>` });
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
    const prod = o.product ? shop.part[o.product] : null;
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
              : !game.onSale(p) ? ['bad', '✗ säljs inte längre<br><small>går inte att köpa in</small>']
              : !game.canSell(p) ? ['bad', `🔒 ${esc(game.needFor(p))}<br><small>se 🏪 Butiken</small>`]
                : ['bad', `✗ saknas<br><small>inköp ${fmt(p.cost)} kr</small>`];
        rows += `<div class="prow"><span data-icon="${p.id}"></span><div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.cats[p.cat].name)} · ${esc(shop.specLine(p))}</div></div>
          <div class="st ${st[0]}">${st[1]}</div></div>`;
      } else {
        const n = Object.keys(game.stock).filter((id) => shop.part[id]?.cat === it.cat).reduce((s, id) => s + game.stockFree(id), 0);
        rows += `<div class="prow"><span style="font-size:26px;text-align:center">${shop.cats[it.cat].icon}</span><div><div class="nm">Valfri: ${esc(shop.cats[it.cat].name.toLowerCase())}</div><div class="sp">Du väljer vilken när du bygger</div></div>
          <div class="st ${n ? 'ok' : 'bad'}">${n ? `✓ ${n} i lager` : '✗ inget i lager'}</div></div>`;
      }
    }
    const locked = miss.filter((m) => game.onSale(shop.part[m.id]) && !game.canSell(shop.part[m.id])).map((m) => game.needFor(shop.part[m.id]));
    const repair = !!o.repair;
    if (repair) rows = o.items.map((it) => { const p = shop.part[it.part]; return p ? `<div class="prow"><span data-icon="${p.id}"></span><div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.cats[p.cat].name)} · ${esc(shop.specLine(p))}</div></div><div class="st">kundens</div></div>` : ''; }).join('');
    const gone = game.hasGone(o) || miss.some((m) => !game.onSale(shop.part[m.id]));
    const waiting = miss.length && !toBuy.length && !gone && !locked.length;
    let tip = '';
    if (o.tutorial === 0) tip = '💡 Allt kunden vill ha finns i lagret (✓). Tryck på <b>Ta emot beställningen</b>.';
    else if (o.tutorial !== undefined && toBuy.length) tip = '💡 Grafikkortet finns inte i lagret! Köp in det från grossisten – det kommer i en låda som du packar upp.';
    else if (gone) tip = '🛑 En del i beställningen säljs inte längre och går inte att köpa in. Tacka nej till kunden – nya kunder kommer snart.';
    else if (locked.length) tip = `🔒 Kunden vill ha något finare än butiken får sälja (${esc([...new Set(locked)].join(', '))}). Tacka nej – önskemålet hamnar på efterfrågantavlan i 🏪 Butiken.`;
    else if (waiting) tip = '🚚 Delarna är på väg. Packa upp lådan vid dörren när den kommit – sedan kan du ta emot beställningen.';
    else if (prod && !miss.length) tip = '💰 Färdig vara – sälj direkt över disk, kunden hämtar vid utlämningen.';
    else if (repair) tip = `🔧 Kunden lämnar in datorn. Diagnosavgiften (${fmt(shop.diagnosisFee || 150)} kr) får du direkt, resten när den fungerar. Ställ den på bänken, koppla in och starta – symptomet visar var felet sitter. Svårighet: ${'★'.repeat(o.repair.stars || 1)}`;
    else if (toBuy.length && buyCost > game.money) tip = `😬 Du har inte råd att köpa in det som saknas (${fmt(buyCost)} kr). Tacka nej, eller sälj fler datorer först.`;
    const price = shop.priceFor(o, {});
    const canEdit = !prod && !repair && o.tutorial !== 0;
    const hasGpu = o.items.some((it) => it.cat === 'gpu');
    const body = `<div class="who">${'<span data-face></span>'}<div class="speech">${esc(o.msg)}</div></div>
      <h3 style="margin:4px 0 8px">${prod ? 'Vill köpa' : repair ? 'Lämnar in' : 'Beställning'}: ${esc(o.title)}</h3>
      <div class="plist">${rows}</div>
      ${canEdit ? `<div class="swapbar"><button class="btn btn-small" data-stockpick>📦 Byt del ur lagret</button>${!hasGpu ? '<button class="btn btn-small btn-gold" data-addgpu>➕ Lägg till grafikkort</button>' : ''}<small>Kunden betalar delarnas pris – ett bättre kort ger mer betalt.</small></div>` : ''}
      <div class="sum"><span>Kunden betalar${o.items.some((i) => i.choice) ? ' ca' : ''}${repair ? ' när den är lagad' : ''}</span><b>${fmt(price)} kr</b></div>
      <div class="sp" style="color:var(--muted)">${prod ? `${esc(shop.specLine(prod))}${shop.products && shop.products.valueAt(prod, game.year) < 1 ? ' · <b>värdet har sjunkit</b> – gammalt lager' : ''}` : repair ? 'Arbetskostnad efter svårighet – delarna är kundens egna.' : o.model ? '🧩 Din egen modell – fast pris, som i Datormagazin.' : `Delarnas pris + ${fmt(shop.feeFor(o))} kr i montering.`}</div>
      ${tip ? `<div class="speech" style="margin:10px 0 0;background:#fff4c7">${tip}</div>` : ''}`;
    const buttons = [
      { label: 'Tacka nej', cls: 'btn-red', onClick: () => { closeModal(); h.onDecline(c); } },
      { label: `🛒 Köp in det som saknas (${fmt(buyCost)} kr)`, cls: 'btn-gold', hidden: !toBuy.length, disabled: buyCost > game.money,
        onClick: () => { act('buyMissing', { customerId: c.id }); render(); } },
      { label: '🛒 Till grossisten', hidden: !missChoice.length, onClick: () => h.onShop(missChoice[0], () => openOrderDialog(game, c, h)) },
      { label: gone ? '🛑 Går inte att bygga' : locked.length ? '🔒 Får inte säljas' : waiting ? '🚚 Väntar på lådan …' : prod ? `💰 Sälj för ${fmt(price)} kr` : repair ? '🔧 Ta emot jobbet' : '✓ Ta emot beställningen', cls: 'btn-go', disabled: miss.length || missChoice.length, onClick: () => { closeModal(); h.onAccept(c); } },
    ];
    const dlg = openModal(`Ny kund: ${esc(c.name)}`, body, buttons);
    dlg.querySelector('[data-face]').replaceWith(portrait(c.look));
    dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(shop.icon(shop.part[el.dataset.icon], 44, 38)));
    const back = () => openOrderDialog(game, c, h);
    dlg.querySelector('[data-stockpick]')?.addEventListener('click', () => openPartPicker(game, { order: o, target: { customerId: c.id }, onDone: back }));
    dlg.querySelector('[data-addgpu]')?.addEventListener('click', () => openPartPicker(game, { order: o, target: { customerId: c.id }, cats: ['gpu'], add: true, onDone: back }));
    live(render);
  };
  render();
}

// ---------- Lagret som delväljare: byt en del i beställningen mot en som finns hemma ----------
// opts: { order, target: { customerId } | { orderId }, cats?, add?, onDone }
export function openPartPicker(game, opts) {
  const shop = game.shop, o = opts.order, y = game.year;
  const cats = opts.cats || shop.catOrder.filter((c) => !(shop.productCats || []).includes(c));
  const owned = Object.keys(game.stock).filter((id) => game.stockFree(id) > 0).map((id) => shop.part[id]).filter((p) => p && cats.includes(p.cat));
  const groups = cats.map((cat) => [cat, owned.filter((p) => p.cat === cat).sort((a, b) => b.cost - a.cost)]).filter(([, l]) => l.length);
  const rowsFor = (cat, list) => list.map((p) => {
    const idx = o.items.findIndex((it) => it.cat === cat);
    const it = idx >= 0 ? o.items[idx] : null;
    const others = o.items.filter((x, i) => i !== idx && x.part).map((x) => shop.part[x.part]).filter(Boolean);
    const fits = !shop.fitsWith || shop.fitsWith(p, others, y);
    const placed = it?.part && game.isPlaced(o, it.part);
    const same = it?.part === p.id;
    const canAdd = !it && ['gpu', 'sound'].includes(cat);
    let st, btn;
    if (same) { st = '<span class="ok">✓ i beställningen</span>'; btn = ''; }
    else if (!it && !canAdd) { st = '<span style="color:var(--muted)">inte i beställningen</span>'; btn = ''; }
    else if (placed) { st = '<span style="color:var(--muted)">sitter redan i datorn</span>'; btn = ''; }
    else if (!fits) { st = '<span class="bad">✗ passar inte ihop</span>'; btn = ''; }
    else btn = `<button class="btn btn-small btn-go" data-pick="${p.id}" data-idx="${idx}">${it ? 'Byt in' : '➕ Lägg till'}</button>`;
    return `<div class="prow gamerow"><span data-icon="${p.id}"></span><div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.specLine(p))} · i lager ${game.stockFree(p.id)} · kund betalar ${fmt(shop.retail(p))} kr</div>${st ? `<div class="sp">${st}</div>` : ''}</div>${btn}</div>`;
  }).join('');
  const body = `<p style="font-size:18px;margin:0 0 8px">${opts.add ? 'Välj ett grafikkort ur lagret att lägga till i beställningen.' : 'Allt som finns hemma. Byt in en del i beställningen – den måste passa ihop med de andra delarna.'}</p>
    ${groups.length ? groups.map(([cat, list]) => `<h3 style="margin:10px 0 4px">${shop.cats[cat].icon} ${esc(shop.cats[cat].name)}</h3><div class="plist">${rowsFor(cat, list)}</div>`).join('') : '<p style="font-size:19px">Inget passande i lagret – köp in hos 🛒 Grossisten.</p>'}`;
  const dlg = openModal('📦 Lagret', body, [{ label: '← Tillbaka', onClick: () => { closeModal(); opts.onDone?.(); } }]);
  dlg.classList.add('dlg-wide');
  dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(shop.icon(shop.part[el.dataset.icon], 44, 38)));
  dlg.querySelectorAll('[data-pick]').forEach((b) => (b.onclick = () => {
    const idx = +b.dataset.idx;
    const r = idx >= 0 ? act('swapItem', { ...opts.target, index: idx, part: b.dataset.pick }) : act('addItem', { ...opts.target, part: b.dataset.pick });
    if (r === false) return;
    closeModal(); opts.onDone?.();
  }));
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
      // produkter: hett just nu, gammalt lager (värdet har sjunkit) eller samlarobjekt
      let tag = '';
      if (shop.isProduct?.(p)) { const v = shop.products.valueAt(p, game.year), h = shop.hypeAt(p, game.year); tag = v > 1.5 ? ' · <b style="color:#8a6a2a">💎 samlarobjekt</b>' : v < 1 ? ` · <b style="color:var(--red2)">🏷 REA – värde ${Math.round(v * 100)} %</b>` : h >= 0.85 ? ' · <b style="color:#c9323a">🔥 hett</b>' : ''; }
      return `<div class="prow stockrow"><span data-icon="${p.id}"></span>
        <div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.cats[p.cat].name)} · ${p.year}${tag}</div></div>
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
    // det man får sälja först, låsta delar sist
    const lockOf = (p) => (game.onSale(p) && !game.canSell(p) ? 1 : 0);
    list.sort((a, b) => lockOf(a) - lockOf(b) || sorters[st.sort](a, b));
    const pages = Math.max(1, Math.ceil(list.length / PER));
    st.page = Math.min(st.page, pages - 1);
    const shown = list.slice(st.page * PER, st.page * PER + PER);
    const tabs = shop.catOrder.map((c) => `<button class="tab ${c === st.tab ? 'on' : ''}" data-tab="${c}">${shop.cats[c].icon} ${esc(shop.cats[c].name)}</button>`).join('');
    let rows = '';
    for (const p of shown) {
      const sale = game.onSale(p), lock = sale && !game.canSell(p);
      const btn = lock
        ? `<button class="btn btn-small" data-lock="1" title="${esc(game.needFor(p))}">🔒 ${fmt(game.costOf(p))} kr</button>`
        : sale
          ? `<button class="btn btn-small btn-gold" data-buy="${p.id}" ${game.costOf(p) > game.money ? 'disabled' : ''}>Köp ${fmt(game.costOf(p))} kr${game.costOf(p) !== p.cost ? ` <small title="händelse: ${game.costOf(p) > p.cost ? 'dyrare' : 'billigare'} än vanligt">${game.costOf(p) > p.cost ? '📈' : '📉'}</small>` : ''}</button>`
          : `<button class="btn btn-small" disabled>${p.year > y ? `📅 ${p.year}` : 'Utgången'}</button>`;
      rows += `<div class="prow shoprow ${lock ? 'locked' : ''}" style="${sale ? '' : 'opacity:.55'}"><span data-icon="${p.id}"></span>
        <div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.specLine(p))} · ${p.year}${lock ? ` · <b class="lock-need">🔒 ${esc(game.needFor(p))}</b>` : ''}</div></div>
        <div class="own">i lager<br><b>${game.stockFree(p.id)}</b>${game.incoming(p.id) ? ` <small title="på väg">+${game.incoming(p.id)}🚚</small>` : ''}</div>${btn}</div>`;
    }
    if (!shown.length) rows = `<p style="font-size:19px">Inga delar matchar.${st.filter === 'sale' ? ' Prova filtret "Kommande".' : ''}</p>`;
    const chip = (f, label) => `<button class="tab ${st.filter === f ? 'on' : ''}" data-filter="${f}">${label}</button>`;
    const kit = shop.starterKit ? shop.starterKit(game) : [];
    const kitCost = kit.reduce((s, [id, n]) => s + game.costOf(shop.part[id]) * n, 0);
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
    dlg.querySelectorAll('[data-lock]').forEach((b) => (b.onclick = () => { toast(`🔒 ${b.title}. Köp bås under 🏪 Butiken.`, 'bad'); }));
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
  // tidningsnotiser: konsoler och arkadmaskiner som lanseras i år
  const launches = shop.parts.filter((p) => (p.cat === 'konsol' || p.cat === 'arkad') && p.year === y);
  const news = launches.length ? `<div class="news"><b>📰 Datortidningen:</b> ${launches.map((p) => p.cat === 'arkad' ? `<i>${esc(p.brand || 'Spelhallen')} ställer ut ${esc(p.name)} – köerna ringlar långa.</i>` : `<i>${esc(p.brand ? p.brand[0].toUpperCase() + p.brand.slice(1) : '')} lanserar ${esc(p.name)}${p.cost ? ` för ${fmt(Math.round(p.cost * 1.3 / 10) * 10)} kr` : ''}.</i>`).join(' ')} ${launches.some((p) => p.cat === 'konsol') ? 'Kunderna kommer att fråga efter den – ha en TV-hörna och köp in.' : ''}</div>` : '';
  const body = `<p style="font-size:21px;margin-top:0">Det har blivit <b>${y}</b>${info.era?.title ? ` – ${esc(info.era.title)}` : ''}! Grossisten har <b>${fresh.length}</b> nya delar${gone ? ` och ${gone} gamla har slutat säljas` : ''}.</p>${news}
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
    const F = shop.fit;
    const list = Object.keys(game.shown).filter((id) => game.shownFree(id) > 0).map((id) => shop.part[id])
      .filter((p) => p && (what.cat ? p.cat === what.cat : !what.cats || what.cats.includes(p.cat)) && (!what.brand || !F || F.brandKey(p) === what.brand) && game.canSell(p)).sort((a, b) => b.cost - a.cost);
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


// ---------- Butiken: platser, bås, prylar och lokal ----------
const FIT_STATE = { tab: 'platser' };
const previewCache = new Map();
// pixelförhandsvisning av det som går att köpa (samma ritfunktioner som butiksgolvet)
function fitPreview(F, o, size) {
  const key = `${o.id}|${size}|${o.year || 0}`;
  if (previewCache.has(key)) return previewCache.get(key).cloneNode ? cloneCanvas(previewCache.get(key)) : previewCache.get(key);
  let img;
  if (o.kind === 'unit' && o.unit === 'arkad') { const p = F.ARKAD?.find((a) => a.id === o.product) || F.arkadInfo?.(o.product); img = p ? cabinetSprite(p, 2) : PR.makeVendor('godis'); }
  else if (o.kind === 'unit' && o.unit === 'tv') img = PR.makeTvCorner(size === 'wide' ? 156 : 118, o.year || 1991).img;
  else if (o.kind === 'unit' && o.unit === 'spelhylla') img = PR.makeGameShelf(size === 'wide' ? 156 : 118).img;
  else if (o.kind === 'unit' && o.unit === 'spelbord') img = PR.makeGameDesk(156, o.year || 1991).img;
  else if (o.kind === 'unit') img = PR.makeVendor(o.unit);
  else {
    const brand = o.kind === 'brand' ? F.brandInfo(o.cat, o.brand) : null;
    const catColor = { gpu: '#3f9b3a', cpu: '#2c6fb7', ram: '#c9323a', storage: '#7a5bc9', sound: '#c86a2a' }[o.cat] || '#7a2e3e';
    const velvet = mix(mul(hex(brand?.color || catColor, 0x7a2e3e), 0.5), 0x1a1030, 0.35);
    const title = (F.CAT_NAME[o.cat] || o.cat).toUpperCase();
    const f = size === 'small' ? PR.makeTower(title, velvet, brand, o.level) : PR.makeVitrine(size === 'wide' ? 156 : 118, title, velvet, brand, o.level);
    img = document.createElement('canvas'); img.width = f.W; img.height = f.H + 6;
    const x = img.getContext('2d'); x.drawImage(f.under, 0, 6); x.drawImage(f.over, 0, 6);
  }
  previewCache.set(key, img);
  return cloneCanvas(img);
}
function cloneCanvas(c) { const n = document.createElement('canvas'); n.width = c.width; n.height = c.height; n.getContext('2d').drawImage(c, 0, 0); return n; }
function statChips(o) {
  const parts = [];
  if (o.drag) parts.push(`<i>🪧 +${o.drag}</i>`); if (o.trivsel) parts.push(`<i>😊 +${o.trivsel}</i>`); if (o.rykte) parts.push(`<i>⭐ +${o.rykte}</i>`);
  if (o.queue) parts.push(`<i>🧍 kö +${o.queue}</i>`); if (o.lager) parts.push(`<i>🗄️ tier ${o.lager + 1}</i>`); if (o.lokal) parts.push(`<i>🏬 ${o.lokal === 2 ? '6 platser' : '8 platser'}</i>`);
  if (o.cap) parts.push(`<i>🔓 tier ≤ ${o.cap}</i>`);
  return parts.join(' ');
}

export function openFittings(game, tab = null, slot = null) {
  const shop = game.shop, F = shop.fit, st = FIT_STATE;
  if (!F) return;
  if (tab) st.tab = tab;
  if (slot !== null) st.pick = slot; else st.pick = null;
  const render = () => {
    const y = game.year, fit = game.fit, lokal = F.lokalOf(fit), open = F.SLOTS_PER_LOKAL[lokal], S = game.fitStats;
    const head = `<div class="fit-head"><div><b>🏬 ${esc(F.LOKAL_NAME[lokal])}</b><small>${open} platser · lokal ${lokal} av ${F.LOKAL_MAX || 6}${lokal < (F.LOKAL_MAX || 6) ? ` · nästa: ${esc(F.LOKAL_NAME[lokal + 1])}` : ''}</small></div>
      <div class="fit-stats"><span title="Dragningskraft: fler kunder">🪧 ${S.drag}</span><span title="Trivsel: kunderna väntar längre">😊 ${S.trivsel}</span><span title="Rykte: stjärnor från nöjda kunder">⭐ ${game.rykte}</span></div></div>`;
    const dem = Object.entries(game.demand || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const demand = dem.length ? `<div class="demand"><b>📋 Kunder har frågat efter:</b> ${dem.map(([t, n]) => `<span>${esc(t)} <i>×${n}</i></span>`).join(' ')}</div>` : '';
    const tabs = [['platser', '🏬 Platser'], ['skylt', '🪧 Skyltning'], ['trivsel', '😊 Trivsel'], ['verkstad', '🔧 Verkstad'], ['lager', '🗄️ Lager & lokal'], ...(game.hasArcadeRoom ? [['arkad', '🕹️ Arkadrummet']] : [])]
      .map(([id, label]) => `<button class="tab ${st.tab === id ? 'on' : ''}" data-tab="${id}">${label}</button>`).join('');
    let body = '';
    if (st.tab === 'platser' && st.pick !== null) {
      // väljaren för en plats
      const i = st.pick, sl = SLOTS[i], cur = fit.slots[i];
      const opts = F.optionsFor(fit, i, sl.size, y);
      const groups = [['Hyllor', opts.filter((o) => o.kind === 'cat')], ['Märkesbås', opts.filter((o) => o.kind === 'brand')], ['Annat', opts.filter((o) => o.kind === 'unit')]];
      body = `<p style="font-size:18px;margin:0 0 8px"><b>Plats ${i + 1}</b> (${sl.size === 'small' ? 'liten – torn eller automat' : sl.size === 'wide' ? 'bred monter' : 'monter'}) · nu: <b>${esc(F.slotTitle(cur))}</b>${cur ? ` <button class="btn btn-small btn-red" data-sell="${i}">Riv (+${fmt(Math.round(F.slotValue(cur, y) * 0.4 / 50) * 50)} kr)</button>` : ''}</p>
        <div class="fit-groups">${groups.filter(([, l]) => l.length).map(([name, list]) => `<h3>${name}</h3><div class="fit-grid">${list.map((o) => `<div class="fit-card ${o.current ? 'cur' : ''}" style="--pc:${esc(o.color || '#d8b24a')}">
          <span data-prev="${esc(o.id)}"></span><b>${esc(o.title)}</b><small>${esc(o.desc)}</small><div class="chips">${statChips(o)}</div>
          ${o.current ? '<span class="owned">✓ står här</span>' : `<button class="btn btn-small ${o.upgrade ? 'btn-go' : 'btn-gold'}" data-opt="${esc(o.id)}" ${o.pay > game.money ? 'disabled' : ''}>${o.upgrade ? 'Uppgradera' : 'Köp'} ${fmt(o.pay)} kr</button>`}
        </div>`).join('')}</div>`).join('')}</div>`;
    } else if (st.tab === 'platser') {
      body = `<p style="font-size:18px;margin:0 0 8px">Det du visar är det du får sälja. En <b>kategorihylla</b> tar instegsvaror, ett <b>märkesbås</b> höjer taket för det märket – nivå 1 → tier 3, nivå 2 → tier 4, nivå 3 → tier 5. Tryck på en plats för att köpa eller byta.</p>
        <div class="slot-grid">${SLOTS.map((sl, i) => {
          const cur = fit.slots[i], isOpen = i < open;
          const prev = !isOpen ? '<span class="slot-closed">🔒</span>' : cur ? `<span data-slot-prev="${i}"></span>` : '<span class="slot-empty">＋</span>';
          return `<button class="slot-card ${!isOpen ? 'closed' : cur ? '' : 'empty'}" data-slot="${i}" ${!isOpen ? 'disabled' : ''}>
            <div class="slot-prev">${prev}</div><b>Plats ${i + 1}</b><small>${!isOpen ? 'större lokal krävs' : esc(F.slotTitle(cur))}</small></button>`;
        }).join('')}</div>`;
    } else if (st.tab === 'arkad') {
      const owned = (fit.arcade || []).map((id) => shop.part[id]).filter(Boolean);
      const forSale = shop.parts.filter((p) => p.cat === 'arkad' && game.onSale(p)).sort((a, b) => shop.hypeAt(b, y) - shop.hypeAt(a, y));
      body = `<p style="font-size:18px;margin:0 0 8px">Arkadrummet rymmer <b>${F.ARCADE_MAX}</b> maskiner (${owned.length} nu). De drar folk till butiken, drar in mynt varje minut och går att spela på. Heta maskiner drar in mest – gamla blir samlarobjekt.</p>
        ${owned.length ? `<h3>I rummet</h3><div class="plist">${owned.map((p, i) => `<div class="prow gamerow"><span data-icon="${p.id}"></span><div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.specLine(p))} · het ${Math.round(shop.hypeAt(p, y) * 100)} %</div></div><button class="btn btn-small btn-red" data-sellarc="${i}">Sälj</button></div>`).join('')}</div>` : ''}
        <h3>Att köpa ${y}</h3><div class="plist">${forSale.map((p) => `<div class="prow gamerow"><span data-icon="${p.id}"></span><div><div class="nm">${esc(p.name)} <small style="color:var(--muted)">${p.year}</small></div><div class="sp">${esc(p.desc || '')} ${esc(shop.specLine(p))}</div></div><button class="btn btn-small btn-gold" data-buyarc="${p.id}" ${p.cost > game.money || owned.length >= F.ARCADE_MAX ? 'disabled' : ''}>Köp ${fmt(p.cost)} kr</button></div>`).join('')}</div>`;
    } else {
      const group = { skylt: ['skylt'], trivsel: ['trivsel'], lager: ['lokal', 'lager'], verkstad: ['verkstad'] }[st.tab] || [];
      // lokalerna: bara den man har och nästa steg visas
      const list = F.ITEMS.filter((it) => group.includes(it.group) && (it.group !== 'lokal' || fit.items[it.id] || !it.needs || fit.items[it.needs]));
      body = `<div class="plist">${list.map((it) => {
        const owned = !!fit.items[it.id], cost = F.priceFor(it.cost, y), soon = it.year > y, need = it.needs && !fit.items[it.needs];
        const btn = owned ? '<span class="owned">✓ har</span>' : soon ? `<button class="btn btn-small" disabled>📅 ${it.year}</button>` : need ? `<button class="btn btn-small" disabled title="kräver ${esc(F.itemInfo(it.needs)?.name || '')}">🔒 ${fmt(cost)} kr</button>`
          : `<button class="btn btn-small btn-gold" data-item="${it.id}" ${cost > game.money ? 'disabled' : ''}>Köp ${fmt(cost)} kr</button>`;
        return `<div class="prow itemrow ${owned ? 'owned-row' : ''}"><span class="ico">${it.icon}</span><div><div class="nm">${esc(it.name)}</div><div class="sp">${esc(it.desc)}${need ? ` · <b>kräver ${esc(F.itemInfo(it.needs)?.name || '')}</b>` : ''}</div><div class="chips">${statChips(it)}</div></div>${btn}</div>`;
      }).join('')}</div>`;
    }
    const dlg = openModal(`🏪 Butiken <small style="font-size:15px;margin-left:8px">💰 ${fmt(game.money)} kr</small>`, `${head}${demand}<div class="tabs">${tabs}</div>${body}`,
      [st.pick !== null ? { label: '← Alla platser', onClick: () => { st.pick = null; render(); } } : { label: 'Stäng', onClick: closeModal }]);
    dlg.classList.add('dlg-wide');
    dlg.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { st.tab = b.dataset.tab; st.pick = null; render(); }));
    dlg.querySelectorAll('[data-slot]').forEach((b) => (b.onclick = () => { st.pick = +b.dataset.slot; render(); }));
    dlg.querySelectorAll('[data-slot-prev]').forEach((el) => {
      const i = +el.dataset.slotPrev, cur = fit.slots[i], sl = SLOTS[i];
      const o = cur.kind === 'unit' ? { id: 'unit:' + cur.unit, kind: 'unit', unit: cur.unit } : cur.kind === 'cat' ? { id: 'cat:' + cur.cat, kind: 'cat', cat: cur.cat, level: 0 } : { id: `brand:${cur.cat}:${cur.brand}:${cur.level}`, kind: 'brand', cat: cur.cat, brand: cur.brand, level: cur.level };
      el.replaceWith(fitPreview(F, o, sl.size));
    });
    dlg.querySelectorAll('[data-prev]').forEach((el) => {
      const o = F.optionsFor(fit, st.pick, SLOTS[st.pick].size, y).find((x) => x.id === el.dataset.prev);
      if (o) el.replaceWith(fitPreview(F, o, SLOTS[st.pick].size));
    });
    dlg.querySelectorAll('[data-opt]').forEach((b) => (b.onclick = () => {
      const cur = fit.slots[st.pick], o = F.optionsFor(fit, st.pick, SLOTS[st.pick].size, y).find((x) => x.id === b.dataset.opt);
      const go = () => { act('buySlot', { slot: st.pick, option: b.dataset.opt }); render(); };
      if (!cur || !o || o.upgrade) return go();
      // platsen är upptagen: fråga innan det gamla rivs (40 % tillbaka är redan avdraget från priset)
      const back = Math.round(F.slotValue(cur, y) * 0.4 / 50) * 50;
      openModal('🔁 Byta ut?', `<p style="font-size:18px;margin:0 0 8px">På <b>plats ${st.pick + 1}</b> står redan <b>${esc(F.slotTitle(cur))}</b>. Vill du verkligen byta ut den mot <b>${esc(o.title)}</b>?</p>
        <p style="margin:0">Den gamla rivs och du får <b>${fmt(back)} kr</b> tillbaka – det är avdraget från priset, så bytet kostar <b>${fmt(o.pay)} kr</b>.</p>`, [
        { label: `Ja, byt ut (${fmt(o.pay)} kr)`, cls: 'btn-go', onClick: go },
        { label: 'Nej, välj en annan plats', onClick: () => { st.pick = null; render(); } },
      ]);
    }));
    dlg.querySelectorAll('[data-sell]').forEach((b) => (b.onclick = () => { act('sellSlot', { slot: +b.dataset.sell }); render(); }));
    dlg.querySelectorAll('[data-item]').forEach((b) => (b.onclick = () => { act('buyItem', { id: b.dataset.item }); render(); }));
    dlg.querySelectorAll('[data-buyarc]').forEach((b) => (b.onclick = () => { act('buyArcade', { id: b.dataset.buyarc }); render(); }));
    dlg.querySelectorAll('[data-sellarc]').forEach((b) => (b.onclick = () => { act('sellArcade', { i: +b.dataset.sellarc }); render(); }));
    dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(shop.icon(shop.part[el.dataset.icon], 44, 38)));
    live(render);
  };
  render();
}


// ---------- Speldatorn: sätt ihop av delar i lagret ----------
const DESK_CATS = ['case', 'mb', 'cpu', 'cooler', 'ram', 'gpu', 'storage', 'sound', 'psu'];
export function openDeskBuild(game, onDone) {
  const shop = game.shop;
  const pick = { ...(game.deskPc?.parts || {}) };
  const render = () => {
    const owned = (cat) => Object.keys(game.stock).filter((id) => game.stockFree(id) > 0 && shop.part[id]?.cat === cat).map((id) => shop.part[id]).sort((a, b) => b.cost - a.cost);
    const rows = DESK_CATS.map((cat) => {
      const list = owned(cat), cur = pick[cat] || '';
      const opts = ['<option value="">– ingen –</option>', ...list.map((p) => `<option value="${p.id}" ${p.id === cur ? 'selected' : ''}>${esc(p.name)} (${game.stockFree(p.id)} st)</option>`)].join('');
      const need = ['case', 'mb', 'cpu', 'ram', 'storage', 'psu'].includes(cat);
      return `<div class="deskrow"><b>${shop.cats[cat].icon} ${esc(shop.cats[cat].name)}</b><select data-cat="${cat}">${opts}</select><span class="st ${cur ? 'ok' : need ? 'bad' : ''}">${cur ? '✓' : need ? 'krävs' : 'valfri'}</span></div>`;
    }).join('');
    const problems = game.deskProblems(pick);
    const parts = {}; for (const [cat, id] of Object.entries(pick)) if (id) parts[cat] = shop.part[id];
    const m = machineOf(parts, game.year);
    const status = problems.length ? `<div class="speech" style="background:#ffe3e3">✗ ${esc(problems[0])}</div>` : `<div class="speech" style="background:#effbef">✓ Datorn går ihop: <b>${esc(m.name)}</b> · ${fmtMb(m.ram)} minne · ${m.gfx}${m.vram ? ' ' + fmtMb(m.vram) : ''}${m.sound ? ' · ljudkort' : ' · bara pipljud'}</div>`;
    const body = `<p style="font-size:18px;margin:0 0 8px">Välj delar ur lagret till butikens egen dator. Den står på spelbordet – och du kan gå dit och spela på den. Bättre delar = fler bildrutor per sekund.</p>
      <div class="plist">${rows}</div>${status}`;
    const dlg = openModal('🖥️ Sätt ihop speldatorn', body, [
      { label: 'Avbryt', onClick: closeModal },
      { label: '🔩 Plocka isär', cls: 'btn-red', hidden: !game.deskPc, onClick: () => { act('deskUnbuild'); closeModal(); } },
      { label: '✓ Sätt ihop', cls: 'btn-go', disabled: problems.length > 0, onClick: () => { act('deskBuild', { parts: pick }); closeModal(); onDone?.(); } },
    ]);
    dlg.classList.add('dlg-wide');
    dlg.querySelectorAll('[data-cat]').forEach((sel) => (sel.onchange = () => { if (sel.value) pick[sel.dataset.cat] = sel.value; else delete pick[sel.dataset.cat]; render(); }));
  };
  render();
}

// ---------- Spelmenyn på speldatorn: vilka spel går, och hur bra? ----------
export function openPlayMenu(game, onPlay, onRebuild) {
  const shop = game.shop, y = game.year;
  const m = machineOf(game.deskParts(), y);
  const games = shop.parts.filter((p) => p.cat === 'spel' && p.platform === 'pc' && p.year <= y).sort((a, b) => b.year - a.year);
  const rows = games.map((p) => {
    const ev = evaluate(p.id, m);
    const badge = ev.error ? `<span class="fpsbadge err" title="${esc(ev.hint || '')}">✗ ${esc(ev.error.length > 22 ? ev.error.slice(0, 20) + '…' : ev.error)}</span>` : `<span class="fpsbadge ${ev.fps >= 50 ? 'good' : ev.fps >= 25 ? 'mid' : 'bad'}">${ev.fps} FPS</span>`;
    return `<div class="prow gamerow"><span data-icon="${p.id}"></span><div><div class="nm">${esc(p.name)} <small style="color:var(--muted)">${p.year}</small></div><div class="sp">${ev.error ? esc(ev.hint || '') : esc(ev.smooth) + (ev.software ? ' · mjukvaruläge (inget 3D-kort)' : '')}</div></div>
      <div style="display:flex;gap:6px;align-items:center">${badge}<button class="btn btn-small ${ev.error ? '' : 'btn-go'}" data-play="${p.id}">▶ ${ev.error ? 'Prova' : 'Spela'}</button></div></div>`;
  }).join('');
  const body = `<div class="fit-head"><div><b>🖥️ ${esc(m.name)}</b><small>${fmtMb(m.ram)} minne · ${m.gfx}${m.vram ? ' · ' + fmtMb(m.vram) + ' videominne' : ''}${m.sound ? ' · ljudkort' : ' · PC-högtalare'}</small></div><button class="btn btn-small" data-rebuild>🔩 Byt delar</button></div>
    <p style="font-size:18px;margin:0 0 8px">Tidstypiska spel. FPS-räknaren visar hur datorn orkar – för lite minne eller fel grafikkort ger felmeddelande, precis som förr.</p>
    <div class="plist">${rows || '<p>Inga PC-spel än det här året.</p>'}</div>`;
  const dlg = openModal('🎮 Spela på speldatorn', body, [{ label: 'Stäng', onClick: closeModal }]);
  dlg.classList.add('dlg-wide');
  dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(shop.icon(shop.part[el.dataset.icon], 44, 38)));
  dlg.querySelectorAll('[data-play]').forEach((b) => (b.onclick = () => { closeModal(); onPlay(shop.part[b.dataset.play], m, evaluate(b.dataset.play, m)); }));
  dlg.querySelector('[data-rebuild]').onclick = () => { closeModal(); onRebuild?.(); };
}


// ---------- TV-hörnan: välj konsol och spel att prova ----------
export function openTvMenu(game, shownConsoles, onPlay) {
  const shop = game.shop, y = game.year;
  const cons = shownConsoles.length ? shownConsoles : [];
  if (!cons.length) { toast('Inga konsoler står i TV-hörnan – köp in hos 🛒 Grossisten och ställ ut dem.', ''); return openShowcase(game, { cats: ['konsol'], title: 'TV-hörnan' }); }
  const blocks = cons.map((c) => {
    const all = shop.products.gamesFor(c.look.shape).filter((g) => g.year <= y);
    const owned = all.filter((g) => game.stockFree(g.id) > 0);
    const demo = !owned.length && all.length ? [all.sort((a, b) => shop.hypeAt(b, y) - shop.hypeAt(a, y))[0]] : [];
    const list = owned.length ? owned : demo;
    const rows = list.map((g) => `<div class="prow gamerow"><span data-icon="${g.id}"></span><div><div class="nm">${esc(g.name)} <small style="color:var(--muted)">${g.year}</small></div><div class="sp">${owned.length ? `${game.stockFree(g.id)} i lager` : 'demoexemplar – köp in spelet så säljer det'}</div></div><button class="btn btn-small btn-go" data-play="${g.id}" data-con="${c.id}">▶ Spela</button></div>`).join('');
    return `<h3 style="margin:10px 0 4px"><span data-icon="${c.id}" style="display:inline-block;vertical-align:middle"></span> ${esc(c.name)}</h3><div class="plist">${rows || '<p class="sp">Inga spel till den här konsolen än.</p>'}</div>`;
  }).join('');
  const body = `<p style="font-size:18px;margin:0 0 6px">Prova konsolerna som står framme. Kunder som ser dig spela vill köpa – och den som köper konsolen kommer tillbaka efter spel.</p>${blocks}`;
  const dlg = openModal('📺 TV-hörnan', body, [{ label: 'Stäng', onClick: closeModal }]);
  dlg.classList.add('dlg-wide');
  dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(shop.icon(shop.part[el.dataset.icon], 44, 38)));
  dlg.querySelectorAll('[data-play]').forEach((b) => (b.onclick = () => { closeModal(); onPlay(shop.part[b.dataset.play], shop.part[b.dataset.con]); }));
}

// egna modeller och händelser (ui-models.js)
export { openModels, showReview, openEvent, openNews } from './ui-models.js';
export { openStaff } from './ui-staff.js';
