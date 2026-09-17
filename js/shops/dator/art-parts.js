// Pixelgrafik för komponenterna som monteras: CPU, kylare, RAM, lagring, grafikkort, ljudkort,
// disketter/optiska enheter, nätagg, fläktar och skruvar – 1983–2026.
//
// ANKARE – alla draw*(R, p, o) tar valfritt o.at = [u, v, z] och ritar relativt det. Utan o.at
// används byggvyns nuvarande platser (G i geom.js), så gamla anrop fungerar oförändrat.
//   drawCpu     sockelns mitt på kortets ovansida                  standard [G.cpu.cu, G.cpu.cv, BOARD_TOP]
//               (Slot 1/A: slotens mitt; kassetten står upp längs v)
//   drawCooler  samma ankare som CPU; vilar på cpuTop(o.placed.cpu) (eller o.cpu). AIO-radiatorns
//               minsta hörn = o.rad (standard ankaret + [-1,6, -5,1, +1,4] = [5.2, 0.5, 2.2] i byggvyn).
//   drawRam     första använda slotens hörn [u0, v0] på kortets ovansida  standard [G.ramSlots[1], G.ramV[0], BOARD_TOP]
//               o.ramU = [u för varje slot] (riggen) eller o.pitch = slotavstånd (0,7); 1–2 moduler hamnar i
//               varannan slot (1 och 3), fler i varje slot.
//               DIP-kretsar: rutnätets minsta hörn (rader om 9 kretsar längs v).
//   drawStorage diskar: platsens mitt på golvet     standard [mitten av G.bay, G.case.z1 + 0.05]
//                 o.orient 'flat' (liggande, kontakterna mot +u) | 'bay' (monterad som drawMedia:
//                 front mot +u, ovansidan mot -v, bredden längs z; ankare = minsta hörn)
//               M.2: modulens skruvände (u0), mitten i v, kortets ovansida  standard [G.m2.u0, mitt, BOARD_TOP]
//   drawGpu     slotens läge vid bracketen: [kortets bakände u, slotens v-mitt (kretskortets plan), kortets ovansida]
//               standard [G.gpu.u0, mitt av G.gpu, BOARD_TOP]; bracketen ritas på u-0,5 … u-0,25
//   drawSound   som drawGpu, standard [G.snd.u0, mitt av G.snd, BOARD_TOP]
//   drawMedia   platsens minsta hörn [u0, v0, z0], storlek o.size = [U, V, Z] eller o.box {u0,u1,v0,v1,z0,z1}
//               (standard G.media / G.floppy)
//               front mot +u, enhetens ovansida mot -v, bredden längs z (chassit ligger på sidan)
//   drawPsu     lådans minsta hörn [u0, v0, z0], storlek o.size = [U, V, Z]  standard G.psu
//   drawFans    första fläktens minsta hörn [u0, v0, z0]; o.face 'left'|'right'|'top', o.step = [du, dv, dz]
//               standard FAN_SLOTS.top1, face 'left', step [5.6, 0, 0]
// o.loose (standard = o.showroom): delen ligger lös – stift och kontaktfingrar under den syns.
import { hex, shade, mix } from '../../core/raster.js';
import { G, BOARD_TOP, GPU_LEN, SCREWS, FAN_SLOTS } from './geom.js';
import {
  C, fan, blower, honeycomb, hash, led, isLit, screwHead, brushed, smd, barcode, fineLines, sticker, matrix,
  TB, modelText, txt, fitPx, inRound, speckle, fingers, pcbArt, icTop, capTop, jack, ledDot, vents, perforated, knurl, mesh,
} from './art-common.js';

const hx = (s, d) => (typeof s === 'string' && s[0] === '#' ? hex(s) : d);
const lum = (c) => ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11;
const looseOf = (o) => o.loose ?? !!o.showroom;
const NOE = { noEdges: true };

// =====================================================================================
// CPU
// =====================================================================================
export function cpuKind(p) {
  const L = p.look || {}, s = p.socket || '', pkg = L.pkg;
  if (pkg === 'dip' || s === 'DIP40') return 'dip';
  if (pkg === 'plcc') return 'plcc';
  if (pkg === 'slot' || s === 'Slot1' || s === 'SlotA') return 'slot';
  if (s === 'S286' || s === 'S386' || s === 'S486') return 'ceramic';
  if (s === 'Socket4' || s === 'Socket5' || s === 'Socket7') return 'p5';
  if (s === 'Socket8') return 'ppro';
  if (s === 'Socket370') return /ppga|mendocino/i.test(p.name || '') ? 'ppga' : 'fcpga';
  if (s === 'SocketA') return 'die';
  if (s === 'Socket423' || s === 'Socket478') return 'p4';
  if (s === 'TR4' || s === 'sTRX4') return 'tr';
  if (pkg === 'am-lga' || s === 'AM5') return 'am-lga';
  if (pkg === 'lga' || s.startsWith('LGA')) return 'lga';
  if (pkg === 'am-pga') return 'am-pga';
  if (pkg === 'pga') return 'p5';
  return L.brand === 'intel' ? 'lga' : 'am-pga';
}
const CPU_TOP = { dip: 0.34, plcc: 0.34, slot: 3.35, ceramic: 0.42, p5: 0.48, ppro: 0.48, ppga: 0.48, fcpga: 0.33, die: 0.33 };
// Höjd över ankaret där kylaren vilar
export const cpuTop = (p) => (p ? CPU_TOP[cpuKind(p)] ?? 0.53 : 0.53);
const CPU_BRAND = { intel: 'INTEL', amd: 'AMD', cyrix: 'CYRIX', nec: 'NEC', harris: 'HARRIS', siemens: 'SIEMENS', ibm: 'IBM', ti: 'TEXAS INSTR', umc: 'UMC', idt: 'IDT', via: 'VIA', rise: 'RISE' };

export function drawCpu(R, p, o) {
  const at = o.at || [G.cpu.cu, G.cpu.cv, BOARD_TOP];
  const k = cpuKind(p);
  if (k === 'dip') return cpuDip(R, p, o, at);
  if (k === 'plcc') return cpuPlcc(R, p, o, at);
  if (k === 'slot') return cpuSlot(R, p, o, at);
  if (k === 'ceramic' || k === 'p5' || k === 'ppro' || k === 'ppga' || k === 'fcpga' || k === 'die') return cpuPga(R, p, o, at, k);
  return cpuIhs(R, p, o, at, k);
}

// Kylpasta (grå klick med struktur)
function paste(o, x, y, W, H, r) {
  if (!o.paste) return -1;
  const dx = x - W / 2, dy = y - H / 2;
  if (dx * dx + dy * dy > r * r) return -1;
  return hash((x * 14) | 0, (y * 14) | 0) > 0.5 ? 0x9da3a8 : 0xb8bdc2;
}
// Guldstift under en PGA-kapsel (bara när processorn ligger lös)
function pgaPins(R, u0, u1, v0, v1, z0, z1, id) {
  R.box(u0, u1, v0, v1, z0, z1, (f, x, y) => {
    if (f === 'top') return -1;
    const fx = (x % 0.12) / 0.12;
    return fx < 0.34 ? (fx < 0.12 ? 0xf0d27a : y > 0.09 ? C.goldDark : C.gold) : -1;
  }, id, NOE);
}

// Modern kapsel med värmespridare (LGA, AM4/AM5, P4, Threadripper)
function cpuIhs(R, p, o, at, k) {
  const [cu, cv, z] = at, L = p.look || {}, id = o.id, s = p.socket || '', name = p.name || '';
  const intel = k === 'lga' || k === 'p4' || (k !== 'am-pga' && k !== 'am-lga' && k !== 'tr' && L.brand === 'intel');
  let hu = 1.55, hv = 1.55;
  if (k === 'lga') {
    if (!s || s === 'LGA1700' || s === 'LGA1851') { hu = 1.35; hv = 1.65; }
    else if (s === 'LGA2011' || s === 'LGA2011v3' || s === 'LGA2066') { hu = 1.8; hv = 1.6; }
    else if (s === 'LGA1366') { hu = 1.45; hv = 1.6; }
    else { hu = 1.35; hv = 1.35; }
  } else if (k === 'p4') { hu = hv = s === 'Socket423' ? 1.8 : 1.3; }
  else if (k === 'tr') { hu = 2.1; hv = 2.7; }
  else if (k === 'am-lga') { hu = hv = 1.6; }
  const sub = intel ? 0x2a5a36 : 0x2f6f3e;
  if ((k === 'am-pga' || k === 'p4') && looseOf(o)) pgaPins(R, cu - hu + 0.12, cu + hu - 0.12, cv - hv + 0.12, cv + hv - 0.12, z + 0.02, z + 0.15, id);
  // substrat: SMD-kondensatorer, guldtriangel, nyckelhack
  R.box(cu - hu, cu + hu, cv - hv, cv + hv, z + 0.15, z + 0.25, (f, x, y, W, H) => {
    if (f !== 'top') return x % 0.2 < 0.03 ? 0x8a6a28 : 0x1f3d27;
    if (x + y < 0.42) return x + y > 0.35 ? C.goldDark : C.gold;
    if (k === 'lga' && (x < 0.13 || x > W - 0.13)) { const d = y - H * 0.28; if (d * d < 0.018) return -1; }
    const sm = smd(x, y, 0.55, 0.13); if (sm >= 0) return sm;
    return speckle(sub, x, y, 30, 0.07);
  }, id);
  // IHS: fläns
  const nick = intel ? 0xbcc0c5 : 0xc5c9cd, e1 = 0.2, e2 = k === 'lga' ? 0.42 : 0.36;
  R.box(cu - hu + e1, cu + hu - e1, cv - hv + e1, cv + hv - e1, z + 0.25, z + 0.31, (f, x, y, W, H) => {
    if (f !== 'top') return shade(nick, 0.8);
    if (k === 'am-lga' && (x < 0.3 || x > W - 0.3) && y > 0.5 && y < H - 0.5) { const sm = smd(x, y, 0.85, 0.11); return sm >= 0 ? sm : sub; }
    if (k === 'lga' && (!s || s === 'LGA1700' || s === 'LGA1851') && (y < 0.22 || y > H - 0.22) && (x < W * 0.28 || x > W * 0.72)) { const sm = smd(x, y, 0.7, 0.11); return sm >= 0 ? sm : sub; }
    if (!intel && !inRound(x, y, 0, 0, W, H, 0.22)) return sub;
    return brushed(shade(nick, x < 0.04 || y < 0.04 ? 1.1 : 0.9), x, y);
  }, id);
  // IHS: platå med laseretsad text och 2D-kod
  const bmBrand = TB(intel ? 'INTEL' : 'AMD');
  const line = intel ? (L.ultra ? 'CORE ULTRA' : k === 'p4' ? 'PENTIUM 4' : /xeon/i.test(name) ? 'XEON' : /pentium/i.test(name) ? 'PENTIUM' : /celeron/i.test(name) ? 'CELERON' : 'CORE')
    : k === 'tr' ? 'THREADRIPPER' : /athlon/i.test(name) ? 'ATHLON' : /phenom/i.test(name) ? 'PHENOM' : /opteron/i.test(name) ? 'OPTERON' : /sempron/i.test(name) ? 'SEMPRON' : /\bFX\b/.test(name) ? 'FX' : /\bA\d/.test(name) ? 'A-SERIES' : 'RYZEN';
  const bmLine = TB(line), bmModel = TB(modelText(p, 12)), bmLot = TB(intel ? 'SRMBH L3' + ((p.cores || 8) * 7 % 90) : '100-000000' + ((p.cores || 8) % 10));
  const IW = 2 * (hu - e2), IH = 2 * (hv - e2), tx = IW * 0.11, ty = IH * 0.1, tw = IW - 2 * tx;
  const pB = fitPx(bmBrand, tw, IW * 0.05), p1 = fitPx(bmLine, tw, IW * 0.036), p2 = fitPx(bmModel, tw, IW * 0.036), p3 = fitPx(bmLot, tw, IW * 0.03);
  const y1 = ty + pB * 6 + p1, y2 = y1 + p1 * 6.5, y3 = y2 + p2 * 6.5;
  R.box(cu - hu + e2, cu + hu - e2, cv - hv + e2, cv + hv - e2, z + 0.31, z + 0.53, (f, x, y, W, H) => {
    if (f !== 'top') return y < 0.035 ? 0xeef0f2 : shade(nick, 0.98 - y * 0.8);
    const pc = paste(o, x, y, W, H, Math.min(W, H) * 0.42); if (pc >= 0) return pc;
    if (txt(bmBrand, x, y, tx, ty, pB)) return intel ? 0x2c6fb7 : 0x33363b;
    if (txt(bmLine, x, y, tx, y1, p1)) return 0x585c62;
    if (txt(bmModel, x, y, tx, y2, p2)) return 0x585c62;
    if (txt(bmLot, x, y, tx, y3, p3)) return 0x6c7076;
    if (fineLines(x, y, tx, H * 0.7, W * 0.46, 2, W * 0.1)) return 0x80848a;
    const ms = W * 0.2, m = matrix(x, y, W - tx - ms, H - ty - ms, ms, 7, 7);
    if (m === 0x111111) return 0x767a80;
    let d = (x - y) % 1.7; if (d < 0) d += 1.7;
    return brushed(shade(mix(0xe6e9ec, 0xa6aab0, (x + y) / (W + H)), d < 0.16 ? 1.07 : 1), x, y);
  }, id);
}

// 386/486/Pentium/K6/Pentium Pro/Pentium III FC-PGA/Athlon XP
function cpuPga(R, p, o, at, k) {
  const [cu, cv, z] = at, L = p.look || {}, id = o.id, s = p.socket, name = p.name || '', brand = L.brand || 'intel';
  let hu = 1.75, hv = 1.75;
  if (k === 'ceramic') hu = hv = s === 'S286' ? 1.0 : s === 'S386' ? 1.3 : 1.55;
  if (k === 'ppro') { hu = 2.2; hv = 1.75; }
  const organic = k === 'fcpga' || k === 'die';
  const lightCer = (k === 'ceramic' && brand === 'intel' && s !== 'S286') || k === 'p5' || k === 'ppro';
  const body = k === 'ppga' ? 0x6a4a32 : organic ? (k === 'die' ? 0x5c4a2c : 0x2f6a3a) : lightCer ? (brand === 'intel' ? 0xdedbd2 : 0xd2cfc6) : 0x2d2b2a;
  const bodyTop = organic ? 0.24 : 0.4;
  if (looseOf(o)) pgaPins(R, cu - hu + 0.14, cu + hu - 0.14, cv - hv + 0.14, cv + hv - 0.14, z + 0.02, z + 0.15, id);
  const bmBrand = TB(CPU_BRAND[brand] || brand), bmModel = TB(modelText(p, 12));
  const family = k === 'p5' ? (brand === 'intel' ? (/mmx/i.test(name) ? 'PENTIUM MMX' : 'PENTIUM') : brand === 'amd' ? (/k6/i.test(name) ? 'AMD-K6' : 'AMD-K5') : brand === 'cyrix' ? '6X86' : brand === 'idt' ? 'WINCHIP' : CPU_BRAND[brand] || '')
    : k === 'ppro' ? 'PENTIUM PRO' : k === 'ppga' ? 'CELERON' : k === 'ceramic' ? (s === 'S386' ? 'I386' : s === 'S286' ? '80286' : 'I486') : '';
  const bmFam = TB(family);
  const lid = k === 'p5' || k === 'ppro' || k === 'ppga' || (k === 'ceramic' && !lightCer);
  const BW = 2 * hu, cA = fitPx(bmFam, BW * 0.72, BW * 0.05), cB = fitPx(bmModel, BW * 0.72, BW * 0.035), cC = fitPx(bmBrand, BW * 0.72, BW * 0.035);
  // kapselkropp
  R.box(cu - hu, cu + hu, cv - hv, cv + hv, z + 0.15, z + bodyTop, (f, x, y, W, H) => {
    if (f !== 'top') return organic ? (y > H * 0.5 ? 0x1a2a1e : shade(body, 0.8)) : (y < 0.03 ? shade(body, 1.1) : shade(body, 0.86));
    // avfasat pinne-1-hörn
    if (x + y < 0.3) return organic ? -1 : shade(body, 0.7);
    if (x + y < 0.46 && !organic) return C.gold;
    if (k === 'die') {
      // Athlon XP: L1-bryggor, skumkuddar i hörnen, vit tryckt text
      if (x > 0.5 && x < 1.2 && y > 0.25 && y < 0.4 && ((x * 14) | 0) % 2 === 0) return C.gold;
      const pad = 0.55;
      if ((x < pad + 0.2 || x > W - pad - 0.2) && (y < pad + 0.2 || y > H - pad - 0.2) && x > 0.2 && y > 0.2 && x < W - 0.2 && y < H - 0.2) return 0x161616;
      if (txt(bmBrand, x, y, 0.3, H - 0.62, 0.06)) return 0xe8e8e0;
      if (txt(bmModel, x, y, 0.3, H - 0.3, 0.045)) return 0xd8d8d0;
      const sm = smd(x, y, 0.35, 0.14); if (sm >= 0 && (x < 0.9 || x > W - 0.9)) return sm;
      return speckle(body, x, y, 30, 0.08);
    }
    if (k === 'fcpga') {
      const sm = smd(x, y, 0.4, 0.14); if (sm >= 0 && (y < 0.9 || y > H - 0.9)) return sm;
      if (txt(bmBrand, x, y, 0.35, H - 0.5, 0.06)) return 0xe8e8e0;
      return speckle(body, x, y, 30, 0.07);
    }
    if (lightCer && !lid) {
      // 386/486 från Intel: tryckt text direkt på keramiken
      if (txt(bmFam, x, y, W * 0.14, H * 0.16, cA)) return 0x2e2e30;
      if (txt(bmModel, x, y, W * 0.14, H * 0.16 + cA * 7, cB)) return 0x3a3a3c;
      if (txt(bmBrand, x, y, W * 0.14, H * 0.16 + cA * 7 + cB * 7, cC)) return 0x4a4a4c;
      if (fineLines(x, y, W * 0.14, H * 0.72, W * 0.55, 2, W * 0.1)) return 0x6a6a6c;
      return speckle(body, x, y, 60, 0.03);
    }
    if (!lightCer && txt(bmBrand, x, y, W * 0.12, H * 0.06, W * 0.03)) return 0xe0ddd2;
    return speckle(body, x, y, 60, 0.04);
  }, id);
  // guldlock / värmespridare
  if (lid) {
    const e = k === 'ppro' ? 0.12 : k === 'p5' ? hu * 0.26 : k === 'ppga' ? hu * 0.42 : hu * 0.3;
    const lidC = k === 'ppga' ? 0xc8ccd2 : 0xf0d27a, lidD = k === 'ppga' ? 0x8a8e94 : 0xb8902e;
    const LW = 2 * (hu - e), tx = LW * 0.1, tw = LW * 0.8, pa = fitPx(bmFam, tw, LW * 0.055), pb = fitPx(bmModel, tw, LW * 0.03);
    R.box(cu - hu + e, cu + hu - e, cv - hv + e, cv + hv - e, z + bodyTop, z + (k === 'ceramic' ? 0.42 : 0.48), (f, x, y, W, H) => {
      if (f !== 'top') return y < 0.03 ? mix(lidC, 0xffffff, 0.3) : lidD;
      const pc = paste(o, x, y, W, H, Math.min(W, H) * 0.38); if (pc >= 0) return pc;
      if (k !== 'ceramic' && txt(bmFam, x, y, tx, H * 0.14, pa)) return 0x5a4a1e;
      if (txt(bmModel, x, y, tx, k !== 'ceramic' ? H * 0.14 + pa * 7 : H * 0.4, pb)) return 0x6a5a28;
      if (k !== 'ceramic' && fineLines(x, y, tx, H * 0.6, W * 0.6, 3, W * 0.08)) return 0x8a7430;
      const g = (x + y) / (W + H);
      let sh = (x - y) % 1.4; if (sh < 0) sh += 1.4;
      return brushed(shade(mix(lidC, lidD, g), sh < 0.12 ? 1.08 : 1), x, y);
    }, id);
  }
  // naken kärna (Pentium III, Athlon XP)
  if (organic) {
    const dw = k === 'die' ? 0.32 : 0.26, dh = k === 'die' ? 0.45 : 0.32;
    R.box(cu - dw, cu + dw, cv - dh, cv + dh, z + 0.24, z + 0.33, (f, x, y, W, H) => {
      if (f !== 'top') return 0x6a4a2a;
      const pc = paste(o, x, y, W, H, 0.3); if (pc >= 0) return pc;
      let d = (x * 1.3 - y) % 0.9; if (d < 0) d += 0.9;
      return d < 0.1 ? 0x6a7890 : x < 0.03 || y < 0.03 ? 0x5a6478 : 0x323a4a;
    }, id);
  }
}

