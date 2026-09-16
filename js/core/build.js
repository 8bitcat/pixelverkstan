// Byggvyn: dra delar från lådan till rätt plats, gör handgrepp, koppla kablar
// och starta. Generisk – reglerna kommer från shop.layout.
import { Raster } from './raster.js';
import * as D from './build-draw.js';
import { portrait } from './people.js';
import { fmt } from './game.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export class BuildView {
  constructor(game, hooks) {
    this.game = game; this.shop = game.shop; this.L = game.shop.layout; this.hooks = hooks;
    this.canvas = $('#board'); this.ctx = this.canvas.getContext('2d');
    const V = this.L.VIEW;
    this.R = new Raster(V.w, V.h); Object.assign(this.R, { k: V.k, hz: V.hz, ox: V.ox, oy: V.oy });
    this.t = 0; this.spin = 0; this.selected = null; this.drag = null; this.boot = null; this.msg = null;
    this.order = null;
    $('#build-back').onclick = () => { if (!this.boot) this.hooks.onExit(); };
    $('#build-boot').onclick = () => this.startBoot();
    this.canvas.addEventListener('pointerdown', (e) => this.onCanvasDown(e));
    window.addEventListener('pointermove', (e) => this.onDragMove(e));
    window.addEventListener('pointerup', (e) => this.onDragEnd(e));
  }

  open(order) {
    this.order = order;
    order.build ||= { placed: {}, acts: new Set(), cables: new Set(), errors: 0, time: 0, hints: order.tutorial !== undefined };
    this.selected = null; this.boot = null; this.msg = null; this.dirty = true;
    $('#build-title').innerHTML = `<span class="r">${esc(order.title)}</span> åt ${esc(order.name)}`;
    if (!Object.keys(order.build.placed).length) {
      this.say(order.guided
        ? `Välkommen till verkstaden! Nu bygger vi ${esc(order.name)}s dator steg för steg. Följ de blinkande markeringarna.`
        : `Bygg datorn åt ${esc(order.name)}. Dra delarna från lådan nedanför till rätt plats.`, 'info');
    }
    this.refresh();
    this.resize();
  }

  get b() { return this.order.build; }

  // ---------- Regler ----------
  trayEntries() {
    const o = this.order, b = this.b, out = [];
    const used = {};
    for (const p of Object.values(b.placed)) used[p.id] = (used[p.id] || 0) + 1;
    o.items.forEach((it, i) => {
      if (!it.part) return;
      if (used[it.part] > 0) { used[it.part]--; return; }
      out.push({ key: `x${i}`, part: this.shop.part[it.part], choice: false });
    });
    for (const it of o.items) {
      if (!it.choice || Object.values(b.placed).some((p) => p.cat === it.cat)) continue;
      for (const p of this.shop.parts) if (p.cat === it.cat && this.game.stockFree(p.id) > 0) out.push({ key: `c${p.id}`, part: p, choice: true, count: this.game.stockFree(p.id) });
    }
    return out;
  }

  neededCables(b = this.b) {
    return this.L.CABLES.filter((c) => c.requires.every((r) => b.placed[r]) && c.need(b));
  }
  // simulerat färdigt bygge (för att lista kablar i förväg)
  simulated() {
    const placed = {};
    for (const it of this.order.items) {
      const part = it.part ? this.shop.part[it.part] : this.shop.parts.find((p) => p.cat === it.cat);
      const slot = this.L.slotsFor(part)[0];
      if (slot) placed[slot.id] = part;
    }
    return { placed, acts: new Set(), cables: new Set() };
  }
  itemsPlaced() {
    const counts = {};
    for (const p of Object.values(this.b.placed)) counts[p.id] = (counts[p.id] || 0) + 1;
    return this.order.items.map((it) => {
      if (it.part) { if (counts[it.part] > 0) { counts[it.part]--; return true; } return false; }
      return Object.values(this.b.placed).some((p) => p.cat === it.cat);
    });
  }
  isComplete() {
    return this.itemsPlaced().every(Boolean) && this.neededCables().every((c) => this.b.cables.has(c.id));
  }

  nextStep() {
    const b = this.b, L = this.L, tray = this.trayEntries();
    for (const slot of L.SLOTS) {
      if (b.placed[slot.id]) continue;
      const entry = tray.find((e) => L.slotsFor(e.part).includes(slot));
      if (!entry) continue;
      if (L.missingReq(slot.requires, b)) {
        const act = L.ACTIONS.find((a) => slot.requires.includes('act:' + a.id) && !b.acts.has(a.id) && !L.missingReq(a.requires, b));
        if (act) return { type: 'act', act };
        continue;
      }
      return { type: 'place', slot, entry };
    }
    const c = this.neededCables().find((x) => !b.cables.has(x.id));
    if (c) return { type: 'cable', cable: c };
    if (this.isComplete()) return { type: 'boot' };
    return null;
  }

  availableActs() {
    return this.L.ACTIONS.filter((a) => !this.b.acts.has(a.id) && !this.L.missingReq(a.requires, this.b)
      && !this.L.SLOTS.some((s) => this.b.placed[s.id] && s.requires.includes('act:' + a.id)));
  }
  openCables() { return this.neededCables().filter((c) => !this.b.cables.has(c.id)); }

  // ---------- Handlingar ----------
  place(entry, slot) {
    const b = this.b, res = this.L.canPlace(slot, entry.part, b);
    if (!res.ok) { b.errors++; this.say(res.msg, 'err'); this.shake = 0.35; return false; }
    if (entry.choice) {
      if (!this.game.takeStock(entry.part.id)) return false;
      this.order.chosen[entry.part.cat] = entry.part.id;
    }
    b.placed[slot.id] = entry.part;
    this.selected = null; this.dirty = true;
    this.flash = { slot, t: 0.6 };
    this.say(`<b>${esc(this.shop.cats[entry.part.cat].name)}:</b> ${esc(this.L.fact(entry.part.cat, entry.part))}`, 'fact');
    this.refresh();
    return true;
  }

  remove(slot) {
    const b = this.b, part = b.placed[slot.id];
    if (!part) return;
    const res = this.L.canRemove(slot, b);
    if (!res.ok) { this.say(res.msg, 'err'); return; }
    delete b.placed[slot.id];
    if (this.order.chosen[part.cat] === part.id && !this.order.items.some((it) => it.part === part.id)) {
      delete this.order.chosen[part.cat];
      this.game.returnStock(part.id);
    }
    for (const a of this.L.ACTIONS) if (a.requires.includes(slot.id)) b.acts.delete(a.id);
    for (const c of this.L.CABLES) if (c.requires.includes(slot.id)) b.cables.delete(c.id);
    this.dirty = true;
    this.say(`${esc(part.name)} ligger i lådan igen.`, 'info');
    this.refresh();
  }

  doAct(a) {
    this.b.acts.add(a.id); this.dirty = true;
    this.say(`<b>${esc(a.name)}:</b> ${esc(this.L.fact(a.id))}`, 'fact');
    this.refresh();
  }
  doCable(c) {
    const first = this.b.cables.size === 0;
    this.b.cables.add(c.id);
    this.cableAnim = { id: c.id, t: 0 };
    this.say(first ? `<b>Kablar:</b> ${esc(this.L.fact('cables'))}` : `Inkopplad: ${esc(c.name)}.`, first ? 'fact' : 'info');
    this.refresh();
  }

  say(html, kind = 'info') { this.msg = { html, kind, t: this.t }; this.renderGuide(); }

  // ---------- Input ----------
  local(e) { const r = this.canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

  hotspots() {
    const out = [];
    for (const a of this.availableActs()) out.push({ kind: 'act', obj: a, pt: D.proj(this, ...a.anchor), icon: a.icon, label: a.name });
    for (const c of this.openCables()) out.push({ kind: 'cable', obj: c, pt: D.proj(this, ...this.L.cableTo(c, this.b)), icon: '🔌', label: c.name });
    return out;
  }

  slotAt(pt, part) {
    const L = this.L;
    const accept = L.slotsFor(part);
    for (const s of accept) if (D.inPoly(pt, D.slotPoly(this, s))) return { slot: s };
    for (const s of L.SLOTS) {
      if (s.cat === 'case' || s.cat === 'mb' || accept.includes(s)) continue;
      if (D.inPoly(pt, D.slotPoly(this, s))) return { wrong: s };
    }
    let best = null, bd = 80;
    for (const s of accept) {
      const [x, y] = D.proj(this, ...s.anchor), d = Math.hypot(x - pt[0], y - pt[1]);
      if (d < bd) { bd = d; best = s; }
    }
    return best ? { slot: best } : null;
  }

  dropAt(entry, pt) {
    const hit = this.slotAt(pt, entry.part);
    if (!hit) { this.say('Släpp delen på den gula markeringen.', 'err'); return; }
    if (hit.wrong) {
      this.b.errors++;
      const right = this.L.slotsFor(entry.part)[0];
      this.say(`Fel plats! ${esc(entry.part.name)} passar inte i ${esc(hit.wrong.name.toLowerCase())} – den ska till ${esc(right.name.toLowerCase())}.`, 'err');
      this.shake = 0.35;
      return;
    }
    this.place(entry, hit.slot);
  }

  onCanvasDown(e) {
    if (!this.order || this.boot) return;
    const pt = this.local(e);
    for (const h of this.hotspots()) {
      if (Math.hypot(h.pt[0] - pt[0], h.pt[1] - pt[1]) < 26) { h.kind === 'act' ? this.doAct(h.obj) : this.doCable(h.obj); return; }
    }
    if (this.selected) {
      const entry = this.trayEntries().find((x) => x.key === this.selected);
      if (entry) { this.dropAt(entry, pt); return; }
    }
    const id = this.R.idAt((pt[0] - this.ox) / this.s, (pt[1] - this.oy) / this.s, 1);
    const slot = this.L.SLOTS.find((s) => s.n === id);
    if (slot && this.b.placed[slot.id]) {
      const p = this.b.placed[slot.id];
      this.pendingRemove = slot;
      this.say(`<b>${esc(p.name)}</b> – ${esc(this.shop.specLine(p))} <button class="btn btn-small" data-remove>Ta ur</button>`, 'info');
    }
  }

  onTrayDown(e, entry, el) {
    if (this.boot) return;
    this.drag = { entry, el, x0: e.clientX, y0: e.clientY, moved: false };
    e.preventDefault();
  }
  onDragMove(e) {
    const d = this.drag;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 8) {
      d.moved = true;
      this.selected = d.entry.key;
      const g = $('#drag-ghost'); g.innerHTML = ''; g.append(this.shop.icon(d.entry.part, 64, 54)); g.classList.remove('hidden');
      this.renderTray();
    }
    if (d.moved) { const g = $('#drag-ghost'); g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; }
  }
  onDragEnd(e) {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    $('#drag-ghost').classList.add('hidden');
    if (!d.moved) {
      this.selected = this.selected === d.entry.key ? null : d.entry.key;
      if (this.selected) this.say(`Tryck på platsen där <b>${esc(d.entry.part.name)}</b> ska sitta.`, 'info');
      this.renderTray();
      return;
    }
    const r = this.canvas.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) this.dropAt(d.entry, this.local(e));
    this.selected = null;
    this.renderTray();
  }

  // ---------- Uppstart ----------
  startBoot() {
    if (!this.order || this.boot || !this.isComplete()) return;
    const problems = this.L.bootCheck(this.b);
    this.boot = { t: 0, fail: problems.length ? problems : null };
    this.selected = null;
    this.msg = null; this.guideKey = null;
    this.refresh();
  }

  finishBoot() {
    const b = this.b, o = this.order;
    const target = 30 + 14 * o.items.length;
    let stars = 1;
    if (b.errors <= 1 && b.time <= target) stars = 3;
    else if (b.errors <= 3 && b.time <= target * 1.8) stars = 2;
    if (o.guided) stars = 3;
    this.boot = null;
    this.hooks.onDone(o, { stars, time: b.time, errors: b.errors });
  }

  // ---------- DOM ----------
  refresh() {
    this.renderTray(); this.renderSheet(); this.renderGuide();
    $('#build-boot').disabled = !this.isComplete() || !!this.boot;
  }

  renderTray() {
    const tray = $('#build-tray');
    tray.innerHTML = '';
    const entries = this.trayEntries();
    const hint = this.b.hints && this.nextStep();
    let lastChoiceCat = null;
    for (const e of entries) {
      if (e.choice && e.part.cat !== lastChoiceCat) {
        lastChoiceCat = e.part.cat;
        const lab = document.createElement('div'); lab.className = 'tray-empty';
        lab.innerHTML = `Välj ${esc(this.shop.cats[e.part.cat].name.toLowerCase())}:`;
        tray.append(lab);
      }
      const el = document.createElement('div');
      el.className = 'tray-item' + (e.choice ? ' choice' : '') + (this.selected === e.key ? ' sel' : '') + (hint?.type === 'place' && hint.entry.key === e.key ? ' hint' : '');
      el.append(this.shop.icon(e.part, 64, 54));
      el.insertAdjacentHTML('beforeend', `<div class="nm">${esc(e.part.name)}</div><div class="ct">${e.choice ? `i lager: ${e.count}` : esc(this.shop.cats[e.part.cat].name)}</div>`);
      el.addEventListener('pointerdown', (ev) => this.onTrayDown(ev, e, el));
      tray.append(el);
    }
    if (!entries.length) tray.insertAdjacentHTML('beforeend', `<div class="tray-empty">Alla delar sitter i! ${this.isComplete() ? 'Tryck på ⏻ Starta datorn.' : 'Gör klart handgrepp och kablar.'}</div>`);
  }

  renderSheet() {
    const o = this.order, b = this.b, L = this.L;
    const placed = this.itemsPlaced();
    const hint = this.nextStep();
    const step = (done, now, text, extra = '') => `<div class="step ${done ? 'done' : now ? 'now' : ''}"><span class="bx">${done ? '✓' : ''}</span><span>${text}</span>${extra}</div>`;
    const doneN = placed.filter(Boolean).length;
    let h = `<div class="sheet-sum"><span>📋 Delar ${doneN}/${o.items.length} · ${Math.floor(b.time)} s · ${b.errors} misstag</span><button class="btn btn-small" id="sheet-toggle">${this.sheetOpen ? 'Dölj ▴' : 'Lista ▾'}</button></div>`;
    h += `<div class="sheet-h">Beställning</div><div class="who" style="margin-bottom:6px"><span id="sheet-face"></span><div><b>${esc(o.name)}</b><br><small>${esc(o.title)}</small></div></div>`;
    h += `<div class="sheet-h">Delar</div>`;
    o.items.forEach((it, i) => {
      const name = it.part ? this.shop.part[it.part].name : (o.chosen[it.cat] ? this.shop.part[o.chosen[it.cat]].name + ' (ditt val)' : `Valfri: ${this.shop.cats[it.cat].name.toLowerCase()}`);
      const now = hint?.type === 'place' && (hint.entry.part.id === it.part || (it.choice && hint.entry.part.cat === it.cat)) && !placed[i];
      h += step(placed[i], now, esc(name));
    });
    const sim = this.simulated();
    const acts = L.ACTIONS.filter((a) => L.SLOTS.some((s) => sim.placed[s.id] && s.requires.includes('act:' + a.id)));
    const cables = L.CABLES.filter((c) => c.requires.every((r) => sim.placed[r]) && c.need(sim));
    h += `<div class="sheet-h">Handgrepp & kablar</div>`;
    for (const a of acts) h += step(b.acts.has(a.id), hint?.type === 'act' && hint.act === a, `${a.icon} ${esc(a.name)}`);
    for (const c of cables) h += step(b.cables.has(c.id), hint?.type === 'cable' && hint.cable === c, `🔌 ${esc(c.name)}`);
    h += step(false, hint?.type === 'boot', '⏻ Starta datorn');
    h += `<div class="sheet-h">Betalning</div><div class="step"><span>Kunden betalar${o.items.some((i) => i.choice) ? ' ca' : ''}</span><b style="margin-left:auto">${fmt(this.shop.priceFor(o, o.chosen))} kr</b></div>`;
    h += `<div class="step"><span>Tid: ${Math.floor(b.time)} s · Misstag: ${b.errors}</span></div>`;
    if (o.tutorial === undefined) h += `<div style="margin-top:8px"><button class="btn btn-small" id="hint-toggle">${b.hints ? '🙈 Dölj tips' : '💡 Visa tips'}</button></div>`;
    $('#build-sheet').innerHTML = h;
    $('#build-sheet').classList.toggle('open', !!this.sheetOpen);
    $('#sheet-toggle').onclick = () => { this.sheetOpen = !this.sheetOpen; this.renderSheet(); requestAnimationFrame(() => this.resize()); };
    const cust = this.game.customers.find((c) => c.id === o.customerId);
    if (cust) $('#sheet-face').append(portrait(cust.look));
    const ht = $('#hint-toggle');
    if (ht) ht.onclick = () => { b.hints = !b.hints; this.refresh(); };
  }

  renderGuide() {
    const el = $('#build-guide');
    let html = '', kind = 'info';
    if (this.boot) html = '';
    else if (this.msg && (this.t - this.msg.t < 6 || this.msg.kind !== 'info' || !this.b.hints)) { html = this.msg.html; kind = this.msg.kind; }
    else if (this.order && this.b.hints && !this.boot) {
      const s = this.nextStep();
      if (s?.type === 'place') html = `Dra <b>${esc(s.entry.part.name)}</b> till <b>${esc(s.slot.name.toLowerCase())}</b> (gul markering).`;
      if (s?.type === 'act') html = `Tryck på ${s.act.icon} för att <b>${esc(s.act.name.toLowerCase())}</b>.`;
      if (s?.type === 'cable') html = `Koppla in <b>${esc(s.cable.name)}</b> – tryck på 🔌.`;
      if (s?.type === 'boot') html = 'Allt sitter på plats! Tryck på <b>⏻ Starta datorn</b>.';
    }
    const key = kind + html;
    if (key === this.guideKey) return;
    this.guideKey = key;
    const face = { info: '🧑‍🔧', fact: '📘', err: '⚠️' }[kind];
    el.innerHTML = html ? `<div class="guide ${kind}"><span class="face">${face}</span><span>${html}</span></div>` : '';
    const rm = el.querySelector('[data-remove]');
    if (rm) rm.onclick = () => { if (this.pendingRemove) this.remove(this.pendingRemove); };
  }

  // ---------- Rendering ----------
  resize() {
    const dpr = window.devicePixelRatio || 1, V = this.L.VIEW;
    const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    if (!cw || !ch) return;
    this.canvas.width = Math.round(cw * dpr); this.canvas.height = Math.round(ch * dpr);
    this.dpr = dpr; this.cw = cw; this.ch = ch;
    this.labelW = cw >= 900 ? Math.min(210, cw * 0.17) : 0;
    const narrow = window.innerWidth <= 760;
    const availW = cw - (this.labelW ? this.labelW * 2 - 70 : 12), availH = ch - (narrow ? 62 : 70);
    let s = Math.min(availW / V.w, availH / V.h);
    if (s >= 2) s = Math.floor(s * 4) / 4;
    this.s = s;
    this.ox = Math.round((cw - V.w * s) / 2);
    this.oy = Math.round((narrow ? 58 : 6) + (availH - V.h * s) / 2);
  }

  frame(dt) {
    if (!this.order) return;
    this.t += dt;
    if (!this.boot) this.b.time += dt;
    if (this.shake > 0) this.shake -= dt;
    if (this.flash) { this.flash.t -= dt; if (this.flash.t <= 0) this.flash = null; }
    if (this.cableAnim) { this.cableAnim.t += dt * 2.5; if (this.cableAnim.t >= 1) this.cableAnim = null; }
    const rgb = Object.values(this.b.placed).some((p) => p.look?.rgb);
    if (this.boot) {
      const bt = this.boot;
      bt.t += dt;
      const spinning = !bt.fail || bt.t < 1.1;
      if (spinning) { this.spin += dt * 22; this.dirty = true; }
      if (bt.fail && bt.t > 1.5) {
        this.b.errors++;
        const fail = bt.fail; this.boot = null;
        this.say('<b>Datorn startade inte!</b> ' + fail.map(esc).join(' '), 'err');
        this.hooks.onBootFail?.(this.order, fail);
        this.refresh();
      } else if (!bt.fail && bt.t > 7.2) { this.finishBoot(); return; }
    }
    if (rgb) this.dirty = true;
    if (this.dirty) { this.R.clear(); this.L.drawScene(this.R, this.b, { spin: this.spin, t: this.t }); this.R.flush(); this.dirty = false; }
    if (Math.floor(this.t * 2) !== Math.floor((this.t - dt) * 2)) this.renderGuide();
    this.draw();
  }

  draw() {
    const ctx = this.ctx, V = this.L.VIEW;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#efe9df'; ctx.fillRect(0, 0, this.cw, this.ch);
    const sx = this.shake > 0 ? Math.round(Math.sin(this.t * 80) * 5) : 0;
    ctx.save(); ctx.translate(sx, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.R.canvas, this.ox, this.oy, V.w * this.s, V.h * this.s);

    const bt = this.boot;
    // kablar
    for (const c of this.L.CABLES) {
      if (!this.b.cables.has(c.id)) continue;
      const prog = this.cableAnim?.id === c.id ? this.cableAnim.t : 1;
      D.drawCable(ctx, this, c.from, this.L.cableTo(c, this.b), { atx24: '#e8b230', eps8: '#c9323a', pcie: '#45b964', sata: '#58a6c9' }[c.id] || '#ddd', prog);
    }
    if (!bt) {
      // markeringar
      const entry = this.selected && this.trayEntries().find((x) => x.key === this.selected);
      if (entry) for (const s of this.L.slotsFor(entry.part)) D.drawHighlight(ctx, this, s, this.t);
      else if (this.b.hints) { const st = this.nextStep(); if (st?.type === 'place') D.drawHighlight(ctx, this, st.slot, this.t); }
      if (this.flash) D.drawHighlight(ctx, this, this.flash.slot, this.t * 3, '#45b964');
      const showLabel = this.b.hints;
      for (const h of this.hotspots()) D.drawHotspot(ctx, h.pt[0], h.pt[1], this.t, h.icon, showLabel ? h.label : '');
      // etiketter för monterade delar
      const labels = this.L.SLOTS.filter((s) => this.b.placed[s.id] && s.cat !== 'case').map((s) => {
        const p = this.b.placed[s.id];
        const [x] = D.proj(this, ...s.anchor);
        return { title: this.shop.cats[p.cat].name, text: p.name, anchor: s.anchor, side: x < this.cw / 2 ? 'left' : 'right' };
      });
      D.drawLabels(ctx, this, labels, this.cw, this.ch);
    } else {
      if (bt.fail) {
        if (bt.t > 1.1) { ctx.fillStyle = `rgba(201,50,58,${0.25 * Math.abs(Math.sin(bt.t * 12))})`; ctx.fillRect(0, 0, this.cw, this.ch); }
      } else {
        if (bt.t > 1.2) D.drawBus(ctx, this, this.L.BUS, bt.t);
        const labels = this.L.CONCEPTS.map((c, i) => ({ ...c, dark: true, alpha: Math.max(0, Math.min(1, (bt.t - 1.8 - i * 0.9) * 2)) }));
        D.drawLabels(ctx, this, labels, this.cw, this.ch);
        if (bt.t > 2.2) D.drawPipeline(ctx, this.cw, bt.t - 2.2);
        const status = bt.t < 1.2 ? '⚡ Ström på…' : bt.t < 3 ? 'POST: CPU ✓  RAM ✓  Lagring ✓  Grafik ✓' : bt.t < 5.5 ? 'Laddar operativsystemet från lagringen till RAM…' : '✅ Datorn fungerar!';
        this.bootStatus(ctx, status);
      }
    }
    ctx.restore();
  }

  bootStatus(ctx, text) {
    ctx.save();
    ctx.font = '24px "Jersey 10", monospace';
    const w = ctx.measureText(text).width + 30, x = (this.cw - w) / 2, y = this.ch - 60;
    ctx.fillStyle = '#17151a'; ctx.fillRect(x + 4, y + 4, w, 40);
    ctx.fillStyle = '#0f2a18'; ctx.fillRect(x, y, w, 40);
    ctx.fillStyle = '#7ee8a0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, this.cw / 2, y + 21);
    ctx.restore();
  }
}
