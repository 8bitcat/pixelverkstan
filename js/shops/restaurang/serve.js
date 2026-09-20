// Serveringen i hamburgerbaren: tallriken ställs på disken (luckan) – den glider dit i bilden –
// och kunden hämtar den där, betalar och sätter sig och äter. Samma gränssnitt som datorbutikens
// skrivbordsfinal (core/build.js pratar med enter/resize/frame/draw/onPointerDown/onDrop/
// trayEntries/steps/nextStep/hintText/emptyText/guideAction/pressPower).
import { Raster } from '../../core/raster.js';
import { portrait, SHOPKEEPER } from '../../core/people.js';

const DV = { w: 872, h: 504, k: 16, hz: 13, ox: 400, oy: 80 };
const SLIDE = 0.9;     // sekunder för tallriken att glida till luckan
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export class Serving {
  static DV = DV;
  constructor(view) {
    this.view = view;
    this.R = new Raster(DV.w, DV.h); Object.assign(this.R, DV, { edges: true });
    this.t = 0;
  }
  get b() { return this.view.b; }
  get L() { return this.view.L; }
  get d() { return (this.b.desk ||= { plugs: {}, psuOn: false, attempts: {}, success: false }); }
  get customer() { const o = this.view.order, g = this.view.game; return g?.customers?.find((c) => c.id === o?.customerId) || null; }

  enter() {
    this.run = null; this.t = 0; this.dirty = true; this.plateT = 0;
    this.d.success = false;
    const v = this.view;
    this.face = portrait(this.customer?.look || SHOPKEEPER, '#f4f1ea');
    v.say(v.help ? 'Tallriken är klar! Tryck på <b>🍽️ Ställ på disken</b> – kunden hämtar den vid luckan och betalar.' : 'Ställ tallriken på disken!', 'info');
    this.resize(v.cw, v.ch, window.innerWidth <= 760);
  }
  resize(cw, ch, narrow) {
    if (!cw) return;
    this.compact = narrow;
    const s = Math.min((cw - 20) / DV.w, (ch - (narrow ? 150 : 120)) / DV.h);
    this.s = s >= 2 ? Math.floor(s * 4) / 4 : s;
    this.ox = Math.round((cw - DV.w * this.s) / 2); this.oy = Math.round(10 + (ch - 120 - DV.h * this.s) / 2);
    this.serveBtn = [cw - 236, 186, 220, 46];   // under kundens porträtt, fri från hjälprutan
    this.dirty = true;
  }
  proj(u, v, z) { const [x, y] = this.R.proj(u, v, z); return [this.ox + x * this.s, this.oy + y * this.s]; }

  // ---------- Låda & checklista ----------
  trayEntries() { return []; }
  steps() { return []; }   // checklistans "Ställ tallriken på disken" täcker steget
  nextStep() { return this.d.success ? null : { id: 'serve', kind: 'power', key: 'power' }; }
  emptyText() { return 'Allt är på tallriken! Tryck på 🍽️ Ställ på disken.'; }
  hintText() { return this.d.success ? '' : 'Tryck på <b>🍽️ Ställ på disken</b> – kunden hämtar tallriken vid luckan och betalar.'; }

  // ---------- Input ----------
  onDrop() {}
  onPointerDown(pt) {
    const r = this.serveBtn;
    if (r && pt[0] >= r[0] && pt[0] <= r[0] + r[2] && pt[1] >= r[1] && pt[1] <= r[1] + r[3] && !this.d.success && !(this.run && !this.run.done)) this.pressPower();
  }
  guideAction(act) {
    if (act === 'serve') this.pressPower();
    if (act === 'deliver') this.finish();
  }

  // ---------- Ställ på disken ----------
  pressPower(remote = false) {
    if (this.run && !this.run.done) return;
    if (!remote) this.view.op({ t: 'power' });
    this.run = { t: 0, local: !remote, step: -1, ...this.evaluate() };
    this.view.msg = null; this.view.guideKey = null;
  }
  evaluate() {
    const v = this.view, b = this.b, order = v.order;
    const target = 40 + 12 * order.items.length;
    const warnings = [];
    if (b.time > target * 1.6) warnings.push('Det tog sin tid – pommesen hann bli ljumma.');
    if (b.errors >= 4) warnings.push('Lite kladdigt på tallriken.');
    const verdict = warnings.length ? 'Gott! Men nästa gång lite snabbare.' : ['Mums! Precis som jag ville ha den!', 'Perfekt burgare. Den kommer jag tillbaka för!', 'Wow – kolla vilken burgare!', 'Exakt så här ska det smaka.'][Math.floor(Math.random() * 4)];
    return { kind: 'ok', warnings, verdict };
  }
  frame(dt) {
    this.t += dt;
    const run = this.run;
    if (!run) return;
    run.t += dt;
    const plateT = Math.min(1, run.t / SLIDE);
    if (plateT !== this.plateT) {
      this.plateT = plateT; this.dirty = true;
      // i 3D byggs voxelscenen om i fyra steg medan tallriken glider
      const step = Math.min(4, Math.floor(plateT * 4));
      if (this.view.gl && step !== run.step) { run.step = step; this.view.gl.render(this.L, this.b, { t: this.t, plateT }); }
    }
    if (!run.done && run.t >= SLIDE + 0.25) { run.done = true; this.report(run); }
  }
  report(run) {
    const v = this.view;
    if (run.local) v.op({ t: 'result', success: true });
    this.warnings = run.warnings;
    // kundens omdöme sägs vid luckan när tallriken hämtas
    const c = this.customer;
    if (c) { c.sayPickup = run.verdict; c.mood = run.warnings.length ? c.mood : 'happy'; }
    v.say(`<b>Tallriken står på disken.</b> ${esc(v.order.name)} hämtar den och betalar.`, 'good');
    v.refresh();
    if (run.local) setTimeout(() => this.finish(), 350);
  }
  finish() { if (this.finished) return; this.finished = true; this.d.success = true; this.view.finish({ warnings: this.warnings || [] }); }

  // ---------- Rendering ----------
  draw(ctx) {
    const v = this.view, cw = v.cw, ch = v.ch, gl = v.gl;
    if (!gl) {
      ctx.fillStyle = '#efe9df'; ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#e2d9c8'; ctx.fillRect(0, ch * 0.7, cw, ch);
      const key = `${this.s}|${Object.keys(this.b.placed).length}|${this.plateT}`;
      if (this.dirty || this.key !== key) { this.R.clear(); this.L.drawScene(this.R, this.b, { t: this.t, plateT: this.plateT }); this.R.flush(); this.key = key; this.dirty = false; }
      ctx.imageSmoothingEnabled = this.s * v.dpr < 1;
      ctx.drawImage(this.R.canvas, this.ox, this.oy, DV.w * this.s, DV.h * this.s);
    } else ctx.clearRect(0, 0, cw, ch);
    // kunden vid luckan
    const run = this.run, fx = cw - 150, fy = 24;
    ctx.save();
    ctx.fillStyle = '#17151a'; ctx.fillRect(fx + 3, fy + 3, 116, 116);
    ctx.fillStyle = '#f4f1ea'; ctx.fillRect(fx, fy, 116, 116);
    if (this.face) ctx.drawImage(this.face, fx + 8, fy + 8, 100, 100);
    const name = v.order.name;
    ctx.font = '18px "Jersey 10", monospace'; ctx.fillStyle = '#17151a'; ctx.textAlign = 'center'; ctx.fillText(name, fx + 58, fy + 138);
    const say = run ? (run.done ? '😋' : ['🙂', '😮', '🤤'][Math.min(2, Math.floor(run.t * 2))]) : '🙂';
    ctx.font = '38px system-ui, sans-serif'; ctx.fillText(say, fx - 30, fy + 60);
    ctx.restore();
    // knappen
    if (!this.d.success && !(run && !run.done)) {
      const [x, y, w, h] = this.serveBtn, bob = Math.sin(this.t * 4) * 2;
      ctx.save();
      ctx.fillStyle = '#17151a'; ctx.fillRect(x + 4, y + 4 - bob, w, h);
      ctx.fillStyle = '#45b964'; ctx.fillRect(x, y - bob, w, h);
      ctx.strokeStyle = '#17151a'; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5 - bob, w - 3, h - 3);
      ctx.font = '26px "Jersey 10", monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🍽️ Ställ på disken', x + w / 2, y + h / 2 + 1 - bob);
      ctx.restore();
    }
  }
}