// 40-pin DIP (8088, 8086, V20)
function cpuDip(R, p, o, at) {
  const [cu, cv, z] = at, L = p.look || {}, id = o.id, name = p.name || '';
  const hu = 1.85, hv = 0.34;
  const ceramic = /\b[CD]8\d/.test(name) || /ceramic/i.test(name);
  const body = ceramic ? 0x6a4a6e : hx(L.color, 0x1c1c1f);
  const bmBrand = TB(CPU_BRAND[L.brand] || p.brand || 'INTEL'), bmModel = TB(modelText(p, 10)), bmCopy = TB('C 1978');
  // ben: 20 på varje sida
  for (let side = 0; side < 2; side++) {
    const v0 = side === 0 ? cv - hv - 0.1 : cv + hv;
    R.box(cu - hu + 0.1, cu + hu - 0.1, v0, v0 + 0.1, z, z + 0.24, (f, x, y, W, H) => {
      const fx = x % 0.183;
      if (fx > 0.075) return -1;
      if (f === 'top') return fx < 0.02 ? 0xe4e8ec : C.tin;
      if (y > 0.12 && (fx < 0.02 || fx > 0.055)) return -1;       // smalare ben nedtill
      return fx < 0.02 ? 0xe4e8ec : y > H - 0.03 ? 0x7a7e84 : C.tin;
    }, id, NOE);
  }
  R.box(cu - hu, cu + hu, cv - hv, cv + hv, z + 0.1, z + 0.34, (f, x, y, W, H) => {
    if (f !== 'top') return y > H * 0.45 && y < H * 0.55 ? shade(body, 0.7) : shade(body, 0.95);
    // skåra vid pinne 1
    { const dx = x, dy = y - H / 2; if (dx * dx + dy * dy < 0.018) return shade(body, 0.45); }
    if (ceramic) {
      if (x > W * 0.3 && x < W * 0.7 && y > 0.12 && y < H - 0.12) {
        if (txt(bmModel, x, y, W * 0.34, H * 0.3, 0.045)) return 0x5a4a1e;
        return brushed(C.gold, x, y);
      }
      if (txt(bmBrand, x, y, 0.3, H * 0.3, 0.045)) return 0xe8e8e0;
      return speckle(body, x, y, 50, 0.06);
    }
    { const dx = x - 0.36, dy = y - 0.18; if (dx * dx + dy * dy < 0.004) return shade(body, 0.6); }
    if (txt(bmBrand, x, y, 0.55, 0.1, 0.05)) return 0xd8d8d2;
    if (txt(bmModel, x, y, 0.55, 0.1 + 0.05 * 6.5, 0.05)) return 0xc8c8c2;
    if (txt(bmCopy, x, y, W - 1.0, H - 0.3, 0.035)) return 0x9a9a96;
    return speckle(body, x, y, 50, 0.08);
  }, id);
}

// PLCC (286 m.fl.) med J-ben runt om
function cpuPlcc(R, p, o, at) {
  const [cu, cv, z] = at, L = p.look || {}, id = o.id, h = 0.9;
  const body = hx(L.color, 0x1c1c1f);
  const bmBrand = TB(CPU_BRAND[L.brand] || p.brand || 'INTEL'), bmModel = TB(modelText(p, 10)), bmDate = TB('8834 JP');
  R.box(cu - h, cu + h, cv - h, cv + h, z + 0.06, z + 0.34, (f, x, y, W, H) => {
    if (f !== 'top') {
      const fx = (x % 0.1) / 0.1;
      if (y > H * 0.3 && fx > 0.25 && fx < 0.6) return y > H - 0.04 ? 0x8a8e94 : fx < 0.35 ? 0xe4e8ec : C.tin;
      return y < H * 0.3 ? shade(body, 1.05) : shade(body, 0.75);
    }
    if (x + y < 0.18) return -1;
    if (x + y < 0.24) return shade(body, 1.4);
    if (x < 0.03 || y < 0.03) return shade(body, 1.4);
    { const dx = x - 0.32, dy = y - 0.32; if (dx * dx + dy * dy < 0.005) return shade(body, 0.55); }
    { const dx = x - W / 2, dy = y - H * 0.78; const d2 = dx * dx + dy * dy; if (d2 < 0.03 && d2 > 0.022) return shade(body, 1.25); }
    if (txt(bmBrand, x, y, 0.3, 0.52, 0.045)) return 0xd8d8d2;
    if (txt(bmModel, x, y, 0.3, 0.84, 0.042)) return 0xc8c8c2;
    if (txt(bmDate, x, y, 0.3, 1.14, 0.035)) return 0x9a9a96;
    return speckle(body, x, y, 50, 0.08);
  }, id);
}

// Slot 1 / Slot A: kassett som står upp i sloten
function cpuSlot(R, p, o, at) {
  const [cu, cv, z] = at, L = p.look || {}, id = o.id, name = p.name || '';
  const amd = L.brand === 'amd', sepp = !amd && /celeron/i.test(name), p3 = /\bIII\b|pentium 3/i.test(name);
  const hv = 3.2, z0 = z + 0.35, z1 = z + 3.35;
  const loose = looseOf(o);
  if (loose || sepp) {
    R.box(cu - 0.05, cu + 0.05, cv - hv + 0.5, cv + hv - 0.5, z + 0.02, z0 + 0.05, (f, x, y, W, H) => {
      if (f !== 'right') return C.pcbGreen;
      const X = W - x;
      if (X > W * 0.4 && X < W * 0.43) return -1;
      return y > 0.04 ? fingers(X, 0.09) : C.pcbGreen;
    }, id, NOE);
  }
  if (sepp) {
    const bm = TB('CELERON');
    R.box(cu - 0.05, cu + 0.05, cv - hv, cv + hv, z0, z1 - 0.3, (f, x, y, W, H) => {
      if (f !== 'right') return shade(C.pcbGreen, 0.8);
      const X = W - x;
      const a = pcbArt(X, y, C.pcbGreen, 0.5); if (a >= 0) return a;
      const sm = smd(X, y, 0.45, 0.16); if (sm >= 0 && (X < 2 || X > W - 2)) return sm;
      if (txt(bm, X, y, 0.4, H - 0.4, 0.05)) return C.silk;
      return C.pcbGreen;
    }, id);
    R.box(cu + 0.05, cu + 0.13, cv - 0.45, cv + 0.45, z + 1.3, z + 2.3, (f) => f === 'right' ? 0x3a4250 : 0x2a2e36, id);
    return;
  }
  const body = amd ? 0x3c3d40 : 0x1b1b1d;
  const bmA = TB(amd ? 'ATHLON' : p3 ? 'PENTIUM III' : 'PENTIUM II'), bmB = TB(amd ? 'AMD' : 'INTEL'), bmM = TB(modelText(p, 10));
  // spärrar i ändarna
  for (let side = 0; side < 2; side++) {
    const v0 = side === 0 ? cv - hv - 0.14 : cv + hv;
    R.box(cu - 0.3, cu + 0.3, v0, v0 + 0.14, z + 0.2, z1 - 0.35, (f, x, y) => (y * 8 | 0) % 2 ? 0x5a5c60 : 0x4a4c50, id);
  }
  R.box(cu - 0.4, cu + 0.4, cv - hv, cv + hv, z0, z1, (f, x, y, W, H) => {
    if (f === 'top') {
      if (amd && (x < 0.08 || x > W - 0.08)) return shade(body, 1.2);
      if ((y > H * 0.2 && y < H * 0.3) || (y > H * 0.7 && y < H * 0.8)) return x > 0.25 && x < W - 0.25 ? 0x0a0a0a : shade(body, 1.1);
      return (x * 12 | 0) % 3 === 0 ? shade(body, 1.2) : body;
    }
    if (f === 'left') return (y * 6 | 0) % 2 ? shade(body, 1.1) : body;
    const X = W - x;
    if (amd && ((X < 0.35 && y < 0.35 && (0.35 - X) ** 2 + (0.35 - y) ** 2 > 0.12) || (X > W - 0.35 && y < 0.35 && (X - W + 0.35) ** 2 + (0.35 - y) ** 2 > 0.12))) return -1;
    // ram och ribbor
    if (y > H - 0.3) return (X * 6 | 0) % 2 ? shade(body, 0.8) : shade(body, 1.05);
    if (X < 0.1 || X > W - 0.1 || y < 0.1) return shade(body, 1.3);
    if (amd) {
      // AMD-dekal: svart ruta med grön pil + silvertext
      if (X > W * 0.08 && X < W * 0.26 && y > H * 0.2 && y < H * 0.62) {
        const lx = (X - W * 0.08) / (W * 0.18), ly = (y - H * 0.2) / (H * 0.42);
        if (lx > 0.25 && lx < 0.75 && ly > 0.25 && ly < 0.75 && (lx > 0.6 || ly < 0.4)) return 0x2e9a4a;
        return 0x0e0e0e;
      }
      if (txt(bmA, X, y, W * 0.32, H * 0.28, 0.11)) return 0xd6dade;
      if (txt(bmM, X, y, W * 0.32, H * 0.28 + 0.8, 0.06)) return 0x9aa0a6;
      return speckle(body, X, y, 30, 0.06);
    }
    // Intel: hologramdekal
    if (X > W * 0.12 && X < W * 0.62 && y > H * 0.15 && y < H * 0.75) {
      const lx = X - W * 0.12, ly = y - H * 0.15;
      if (txt(bmA, lx, ly, 0.25, 0.35, 0.085)) return 0xfafafa;
      if (txt(bmB, lx, ly, 0.25, 0.95, 0.07)) return 0x2c6fb7;
      let s = (lx * 1.5 + ly + (o.t || 0) * 0.3) % 1.2; if (s < 0) s += 1.2;
      return s < 0.15 ? mix(0xd8b24a, 0x8ad8ff, s / 0.15) : s < 0.3 ? mix(0x8ad8ff, 0xe8a0ff, (s - 0.15) / 0.15) : shade(0xb8962e, 0.8 + (ly / 2) * 0.3);
    }
    if (txt(bmM, X, y, W * 0.68, H * 0.3, 0.06)) return 0x9aa0a6;
    if (fineLines(X, y, W * 0.68, H * 0.5, W * 0.25, 3, 0.14)) return 0x3a3a3e;
    return ((X + y * 0.3) * 5 | 0) % 7 === 0 ? shade(body, 1.15) : body;
  }, id);
}

// =====================================================================================
// Kylare
// =====================================================================================
export function drawCooler(R, p, o) {
  const at = o.at || [G.cpu.cu, G.cpu.cv, BOARD_TOP];
  const cpu = o.cpu || o.placed?.cpu;
  const L = p.look || {};
  if (cpu && cpuKind(cpu) === 'slot') return coolerSlot(R, p, o, at);
  const z0 = at[2] + cpuTop(cpu);
  switch (L.type) {
    case 'heatsink': return coolerPassive(R, p, o, at, z0);
    case 'heatsink-fan': return coolerFanSink(R, p, o, at, z0);
    case 'low': return coolerLow(R, p, o, at, z0);
    case 'tower': return coolerTower(R, p, o, at, z0);
    default: return coolerAio(R, p, o, at, z0);
  }
}

// 486: passiv stiftkylfläns
function coolerPassive(R, p, o, [cu, cv], z0) {
  const L = p.look || {}, id = o.id, fin = hx(L.fin, 0x2a2a2c), h = 1.45, n = 6, pitch = (2 * h) / n, w = pitch * 0.58;
  R.box(cu - h, cu + h, cv - h, cv + h, z0, z0 + 0.14, (f, x, y) => f === 'top' ? brushed(shade(fin, 0.9), x, y) : shade(fin, y < 0.03 ? 1.3 : 0.85), id);
  const light = lum(fin) > 120;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const u = cu - h + (i + 0.21) * pitch, v = cv - h + (j + 0.21) * pitch;
    R.box(u, u + w, v, v + w, z0 + 0.14, z0 + 0.82, (f, x, y, W, H) => {
      if (f === 'top') return x < 0.03 || y < 0.03 ? shade(fin, 1.35) : brushed(shade(fin, light ? 1.05 : 1.2), x, y);
      return shade(fin, y < 0.03 ? 1.3 : 1.05 - (y / H) * 0.35);
    }, id);
  }
}

// 90-tal: aluminiumfläns med liten fläkt ovanpå (stor variant för P4/Athlon 64)
function coolerFanSink(R, p, o, [cu, cv], z0) {
  const L = p.look || {}, id = o.id, fin = hx(L.fin, C.alu), fanC = hx(L.fan, 0x1a1a1a), blade = hx(L.blade, 0x2a2a2a);
  const socks = (p.sockets || []).join(' ');
  const big = (p.maxW || 0) > 70 || /478|775|754|939|AM2|AM3|1156|1155|FM/.test(socks);
  const h = big ? 1.9 : 1.35, hf = big ? 1.2 : 0.72, n = big ? 15 : 11, t = (2 * h) / n;
  // bas (koppar i mitten på de stora)
  R.box(cu - h, cu + h, cv - h, cv + h, z0, z0 + 0.16, (f, x, y, W, H) => {
    if (f !== 'top') return shade(fin, y < 0.03 ? 1.25 : 0.85);
    if (big && x > W * 0.3 && x < W * 0.7 && y > H * 0.3 && y < H * 0.7) return brushed(C.copper, x, y);
    return brushed(fin, x, y);
  }, id);
  for (let i = 0; i < n; i++) {
    const u = cu - h + i * t + t * 0.2;
    R.box(u, u + t * 0.42, cv - h, cv + h, z0 + 0.16, z0 + hf, (f, x, y, W, H) => {
      if (f === 'top') return shade(fin, 1.18);
      if (f === 'left') return shade(fin, 1.12 - (y / H) * 0.3);
      return (y * 8 | 0) % 5 === 0 ? shade(fin, 1.05) : shade(fin, 1.1 - (y / H) * 0.25);
    }, id);
  }
  // fjäderklämma över flänsen
  R.box(cu - 0.1, cu + 0.1, cv - h - 0.18, cv + h + 0.18, z0 + 0.1, z0 + 0.24, (f, x, y) => f === 'top' ? brushed(0xd6dade, x, y) : C.steelDark, id);
  R.box(cu - 0.18, cu + 0.18, cv + h + 0.08, cv + h + 0.18, z0 - 0.35, z0 + 0.24, (f, x, y, W, H) => (y > H - 0.18 && x > 0.1 && x < W - 0.1) ? -1 : C.steel, id);
  // fläkten
  const hub = TB(big ? 'COOLER' : 'SUNON');
  R.box(cu - h, cu + h, cv - h, cv + h, z0 + hf, z0 + hf + (big ? 0.55 : 0.45), (f, x, y, W, H) => {
    if (f !== 'top') {
      if ((x < 0.28 || x > W - 0.28) && y > H * 0.3 && y < H * 0.7) return shade(fanC, 0.6);
      return y < 0.03 ? shade(fanC, 1.5) : fanC;
    }
    const c = fan(x, y, W / 2, H / 2, h - 0.2, { spin: o.spin || 0, frame: fanC, blade, hub: 0xe8e2c8, blades: 7, ring: -1 });
    if (c >= 0 && txt(hub, x, y, W / 2 - hub.w * 0.022, H / 2 - 0.055, 0.022)) return 0x2a2a2a;
    return c;
  }, id);
  // fläktkabel: röd/svart/gul
  const wires = [C.wireRed, C.wireBlack, C.wireYellow];
  for (let i = 0; i < 3; i++) R.box(cu + h - 0.7 + i * 0.07, cu + h - 0.64 + i * 0.07, cv + h, cv + h + 0.07, z0 - 0.2, z0 + hf + 0.25, () => wires[i], id, NOE);
}

// Slot 1/A: kylfläns på kassettens baksida
function coolerSlot(R, p, o, [cu, cv, z]) {
  const L = p.look || {}, id = o.id, fin = hx(L.fin, C.alu), fanC = hx(L.fan, 0x1a1a1a), blade = hx(L.blade, 0x2a2a2a);
  R.box(cu - 1.05, cu - 0.4, cv - 2.9, cv + 2.9, z + 0.5, z + 3.2, (f, x, y, W, H) => {
    if (f === 'top') return (y * 7 | 0) % 2 ? shade(fin, 1.15) : shade(fin, 0.5);
    if (f === 'left') return (x * 12 | 0) % 2 ? shade(fin, 1.1) : shade(fin, 0.55);
    return brushed(fin, x, y, 'y');
  }, id);
  R.box(cu - 1.45, cu - 1.05, cv - 2.7, cv + 2.7, z + 0.7, z + 3.0, (f, x, y, W, H) => {
    if (f === 'top') return fanC;
    if (f === 'left') return fanC;
    for (let i = 0; i < 2; i++) { const c = fan(W - x, y, W * (0.25 + i * 0.5), H / 2, Math.min(H / 2, W / 4) - 0.2, { spin: o.spin || 0, frame: fanC, blade, hub: 0x444444, blades: 7, ring: -1 }); if (c >= 0) return c; }
    return fanC;
  }, id);
}

// Låg kylare sedd uppifrån (boxkylare / Freezer)
function coolerLow(R, p, o, [cu, cv], z0) {
  const L = p.look || {}, id = o.id, fanC = hx(L.fan, 0x1d1d1d), blade = hx(L.blade, 0xd8d8d8), fin = hx(L.fin, 0xc8ccd0);
  const spin = o.spin || 0, ring = p.rgb ? led(o, 'cooler') : -1;
  R.box(cu - 2, cu + 2, cv - 2, cv + 2, z0, z0 + 0.9, (f, x, y, W, H) => {
    if (f === 'top') return (x * 7 | 0) % 2 ? brushed(fin, x, y, 'y') : shade(fin, 0.45);
    const a = f === 'left' ? x : y;
    const fy = (y * 9) % 1;
    if (a > 1.6 && a < 2.4) return y < 0.25 ? C.copper : brushed(shade(C.copper, 0.9), x, y, 'y');     // kopparkärna/rör
    return ((a * 7) % 1) < 0.45 ? (fy < 0.15 ? shade(fin, 1.2) : fin) : shade(fin, 0.4);
  }, id);
  const logo = TB((p.brand || p.name || 'ARCTIC').split(' ')[0], 8);
  R.box(cu - 2.1, cu + 2.1, cv - 2.1, cv + 2.1, z0 + 0.9, z0 + 1.6, (f, x, y, W, H) => {
    if (f !== 'top') {
      if (x < 0.35 || x > W - 0.35) return C.rubber;
      return (y > H * 0.4 && y < H * 0.6) ? shade(fanC, 1.4) : fanC;
    }
    const c = fan(x, y, W / 2, H / 2, 1.85, { spin, frame: fanC, blade, hub: 0xf2f2f2, blades: 7, ring });
    if (c >= 0 && txt(logo, x, y, W / 2 - logo.w * 0.03, H / 2 - 0.075, 0.03)) return 0x2c6fb7;
    return c;
  }, id);
}

