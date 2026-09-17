// Byggvyn: dra delar och kablar från lådan, skruva och gör handgrepp, ställ upp
// och testa (finalen, t.ex. skrivbordet). Generisk – reglerna kommer från shop.layout
// och finalen från shop.Finale.
import { Raster } from './raster.js';
import * as D from './build-draw.js';
import * as U from './build-ui.js';
import { modalOpen } from './ui.js';

const $ = (s) => document.querySelector(s);
const esc = U.esc;

export class BuildView {
  constructor(game, hooks) {
    this.game = game; this.shop = game.shop; this.L = game.shop.layout; this.hooks = hooks;
    this.canvas = $('#board'); this.ctx = this.canvas.getContext('2d');
    // Kamera: zoom = css-px per enhet, (x,y) = var världens origo hamnar på skärmen.
    // Rastern ritas bara för det synliga området, med upp till MAX_K pixlar per enhet.
    const V = this.L.VIEW, ratio = V.hz / V.k;
    this.P = { k: V.k, hz: V.hz, ox: 0, oy: 0, proj(u, v, z = 0) { return [this.ox + (u - v) * this.k, this.oy + (u + v) * this.k / 2 - z * this.hz]; } };
    this.hzRatio = ratio;
    this.s = 1; this.ox = 0; this.oy = 0;
    this.R = new Raster(2, 2);
    this.cableCanvas = document.createElement('canvas');
    this.cableCtx = this.cableCanvas.getContext('2d');
    this.ptrs = new Map();
    this.zoomUI();
    this.t = 0; this.spin = 0; this.order = null;
    this.finale = this.shop.Finale ? new this.shop.Finale(this) : null;
    $('#build-back').onclick = () => this.hooks.onExit();
    $('#build-boot').onclick = () => this.topAction();
    this.canvas.addEventListener('pointerdown', (e) => this.onPtrDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPtrMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.onPtrUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.ptrs.delete(e.pointerId));
    this.canvas.addEventListener('wheel', (e) => {
      if (!this.order || this.phase !== 'build') return;
      e.preventDefault();
      this.zoomAt(this.local(e), Math.exp(-e.deltaY * 0.0016));
    }, { passive: false });
    window.addEventListener('pointermove', (e) => this.onDragMove(e));
    window.addEventListener('pointerup', (e) => this.onDragEnd(e));
  }

  // ---------- Öppna ----------
  open(order) {
    this.order = order;
    order.build ||= { placed: {}, acts: new Map(), cables: new Map(), errors: 0, time: 0, help: null, phase: 'build', seen: new Set() };
    this.selected = null; this.msg = null; this.guideKey = null; this.dirty = true; this.cablesDirty = true; this.userCam = false;
    $('#build-title').innerHTML = `<span class="r">${esc(order.title)}</span> åt ${esc(order.name)}`;
    if (order.build.help === null) {
      if (order.guided) order.build.help = true;
      else { this.refresh(); U.chooseMode(this, (help) => { order.build.help = help; this.start(); }); return; }
    }
    this.start();
  }
  start() {
    const b = this.b;
    if (b.phase === 'desk') this.finale?.enter();
    else if (!Object.keys(b.placed).length) {
      this.say(this.order.guided
        ? `Välkommen till verkstaden! Nu bygger vi ${esc(this.order.name)}s dator steg för steg. Följ de gula markeringarna.`
        : b.help ? `Bygg datorn åt ${esc(this.order.name)}. Dra delar och kablar från lådan till rätt plats.`
          : `Proffsläge! Inga markeringar – du vet vad som ska göras. Lycka till!`, 'info');
    }
    this.refresh();
    this.resize();
  }
  get b() { return this.order.build; }
  get help() { return !!this.order?.build?.help; }
  get phase() { return this.order?.build?.phase || 'build'; }

