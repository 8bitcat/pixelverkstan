// Byggvyns DOM-delar: låda (delar/kablar/kontakter), checklista, guide och lägesval.
import { portrait } from './people.js';
import { fmt } from './game.js';
import { openModal, closeModal } from './ui.js';

const $ = (s) => document.querySelector(s);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const PREF = 'pixelverkstan_mode';
export function modePref() { try { return localStorage.getItem(PREF) || 'help'; } catch { return 'help'; } }

export function chooseMode(view, onPick) {
  const pref = modePref();
  const body = `<p style="font-size:21px;margin-top:0">Hur vill du bygga <b>${esc(view.order.title.toLowerCase())}</b> åt ${esc(view.order.name)}?</p>
    <div class="plist">
      <div class="prow" style="grid-template-columns:44px 1fr"><span style="font-size:32px">🧑‍🔧</span><div><div class="nm">Med hjälp</div><div class="sp">Gula markeringar visar var allt ska sitta, checklista steg för steg och förklaringar när något blir fel.</div></div></div>
      <div class="prow" style="grid-template-columns:44px 1fr"><span style="font-size:32px">😎</span><div><div class="nm">Utan hjälp – proffsläge</div><div class="sp">Inga markeringar eller tips. Glömmer du en kabel märks det först när du startar datorn. <b>+15 % betalt.</b></div></div></div>
    </div>`;
  const pick = (m) => { try { localStorage.setItem(PREF, m); } catch {} closeModal(); onPick(m === 'help'); };
  openModal('Välj byggläge', body, [
    { label: '🧑‍🔧 Med hjälp', cls: pref === 'help' ? 'btn-go' : '', onClick: () => pick('help') },
    { label: '😎 Utan hjälp', cls: pref === 'pro' ? 'btn-go' : 'btn-gold', onClick: () => pick('pro') },
  ], { closable: false });
}

// ---------- Låda ----------
export function renderTray(view) {
  const tray = $('#build-tray');
  tray.innerHTML = '';
  const entries = view.trayEntries();
  const hint = view.help ? view.nextStep() : null;
  let lastGroup = null;
  for (const e of entries) {
    const group = e.kind === 'part' ? (e.choice ? 'choice:' + e.part.cat : 'parts') : e.kind;
    if (group !== lastGroup) {
      lastGroup = group;
      const title = e.kind === 'cable' ? '🔌 Kablar:' : e.kind === 'plug' ? '🖱️ Koppla in:' : e.choice ? `Välj ${esc(view.shop.cats[e.part.cat].name.toLowerCase())}:` : '';
      if (title) { const lab = document.createElement('div'); lab.className = 'tray-empty'; lab.innerHTML = title; tray.append(lab); }
    }
    const el = document.createElement('div');
    const isHint = hint && hint.entryKey === e.key;
    el.className = 'tray-item' + (e.choice ? ' choice' : '') + (e.kind !== 'part' ? ' cable' : '') + (view.selected === e.key ? ' sel' : '') + (isHint ? ' hint' : '');
    el.append(view.entryIcon(e, 64, 54));
    const tag = e.kind === 'part' ? view.shop.partTag?.(e.part) : '';
    const sub = e.kind === 'part' ? (e.choice ? `i lager: ${e.count}` : tag || view.shop.cats[e.part.cat].name) : (e.sub || '');
    el.insertAdjacentHTML('beforeend', `<div class="nm">${esc(e.name)}</div><div class="ct">${esc(sub)}</div>`);
    el.addEventListener('pointerdown', (ev) => view.onTrayDown(ev, e));
    tray.append(el);
  }
  if (!entries.length) tray.insertAdjacentHTML('beforeend', `<div class="tray-empty">${esc(view.trayEmptyText())}</div>`);
}

