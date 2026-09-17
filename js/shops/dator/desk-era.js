// Skrivbordet efter epok: vilken skärm, vilket tangentbord och vilken mus kunden
// har, vilket operativsystem som startar och vilka uttag datorns baksida har.
// Baksidan ritas i en 90×160-pixelsbild (x,y,w,h nedan är i den bilden).
import { needsGpu } from './compat.js';

const VIDEO_PREF = (y) => y >= 2012 ? ['HDMI', 'DP', 'DVI', 'VGA'] : y >= 2004 ? ['DVI', 'VGA', 'HDMI', 'DP'] : y >= 1987 ? ['VGA', 'DVI', 'DE9'] : ['DE9', 'VGA'];
export const mbVideoOuts = (mb) => !mb.video ? [] : (mb.year || 2020) >= 2014 ? ['HDMI', 'DP'] : mb.year >= 2008 ? ['VGA', 'DVI', 'HDMI'] : ['VGA'];
const TYPE = { HDMI: 'hdmi', DP: 'dp', DVI: 'dvi', VGA: 'vga', DE9: 'de9' };

export function deskEra(rig, placed) {
  const y = rig.year, mb = placed.mb || rig.mb, gpu = placed.gpu, cpu = placed.cpu || {};
  const at = rig.profile === 'AT';
  const useGpu = !!gpu;
  const outs = useGpu ? (gpu.out?.length ? gpu.out : ['VGA']) : (mbVideoOuts(mb).length ? mbVideoOuts(mb) : cpu.igpu ? ['HDMI', 'DP'] : ['VGA']);
  const video = VIDEO_PREF(y).find((o) => outs.includes(o)) || outs[0];
  const std = gpu?.std || '';
  const monitor = video === 'DE9' ? (std === 'MDA' || std === 'HGC' ? 'mono' : std === 'EGA' ? 'ega' : 'cga')
    : y < 1997 ? 'crt14' : y < 2004 ? 'crt17' : y < 2009 ? 'lcd43' : y < 2020 ? 'lcd169' : 'lcd-slim';
  const kb = at ? 'din5' : (mb.year || y) < 2005 ? 'ps2k' : 'usb';
  const mouse = y < 1990 ? null : at ? 'serial' : (mb.year || y) < 2005 ? 'ps2m' : 'usb';
  const os = y < 1991 ? 'dos' : y < 1995 ? (rig.order.template === 'doom' ? 'dos' : 'win31') : y < 1998 ? 'win95' : y < 2001 ? 'win98'
    : y < 2007 ? 'xp' : y < 2009 ? 'vista' : y < 2015 ? 'win7' : y < 2021 ? 'win10' : 'win11';
  const keyboard = at ? (y < 1986 ? 'pc-83' : 'model-m') : y < 2004 ? 'beige-104' : rig.order.template === 'kontor' || rig.order.template === 'kontor2000' ? 'black-104' : y >= 2014 ? 'rgb-mech' : 'black-104';
  const office = ['kontor', 'kontor2000', 'skola', 'htpc', 'internet'].includes(rig.order.template);
  const mouseKind = !mouse ? null : y < 1998 ? 'ball-beige' : y < 2004 ? 'ball-grey' : y < 2014 || office ? 'optical' : 'gaming';
  return { year: y, at, video, videoType: TYPE[video] || 'vga', videoOnGpu: useGpu, monitor, kb, mouse, os, keyboard, mouseKind, needsGpu: needsGpu(mb, cpu) };
}

// Kontakterna man kopplar in på skrivbordet
export function plugsFor(era) {
  const VNAME = { hdmi: 'Skärmkabel (HDMI)', dp: 'Skärmkabel (DisplayPort)', dvi: 'Skärmkabel (DVI)', vga: 'Skärmkabel (VGA)', de9: 'Skärmkabel (9-pin)' };
  const P = {
    pc_power: { type: 'c13', name: 'Strömkabel till datorn', sub: 'C13 · 230 V', target: 'rear' },
    mon_power: { type: 'mains', name: 'Skärmens strömkabel', sub: 'till grenuttaget', target: 'strip' },
    video: { type: era.videoType, name: VNAME[era.videoType], sub: 'skärm → datorn', target: 'rear' },
    kb: { type: era.kb, name: 'Tangentbord', sub: { din5: 'stor DIN-kontakt', ps2k: 'PS/2 (lila)', usb: 'USB-A' }[era.kb], target: 'rear' },
  };
  if (era.mouse) P.mouse = { type: era.mouse, name: 'Mus', sub: { serial: 'serieport (9-pin)', ps2m: 'PS/2 (grön)', usb: 'USB-A' }[era.mouse], target: 'rear' };
  return P;
}

