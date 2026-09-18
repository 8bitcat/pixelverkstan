// Egna datormodeller och händelser – dialogerna. Logiken ligger i shops/dator/models.js och
// events.js; allt som ändrar spelet går via act() så att det fungerar i co-op.
import { openModal, closeModal, modalOpen, doAct as act, toast } from './ui.js';
import { fmt } from './game.js';
import { stageFor, bars } from './rival.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const W = { wiz: null };
const isFloppy = (p) => String(p.kind || '').startsWith('floppy');

const stateTag = (m) => m.state === 'sale' ? '<span class="mtag sale">säljs</span>' : m.state === 'recension' ? '<span class="mtag wait">testas av Datormagazin</span>' : m.state === 'utgangen' ? '<span class="mtag old">ur tiden</span>' : '<span class="mtag old">nedlagd</span>';

function modelCard(game, m) {
  const MOD = game.shop.models, units = game.modelUnits(m), list = MOD.partsOf(m.parts);
  const cost = MOD.costOf(list), r = m.review;
  const stars = r ? `<b>${r.total}/40</b> ${r.hof ? '🏆' : ''} <small>(${r.scores.join(' · ')})</small>` : '<small>väntar på recension …</small>';
  const canBuy = m.state === 'sale' || m.state === 'recension';
  return `<div class="mcard-m" data-m="${m.id}"><div>
      <div class="nm">${esc(m.name)} <small style="font:16px var(--font);color:var(--muted)">${m.year}${m.gen > 1 ? ` · generation ${m.gen}` : ''}</small></div>
      <div class="st">${MOD.USE[m.use]?.icon || ''} ${esc(MOD.useName(m.use))} · ${MOD.AUD[m.aud]?.icon || ''} ${esc(MOD.audName(m.aud))} · <b>${fmt(m.price)} kr</b> (inköp ${fmt(cost)} kr)</div>
      <div class="st">${stateTag(m)} ${stars}</div>
      <div class="st">sålda <b>${m.sold}</b> · intäkt <b>${fmt(m.earned)} kr</b>${m.lost ? ` · missade <b>${m.lost}</b>` : ''} · hype <span class="hype" title="hype"><i style="width:${Math.round(Math.min(1, m.hype / 1.5) * 100)}%"></i></span> · delar till <b>${units}</b> st</div>
    </div><div class="mbtns">
      ${canBuy ? `<button class="btn btn-small btn-gold" data-buyn="${m.id}">📦 Delar till 3 st</button>` : ''}
      ${r ? `<button class="btn btn-small" data-rev="${m.id}">📰 Recensionen</button>` : ''}
      ${m.state !== 'retired' ? `<button class="btn btn-small btn-go" data-seq="${m.id}">⏭ Uppföljare</button>` : ''}
      ${m.state === 'sale' || m.state === 'utgangen' ? `<button class="btn btn-small btn-red" data-ret="${m.id}">Lägg ner</button>` : ''}
    </div></div>`;
}

export function openModels(game) {
  const MOD = game.shop.models;
  if (!MOD) return;
  W.wiz = null;
  const render = () => {
    if (W.wiz) return renderWizard(game, render);
    const list = [...(game.models || [])].sort((a, b) => (a.state === 'retired') - (b.state === 'retired') || b.id - a.id);
    const body = `<p style="font-size:18px;margin:0 0 8px">Sätt ihop en egen modell, sätt pris och lansera. Datormagazin testar den – bra betyg säljer via postorder i månader, och kunder kommer in och frågar efter den med namn. När delarna går ur tiden gör du en uppföljare.</p>
      ${list.length ? `<div class="mlist">${list.map((m) => modelCard(game, m)).join('')}</div>` : '<p style="font-size:19px">Inga modeller än – tryck på <b>＋ Ny modell</b>.</p>'}`;
    const dlg = openModal('🧩 Egna modeller', body, [
      { label: '＋ Ny modell', cls: 'btn-gold', onClick: () => { W.wiz = newWiz(game); render(); } },
      { label: 'Stäng', onClick: closeModal }]);
    dlg.classList.add('dlg-wide');
    dlg.querySelectorAll('[data-buyn]').forEach((b) => (b.onclick = () => { if (act('buyForModel', { id: +b.dataset.buyn, n: 3 }) !== false) toast('🚚 Delarna kommer i nästa låda.', 'good'); render(); }));
    dlg.querySelectorAll('[data-rev]').forEach((b) => (b.onclick = () => showReview(game, game.modelOf(+b.dataset.rev), () => openModels(game))));
    dlg.querySelectorAll('[data-ret]').forEach((b) => (b.onclick = () => { act('retireModel', { id: +b.dataset.ret }); render(); }));
    dlg.querySelectorAll('[data-seq]').forEach((b) => (b.onclick = () => { const prev = game.modelOf(+b.dataset.seq); if (!prev) return; W.wiz = newWiz(game, prev); render(); }));
  };
  render();
}