// Tornkylare: värmerör, lamellstapel, fläkt med klämmor (NH-D15 = dubbeltorn)
function coolerTower(R, p, o, [cu, cv], z0) {
  const L = p.look || {}, id = o.id, fanC = hx(L.fan, 0x1a1a1a), blade = hx(L.blade, 0x2a2a2a), fin = hx(L.fin, 0x2e2f33);
  const spin = o.spin || 0, ring = p.rgb ? led(o, 'cooler') : -1;
  const big = p.id === 'nh-d15' || /D15|dark rock pro|dual|assassin/i.test(p.name || '');
  const nickel = lum(fin) > 120;
  const top = big || nickel ? 0xcfd3d7 : 0x1b1b1d, capC = big || nickel ? 0xd9dde1 : 0x2a2a2d;
  const zf = z0 + 0.95, zt = z0 + 5;
  // bottenplatta + monteringsbrygga
  R.box(cu - 0.9, cu + 0.9, cv - 1.3, cv + 1.3, z0, z0 + 0.22, (f, x, y) => f === 'top' ? brushed(0xd0d4d8, x, y) : (y < 0.04 ? 0xe8eaec : 0x9a9ea3), id);
  R.box(cu - 0.2, cu + 0.2, cv - 2.2, cv + 2.2, z0 + 0.22, z0 + 0.34, (f, x, y) => f === 'top' ? 0x2a2a2c : 0x1a1a1c, id);
  // värmerör som reser sig till stapeln
  for (let i = 0; i < 4; i++) {
    const hv = -1.2 + i * 0.8;
    R.box(cu - 0.16 + (i % 2) * 0.1, cu + 0.16 + (i % 2) * 0.1, cv + hv - 0.16, cv + hv + 0.16, z0 + 0.34, zf, (f, x, y, W) => {
      const c = nickel || big ? 0xc9cdd2 : C.copper;
      return shade(c, 1.2 - Math.abs(x / W - 0.35) * 0.9);
    }, id);
  }
  const finTex = (f, x, y, W, H) => {
    if (f === 'top') {
      if (x < 0.1 || x > W - 0.1) return shade(top, 0.75);
      return ((x + y) * 3 | 0) % 11 === 0 ? shade(top, 1.15) : top;
    }
    const fy = (y * 11) % 1;
    const a = f === 'left' ? x : y;
    if (fy < 0.42) return shade(0x0c0c0e, 1);
    // lamellkanter med ljus kant och tandning
    if (fy < 0.52) return shade(fin, 1.35);
    return ((a * 5) % 1) < 0.08 ? shade(fin, 0.8) : shade(fin, 1.05 - y / H * 0.2);
  };
  const stacks = big ? [[-1.95, -0.55], [0.05, 1.45]] : [[-1.1, 1.1]];
  for (const [a, b] of stacks) {
    R.box(cu + a, cu + b, cv - 2.3, cv + 2.3, zf, zt, finTex, id);
    // värmerörens toppar genom översta lamellen
    for (let i = 0; i < 4; i++) {
      const hv = -1.5 + i;
      const uc = cu + (a + b) / 2 + (i % 2 ? 0.25 : -0.25);
      R.box(uc - 0.17, uc + 0.17, cv + hv - 0.17, cv + hv + 0.17, zt, zt + 0.2, (f, x, y, W, H) => {
        if (f !== 'top') return shade(capC, 0.8);
        const dx = x - W / 2, dy = y - H / 2;
        return dx * dx + dy * dy < 0.012 ? shade(capC, 0.6) : capC;
      }, id);
    }
  }
  // fläktar med trådklämmor
  const logo = TB(big ? 'NOCTUA' : (p.brand || 'CM').split(' ')[0], 7);
  const fanAt = big ? [cu - 0.55, cu + 1.45] : [cu + 1.1];
  for (const fu of fanAt) {
    R.box(fu, fu + 0.6, cv - 2.45, cv + 2.45, z0 + 0.55, zt - 0.05, (f, x, y, W, H) => {
      if (f !== 'right') {
        if ((y < 0.3 || y > H - 0.3) && big) return 0x6a4a3a;             // gummikuddar
        if (f === 'left' && x > 0.1 && x < 0.18) return 0x9aa0a6;
        return y < 0.03 ? shade(fanC, 1.3) : fanC;
      }
      const X = W - x;
      if ((y > H * 0.14 && y < H * 0.16) || (y > H * 0.84 && y < H * 0.86)) return 0xb8bcc2;   // klämmor
      const c = fan(X, y, W / 2, H / 2, 2.2, { spin, frame: fanC, blade, hub: big ? 0xd8c7a7 : 0x222222, blades: big ? 9 : 7, ring });
      if (c >= 0) { const dx = X - W / 2, dy = y - H / 2; if (dx * dx + dy * dy < 0.25 && txt(logo, X, y, W / 2 - logo.w * 0.04, H / 2 - 0.1, 0.04)) return big ? 0x6a4a3a : 0xf0f0f0; }
      return c;
    }, id);
  }
}

// AIO: pumpblock, slangar med beslag, radiator i taket med fläktar under
function coolerAio(R, p, o, [cu, cv, cz], z0) {
  const L = p.look || {}, id = o.id;
  const fanC = hx(L.fan, 0x1d1d1d), white = lum(fanC) > 150;
  const n = /\b240\b|\b280\b/.test(p.name || '') ? 2 : /\b120\b|\b140\b/.test(p.name || '') ? 1 : 3;
  const [ru, rv, rz] = o.rad || (looseOf(o) ? [cu - 1.6, cv - 3.25, cz] : [cu - 1.6, cv - 5.1, cz + 1.4]);
  const body = white ? 0xe9e9e6 : 0x262626;
  const bmLogo = TB((p.brand || p.name || '').split(' ')[0], 8);
  // kallplatta + pump
  R.box(cu - 1.35, cu + 1.35, cv - 1.35, cv + 1.35, z0, z0 + 0.2, (f, x, y) => f === 'top' ? brushed(0xc8ccd0, x, y) : 0x9aa0a6, id);
  R.box(cu - 1.3, cu + 1.3, cv - 1.3, cv + 1.3, z0 + 0.2, z0 + 1.4, (f, x, y, W, H) => {
    if (f !== 'top') {
      if (p.rgb && y > 0.12 && y < 0.24) return led(o, 'cooler', x + y);
      return y < 0.04 ? shade(body, 1.2) : white ? 0xdedede : 0x1d1d1d;
    }
    const dx = x - W / 2, dy = y - H / 2, d2 = dx * dx + dy * dy;
    if (L.screen && d2 < 0.9) {
      if (!(isLit(o, 'cooler') || o.showroom)) return 0x0b0b10;
      if (d2 < 0.9 && d2 > 0.8) return 0x111118;
      if (txt(bmLogo, x, y, W / 2 - bmLogo.w * 0.045, H / 2 - 0.1, 0.045)) return 0xffffff;
      return mix(0x2a5bd8, 0xc84bd8, (Math.sin((o.t || 0) * 2 + x * 2) + 1) / 2);
    }
    if (d2 < 1.32 && d2 > 0.9) return p.rgb ? led(o, 'cooler', y) : 0xbfbfbf;
    if (d2 < 0.9 && txt(bmLogo, x, y, W / 2 - bmLogo.w * 0.05, H / 2 - 0.12, 0.05)) return white ? 0x2a2a2a : 0xe8e8e8;
    return x < 0.04 || y < 0.04 ? shade(body, 1.2) : body;
  }, id);
  // beslag + flätade slangar
  const tube = white ? 0xdcdcdc : 0x151515;
  const braid = (f, x, y) => ((((x + y) * 9) | 0) % 2) ? tube : shade(tube, white ? 0.85 : 1.8);
  for (let i = 0; i < 2; i++) {
    const du = -0.55 + i * 0.8;
    R.box(cu + du - 0.05, cu + du + 0.4, cv - 1.3, cv - 0.9, z0 + 1.4, z0 + 1.65, (f, x, y) => f === 'top' ? 0x8a8e94 : 0x5a5e64, id);
    R.box(cu + du, cu + du + 0.35, rv + 1.85, cv - 1.3, z0 + 0.9 + 0.35, z0 + 1.3 + 0.35, braid, id);
    R.box(cu + du, cu + du + 0.35, rv + 1.5, rv + 1.85, z0 + 1.25, rz + 0.2, braid, id);
  }
  // radiator
  const RU = n * 5.6 - 0.4;
  R.box(ru, ru + RU, rv, rv + 0.85, rz, rz + 3.2, (f, x, y, W, H) => {
    const end = x < 0.55 || x > W - 0.55;
    if (f === 'top') {
      if (end) return white ? 0xd8d8d6 : 0x1e1e1e;
      return (x * 14 | 0) % 2 ? (white ? 0xcfcfcc : 0x2a2a2a) : (white ? 0xa8a8a6 : 0x141414);
    }
    if (f === 'left') {
      if (end) { if (x < 0.55 && y > 0.4 && y < 0.8) { const dx = x - 0.28, dy = y - 0.6; if (dx * dx + dy * dy < 0.02) return 0x8a8e94; } return white ? 0xe0e0de : 0x202020; }
      if (y < 0.18 || y > H - 0.18) return white ? 0xd0d0ce : 0x1a1a1a;
      return ((y * 18) % 1) < 0.5 ? (white ? 0xb8b8b6 : 0x2c2c2c) : ((x * 30 | 0) % 2 ? (white ? 0x9a9a98 : 0x161616) : (white ? 0xc8c8c6 : 0x242424));
    }
    return (y * 6 | 0) % 2 ? (white ? 0xd8d8d6 : 0x2c2c2c) : (white ? 0xc0c0be : 0x161616);
  }, id);
  for (let i = 0; i < n; i++) drawFanBox(R, ru + 0.2 + i * 5.6, ru + 5.0 + i * 5.6, rv + 0.85, rv + 1.8, rz + 0.1, rz + 3.1, 'left', { frame: fanC, blade: hx(L.blade, 0x2a2a2a), rgb: p.rgb, key: 'cooler', seed: i }, o, id);
}

// =====================================================================================
// RAM
// =====================================================================================
// len = modulens längd (v), h = kortets höjd (z), key = nyckelspår (andel av längden), pitch = fingerdelning
const RAMT = {
  SIMM30: { len: 4.3, h: 1.15, key: [], pitch: 0.14, chips: 9, cw: 0.34, ch: 0.42, simm: 30 },
  SIMM72: { len: 5.2, h: 1.65, key: [0.5], pitch: 0.072, chips: 8, cw: 0.44, ch: 0.52, simm: 72 },
  SDR: { len: 6.4, h: 2.0, key: [0.12, 0.48], pitch: 0.075, chips: 8, cw: 0.5, ch: 0.82, tsop: true },
  DDR: { len: 6.4, h: 2.0, key: [0.57], pitch: 0.068, chips: 8, cw: 0.5, ch: 0.78, tsop: true },
  DDR2: { len: 6.4, h: 1.95, key: [0.53], pitch: 0.052, chips: 8, cw: 0.5, ch: 0.62 },
  DDR3: { len: 6.4, h: 1.95, key: [0.4], pitch: 0.052, chips: 8, cw: 0.5, ch: 0.62 },
  DDR4: { len: 6.4, h: 2.05, key: [0.52], pitch: 0.044, chips: 8, cw: 0.46, ch: 0.64, bow: true },
  DDR5: { len: 6.4, h: 2.05, key: [0.47], pitch: 0.044, chips: 8, cw: 0.46, ch: 0.64, pmic: true },
};
const RAM_H = { spreader: 2.25, fury: 2.75, lpx: 2.0, rgbbar: 2.75, trident: 2.75, dominator: 3.3, ballistix: 2.45, hyperx: 2.4, ripjaws: 2.75 };

export function drawRam(R, p, o) {
  const L = p.look || {}, type = RAMT[p.type] ? p.type : 'DDR4';
  if (p.type === 'DIP') return ramDip(R, p, o);
  const n = Math.max(1, Math.min(8, p.sticks || 1));
  const pitch = o.pitch ?? (G.ramSlots[1] - G.ramSlots[0]);
  const at = o.at || [n > 2 ? G.ramSlots[0] : G.ramSlots[1], G.ramV[0], BOARD_TOP];
  const style = L.style || 'bare';
  // o.ramU = slotarnas u-lägen på kortet (från riggen): 1–2 moduler i varannan slot om det finns 4+
  const RU = Array.isArray(o.ramU) && o.ramU.length ? o.ramU : null;
  const slotU = (i) => RU ? (n <= 2 && RU.length >= 4 ? RU[i * 2] : RU[Math.min(i, RU.length - 1)]) : at[0] + (n > 2 ? i : i * 2) * pitch;
  const cnt = RU ? Math.min(n, RU.length) : Math.min(n, 4);
  for (let i = 0; i < cnt; i++) {
    const su = slotU(i);
    if (style === 'bare' || style === 'ecc' || !RAM_H[style]) ramBare(R, p, o, [su, at[1], at[2]], RAMT[type], style === 'ecc', i);
    else ramSpread(R, p, o, [su, at[1], at[2]], RAMT[type], style, i);
  }
}

// Kretskortets synliga sida: fingrar, nyckelspår, SIMM-hål, SMD-rad, banor
function ramPcbTex(T, pcb, withSticker, bmLab) {
  const nk = T.key.length;
  return (f, x, y, W, H) => {
    if (f !== 'right') return f === 'top' ? shade(pcb, 1.2) : shade(pcb, 0.9);
    const X = W - x, b = H - y;
    if (T.bow) { const e = X / W - 0.5; if (b < 0.07 * e * e * 4) return -1; }
    for (let i = 0; i < nk; i++) { const d = X - T.key[i] * W; if (b < 0.26 && d < 0.055 && d > -0.055) return -1; }
    if (T.simm) {
      if (T.simm === 30 && X < 0.22 && b < 0.3) return -1;                     // hörnhack
      if (T.simm === 72 && X > W - 0.18 && b < 0.3 && b < (X - W + 0.18) * 2) return -1;
      for (let s = 0; s < 2; s++) { const dx = X - (s ? W - 0.22 : 0.22), dy = y - H * 0.42; if (dx * dx + dy * dy < 0.008) return -1; }
    }
    if (b < 0.2) return b < 0.03 ? C.goldDark : fingers(X, T.pitch);
    if (b < 0.26) return shade(pcb, 0.75);
    if (b < 0.42) { const sm = smd(X, y, 0.55, 0.1); if (sm >= 0) return sm; }
    if (withSticker) { const s = sticker(X, y, 0.12, 0.14, 0.58, H * 0.36, 0xf2f2ec, 0x2a2a2a, 5); if (s >= 0) return txt(bmLab, X, y, 0.18, 0.18, 0.028) ? 0xffffff : s; }
    if (y < 0.05 || X < 0.04 || X > W - 0.04) return shade(pcb, 1.25);
    const a = pcbArt(X, y, pcb, 0.35); if (a >= 0) return a;
    return pcb;
  };
}
function ramBare(R, p, o, [su, sv, z], T, ecc, si) {
  const L = p.look || {}, id = o.id, pcb = hx(L.color, C.pcbGreen);
  const zb = z + 0.3, v0 = sv + 0.1, v1 = v0 + T.len;
  const bmLab = TB(p.brand || 'RAM', 8);
  R.box(su + 0.19, su + 0.26, v0, v1, zb, zb + T.h, ramPcbTex(T, pcb, !T.simm, bmLab), id);
  // minneskretsar på den synliga sidan
  const n = ecc ? T.chips + 1 : T.chips, left = T.simm ? 0.25 : 0.85, right = T.simm ? 0.25 : 0.2;
  const step = (T.len - left - right) / n;
  const cz0 = zb + 0.45, cz1 = cz0 + T.ch;
  const bmA = TB(T.simm ? 'TMS44C256' : p.type === 'SDR' ? 'KM48S8030' : /DDR[45]/.test(p.type) ? 'H5AN8G8N' : 'HY5DU561', 10), bmB = TB('-70  9612', 10);
  for (let i = 0; i < n; i++) {
    const X0 = left + i * step + (step - T.cw) / 2;
    const cv1 = v1 - X0, cv0 = cv1 - T.cw;     // X speglat mot v
    const reg = ecc && i === (n >> 1);
    R.box(su + 0.26, su + (T.tsop || T.simm ? 0.31 : 0.33), cv0, cv1, cz0 + (reg ? 0.15 : 0), cz1 - (reg ? 0.15 : 0), (f, x, y, W, H) => {
      if (f !== 'right') return f === 'top' && (T.tsop || T.simm) ? ((x * 18 | 0) % 2 ? C.tin : 0x2a2a2a) : 0x151517;
      const X = W - x;
      if ((T.tsop || T.simm) && (X < 0.05 || X > W - 0.05)) return ((y * 22) | 0) % 2 ? C.tin : -1;
      return icTop(X - (T.tsop ? 0.05 : 0), y, W - (T.tsop ? 0.1 : 0), H, bmA, bmB, 0.022, 0x1b1b1e, 0xb8b8b2);
    }, id);
  }
  // SPD-krets / PMIC
  if (!T.simm) {
    R.box(su + 0.26, su + 0.3, v1 - 0.8, v1 - 0.55, zb + 1.35, zb + 1.55, (f) => f === 'right' ? 0x222226 : 0x111113, id);
    if (T.pmic) R.box(su + 0.26, su + 0.31, v0 + 3.0, v0 + 3.35, zb + 1.3, zb + 1.62, (f, x, y) => f === 'right' ? (x < 0.04 || y < 0.04 ? 0x505058 : 0x2c2c30) : 0x111113, id);
  }
}

