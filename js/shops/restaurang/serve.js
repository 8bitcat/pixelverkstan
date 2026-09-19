// Finalen i hamburgerbaren: brickan serveras och kunden smakar. Samma gränssnitt som
// datorbutikens skrivbordsfinal (core/build.js pratar med enter/resize/frame/draw/onPointerDown/
// onDrop/trayEntries/steps/nextStep/hintText/emptyText/guideAction/pressPower).
import { Raster } from '../../core/raster.js';
import { portrait, SHOPKEEPER } from '../../core/people.js';

const DV = { w: 872, h: 504, k: 16, hz: 13, ox: 400, oy: 80 };
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
    this.run = null; this.t = 0; this.dirty = true;
    this.d.success = false;
    const v = this.view;
    this.face = portrait(this.customer?.look || SHOPKEEPER, '#f4f1ea');
    v.say(v.help ? 'Brickan är klar! Tryck på <b>🍽️ Servera</b> så får kunden smaka.' : 'Servera brickan till kunden!', 'info');
    this.resize(v.cw, v.ch, window.innerWidth <= 760);
  }
  resize(cw, ch, narrow) {
    if (!cw) return;
    this.compact = narrow;
    const s = Math.min((cw - 20) / DV.w, (ch - (narrow ? 150 : 120)) / DV.h);
    this.s = s >= 2 ? Math.floor(s * 4) / 4 : s;
    this.ox = Math.round((cw - DV.w * this.s) / 2); this.oy = Math.round(10 + (ch - 120 - DV.h * this.s) / 2);
    this.serveBtn = [cw - 226, 186, 210, 46];   // under kundens porträtt, fri från hjälprutan
    this.dirty = true;
  }
  proj(u, v, z) { const [x, y] = this.R.proj(u, v, z); return [this.ox + x * this.s, this.oy + y * this.s]; }

  // ---------- Låda & checklista ----------
  trayEntries() { return []; }
  steps() { return []; }   // checklistans "Servera brickan" täcker steget
  nextStep() { return this.d.success ? null : { id: 'serve', kind: 'power', key: 'power' }; }
  emptyText() { return 'Allt är på brickan! Tryck på 🍽️ Servera.'; }
  hintText() { return this.d.success ? '' : 'Tryck på <b>🍽️ Servera</b> så får kunden smaka.'; }

  // ---------- Input ----------
  onDrop() {}
  onPointerDown(pt) {
    const r = this.serveBtn;
    if (r && pt[0] >= r[0] && pt[0] <= r[0] + r[2] && pt[1] >= r[1] && pt[1] <= r[1] + r[3] && !this.d.success && !(this.run && !this.run.done)) this.pressPower();
  }
  guideAction(act) {
    if (act === 'serve') this.pressPower();
    if (act === 'deliver') this.view.finish({ warnings: this.warnings || [] });
  }

  // ---------- Servera ----------
  pressPower(remote = false) {
    if (this.run && !this.run.done) return;
    if (!remote) this.view.op({ t: 'power' });
    this.run = { t: 0, local: !remote, ...this.evaluate() };
    this.view.msg = null; this.view.guideKey = null;
  }
  evaluate() {
    const v = this.view, b = this.b, order = v.order;
    const target = 40 + 12 * order.items.length;
    const warnings = [];
    if (b.time > target * 1.6) warnings.push('Det tog sin tid – pommesen hann bli ljumma.');
    if (b.errors >= 4) warnings.push('Lite kladdigt på brickan.');
    const kind = 'ok';
    const verdict = warnings.length ? 'Gott! Men nästa gång lite snabbare.' : ['Mums! Precis som jag ville ha den!', 'Perfekt burgare. Den kommer jag tillbaka för!', 'Wow – kolla vilken burgare!', 'Exakt så här ska det smaka.'][Math.floor(Math.random() * 4)];
    return { kind, warnings, verdict };
  }
  frame(dt) {
    this.t += dt;
    const run = this.run;
    if (!run) return;
    run.t += dt;
    if (!run.done && run.t >= 1.5) { run.done = true; this.report(run); }
  }
  report(run) {
    const v = this.view;
    if (run.local) v.op({ t: 'result', success: true });
    this.warnings = run.warnings;
    const warn = run.warnings.length ? `<br>⚠️ ${run.warnings.map(esc).join(' ')} <i>(${run.warnings.length} ⭐ mindre)</i>` : '';
    v.say(`<b>${esc(run.verdict)}</b>${warn} <button class="btn btn-small btn-go" data-act="deliver">📦 Lämna över till ${esc(v.order.name)}</button>`, 'good');
    v.refresh();
  }

  // ---------- Rendering ----------
  draw(ctx) {
    const v = this.view, cw = v.cw, ch = v.ch, gl = v.gl;
    if (!gl) {
      ctx.fillStyle = '#efe9df'; ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#e2d9c8'; ctx.fillRect(0, ch * 0.7, cw, ch);
      const key = `${this.s}|${Object.keys(this.b.placed).length}`;
      if (this.dirty || this.key !== key) { this.R.clear(); this.L.drawScene(this.R, this.b, { t: this.t }); this.R.flush(); this.key = key; this.dirty = false; }
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
    // pratbubbla
    const say = run ? (run.done ? (run.warnings.length ? '🙂' : '😋') : ['😮', '🤤', '😋'][Math.min(2, Math.floor(run.t * 2))]) : '🙂';
    ctx.font = '38px system-ui, sans-serif'; ctx.fillText(say, fx - 30, fy + 60);
    ctx.restore();
    // servera-knappen
    if (!this.d.success && !(run && !run.done)) {
      const [x, y, w, h] = this.serveBtn, bob = Math.sin(this.t * 4) * 2;
      ctx.save();
      ctx.fillStyle = '#17151a'; ctx.fillRect(x + 4, y + 4 - bob, w, h);
      ctx.fillStyle = '#45b964'; ctx.fillRect(x, y - bob, w, h);
      ctx.strokeStyle = '#17151a'; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5 - bob, w - 3, h - 3);
      ctx.font = '26px "Jersey 10", monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🍽️ Servera', x + w / 2, y + h / 2 + 1 - bob);
      ctx.restore();
    }
  }
}
