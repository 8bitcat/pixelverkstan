// DOM-gränssnitt: HUD, beställningskort, dialoger (kund, grossist, resultat).
import { portrait } from './people.js';
import { fmt } from './game.js';

const $ = (s) => document.querySelector(s);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function toast(text, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind; el.textContent = text;
  $('#toasts').append(el);
  setTimeout(() => el.remove(), 3100);
}

// ---------- Modal ----------
export function openModal(title, bodyHtml, buttons = [], { closable = true } = {}) {
  const m = $('#modal');
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
  return m.querySelector('.dlg');
}
export function closeModal() { $('#modal').classList.add('hidden'); $('#modal').innerHTML = ''; }
export const modalOpen = () => !$('#modal').classList.contains('hidden');

// ---------- HUD ----------
export function renderHud(game, h) {
  const li = game.levelInfo();
  $('#hud').innerHTML = `
    <div class="chip money">💰 ${fmt(game.money)} kr</div>
    <div class="chip" title="${li.next ? `Nästa nivå: ${esc(li.next.title)}` : 'Högsta nivån!'}">⭐ ${li.level}. ${esc(li.title)} <span class="xpbar"><i style="width:${Math.round(li.frac * 100)}%"></i></span></div>
    <div class="chip">😊 ${game.stats.served}</div>
    <div class="hud-spacer"></div>
    <button class="btn" data-h="shop">🛒 Grossist</button>
    <button class="btn" data-h="menu">☰</button>`;
  $('#hud').querySelectorAll('[data-h]').forEach((b) => (b.onclick = () => h[b.dataset.h]()));
}

// ---------- Beställningskort ----------
export function renderOrders(game, onBuild) {
  const box = $('#orders');
  const cards = [];
  for (const o of game.orders) {
    const c = game.customers.find((x) => x.id === o.customerId);
    const n = o.build ? Object.keys(o.build.placed).length : 0;
    const f = c && isFinite(c.patienceMax) ? Math.max(0, c.patience / c.patienceMax) : 1;
    cards.push({ o, c, html: `<div><b>${esc(o.title)}</b><small>${esc(o.name)} · ${n}/${o.items.length} delar</small>
      <div class="pbar ${f < 0.35 ? 'low' : ''}"><i style="width:${Math.round(f * 100)}%"></i></div></div>
      <button class="btn btn-go btn-small">🔧 Bygg</button>` });
  }
  const front = game.queue()[0];
  const key = cards.map((x) => x.html).join('|') + (front?.phase === 'queue' ? 'Q' + front.id : '');
  if (key === box.dataset.key) return;
  box.dataset.key = key;
  box.innerHTML = '';
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
  const shop = game.shop, o = c.order;
  const miss = game.missingFor(o), missChoice = game.missingChoices(o);
  const buyCost = miss.reduce((s, m) => s + shop.part[m.id].cost * m.buy, 0);
  const needLeft = {};
  let rows = '';
  for (const it of o.items) {
    if (it.part) {
      const p = shop.part[it.part];
      needLeft[p.id] = (needLeft[p.id] || 0) + 1;
      const ok = game.stockFree(p.id) >= needLeft[p.id];
      rows += `<div class="prow"><span data-icon="${p.id}"></span><div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.cats[p.cat].name)} · ${esc(shop.specLine(p))}</div></div>
        <div class="st ${ok ? 'ok' : 'bad'}">${ok ? '✓ i lager' : `✗ saknas<br><small>inköp ${fmt(p.cost)} kr</small>`}</div></div>`;
    } else {
      const n = shop.parts.filter((p) => p.cat === it.cat).reduce((s, p) => s + game.stockFree(p.id), 0);
      rows += `<div class="prow"><span style="font-size:26px;text-align:center">${shop.cats[it.cat].icon}</span><div><div class="nm">Valfri: ${esc(shop.cats[it.cat].name.toLowerCase())}</div><div class="sp">Du väljer vilken när du bygger</div></div>
        <div class="st ${n ? 'ok' : 'bad'}">${n ? `✓ ${n} i lager` : '✗ inget i lager'}</div></div>`;
    }
  }
  let tip = '';
  if (o.tutorial === 0) tip = '💡 Allt kunden vill ha finns i lagret (✓). Tryck på <b>Ta emot beställningen</b>.';
  else if (o.tutorial !== undefined && miss.length) tip = '💡 Grafikkortet finns inte i lagret! Köp in det från grossisten – du har råd.';
  else if (miss.length && buyCost > game.money) tip = `😬 Du har inte råd att köpa in det som saknas (${fmt(buyCost)} kr). Tacka nej, eller sälj fler datorer först.`;
  const price = shop.priceFor(o, {});
  const body = `<div class="who">${'<span data-face></span>'}<div class="speech">${esc(o.msg)}</div></div>
    <h3 style="margin:4px 0 8px">Beställning: ${esc(o.title)}</h3>
    <div class="plist">${rows}</div>
    <div class="sum"><span>Kunden betalar${o.items.some((i) => i.choice) ? ' ca' : ''}</span><b>${fmt(price)} kr</b></div>
    <div class="sp" style="color:var(--muted)">Delarnas pris + ${fmt(shop.feeFor(o))} kr i montering.</div>
    ${tip ? `<div class="speech" style="margin:10px 0 0;background:#fff4c7">${tip}</div>` : ''}`;
  const buttons = [
    { label: 'Tacka nej', cls: 'btn-red', hidden: o.tutorial !== undefined, onClick: () => { closeModal(); h.onDecline(c); } },
    { label: `🛒 Köp in det som saknas (${fmt(buyCost)} kr)`, cls: 'btn-gold', hidden: !miss.length, disabled: buyCost > game.money,
      onClick: () => { if (game.buyMissing(o)) openOrderDialog(game, c, h); } },
    { label: '🛒 Till grossisten', hidden: !missChoice.length, onClick: () => h.onShop(missChoice[0], () => openOrderDialog(game, c, h)) },
    { label: '✓ Ta emot beställningen', cls: 'btn-go', disabled: miss.length || missChoice.length, onClick: () => { closeModal(); h.onAccept(c); } },
  ];
  const dlg = openModal(`Ny kund: ${esc(c.name)}`, body, buttons);
  dlg.querySelector('[data-face]').replaceWith(portrait(c.look));
  dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(shop.icon(shop.part[el.dataset.icon], 44, 38)));
}