// Kylplåtar (spreader/fury/lpx/rgbbar/trident/dominator/ballistix/hyperx/ripjaws)
function ramSpread(R, p, o, [su, sv, z], T, style, si) {
  const L = p.look || {}, id = o.id, colr = hx(L.color, 0x1e1e1e), acc = hx(L.accent, 0xc9323a);
  const zb = z + 0.3, v0 = sv + 0.1, v1 = v0 + T.len, H0 = RAM_H[style];
  const pcb = style === 'dominator' || style === 'trident' ? 0x1a1a1a : 0x1f3a24;
  R.box(su + 0.18, su + 0.27, v0, v1, zb, zb + 0.5, ramPcbTex(T, pcb, false, null), id);
  const word = TB({ fury: 'FURY', lpx: 'VENGEANCE', rgbbar: 'CORSAIR', trident: 'TRIDENT Z5', dominator: 'DOMINATOR', ballistix: 'BALLISTIX', hyperx: 'HYPERX', ripjaws: 'RIPJAWS', spreader: p.brand || 'MEMORY' }[style], 12);
  const small = TB(p.speed || p.type || '', 12), light = lum(colr) > 140;
  const rgb = !!p.rgb;
  R.box(su + 0.03, su + 0.42, v0, v1, zb + 0.4, zb + H0, (f, x, y, W, H) => {
    if (f === 'top') {
      if (rgb) return led(o, 'ram', y * 0.8 + si);
      if (style === 'trident') return 0x2a2a2a;
      if (style === 'dominator') return (y * 12 | 0) % 2 ? 0xc8ccd0 : 0x2a2a2a;
      return x < 0.05 || x > W - 0.05 ? shade(colr, 1.3) : (style === 'lpx' || style === 'fury' ? acc : shade(colr, 1.15));
    }
    const X = f === 'right' ? W - x : x;
    const side = f === 'left';
    switch (style) {
      case 'fury': {
        const prof = 0.15 + 0.35 * Math.abs(((X * 0.9) % 2) - 1);
        if (y < prof) return -1;
        if (rgb && y < prof + 0.3) return led(o, 'ram', X + si);
        if (side) return shade(colr, 1.1);
        if (y > 0.55 && y < 0.72) return acc;
        if (txt(word, X, y, 1.0, 1.0, 0.12)) return acc;
        if (((X * 2.5) | 0) % 5 === 0 && y > 0.8) return shade(colr, 1.6);
        if (fineLines(X, y, 3.4, 1.35, 1.8, 3, 0.12)) return shade(colr, 2.2);
        return brushed(colr, X, y);
      }
      case 'trident': {
        if (rgb && y < 0.45) return led(o, 'ram', X + si);
        if (y < 0.45) return 0xe8e8e8;
        if (y > 0.45 && y < 0.72) return ((X * 5) | 0) % 2 ? 0xd8dce0 : 0x9aa0a6;
        if (y > 1.1 && y < 1.62) { if (!side && txt(word, X, y, 1.2, 1.14, 0.1)) return 0xe6e6e6; return (X * 8 | 0) % 2 ? 0x1b1b1b : 0x222222; }
        if (y > H - 0.12) return 0x6a6e74;
        let d = (X * 0.6 + y) % 1.2; if (d < 0) d += 1.2;
        return d < 0.06 ? 0xe8ecf0 : ((X + y) * 4 | 0) % 7 === 0 ? 0xd6dade : brushed(colr, X, y);
      }
      case 'rgbbar': {
        if (y < 0.45) return rgb ? led(o, 'ram', X + si) : 0xe0e0dc;
        if (y < 0.52) return shade(colr, 0.8);
        if (!side && txt(word, X, y, 1.0, 1.0, 0.12)) return 0x4a4a4a;
        if (!side && fineLines(X, y, 3.4, 1.35, 1.8, 3, 0.12)) return shade(colr, 0.7);
        return ((X + y * 2) % 1.6) < 0.05 ? shade(colr, 0.9) : brushed(colr, X, y);
      }
      case 'lpx': {
        if (rgb && y < 0.4) return led(o, 'ram', X + si);
        if (y > 0.5 && y < 0.64) return acc;
        if (side) return shade(colr, 1.1);
        if (txt(word, X, y, 1.0, 0.9, 0.11)) return acc;
        if (txt(small, X, y, 1.0, 1.55, 0.06)) return shade(colr, 2.5);
        { let d = (X - y * 1.2) % 2.4; if (d < 0) d += 2.4; if (d < 0.05 && y > 0.7) return shade(colr, 1.8); }
        return brushed(colr, X, y);
      }
      case 'dominator': {
        if (y < 0.35) return rgb ? led(o, 'ram', X + si) : 0xd8dce0;
        if (y < 0.95) return ((X * 10) % 1) < 0.45 ? 0xb8bcc2 : 0x121214;                 // DHX-flänsar
        if (y < 1.05) return 0x8a8e94;
        if (X > 0.5 && X < W - 0.5 && y > 1.3 && y < H - 0.7) {
          if (!side && txt(word, X, y, 1.6, 1.62, 0.1)) return 0xe8e8e8;
          return X < 0.54 || y < 1.34 ? 0x3a3a3e : 0x18181a;
        }
        { const dx = X - 0.28, dy = y - H + 0.4, dx2 = X - W + 0.28; if (dx * dx + dy * dy < 0.012 || dx2 * dx2 + dy * dy < 0.012) return 0x5a5e64; }
        return brushed(0xc4c8cd, X, y);
      }
      case 'ballistix': {
        if (y < 0.12) return shade(colr, 1.3);
        if (side) return shade(colr, 0.9);
        if (txt(word, X, y, 0.6, 0.55, 0.11)) return 0xf2f2f2;
        if (txt(small, X, y, 0.6, 1.25, 0.06)) return 0xd8d8d8;
        let d = (X * 0.7 - y + 1.2) % 3.2; if (d < 0) d += 3.2;
        if (d > 2.2 && d < 2.9 && y > 0.3 && y < H - 0.3) return shade(colr, 0.55);
        if (X > W - 1.1 && X < W - 0.5 && y > 0.5 && y < 1.1) return ((X * 8 | 0) + (y * 8 | 0)) % 2 ? 0x111111 : shade(colr, 1.3);
        return speckle(colr, X, y, 40, 0.06);
      }
      case 'hyperx': {
        const tooth = ((X * 2.2) % 1);
        if (y < 0.28 && y < tooth * 0.28) return -1;
        if (side) return shade(colr, 1.05);
        if (y < 0.45) return shade(colr, 1.25);
        if (txt(word, X, y, 0.9, 0.85, 0.12)) return 0xf2f2f2;
        if (y > 1.6 && y < 1.72) return acc;
        { let d = (X + y) % 0.9; if (d < 0) d += 0.9; if (d < 0.08 && X > W - 2.2) return shade(colr, 0.7); }
        return brushed(colr, X, y);
      }
      case 'ripjaws': {
        const t = (X * 1.3) % 1, prof = 0.05 + 0.55 * t;
        if (y < prof && X > 0.3 && X < W - 0.3) return -1;
        if (side) return shade(colr, 1.1);
        if (y < prof + 0.08) return shade(colr, 1.4);
        if (txt(word, X, y, 1.2, 1.1, 0.11)) return 0xe8e8e8;
        if (y > 1.75 && y < 1.85) return acc;
        return brushed(colr, X, y);
      }
      default: {
        // enkel kylplåt med klämma och dekal
        if (y < 0.1) return shade(colr, 1.3);
        if (side) return (y * 5 | 0) % 2 ? shade(colr, 1.05) : colr;
        if (X > W * 0.5 - 0.08 && X < W * 0.5 + 0.08) return 0x9aa0a6;
        const s = sticker(X, y, 0.7, 0.45, 2.2, H - 0.95, 0xf0f0ea, acc, 9);
        if (s >= 0) return txt(word, X, y, 0.8, 0.5, 0.045) ? 0xffffff : s;
        if (X < 0.15 || X > W - 0.15 || y > H - 0.1) return shade(colr, 0.8);
        return brushed(colr, X, y);
      }
    }
  }, id);
}

// DIP: lösa DRAM-kretsar i rader om 9 på kortet
function ramDip(R, p, o) {
  const L = p.look || {}, id = o.id, body = hx(L.color, 0x26262a);
  const at = o.at || [G.ramSlots[0], G.ramV[0], BOARD_TOP];
  const n = Math.max(1, Math.min(36, p.sticks >= 8 ? p.sticks : (p.sticks || 1) * 9));
  const perRow = n % 8 === 0 && n % 9 !== 0 ? 8 : 9;
  const bmA = TB(modelText(p, 9) || 'TMS4256'), bmB = TB(p.speed ? '-' + p.speed : '-15', 8);
  for (let k = 0; k < n; k++) {
    const r = (k / perRow) | 0, c = k % perRow;
    const u = at[0] + r * 1.25, v = at[1] + 0.2 + c * 0.66;
    dipChip(R, u, u + 0.95, v, v + 0.34, at[2], 0.22, body, bmA, bmB, id);
  }
}
// DIP-krets liggande på ett kort (lång axel längs u)
function dipChip(R, u0, u1, v0, v1, z, h, body, bmA, bmB, id) {
  for (let s = 0; s < 2; s++) {
    const a = s ? v1 : v0 - 0.08;
    R.box(u0 + 0.06, u1 - 0.06, a, a + 0.08, z, z + h * 0.7, (f, x) => { const fx = x % 0.106; return fx < 0.05 ? (f === 'top' ? C.tin : fx < 0.015 ? 0xe4e8ec : 0x9a9ea4) : -1; }, id, NOE);
  }
  R.box(u0, u1, v0, v1, z + h * 0.25, z + h, (f, x, y, W, H) => {
    if (f !== 'top') return y < H * 0.5 ? shade(body, 1.1) : shade(body, 0.8);
    { const dy = y - H / 2; if (x * x + dy * dy < 0.006) return shade(body, 0.5); }
    return icTop(x, y, W, H, bmA, bmB, 0.024, body);
  }, id);
}

// =====================================================================================
// Lagring
// =====================================================================================
const DRIVE_DIMS = { hdd35: [5.8, 4.2, 1.1], ssd25: [3.9, 2.8, 0.4], 'hdd-hh': [8.0, 5.8, 1.6], 'mfm-fh': [8.0, 5.8, 3.2] };
export const storageStyle = (p) => p.look?.style || (p.kind === 'nvme' ? (p.look?.heatsink ? 'm2-heatsink' : 'm2') : p.kind === 'hdd' ? 'hdd35' : 'ssd25');
// Diskens mått [djup, bredd, höjd] (liggande: djup längs u, bredd längs v, höjd längs z)
export const driveDims = (p) => DRIVE_DIMS[storageStyle(p)] || DRIVE_DIMS.hdd35;

export function drawStorage(R, p, o) {
  const st = storageStyle(p);
  if (st === 'm2' || st === 'm2-heatsink') return storageM2(R, p, o, st === 'm2-heatsink');
  const [D, Wd, Ht] = driveDims(p), id = o.id;
  const tex = driveTex(p, st, o);
  if (o.orient === 'bay') {
    const [u0, v0, z0] = o.at || [G.media.u0, G.media.v0, G.media.z0];
    return driveBox(R, [u0, u0 + D, v0, v0 + Ht, z0, z0 + Wd], 'bay', tex, id);
  }
  const b = G.bay, [cu, cv, cz] = o.at || [(b.u0 + b.u1) / 2, (b.v0 + b.v1) / 2, G.case.z1 + 0.05];
  driveBox(R, [cu - D / 2, cu + D / 2, cv - Wd / 2, cv + Wd / 2, cz, cz + Ht], 'flat', tex, id);
}

// Ritar en enhet med kanoniska ytor: cover/bottom (a = djup från fronten, b = tvärs),
// front/rear (a = vänster→höger, b = uppifrån), side (a = djup från fronten, b = uppifrån)
function driveBox(R, [u0, u1, v0, v1, z0, z1], orient, tex, id) {
  if (orient === 'bay') {
    R.box(u0, u1, v0, v1, z0, z1, (f, x, y, W, H) => f === 'top' ? tex('side', W - x, y, W, H) : f === 'left' ? tex('bottom', W - x, y, W, H) : tex('front', y, x, H, W), id);
  } else {
    R.box(u0, u1, v0, v1, z0, z1, (f, x, y, W, H) => f === 'top' ? tex('cover', x, y, W, H) : f === 'left' ? tex('side', x, y, W, H) : tex('rear', W - x, y, W, H), id);
  }
}

// Kontakter på baksidan (a = vänster→höger, b uppifrån; B = höjd). Färg eller -1 om inget.
function rearPorts(iface, a, b, A, B, small) {
  const pb = B - (small ? 0.06 : 0.22), pt = Math.max(0.05, pb - (small ? 0.24 : 0.5));
  if (b < pt || b > pb) return -1;
  const lb = (b - pt) / (pb - pt);
  if (iface === 'SATA') {
    const d0 = A * 0.1, d1 = d0 + A * 0.16, p0 = d1 + A * 0.05, p1 = p0 + A * 0.32;
    if ((a > d0 && a < d1) || (a > p0 && a < p1)) {
      const la = a < d1 ? (a - d0) / (d1 - d0) : (a - p0) / (p1 - p0);
      if (lb > 0.35 && lb < 0.6 && la > 0.06 && la < 0.94) return ((a * 30) | 0) % 2 ? C.gold : 0x050505;
      return lb < 0.35 || la < 0.06 || la > 0.94 ? 0x151515 : 0x050505;
    }
    if (a > p1 + A * 0.04 && a < p1 + A * 0.12 && lb > 0.3) return ((a * 25) | 0) % 2 ? C.gold : 0x111111;
    return -1;
  }
  if (iface === 'IDE') {
    const h0 = A * 0.06, h1 = A * 0.58, m0 = A * 0.74, m1 = A * 0.95;
    if (a > h0 && a < h1) { if (lb > 0.2 && lb < 0.8 && a > h0 + 0.05 && a < h1 - 0.05) return ((a * 12.5 | 0) % 2 === 0 && ((lb * 4) | 0) % 2 === 1) ? C.gold : (a > (h0 + h1) / 2 - 0.1 && a < (h0 + h1) / 2 + 0.1 && lb < 0.3 ? 0x2a2a2a : 0x050505); return 0x1e1e1e; }
    if (a > h1 + A * 0.03 && a < h1 + A * 0.12) return ((a * 12.5 | 0) + ((lb * 3) | 0)) % 2 ? C.gold : 0x111111;
    if (a > m0 && a < m1) { const l = (a - m0) / (m1 - m0); if (lb > 0.25 && lb < 0.75 && ((l * 8) | 0) % 2 === 1) return 0x2a2620; return lb < 0.1 && (l < 0.1 || l > 0.9) ? -1 : 0xece6d2; }
    return -1;
  }
  // MFM: kortkant med guldfingrar (34 + 20) + Molex
  if (a > A * 0.05 && a < A * 0.38) return lb > 0.55 ? fingers(a, 0.1) : -1;
  if (a > A * 0.44 && a < A * 0.64) return lb > 0.55 ? fingers(a, 0.1) : -1;
  if (a > A * 0.72 && a < A * 0.94) { const l = (a - A * 0.72) / (A * 0.22); if (lb > 0.2 && lb < 0.7 && ((l * 8) | 0) % 2 === 1) return 0x2a2620; return 0xece6d2; }
  return -1;
}

function driveTex(p, st, o) {
  const L = p.look || {}, lab = hx(L.label, 0x3f9b3a), iface = p.iface || (st === 'mfm-fh' || st === 'hdd-hh' ? 'MFM' : 'SATA');
  const name = p.name || '';
  const bmBrand = TB((p.brand || name.split(' ')[0] || 'DISK'), 10), bmModel = TB(modelText(p, 12) || 'SSD');
  const bmCap = TB(p.mb ? (p.mb >= 1000000 ? Math.round(p.mb / 1000000) + ' TB' : p.mb >= 1000 ? Math.round(p.mb / 1000) + ' GB' : Math.round(p.mb) + ' MB') : (p.gb ? p.gb + ' GB' : ''), 8);
  const old = iface === 'MFM' || iface === 'IDE';
  const alu = 0xc5c9cd, cast = 0xa9aeb3, pcb = old ? C.pcbGreen : 0x1d3324;
  const ssd = st === 'ssd25', big = st === 'hdd-hh' || st === 'mfm-fh';
  const [DA] = DRIVE_DIMS[st] || DRIVE_DIMS.hdd35;
  const bLW = DA * 0.62 - 0.5, sLW = DA - 0.9;                       // etikettbredder (5,25" resp. 3,5")
  const fB = fitPx(bmBrand, bLW * 0.8, 0.08), fM = fitPx(bmModel, bLW - 0.4, 0.1), fC = fitPx(bmCap, bLW - 0.4, 0.07);
  const gB = fitPx(bmBrand, sLW * 0.55, 0.08), gM = fitPx(bmModel, sLW * 0.5, 0.09), gC = fitPx(bmCap, sLW * 0.32, 0.12);
  const hM = fitPx(bmModel, DA - 1.0, 0.1), hC = fitPx(bmCap, DA - 1.0, 0.06);
  const coverC = st === 'hdd-hh' ? 0x222224 : st === 'mfm-fh' ? 0x9ea3a8 : alu;
  return (face, a, b, A, B) => {
    if (ssd) {
      const body = lum(lab) < 60 ? 0x2c2f33 : 0x3b3f45;
      if (face === 'cover') {
        { const d1 = (a - 0.18) ** 2, d2 = (a - A + 0.18) ** 2, e1 = (b - 0.18) ** 2, e2 = (b - B + 0.18) ** 2; if (d1 + e1 < 0.006 || d1 + e2 < 0.006 || d2 + e1 < 0.006 || d2 + e2 < 0.006) return 0x16181a; }
        if (a < 0.06 || b < 0.06) return shade(body, 1.35);
        if (a > 0.35 && a < A - 0.35 && b > 0.45 && b < 1.45) {
          if (txt(bmModel, a, b, 0.5, 0.62, hM)) return 0xffffff;
          if (txt(bmCap, a, b, 0.5, 1.12, hC)) return mix(lab, 0xffffff, 0.6);
          return lab;
        }
        { const s = sticker(a, b, 0.35, 1.65, 2.2, 0.85, 0xe8e8e4, 0x2a2a2a, 4); if (s >= 0) return s; }
        return brushed(body, a, b);
      }
      if (face === 'rear') { const c = rearPorts('SATA', a, b, A, B, true); if (c >= 0) return c; return shade(body, 1.1); }
      if (face === 'side') {
        if (b > B * 0.45 && b < B * 0.55) return shade(body, 0.7);
        { const d = (a - 0.6) ** 2 + (b - B * 0.5) ** 2, d2 = (a - A + 1.0) ** 2 + (b - B * 0.5) ** 2; if (d < 0.004 || d2 < 0.004) return 0x0c0c0c; }
        return body;
      }
      return body;
    }
    if (face === 'cover') {
      if (a < 0.1 || b < 0.1 || a > A - 0.1 || b > B - 0.1) return a < 0.1 || b < 0.1 ? shade(cast, 1.2) : shade(cast, 0.8);
      // skruvar
      if (a < 0.5 || a > A - 0.5 || b < 0.5 || b > B - 0.5) {
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
          const sa = i === 0 ? 0.3 : i === 1 ? A / 2 : A - 0.3, sb = j ? B - 0.3 : 0.3;
          const c = screwHead(a, b, sa, sb, 0.13); if (c >= 0) return c;
        }
      }
      const mc = A - (big ? 2.2 : 1.55), dd = Math.sqrt((a - mc) ** 2 + (b - B / 2) ** 2);
      if (big) {
        // MFM/5,25": målat lock, etikett med defektlista
        if (a > 0.5 && a < A * 0.62 && b > 0.5 && b < B - 0.5) {
          const la = a - 0.5, lb = b - 0.5, LW = A * 0.62 - 0.5, LH = B - 1;
          if (la < 0.04 || lb < 0.04 || la > LW - 0.04 || lb > LH - 0.04) return 0xb8b8b0;
          if (lb < 0.7) return txt(bmBrand, la, lb, 0.2, 0.18, fB) ? 0xf2f2ea : (st === 'hdd-hh' ? 0x1d5a9a : 0x2a2a2a);
          if (txt(bmModel, la, lb, 0.2, 0.9, fM)) return 0x1a1a1a;
          if (txt(bmCap, la, lb, 0.2, 1.55, fC)) return 0x3a3a3a;
          if (lb > 2.1 && lb < LH - 0.9 && la > 0.2 && la < LW - 0.2) {           // defektlista
            if (((lb - 2.1) % 0.28) < 0.03 || ((la - 0.2) % 0.9) < 0.03) return 0x7a7a74;
            return fineLines(la, lb, 0.3, 2.2, LW - 0.6, 8, 0.28) && hash((la * 3) | 0, (lb * 3.5) | 0) > 0.5 ? 0x2a4ab0 : 0xf2f0e6;
          }
          const bc = barcode(la, lb, 0.2, LH - 0.7, LW * 0.6, 0.45); if (bc >= 0) return bc;
          return 0xf2f0e6;
        }
        if (dd < 1.2) return Math.abs(dd - 1.1) < 0.05 ? shade(coverC, 1.4) : dd < 0.3 ? 0xd8d8d8 : shade(coverC, 1.05);
        // varningsdekal (garantisigill)
        if (a > A - 0.9 && a < A - 0.35 && b > 0.35 && b < 0.7) return ((a * 20) | 0) % 2 ? 0xd8dce0 : 0xb0b4ba;
        return speckle(coverC, a, b, 25, 0.06);
      }
      // 3,5": etikett över större delen av locket
      if (a > 0.45 && a < A - 0.45 && b > 0.45 && b < B - 0.45) {
        const la = a - 0.45, lb = b - 0.45, LW = A - 0.9, LH = B - 0.9;
        if (la < 0.03 || lb < 0.03 || la > LW - 0.03 || lb > LH - 0.03) return 0xc8c8c2;
        if (lb < 0.55) return txt(bmBrand, la, lb, 0.15, 0.12, gB) ? 0xffffff : (old ? 0x2a2a2a : lab);
        if (txt(bmModel, la, lb, 0.15, 0.75, gM)) return 0x222222;
        if (txt(bmCap, la, lb, LW - 0.2 - bmCap.w * gC, 0.7, gC)) return old ? 0x2a2a2a : lab;
        if (lb > 1.35 && lb < 1.42 && la < LW - 0.15) return old ? 0x9a9a9a : lab;
        if (fineLines(la, lb, 0.15, 1.6, LW * 0.55, 6, 0.14)) return 0x7a7a7a;
        if (la > LW * 0.62 && lb > 1.6 && lb < 2.4) {                              // jumper-/varningsrutor
          const gx = ((la - LW * 0.62) * 6) % 1, gy = ((lb - 1.6) * 6) % 1;
          return gx < 0.2 || gy < 0.2 ? 0x8a8a8a : (hash(((la) * 6) | 0, ((lb) * 6) | 0) > 0.6 ? 0x2a2a2a : 0xf2f2ec);
        }
        const bc = barcode(la, lb, 0.15, LH - 0.55, LW * 0.45, 0.4); if (bc >= 0) return bc;
        const m = matrix(la, lb, LW - 0.6, LH - 0.6, 0.45, 9, 3); if (m >= 0) return m;
        { const dx = la - LW * 0.55, dy = lb - LH + 0.35; if (dx * dx + dy * dy < 0.01) return 0x111111; }
        return 0xf0f0ec;
      }
      if (Math.abs(dd - 0.9) < 0.06) return 0x9a9ea3;
      return brushed(alu, a, b);
    }
    if (face === 'side') {
      const pcbH = big ? 0.28 : 0.18;
      if (b > B - pcbH) { if (b > B - 0.04) return shade(pcb, 0.7); const sm = smd(a, b, 0.4, 0.09); return sm >= 0 ? sm : pcb; }
      if (Math.abs(b - (big ? 0.55 : 0.22)) < 0.025) return shade(cast, 0.7);           // skarv lock/chassi
      for (let i = 0; i < 3; i++) {
        const ha = big ? 1.4 + i * 2.6 : 0.9 + i * (A - 1.8) / 2, hb = B * (big ? 0.6 : 0.62);
        const d = (a - ha) ** 2 + (b - hb) ** 2;
        if (d < 0.012) return d < 0.004 ? 0x0c0c0c : 0x5a5e64;
      }
      if (big && b < B - pcbH && ((a * 3) % 1) < 0.1) return shade(cast, 1.15);           // gjutna ribbor
      return st === 'hdd-hh' && b < 0.55 ? 0x262628 : brushed(cast, a, b);
    }
    if (face === 'rear') {
      const c = rearPorts(iface, a, b, A, B, false); if (c >= 0) return c;
      if (b > B - (big ? 0.28 : 0.18)) return b > B - 0.05 ? shade(pcb, 0.7) : pcb;
      return big && b < 0.55 ? (st === 'hdd-hh' ? 0x262628 : cast) : shade(cast, 0.9);
    }
    if (face === 'front') {
      if (big) {
        // frontpanel med lysdiod
        const plate = st === 'mfm-fh' ? 0xb8bcc0 : 0x1a1a1c;
        if (a < 0.05 || b < 0.05) return shade(plate, 1.3);
        { const on = !!o.powered; if (a > 0.35 && a < 0.6 && b > B / 2 - 0.12 && b < B / 2 + 0.12) return on ? C.ledRed : 0x5a1a14; }
        if (txt(bmBrand, a, b, A - 2.2, B / 2 - 0.1, 0.05)) return st === 'mfm-fh' ? 0x2a2a2a : 0x9aa0a6;
        return (b * 10 | 0) % 4 === 0 ? shade(plate, 1.08) : plate;
      }
      if (b > B - 0.18) return pcb;
      return brushed(cast, a, b);
    }
    // bottom: kretskort med kretsar
    if (a < 0.1 || b < 0.1 || a > A - 0.1 || b > B - 0.1) return cast;
    const ca = a % 1.6, cb = b % 1.3;
    if (ca > 0.3 && ca < 1.2 && cb > 0.3 && cb < 0.75) return ca < 0.34 || cb < 0.34 ? 0x3a3a3e : 0x18181b;
    const s = smd(a, b, 0.4, 0.12); if (s >= 0) return s;
    const t = pcbArt(a, b, pcb, 0.5); if (t >= 0) return t;
    return pcb;
  };
}