// ---------- Checklista ----------
export function renderSheet(view) {
  const o = view.order, b = view.b;
  const step = (done, now, text, extra = '') => `<div class="step ${done ? 'done' : now ? 'now' : ''}"><span class="bx">${done ? '✓' : ''}</span><span>${text}</span>${extra}</div>`;
  const placed = view.itemsPlaced();
  const doneN = placed.filter(Boolean).length;
  let h = `<div class="sheet-sum"><span>📋 ${doneN}/${o.items.length} delar · ${Math.floor(b.time)} s · ${b.errors} fel</span><button class="btn btn-small" id="sheet-toggle">${view.sheetOpen ? 'Dölj ▴' : 'Lista ▾'}</button></div>`;
  h += `<div class="sheet-h">Beställning</div><div class="who" style="margin-bottom:6px"><span id="sheet-face"></span><div><b>${esc(o.name)}</b><br><small>${esc(o.title)}</small><br><small>${b.help ? '🧑‍🔧 Med hjälp' : '😎 Utan hjälp'}</small></div></div>`;
  h += `<div class="sheet-h">Delar</div>`;
  o.items.forEach((it, i) => {
    const pp = it.part ? view.shop.part[it.part] : null, tag = pp ? view.shop.partTag?.(pp) : '';
    const name = pp ? pp.name + (tag ? ` · ${tag}` : '') : (o.chosen[it.cat] ? view.shop.part[o.chosen[it.cat]].name + ' (ditt val)' : `Valfri: ${view.shop.cats[it.cat].name.toLowerCase()}`);
    h += step(placed[i], false, esc(name));
  });
  if (b.help) {
    const steps = view.steps().filter((s) => s.kind !== 'slot');
    const next = view.nextStep();
    const acts = steps.filter((s) => s.kind === 'act'), cables = steps.filter((s) => s.kind === 'cable');
    if (acts.length) { h += `<div class="sheet-h">Montering</div>`; for (const s of acts) h += step(s.done, next && next.key === s.key, esc(s.label)); }
    if (cables.length) { h += `<div class="sheet-h">Kablar</div>`; for (const s of cables) h += step(s.done, next && next.key === s.key, '🔌 ' + esc(s.label)); }
    h += `<div class="sheet-h">Testa datorn</div>`;
    h += step(b.phase === 'desk', next?.kind === 'stand', '🖥️ Ställ upp datorn på skrivbordet');
    if (view.finale) for (const s of view.finale.steps()) h += step(s.done, s.now, esc(s.label));
  } else {
    h += `<div class="sheet-h">Testa datorn</div>`;
    h += step(b.phase === 'desk', false, '🖥️ Ställ upp datorn');
    h += step(false, false, '⏻ Starta och kontrollera');
  }
  h += `<div class="sheet-h">Betalning</div><div class="step"><span>Kunden betalar${o.items.some((i) => i.choice) ? ' ca' : ''}</span><b style="margin-left:auto">${fmt(view.shop.priceFor(o, o.chosen))} kr</b></div>`;
  if (!b.help) h += `<div class="step"><span>😎 Proffsbonus</span><b style="margin-left:auto">+15 %</b></div>`;
  $('#build-sheet').innerHTML = h;
  $('#build-sheet').classList.toggle('open', !!view.sheetOpen);
  $('#sheet-toggle').onclick = () => { view.sheetOpen = !view.sheetOpen; renderSheet(view); requestAnimationFrame(() => view.resize()); };
  const cust = view.game.customers.find((c) => c.id === o.customerId);
  if (cust) $('#sheet-face').append(portrait(cust.look));
}

// ---------- Guide ----------
export function renderGuide(view) {
  const el = $('#build-guide');
  let html = '', kind = 'info';
  const m = view.msg;
  if (m && (view.t - m.t < 7 || m.kind !== 'info' || !view.help)) { html = m.html; kind = m.kind; }
  else if (view.help) { html = view.hintText() || ''; }
  const key = kind + html;
  if (key === view.guideKey) return;
  view.guideKey = key;
  const face = { info: '🧑‍🔧', fact: '📘', err: '⚠️', good: '🎉' }[kind] || '🧑‍🔧';
  el.innerHTML = html ? `<div class="guide ${kind}"><span class="face">${face}</span><span>${html}</span></div>` : '';
  el.querySelectorAll('[data-act]').forEach((btn) => (btn.onclick = () => view.guideAction(btn.dataset.act)));
}