function newWiz(game, prev = null) {
  const MOD = game.shop.models, y = game.year, allow = (p) => game.canSell(p);
  if (prev) return { step: 1, use: prev.use, aud: prev.aud, parts: MOD.sequelOf(prev, y, allow), name: MOD.nextName(prev.name), price: null, campaign: 'ingen', prevId: prev.id };
  return { step: 0, use: 'gamer', aud: 'tonaring', parts: [], name: '', price: null, campaign: 'ingen', prevId: null };
}

function renderWizard(game, back) {
  const MOD = game.shop.models, shop = game.shop, y = game.year, w = W.wiz, allow = (p) => game.canSell(p);
  const steps = ['1 Koncept', '2 Delar', '3 Pris & lansering'];
  const head = `<div class="wiz-steps">${steps.map((s, i) => `<span class="${i === w.step ? 'on' : ''}">${s}</span>`).join('')}</div>`;
  let body = '', buttons = [];
  if (w.step === 0) {
    body = `${head}<h3>Vad är det för dator?</h3><div class="pick-grid">${MOD.USES.map((u) => `<button class="pick-card ${w.use === u.id ? 'on' : ''}" data-use="${u.id}"><span class="big">${u.icon}</span><b>${esc(u.name)}</b><small>${esc(u.desc)}</small></button>`).join('')}</div>
      <h3>Vem ska köpa den?</h3><div class="pick-grid">${MOD.AUDS.map((a) => `<button class="pick-card ${w.aud === a.id ? 'on' : ''}" data-aud="${a.id}"><span class="big">${a.icon}</span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></button>`).join('')}</div>
      <p class="sp" style="font-size:16px;margin:8px 0 0">Vissa kombinationer går hem, andra inte – Datormagazin avslöjar vilka.</p>`;
    buttons = [{ label: '← Avbryt', onClick: () => { W.wiz = null; back(); } },
      { label: 'Nästa: delar →', cls: 'btn-go', onClick: () => { w.step = 1; if (!w.parts.length) w.parts = MOD.suggestParts(w.use, y, allow) || []; back(); } }];
  } else if (w.step === 1) {
    const list = MOD.partsOf(w.parts), probs = MOD.problems(w.parts, y, allow), P = MOD.byCat(list), req = MOD.requiredCats(P);
    const rows = list.map((p, i) => `<div class="prow"><span data-icon="${p.id}"></span><div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.cats[p.cat].name)} · ${esc(shop.specLine(p))} · tier ${p.tier} · ${fmt(p.cost)} kr</div></div>
      <div style="display:flex;gap:4px"><button class="btn btn-small" data-swap="${i}">Byt</button>${!req.includes(p.cat) ? `<button class="btn btn-small btn-red" data-drop="${i}" title="Ta bort">✕</button>` : ''}</div></div>`).join('');
    const addable = MOD.OPTIONAL_CATS.filter((c) => (c === 'media' ? list.filter((p) => p.cat === 'media').length < 2 : !P[c]));
    body = `${head}<h3>${MOD.USE[w.use].icon} ${esc(MOD.USE[w.use].name)} för ${esc(MOD.AUD[w.aud].name.toLowerCase())}</h3>
      <div class="plist">${rows || '<p class="sp">Inga delar än – tryck på 🎲 Auto-förslag.</p>'}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-small" data-auto>🎲 Auto-förslag</button>${addable.map((c) => `<button class="btn btn-small" data-add="${c}">➕ ${esc(shop.cats[c].name)}</button>`).join('')}</div>
      ${probs.length ? `<p class="prob">⚠️ ${probs.map(esc).join(' · ')}</p>` : `<p class="ok" style="font-size:18px">✓ Går att bygga. Inköp ${fmt(MOD.costOf(list))} kr per dator.</p>`}`;
    buttons = [{ label: '← Koncept', onClick: () => { w.step = 0; back(); } },
      { label: 'Nästa: pris →', cls: 'btn-go', disabled: probs.length > 0, onClick: () => { w.step = 2; back(); } }];
  } else {
    const list = MOD.partsOf(w.parts), pi = MOD.priceInfo(list, 0, w.aud, y);
    if (w.price == null) w.price = pi.suggested;
    if (!w.name) w.name = MOD.nameFor(w.parts, w.use);
    const p2 = MOD.priceInfo(list, w.price, w.aud, y);
    const camps = MOD.campaignsFor(y);
    const hint = p2.margin > p2.target + 0.25 ? 'kommer att tycka att det är dyrt.' : p2.margin < p2.target - 0.15 ? 'kommer att tycka att det är ett fynd – men du tjänar mindre per dator.' : 'tycker nog att priset är rimligt.';
    body = `${head}<h3>Namn</h3><input id="m-name" maxlength="32" value="${esc(w.name)}" style="font:24px var(--head);border:3px solid var(--ink);padding:4px 8px;width:100%;box-sizing:border-box">
      <h3>Pris</h3><div class="pricebox"><button class="btn btn-small" data-dp="-500">−500</button><button class="btn btn-small" data-dp="-100">−100</button><input id="m-price" type="number" step="100" min="100" value="${w.price}"><span>kr</span><button class="btn btn-small" data-dp="100">+100</button><button class="btn btn-small" data-dp="500">+500</button></div>
      <p class="sp" style="font-size:17px;margin:6px 0">Inköp ${fmt(p2.cost)} kr · marginal <b>${Math.round(p2.margin * 100)} %</b> · föreslaget ${fmt(pi.suggested)} kr. ${esc(MOD.AUD[w.aud].name)} ${hint}</p>
      <h3>Lanseringskampanj</h3><div class="pick-grid">${camps.map((c) => `<button class="pick-card ${w.campaign === c.id ? 'on' : ''}" data-camp="${c.id}"><span class="big">${c.icon}</span><b>${esc(c.name)}</b><small>${esc(c.desc)}</small><small><b>${c.cost ? fmt(c.cost) + ' kr' : 'gratis'}</b></small></button>`).join('')}</div>`;
    const camp = camps.find((c) => c.id === w.campaign) || camps[0];
    buttons = [{ label: '← Delar', onClick: () => { w.step = 1; back(); } },
      { label: `🚀 Lansera${camp.cost ? ` (${fmt(camp.cost)} kr)` : ''}`, cls: 'btn-gold', disabled: camp.cost > game.money, onClick: () => {
        const id = act('createModel', { spec: { name: w.name, use: w.use, aud: w.aud, parts: w.parts, price: w.price, campaign: w.campaign, prevId: w.prevId } });
        if (id === false || id === null) return back();
        W.wiz = null; back();
      } }];
  }
  const dlg = openModal(w.prevId ? '⏭ Uppföljare' : '🧩 Ny modell', body, buttons);
  dlg.classList.add('dlg-wide');
  dlg.querySelectorAll('[data-use]').forEach((b) => (b.onclick = () => { w.use = b.dataset.use; w.parts = []; back(); }));
  dlg.querySelectorAll('[data-aud]').forEach((b) => (b.onclick = () => { w.aud = b.dataset.aud; back(); }));
  dlg.querySelector('[data-auto]')?.addEventListener('click', () => { w.parts = MOD.suggestParts(w.use, y, allow) || w.parts; back(); });
  dlg.querySelectorAll('[data-add]').forEach((b) => (b.onclick = () => openPicker(game, b.dataset.add, null, back)));
  dlg.querySelectorAll('[data-swap]').forEach((b) => (b.onclick = () => { const i = +b.dataset.swap; const p = MOD.partsOf(w.parts)[i]; if (p) openPicker(game, p.cat, i, back); }));
  dlg.querySelectorAll('[data-drop]').forEach((b) => (b.onclick = () => { w.parts.splice(+b.dataset.drop, 1); back(); }));
  dlg.querySelectorAll('[data-dp]').forEach((b) => (b.onclick = () => { w.price = Math.max(100, (w.price || 0) + +b.dataset.dp); back(); }));
  dlg.querySelectorAll('[data-camp]').forEach((b) => (b.onclick = () => { w.campaign = b.dataset.camp; back(); }));
  const nm = dlg.querySelector('#m-name'); if (nm) nm.oninput = () => { w.name = nm.value; };
  const pr = dlg.querySelector('#m-price'); if (pr) pr.onchange = () => { w.price = Math.max(100, Math.round((+pr.value || 0) / 10) * 10); back(); };
  dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(shop.icon(shop.part[el.dataset.icon], 44, 38)));
}