function storageM2(R, p, o, heatsink) {
  const L = p.look || {}, id = o.id, lab = hx(L.label, 0x2c6fb7), m = G.m2;
  const [u0, vc, z] = o.at || [m.u0, (m.v0 + m.v1) / 2, BOARD_TOP];
  const Lm = 5.0, hw = 0.45, pcb = 0x1a2a20;
  const bmName = TB(modelText(p, 10) || (p.name || 'SSD').split(' ').slice(-2, -1)[0], 10), bmBrand = TB(p.brand || (p.name || '').split(' ')[0], 8);
  const bmCap = TB(p.mb ? (p.mb >= 1000000 ? Math.round(p.mb / 1000000) + 'TB' : Math.round(p.mb / 1000) + 'GB') : p.gb ? (p.gb >= 1000 ? p.gb / 1000 + 'TB' : p.gb + 'GB') : '', 6);
  const LWm = 4.25, pBr = fitPx(bmBrand, LWm * 0.5, 0.065), pCap = fitPx(bmCap, LWm * 0.3, 0.065), pNm = fitPx(bmName, LWm * 0.4, 0.045);
  // kretskort: skruvhack, fingrar med M-nyckel, SMD
  R.box(u0, u0 + Lm, vc - hw, vc + hw, z + 0.05, z + 0.1, (f, x, y, W, H) => {
    if (f !== 'top') return x > W - 0.28 ? C.gold : 0x14201a;
    { const dx = x, dy = y - H / 2; if (dx * dx + dy * dy < 0.02) return -1; if (dx * dx + dy * dy < 0.04) return C.gold; }
    if (x > W - 0.28) { const d = y - H * 0.3; if (d * d < 0.0025) return -1; return y < 0.04 || y > H - 0.04 ? pcb : fingers(y, 0.05); }
    const s = smd(x, y, 0.45, 0.09); if (s >= 0) return s;
    return x < 0.03 || y < 0.03 ? shade(pcb, 1.5) : pcb;
  }, id);
  // styrkrets + NAND under etiketten
  R.box(u0 + 0.35, u0 + 1.45, vc - 0.36, vc + 0.36, z + 0.1, z + 0.17, (f) => f === 'top' ? 0x2a2a2e : 0x151517, id);
  R.box(u0 + 1.6, u0 + 4.5, vc - 0.38, vc + 0.38, z + 0.1, z + 0.18, (f) => f === 'top' ? 0x2a2a2e : 0x151517, id);
  if (heatsink) {
    const col = hx(L.color, 0x1a1a1a);
    R.box(u0 + 0.25, u0 + Lm - 0.3, vc - hw - 0.02, vc + hw + 0.02, z + 0.1, z + 0.55, (f, x, y, W, H) => {
      if (f === 'top') {
        if (p.rgb && (y < 0.08 || y > H - 0.08)) return led(o, 'storage', x);
        if (txt(bmBrand, x, y, 0.5, H / 2 - Math.min(pBr, 0.05) * 2.5, Math.min(pBr, 0.05))) return 0xe8e8e8;
        if (x > 0.3 && x < W - 0.3 && ((x * 6) % 1) < 0.35 && x > 2.2) return shade(col, 0.55);
        return x < 0.05 || y < 0.05 ? shade(col, 1.6) : brushed(shade(col, 1.2), x, y);
      }
      if (f === 'left') return ((x * 6) % 1) < 0.35 && x > 2.2 && y < 0.25 ? shade(col, 0.5) : (y > H - 0.08 ? 0x0a0a0a : col);
      return col;
    }, id);
    return;
  }
  R.box(u0 + 0.3, u0 + 4.55, vc - 0.4, vc + 0.4, z + 0.18, z + 0.2, (f, x, y, W, H) => {
    if (f !== 'top') return lab;
    if (x < 0.03 || y < 0.03) return shade(lab, 1.3);
    if (txt(bmBrand, x, y, 0.25, 0.1, pBr)) return 0xf2f2f2;
    if (txt(bmCap, x, y, W - 0.25 - bmCap.w * pCap, 0.1, pCap)) return 0xf2f2f2;
    if (txt(bmName, x, y, 0.25, 0.5, pNm)) return 0xe8e8e8;
    const bc = barcode(x, y, W - 1.75, 0.46, 1.0, 0.2); if (bc >= 0) return bc;
    const mm = matrix(x, y, W - 0.55, 0.42, 0.28, 7, 2); if (mm >= 0) return mm;
    if (y > 0.43 && y < 0.46 && x > 0.25 && x < W - 0.25) return shade(lab, 1.4);
    return lab;
  }, id);
}

// =====================================================================================
// Disketter och optiska enheter
// =====================================================================================
const MEDIA_COL = { beige: 0xd9d0b5, black: 0x1d1d1f, white: 0xecece8, grey: 0x9a9ca0 };
export const mediaStyle = (p) => p.look?.style || (p.kind === 'floppy525' ? 'floppy525' : p.kind === 'floppy35' ? 'floppy35' : 'optical');

// Frontpanelen i verkliga koordinater (a vänster→höger, b uppifrån, A×B). Används även av det
// stående chassit (art-case.js) för enheterna i 5,25"/3,5"-platserna.
export function mediaFront(p, o = {}) {
  const L = p.look || {}, st = mediaStyle(p);
  const base = MEDIA_COL[L.color] ?? hx(L.color, MEDIA_COL.beige);
  const dark = lum(base) < 90, ink = dark ? 0xa8aaae : 0x6a655a;
  const kind = p.kind || '';
  const logo = TB(kind === 'bd' ? 'BLU-RAY' : kind === 'dvdrw' ? 'DVD-RW' : kind === 'dvd' ? 'DVD' : kind === 'cdrw' ? 'CD-RW' : kind === 'cdrom' ? 'COMPACT DISC' : st === 'floppy35' ? '1.44 MB' : '1.2 MB', 12);
  const bmBrand = TB(p.brand || (p.name || '').split(' ')[0], 9);
  const speed = TB(kind === 'cdrom' ? '52X' : kind === 'cdrw' ? '48X' : kind === 'bd' ? '12X' : kind ? '16X' : '', 4);
  const on = !!(o.powered && (o.busy || o.lit?.media));
  const ledC = st === 'optical' ? C.ledAmber : st === 'floppy35' ? C.ledGreen : C.ledRed;
  const nineties = kind === 'cdrom';
  return (a, b, A, B) => {
    const sb = B / 1.7, sa = A / 4.8;                                   // skala mot 5,25"-mått
    if (a < 0.03 * sa || b < 0.03 * sb) return shade(base, 1.18);
    if (a > A - 0.03 * sa || b > B - 0.03 * sb) return shade(base, 0.72);
    if (st === 'floppy525') {
      // diskettspringa med vridspak
      const s0 = B * 0.3, s1 = B * 0.52, x0 = A * 0.07, x1 = A * 0.93;
      const lx = A * 0.5;
      if (a > lx - A * 0.035 && a < lx + A * 0.035 && b > B * 0.16 && b < B * 0.68) {
        const dx = a - lx, dy = b - B * 0.42;
        if (dx * dx + dy * dy < (A * 0.03) ** 2) return dark ? 0x5a5a5a : 0x3a3834;
        return dx < -A * 0.02 ? (dark ? 0x6a6a6a : 0x4a4640) : (dark ? 0x3c3c3c : 0x24221e);
      }
      if (a > x0 && a < x1 && b > s0 && b < s1) {
        if (b < s0 + B * 0.03) return shade(base, 0.55);
        if (b > s1 - B * 0.025) return shade(base, 1.2);
        return b > (s0 + s1) / 2 && b < (s0 + s1) / 2 + B * 0.02 ? 0x2a2a2a : 0x0c0c0c;
      }
      if (a > x0 && a < x0 + A * 0.05 && b > B * 0.7 && b < B * 0.8) return on ? C.ledRed : 0x5a1a14;
      if (txt(bmBrand, a, b, A * 0.62, B * 0.7, B * 0.045)) return ink;
      if (txt(logo, a, b, A * 0.18, B * 0.7, B * 0.04)) return shade(ink, 1.1);
      return speckle(base, a, b, 40, 0.04);
    }
    if (st === 'floppy35') {
      const s0 = B * 0.2, s1 = B * 0.45, x0 = A * 0.2, x1 = A * 0.8;
      if (a > x0 && a < x1 && b > s0 && b < s1) {
        if (b < s0 + B * 0.04 || a < x0 + A * 0.01) return shade(base, 0.55);
        return a > x1 - A * 0.1 && b > s1 - B * 0.12 ? 0x0a0a0a : shade(base, dark ? 1.3 : 0.62);    // lucka
      }
      if (inRound(a, b, A * 0.74, B * 0.58, A * 0.9, B * 0.84, B * 0.05)) {                      // utmatningsknapp
        const ea = a - A * 0.74, eb = b - B * 0.58;
        return ea < A * 0.01 || eb < B * 0.03 ? shade(base, 1.25) : (eb > B * 0.23 ? shade(base, 0.7) : shade(base, dark ? 1.15 : 0.95));
      }
      if (a > A * 0.1 && a < A * 0.18 && b > B * 0.66 && b < B * 0.74) return on ? C.ledGreen : 0x1e4a24;
      if (txt(logo, a, b, A * 0.34, B * 0.62, B * 0.05)) return ink;
      return speckle(base, a, b, 40, 0.04);
    }
    // optisk enhet: släde med logga, utmatning, lysdiod, nödhål, ev. hörlursuttag + volym
    const t0 = B * 0.08, t1 = B * 0.6;
    if (b > t0 && b < t1 && a > A * 0.025 && a < A * 0.975) {
      if (b < t0 + B * 0.025 || b > t1 - B * 0.02 || a < A * 0.03 || a > A * 0.97) return shade(base, 0.45);
      if (txt(logo, a, b, A * 0.06, B * 0.26, B * (kind === 'cdrom' ? 0.032 : 0.06))) return ink;
      if (kind === 'cdrom') { const dx = a - A * 0.08 - B * 0.12, dy = b - B * 0.46; if (dx * dx + dy * dy < (B * 0.06) ** 2 && dx * dx + dy * dy > (B * 0.035) ** 2) return ink; }
      if (txt(speed, a, b, A * 0.84, B * 0.26, B * 0.05)) return ink;
      if (!dark) return speckle(base, a, b, 40, 0.04);
      let s = (a * 0.4 + b) % 2.2; if (s < 0) s += 2.2;
      return s < 0.08 ? shade(base, 1.8) : base;
    }
    if (inRound(a, b, A * 0.8, B * 0.7, A * 0.94, B * 0.88, B * 0.05)) {
      const eb = b - B * 0.7;
      return eb < B * 0.03 ? shade(base, 1.3) : eb > B * 0.15 ? shade(base, 0.65) : shade(base, dark ? 1.2 : 0.93);
    }
    if (a > A * 0.72 && a < A * 0.76 && b > B * 0.74 && b < B * 0.8) return on ? ledC : shade(ledC, 0.3);
    { const dx = a - A * 0.67, dy = b - B * 0.79; if (dx * dx + dy * dy < (B * 0.025) ** 2) return 0x050505; }
    if (nineties) {
      const j = jack(a, b, A * 0.07, B * 0.79, B * 0.08, dark ? 0x2a2a2a : 0x8a8478); if (j >= 0) return j;
      { const dx = a - A * 0.15, dy = b - B * 0.79, d2 = dx * dx + dy * dy; if (d2 < (B * 0.09) ** 2) return d2 > (B * 0.07) ** 2 ? shade(base, 0.5) : (knurl(Math.atan2(dy, dx), 0.4) ? shade(base, 0.8) : shade(base, 1.1)); }
    }
    if (txt(bmBrand, a, b, A * (nineties ? 0.24 : 0.06), B * 0.73, B * 0.045)) return ink;
    return speckle(base, a, b, 40, 0.035);
  };
}

