// Personal – dialogen: anställda, sökande och kurser. Logiken ligger i core/staff.js; allt som
// ändrar spelet går via act() så att det fungerar i co-op.
import { openModal, closeModal, doAct as act } from './ui.js';
import { portrait } from './people.js';
import { ROLES, STATS, candidatesFor, coursesFor, maxStaff, statusOf, MONTH } from './staff.js';
import { fmt } from './game.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ST = { tab: 'anstallda' };
const bar = (v, max = 100, cls = '') => `<span class="sbar ${cls}"><i style="width:${Math.round(Math.max(0, Math.min(1, v / max)) * 100)}%"></i></span>`;
const statRow = (stats) => Object.entries(STATS).map(([k, s]) => `<span class="stat" title="${esc(s.name)}">${s.icon} ${'■'.repeat(stats[k])}${'□'.repeat(5 - stats[k])}</span>`).join(' ');

function card(game, s, hired) {
  const role = ROLES[s.role];
  return `<div class="scard" data-s="${s.id}"><span data-face="${s.id}"></span><div>
      <div class="nm">${esc(s.name)} <small>${role.icon} ${esc(role.name)}${hired ? ` · nivå ${s.level}` : ''}</small></div>
      <div class="sp">${statRow(s.stats)}</div>
      ${hired ? `<div class="sp">⚡ energi ${bar(s.energy)} 😊 humör ${bar(s.mood, 100, s.mood < 30 ? 'low' : '')}</div><div class="sp">${esc(statusOf(game, s))}${s.jobs ? ` · ${s.jobs} jobb` : ''}${s.sales ? ` · ${s.sales} kunder` : ''}${s.upsells ? ` · ${s.upsells} påslag` : ''}</div>` : `<div class="sp">${esc(role.desc)}</div>`}
      <div class="sp">💸 <b>${fmt(s.lon)} kr</b> i månaden</div>
    </div><div class="mbtns">
      ${hired ? `<button class="btn btn-small btn-gold" data-course="${s.id}" ${s.course ? 'disabled' : ''}>🎓 Kurs</button><button class="btn btn-small btn-red" data-fire="${s.id}">Sparka</button>`
        : `<button class="btn btn-small btn-go" data-hire="${s.id}" ${game.staff.length >= maxStaff(game) || game.money < s.lon ? 'disabled' : ''}>Anställ</button>`}
    </div></div>`;
}

export function openStaff(game, tab = null) {
  if (tab) ST.tab = tab;
  const render = () => {
    const max = maxStaff(game), staff = game.staff || [], lokalName = game.shop.fit?.LOKAL_NAME?.[game.lokal] || '';
    const total = staff.reduce((s, x) => s + x.lon, 0);
    const head = `<div class="fit-head"><div><b>👥 ${staff.length} av ${max} anställda</b><small>${esc(lokalName)}${max ? ` · löner ${fmt(total)} kr var ${MONTH}:e sekund` : ' · bygg ut till Gatuplan för att anställa'}</small></div></div>`;
    const tabs = [['anstallda', '👥 Anställda'], ['sokande', '📋 Sökande']].map(([id, l]) => `<button class="tab ${ST.tab === id ? 'on' : ''}" data-tab="${id}">${l}</button>`).join('');
    let body;
    if (ST.tab === 'anstallda') {
      body = staff.length ? `<div class="slist">${staff.map((s) => card(game, s, true)).join('')}</div>`
        : `<p style="font-size:19px">Ingen personal än. En <b>tekniker</b> bygger och lagar kundernas datorer medan du gör annat; en <b>säljare</b> tar emot kunder vid disken när delarna finns – och säljer på grafikkort. ${max ? 'Titta under <b>📋 Sökande</b>.' : 'Källarhålan har inte plats – bygg ut butiken under 🏪 Butiken.'}</p>`;
    } else {
      const cands = candidatesFor(game);
      body = `<p style="font-size:17px;margin:0 0 8px">Nya sökande varje år. Stats 1–5: 🔧 bygg (fart och stjärnor), 🩺 service (reparationer), 🛍️ sälj (påslag). Första månadslönen betalas vid anställningen.</p><div class="slist">${cands.map((s) => card(game, s, false)).join('')}</div>`;
    }
    const dlg = openModal('👥 Personal', `${head}<div class="tabs">${tabs}</div>${body}`, [{ label: 'Stäng', onClick: closeModal }]);
    dlg.classList.add('dlg-wide');
    dlg.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { ST.tab = b.dataset.tab; render(); }));
    dlg.querySelectorAll('[data-face]').forEach((el) => { const s = [...staff, ...(game.staffing?.cands || [])].find((x) => x.id === +el.dataset.face); if (s) el.replaceWith(portrait(s.look)); });
    dlg.querySelectorAll('[data-hire]').forEach((b) => (b.onclick = () => { if (act('hire', { id: +b.dataset.hire }) !== false) ST.tab = 'anstallda'; render(); }));
    dlg.querySelectorAll('[data-fire]').forEach((b) => (b.onclick = () => {
      const s = staff.find((x) => x.id === +b.dataset.fire);
      openModal('Sparka?', `<p style="font-size:19px">Vill du verkligen sparka <b>${esc(s?.name || '')}</b>?</p>`, [
        { label: 'Ja, sparka', cls: 'btn-red', onClick: () => { act('fire', { id: +b.dataset.fire }); render(); } },
        { label: 'Nej', onClick: render }]);
    }));
    dlg.querySelectorAll('[data-course]').forEach((b) => (b.onclick = () => openCourses(game, +b.dataset.course, render)));
  };
  render();
}

function openCourses(game, id, back) {
  const s = (game.staff || []).find((x) => x.id === id);
  if (!s) return back();
  const list = coursesFor(game);
  const rows = list.map((c) => { const full = s.stats[c.stat] >= 5; return `<div class="prow" style="grid-template-columns:44px 1fr auto"><span style="font-size:28px;text-align:center">${STATS[c.stat].icon}</span><div><div class="nm">${esc(c.name)}</div><div class="sp">${esc(c.desc || '')} · ${esc(STATS[c.stat].name)} +1 · ${c.time} s borta</div></div>
    <button class="btn btn-small btn-gold" data-take="${c.id}" ${full || c.cost > game.money ? 'disabled' : ''} title="${full ? 'kan redan allt' : ''}">${full ? '✓ max' : `${fmt(c.cost)} kr`}</button></div>`; }).join('');
  const dlg = openModal(`🎓 Kurs för ${esc(s.name)}`, `<p style="font-size:17px;margin:0 0 8px">${statRow(s.stats)}</p><div class="plist">${rows}</div>`, [{ label: '← Tillbaka', onClick: back }]);
  dlg.classList.add('dlg-wide');
  dlg.querySelectorAll('[data-take]').forEach((b) => (b.onclick = () => { act('train', { id, course: b.dataset.take }); back(); }));
}