// välj en del ur årets grossistkatalog som passar ihop med resten
function openPicker(game, cat, index, back) {
  const MOD = game.shop.models, shop = game.shop, y = game.year, w = W.wiz;
  const cur = MOD.partsOf(w.parts), others = cur.filter((p, i) => i !== index);
  const hasFloppy = others.some((p) => p.cat === 'media' && isFloppy(p)), hasOptical = others.some((p) => p.cat === 'media' && !isFloppy(p));
  const list = shop.onSale(y).filter((p) => p.cat === cat && game.canSell(p) && shop.fitsWith(p, others, y) && (cat !== 'media' || (isFloppy(p) ? !hasFloppy : !hasOptical)))
    .sort((a, b) => a.tier - b.tier || a.cost - b.cost);
  const rows = list.map((p) => `<div class="prow"><span data-icon="${p.id}"></span><div><div class="nm">${esc(p.name)}</div><div class="sp">${esc(shop.specLine(p))} · tier ${p.tier} · ${p.year}${game.stockFree(p.id) ? ` · <b>${game.stockFree(p.id)} i lager</b>` : ''}</div></div><button class="btn btn-small btn-go" data-pick="${p.id}">${fmt(p.cost)} kr</button></div>`).join('');
  const dlg = openModal(`Välj ${esc(shop.cats[cat].name.toLowerCase())}`, `<div class="plist">${rows || '<p class="sp">Inget som passar ihop med resten i år.</p>'}</div>`, [{ label: '← Tillbaka', onClick: back }]);
  dlg.classList.add('dlg-wide');
  dlg.querySelectorAll('[data-pick]').forEach((b) => (b.onclick = () => { if (index == null) w.parts.push(b.dataset.pick); else w.parts[index] = b.dataset.pick; w.parts = MOD.sortIds(w.parts); back(); }));
  dlg.querySelectorAll('[data-icon]').forEach((el) => el.replaceWith(shop.icon(shop.part[el.dataset.icon], 44, 38)));
}