// o.orient: 'bay' = monterad i det liggande chassit (standard i byggvyn): front mot +u, ovansidan mot -v,
// bredden längs z. 'flat' = liggande på bordet (standard när enheten ligger lös / i ikoner): ovansidan upp.
// o.size = [djup, höjd, bredd] i båda fallen.
export function drawMedia(R, p, o) {
  const st = mediaStyle(p), id = o.id, small = st === 'floppy35';
  const g = small ? G.floppy : G.media;
  const flat = (o.orient ?? (looseOf(o) ? 'flat' : 'bay')) === 'flat';
  const [u0, v0, z0] = o.at || [g.u0, g.v0, g.z0];
  const bx = o.box && o.box.u1 !== undefined ? o.box : null;
  const [U, V, Z] = o.size || (bx ? [bx.u1 - bx.u0, bx.v1 - bx.v0, bx.z1 - bx.z0] : [g.u1 - g.u0, g.v1 - g.v0, g.z1 - g.z0]);
  const EV = flat ? Z : V, EZ = flat ? V : Z;                       // boxens mått i v och z
  const L = p.look || {}, base = MEDIA_COL[L.color] ?? hx(L.color, MEDIA_COL.beige);
  const front = mediaFront(p, o), bt = 0.16, optical = st === 'optical';
  const steel = 0xb9bdc1, iface = p.iface || (optical ? 'IDE' : 'floppy');
  const bmSt = TB(optical ? 'CLASS 1 LASER PRODUCT' : 'MADE IN JAPAN', 22), bmModel = TB(modelText(p, 12) || p.name, 12);
  const bmBrand = TB(p.brand || (p.name || '').split(' ')[0], 10);
  // kontakt på baksidan: bredd [wa, wb] och höjd [ha, hb] som andelar
  const conn = (wa, wb, ha, hb, tex) => flat
    ? R.box(u0 - 0.2, u0 + 0.05, v0 + EV * (1 - wb), v0 + EV * (1 - wa), z0 + EZ * (1 - hb), z0 + EZ * (1 - ha), tex, id)
    : R.box(u0 - 0.2, u0 + 0.05, v0 + EV * ha, v0 + EV * hb, z0 + EZ * (1 - wb), z0 + EZ * (1 - wa), tex, id);
  const hdr = (f, x, y) => f === 'top' || f === 'left' ? (((x + y) * 14 | 0) % 2 ? C.gold : 0x111111) : 0x1a1a1a;
  const molex = (f, x, y) => ((x + y) * 8 | 0) % 2 ? 0xece6d2 : 0xd8d2be;
  if (iface === 'SATA') { conn(0.15, 0.3, 0.35, 0.6, hdr); conn(0.34, 0.62, 0.35, 0.6, (f) => f === 'right' ? 0x151515 : 0x0a0a0a); }
  else { conn(0.08, 0.55, 0.3, 0.7, hdr); conn(0.68, 0.9, 0.3, 0.7, molex); if (optical) conn(0.58, 0.65, 0.35, 0.6, molex); }
  const W0 = U - bt;
  // plåtkroppens ytor (r = läsriktning bakifrån→framåt, s = tvärs/uppifrån)
  const cover = (r, s, A, B) => {
    { const e1 = (r - 0.35) ** 2, e2 = (r - A + 0.35) ** 2, f1 = (s - 0.22) ** 2, f2 = (s - B + 0.22) ** 2; if (e1 + f1 < 0.006 || e1 + f2 < 0.006 || e2 + f1 < 0.006 || e2 + f2 < 0.006) return 0x2a2c30; }
    if (s < 0.05) return 0xdadee2;
    if (small) {
      // 3,5": stängt plåtlock med prägling, liten öppning bak och dekal
      if (inRound(r, s, A * 0.08, B * 0.12, A * 0.9, B * 0.88, 0.12) && !inRound(r, s, A * 0.08 + 0.05, B * 0.12 + 0.05, A * 0.9, B * 0.88, 0.12)) return 0xd8dce0;
      if (r > A * 0.14 && r < A * 0.34 && s > B * 0.25 && s < B * 0.6) return r < A * 0.15 || s < B * 0.27 ? 0x3a3c40 : ((r * 12 | 0) % 3 ? 0x16181a : C.copper);
      const sk = sticker(r, s, A * 0.5, B * 0.24, A * 0.32, B * 0.5, 0xf0f0ea, 0x2a2a2a, 3);
      if (sk >= 0) return txt(bmBrand, r, s, A * 0.5 + 0.06, B * 0.24 + 0.03, fitPx(bmBrand, A * 0.28, 0.05)) ? 0xffffff : sk;
      return brushed(steel, r, s);
    }
    if (!optical) {
      // 5,25": öppen ram med huvudvagn, styrstång och spindelmotor
      if (r > A * 0.18 && r < A * 0.92 && s > B * 0.14 && s < B * 0.86) {
        const lr = r - A * 0.18, ls = s - B * 0.14, LA = A * 0.74, LB = B * 0.72;
        if (lr < 0.05 || ls < 0.05) return 0x3a3c40;
        { const dr = r - A * 0.62, ds = s - B / 2, d2 = dr * dr + ds * ds; if (d2 < (B * 0.18) ** 2) return d2 < (B * 0.05) ** 2 ? 0x8a8e94 : d2 > (B * 0.16) ** 2 ? 0x5a5e64 : 0x2a2c30; }
        if (Math.abs(s - B * 0.3) < 0.05) return brushed(0xd8dce0, r, s);                         // styrstång
        if (r > A * 0.24 && r < A * 0.42 && s > B * 0.22 && s < B * 0.44) return (r * 20 | 0) % 3 ? 0x6a5a3a : 0xb8963a;   // huvudvagn
        if (lr > LA * 0.05 && lr < LA * 0.2 && ls > LB * 0.6 && ls < LB * 0.9) return ((r + s) * 16 | 0) % 2 ? C.copper : 0x7a4a20;  // stegmotor
        return 0x16181a;
      }
      return brushed(steel, r, s);
    }
    const sk = sticker(r, s, A * 0.36, B * 0.22, A * 0.32, B * 0.52, 0xe4e6e2, 0x3a3a3a, 7);
    if (sk >= 0) {
      if (txt(bmBrand, r, s, A * 0.36 + 0.08, B * 0.22 + 0.03, fitPx(bmBrand, A * 0.24, 0.06))) return 0xffffff;
      if (txt(bmSt, r, s, A * 0.36 + 0.08, B * 0.22 + B * 0.18, fitPx(bmSt, A * 0.28, 0.03))) return 0x2a2a2a;
      return sk;
    }
    if (inRound(r, s, A * 0.1, B * 0.1, A * 0.9, B * 0.9, 0.1) && !inRound(r, s, A * 0.1 + 0.05, B * 0.1 + 0.05, A * 0.9, B * 0.9, 0.1)) return 0xd6dade;
    return brushed(steel, r, s);
  };
  const side = (r, s, A, B) => {
    for (let i = 0; i < 3; i++) { const d = (r - (0.8 + i * (A - 1.6) / 2)) ** 2 + (s - B * 0.62) ** 2; if (d < 0.01) return d < 0.004 ? 0x101010 : 0x6a6e74; }
    if (s < 0.05) return 0xdadee2;
    if (inRound(r, s, 1.6, B * 0.18, A - 1.4, B * 0.42, 0.08)) return r < 1.65 || s < B * 0.21 ? 0xd0d4d8 : shade(steel, 0.92);
    return brushed(steel, r, s);
  };
  const bottom = (r, s, A, B) => {
    if (!optical && r > A * 0.35 && r < A * 0.85 && s > B * 0.12 && s < B * 0.88) {
      const lr = r - A * 0.35, ls = s - B * 0.12;
      if (lr < 0.04 || ls < 0.04) return 0x1a3a22;
      const cr = lr % 1.1, cs = ls % 1.0;
      if (cr > 0.25 && cr < 0.8 && cs > 0.3 && cs < 0.62) return cr < 0.29 || cs < 0.34 ? 0x3a3a3e : 0x18181b;
      const sm = smd(r, s, 0.35, 0.13); if (sm >= 0) return sm;
      const t = pcbArt(r, s, C.pcbGreen, 0.5); return t >= 0 ? t : C.pcbGreen;
    }
    const sk = sticker(r, s, A * 0.08, B * 0.2, Math.min(2.2, A * 0.3), B * 0.6, 0xf0f0ea, 0x2a2a2a, 5);
    if (sk >= 0) return txt(bmModel, r, s, A * 0.08 + 0.08, B * 0.2 + 0.03, fitPx(bmModel, Math.min(2.2, A * 0.3) - 0.2, 0.05)) ? 0xffffff : sk;
    return ((r * 4) | 0) % 5 === 0 ? shade(steel, 0.92) : steel;
  };
  if (flat) {
    R.box(u0, u0 + W0, v0 + 0.03, v0 + EV - 0.03, z0 + 0.03, z0 + EZ - 0.03, (f, x, y, W, H) => f === 'top' ? cover(x, y, W, H) : f === 'left' ? side(x, y, W, H) : steel, id);
    R.box(u0 + W0, u0 + U, v0, v0 + EV, z0, z0 + EZ, (f, x, y, W, H) => f === 'right' ? front(W - x, y, W, H) : f === 'top' ? (y < 0.03 ? shade(base, 1.2) : base) : shade(base, 0.92), id);
  } else {
    R.box(u0, u0 + W0, v0 + 0.03, v0 + EV - 0.03, z0 + 0.03, z0 + EZ - 0.03, (f, x, y, W, H) => f === 'top' ? side(x, y, W, H) : f === 'left' ? bottom(x, y, W, H) : steel, id);
    R.box(u0 + W0, u0 + U, v0, v0 + EV, z0, z0 + EZ, (f, x, y, W, H) => f === 'right' ? front(y, x, H, W) : f === 'top' ? (x < 0.03 ? shade(base, 1.2) : base) : shade(base, 0.92), id);
  }
}

// =====================================================================================
// Instickskort: gemensamma delar (bracket, kretskort, komponenter)
// =====================================================================================
// Kortkontakter [bakänden → framåt]: [u0, u1] relativt kortets bakände
const EDGE = {
  ISA8: [[1.4, 4.3]], ISA16: [[1.4, 4.3], [4.45, 6.2]], VLB: [[1.4, 4.3], [4.45, 6.2], [6.6, 9.3]],
  PCI: [[1.6, 2.2], [2.3, 4.9]], AGP: [[1.8, 2.3], [2.4, 5.0]], PCIe: [[1.85, 2.25], [2.35, 5.25]], PCIe1: [[1.85, 2.25], [2.35, 2.95]],
};
const EDGE_PITCH = { ISA8: 0.093, ISA16: 0.093, VLB: 0.093, PCI: 0.047, AGP: 0.047, PCIe: 0.037, PCIe1: 0.037 };

// Plåtbracket (insidan syns) + skruvflik. w = ['bare'|'dual'], vent = luftspalter
function bracket(R, [u, v, z], wide, vent, id) {
  const v0 = wide ? v - 1.0 : v - 0.5, v1 = wide ? v + 1.0 : v + 0.8;
  R.box(u - 0.5, u - 0.25, v0, v1, z, z + 3.55, (f, x, y, W, H) => {
    if (f === 'top') return 0xd6dade;
    if (f !== 'right') return C.steel;
    if (y > H - 0.4 && (x < W * 0.38 || x > W * 0.62)) return -1;                  // tunga nedtill
    if (y > 0.18 && y < 0.24) return 0x8a9097;                                      // bockning
    if (vent === 'honey' && y > 0.5 && y < H - 0.6 && x > 0.15 && x < W - 0.15) return honeycomb(x, y, 0.22) ? C.steel : 0x1a1a1a;
    if (vent === 'slots' && y > 0.5 && y < H - 0.6 && x > 0.2 && x < W - 0.2 && vents(x, y, 0.28, 0.9, 0.14, 0.75)) return 0x1a1a1a;
    return brushed(C.steel, x, y, 'y');
  }, id);
  R.box(u - 0.8, u - 0.2, v - 0.5, v + 0.5, z + 3.05, z + 3.8, (f, x, y) => f === 'top' ? brushed(0xd6dade, x, y) : C.steel, id);
}

// Kretskortet (komponentsidan = +v, "left" i rastern), kontaktfingrar när kortet är löst
function cardPcb(R, [u, v, z], U, pcb, bus, loose, silk, id, top = 3.1) {
  const edges = EDGE[bus] || EDGE.PCI, pitch = EDGE_PITCH[bus] || 0.05, zb = loose ? z + 0.02 : z + 0.35;
  const [bmA, bmB] = silk;
  R.box(u, u + U, v - 0.05, v + 0.05, zb, z + top, (f, x, y, W, H) => {
    if (f !== 'left') return f === 'top' ? shade(pcb, 1.25) : shade(pcb, 0.9);
    const hb = H - y;                                                  // höjd över kortets underkant
    if (loose && hb < 0.33) {
      for (let i = 0; i < edges.length; i++) if (x > edges[i][0] && x < edges[i][1]) return hb < 0.04 ? 0x1f3a22 : fingers(x - edges[i][0], pitch);
      return -1;
    }
    if (x < 0.04 || y < 0.04 || x > W - 0.04) return shade(pcb, 1.35);
    // monteringshål och silkscreen
    { const dx = x - (W - 0.3), dy = y - 0.3; const d2 = dx * dx + dy * dy; if (d2 < 0.012) return d2 < 0.005 ? -1 : C.tin; }
    if (bmA && txt(bmA, x, y, W - 0.3 - bmA.w * 0.05, 0.55, 0.05)) return C.silk;
    if (bmB && txt(bmB, x, y, W - 0.3 - bmB.w * 0.04, 0.9, 0.04)) return C.silk;
    const a = pcbArt(x, y, pcb, 0.55); if (a >= 0) return a;
    return pcb;
  }, id);
}

// Komponentfabrik för kortets komponentsida. c = { u, v, z, id } (v = kretskortets +v-yta)
function ic(R, c, du, dz, len, h, dep, bmA, bmB, body = C.epoxy, legs = 'dip') {
  R.box(c.u + du, c.u + du + len, c.v, c.v + dep, c.z + dz, c.z + dz + h, (f, x, y, W, H) => {
    if (f === 'top') {
      if (legs === 'dip') return y < 0.05 ? ((x % 0.093) < 0.04 ? C.tin : -1) : shade(body, 1.2);
      if (legs === 'qfp') return y < 0.04 ? ((x % 0.05) < 0.025 ? C.tin : -1) : shade(body, 1.2);
      return shade(body, 1.2);
    }
    if (f === 'right') return legs === 'qfp' && y > 0.04 && y < H - 0.04 && ((y % 0.05) < 0.025) ? C.tin : shade(body, 0.9);
    if (legs === 'qfp') {
      const e = 0.07;
      if (x < e || x > W - e || y < e || y > H - e) { const t = x < e || x > W - e ? y : x; return (t % 0.05) < 0.025 && !((x < e || x > W - e) && (y < e || y > H - e)) ? C.tin : -1; }
      return icTop(x - e, y - e, W - 2 * e, H - 2 * e, bmA, bmB, Math.min(0.045, W * 0.035), body);
    }
    if (legs === 'plcc') {
      const e = 0.05;
      if (x < e || x > W - e || y < e || y > H - e) return ((x < e || x > W - e ? y : x) % 0.06) < 0.03 ? C.tin : shade(body, 0.7);
      if (x + y < 0.14) return shade(body, 0.6);
    }
    return icTop(x, y, W, H, bmA, bmB, Math.min(0.04, H * 0.09), body);
  }, c.id);
}
// Kristalloscillator (metallburk)
function can(R, c, du, dz, len, h, bm) {
  R.box(c.u + du, c.u + du + len, c.v, c.v + 0.16, c.z + dz, c.z + dz + h, (f, x, y, W, H) => {
    if (f !== 'left') return f === 'top' ? 0xe0e4e8 : 0x9aa0a6;
    if (!inRound(x, y, 0, 0, W, H, 0.08)) return 0x9aa0a6;
    if (bm && txt(bm, x, y, 0.08, H / 2 - 0.06, 0.028)) return 0x2a2a2a;
    return brushed(x + y < 0.1 ? 0xf0f2f4 : 0xc8ccd0, x, y);
  }, c.id);
}
// EPROM med kvartsfönster (eller BIOS-dekal)
function eprom(R, c, du, dz, window, bm) {
  R.box(c.u + du, c.u + du + 1.35, c.v, c.v + 0.14, c.z + dz, c.z + dz + 0.55, (f, x, y, W, H) => {
    if (f === 'top') return y < 0.05 ? ((x % 0.093) < 0.04 ? C.tin : -1) : 0x4a4640;
    if (f !== 'left') return 0x3a3630;
    if (window) {
      const dx = x - W / 2, dy = y - H / 2, d2 = dx * dx + dy * dy;
      if (d2 < 0.034) { if (dx * dx < 0.006 && dy * dy < 0.006) return (x * 40 | 0) % 2 ? 0xd8b24a : 0x8a7a50; return d2 > 0.028 ? 0x9aa0a6 : 0x3a4048; }
    } else if (x > 0.25 && x < W - 0.25 && y > 0.08 && y < H - 0.08) {
      return txt(bm, x, y, 0.32, H / 2 - 0.08, 0.035) ? 0x2a2a2a : ((x + y) * 6 | 0) % 2 ? 0xe8eaec : 0xd0d4d8;
    }
    return icTop(x, y, W, H, null, null, 0.03, 0x2e2a26);
  }, c.id);
}
// Elektrolytkondensator (axel längs v)
function capE(R, c, du, dz, r, len, sleeve = 0x1a2a6a) {
  R.box(c.u + du, c.u + du + 2 * r, c.v, c.v + len, c.z + dz, c.z + dz + 2 * r, (f, x, y, W, H) => {
    if (f === 'left') { const t = capTop(x, y, W / 2, H / 2, r * 0.98, sleeve); return t >= 0 ? t : -1; }
    const a = f === 'top' ? x : y, s = f === 'top' ? W : H;
    if (a > s * 0.72 && a < s * 0.9) return 0xd8dce0;                  // minusrand
    return shade(sleeve, 1.25 - Math.abs(a / s - 0.4) * 0.8);
  }, c.id);
}
// Liten komponent (keramisk kondensator/motstånd)
function blob(R, c, du, dz, w, h, dep, color) {
  R.box(c.u + du, c.u + du + w, c.v, c.v + dep, c.z + dz, c.z + dz + h, (f, x, y) => f === 'left' ? (x < 0.02 || y < 0.02 ? shade(color, 1.3) : color) : shade(color, 0.85), c.id);
}
// Stiftlist
function header(R, c, du, dz, len, h, body = 0x151515) {
  R.box(c.u + du, c.u + du + len, c.v, c.v + 0.18, c.z + dz, c.z + dz + h, (f, x, y) => {
    if (f === 'left') return ((x % 0.1) > 0.035 && (x % 0.1) < 0.065 && (y % 0.1) > 0.035 && (y % 0.1) < 0.065) ? C.gold : body;
    return shade(body, 1.3);
  }, c.id);
}
// D-sub-/jack-kropp vid bracketen (den del som syns på kortsidan)
function portBody(R, c, dz, len, dep, body, kind) {
  R.box(c.u - 0.25, c.u + 0.35, c.v, c.v + dep, c.z + dz, c.z + dz + len, (f, x, y, W, H) => {
    if (kind === 'dsub') {
      if (f === 'left') return x < 0.2 ? brushed(C.steel, x, y, 'y') : ((y % 0.12) < 0.05 && x > 0.3 ? C.tin : body);
      return f === 'top' ? C.steel : body;
    }
    if (f === 'left') { const d = (x - W / 2) ** 2 + (y - H / 2) ** 2; return d < (H * 0.3) ** 2 ? shade(body, 0.6) : body; }
    return shade(body, 1.15);
  }, c.id);
}
// Volymhjul (räfflat) vid bracketen
function wheel(R, c, dz) {
  R.box(c.u - 0.3, c.u + 0.35, c.v + 0.05, c.v + 0.2, c.z + dz, c.z + dz + 0.65, (f, x, y, W, H) => {
    const dx = x - W / 2, dy = y - H / 2;
    if (f === 'left') { if (dx * dx + dy * dy > (H / 2) ** 2) return -1; return knurl(Math.atan2(dy, dx), 0.25) ? 0x3a3a3a : 0x1a1a1a; }
    return knurl(x, 0.05) ? 0x3a3a3a : 0x151515;
  }, c.id);
}

// =====================================================================================
// Grafikkort
// =====================================================================================
export function gpuStyle(p) {
  const L = p.look || {};
  if (L.style) return L.style;
  if (L.fe) return 'fe';
  if (L.astral) return 'astral';
  return (L.fans || 2) <= 1 ? 'single-fan' : L.fans >= 3 ? 'triple' : 'dual';
}
const STYLE_LEN = { 'isa-short': 6.5, 'isa-full': 12.5, vlb: 9.5, 'pci-bare': 6.5, 'agp-bare': 6.5, 'agp-heatsink': 7.2, 'agp-fan': 7.8, 'single-fan': 6.5, blower: 9.5 };
export const cardLen = (p) => (p.len ? GPU_LEN[Math.max(0, Math.min(2, p.len - 1))] : STYLE_LEN[gpuStyle(p)] ?? GPU_LEN[1]);
const gpuAt = (o) => o.at || [G.gpu.u0, (G.gpu.v0 + G.gpu.v1) / 2, BOARD_TOP];
// Kylarlådan (moderna kort): används av layout.js för strömkontaktens läge
export function gpuBox(p, at) {
  const [u, v, z] = at || [G.gpu.u0, (G.gpu.v0 + G.gpu.v1) / 2, BOARD_TOP];
  return { u0: u, u1: u + cardLen(p), v0: v - 0.8, v1: v + 0.8, z0: z + 0.35, z1: z + 3.1 };
}
const GPU_CHIP = { nvidia: 'NVIDIA', amd: 'AMD', ati: 'ATI', '3dfx': '3DFX', matrox: 'MATROX', s3: 'S3', tseng: 'TSENG', cirrus: 'CIRRUS', trident: 'TRIDENT', ibm: 'IBM', hercules: 'HERCULES', paradise: 'PARADISE', intel: 'INTEL', rendition: 'RENDITION', powervr: 'NEC' };

export function drawGpu(R, p, o) {
  const st = gpuStyle(p), at = gpuAt(o);
  if (st === 'isa-short' || st === 'isa-full' || st === 'vlb' || st === 'pci-bare' || st === 'agp-bare' || st === 'agp-heatsink' || st === 'agp-fan') return gpuBare(R, p, o, at, st);
  return gpuShroud(R, p, o, at, st);
}