  // ---------- Låda ----------
  partEntries() {
    const o = this.order, b = this.b, out = [], used = {};
    for (const p of Object.values(b.placed)) used[p.id] = (used[p.id] || 0) + 1;
    o.items.forEach((it, i) => {
      if (!it.part) return;
      if (used[it.part] > 0) { used[it.part]--; return; }
      const part = this.shop.part[it.part];
      out.push({ key: `x${i}`, kind: 'part', part, name: part.name, choice: false });
    });
    for (const it of o.items) {
      if (!it.choice || Object.values(b.placed).some((p) => p.cat === it.cat)) continue;
      for (const p of this.shop.parts) if (p.cat === it.cat && this.game.stockFree(p.id) > 0) out.push({ key: `c${p.id}`, kind: 'part', part: p, name: p.name, choice: true, count: this.game.stockFree(p.id) });
    }
    return out;
  }
  cableEntries() {
    const b = this.b;
    return this.L.CABLES.filter((c) => this.L.cableReady(c, b) && !b.cables.has(c.id)).map((c) => {
      const conn = this.L.cableConn(c, b);
      return { key: 'cable:' + c.id, kind: 'cable', cable: c, conn, name: c.name, sub: this.L.CONN[conn].name };
    });
  }
  trayEntries() {
    if (this.phase === 'desk') return this.finale.trayEntries();
    return [...this.partEntries(), ...this.cableEntries()];
  }
  entryIcon(e, W, H) {
    if (e.kind === 'part') return this.shop.icon(e.part, W, H);
    if (e.kind === 'cable') return this.L.connectorIcon(e.conn, W, H);
    return e.icon(W, H);
  }
  trayEmptyText() {
    if (this.phase === 'desk') return 'Allt är inkopplat! Tryck på startknappen på datorn.';
    return this.isBuilt() ? 'Allt sitter i! Tryck på 🖥️ Ställ upp datorn.' : 'Lådan är tom.';
  }

  // ---------- Status ----------
  itemsPlaced() {
    const counts = {};
    for (const p of Object.values(this.b.placed)) counts[p.id] = (counts[p.id] || 0) + 1;
    return this.order.items.map((it) => {
      if (it.part) { if (counts[it.part] > 0) { counts[it.part]--; return true; } return false; }
      return Object.values(this.b.placed).some((p) => p.cat === it.cat);
    });
  }
  isBuilt() { return this.itemsPlaced().every(Boolean); }

  // hur datorn blir när alla beställda delar sitter i (för checklistan)
  sim() {
    const placed = {};
    for (const it of this.order.items) {
      const part = it.part ? this.shop.part[it.part] : (this.shop.part[this.order.chosen[it.cat]] || this.shop.parts.find((p) => p.cat === it.cat));
      const slot = this.L.slotsFor(part)[0];
      if (slot) placed[slot.id] = part;
    }
    return { placed, acts: new Map(), cables: new Map() };
  }

  steps() {
    const L = this.L, b = this.b, sim = this.sim(), out = [];
    const tray = this.partEntries();
    for (const key of L.STEPS) {
      const [kind, id] = key.split(':');
      if (kind === 'slot') {
        if (!sim.placed[id]) continue;
        const entry = tray.find((e) => L.slotsFor(e.part).some((s) => s.id === id));
        out.push({ key, kind, id, label: (b.placed[id] || sim.placed[id]).name, done: !!b.placed[id], ready: !!entry && !L.missingReq(L.SLOT[id].requires, b), entryKey: entry?.key });
      } else if (kind === 'act') {
        const a = L.ACTION[id];
        if (!a.requires.filter((r) => !r.startsWith('act:')).every((r) => sim.placed[r])) continue;
        const n = a.points.length, c = L.actCount(b, id);
        out.push({ key, kind, id, label: a.name + (n > 1 ? ` (${c}/${n})` : ''), done: L.actDone(b, id), ready: L.actionReady(a, b) });
      } else {
        const c = L.CABLE[id];
        if (!c.requires.every((r) => sim.placed[r]) || !L.cableNeeded(c, { ...sim, placed: { ...sim.placed, ...b.placed } })) continue;
        out.push({ key, kind, id, label: c.name, done: b.cables.has(id), ready: L.cableReady(c, b) && !b.cables.has(id), entryKey: 'cable:' + id });
      }
    }
    return out;
  }
  nextStep() {
    if (this.phase === 'desk') return this.finale?.nextStep() || null;
    const steps = this.steps();
    const s = steps.find((x) => !x.done && x.ready);
    if (s) return s;
    if (steps.every((x) => x.done)) return { kind: 'stand', key: 'stand' };
    return null;
  }
  hintText() {
    if (this.phase === 'desk') return this.finale?.hintText() || '';
    const s = this.nextStep();
    if (!s) return '';
    if (s.kind === 'slot') return `Dra <b>${esc(s.label)}</b> till <b>${esc(this.L.SLOT[s.id].name.toLowerCase())}</b> (gul markering).`;
    if (s.kind === 'act') { const a = this.L.ACTION[s.id]; return `Tryck på ${a.icon} för att <b>${esc(a.name.toLowerCase())}</b>.`; }
    if (s.kind === 'cable') { const c = this.L.CABLE[s.id]; return `Dra kabeln <b>${esc(c.name)}</b> till uttaget <b>${esc(c.wants.map(this.L.portLabel).join(' / '))}</b>.`; }
    return 'Allt är klart! Tryck på <b>🖥️ Ställ upp datorn</b> och testa den.';
  }