// ---------- Datormagazins recension ----------
export function showReview(game, m, onClose = null) {
  if (!m?.review) return;
  // väntar tills spelaren är i butiken utan annan dialog
  if (!onClose && (modalOpen() || document.body.dataset.screen !== 'shop')) return void setTimeout(() => showReview(game, m), 1500);
  const MOD = game.shop.models, r = m.review;
  const rows = MOD.CRITICS.map((c, i) => `<div class="critic"><div class="ico">${c.icon}</div><div><div class="nm">${esc(c.name)} <small style="font:15px var(--font);color:var(--muted)">${esc(c.who)} · tittar på ${esc(c.looks)}</small></div><div class="q">”${esc(r.quotes[i])}”</div></div><div class="sc ${r.scores[i] >= 8 ? 'hi' : r.scores[i] <= 4 ? 'lo' : ''}">${r.scores[i]}<small style="font-size:16px">/10</small></div></div>`).join('');
  const verdict = r.hof ? '🏆 <b>Hall of Fame!</b> Kunderna kommer att fråga efter den med namn.' : r.total >= 26 ? '👍 Bra betyg – den kommer att sälja.' : r.total >= 18 ? '😐 Ljummet. Den säljer, men inte av sig själv.' : '👎 Sågad. Gör en uppföljare med bättre delar eller rätt pris.';
  const body = `<p style="font-size:18px;margin:0 0 8px"><b>${esc(m.name)}</b> – ${esc(MOD.useName(m.use).toLowerCase())} för ${esc(MOD.audName(m.aud).toLowerCase())}, ${fmt(m.price)} kr.</p>
    <div class="review">${rows}</div><p class="total">${r.total}/40</p><p style="font-size:19px;text-align:center;margin:4px 0 0">${verdict}</p>`;
  openModal('📰 Datormagazin testar', body, [{ label: onClose ? '← Modellerna' : 'Till modellerna', onClick: () => (onClose ? onClose() : openModels(game)) }, { label: 'Stäng', onClick: closeModal }]);
}