function gpuBare(R, p, o, at, st) {
  const L = p.look || {}, id = o.id, loose = looseOf(o), U = cardLen(p);
  const [u, v, z] = at;
  const bus = st === 'vlb' ? 'VLB' : st.startsWith('isa') ? (p.bus === 'ISA8' ? 'ISA8' : p.bus || 'ISA16') : st.startsWith('agp') ? 'AGP' : 'PCI';
  const pcb = hx(L.pcb, st.startsWith('agp') && (L.brand === 'nvidia' || L.brand === 'ati') ? 0x2a4a8a : C.pcbGreen);
  const chipName = TB(GPU_CHIP[L.brand] || p.brand || 'VGA', 9), model = TB(modelText(p, 10));
  bracket(R, at, false, null, id);
  cardPcb(R, at, U, pcb, bus, loose, [TB(p.brand || '', 12), TB(modelText(p, 12))], id);
  const c = { u, v: v + 0.05, z, id };
  const outs = p.out || (st.startsWith('isa') && !/VGA/.test(p.std || '') ? ['DE9'] : ['VGA']);
  // portar vid bracketen
  let pz = 2.2;
  for (const out of outs.slice(0, 3)) {
    if (out === 'DE9') portBody(R, c, pz, 0.75, 0.42, 0x2a2a2a, 'dsub');
    else if (out === 'VGA') portBody(R, c, pz, 0.85, 0.42, 0x2a4a9a, 'dsub');
    else if (out === 'DVI') portBody(R, c, pz - 0.35, 1.2, 0.42, 0xe8e8e2, 'dsub');
    else portBody(R, c, pz, 0.5, 0.3, 0x1a1a1a, 'jack');
    pz -= out === 'DVI' ? 1.5 : 1.05;
    if (pz < 0.4) break;
  }
  const b1 = TB('74LS245'), b2 = TB('8745');
  if (st === 'isa-full') {
    // tidiga MDA/CGA/EGA-kort: 6845 + rader av TTL-kretsar
    ic(R, c, 1.1, 1.6, 2.0, 0.55, 0.14, TB('MC6845P'), TB('MOTOROLA'));
    for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) {
      if (r === 2 && k < 2) continue;
      const du = 1.0 + k * 1.2 + (r % 2) * 0.3, dz = 0.55 + r * 0.62;
      if (du + 0.8 > U - 0.3 || (r === 2 && du < 3.3)) continue;
      ic(R, c, du, dz, k % 3 === 0 ? 0.95 : 0.75, 0.3, 0.13, k % 2 ? b1 : TB('74LS' + (100 + k * 13)), b2);
    }
    eprom(R, c, 4.0, 2.45, false, TB('BIOS'));
    can(R, c, 5.8, 2.6, 0.55, 0.32, TB('14.318'));
    for (let i = 0; i < 6; i++) blob(R, c, 6.8 + i * 0.5, 2.7, 0.12, 0.22, 0.12, i % 2 ? 0xd8a02a : 0x3a6ad8);
    capE(R, c, 8.5, 2.45, 0.22, 0.5);
    header(R, c, 9.5, 2.55, 1.2, 0.2);
  } else if (st === 'isa-short' || st === 'vlb') {
    // VGA-kort: stor grafikkrets, RAMDAC, minneskretsar, BIOS, kristaller, DIP-omkopplare
    const vlb = st === 'vlb';
    ic(R, c, 2.3, 1.1, 1.15, 1.15, 0.1, chipName, model, C.epoxy, 'qfp');
    ic(R, c, 1.1, 0.55, 1.25, 0.42, 0.14, TB('RAMDAC'), TB('SC11487'));
    for (let i = 0; i < (vlb ? 8 : 4); i++) ic(R, c, 3.8 + i * 0.62, 0.55, 0.5, 0.75, 0.11, TB('KM44C256'), TB('-70'), C.epoxy, 'soj');
    for (let i = 0; i < (vlb ? 0 : 4); i++) ic(R, c, 3.8 + i * 0.62, 1.45, 0.5, 0.75, 0.11, TB('KM44C256'), TB('-70'), C.epoxy, 'soj');
    eprom(R, c, vlb ? 4.2 : 3.9, 2.35, true, null);
    can(R, c, 1.05, 2.55, 0.5, 0.3, TB('25.175'));
    can(R, c, 1.65, 2.55, 0.5, 0.3, TB('28.322'));
    R.box(u + 0.5, u + 0.95, c.v, c.v + 0.15, z + 1.3, z + 1.95, (f, x, y) => f === 'left' ? ((y * 8 | 0) % 2 && x > 0.12 && x < 0.33 ? 0xf2f2f2 : 0xc8323a) : 0xa82a30, id);
    for (let i = 0; i < 5; i++) blob(R, c, 2.2 + i * 0.3, 2.55, 0.12, 0.2, 0.1, 0xd8a02a);
    capE(R, c, U - 1.0, 0.6, 0.22, 0.5);
    if (vlb) { ic(R, c, 7.8, 1.4, 1.0, 0.36, 0.13, TB('74F245'), b2); ic(R, c, 7.8, 0.55, 1.0, 0.36, 0.13, TB('74F244'), b2); }
  } else {
    // PCI/AGP: grafikkrets (ev. kylfläns/fläkt), TSOP-minnen, BIOS, kondensatorer
    ic(R, c, 2.6, 1.0, 1.1, 1.1, 0.1, chipName, model, C.epoxy, 'qfp');
    for (let i = 0; i < 4; i++) ic(R, c, 4.1 + (i % 2) * 0.7, 0.55 + ((i >> 1) % 2) * 1.05, 0.55, 0.85, 0.08, TB('HY57V'), TB('-10'), C.epoxy, 'tsop');
    for (let i = 0; i < 2; i++) ic(R, c, 1.2, 0.55 + i * 0.95, 0.55, 0.85, 0.08, TB('HY57V'), TB('-10'), C.epoxy, 'tsop');
    ic(R, c, 5.6, 2.4, 0.5, 0.5, 0.1, TB('BIOS'), null, C.epoxy, 'plcc');
    can(R, c, 2.1, 2.5, 0.45, 0.28, TB('14.3'));
    for (let i = 0; i < 3; i++) capE(R, c, 5.45 + i * 0.3, 1.5, 0.12, 0.35, i % 2 ? 0x2a2a2a : 0x6a2a8a);
    if (st === 'agp-heatsink' || st === 'agp-fan') {
      const fin = hx(L.accent, 0x2a2a2c);
      R.box(u + 2.35, u + 3.95, c.v + 0.1, c.v + 0.5, z + 0.75, z + 2.35, (f, x, y, W, H) => {
        if (f === 'left') return ((x * 8) % 1) < 0.5 ? shade(fin, 1.3) : shade(fin, 0.5);
        if (f === 'top') return ((x * 8) % 1) < 0.5 ? shade(fin, 1.5) : -1;
        return shade(fin, 1.1);
      }, id);
      if (st === 'agp-fan') R.box(u + 2.45, u + 3.85, c.v + 0.5, c.v + 0.72, z + 0.85, z + 2.25, (f, x, y, W, H) => {
        if (f !== 'left') return 0x1a1a1a;
        return fan(x, y, W / 2, H / 2, 0.52, { spin: o.spin || 0, frame: 0x1a1a1a, blade: 0x2c2c2c, hub: 0xd8d8d0, blades: 7, ring: -1 });
      }, id);
    }
  }
}

function gpuShroud(R, p, o, at, st) {
  const L = p.look || {}, id = o.id, loose = looseOf(o);
  const colr = hx(L.color, 0x2a2c30), acc = hx(L.accent, -1);
  const nv = L.brand !== 'amd' && L.brand !== 'ati', brand = nv ? 0x76b900 : 0xd8343c;
  const g = gpuBox(p, at), U = g.u1 - g.u0, [u, v, z] = at;
  const fe = st === 'fe', astral = st === 'astral', blow = st === 'blower';
  const nFans = blow ? 0 : fe ? 2 : st === 'single-fan' ? 1 : st === 'triple' || astral ? 3 : Math.max(1, Math.min(4, L.fans || 2));
  const logo = TB(astral ? 'ROG ASTRAL' : nv ? (/GTX/.test(p.name || '') ? 'GEFORCE GTX' : 'GEFORCE RTX') : 'RADEON');
  const bmBrand = TB(p.brand || '', 8), bladeC = lum(colr) > 140 ? 0xe8e8e8 : 0x1c1c1c;
  const trim = acc >= 0 && !astral ? acc : lum(colr) > 140 ? shade(colr, 0.8) : 0x8a8e94;
  const bmModel = TB(modelText(p, 12));
  const spin = o.spin || 0;
  bracket(R, at, true, fe || blow ? 'honey' : 'slots', id);
  // PCIe-fingrar (lös)
  if (loose) {
    const e = EDGE.PCIe;
    R.box(u + 1.8, u + 5.3, v - 0.66, v - 0.58, z + 0.02, z + 0.4, (f, x, y, W, H) => {
      if (f !== 'left') return C.pcbGreen;
      const X = x + 1.8;
      for (let i = 0; i < 2; i++) if (X > e[i][0] && X < e[i][1]) return y > 0.06 ? fingers(X, 0.037) : 0x1f3a22;
      return y < 0.06 ? 0x1a2a1e : -1;
    }, id, NOE);
  }
  // kylaren
  R.box(g.u0, g.u1, g.v0, g.v1, g.z0, g.z1, (f, x, y, W, H) => {
    if (f === 'left') {
      if (p.rgb && y < 0.14) return led(o, 'gpu', x);
      if (y > H - 0.3 && !fe) return ((x * 11) % 1) < 0.45 ? 0x9a9ea4 : 0x141416;          // flänsar under kåpan
      if (fe) {
        const band = x > W * 0.36 && x < W * 0.64;
        if (band) { if (txt(logo, x, y, W * 0.36 + 0.25, H / 2 - 0.25, 0.1)) return 0xe8e8e8; return (y * 12 | 0) % 2 ? 0x151515 : 0x1c1c1c; }
        for (let i = 0; i < 2; i++) { const c = fan(x, y, W * (i ? 0.82 : 0.18), H / 2, 1.15, { spin, frame: 0x151515, blade: 0x2b2b2b, hub: 0x3a3a3a, blades: 9, ring: -1 }); if (c >= 0) return c; }
        if (x < 0.06 || y < 0.06) return shade(colr, 1.3);
        let d = (x + y) % 0.34; if (d < 0) d += 0.34;
        return d < 0.03 ? shade(colr, 1.12) : brushed(colr, x, y);
      }
      if (blow) {
        const c = blower(x, y, W - 1.6, H / 2, 1.05, { spin, frame: colr, blade: 0x3a3a3a, hub: 0x1a1a1a });
        if (c >= 0) return c;
        if (y > H * 0.42 && y < H * 0.58 && x < W - 2.8 && x > 0.4) { if (txt(logo, x, y, 0.8, H / 2 - 0.2, 0.08)) return 0xeeeeee; return 0x0e0e10; }
        if ((x * 0.8 + y) % 1.8 < 0.05) return shade(colr, 1.3);
        return x < 0.06 || y < 0.06 ? shade(colr, 1.3) : speckle(colr, x, y, 40, 0.04);
      }
      const sp = W / nFans, r = Math.min(H / 2 - 0.3, sp / 2 - 0.22);
      const i = Math.min(nFans - 1, (x / sp) | 0), fcx = sp * (i + 0.5), fcy = H / 2 - 0.12;
      const dx = x - fcx, dy = y - fcy, d2 = dx * dx + dy * dy;
      if (d2 < r * r) return fan(x, y, fcx, fcy, r - 0.02, { spin: spin * (i % 2 ? -1 : 1), frame: shade(colr, 0.6), blade: bladeC, hub: acc >= 0 ? acc : 0x303030, blades: 9, ring: astral && p.rgb ? led(o, 'gpu', i * 2) : -1, struts: false });
      // metallring runt öppningen med fas
      if (d2 < (r + 0.1) * (r + 0.1)) return dy < -dx * 0.3 ? shade(trim, 1.25) : trim;
      if (d2 < (r + 0.16) * (r + 0.16)) return shade(colr, 0.45);
      // skruvar vid fläktarna
      { const s1 = screwHead(x, y, fcx - r * 0.78, fcy - r * 0.9, 0.065); if (s1 >= 0) return s1; const s2 = screwHead(x, y, fcx + r * 0.78, fcy + r * 0.9, 0.065); if (s2 >= 0) return s2; }
      // kåpans fasetter: ljus överkantsplåt, vinklade spår, mörk nederplåt med luftspalter
      const lx = x - sp * i;
      if (y < 0.24 + lx * 0.04 && y < 0.5) return y < 0.05 ? shade(colr, 1.6) : shade(colr, 1.22);
      let diag = (x * 0.8 + y) % 2.2; if (diag < 0) diag += 2.2;
      if (acc >= 0 && diag < 0.1) return astral ? led(o, 'gpu', x * 0.5) : acc;
      if (diag > 1.05 && diag < 1.1) return shade(colr, 0.55);
      if (y > H - 0.36) return vents(x, y, 0.22, 0.12, 0.14, 0.05) ? 0x0a0a0c : shade(colr, 0.62);
      if (i === nFans - 1 && txt(bmBrand, x, y, W - 0.3 - bmBrand.w * 0.05, H - 0.62, 0.05)) return shade(colr, 2.4);
      if (x < 0.05) return shade(colr, 1.4);
      let e = (x - y) % 1.1; if (e < 0) e += 1.1;
      return e < 0.04 ? shade(colr, 1.25) : speckle(colr, x, y, 30, 0.04);
    }
    if (f === 'top') {
      // kortets ovankant: bakplatta, kretskort, kåpa med logga, genomsikt mot flänsar
      if (y < 0.1) return (x * 5 | 0) % 7 === 0 ? 0x0a0a0a : 0x2a2c30;
      if (y < 0.18) { const s = smd(x, y, 0.6, 0.08); return s >= 0 ? s : 0x1a2a1e; }
      if (txt(logo, x, y, 1.0, 0.45, 0.13)) return p.rgb ? led(o, 'gpu', x) : (fe ? 0xe8e8e8 : brand);
      if (txt(bmModel, x, y, 1.0, 1.2, 0.06)) return fe ? 0xb8bcc2 : 0x8a8e94;
      if (y > 1.25 && x > 4.2 && x < W - 2.4 && ((x * 6) % 1) < 0.5 && ((y * 10) | 0) % 2 === 0) return 0x0a0a0c;
      if (x < 0.05) return shade(colr, 1.3);
      return brushed(((x * 3) | 0) % 6 === 0 ? shade(colr, 0.9) : shade(colr, 0.75), x, y);
    }
    // kortänden: bakplatta, kretskort, flänsar, kåpans ände
    if (x < 0.1) return 0x2a2c30;
    if (x < 0.18) return 0x1a2a1e;
    if (y < 0.15 || y > H - 0.12 || x > W - 0.12) return shade(colr, 0.9);
    const fy = (y * 9) % 1;
    return fy < 0.5 ? (fy < 0.12 ? 0x7a7e84 : 0x4a4d52) : 0x121315;
  }, id);
  // strömkontakter på ovankanten
  if (p.pwr && p.pwr !== 'molex') {
    const n = p.pwr === '3xpcie8' ? 3 : p.pwr === '2xpcie8' ? 2 : 1, w = p.pwr === '12vhpwr' ? 0.72 : 0.95;
    for (let i = 0; i < n; i++) {
      const cu = g.u1 - 2.1 - i * (w + 0.12);
      R.box(cu, cu + w, v - 0.45, v + 0.05, g.z1, g.z1 + 0.12, (f, x, y, W, H) => {
        if (f !== 'top') return 0x111111;
        const cols = p.pwr === '12vhpwr' ? 6 : p.pwr === 'pcie6' ? 3 : 4;
        const cx = (x / W * cols) % 1, cy = (y / H * 2) % 1;
        return cx > 0.18 && cx < 0.82 && cy > 0.2 && cy < 0.8 ? (cy < 0.35 ? 0x2a2a2a : 0x050505) : 0x1e1e1e;
      }, id);
    }
  }
}

// =====================================================================================
// Ljudkort
// =====================================================================================
export function drawSound(R, p, o) {
  const L = p.look || {}, id = o.id, loose = looseOf(o);
  const at = o.at || [G.snd.u0, (G.snd.v0 + G.snd.v1) / 2, BOARD_TOP];
  const [u, v, z] = at;
  const st = L.style || (p.bus === 'PCI' ? 'pci' : p.bus === 'PCIe' ? 'pcie' : 'isa');
  const pcb = hx(L.pcb, st === 'pcie' ? 0x1a1a1c : C.pcbGreen), acc = hx(L.accent, 0xc9323a);
  const name = p.name || '', isa8 = p.bus === 'ISA8';
  const blaster = /blaster|awe|gravis|ultrasound|pro audio|ess|aztech|galaxy/i.test(name);
  const U = st === 'pcie' ? 6.2 : st === 'pci' ? 7.2 : isa8 ? (blaster ? 8.2 : 6.2) : /awe/i.test(name) ? 12.5 : 10.2;
  const bus = st === 'pcie' ? 'PCIe1' : st === 'pci' ? 'PCI' : isa8 ? 'ISA8' : 'ISA16';
  bracket(R, at, false, null, id);
  cardPcb(R, at, U, pcb, bus, loose, [TB(p.brand || '', 14), TB(modelText(p, 12))], id);
  const c = { u, v: v + 0.05, z, id };
  const bmA = TB(p.brand === 'Creative' || /blaster/i.test(name) ? 'CREATIVE' : (p.brand || 'AUDIO'), 9);
  if (st === 'isa') {
    // jack + volymhjul + ev. gameport (DA-15)
    portBody(R, c, 2.75, 0.34, 0.34, 0x1a1a1a, 'jack');
    if (blaster) { portBody(R, c, 2.3, 0.34, 0.34, 0x1a1a1a, 'jack'); portBody(R, c, 1.85, 0.34, 0.34, 0x1a1a1a, 'jack'); }
    wheel(R, c, blaster ? 1.05 : 2.0);
    if (blaster) portBody(R, c, 0.4, 0.55, 0.42, 0x2a2a2a, 'dsub');
    ic(R, c, 1.4, 1.9, 1.15, 0.55, 0.14, TB('YMF262'), TB('YAMAHA'));                      // OPL3
    ic(R, c, 2.9, 0.8, 0.9, 0.9, 0.1, bmA, TB(isa8 ? 'CT1336' : 'CT1747'), C.epoxy, 'plcc');  // DSP
    if (!isa8) ic(R, c, 4.3, 0.8, 1.0, 1.0, 0.1, TB('CT1745'), TB('MIXER'), C.epoxy, 'qfp');
    ic(R, c, 2.8, 2.25, 0.95, 0.36, 0.13, TB('LM1877'), TB('AMP'));
    for (let i = 0; i < 3 && 4.1 + i * 1.05 + 0.8 < U - 0.3; i++) ic(R, c, 4.1 + i * 1.05, 2.25, 0.8, 0.3, 0.13, TB('74HC' + (138 + i * 34)), TB('9412'));
    can(R, c, 1.35, 1.1, 0.55, 0.3, TB('14.318'));
    for (let i = 0; i < 4; i++) capE(R, c, 1.3 + i * 0.4, 0.5, 0.15, 0.5, i % 2 ? 0x1a2a6a : 0x2a2a2a);
    for (let i = 0; i < 6 && 4.4 + i * 0.28 < U - 0.4; i++) blob(R, c, 4.4 + i * 0.28, isa8 ? 1.9 : 0.55, 0.12, 0.2, 0.1, i % 3 ? 0xd8a02a : 0x3a6ad8);
    if (!isa8) {
      header(R, c, 6.0, 2.6, 2.0, 0.2);                                                        // CD-ROM-gränssnitt
      header(R, c, 8.3, 2.6, 0.4, 0.2, 0xe8e2d0);                                              // CD-ljud
      R.box(u + 6.3, u + 7.6, c.v, c.v + 0.2, z + 1.2, z + 1.8, (f, x, y) => f === 'left' ? ((x % 0.2) < 0.1 ? 0x2a2a2a : 0x151515) : 0x0e0e0e, id);   // jumperblock
    }
    if (U > 11) for (let i = 0; i < 2; i++) R.box(u + 8.8, u + 12.1, c.v, c.v + 0.2, z + 0.5 + i * 0.6, z + 0.9 + i * 0.6, (f, x, y) => f === 'left' ? (x < 0.2 || x > 3.1 ? 0xe8e2d0 : 0xf2eee0) : 0xd8d2c0, id);
    return;
  }
  if (st === 'pci') {
    for (let i = 0; i < 4; i++) portBody(R, c, 2.75 - i * 0.48, 0.36, 0.36, i === 0 ? 0x3a8a3a : C.gold, 'jack');
    portBody(R, c, 0.35, 0.55, 0.42, 0x2a2a2a, 'dsub');
    ic(R, c, 2.3, 0.9, 1.2, 1.2, 0.1, bmA, TB('EMU10K1'), C.epoxy, 'qfp');
    ic(R, c, 4.0, 1.9, 0.6, 0.6, 0.08, TB('AC97'), TB('STAC'), C.epoxy, 'qfp');
    can(R, c, 4.0, 1.1, 0.45, 0.28, TB('24.5'));
    for (let i = 0; i < 3; i++) header(R, c, 5.2 + i * 0.55, 2.6, 0.4, 0.2, 0xe8e2d0);
    header(R, c, 5.4, 1.2, 1.0, 0.2);
    for (let i = 0; i < 5; i++) capE(R, c, 1.4 + i * 0.35, 0.5, 0.14, 0.45, 0x2a2a2a);
    for (let i = 0; i < 6; i++) blob(R, c, 4.2 + i * 0.28, 0.55, 0.12, 0.2, 0.1, 0xd8a02a);
    return;
  }
  // PCIe: EMI-skärm med logga, guldpläterade jack + optisk utgång
  for (let i = 0; i < 4; i++) portBody(R, c, 2.8 - i * 0.48, 0.36, 0.36, C.gold, 'jack');
  portBody(R, c, 0.6, 0.42, 0.4, 0x1a1a1a, 'jack');
  capE(R, c, 5.3, 0.5, 0.16, 0.5, 0x2a2a2a);
  const bmS = TB('SOUND BLASTER', 14);
  R.box(u + 0.6, u + U - 0.9, c.v, c.v + 0.35, z + 0.55, z + 2.95, (f, x, y, W, H) => {
    if (f === 'top') return shade(acc, 1.2);
    if (f === 'right') return shade(acc, 0.8);
    if (x < 0.05 || y < 0.05) return shade(acc, 1.4);
    if (txt(bmS, x, y, 0.35, H / 2 - 0.15, 0.08)) return 0xf2f2f2;
    if (p.rgb && y > H - 0.2) return led(o, 'sound', x);
    let d = (x - y * 0.6) % 1.4; if (d < 0) d += 1.4;
    return d < 0.06 ? shade(acc, 0.7) : speckle(acc, x, y, 30, 0.05);
  }, id);
}