  // ---------- Handlingar ----------
  place(entry, slot) {
    const b = this.b, res = this.L.canPlace(slot, entry.part, b);
    if (!res.ok) return this.fail(res.msg);
    if (entry.choice) {
      if (!this.game.takeStock(entry.part.id)) return false;
      this.order.chosen[entry.part.cat] = entry.part.id;
    }
    b.placed[slot.id] = entry.part;
    this.selected = null; this.dirty = true; this.cablesDirty = true;
    this.flash = { slot, t: 0.6 };
    this.say(`<b>${esc(this.shop.cats[entry.part.cat].name)}:</b> ${esc(this.L.fact(entry.part.cat, entry.part))}`, 'fact');
    this.refresh();
    return true;
  }
  remove(slot) {
    const b = this.b, part = b.placed[slot.id];
    if (!part) return;
    const res = this.L.canRemove(slot, b);
    if (!res.ok) return this.say(res.msg, 'err');
    delete b.placed[slot.id];
    if (this.order.chosen[part.cat] === part.id && !this.order.items.some((it) => it.part === part.id)) {
      delete this.order.chosen[part.cat];
      this.game.returnStock(part.id);
    }
    this.L.onRemove(slot, b);
    this.dirty = true; this.cablesDirty = true;
    this.say(`${esc(part.name)} ligger i lådan igen.`, 'info');
    this.refresh();
  }
  doAction(a, i) {
    const set = new Set(this.L.actSet(this.b, a.id));
    set.add(i);
    this.b.acts.set(a.id, set);
    this.dirty = true;
    this.toolAnim = { pt: a.points[i], t: 0, icon: a.icon };
    if (this.L.actDone(this.b, a.id)) this.say(`<b>${esc(a.name)}:</b> ${esc(this.L.fact(a.id))}`, 'fact');
    else this.say(`${a.icon} ${esc(a.name)}: ${set.size}/${a.points.length}`, 'info');
    this.refresh();
  }
  connect(entry, key) {
    const b = this.b, res = this.L.canConnect(entry.cable, key, b, this.help);
    if (!res.ok) return this.fail(res.msg);
    b.cables.set(entry.cable.id, key);
    this.plugAnim = { id: entry.cable.id, t: 0 };
    this.cablesDirty = true; this.selected = null;
    if (!b.seen.has(entry.conn)) {
      b.seen.add(entry.conn);
      this.say(`<b>${esc(this.L.CONN[entry.conn].name)}:</b> ${esc(this.L.fact(entry.conn))}`, 'fact');
    } else this.say(`Klick! ${esc(entry.cable.name)} sitter i ${esc(this.L.portLabel(key))}.`, 'info');
    this.refresh();
    return true;
  }
  unplug(id) {
    this.b.cables.delete(id);
    this.cablesDirty = true;
    this.say('Kabeln är urdragen och ligger i lådan igen.', 'info');
    this.refresh();
  }
  fail(msg) {
    this.b.errors++;
    this.say(esc(msg), 'err');
    this.shake = 0.35;
    this.refresh();
    return false;
  }

