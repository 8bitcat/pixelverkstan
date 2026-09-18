// Avtal: välj grossist och gå med i märkesprogram. Logiken ligger i game (supplier/partners);
// allt som ändrar spelet går via act().
import { openModal, closeModal, doAct as act } from './ui.js';
import { fmt } from './game.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function openSuppliers(game, back = null) {
  const S = game.shop.suppliers;
  if (!S) return;
  const render = () => {
    const y = game.year, idx = game.priceIdx, cur = game.supplier || 'lokal';
    const sups = S.suppliersFor(y).map((s) => {
      const fee = Math.round(s.fee * idx / 50) * 50, on = s.id === cur;
      return `<div class="prow avrow ${on ? 'on' : ''}" style="grid-template-columns:44px 1fr auto"><span style="font-size:30px;text-align:center">${s.icon}</span><div><div class="nm">${esc(s.name)}${on ? ' <span class="owned">✓ din grossist</span>' : ''}</div><div class="sp">${esc(s.desc)}</div>
        <div class="chips"><i>${s.disc ? `−${Math.round(s.disc * 100)} % på allt` : 'ordinarie pris'}</i><i>leverans ${s.time === 1 ? 'snabb' : `×${s.time}`}</i><i>${fee ? `${fmt(fee)} kr/mån` : 'ingen avgift'}</i>${s.risk ? `<i>${Math.round(s.risk * 100)} % risk för trasig del</i>` : ''}</div></div>
        ${on ? '' : `<button class="btn btn-small btn-go" data-sup="${s.id}">Byt hit</button>`}</div>`;
    }).join('');
    const parts = S.partnersFor(y).map((p) => {
      const fee = Math.round(p.fee * idx / 50) * 50, on = (game.partners || []).includes(p.brand), booth = S.hasBooth(game.fit, p.brand);
      return `<div class="prow avrow ${on ? 'on' : ''}" style="grid-template-columns:44px 1fr auto"><span style="font-size:30px;text-align:center">${p.icon}</span><div><div class="nm">${esc(p.name)}${on ? ' <span class="owned">✓ medlem</span>' : ''}</div><div class="sp">${esc(p.desc)}</div>
        <div class="chips"><i>−${Math.round(p.disc * 100)} % på ${esc(p.brand.toUpperCase())}-delar</i><i>🪧 +${p.drag} dragningskraft</i><i>${fmt(fee)} kr/mån</i>${booth ? '' : `<i class="bad">kräver ${esc(p.brand)}-monter nivå 2</i>`}</div></div>
        ${on ? `<button class="btn btn-small btn-red" data-leave="${p.brand}">Lämna</button>` : `<button class="btn btn-small btn-gold" data-join="${p.brand}" ${booth && fee <= game.money ? '' : 'disabled'}>Gå med</button>`}</div>`;
    }).join('');
    const fees = game.monthlyFees ? game.monthlyFees() : 0;
    const body = `<p style="font-size:18px;margin:0 0 8px">Grossisten avgör pris, leveranstid och avgift. Ett <b>märkesprogram</b> kräver ett märkesbås av märket (nivå 2 eller högre) under 🏪 Butiken och ger rabatt på just det märket plus en skylt som drar kunder.${fees ? ` Just nu betalar du <b>${fmt(fees)} kr</b> i månaden i avgifter.` : ''}</p>
      <h3>🚚 Grossist</h3><div class="plist">${sups}</div>
      <h3>🤝 Märkesprogram ${y}</h3><div class="plist">${parts || '<p class="sp">Inga program i år.</p>'}</div>`;
    const dlg = openModal('🤝 Avtal', body, [{ label: back ? '← Grossisten' : 'Stäng', onClick: () => (back ? back() : closeModal()) }]);
    dlg.classList.add('dlg-wide');
    dlg.querySelectorAll('[data-sup]').forEach((b) => (b.onclick = () => { act('setSupplier', { id: b.dataset.sup }); render(); }));
    dlg.querySelectorAll('[data-join]').forEach((b) => (b.onclick = () => { act('joinPartner', { brand: b.dataset.join }); render(); }));
    dlg.querySelectorAll('[data-leave]').forEach((b) => (b.onclick = () => { act('leavePartner', { brand: b.dataset.leave }); render(); }));
  };
  render();
}