// =====================================================================================
// Nätaggregat
// =====================================================================================
export const psuStyle = (p) => p.look?.style || ((p.modular ?? p.watt >= 750) ? 'modular' : 'atx-black');
export const psuDims = () => [G.psu.u1 - G.psu.u0, G.psu.v1 - G.psu.v0, G.psu.z1 - G.psu.z0];
const EFF = { '80plus': [0xf2f2f2, 0x2a2a2a], bronze: [0xb87333, 0xf2e0c8], silver: [0xc0c4c8, 0x2a2a2a], gold: [0xd8b24a, 0x2a2a2a], platinum: [0xe5e4e2, 0x5a5a5a], titanium: [0x8a8d91, 0xf2f2f2] };

export function drawPsu(R, p, o) {
  const st = psuStyle(p), L = p.look || {}, id = o.id;
  const at = o.at || [G.psu.u0, G.psu.v0, G.psu.z0], [U, V, Z] = o.size || psuDims(p);
  const [u0, v0, z0] = at;
  const at_ = st === 'at-silver' || st === 'at-beige', silver = st === 'at-silver' || st === 'atx-silver';
  const colr = hx(L.color, st === 'at-beige' ? C.beige : silver ? C.zinc : 0x1c1c1c), acc = hx(L.accent, 0xe8c030);
  const bmWatt = TB((p.watt || 200) + 'W'), bmBrand = TB((p.brand || p.name || '').split(' ')[0].replace('!', ''), 10);
  const bmHead = TB('SWITCHING POWER SUPPLY'), eff = EFF[p.eff] || (st === 'modular' || st === 'atx-black' ? EFF[p.eff ?? 'gold'] : null);
  const modular = st === 'modular';
  const wPx = fitPx(bmWatt, V - 1.5, 0.14), bPx = fitPx(bmBrand, V - 1.5, 0.09), lPx = fitPx(bmBrand, 3.5, 0.13), aPx = fitPx(bmBrand, (U - 2.6) * 0.55, 0.08), hPx = fitPx(bmHead, U - 2.9, 0.045), awPx = fitPx(bmWatt, (U - 2.6) * 0.3, 0.1);
  const metal = (x, y) => silver ? speckle(brushed(colr, x, y), x, y, 12, 0.05) : st === 'at-beige' ? speckle(colr, x, y, 40, 0.04) : brushed(colr, x, y);
  R.box(u0, u0 + U, v0, v0 + V, z0, z0 + Z, (f, x, y, W, H) => {
    if (f === 'top') {
      if (x < 0.07 || y < 0.07) return shade(colr, 1.3);
      if (x > W - 0.07 || y > H - 0.07) return shade(colr, 0.75);
      { const sx = x < 0.4 ? 0.22 : x > W - 0.4 ? W - 0.22 : -9, sy = y < 0.4 ? 0.22 : y > H - 0.4 ? H - 0.22 : -9; if (sx > -9 && sy > -9) { const s = screwHead(x, y, sx, sy, 0.11); if (s >= 0) return s; } }
      if (at_) {
        // AT: ventilationshål vid fläktänden + stor specifikationsdekal
        if (x < 1.7 && x > 0.4 && y > 0.4 && y < H - 0.4) return perforated(x, y, 0.2, 0.065) ? 0x0e0e0e : metal(x, y);
        if (x > 2.1 && x < W - 0.5 && y > 0.55 && y < H - 0.55) {
          const lx = x - 2.1, ly = y - 0.55, LW = W - 2.6, LH = H - 1.1;
          if (lx < 0.04 || ly < 0.04 || lx > LW - 0.04 || ly > LH - 0.04) return 0x9a9a92;
          if (ly < 0.45) return txt(bmHead, lx, ly, 0.15, 0.13, hPx) ? 0xf2f2ea : 0x2a2a2a;
          if (txt(bmBrand, lx, ly, 0.15, 0.6, aPx)) return 0x1a1a1a;
          if (txt(bmWatt, lx, ly, LW - 0.15 - bmWatt.w * awPx, 0.6, awPx)) return 0x1a1a1a;
          if (ly > 1.2 && ly < LH - 0.9 && lx > 0.15 && lx < LW - 0.15) {       // utgångstabell
            if (((ly - 1.2) % 0.3) < 0.025 || ((lx - 0.15) % 0.9) < 0.025) return 0x5a5a5a;
            return fineLines(lx, ly, 0.3, 1.3, LW - 0.6, 6, 0.3) ? 0x3a3a3a : 0xecece4;
          }
          { const tx = lx - 0.5, ty = ly - LH + 0.45; if (ty > -0.3 && ty < 0 && tx > -0.2 && tx < 0.2 && Math.abs(tx) < (ty + 0.3) * 0.66) return ty > -0.08 || Math.abs(tx) > (ty + 0.3) * 0.5 ? 0x1a1a1a : 0xf2c020; }
          const bc = barcode(lx, ly, LW - 2.0, LH - 0.6, 1.6, 0.4); if (bc >= 0) return bc;
          return 0xecece4;
        }
        return metal(x, y);
      }
      // ATX: fläktgaller + fläkt, märkesplatta, wattdekal
      const fcx = silver ? 2.4 : 2.9, fr = silver ? 1.75 : 2.3;
      const dx = x - fcx, dy = y - H / 2, d2 = dx * dx + dy * dy;
      if (d2 < fr * fr) {
        if (d2 < 0.2) return silver ? 0xb0b4b8 : acc;
        if (silver) { const d = Math.sqrt(d2); if ((d % 0.28) < 0.06 || (Math.abs(dx) < 0.04 || Math.abs(dy) < 0.04)) return 0xd8dce0; }
        else if (honeycomb(x, y, 0.36)) return shade(colr, 1.5);
        const c = fan(x, y, fcx, H / 2, fr - 0.1, { spin: o.spin || 0, frame: 0x101010, blade: 0x2a2a2a, hub: silver ? 0x333333 : acc, blades: 7, ring: -1 });
        return c < 0 ? 0x0a0a0a : shade(c, 0.6);
      }
      if (x > W - 1.8 && x < W - 0.3 && y > 0.5 && y < H - 0.5) {
        // text längs plattan (läses uppåt höger på skärmen)
        const c = (H - 0.75) - y, r = x - (W - 1.62);
        if (txt(bmWatt, c, r, 0, 0, wPx)) return 0x111111;
        if (txt(bmBrand, c, r, 0, wPx * 5 + 0.14, bPx)) return shade(acc, 0.45);
        return x < W - 1.75 || y < 0.55 ? shade(acc, 1.3) : acc;
      }
      return metal(x, y);
    }
    if (f === 'left') {
      if (at_) {
        // luftspalter vid fläktänden
        if (x < 1.5 && x > 0.3 && y > 0.4 && y < H - 0.4) return vents(x, y, 0.18, 0.5, 0.1, 0.36) ? 0x0e0e0e : metal(x, y);
        return metal(x, y);
      }
      if (x > 0.5 && x < 4.4 && y > 0.35 && y < 1.55) {
        if (txt(bmBrand, x, y, 0.7, 0.55, lPx)) return silver ? 0x1a1a1a : 0xffffff;
        if (y > 1.25 && y < 1.35) return silver ? 0x1a1a1a : 0xffffff;
        return silver ? 0xe8e8e4 : acc;
      }
      if (eff && x > 5.0 && x < 6.35 && y > 0.4 && y < 1.75) {
        const dx = x - 5.67, dy = y - 1.07;
        if (dx * dx + dy * dy < 0.36) return dx * dx + dy * dy < 0.2 ? eff[0] : eff[1];
        return metal(x, y);
      }
      if (x > 0.5 && x < 4.4 && y > 1.7 && y < H - 0.25) { if (fineLines(x, y, 0.6, 1.8, 3.6, 6, 0.14)) return 0x111111; const bc = barcode(x, y, 3.0, H - 0.6, 1.2, 0.25); return bc >= 0 ? bc : 0xe8e8e4; }
      return metal(x, y);
    }
    // framsidan (mot chassits insida): modulära uttag eller kabelgenomföring
    const X = W - x;
    if (!modular) {
      const d2 = (X - 1.2) ** 2 + (y - 1.4) ** 2;
      if (d2 < 0.5) return d2 > 0.25 ? 0x2a2a2a : 0x050505;
      return at_ || silver ? (vents(X, y, 0.3, 0.3, 0.16, 0.16) && X > 2.2 ? 0x0e0e0e : metal(X, y)) : shade(colr, 1.2);
    }
    const sock = (a0, a1, b0, b1) => X > a0 && X < a1 && y > b0 && y < b1;
    if (sock(0.3, 1.9, 0.4, 1.3) || sock(2.2, 3.0, 0.4, 1.3) || sock(3.2, 4.0, 0.4, 1.3) || sock(0.3, 1.1, 1.6, 2.5) || sock(1.3, 2.1, 1.6, 2.5) || sock(2.4, 4.0, 1.7, 2.3)) {
      const cx = (X * 8) % 1, cy = (y * 8) % 1;
      return cx > 0.2 && cx < 0.8 && cy > 0.2 && cy < 0.8 ? 0x050505 : 0x222222;
    }
    if (y > 1.38 && y < 1.5 && X > 0.3 && X < 4.0) return 0xd8d8d8;
    return shade(colr, 1.25);
  }, id);
  // AT: stor röd strömbrytare på sidan + P8/P9-kablage
  if (at_) {
    R.box(u0 + 0.4, u0 + 1.45, v0 + V, v0 + V + 0.3, z0 + 0.8, z0 + 2.2, (f, x, y, W, H) => {
      if (f === 'left') {
        if (x < 0.12 || x > W - 0.12 || y < 0.12 || y > H - 0.12) return 0x1a1a1a;
        const up = y < H / 2;
        if (y > H / 2 - 0.03 && y < H / 2 + 0.03) return 0x5a0a0a;
        if (up && x > W / 2 - 0.03 && x < W / 2 + 0.03 && y > 0.3 && y < 0.55) return 0xf2f2f2;
        return up ? 0xd8262a : 0xa81a1e;
      }
      return f === 'top' ? 0xe8363a : 0x1a1a1a;
    }, id);
  }
  if (!modular) {
    // kabelknippe ut ur genomföringen
    const cu = u0 + U, cvv = v0 + 1.2, cz = z0 + 1.2;
    const wires = at_ ? [C.wireRed, C.wireBlack, C.wireBlack, C.wireOrange, C.wireBlue, C.wireYellow, C.wireWhite] : [C.wireOrange, C.wireRed, C.wireBlack, C.wireYellow, C.wireBlack];
    R.box(cu, cu + 0.55, cvv - 0.35, cvv + 0.35, cz - 0.4, cz + 0.4, (f, x, y) => {
      if (!at_ && !silver) return (((x + y) * 12) | 0) % 2 ? 0x1a1a1a : 0x2e2e2e;                 // flätad strumpa
      return wires[((f === 'top' ? y : y) * 10 | 0) % wires.length];
    }, id);
    if (at_) {
      for (let i = 0; i < 2; i++) R.box(cu + 0.55, cu + 0.95, cvv - 0.36 + i * 0.38, cvv - 0.02 + i * 0.38, cz - 0.45, cz + 0.45, (f, x, y) => f === 'top' ? ((y * 20 | 0) % 2 ? 0xe8e2d0 : 0xc8c2b0) : ((y * 7 | 0) % 2 ? 0xece6d2 : 0xd8d2be), id);
    }
  }
}

// =====================================================================================
// Fläktar
// =====================================================================================
// En fläktenhet i en låda; face = ytan där fläkten syns
export function drawFanBox(R, u0, u1, v0, v1, z0, z1, face, look, o, id) {
  const frame = typeof look.frame === 'number' ? look.frame : hx(look.frame, 0x1d1d1d);
  const blade = typeof look.blade === 'number' ? look.blade : hx(look.blade, 0x2a2a2a);
  const noctua = frame === 0xd8c7a7;
  const pads = noctua ? 0x6a4a3a : C.rubber, k = look.seed || 0;
  R.box(u0, u1, v0, v1, z0, z1, (f, x, y, W, H) => {
    if (f !== face) {
      if (look.rgb && f !== 'top' && y > H / 2 - 0.12 && y < H / 2 + 0.12) return led(o, look.key, k);
      const a = f === 'top' ? x : x;
      if (a < 0.3 || a > W - 0.3) return pads;
      return y < 0.04 ? shade(frame, 1.3) : ((a * 2) % 1) < 0.05 ? shade(frame, 0.8) : frame;
    }
    const X = face === 'right' ? W - x : x;
    return fan(X, y, W / 2, H / 2, Math.min(W, H) / 2 - 0.25, {
      spin: o.spin || 0, frame, blade, hub: noctua ? 0xd8c7a7 : shade(frame, 1.2), blades: noctua ? 9 : 9,
      ring: look.rgb ? led(o, look.key, k) : -1,
    });
  }, id);
}

export function drawFans(R, p, o) {
  const s = FAN_SLOTS.top1, L = p.look || {};
  const size = (p.size || 120) / 25, face = o.face || 'left';
  const at = o.at || [s.u0, s.v0, G.case.z1 + 0.1];
  const step = o.step || (face === 'left' ? [size + 0.8, 0, 0] : face === 'right' ? [0, size + 0.8, 0] : [size + 0.8, 0, 0]);
  const n = Math.max(1, Math.min(6, p.count || 1));
  for (let i = 0; i < n; i++) {
    const u = at[0] + step[0] * i, v = at[1] + step[1] * i, z = at[2] + step[2] * i;
    const box = face === 'left' ? [u, u + size, v, v + 1, z, z + size] : face === 'right' ? [u, u + 1, v, v + size, z, z + size] : [u, u + size, v, v + size, z, z + 1];
    drawFanBox(R, ...box, face, { frame: L.frame, blade: L.blade, rgb: p.rgb, key: 'fans', seed: 49 + i }, o, o.id);
  }
}

// =====================================================================================
// Skruvar
// =====================================================================================
// Tomt skruvhål (syns tills skruven sitter i): blank ring + mörkt gängat hål
function holeTex(x, y, cx, cy, r, ring) {
  const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
  if (d2 > r * r) return -1;
  if (d2 > r * r * 0.38) return dx + dy < 0 ? shade(ring, 1.25) : ring;
  if (d2 < r * r * 0.04) return 0x050505;
  const d = Math.sqrt(d2);
  return ((Math.atan2(dy, dx) * 2 + d * 20) % 1.2 < 0.4) ? 0x2a2a2e : 0x121214;
}
export function drawScrewHoles(R, key, done, id) {
  const ring = key === 'mb' || key === 'm2' ? C.brass : 0xd6dade;
  for (const [i, [u, v, z]] of SCREWS[key].entries()) {
    if (done.has(i)) continue;
    if (key === 'gpu' || key === 'psu') {
      R.box(u - 0.02, u + 0.04, v - 0.3, v + 0.3, z - 0.3, z + 0.3, (f, x, y, W, H) => f === 'right' ? holeTex(x, y, W / 2, H / 2, 0.3, ring) : -1, id, NOE);
    } else {
      const lift = key === 'm2' ? 0.08 : 0.01;
      R.box(u - 0.3, u + 0.3, v - 0.3, v + 0.3, z + lift, z + lift + 0.02, (f, x, y, W, H) => f === 'top' ? holeTex(x, y, W / 2, H / 2, 0.3, ring) : -1, id, NOE);
    }
  }
}

export function drawScrews(R, key, done, id) {
  for (const [i, [u, v, z]] of SCREWS[key].entries()) {
    if (typeof done === 'number' ? i >= done : !done.has(i)) continue;
    if (key === 'gpu' || key === 'psu') {
      R.box(u - 0.02, u + 0.12, v - 0.28, v + 0.28, z - 0.28, z + 0.28, (f, x, y, W, H) => {
        if (f !== 'right') return f === 'top' ? 0xdfe3e7 : C.steelDark;
        const c = screwHead(x, y, W / 2, H / 2, 0.27);
        return c < 0 ? C.steelDark : c;
      }, id);
    } else {
      R.box(u - 0.28, u + 0.28, v - 0.28, v + 0.28, z, z + 0.14, (f, x, y, W, H) => {
        if (f !== 'top') return y < 0.03 ? 0xdfe3e7 : C.steelDark;
        return screwHead(x, y, W / 2, H / 2, 0.28);
      }, id);
    }
  }
}
