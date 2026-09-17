// Kompatibilitetsregler för alla epoker (1983–2026). Används både när kunder
// beställer (generatorn) och när man bygger (layout.canPlace/bootCheck).
import { BOARD_FORMS } from './parts/canon.js';

export const profileOf = (form) => BOARD_FORMS[form]?.profile || 'ATX';

export function cpuFitsMb(cpu, mb) {
  return cpu.socket === mb.socket || (cpu.fits || []).includes(mb.socket);
}
export const ramFitsMb = (ram, mb) => ram.type === mb.ram;
export const caseFitsMb = (cs, mb) => (cs.forms || cs.fits || []).includes(mb.form);
export function coolerFitsCpu(cooler, cpu) {
  return (cooler.sockets || []).some((s) => s === cpu.socket || (cpu.fits || []).includes(s)) && cooler.maxW >= cpu.watt;
}

// Instickskort: vilka slottyper passar kortet (8-bit ISA går i 16-bit ISA, osv.)
const CARD_SLOTS = { ISA8: ['isa8', 'isa16'], ISA16: ['isa16'], VLB: ['vlb'], PCI: ['pci'], AGP: ['agp'], PCIe: ['pcie'] };
// Räkna ut om en lista kort (bussar) får plats på kortet
export function cardsFit(buses, mb) {
  const free = { ...mb.slots };
  // VLB-kort använder VLB-slot (som sitter i linje med en ISA16)
  const order = [...buses].sort((a, b) => CARD_SLOTS[a].length - CARD_SLOTS[b].length);
  for (const bus of order) {
    const slot = (CARD_SLOTS[bus] || []).find((s) => free[s] > 0);
    if (!slot) return false;
    free[slot]--;
  }
  return true;
}
export const cardFitsMb = (card, mb, others = []) => cardsFit([...others, card.bus], mb);

// Lagring/enheter: kräver gränssnitt på kortet, annars ett instickskort (kontroller) i en ISA-slot
export function storageNeedsCard(st, mb) {
  if (st.iface === 'MFM') return 'ISA8';
  if (st.iface === 'IDE' && !mb.storage.includes('IDE')) return 'ISA16';
  return null;
}
export function storageFitsMb(st, mb) {
  if (st.iface === 'MFM') return true;
  if (st.iface === 'IDE') return mb.storage.includes('IDE') || (mb.slots.isa16 > 0 && profileOf(mb.form) === 'AT');
  return mb.storage.includes(st.iface);
}
export function mediaNeedsCard(md, mb) {
  if (md.iface === 'floppy' && !mb.floppy) return 'ISA8';
  if (md.iface === 'IDE' && !mb.storage.includes('IDE')) return 'ISA16';
  return null;
}
export function mediaFitsMb(md, mb) {
  if (md.iface === 'floppy') return mb.floppy || profileOf(mb.form) === 'AT';
  if (md.iface === 'IDE') return mb.storage.includes('IDE') || (mb.slots.isa16 > 0 && profileOf(mb.form) === 'AT');
  return mb.storage.includes(md.iface);
}

// Nätagg mot kort + delar
export function psuFits(psu, mb, cpu, gpu) {
  const at = profileOf(mb.form) === 'AT';
  if (at !== (psu.form === 'AT')) return { ok: false, why: at ? 'AT-kortet behöver ett AT-nätagg (P8/P9)' : 'ATX-kortet behöver ett ATX-nätagg' };
  if (!at) {
    if (mb.power === 'ATX24' && psu.main !== 'ATX24') return { ok: false, why: 'kortet behöver 24-pin ATX-ström' };
    if (mb.cpuPower === 'EPS8' && psu.cpu !== 'EPS8') return { ok: false, why: 'kortet behöver 8-pin CPU-ström (EPS)' };
    if (mb.cpuPower === 'ATX12V4' && !psu.cpu) return { ok: false, why: 'kortet behöver 4-pin ATX12V-ström' };
  }
  if (gpu) {
    const p8 = psu.pcie.filter((x) => x === 'pcie8').length;
    const need = { molex: psu.molex > 0, pcie6: psu.pcie.length > 0, pcie8: p8 >= 1, '2xpcie8': p8 >= 2, '3xpcie8': p8 >= 3, '12vhpwr': psu.v12vhpwr || p8 >= 3 }[gpu.pwr];
    if (gpu.pwr && !need) return { ok: false, why: `grafikkortet behöver ${gpu.pwr === '12vhpwr' ? '12V-2x6-kontakt' : gpu.pwr}` };
  }
  return { ok: true };
}
export function wattNeed(cpu, gpu, extra = 0, year = 2020) {
  const base = year < 1995 ? 40 : year < 2005 ? 90 : 150;
  return Math.round((cpu?.watt || 0) + (gpu?.watt || 0) + base + extra);
}

// Behöver datorn ett separat grafikkort?
export const needsGpu = (mb, cpu) => !(mb.video || cpu.igpu);