  topAction() {
    if (!this.order) return;
    if (this.phase === 'desk') return this.backToBuild();
    if (!this.isBuilt()) return this.say('Alla delar sitter inte i än.', 'err');
    if (this.help && this.steps().some((s) => !s.done)) return this.say('Gör klart checklistan först (skruvar och kablar).', 'err');
    const probs = this.L.standCheck(this.b);
    if (probs.length) return this.fail(probs.map((p) => p.msg + (this.help ? ' ' + p.hint : '')).join(' '));
    this.b.phase = 'desk';
    this.selected = null; this.msg = null;
    this.finale.enter();
    this.refresh();
  }
  backToBuild() {
    this.b.phase = 'build';
    this.dirty = true; this.cablesDirty = true;
    this.say('Datorn ligger på bänken igen – leta efter felet!', 'info');
    this.refresh();
  }
  finish(result) {
    const b = this.b;
    const target = 60 + 30 * this.order.items.length;
    let stars = 1;
    if (b.errors <= 1 && b.time <= target) stars = 3;
    else if (b.errors <= 4 && b.time <= target * 1.8) stars = 2;
    stars = Math.max(1, stars - (result.warnings?.length || 0));
    if (this.order.guided) stars = 3;
    this.hooks.onDone(this.order, { stars, time: b.time, errors: b.errors, help: b.help, warnings: result.warnings || [] });
  }

  say(html, kind = 'info') { this.msg = { html, kind, t: this.t }; this.guideKey = null; U.renderGuide(this); }
  guideAction(act) {
    if (act === 'remove' && this.pending?.slot) this.remove(this.pending.slot);
    if (act === 'unplug' && this.pending?.cable) this.unplug(this.pending.cable);
    this.finale?.guideAction?.(act);
  }