// ---------- Grossist ----------
export function openShop(game, tab = null, onClose = null) {
  const shop = game.shop;
  tab ||= shop.catOrder[0];
  const render = () => {
    const tabs = shop.catOrder.map((c) => `<button class="tab ${c === tab ? 'on' : ''}" data-tab="${c}">${shop.cats[c].icon} ${esc(shop.cats[c].name)}</button>`).join('');
    let rows = '';
    for (const p of shop.parts.filter((x) => x.cat === tab)) {
      const locked = p.lvl > game.level;
      rows += `<div class="prow shoprow" style="${locked ? 'opacity:.55' : ''}"><span data-icon="${p.id}"></span>
        <div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.specLine(p))}</div></div>
        <div class="own">i lager<br><b>${game.stockFree(p.id)}</b></div>
        ${locked ? `<button class="btn btn-small" disabled>🔒 Nivå ${p.lvl}</button>` : `<button class="btn btn-small btn-gold" data-buy="${p.id}" ${p.cost > game.money ? 'disabled' : ''}>Köp ${fmt(p.cost)} kr</button>`}</div>`;
    }
    const dlg = openModal(`🛒 Grossisten <small style="font-size:15px;margin-left:8px">💰 ${fmt(game.money)} kr</small>`,
      `<div class="tabs">${tabs}</div><div class="plist">${rows}</div>
       <p class="sp" style="color:var(--muted)">Nya delar låses upp när butiken går upp i nivå. Kunderna beställer helst sådant du har i lager.</p>`,
      [{ label: onClose ? '← Tillbaka till kunden' : 'Stäng', onClick: () => { closeModal(); onClose?.(); } }]);
    dlg.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { tab = b.dataset.tab; render(); }));
    dlg.querySelectorAll('[data-buy]').forEach((b) => (b.onclick = () => { if (game.buy(b.dataset.buy)) { toast(`Köpt: ${shop.part[b.dataset.buy].name}`, 'good'); render(); } }));
    dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(shop.icon(shop.part[el.dataset.icon], 44, 38)));
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
  const fresh = game.shop.parts.filter((p) => p.lvl === info.level);
  const body = `<p style="font-size:19px;margin-top:0">Butiken är nu en <b>${esc(info.title)}</b>! Nya kunder med större önskemål kommer in.</p>
    ${fresh.length ? `<h3>Nytt hos grossisten</h3><div class="plist">${fresh.map((p) => `<div class="prow" style="grid-template-columns:44px 1fr"><span data-icon="${p.id}"></span><div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(game.shop.specLine(p))}</div></div></div>`).join('')}</div>` : ''}`;
  const dlg = openModal(`⭐ Nivå ${info.level}!`, body, [{ label: 'Grymt!', cls: 'btn-go', onClick: closeModal }]);
  dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(game.shop.icon(game.shop.part[el.dataset.icon], 44, 38)));
}