// Uttag på baksidan. owner: 'mb' | 'gpu' | 'psu' | 'snd' | 'io'
export function rearPorts(b, era, rig) {
  const p = b.placed, ports = [];
  const add = (key, type, owner, x, y, w, h, label) => ports.push({ key, type, owner, x, y, w, h, label });
  const mb = p.mb || rig.mb;
  const gpuOuts = (g) => (g?.out?.length ? g.out : ['VGA']);
  const gpuPorts = (x0, y0, max) => {
    gpuOuts(p.gpu).slice(0, max).forEach((o, i) => {
      const t = TYPE[o] || 'vga', w = t === 'hdmi' ? 13 : t === 'dp' ? 10 : t === 'dvi' ? 18 : 16;
      add('VID_GPU_' + o, t, 'gpu', x0 + ports.filter((q) => q.owner === 'gpu').reduce((s, q) => s + q.w + 3, 0), y0, w, 6, `${o === 'DE9' ? '9-pin' : o} (grafikkortet)`);
    });
  };
  const modern = rig.geo.kind === 'modern';
  if (modern) {
    // I/O-sköld uppe, kortplatser, nätagget i botten
    const usb = [[11, 14], [22, 14], [11, 22], [22, 22]];
    usb.forEach(([x, y], i) => add('USB_' + (i + 1), 'usb', 'mb', x, y, 9, 5, 'USB'));
    mbVideoOuts(mb).forEach((o, i) => add('VID_MB_' + o, TYPE[o], 'mb', 10 + i * 14, 31, o === 'DVI' ? 13 : o === 'DP' ? 10 : 13, 6, `${o} (moderkortet)`));
    if (!mb.video && p.cpu?.igpu) { add('VID_MB_HDMI', 'hdmi', 'mb', 10, 31, 13, 6, 'HDMI (moderkortet)'); add('VID_MB_DP', 'dp', 'mb', 25, 31, 10, 6, 'DisplayPort (moderkortet)'); }
    if ((mb.year || 2020) < 2012) { add('KB', 'ps2k', 'mb', 25, 42, 9, 7, 'PS/2 tangentbord'); }
    add('LAN', 'lan', 'mb', 11, 42, 10, 9, 'Nätverk');
    if (p.gpu) gpuPorts(12, 88, 4);
    add('PSU_IN', 'c13', 'psu', 10, 131, 15, 13, 'Ström in');
    return ports;
  }
  // classic: nätagget uppe, I/O i mitten, kortplatser under
  add('PSU_IN', 'c13', 'psu', 10, 12, 15, 13, 'Ström in');
  if (era.at) {
    add('KB', 'din5', 'mb', 10, 46, 11, 11, 'Tangentbord (DIN)');
    add('COM1', 'serial', 'io', 28, 46, 14, 7, 'COM1 (serieport)');
    add('LPT1', 'parallel', 'io', 46, 46, 26, 7, 'LPT1 (skrivare)');
  } else {
    add('KB', 'ps2k', 'mb', 10, 46, 8, 8, 'PS/2 tangentbord (lila)');
    add('MOUSE', 'ps2m', 'mb', 10, 56, 8, 8, 'PS/2 mus (grön)');
    if ((mb.year || 1998) >= 1998) { add('USB_1', 'usb', 'mb', 21, 47, 9, 5, 'USB'); add('USB_2', 'usb', 'mb', 21, 55, 9, 5, 'USB'); }
    add('COM1', 'serial', 'mb', 10, 67, 14, 7, 'COM1 (serieport)');
    add('LPT1', 'parallel', 'mb', 10, 77, 26, 7, 'LPT1 (skrivare)');
    mbVideoOuts(mb).forEach((o, i) => add('VID_MB_' + o, TYPE[o], 'mb', 28 + i * 18, 67, 16, 6, `${o} (moderkortet)`));
    if ((mb.year || 1998) >= 2001) add('LAN', 'lan', 'mb', 38, 77, 10, 9, 'Nätverk');
  }
  // kortplatser: rad i = G.rows[i]
  const rows = rig.geo.rows;
  const rowY = (v) => 100 + rows.indexOf(v) * 8;
  if (p.gpu) gpuPorts(12, rowY(rig.rowOf('gpu').v), 3);
  if (p.snd) {
    const y0 = rowY(rig.rowOf('snd').v);
    add('SND_OUT', 'jack', 'snd', 12, y0, 6, 5, 'Högtalare (ljudkortet)');
    add('SND_GAME', 'gameport', 'snd', 32, y0, 22, 6, 'Spelport (joystick)');
  }
  return ports;
}