  // ---------- Input ----------
  local(e) { const r = this.canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

  actionAt(pt) {
    const r = this.help ? 26 : 22;
    let best = null, bd = r;
    for (const a of this.L.ACTIONS) {
      if (!this.L.actionReady(a, this.b)) continue;
      const done = this.L.actSet(this.b, a.id);
      a.points.forEach((p, i) => {
        if (done.has(i)) return;
        const [x, y] = D.proj(this, ...p), d = Math.hypot(x - pt[0], y - pt[1]);
        if (d < bd) { bd = d; best = { a, i }; }
      });
    }
    return best;
  }
  portsOnScreen() {
    const b = this.b;
    return this.L.availablePorts(b).map((k) => ({ key: k, pt: D.proj(this, ...this.L.portPos(k, b)), label: this.L.portLabel(k), busy: this.L.portBusy(k, b) }));
  }
  slotAt(pt, part) {
    const L = this.L, accept = L.slotsFor(part);
    for (const s of accept) if (D.inPoly(pt, D.slotPoly(this, s))) return { slot: s };
    for (const s of L.SLOTS) {
      if (s.cat === 'case' || s.cat === 'mb' || accept.includes(s)) continue;
      if (D.inPoly(pt, D.slotPoly(this, s))) return { wrong: s };
    }
    let best = null, bd = this.help ? 90 : 34;
    for (const s of accept) {
      const [x, y] = D.proj(this, ...s.anchor), d = Math.hypot(x - pt[0], y - pt[1]);
      if (d < bd) { bd = d; best = s; }
    }
    return best ? { slot: best } : null;
  }
  dropAt(entry, pt) {
    if (this.phase === 'desk') return this.finale.onDrop(entry, pt);
    if (entry.kind === 'cable') {
      let best = null, bd = this.help ? 44 : 24;
      for (const p of this.portsOnScreen()) { const d = Math.hypot(p.pt[0] - pt[0], p.pt[1] - pt[1]); if (d < bd) { bd = d; best = p; } }
      if (!best) return this.say('Släpp kontakten precis på ett uttag.', 'err');
      return this.connect(entry, best.key);
    }
    const hit = this.slotAt(pt, entry.part);
    if (!hit) return this.say(this.help ? 'Släpp delen på den gula markeringen.' : 'Släpp delen där den ska sitta.', 'err');
    if (hit.wrong) {
      const right = this.L.slotsFor(entry.part)[0];
      return this.fail(`Fel plats! ${entry.part.name} passar inte i ${hit.wrong.name.toLowerCase()}${this.help ? ` – den ska till ${right.name.toLowerCase()}` : ''}.`);
    }
    this.place(entry, hit.slot);
  }

  onCanvasDown(e) {
    if (!this.order || modalOpen()) return;
    const pt = this.local(e);
    if (this.selected) {
      const entry = this.trayEntries().find((x) => x.key === this.selected);
      this.selected = null;
      if (entry) { this.dropAt(entry, pt); U.renderTray(this); return; }
    }
    if (this.phase === 'desk') return this.finale.onPointerDown(pt);
    const act = this.actionAt(pt);
    if (act) return this.doAction(act.a, act.i);
    for (const [id, key] of this.b.cables) {
      const [x, y] = D.proj(this, ...this.L.portPos(key, this.b));
      if (Math.hypot(x - pt[0], y - pt[1]) < 12) {
        this.pending = { cable: id };
        return this.say(`<b>${esc(this.L.CABLE[id].name)}</b> sitter i ${esc(this.L.portLabel(key))}. <button class="btn btn-small" data-act="unplug">Dra ur</button>`, 'info');
      }
    }
    if (this.renderDue) this.render();
    const id = this.R.idAt(pt[0] / this.buf.px, pt[1] / this.buf.px, 1);
    const slot = this.L.SLOTS.find((s) => s.n === id);
    if (slot && this.b.placed[slot.id]) {
      const p = this.b.placed[slot.id];
      this.pending = { slot };
      const loose = this.L.screwStatus?.(slot.id, this.b);
      this.say(`<b>${esc(p.name)}</b> – ${esc(this.shop.specLine(p))}${loose ? `<br>🪛 ${esc(loose)}` : ''} <button class="btn btn-small" data-act="remove">Ta ur</button>`, loose ? 'err' : 'info');
    }
  }
  onTrayDown(e, entry) {
    this.drag = { entry, x0: e.clientX, y0: e.clientY, moved: false };
    e.preventDefault();
  }
  onDragMove(e) {
    const d = this.drag;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 8) {
      d.moved = true;
      this.selected = d.entry.key;
      const g = $('#drag-ghost'); g.innerHTML = ''; g.append(this.entryIcon(d.entry, 64, 54)); g.classList.remove('hidden');
      U.renderTray(this);
    }
    if (d.moved) {
      const g = $('#drag-ghost'); g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px';
      this.hover = this.local(e);
    }
  }
  onDragEnd(e) {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    $('#drag-ghost').classList.add('hidden');
    if (!d.moved) {
      this.selected = this.selected === d.entry.key ? null : d.entry.key;
      if (this.selected) this.say(`Tryck där <b>${esc(d.entry.name)}</b> ska ${d.entry.kind === 'part' ? 'sitta' : 'kopplas in'}.`, 'info');
      U.renderTray(this);
      return;
    }
    const r = this.canvas.getBoundingClientRect();
    this.selected = null;
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) this.dropAt(d.entry, this.local(e));
    U.renderTray(this);
  }

  // ---------- DOM ----------
  refresh() {
    if (!this.order) return;
    U.renderTray(this); U.renderSheet(this); U.renderGuide(this);
    const btn = $('#build-boot');
    if (this.phase === 'desk') { btn.textContent = '🔧 Öppna datorn'; btn.disabled = false; btn.classList.remove('btn-go'); }
    else {
      btn.textContent = '🖥️ Ställ upp datorn'; btn.classList.add('btn-go');
      btn.disabled = !this.isBuilt() || this.b.help === null;
    }
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
    const s = Math.min(availW / V.w, availH / V.h);
    const ox = Math.round((cw - V.w * s) / 2), oy = Math.round((narrow ? 58 : 6) + (availH - V.h * s) / 2);
    this.fit = { zoom: V.k * s, x: ox + V.ox * s, y: oy + V.oy * s };
    if (!this.userCam || !this.cam) this.cam = { ...this.fit };
    this.applyCam();
    this.dirty = true;
    this.finale?.resize(cw, ch, narrow);
  }

  frame(dt) {
    if (!this.order || this.b.help === null) return;
    this.t += dt;
    if (!modalOpen()) this.b.time += dt;
    if (this.shake > 0) this.shake -= dt;
    if (Math.floor(this.t * 2) !== Math.floor((this.t - dt) * 2)) { U.renderGuide(this); if (this.sheetTick = !this.sheetTick) U.renderSheet(this); }
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.phase === 'desk') { this.finale.frame(dt); this.finale.draw(ctx); return; }
    if (this.flash) { this.flash.t -= dt; if (this.flash.t <= 0) this.flash = null; }
    if (this.toolAnim) { this.toolAnim.t += dt; if (this.toolAnim.t > 0.45) this.toolAnim = null; }
    if (this.plugAnim) { this.plugAnim.t += dt * 3; this.cablesDirty = true; if (this.plugAnim.t >= 1) { this.plugAnim = null; } }
    if (!this.cam) this.resize();
    if (this.dirty || (this.renderDue && this.t >= this.renderDue)) this.render();
    if (this.cablesDirty) { this.L.drawCables(this.cableCtx, this.R, this.b, { plug: this.plugAnim }); this.cablesDirty = false; }
    document.querySelector('#zoom-ctl')?.classList.toggle('hidden', this.phase !== 'build');
    this.draw(ctx);
  }

  // ---------- Kamera & zoom ----------
  applyCam() {
    const c = this.cam;
    this.P.k = c.zoom; this.P.hz = c.zoom * this.hzRatio; this.P.ox = c.x; this.P.oy = c.y;
  }
  zoomAt(pt, f) {
    const c = this.cam, maxZ = this.L.MAX_K * 3, minZ = this.fit.zoom * 0.85;
    const z = Math.max(minZ, Math.min(maxZ, c.zoom * f));
    const r = z / c.zoom;
    c.x = pt[0] - (pt[0] - c.x) * r; c.y = pt[1] - (pt[1] - c.y) * r; c.zoom = z;
    this.userCam = Math.abs(z - this.fit.zoom) > 0.5;
    if (!this.userCam) Object.assign(c, this.fit);
    this.clampCam(); this.applyCam();
    this.renderDue = this.t + 0.15;
  }
  zoomBy(f) { this.zoomAt([this.cw / 2, this.ch / 2], f); }
  zoomFit() { this.userCam = false; this.cam = { ...this.fit }; this.applyCam(); this.renderDue = this.t; }
  clampCam() {
    // håll chassits mitt inom skärmen
    const [mx, my] = this.P.proj.call({ ...this.P, k: this.cam.zoom, hz: this.cam.zoom * this.hzRatio, ox: this.cam.x, oy: this.cam.y }, 13, 12, 0);
    if (mx < 0) this.cam.x -= mx; if (mx > this.cw) this.cam.x -= mx - this.cw;
    if (my < 0) this.cam.y -= my; if (my > this.ch) this.cam.y -= my - this.ch;
  }
  render() {
    const c = this.cam, V = this.L.VIEW;
    // rita i skärmens upplösning (upp till 2× på retina), men håll bufferten under ~1,4 Mpx
    const q = Math.min(this.dpr || 1, 2);
    let K = Math.min(this.L.MAX_K, c.zoom * q);
    const maxPx = 1.4e6, area = (this.cw * this.ch) * (K / c.zoom) ** 2;
    if (area > maxPx) K = Math.max(Math.min(this.L.MAX_K, c.zoom), K * Math.sqrt(maxPx / area));
    const px = c.zoom / K;
    const W = Math.max(2, Math.ceil(this.cw / px)), H = Math.max(2, Math.ceil(this.ch / px));
    if (this.R.w !== W || this.R.h !== H) {
      this.R = new Raster(W, H);
      this.cableCanvas.width = W; this.cableCanvas.height = H;
    }
    Object.assign(this.R, { k: K, hz: K * this.hzRatio, ox: c.x / px, oy: c.y / px, edges: true });
    this.R.clear();
    this.L.drawScene(this.R, this.b, { spin: this.spin, t: this.t });
    this.R.flush();
    this.buf = { zoom: c.zoom, x: c.x, y: c.y, px };
    this.dirty = false; this.renderDue = null; this.cablesDirty = true;
  }
  zoomUI() {
    const stage = $('#build-stage');
    if (!stage || $('#zoom-ctl')) return;
    const box = document.createElement('div');
    box.id = 'zoom-ctl';
    box.innerHTML = '<button class="btn btn-small" data-z="in" title="Zooma in">＋</button><button class="btn btn-small" data-z="out" title="Zooma ut">－</button><button class="btn btn-small" data-z="fit" title="Visa hela">⤢</button>';
    box.querySelector('[data-z="in"]').onclick = () => this.zoomBy(1.6);
    box.querySelector('[data-z="out"]').onclick = () => this.zoomBy(1 / 1.6);
    box.querySelector('[data-z="fit"]').onclick = () => this.zoomFit();
    stage.append(box);
  }

  // ---------- Pekare: klick, panorering, nypzoom ----------
  onPtrDown(e) {
    if (!this.order || modalOpen()) return;
    if (this.phase === 'desk') return this.onCanvasDown(e);
    this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
    this.canvas.setPointerCapture?.(e.pointerId);
    this.gesture = { moved: false, pinch: this.ptrs.size >= 2 ? null : undefined };
  }
  onPtrMove(e) {
    this.hover = this.local(e);
    const p = this.ptrs.get(e.pointerId);
    if (!p) {
      const over = this.order && this.b.help !== null && this.phase === 'build' && this.actionAt(this.hover);
      this.canvas.style.cursor = over ? 'pointer' : (this.userCam ? 'grab' : '');
      return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (this.ptrs.size >= 2) {
      const [a, b] = [...this.ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const r = this.canvas.getBoundingClientRect();
      const mid = [(a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top];
      if (this.gesture.pinchD) this.zoomAt(mid, d / this.gesture.pinchD);
      this.gesture.pinchD = d; this.gesture.moved = true;
      return;
    }
    if (!this.gesture.moved && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < 7) return;
    this.gesture.moved = true;
    this.cam.x += dx; this.cam.y += dy; this.userCam = true;
    this.clampCam(); this.applyCam();
    this.renderDue = this.t + 0.15;
    this.canvas.style.cursor = 'grabbing';
  }
  onPtrUp(e) {
    const p = this.ptrs.get(e.pointerId);
    this.ptrs.delete(e.pointerId);
    if (!p) return;
    if (!this.gesture?.moved && this.ptrs.size === 0) this.onCanvasDown(e);
  }

  draw(ctx) {
    const V = this.L.VIEW;
    ctx.fillStyle = '#efe9df'; ctx.fillRect(0, 0, this.cw, this.ch);
    const sx = this.shake > 0 ? Math.round(Math.sin(this.t * 80) * 5) : 0;
    ctx.save(); ctx.translate(sx, 0);
    // skarpa pixlar när bilden förstoras; mjuk nedskalning på små skärmar
    const bc = this.buf, sc = this.cam.zoom / bc.zoom;
    const dx = this.cam.x - bc.x * sc, dy = this.cam.y - bc.y * sc, dw = this.R.w * bc.px * sc, dh = this.R.h * bc.px * sc;
    ctx.imageSmoothingEnabled = bc.px * sc < 1;
    ctx.drawImage(this.R.canvas, dx, dy, dw, dh);
    ctx.drawImage(this.cableCanvas, dx, dy, dw, dh);

    const entry = this.selected && this.trayEntries().find((x) => x.key === this.selected);
    const next = this.help ? this.nextStep() : null;
    // markeringar (bara med hjälp)
    if (this.help) {
      if (entry?.kind === 'part') for (const s of this.L.slotsFor(entry.part)) D.drawHighlight(ctx, this, s, this.t);
      else if (!entry && next?.kind === 'slot') D.drawHighlight(ctx, this, this.L.SLOT[next.id], this.t);
      for (const a of this.L.ACTIONS) {
        if (!this.L.actionReady(a, this.b)) continue;
        const done = this.L.actSet(this.b, a.id);
        let first = true;
        a.points.forEach((p, i) => {
          if (done.has(i)) return;
          const [x, y] = D.proj(this, ...p);
          const isNext = next?.kind === 'act' && next.id === a.id;
          D.drawHotspot(ctx, x, y, this.t, first ? a.icon : '', first && isNext ? a.name : '', !first || a.points.length > 1);
          first = false;
        });
      }
    }
    if (this.flash) D.drawHighlight(ctx, this, this.flash.slot, this.t * 3, '#45b964');
    // uttagsetiketter när man håller en kabel
    if (entry?.kind === 'cable') {
      const wants = entry.cable.wants;
      D.drawPortTags(ctx, this.portsOnScreen().map((p) => ({ ...p, want: this.help && wants.includes(p.key) && !p.busy })), this.t);
    }
    if (this.toolAnim) { const [x, y] = D.proj(this, ...this.toolAnim.pt); D.drawScrewdriver(ctx, x, y, this.toolAnim.t); }
    // etiketter för monterade delar
    if (this.labelW && this.cam.zoom <= this.fit.zoom * 1.15) {
      const labels = this.L.SLOTS.filter((s) => this.b.placed[s.id] && s.cat !== 'case').map((s) => {
        const p = this.b.placed[s.id], pt = D.proj(this, ...s.anchor);
        return { title: this.shop.cats[p.cat].name, text: p.name, pt, side: pt[0] < this.cw / 2 ? 'left' : 'right' };
      });
      D.drawLabels(ctx, this, labels, this.cw, this.ch);
    }
    ctx.restore();
  }
}
