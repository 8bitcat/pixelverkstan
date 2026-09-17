// Finalen för datorbutiken: datorn står på ett skrivbord. Koppla in ström, skärm,
// tangentbord och mus på baksidan, slå på nätagget och tryck på startknappen.
// Startsekvensen avslöjar det man glömt – då får man felsöka och försöka igen.
import { Raster, hex, shade, mix, rainbow } from '../../core/raster.js';
import { drawText, textBitmap } from '../../core/pixfont.js';
import { deskEra, plugsFor, rearPorts } from './desk-era.js';
import { drawCaseStanding, standDims } from './art-case.js';
import { drawMonitor, drawKeyboard, drawMouse, drawDeskDecor, monitorFace, screenSize } from './desk-props.js';
import { fan, hash } from './art-common.js';
import { drawInternals, drawScreen, drawRear, switchRect, plugIcon, drawPlugHead } from './desk-art.js';

const DV = { w: 840, h: 612, k: 18, hz: 14, ox: 256, oy: 200 };
const CASE_AT = [20, 2.5, 6];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export class Desk {
  constructor(view) {
    this.view = view;
    this.R = new Raster(DV.w, DV.h); Object.assign(this.R, DV, { edges: true });
    this.redraw = 0;
    this.side = document.createElement('canvas'); this.side.width = 200; this.side.height = 214;
    this.screen = document.createElement('canvas'); this.screen.width = 160; this.screen.height = 90;
    this.rear = document.createElement('canvas'); this.rear.width = 90; this.rear.height = 160;
    this.t = 0;
  }
  get b() { return this.view.b; }
  get L() { return this.view.L; }
  get PLUGS() { return this.plugs || (this.setupEra(), this.plugs); }
  get SWITCH() { return switchRect(this.L.geo.kind); }
  setupEra() {
    this.era = deskEra(this.L, this.b.placed); this.plugs = plugsFor(this.era);
    const sz = screenSize(this.era);
    if (this.screen && this.screen.width !== sz.w) { this.screen.width = sz.w; this.screen.height = sz.h; }
  }
  get dims() { return standDims(this.b.placed.case); }
  // grenuttaget flyttar in när en liggande skrivbordslåda tar plats
  get STRIP() { return this.dims.W > 6 ? [14.5, 11.9, 6.4] : [25, 11.1, 6.4]; }
  ports() { return rearPorts(this.b, this.era || (this.setupEra(), this.era), this.L); }
  get d() {
    return (this.b.desk ||= { plugs: {}, psuOn: false, attempts: {}, success: false });
  }

  enter() {
    this.run = null;
    this.setupEra();
    this.Rs = null; this.staticKey = null;
    for (const id of Object.keys(this.d.plugs)) if (!this.plugs[id]) delete this.d.plugs[id];
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
    return Object.entries(this.PLUGS).filter(([id]) => !d.plugs[id]).map(([id, p]) => ({
      key: 'plug:' + id, kind: 'plug', plug: id, name: p.name, sub: p.sub, icon: (W, H) => plugIcon(id, W, H, p.type, this.era),
    }));
  }
  steps() {
    const d = this.d, gpu = this.b.placed.gpu, next = this.nextStep(), P = this.PLUGS;
    const list = [
      ['pc_power', 'Strömkabel → nätagget', !!d.plugs.pc_power],
      ['switch', this.era?.at ? 'Slå på den röda strömbrytaren' : 'Slå på nätagget (I)', this.era?.at ? d.success : d.psuOn],
      ['video', `${P.video.name} → ${gpu ? 'grafikkortet' : 'moderkortet'}`, !!d.plugs.video],
      ['mon_power', 'Skärmens ström → grenuttaget', !!d.plugs.mon_power],
      ['kb', `Tangentbord → ${P.kb.sub}`, !!d.plugs.kb],
      ...(P.mouse ? [['mouse', `Mus → ${P.mouse.sub}`, !!d.plugs.mouse]] : []),
      ...(this.era?.at ? [] : [['power', 'Tryck på startknappen', d.success]]),
    ];
    return list.map(([id, label, done]) => ({ id, label, done, now: next?.id === id }));
  }
  nextStep() {
    const d = this.d;
    for (const id of ['pc_power', 'video', 'mon_power', 'kb', 'mouse']) if (this.PLUGS[id] && !d.plugs[id]) return { id, kind: 'plug', key: 'plug:' + id, entryKey: 'plug:' + id };
    if (!d.psuOn) return { id: 'switch', kind: 'switch', key: 'switch' };
    if (this.era?.at) return d.success ? null : { id: 'switch', kind: 'switch', key: 'switch' };
    if (!d.success) return { id: 'power', kind: 'power', key: 'power' };
    return null;
  }
  emptyText() { return this.era?.at ? 'Allt är inkopplat! Slå på den röda strömbrytaren på nätagget.' : 'Allt är inkopplat! Tryck på startknappen på datorn.'; }
  hintText() {
    const s = this.nextStep();
    if (!s) return '';
    if (s.kind === 'plug') return `Dra <b>${esc(this.PLUGS[s.id].name)}</b> till ${this.PLUGS[s.id].target === 'strip' ? 'grenuttaget på bordet' : 'rätt uttag på baksidan'} (gul markering).`;
    if (s.kind === 'switch') return this.era?.at ? 'Slå på den <b>röda strömbrytaren</b> på nätagget – på AT-datorer startar datorn direkt!' : 'Slå på nätaggets strömbrytare på baksidan – tryck så den visar <b>I</b>.';
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
  powerButton() { const S = this.dims; return this.proj(CASE_AT[0] + S.D - 0.55, CASE_AT[1] + 1.0, CASE_AT[2] + S.H); }

  // ---------- Input ----------
  onDrop(entry, pt) {
    if (entry.kind !== 'plug') return;
    const id = entry.plug, plug = this.PLUGS[id], v = this.view, d = this.d;
    this.run = null; d.success = false;
    if (plug.target === 'strip') {
      const [sx, sy] = this.proj(...this.STRIP);
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
        : port.type === 'ps2m' && plug.type === 'ps2k' ? 'Musens PS/2-uttag (grönt) ser likadant ut – tangentbordet ska i det lila.'
          : port.type === 'serial' && plug.type === 'de9' ? 'Serieporten har också 9 stift, men den har stift – skärmkabeln ska till grafikkortets uttag.'
            : `${plug.name} passar inte i ${port.label.toLowerCase()}.`;
      return v.fail(`Fel uttag! ${why}`);
    }
    if (id === 'video' && port.owner === 'mb' && this.b.placed.gpu && v.help) {
      return v.fail('Den passar, men datorn har ett grafikkort – koppla skärmen till grafikkortets uttag längre ner, annars blir det ingen bild.');
    }
    d.plugs[id] = port.key;
    v.say(`Klick! ${esc(plug.name)} sitter i ${esc(port.label.toLowerCase())}.`, 'info');
    v.refresh();
  }
  portAt(pt, pad = 0) {
    for (const port of this.ports()) {
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
      const SW = this.SWITCH;
      if (inRect([this.insetX + SW.x * si - 4, this.insetY + SW.y * si - 4, SW.w * si + 8, SW.h * si + 8])) {
        d.psuOn = !d.psuOn; this.run = null; this.state.powered = false; d.success = false;
        if (this.era?.at && d.psuOn) { v.refresh(); return this.pressPower(); }
        v.say(d.psuOn ? 'Nätagget är påslaget (I).' : 'Nätagget är avslaget (O).', 'info');
        return v.refresh();
      }
      // dra ur en kontakt
      const port = this.portAt(pt, 2);
      const plugged = port && Object.entries(d.plugs).find(([, k]) => k === port.key);
      if (plugged) { delete d.plugs[plugged[0]]; this.run = null; d.success = false; this.state.powered = false; v.say(`${esc(this.PLUGS[plugged[0]].name)} är urdragen.`, 'info'); return v.refresh(); }
    }
    if (deskVisible) {
      const [bx, by] = this.powerButton();
      if (Math.hypot(bx - pt[0], by - pt[1]) < Math.max(18, 10 * this.s)) {
        if (this.era?.at) return v.say('AT-datorer har ingen mjuk startknapp – slå på den röda strömbrytaren på nätagget (på baksidan).', 'info');
        return this.pressPower();
      }
      const [px, py] = this.proj(...this.STRIP);
      if (d.plugs.mon_power && Math.hypot(px - pt[0], py - pt[1]) < 30) { delete d.plugs.mon_power; this.run = null; d.success = false; v.say('Skärmens stickkontakt är urdragen.', 'info'); return v.refresh(); }
    }
  }
  guideAction(act) {
    if (act === 'retry') { if (this.era?.at) this.d.psuOn = true; this.pressPower(); }
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
    const L = this.L, b = this.b, p = b.placed, d = this.d, era = this.era, ok = (id) => L.cableOk(b, id);
    const has = (id) => !!L.CABLE[id] && L.cableNeeded(L.CABLE[id], b) && L.cableReady(L.CABLE[id], b);
    const fail = (kind, symptom, cause, where) => ({ kind, fail: { symptom, cause, where, key: kind + cause.slice(0, 12) } });
    const post = (symptom, cause, where, errorText) => ({ ...fail('post', symptom, cause, where), errorText });
    const y = era.year;
    const dead = 'Ingenting händer när du trycker på startknappen.';
    if (!d.plugs.pc_power) return fail('dead', dead, 'Datorns strömkabel är inte inkopplad i nätagget på baksidan.', 'outside');
    if (!d.psuOn) return fail('dead', dead, 'Nätaggets strömbrytare står på O (av).', 'outside');
    if (L.profile === 'AT') {
      if (!b.cables.has('p8') || !b.cables.has('p9')) return fail('dead', dead, `${!b.cables.has('p8') ? 'P8' : 'P9'}-kontakten från nätagget sitter inte i moderkortet.`, 'inside');
      if (!ok('p8') || !ok('p9')) return fail('smoke', 'Det small till och luktar bränt ur datorn!', 'P8 och P9 sitter omvända – de svarta sladdarna ska sitta mot varandra i mitten. Tur att kortet klarade sig!', 'inside');
    } else {
      if (!ok('fpanel')) return fail('dead', dead, 'Frontpanelens kablar sitter inte i F_PANEL – startknappen är inte kopplad till moderkortet.', 'inside');
      if (!ok('main_pwr')) return fail('dead', dead, `${L.PORTS.ATX_PWR?.label || 'ATX'}-kabeln till moderkortet saknas.`, 'inside');
    }
    const need = L.wattNeed(b);
    if (p.psu.watt < need) return fail('blip', 'Fläktarna snurrar en halv sekund – sen stängs datorn av.', `Nätagget ger ${p.psu.watt} W, men delarna behöver runt ${need} W.`, 'inside');
    if (L.CABLE.cpu_pwr && !ok('cpu_pwr')) return fail('black', 'Fläktarna snurrar, men skärmen förblir svart.', `${L.PORTS.CPU_PWR?.label || 'CPU'}-strömmen saknas – processorn startar inte.`, 'inside');
    if (L.ACTION.jumpers && !L.actDone(b, 'jumpers')) return fail('black', 'Hårddisken surrar, men skärmen förblir svart.', L.mb.form === 'XT' ? 'DIP-switcharna på kortet är inte inställda – datorn vet inte hur mycket minne och vilket grafikkort den har.' : 'Jumprarna på moderkortet är inte inställda för processorn (klockfrekvens och spänning).', 'inside');
    if (!p.gpu && era.needsGpu) return fail('nosignal', 'Skärmen får ingen bild.', 'Moderkortet har ingen inbyggd grafik – datorn behöver ett grafikkort.', 'inside');
    if (p.gpu?.pwr && !ok('gpu_pwr')) return fail('nosignal', 'Fläktarna snurrar, men skärmen får ingen bild.', 'Grafikkortet saknar sin strömkabel från nätagget.', 'inside');
    if (!d.plugs.mon_power) return fail('monoff', 'Datorn låter som att den är igång, men skärmen är helt släckt.', 'Skärmens strömkabel sitter inte i grenuttaget.', 'outside');
    if (!d.plugs.video) return fail('nosignal', 'Skärmen får ingen bild.', 'Skärmkabeln är inte inkopplad i datorn.', 'outside');
    const vport = this.ports().find((q) => q.key === d.plugs.video);
    if (vport?.owner === 'mb' && p.gpu) return fail('nosignal', 'Skärmen får ingen bild.', 'Skärmkabeln sitter i moderkortet – men datorn har ett grafikkort. Koppla skärmen till grafikkortets uttag!', 'outside');
    if (has('cpu_fan') && !ok('cpu_fan')) {
      if (L.fanHdr) return post('Skärmen visar "CPU FAN ERROR!".', 'Kylarens fläktkabel sitter inte i CPU_FAN på moderkortet.', 'inside', 'CPU FAN ERROR! PRESS F1');
      return fail('overheat', 'Datorn börjar ladda – men hänger sig plötsligt!', 'Kylarens fläkt har ingen ström – den ska kopplas till en Molex-kontakt från nätagget.', 'inside');
    }
    if (!d.plugs.kb) return post('Skärmen visar "Keyboard error".', 'Tangentbordet är inte inkopplat.', 'outside', 'KEYBOARD ERROR OR NO KEYBOARD PRESENT');
    const bootErr = y < 1996 ? 'NON-SYSTEM DISK OR DISK ERROR' : y < 2008 ? 'DISK BOOT FAILURE, INSERT SYSTEM DISK' : 'NO BOOT DEVICE FOUND';
    if (L.ACTION.ctrl_card && !L.actDone(b, 'ctrl_card')) return post('Skärmen visar "HDD controller failure".', 'Kontrollerkortet för hårddisken sitter inte i en kortplats.', 'inside', 'HDD CONTROLLER FAILURE');
    if (p.bay && (!ok('bay_pwr') || !ok('bay_data'))) {
      const what = !ok('bay_pwr') ? 'strömkabeln' : 'datakabeln';
      const right = L.CABLE.bay_data.wants.map(L.portLabel).join(' / ');
      return post(`Skärmen visar "${bootErr}".`, `Hårddisken hittas inte – ${what} saknas eller sitter fel (datakabeln ska till ${right}).`, 'inside', bootErr);
    }
    if (p.cooler && p.cooler.maxW < p.cpu.watt) return fail('overheat', 'Datorn börjar ladda – men stängs plötsligt av!', `Processorn blev för varm: ${p.cooler.name} klarar ${p.cooler.maxW} W men ${p.cpu.name} blir ${p.cpu.watt} W varm.`, 'inside');
    if (this.PLUGS.mouse && !d.plugs.mouse) return fail('nomouse', 'Datorn startar, men muspekaren syns inte och rör sig inte.', 'Musen är inte inkopplad.', 'outside');
    const warnings = [];
    const miss = (list) => list.filter(([id]) => has(id) && !ok(id)).map(([, n]) => n);
    const rgbMiss = miss([['argb_cooler', 'kylaren'], ['argb_case', 'chassifläktarna'], ['argb_fans', 'fläktarna']]);
    if (rgbMiss.length) warnings.push(`Lamporna lyser inte på ${rgbMiss.join(' och ')}.`);
    const fanMiss = miss([['case_fans', 'chassifläktarna'], ['top_fans', 'fläktarna']]);
    if (fanMiss.length) warnings.push(`${fanMiss.join(' och ')} snurrar inte – datorn blir varm.`);
    if (has('usb_front') && !ok('usb_front')) warnings.push('USB-uttagen på framsidan fungerar inte.');
    if (has('audio_front') && !ok('audio_front')) warnings.push('Hörlursuttaget på framsidan fungerar inte.');
    if (L.profile === 'AT' && has('fpanel') && !ok('fpanel')) warnings.push('Reset-knappen, turbolampan och högtalaren fungerar inte.');
    for (const sid of ['media', 'media2', 'floppy']) {
      if (!p[sid] || (ok(sid + '_pwr') && ok(sid + '_data'))) continue;
      warnings.push(p[sid].iface === 'floppy' ? 'Diskettstationen fungerar inte.' : `${p[sid].kind?.startsWith('dvd') ? 'DVD' : p[sid].kind === 'bd' ? 'Blu-ray' : 'CD'}-enheten syns inte i datorn.`);
    }
    if (has('cd_audio') && !ok('cd_audio')) warnings.push('Musiken från CD-skivan hörs inte.');
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
    const L = this.L;
    const lit = { cooler: L.cableOk(b, 'argb_cooler'), case: L.cableOk(b, 'argb_case'), fans: L.cableOk(b, 'argb_fans'), ram: true, gpu: true, mb: true, power: true };
    const monOn = !!d.plugs.mon_power;
    let end = 1.4;
    if (k === 'smoke') { st.powered = t < 0.35; st.screen = monOn ? 'black' : 'off'; st.smoke = t; end = 2.2; }
    else if (k === 'dead') { st.powered = false; st.screen = monOn ? 'black' : 'off'; end = 1.4; }
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
      if (sel?.plug) this.showRear = this.PLUGS[sel.plug].target === 'rear';
    }
    // bakgrund: vägg + golv
    ctx.fillStyle = '#e9e1d2'; ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#d9cdb7'; ctx.fillRect(0, ch * 0.72, cw, ch);
    // scenen i två lager: statiskt (bord, skärm, mugg) och rörligt (dator, tangentbord, mus)
    const staticKey = `${!!d.plugs.mon_power}|${st.powered}|${this.era?.monitor}|${this.dims.W}`;
    if (!this.Rs || this.staticKey !== staticKey) {
      this.Rs ||= Object.assign(new Raster(DV.w, DV.h), DV, { edges: true });
      this.Rs.clear(); this.drawStatic(this.Rs); this.Rs.flush();
      this.staticKey = staticKey;
    }
    const dynKey = `${st.powered}|${Object.keys(d.plugs).length}|${JSON.stringify(st.lit)}`;
    this.redraw -= 1 / 60;
    if (this.dynKey !== dynKey || (st.powered && this.redraw <= 0)) {
      const R = this.R;
      R.clear();
      const o = { id: 0, t, spin: st.powered ? t * 14 : 0.3, powered: st.powered, lit: { ...st.lit, power: st.powered } };
      this.drawDynamic(R);
      drawCaseStanding(R, b.placed.case, o, CASE_AT);
      R.flush();
      this.dynKey = dynKey; this.redraw = 1 / 15;
    }
    ctx.imageSmoothingEnabled = this.s * v.dpr < 1;
    ctx.drawImage(this.Rs.canvas, this.ox, this.oy, DV.w * this.s, DV.h * this.s);
    ctx.drawImage(this.R.canvas, this.ox, this.oy, DV.w * this.s, DV.h * this.s);
    // glassida med insidan
    const sctx = this.side.getContext('2d');
    const S = this.dims, win = b.placed.case.look?.window ?? (b.placed.case.id !== 'pop-mini-silent');
    if (win) {
      drawInternals(sctx, b, st, t);
      this.mapFace(ctx, this.side, [CASE_AT[0] + 0.25, CASE_AT[1] + S.W, CASE_AT[2] + S.H - 0.25], [CASE_AT[0] + S.D - 0.25, CASE_AT[1] + S.W, CASE_AT[2] + S.H - 0.25], [CASE_AT[0] + 0.25, CASE_AT[1] + S.W, CASE_AT[2] + 0.6]);
    }
    // skärmen
    const scr = this.screen.getContext('2d');
    drawScreen(scr, st, this.info(), t);
    this.mapFace(ctx, this.screen, ...monitorFace(this.era));
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
    const p = this.b.placed, o = this.view.order, era = this.era || {};
    const st = p.m2 || p.bay;
    const now = new Date();
    const ramMB = p.ram?.mb ?? (p.ram?.gb || 0) * 1024;
    const ramText = ramMB < 1 ? `${Math.round(ramMB * 1024)} KB` : ramMB < 1024 ? `${ramMB} MB` : `${Math.round(ramMB / 1024)} GB`;
    const mhz = p.cpu?.mhz ? (p.cpu.mhz >= 1000 ? `${(p.cpu.mhz / 1000).toFixed(1)} GHZ` : `${Math.round(p.cpu.mhz)} MHZ`) : '';
    return {
      template: o.template, year: era.year, os: era.os, monitor: era.monitor, era,
      ramKB: Math.round(ramMB * 1024),
      clock: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      postLines: [
        `CPU: ${p.cpu.name} ${mhz}`.toUpperCase().slice(0, 38),
        `MINNE: ${ramText} ${p.ram.type} OK`.toUpperCase(),
        `LAGRING: ${st ? st.name : 'SAKNAS'}`.toUpperCase().slice(0, 38),
        `GRAFIK: ${p.gpu ? p.gpu.name.replace(/^(NVIDIA|AMD|ASUS|MSI|PowerColor) /, '') : 'INBYGGD'}`.toUpperCase().slice(0, 38),
        `NÄTAGG: ${p.psu.watt} W`,
      ],
    };
  }

  drawStatic(R) {
    const wood = 0xa06a3f, woodDk = 0x7d4f2c, woodLt = 0xb57b4b;
    R.box(0, 32, 0, 13, 0, 6, (f, x, y, W, H) => {
      if (f === 'top') {
        if (x < 0.12 || y < 0.12 || x > W - 0.12 || y > H - 0.12) return woodLt;
        const grain = Math.sin(y * 3.2 + Math.sin(x * 0.7) * 1.3 + Math.sin(x * 2.3) * 0.15);
        if (grain > 0.9) return shade(wood, 0.84);
        if (grain > 0.72) return shade(wood, 0.93);
        if (grain < -0.88) return shade(wood, 1.08);
        return hash(x * 8 | 0, y * 8 | 0) > 0.97 ? shade(wood, 0.9) : wood;
      }
      if (f === 'left') {
        if (y < 0.5) return y < 0.1 ? woodLt : shade(wood, 1.02);
        if (x > 3 && x < 12 && y > 1.2 && y < 5.4) {
          if (x < 3.12 || x > 11.88 || y < 1.32 || y > 5.28) return woodDk;
          if (Math.abs(y - 2.2) < 0.1 && x > 6.4 && x < 8.6) return y < 2.2 ? 0xf0cf6a : 0xb8902e;   // handtag
          return ((x * 2 + Math.sin(y * 3)) % 2.5 < 0.08) ? shade(wood, 0.88) : shade(wood, 0.97);
        }
        return ((x * 2 + Math.sin(y * 2)) % 3 < 0.08) ? woodDk : wood;
      }
      return y < 0.5 ? woodLt : ((y * 2 + Math.sin(x * 3)) % 3 < 0.08 ? woodDk : shade(wood, 0.92));
    }, 0, { noEdges: true });
    // mugg med handtag och kaffe
    R.box(1.2, 2.4, 9.6, 10.8, 6, 7.1, (f, x, y, W, H) => {
      if (f === 'top') { const d = Math.hypot(x - 0.6, y - 0.6); return d < 0.42 ? (d < 0.2 ? 0x6a4020 : 0x4a2a14) : 0xf7f3ec; }
      if (f === 'left' && x > 0.3 && x < 0.9 && y > 0.3 && y < 0.62) return (y < 0.4 || y > 0.54) ? 0xc9323a : 0xffffff;
      return 0xf0ece4;
    });
    R.box(2.4, 2.6, 10.0, 10.4, 6.3, 6.9, () => 0xe6e2da);
    drawMonitor(R, this.era, { monPower: !!this.d.plugs.mon_power, powered: this.state.powered });
    drawDeskDecor(R, this.era, this.t, this.view.order?.template);
  }
  drawDynamic(R) {
    const t = this.t, st = this.state, d = this.d;
    // grenuttag med strömbrytare och uttag
    const [su, sv] = this.STRIP, s0 = su - 4, v0s = sv - 0.5;
    R.box(s0, s0 + 8, v0s, v0s + 1.1, 6, 6.4, (f, x, y) => {
      if (f !== 'top') return 0xdedede;
      if (x > 0.25 && x < 0.95 && y > 0.25 && y < 0.85) return y < 0.55 ? 0xe84a52 : 0xb82830;
      for (let i = 0; i < 4; i++) {
        const cx = 1.9 + i * 1.7, dd = Math.hypot(x - cx, y - 0.55);
        if (dd < 0.4) return (Math.abs(x - cx - 0.15) < 0.05 || Math.abs(x - cx + 0.15) < 0.05) && Math.abs(y - 0.55) < 0.1 ? 0x2a2a2a : (dd > 0.33 ? 0xbdbdbd : 0x9a9a9a);
      }
      return 0xf2f2f0;
    });
    const lit = st.powered && !!d.plugs.kb;
    drawKeyboard(R, this.era, lit, t);
    if (this.era.mouse) drawMouse(R, this.era, st.powered && !!d.plugs.mouse, t);
  }

  drawDeskCables(ctx) {
    const d = this.d, s = this.s;
    ctx.save();
    ctx.lineCap = 'round';
    const line = (a, b, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, w * s); ctx.beginPath(); ctx.moveTo(...a); ctx.quadraticCurveTo((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 12 * s, ...b); ctx.stroke(); };
    const caseBack = this.proj(CASE_AT[0] + 0.2, CASE_AT[1] + 2.5, CASE_AT[2] + 3);
    if (d.plugs.kb) line(this.proj(8.5, 6, 6.2), caseBack, '#151515', 1.2);
    if (d.plugs.mouse) line(this.proj(16.9, 7.2, 6.3), caseBack, '#151515', 1.2);
    if (d.plugs.video) line(this.proj(9, this.era?.monitor?.startsWith('lcd') ? 2 : 0.6, 9), caseBack, this.era?.videoType === 'vga' ? '#1a2a6a' : '#151515', 1.6);
    if (d.plugs.mon_power) { const [px, py] = this.proj(...this.STRIP); line(this.proj(10, 2, 7), [px, py], '#e0e0dc', 1.4); ctx.fillStyle = '#e9e9e6'; ctx.fillRect(px - 4 * s, py - 4 * s, 8 * s, 6 * s); }
    if (d.plugs.pc_power) { const [px, py] = this.proj(this.STRIP[0] + 1.7, this.STRIP[1], this.STRIP[2]); line(caseBack, [px, py], '#111', 1.8); ctx.fillStyle = '#111'; ctx.fillRect(px - 4 * s, py - 4 * s, 8 * s, 6 * s); }
    ctx.restore();
  }

  drawInset(ctx) {
    const si = this.si, x0 = this.insetX, y0 = this.insetY, d = this.d;
    const rc = this.rear.getContext('2d');
    drawRear(rc, this.b, { ...this.state, psuOn: d.psuOn }, this.t, Object.fromEntries(Object.entries(d.plugs).filter(([, k]) => k !== 'STRIP')), { ports: this.ports(), plugs: this.PLUGS, era: this.era, rig: this.L });
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
      const plug = this.PLUGS[plugId];
      if (plug.target === 'strip') { if (!deskVisible) return; const [x, y] = this.proj(...this.STRIP); ring(x - 30, y - 12, 60, 24); }
      else if (rearVisible) for (const port of this.ports()) {
        if (port.type !== plug.type || Object.values(this.d.plugs).includes(port.key)) continue;
        if (plugId === 'video' && this.b.placed.gpu && port.owner === 'mb') continue;
        ring(...this.rearRect(port));
      }
    }
    if (!sel && s?.kind === 'switch' && rearVisible) { const si = this.si, SW = this.SWITCH; ring(this.insetX + SW.x * si, this.insetY + SW.y * si, SW.w * si, SW.h * si); }
    if (!sel && s?.kind === 'power' && deskVisible && !(this.run && !this.run.done)) {
      const [x, y] = this.powerButton();
      ctx.save(); ctx.fillStyle = 'rgba(245,197,66,.45)'; ctx.beginPath(); ctx.arc(x, y, 14 + Math.sin(t * 6) * 3, 0, Math.PI * 2); ctx.fill();
      ctx.font = '20px "VT323", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#17151a'; ctx.fillText('⏻', x, y + 6); ctx.restore();
    }
  }
}