// ---------- Händelser: nyheten och valet ----------
export function openEvent(game, ev) {
  if (!ev || !game.shop.events) return;
  if (modalOpen() || document.body.dataset.screen !== 'shop') return void setTimeout(() => openEvent(game, ev), 1500);
  if (game.events?.pending !== ev.id) return;
  const E = game.shop.events;
  const body = `<div class="event-card"><div class="big">${ev.icon}</div><h3>${esc(ev.title)}</h3><small style="color:var(--muted)">${ev.year}</small><p>${esc(ev.text)}</p></div>
    <div class="choices">${ev.choices.map((c) => {
      const need = E.needText(c.need, game), poor = (c.cost || 0) > game.money;
      return `<button class="choice" data-choice="${c.id}" ${need || poor ? 'disabled' : ''}><span><b>${esc(c.label)}</b>${need ? `<small>🔒 ${esc(need)}</small>` : poor ? '<small>🔒 inte tillräckligt med pengar</small>' : ''}</span><span>${c.cost ? `−${fmt(c.cost)} kr` : ''}</span></button>`;
    }).join('')}</div>`;
  const dlg = openModal(`📰 ${ev.year}: ${esc(ev.title)}`, body, [], { closable: false });
  dlg.querySelectorAll('[data-choice]').forEach((b) => (b.onclick = () => { if (act('chooseEvent', { id: ev.id, choice: b.dataset.choice }) !== false) closeModal(); }));
}

export function openNews(game) {
  const E = game.shop.events;
  if (!E) return;
  const active = game.activeEvents || [];
  const seen = (game.events?.seen || []).map((id) => E.EVENT[id]).filter((e) => e && e.year >= game.startYear).reverse().slice(0, 12);
  const row = (icon, nm, sp) => `<div class="prow" style="grid-template-columns:44px 1fr"><span style="font-size:28px;text-align:center">${icon}</span><div><div class="nm">${nm}</div>${sp ? `<div class="sp">${sp}</div>` : ''}</div></div>`;
  const st = stageFor(game.year), rv = game.rival;
  const rival = rv ? `<div class="news"><b>🏬 Konkurrent: ${esc(st.name)}</b> <small>(${esc(st.kind)})</small><i>${esc(st.desc)}</i><i>Styrka ${bars(rv.strength)} – sjunker med ditt rykte, din dragningskraft och din personal. Ju starkare, desto fler kunder går över gatan.</i></div>` : '';
  const awards = (game.awards || []).length ? `<h3>Priser</h3><div class="plist">${game.awards.map((a) => row('🏆', `${a.year} · ${esc(a.title)}`, a.medals.map((m) => `${m.medal} ${esc(m.name)}`).join(' · '))).join('')}</div>` : '';
  const body = `${rival}${awards}<h3>Pågår</h3>${active.length ? `<div class="plist">${active.map((a) => row(a.ev.icon, esc(a.ev.title), `${esc(a.ev.choices.find((c) => c.id === a.choice)?.label || '')} · till och med ${a.until}`)).join('')}</div>` : '<p class="sp" style="font-size:17px">Inget särskilt just nu.</p>'}
    ${game.bulk?.length ? `<h3>Avtal</h3><div class="plist">${game.bulk.map((b) => row('🏢', esc(b.name), `${b.left} st ${esc(game.shop.models?.useName(b.use) || b.use)} kvar att leverera · senast ${b.until}`)).join('')}</div>` : ''}
    <h3>Tidigare</h3>${seen.length ? `<div class="plist">${seen.map((e) => row(e.icon, `${e.year} · ${esc(e.title)}`, '')).join('')}</div>` : '<p class="sp" style="font-size:17px">Inget än.</p>'}`;
  openModal('📰 Händelser', body, [{ label: 'Stäng', onClick: closeModal }]);
}
