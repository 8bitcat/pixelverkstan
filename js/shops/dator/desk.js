// Finalen för datorbutiken: datorn står på ett skrivbord. Koppla in ström, skärm,
// tangentbord och mus på baksidan, slå på nätagget och tryck på startknappen.
// Startsekvensen avslöjar det man glömt – då får man felsöka och försöka igen.
import { Raster, hex, shade, mix, rainbow } from '../../core/raster.js';
import { drawText } from '../../core/pixfont.js';
import * as L from './layout.js';
import { drawCaseStanding, STAND } from './art-case.js';
import { fan, hash } from './art-common.js';
import { drawInternals, drawScreen, drawRear, rearPorts, SWITCH, PLUGS, plugIcon, drawPlugHead } from './desk-art.js';

const DV = { w: 420, h: 306, k: 9, hz: 7, ox: 128, oy: 100 };
const CASE_AT = [20, 2.5, 6];
const MON = { u0: 1.5, u1: 16.5, v0: 2.4, v1: 3.0, z0: 8.4, z1: 16.2 };
const STRIP = [25, 11.1, 6.4];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export class Desk {
  constructor(view) {
    this.view = view;
    this.R = new Raster(DV.w, DV.h); Object.assign(this.R, DV);
    this.side = document.createElement('canvas'); this.side.width = 100; this.side.height = 107;
    this.screen = document.createElement('canvas'); this.screen.width = 160; this.screen.height = 90;
    this.rear = document.createElement('canvas'); this.rear.width = 90; this.rear.height = 160;
    this.t = 0;
  }
  get b() { return this.view.b; }
  get d() {
    return (this.b.desk ||= { plugs: {}, psuOn: false, attempts: {}, success: false });
  }

  enter() {
    this.run = null;
    this.state = { powered: false, lit: {}, screen: 'off', mouse: false, t: 0 };
    this.d.success = false;
    const v = this.view;
    v.say(v.help
      ? `Datorn står på skrivbordet! Koppla in kablarna på <b>datorns baksida</b> (${window.innerWidth <= 760 ? 'knappen 🔌 Baksidan' : 'till vänster'}), slå på nätagget och tryck på startknappen.`
      : 'Datorn står på skrivbordet. Koppla in allt och starta den!', 'info');
    this.resize(v.cw, v.ch, window.innerWidth <= 760);
  }

  // ---------- Låda & checklista ----------
  trayEntries() {
    const d = this.d;
    return Object.entries(PLUGS).filter(([id]) => !d.plugs[id]).map(([id, p]) => ({
      key: 'plug:' + id, kind: 'plug', plug: id, name: p.name, sub: p.sub, icon: (W, H) => plugIcon(id, W, H),
    }));
  }
  steps() {
    const d = this.d, gpu = this.b.placed.gpu, next = this.nextStep();
    const list = [
      ['pc_power', 'Strömkabel → nätagget', !!d.plugs.pc_power],
      ['switch', 'Slå på nätagget (I)', d.psuOn],
      ['hdmi', `Skärmkabel → ${gpu ? 'grafikkortet' : 'moderkortet'}`, !!d.plugs.hdmi],
      ['mon_power', 'Skärmens ström → grenuttaget', !!d.plugs.mon_power],
      ['kb', 'Tangentbord → USB', !!d.plugs.kb],
      ['mouse', 'Mus → USB', !!d.plugs.mouse],
      ['power', 'Tryck på startknappen', d.success],
    ];
    return list.map(([id, label, done]) => ({ id, label, done, now: next?.id === id }));
  }
  nextStep() {
    const d = this.d;
    for (const id of ['pc_power', 'hdmi', 'mon_power', 'kb', 'mouse']) if (!d.plugs[id]) return { id, kind: 'plug', key: 'plug:' + id, entryKey: 'plug:' + id };
    if (!d.psuOn) return { id: 'switch', kind: 'switch', key: 'switch' };
    if (!d.success) return { id: 'power', kind: 'power', key: 'power' };
    return null;
  }
  hintText() {
    const s = this.nextStep();
    if (!s) return '';
    if (s.kind === 'plug') return `Dra <b>${esc(PLUGS[s.id].name)}</b> till ${PLUGS[s.id].target === 'strip' ? 'grenuttaget på bordet' : 'rätt uttag på baksidan'} (gul markering).`;
    if (s.kind === 'switch') return 'Slå på nätaggets strömbrytare på baksidan – tryck så den visar <b>I</b>.';
    return 'Tryck på <b>startknappen</b> uppe på datorns front!';
  }

  // ---------- Layout ----------
  resize(cw, ch, narrow) {
    if (!cw) return;
    this.compact = narrow;
    if (narrow) {
      // smal skärm: skrivbord och baksida visas växelvis
      this.si = Math.max(1, Math.floor(Math.min((ch - 130) / 160, (cw - 24) / 90)));
      this.insetX = Math.round((cw - 90 * this.si) / 2); this.insetY = 92;
      const s = Math.min((cw - 10) / DV.w, (ch - 130) / DV.h);
      this.s = s; this.ox = Math.round((cw - DV.w * s) / 2); this.oy = Math.round(70 + (ch - 130 - DV.h * s) / 2);
      this.toggleBtn = [cw - 150, ch - 46, 140, 38];
      return;
    }
    this.toggleBtn = null;
    const si = Math.max(1, Math.floor(Math.min((ch - 110) / 160, (cw * 0.26) / 90)));
    this.si = si;
    this.insetX = 12; this.insetY = narrow ? 64 : 34;
    const left = this.insetX + 90 * si + 16;
    const s = Math.min((cw - left - 10) / DV.w, (ch - (narrow ? 70 : 80)) / DV.h);
    this.s = s >= 2 ? Math.floor(s * 4) / 4 : s;
    this.ox = Math.round(left + (cw - left - DV.w * this.s) / 2);
    this.oy = Math.round((narrow ? 60 : 8) + (ch - (narrow ? 70 : 80) - DV.h * this.s) / 2);
  }
  proj(u, v, z) { const [x, y] = this.R.proj(u, v, z); return [this.ox + x * this.s, this.oy + y * this.s]; }
  rearRect(port) { const si = this.si; return [this.insetX + port.x * si, this.insetY + port.y * si, port.w * si, port.h * si]; }
  powerButton() { return this.proj(CASE_AT[0] + STAND.D - 0.55, CASE_AT[1] + 1.0, CASE_AT[2] + STAND.H); }

  // ---------- Input ----------
  onDrop(entry, pt) {
    if (entry.kind !== 'plug') return;
    const id = entry.plug, plug = PLUGS[id], v = this.view, d = this.d;
    this.run = null; d.success = false;
    if (plug.target === 'strip') {
      const [sx, sy] = this.proj(...STRIP);
      if (Math.hypot(sx - pt[0], sy - pt[1]) > 60 * Math.max(0.6, this.s / 2)) return v.say('Stickkontakten ska i grenuttaget på bordet.', 'err');
      d.plugs[id] = 'STRIP';
      v.say('Skärmen har fått ström.', 'info');
      return v.refresh();
    }
    const port = this.portAt(pt, 6);
    if (!port) return v.say('Släpp kontakten på ett uttag på datorns baksida.', 'err');
    if (Object.values(d.plugs).includes(port.key)) return v.fail(`${port.label} är redan upptaget.`);
    if (port.type !== plug.type) {
      const why = port.type === 'dp' && plug.type === 'hdmi' ? 'DisplayPort ser nästan likadan ut, men har ett hack i ena hörnet – HDMI passar inte.'
        : `${plug.name} passar inte i ${port.label.toLowerCase()}.`;
      return v.fail(`Fel uttag! ${why}`);
    }
    if (id === 'hdmi' && port.key === 'HDMI_MB' && this.b.placed.gpu && v.help) {
      return v.fail('Den passar, men datorn har ett grafikkort – koppla skärmen till grafikkortets uttag längre ner, annars blir det ingen bild.');
    }
    d.plugs[id] = port.key;
    v.say(`Klick! ${esc(plug.name)} sitter i ${esc(port.label.toLowerCase())}.`, 'info');
    v.refresh();
  }
  portAt(pt, pad = 0) {
    for (const port of rearPorts(this.b)) {
      const [x, y, w, h] = this.rearRect(port);
      if (pt[0] >= x - pad && pt[0] <= x + w + pad && pt[1] >= y - pad && pt[1] <= y + h + pad) return port;
    }
    return null;
  }
  onPointerDown(pt) {
    const v = this.view, d = this.d, si = this.si;
    const inRect = (r) => pt[0] >= r[0] && pt[0] <= r[0] + r[2] && pt[1] >= r[1] && pt[1] <= r[1] + r[3];
    if (this.toggleBtn && inRect(this.toggleBtn)) { this.showRear = !this.showRear; return; }
    const rearVisible = !this.compact || this.showRear, deskVisible = !this.compact || !this.showRear;
    if (rearVisible) {
      // strömbrytare
      if (inRect([this.insetX + SWITCH.x * si - 4, this.insetY + SWITCH.y * si - 4, SWITCH.w * si + 8, SWITCH.h * si + 8])) {
        d.psuOn = !d.psuOn; this.run = null; this.state.powered = false; d.success = false;
        v.say(d.psuOn ? 'Nätagget är påslaget (I).' : 'Nätagget är avslaget (O).', 'info');
        return v.refresh();
      }
      // dra ur en kontakt
      const port = this.portAt(pt, 2);
      const plugged = port && Object.entries(d.plugs).find(([, k]) => k === port.key);
      if (plugged) { delete d.plugs[plugged[0]]; this.run = null; d.success = false; this.state.powered = false; v.say(`${esc(PLUGS[plugged[0]].name)} är urdragen.`, 'info'); return v.refresh(); }
    }
    if (deskVisible) {
      const [bx, by] = this.powerButton();
      if (Math.hypot(bx - pt[0], by - pt[1]) < Math.max(18, 10 * this.s)) return this.pressPower();
      const [px, py] = this.proj(...STRIP);
      if (d.plugs.mon_power && Math.hypot(px - pt[0], py - pt[1]) < 30) { delete d.plugs.mon_power; this.run = null; d.success = false; v.say('Skärmens stickkontakt är urdragen.', 'info'); return v.refresh(); }
    }
  }
  guideAction(act) {
    if (act === 'retry') this.pressPower();
    if (act === 'deliver') this.view.finish({ warnings: this.warnings || [] });
  }

  // ---------- Starta ----------
  pressPower() {
    if (this.run && !this.run.done) return;
    this.run = { t: 0, ...this.evaluate() };
    this.pressAnim = 0.25;
    this.view.msg = null; this.view.guideKey = null;
  }

  evaluate() {
    const b = this.b, p = b.placed, d = this.d, ok = (id) => L.cableOk(b, id);
    const fail = (kind, symptom, cause, where) => ({ kind, fail: { symptom, cause, where, key: kind + cause.slice(0, 12) } });
    const dead = 'Ingenting händer när du trycker på startknappen.';
    if (!d.plugs.pc_power) return fail('dead', dead, 'Datorns strömkabel är inte inkopplad i nätagget på baksidan.', 'outside');
    if (!d.psuOn) return fail('dead', dead, 'Nätaggets strömbrytare på baksidan står på O (av).', 'outside');
    if (!ok('fpanel')) return fail('dead', dead, 'Frontpanelens kablar sitter inte i F_PANEL – startknappen är inte kopplad till moderkortet.', 'inside');
    if (!ok('atx24')) return fail('dead', dead, '24-pin-kabeln till moderkortet saknas.', 'inside');
    const need = L.wattNeed(b);
    if (p.psu.watt < need) return fail('blip', 'Fläktarna snurrar en halv sekund – sen stängs datorn av.', `Nätagget ger ${p.psu.watt} W, men delarna behöver runt ${need} W.`, 'inside');
    if (!ok('eps8')) return fail('black', 'Fläktarna snurrar, men skärmen förblir svart.', '8-pin CPU-strömmen saknas – processorn startar inte.', 'inside');
    if (p.gpu?.pwr && !ok('gpu_pwr')) return fail('nosignal', 'Fläktarna snurrar, men skärmen säger "Ingen signal".', 'Grafikkortet saknar sin strömkabel från nätagget.', 'inside');
    if (!d.plugs.mon_power) return fail('monoff', 'Datorn låter som att den är igång, men skärmen är helt släckt.', 'Skärmens strömkabel sitter inte i grenuttaget.', 'outside');
    if (!d.plugs.hdmi) return fail('nosignal', 'Skärmen säger "Ingen signal".', 'Skärmkabeln är inte inkopplad i datorn.', 'outside');
    if (d.plugs.hdmi === 'HDMI_MB' && p.gpu) return fail('nosignal', 'Skärmen säger "Ingen signal".', 'Skärmkabeln sitter i moderkortet – men datorn har ett grafikkort. Koppla skärmen till grafikkortets uttag!', 'outside');
    if (d.plugs.hdmi === 'HDMI_MB' && !p.cpu.igpu) return fail('nosignal', 'Skärmen säger "Ingen signal".', `${p.cpu.name} saknar inbyggd grafik – datorn behöver ett grafikkort.`, 'inside');
    if (!ok('cpu_fan')) return { ...fail('post', 'Skärmen visar "CPU FAN ERROR!".', 'Kylarens fläktkabel sitter inte i CPU_FAN på moderkortet.', 'inside'), errorText: 'CPU FAN ERROR! TRYCK F1' };
    if (!d.plugs.kb) return { ...fail('post', 'Skärmen visar "Inget tangentbord hittat".', 'Tangentbordet är inte inkopplat i ett USB-uttag.', 'outside'), errorText: 'INGET TANGENTBORD HITTAT' };
    if (p.bay && (!ok('sata_pwr') || !ok('sata_data'))) return { ...fail('post', 'Skärmen visar "Ingen startenhet hittad".', `Hårddisken behöver både SATA-ström och SATA-data (${!ok('sata_pwr') ? 'strömmen' : 'datakabeln'} saknas).`, 'inside'), errorText: 'INGEN STARTENHET HITTAD' };
    if (p.cooler.maxW < p.cpu.watt) return fail('overheat', 'Datorn börjar ladda – men stängs plötsligt av!', `Processorn blev för varm: ${p.cooler.name} klarar ${p.cooler.maxW} W men ${p.cpu.name} blir ${p.cpu.watt} W varm.`, 'inside');
    if (!d.plugs.mouse) return fail('nomouse', 'Datorn startar, men muspekaren syns inte och rör sig inte.', 'Musen är inte inkopplad i ett USB-uttag.', 'outside');
    const warnings = [];
    const rgbMiss = [['argb_cooler', 'kylaren'], ['argb_case', 'chassifläktarna'], ['argb_fans', 'takfläktarna']].filter(([id]) => L.cableNeeded(L.CABLE[id], b) && L.cableReady(L.CABLE[id], b) && !ok(id)).map(([, n]) => n);
    if (rgbMiss.length) warnings.push(`RGB lyser inte på ${rgbMiss.join(' och ')}.`);
    const fanMiss = [['case_fans', 'chassifläktarna'], ['top_fans', 'takfläktarna']].filter(([id]) => L.cableReady(L.CABLE[id], b) && !b.cables.has(id)).map(([, n]) => n);
    if (fanMiss.length) warnings.push(`${fanMiss.join(' och ')} snurrar inte – datorn blir varm.`);
    if (!ok('usb3')) warnings.push('USB-uttagen på framsidan fungerar inte.');
    if (!ok('audio')) warnings.push('Hörlursuttaget på framsidan fungerar inte.');
    return { kind: 'ok', warnings };
  }

  // ---------- Tid ----------
  frame(dt) {
    this.t += dt;
    if (this.pressAnim > 0) this.pressAnim -= dt;
    const st = this.state, run = this.run, b = this.b, d = this.d;
    st.t += dt;
    if (!run) { st.powered = false; st.screen = d.plugs.mon_power ? 'black' : 'off'; st.mouse = false; return; }
    run.t += dt;
    const k = run.kind, t = run.t;
    const lit = { cooler: L.cableOk(b, 'argb_cooler'), case: L.cableOk(b, 'argb_case'), fans: L.cableOk(b, 'argb_fans'), ram: true, gpu: true, mb: true, power: true };
    const monOn = !!d.plugs.mon_power;
    let end = 1.4;
    if (k === 'dead') { st.powered = false; st.screen = monOn ? 'black' : 'off'; end = 1.4; }
    else if (k === 'blip') { st.powered = t < 0.6; st.lit = lit; st.screen = monOn ? 'black' : 'off'; end = 1.8; }
    else {
      st.powered = true; st.lit = lit;
      if (k === 'black') { st.screen = monOn ? 'black' : 'off'; end = 2.6; }
      else if (k === 'nosignal') { st.screen = t > 0.8 ? 'nosignal' : 'black'; end = 3; }
      else if (k === 'monoff') { st.screen = 'off'; end = 2.6; }
      else {
        const postT = 2.2, loadT = 2.4;
        if (t < 0.6) st.screen = 'black';
        else if (t < 0.6 + postT) { st.screen = 'post'; st.t = t - 0.6; }
        else if (k === 'post') { st.screen = 'error'; st.errorText = run.errorText || 'CPU FAN ERROR! TRYCK F1'; end = 0.6 + postT + 1.6; }
        else if (t < 0.6 + postT + loadT) st.screen = 'loading';
        else if (k === 'overheat') { st.screen = t < 0.6 + postT + loadT + 1 ? 'overheat' : 'off'; st.powered = t < 0.6 + postT + loadT + 1; end = 0.6 + postT + loadT + 1.8; }
        else { st.screen = 'desktop'; st.mouse = k === 'ok'; end = 0.6 + postT + loadT + (k === 'nomouse' ? 2 : 1.2); }
        if (k === 'post') end = 0.6 + postT + 1.6;
      }
    }
    if (!run.done && t >= end) { run.done = true; this.report(run); }
  }

  report(run) {
    const v = this.view, d = this.d;
    if (run.kind === 'ok') {
      d.success = true;
      this.warnings = run.warnings;
      const warn = run.warnings.length ? `<br>⚠️ ${run.warnings.map(esc).join(' ')} <i>(${run.warnings.length} ⭐ mindre – eller öppna datorn och fixa)</i>` : '';
      v.say(`<b>Datorn fungerar!</b>${warn} <button class="btn btn-small btn-go" data-act="deliver">📦 Leverera till ${esc(v.order.name)}</button>`, 'good');
      return v.refresh();
    }
    const f = run.fail;
    v.b.errors++;
    d.attempts[f.key] = (d.attempts[f.key] || 0) + 1;
    const showCause = v.help || d.attempts[f.key] >= 2;
    const where = f.where === 'inside' ? 'Felet sitter <b>inne i datorn</b> – tryck på 🔧 Öppna datorn.' : 'Felet sitter <b>utanför datorn</b> – kolla kablarna på baksidan och bordet.';
    v.say(`<b>${esc(f.symptom)}</b> ${showCause ? esc(f.cause) + ' ' + (v.help ? where : '') : 'Vad kan vara fel?'} <button class="btn btn-small" data-act="retry">↻ Starta igen</button>`, 'err');
    v.refresh();
  }

  // ---------- Rendering ----------
  draw(ctx) {
    const v = this.view, b = this.b, d = this.d, st = this.state, t = this.t;
    const cw = v.cw, ch = v.ch;
    if (this.compact) {
      const sel = v.selected && v.trayEntries().find((e) => e.key === v.selected);
      if (sel?.plug) this.showRear = PLUGS[sel.plug].target === 'rear';
    }
    // bakgrund: vägg + golv
    ctx.fillStyle = '#e9e1d2'; ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#d9cdb7'; ctx.fillRect(0, ch * 0.72, cw, ch);
    // scenen
    const R = this.R;
    R.clear();
    const spin = st.powered ? t * 14 : 0.3;
    const o = { id: 0, t, spin, powered: st.powered, lit: st.lit };
    this.drawDesk(R);
    this.drawMonitor(R);
    drawCaseStanding(R, b.placed.case, { ...o, lit: { ...st.lit, power: st.powered } }, CASE_AT);
    R.flush();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(R.canvas, this.ox, this.oy, DV.w * this.s, DV.h * this.s);
    // glassida med insidan
    const sctx = this.side.getContext('2d');
    drawInternals(sctx, b, st, t);
    if (b.placed.case.id !== 'pop-mini-silent') this.mapFace(ctx, this.side, [CASE_AT[0] + 0.25, CASE_AT[1] + STAND.W, CASE_AT[2] + STAND.H - 0.25], [CASE_AT[0] + STAND.D - 0.25, CASE_AT[1] + STAND.W, CASE_AT[2] + STAND.H - 0.25], [CASE_AT[0] + 0.25, CASE_AT[1] + STAND.W, CASE_AT[2] + 0.6]);
    // skärmen
    const scr = this.screen.getContext('2d');
    drawScreen(scr, st, this.info(), t);
    this.mapFace(ctx, this.screen, [MON.u0 + 0.35, MON.v1, MON.z1 - 0.35], [MON.u1 - 0.35, MON.v1, MON.z1 - 0.35], [MON.u0 + 0.35, MON.v1, MON.z0 + 0.6]);
    // sladdar på bordet
    this.drawDeskCables(ctx);
    // startknapp (tryckt)
    const [bx, by] = this.powerButton();
    if (this.pressAnim > 0) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2); ctx.fill(); }
    // baksidan (på smal skärm: egen vy)
    if (this.compact && this.showRear) { ctx.fillStyle = 'rgba(233,225,210,.96)'; ctx.fillRect(0, 0, cw, ch); }
    if (!this.compact || this.showRear) this.drawInset(ctx);
    // hjälpmarkeringar
    if (v.help) this.drawHelp(ctx);
    if (this.toggleBtn) {
      const [tx, ty, tw, th] = this.toggleBtn;
      ctx.save();
      ctx.fillStyle = '#17151a'; ctx.fillRect(tx + 3, ty + 3, tw, th);
      ctx.fillStyle = '#f5c542'; ctx.fillRect(tx, ty, tw, th);
      ctx.strokeStyle = '#17151a'; ctx.lineWidth = 3; ctx.strokeRect(tx + 1.5, ty + 1.5, tw - 3, th - 3);
      ctx.font = '20px "Jersey 10", monospace'; ctx.fillStyle = '#17151a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.showRear ? '🖥️ Skrivbordet' : '🔌 Baksidan', tx + tw / 2, ty + th / 2 + 1);
      ctx.restore();
    }
  }

  mapFace(ctx, img, p00, p10, p01) {
    const [ax, ay] = this.proj(...p00), [bx, by] = this.proj(...p10), [cx, cy] = this.proj(...p01);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.transform((bx - ax) / img.width, (by - ay) / img.width, (cx - ax) / img.height, (cy - ay) / img.height, ax, ay);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  info() {
    const p = this.b.placed, o = this.view.order;
    const st = p.m2 || p.bay;
    const now = new Date();
    return {
      template: o.template,
      clock: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      postLines: [
        `CPU: ${p.cpu.name}`.toUpperCase().slice(0, 38),
        `MINNE: ${p.ram.gb} GB ${p.ram.type} OK`,
        `LAGRING: ${st ? st.name : 'SAKNAS'}`.toUpperCase().slice(0, 38),
        `GRAFIK: ${p.gpu ? p.gpu.name.replace(/^(NVIDIA|AMD|ASUS|MSI|PowerColor) /, '') : 'INBYGGD'}`.toUpperCase().slice(0, 38),
        `NÄTAGG: ${p.psu.watt} W`,
      ],
    };
  }

  drawDesk(R) {
    const wood = 0xa06a3f, woodDk = 0x7d4f2c;
    R.box(0, 32, 0, 13, 0, 6, (f, x, y, W, H) => {
      if (f === 'top') {
        const grain = Math.sin(y * 3 + Math.sin(x * 0.7) * 1.2);
        if (x < 0.15 || y < 0.15 || x > W - 0.15 || y > H - 0.15) return 0xb57b4b;
        return grain > 0.75 ? shade(wood, 0.9) : grain < -0.85 ? shade(wood, 1.07) : wood;
      }
      if (f === 'left') {
        if (y < 0.6) return 0xb57b4b;
        if (x > 3 && x < 12 && y > 1.2 && y < 5.4) return (Math.abs(y - 2.2) < 0.08 && x > 6.5 && x < 8.5) ? 0xd8b24a : (x < 3.15 || x > 11.85 || y < 1.35 || y > 5.25) ? woodDk : shade(wood, 0.95);
        return ((x * 2 + Math.sin(y * 2)) % 3 < 0.1) ? woodDk : wood;
      }
      return y < 0.6 ? 0xb57b4b : shade(wood, 0.92);
    });
    // grenuttag
    R.box(21, 29, 10.6, 11.7, 6, 6.4, (f, x, y) => {
      if (f !== 'top') return 0xdedede;
      if (x > 0.3 && x < 0.9 && y > 0.3 && y < 0.8) return 0xd8343c;
      for (let i = 0; i < 4; i++) { const cx = 1.9 + i * 1.7; if (Math.hypot(x - cx, y - 0.55) < 0.38) return 0x9a9a9a; }
      return 0xf2f2f0;
    });
    // mugg
    R.box(1.2, 2.4, 9.6, 10.8, 6, 7.1, (f, x, y) => f === 'top' ? (Math.hypot(x - 0.6, y - 0.6) < 0.45 ? 0x4a2a14 : 0xf0ece4) : (f === 'left' && x > 0.3 && x < 0.9 && y > 0.3 && y < 0.6 ? 0xc9323a : 0xf0ece4));
    // tangentbord
    const lit = this.state.powered && this.d.plugs.kb;
    R.box(3, 14, 6, 9, 6, 6.45, (f, x, y, W, H) => {
      if (f !== 'top') return 0x1c1c1e;
      if (x < 0.3 || y < 0.3 || x > W - 0.3 || y > H - 0.3) return 0x2a2a2e;
      const kx = (x - 0.3) % 0.62, ky = (y - 0.3) % 0.62;
      if (kx > 0.52 || ky > 0.52) return lit ? rainbow(this.t, x * 0.4) : 0x0c0c0e;
      return 0x3a3a40;
    });
    // musmatta + mus
    R.box(15, 19.5, 6, 10.5, 6, 6.05, () => 0x202a36);
    R.box(16.2, 17.6, 7.2, 9.3, 6.05, 6.55, (f, x, y, W, H) => {
      if (f !== 'top') return 0x1c1c1e;
      if (Math.abs(x - W / 2) < 0.05 && y < 0.8) return 0x0c0c0e;
      if (y > H - 0.3 && this.state.powered && this.d.plugs.mouse) return rainbow(this.t, 2);
      return 0x2a2a2e;
    });
  }
  drawMonitor(R) {
    R.box(7, 11, 1.3, 3.3, 6, 6.25, () => 0x2a2a2e);
    R.box(8.6, 9.4, 1.6, 2.2, 6.25, 9, () => 0x3a3a40);
    R.box(MON.u0, MON.u1, MON.v0, MON.v1, MON.z0, MON.z1, (f, x, y, W, H) => {
      if (f === 'left') {
        if (x > W - 0.9 && y > H - 0.3 && x < W - 0.7) return this.d.plugs.mon_power ? (this.state.powered ? 0x45ff7a : 0xe8a030) : 0x333333;
        return 0x141416;
      }
      return f === 'top' ? 0x26262a : 0x1c1c1e;
    });
  }

  drawDeskCables(ctx) {
    const d = this.d, s = this.s;
    ctx.save();
    ctx.lineCap = 'round';
    const line = (a, b, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, w * s); ctx.beginPath(); ctx.moveTo(...a); ctx.quadraticCurveTo((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 12 * s, ...b); ctx.stroke(); };
    const caseBack = this.proj(CASE_AT[0] + 0.2, CASE_AT[1] + 2.5, CASE_AT[2] + 3);
    if (d.plugs.kb) line(this.proj(8.5, 6, 6.2), caseBack, '#151515', 1.2);
    if (d.plugs.mouse) line(this.proj(16.9, 7.2, 6.3), caseBack, '#151515', 1.2);
    if (d.plugs.hdmi) line(this.proj(9, 2, 9), caseBack, '#151515', 1.6);
    if (d.plugs.mon_power) { const [px, py] = this.proj(...STRIP); line(this.proj(10, 2, 7), [px, py], '#e0e0dc', 1.4); ctx.fillStyle = '#e9e9e6'; ctx.fillRect(px - 4 * s, py - 4 * s, 8 * s, 6 * s); }
    if (d.plugs.pc_power) { const [px, py] = this.proj(STRIP[0] + 1.7, STRIP[1], STRIP[2]); line(caseBack, [px, py], '#111', 1.8); ctx.fillStyle = '#111'; ctx.fillRect(px - 4 * s, py - 4 * s, 8 * s, 6 * s); }
    ctx.restore();
  }

  drawInset(ctx) {
    const si = this.si, x0 = this.insetX, y0 = this.insetY, d = this.d;
    const rc = this.rear.getContext('2d');
    drawRear(rc, this.b, { ...this.state, psuOn: d.psuOn }, this.t, Object.fromEntries(Object.entries(d.plugs).filter(([, k]) => k !== 'STRIP')));
    ctx.save();
    ctx.fillStyle = '#17151a'; ctx.fillRect(x0 - 4, y0 - 26, 90 * si + 8, 160 * si + 30);
    ctx.font = '18px "Jersey 10", monospace'; ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
    ctx.fillText('DATORNS BAKSIDA', x0 + 2, y0 - 13);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.rear, x0, y0, 90 * si, 160 * si);
    ctx.restore();
  }

  drawHelp(ctx) {
    const s = this.nextStep(), v = this.view, t = this.t;
    const ring = (x, y, w, h) => { ctx.save(); ctx.strokeStyle = '#f5c542'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.lineDashOffset = -t * 30; ctx.strokeRect(x - 4, y - 4, w + 8, h + 8); ctx.restore(); };
    const sel = v.selected && v.trayEntries().find((e) => e.key === v.selected);
    const plugId = sel?.plug || (s?.kind === 'plug' ? s.id : null);
    const rearVisible = !this.compact || this.showRear, deskVisible = !this.compact || !this.showRear;
    if (plugId) {
      const plug = PLUGS[plugId];
      if (plug.target === 'strip') { if (!deskVisible) return; const [x, y] = this.proj(...STRIP); ring(x - 30, y - 12, 60, 24); }
      else if (rearVisible) for (const port of rearPorts(this.b)) {
        if (port.type !== plug.type || Object.values(this.d.plugs).includes(port.key)) continue;
        if (plugId === 'hdmi' && this.b.placed.gpu && port.key === 'HDMI_MB') continue;
        ring(...this.rearRect(port));
      }
    }
    if (!sel && s?.kind === 'switch' && rearVisible) { const si = this.si; ring(this.insetX + SWITCH.x * si, this.insetY + SWITCH.y * si, SWITCH.w * si, SWITCH.h * si); }
    if (!sel && s?.kind === 'power' && deskVisible && !(this.run && !this.run.done)) {
      const [x, y] = this.powerButton();
      ctx.save(); ctx.fillStyle = 'rgba(245,197,66,.45)'; ctx.beginPath(); ctx.arc(x, y, 14 + Math.sin(t * 6) * 3, 0, Math.PI * 2); ctx.fill();
      ctx.font = '20px "VT323", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#17151a'; ctx.fillText('⏻', x, y + 6); ctx.restore();
    }
  }
}

