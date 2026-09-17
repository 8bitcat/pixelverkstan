// CPU-kylare 1993–2026 – boxade original­kylare från Intel/AMD och riktiga
// eftermarknadskylare (Thermalloy, PC Power & Cooling, Globalwin, Alpha, Swiftech,
// Thermaltake, Thermalright, Zalman, Arctic, Scythe, Cooler Master, Noctua,
// be quiet!, DeepCool, Corsair, NZXT, Lian Li, EK, ASUS, MSI, Fractal m.fl.).
// Rad: [namn, år, sista säljår, pris USD, segment, maxW, monteringsfamiljer, look.type, palett, extra?]
// Socklar räknas fram ur monteringsfamiljerna och filtreras till socklar som
// fanns under kylarens säljår.
import { SOCKETS, SEK_PER_USD } from './canon.js';

const P = [];
const slug = (s) => s.toLowerCase().replace(/!/g, '').replace(/\+/g, 'plus').replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
const rnd = (v) => (v < 1000 ? Math.max(10, Math.round(v / 5) * 5) : Math.round(v / 10) * 10);
const sek = (usd, y) => rnd(usd * SEK_PER_USD[y] * 1.25);

// Monteringsfamiljer (kylare med samma fästen passar alla socklar i familjen)
const FAM = {
  s486: ['S486'],
  s4: ['Socket4'],
  s57: ['Socket5', 'Socket7'],
  s8: ['Socket8'],
  slot1: ['Slot1'],
  slota: ['SlotA'],
  s370: ['Socket370'],
  sA: ['SocketA'],
  p423: ['Socket423'],
  p478: ['Socket478'],
  k8: ['Socket754', 'Socket939', 'AM2', 'AM3', 'AM3plus', 'FM1', 'FM2'],
  am4: ['AM4', 'AM5'],
  l775: ['LGA775'],
  l1366: ['LGA1366'],
  l115x: ['LGA1156', 'LGA1155', 'LGA1150', 'LGA1151', 'LGA1151v2', 'LGA1200'],
  l2011: ['LGA2011', 'LGA2011v3', 'LGA2066'],
  l1700: ['LGA1700', 'LGA1851'],
  tr: ['TR4', 'sTRX4'],
};
// Moderna universalfästen
const MODERN = 'l115x l2011 am4 l1700';

// Färgpaletter: [fläktram, fläktblad, flänsar]
const PAL = {
  passive: ['#6b7076', '#6b7076', '#b8bcc0'],
  beige: ['#2a2a2a', '#3a3a3a', '#b8bcc0'],
  blk: ['#1a1a1a', '#2a2a2a', '#c8ccd0'],
  allblk: ['#1a1a1a', '#2a2a2a', '#2e2f33'],
  cu: ['#2a2a2a', '#3a3a3a', '#c87533'],
  gold: ['#1a1a1a', '#2a2a2a', '#d4a84a'],
  clear: ['#dfe6ee', '#3a8fd8', '#c8ccd0'],
  zal: ['#1f3a8a', '#3b82f6', '#c87533'],
  zalalu: ['#1f3a8a', '#3b82f6', '#c8ccd0'],
  noc: ['#d8c7a7', '#8a4b34', '#c8ccd0'],
  chromax: ['#1a1a1a', '#1f1f1f', '#2e2f33'],
  redux: ['#5d6166', '#8a8f94', '#c8ccd0'],
  arctic: ['#1d1d1d', '#d8d8d8', '#c8ccd0'],
  arcticaio: ['#1d1d1d', '#e6e6e6', '#2a2a2a'],
  bq: ['#1b1b1b', '#2a2a2a', '#1f2023'],
  white: ['#e9e9e6', '#f5f5f5', '#e9e9e6'],
  red: ['#1a1a1a', '#c9323a', '#c8ccd0'],
  blue: ['#1a1a1a', '#3a8fd8', '#c8ccd0'],
  orange: ['#1a1a1a', '#e07a2e', '#c8ccd0'],
  intel: ['#1a1a1a', '#2a2a2a', '#b8bcc0'],
  intelcu: ['#1a1a1a', '#2a2a2a', '#c87533'],
  amd: ['#1a1a1a', '#2a2a2a', '#9aa0a6'],
  hyper: ['#1a1a1a', '#2a2a2a', '#2e2f33'],
};

function K(brand, rows) {
  for (const r of rows) {
    const [name, year, until, usd, tier, maxW, fams, type, pal, x = {}] = r;
    const u = Math.max(year, Math.min(2026, until));
    const all = [...new Set(fams.split(' ').flatMap((f) => FAM[f] || []))];
    const sockets = all.filter((s) => SOCKETS[s].years[0] <= u && year <= SOCKETS[s].years[1]);
    const [fan, blade, fin] = x.colors ?? PAL[pal];
    const look = { type, fan, blade, fin };
    if (x.screen) look.screen = true;
    P.push({
      id: x.id ?? 'cooler-' + slug(name),
      cat: 'cooler', name, brand, year, until: u, cost: x.cost ?? sek(usd, year), tier, rgb: !!x.rgb,
      sockets, maxW, look,
    });
  }
}

// ---------------------------------------------------------------------------
// Boxade originalkylare – Intel
// ---------------------------------------------------------------------------
K('Intel', [
  ['Intel boxed-kylare i486DX2/DX4 (passiv)', 1993, 1997, 8, 2, 8, 's486', 'heatsink', 'passive'],
  ['Intel boxed-kylare Pentium 60/66', 1993, 1995, 20, 3, 20, 's4', 'heatsink-fan', 'intel'],
  ['Intel boxed-kylare Pentium (Socket 5/7)', 1995, 1998, 20, 3, 20, 's57', 'heatsink-fan', 'intel'],
  ['Intel boxed-kylare Pentium MMX', 1997, 1999, 20, 3, 25, 's57', 'heatsink-fan', 'intel'],
  ['Intel boxed-kylare Pentium Pro', 1995, 1998, 25, 4, 40, 's8', 'heatsink-fan', 'intel'],
  ['Intel boxed-kylare Pentium II (SECC)', 1997, 2000, 25, 4, 45, 'slot1', 'heatsink-fan', 'intel'],
  ['Intel boxed-kylare Pentium III (SECC2)', 1999, 2001, 25, 4, 45, 'slot1', 'heatsink-fan', 'intel'],
  ['Intel boxed-kylare Celeron (PPGA)', 1998, 2001, 15, 2, 35, 's370', 'heatsink-fan', 'intel'],
  ['Intel boxed-kylare Pentium III (FC-PGA)', 2000, 2003, 20, 3, 40, 's370', 'heatsink-fan', 'intel'],
  ['Intel boxed-kylare Pentium 4 (Socket 423)', 2000, 2002, 20, 3, 75, 'p423', 'heatsink-fan', 'intel'],
  ['Intel boxed-kylare Pentium 4 (Socket 478)', 2001, 2006, 20, 3, 90, 'p478', 'heatsink-fan', 'intel'],
  ['Intel boxed-kylare Pentium 4 Prescott (kopparkärna)', 2004, 2006, 25, 3, 105, 'p478', 'heatsink-fan', 'intelcu'],
  ['Intel boxed-kylare LGA775 (aluminium)', 2004, 2011, 15, 2, 84, 'l775', 'heatsink-fan', 'intel'],
  ['Intel boxed-kylare LGA775 (kopparkärna)', 2005, 2011, 20, 3, 130, 'l775', 'heatsink-fan', 'intelcu'],
  ['Intel boxed-kylare Core i7 (LGA1366)', 2008, 2012, 20, 3, 130, 'l1366', 'heatsink-fan', 'intelcu'],
  ['Intel boxed-kylare E97379 (LGA115x)', 2009, 2017, 15, 2, 95, 'l115x', 'heatsink-fan', 'intel'],
  ['Intel boxed-kylare LGA115x (kopparkärna)', 2009, 2014, 20, 2, 95, 'l115x', 'heatsink-fan', 'intelcu'],
  ['Intel Thermal Solution BXTS13A', 2011, 2014, 35, 4, 130, 'l2011', 'tower', 'blk'],
  ['Intel Thermal Solution BXTS15A', 2011, 2014, 40, 4, 150, 'l2011', 'tower', 'blue'],
  ['Intel Liquid Cooling RTS2011LC', 2011, 2014, 80, 5, 150, 'l2011', 'aio', 'allblk'],
  ['Intel Liquid Cooling BXTS13X', 2013, 2016, 90, 5, 150, 'l115x l1366 l2011', 'aio', 'allblk'],
  ['Intel boxed-kylare Skylake/Coffee Lake', 2015, 2020, 10, 1, 65, 'l115x', 'heatsink-fan', 'intel'],
  ['Intel boxed-kylare Comet Lake', 2020, 2023, 10, 1, 65, 'l115x', 'heatsink-fan', 'intel'],
  ['Intel Laminar RS1', 2022, 2026, 10, 1, 65, 'l1700', 'heatsink-fan', 'intel'],
  ['Intel Laminar RM1', 2022, 2026, 15, 2, 95, 'l1700', 'heatsink-fan', 'blue'],
  ['Intel Laminar RH1', 2022, 2024, 25, 3, 125, 'l1700', 'low', 'allblk'],
]);

// ---------------------------------------------------------------------------
// Boxade originalkylare – AMD
// ---------------------------------------------------------------------------
K('AMD', [
  ['AMD boxed-kylare K6/K6-2', 1997, 2001, 15, 2, 30, 's57', 'heatsink-fan', 'amd'],
  ['AMD boxed-kylare Athlon (Slot A)', 1999, 2001, 25, 4, 70, 'slota', 'heatsink-fan', 'amd'],
  ['AMD boxed-kylare Athlon/Duron (Socket A)', 2000, 2004, 20, 3, 70, 'sA', 'heatsink-fan', 'amd'],
  ['AMD boxed-kylare Athlon XP (kopparkärna)', 2002, 2006, 25, 3, 80, 'sA', 'heatsink-fan', 'cu'],
  ['AMD boxed-kylare Athlon 64/Sempron', 2003, 2008, 15, 2, 89, 'k8', 'heatsink-fan', 'amd'],
  ['AMD boxed-kylare Athlon 64 (heatpipe)', 2004, 2007, 20, 3, 110, 'k8', 'low', 'cu'],
  ['AMD boxed-kylare Phenom (kopparkärna)', 2007, 2011, 20, 3, 125, 'k8', 'heatsink-fan', 'cu'],
  ['AMD boxed-kylare Athlon II/Phenom II', 2009, 2013, 15, 2, 95, 'k8', 'heatsink-fan', 'amd'],
  ['AMD boxed-kylare Phenom II X6 (heatpipe)', 2010, 2013, 20, 3, 125, 'k8', 'low', 'cu'],
  ['AMD boxed-kylare A-serien APU', 2011, 2016, 15, 2, 100, 'k8', 'heatsink-fan', 'amd'],
  ['AMD boxed-kylare FX (heatpipe)', 2011, 2016, 20, 3, 125, 'k8', 'low', 'cu'],
  ['AMD Liquid Cooling System (Asetek)', 2011, 2016, 100, 5, 220, 'k8', 'aio', 'allblk'],
  ['AMD Wraith Cooler', 2015, 2017, 30, 3, 125, 'k8', 'heatsink-fan', 'allblk'],
  ['AMD Wraith Stealth', 2017, 2026, 15, 1, 65, 'am4', 'heatsink-fan', 'allblk'],
  ['AMD Wraith Spire', 2017, 2023, 20, 2, 95, 'am4', 'heatsink-fan', 'allblk'],
  ['AMD Wraith Spire RGB', 2018, 2021, 25, 2, 95, 'am4', 'heatsink-fan', 'allblk', { rgb: true }],
  ['AMD Wraith Max', 2017, 2020, 45, 3, 140, 'am4 k8', 'low', 'allblk', { rgb: true }],
  ['AMD Wraith Prism', 2019, 2026, 35, 3, 105, 'am4', 'low', 'allblk', { rgb: true }],
]);

// ---------------------------------------------------------------------------
// 1990-talet och tidigt 2000-tal – eftermarknad
// ---------------------------------------------------------------------------
K('PC Power & Cooling', [
  ['PC Power & Cooling Cooler Guy 486', 1993, 1996, 25, 3, 10, 's486', 'heatsink-fan', 'beige'],
  ['PC Power & Cooling Cooler Guy Pentium', 1994, 1997, 30, 4, 25, 's4 s57', 'heatsink-fan', 'beige'],
]);
K('Thermalloy', [
  ['Thermalloy passiv kylfläns 486', 1993, 1997, 8, 1, 8, 's486', 'heatsink', 'passive'],
  ['Thermalloy kylfläns med fläkt Pentium', 1994, 1998, 15, 2, 22, 's4 s57', 'heatsink-fan', 'beige'],
  ['Thermalloy kylfläns Pentium Pro', 1995, 1998, 20, 3, 40, 's8', 'heatsink', 'passive'],
]);
K('Aavid Thermal Technologies', [
  ['Aavid kylfläns med fläkt 486DX4', 1994, 1997, 12, 2, 10, 's486', 'heatsink-fan', 'beige'],
  ['Aavid kylfläns med fläkt Pentium MMX', 1996, 1999, 15, 2, 30, 's57', 'heatsink-fan', 'beige'],
  ['Aavid kylfläns med fläkt Pentium Pro', 1996, 1998, 25, 4, 45, 's8', 'heatsink-fan', 'beige'],
]);
K('Globalwin', [
  ['Globalwin VOS32', 1999, 2001, 30, 4, 60, 'slot1 slota', 'heatsink-fan', 'blk'],
  ['Globalwin FOP32', 2000, 2003, 25, 4, 75, 's370 sA', 'heatsink-fan', 'blk'],
  ['Globalwin FOP38', 2001, 2003, 30, 4, 90, 's370 sA', 'heatsink-fan', 'blk'],
  ['Globalwin CAK38', 2001, 2003, 35, 5, 95, 'sA', 'heatsink-fan', 'cu'],
]);
K('Alpha', [
  ['Alpha PAL6035', 1999, 2002, 45, 5, 45, 's57 s370', 'heatsink-fan', 'blk'],
  ['Alpha PAL8045', 2000, 2003, 60, 5, 90, 's370 sA', 'heatsink-fan', 'blk'],
  ['Alpha PAL8150', 2001, 2003, 60, 5, 95, 'sA', 'heatsink-fan', 'blk'],
  ['Alpha PAL8942', 2002, 2005, 60, 5, 100, 'p478', 'heatsink-fan', 'blk'],
]);
K('Swiftech', [
  ['Swiftech MC370-0', 1999, 2001, 60, 5, 50, 's370 s57', 'heatsink-fan', 'blk'],
  ['Swiftech MC462-A', 2000, 2003, 60, 5, 90, 'sA', 'heatsink-fan', 'blk'],
  ['Swiftech MCX462-V', 2002, 2004, 70, 5, 105, 'sA', 'heatsink-fan', 'cu'],
]);
K('Thermaltake', [
  ['Thermaltake Golden Orb', 1999, 2002, 25, 4, 65, 's57 s370 sA', 'heatsink-fan', 'gold'],
  ['Thermaltake Dragon Orb 3', 2001, 2003, 35, 4, 80, 's370 sA', 'heatsink-fan', 'cu'],
  ['Thermaltake Volcano 6Cu', 2001, 2002, 30, 4, 70, 's370 sA', 'heatsink-fan', 'cu'],
  ['Thermaltake Volcano 7+', 2001, 2003, 40, 4, 85, 's370 sA', 'heatsink-fan', 'clear'],
  ['Thermaltake Volcano 9', 2002, 2004, 40, 4, 90, 'sA p478', 'heatsink-fan', 'clear'],
  ['Thermaltake Volcano 11', 2003, 2005, 45, 5, 110, 'sA p478', 'heatsink-fan', 'clear'],
  ['Thermaltake Silent Boost K8', 2004, 2007, 35, 4, 110, 'k8', 'low', 'blue'],
  ['Thermaltake Sonic Tower', 2005, 2007, 45, 4, 100, 'p478 l775 k8', 'tower', 'passive'],
  ['Thermaltake Big Typhoon', 2005, 2008, 50, 5, 130, 'p478 l775 k8', 'low', 'blk'],
  ['Thermaltake SpinQ', 2007, 2009, 45, 4, 110, 'l775 k8', 'low', 'blue'],
  ['Thermaltake Frio', 2010, 2013, 60, 5, 220, 'l775 l1366 l115x k8', 'tower', 'orange'],
  ['Thermaltake Frio Extreme', 2011, 2014, 80, 5, 250, 'l1366 l115x l2011 k8', 'tower', 'orange'],
  ['Thermaltake Water 3.0 Performer', 2014, 2017, 80, 4, 200, 'l115x l2011 k8 am4', 'aio', 'allblk'],
  ['Thermaltake Contac Silent 12', 2018, 2022, 30, 2, 150, 'l115x am4 l1700', 'tower', 'blk'],
  ['Thermaltake UX100 ARGB', 2020, 2024, 25, 2, 95, 'l115x am4 l1700', 'low', 'allblk', { rgb: true }],
  ['Thermaltake TH360 ARGB Sync', 2020, 2024, 110, 4, 280, MODERN, 'aio', 'allblk', { rgb: true }],
  ['Thermaltake Floe DX RGB 360 TT Premium Edition', 2021, 2024, 180, 5, 300, MODERN, 'aio', 'allblk', { rgb: true }],
]);
K('Evercool', [
  ['Evercool kylare med fläkt 486', 1993, 1997, 10, 1, 8, 's486', 'heatsink-fan', 'beige'],
  ['Evercool kylare med fläkt Pentium', 1995, 1999, 12, 1, 25, 's57', 'heatsink-fan', 'beige'],
  ['Evercool kylare med fläkt Slot 1', 1998, 2001, 20, 2, 45, 'slot1', 'heatsink-fan', 'beige'],
  ['Evercool kylare med fläkt Socket 370', 1999, 2003, 12, 1, 40, 's370', 'heatsink-fan', 'blk'],
  ['Evercool kopparkylare Socket A', 2002, 2006, 18, 2, 85, 'sA', 'heatsink-fan', 'cu'],
  ['Evercool kylare med fläkt Socket 478', 2002, 2006, 15, 1, 90, 'p478', 'heatsink-fan', 'blk'],
  ['Evercool Transformer 4', 2009, 2013, 30, 3, 150, 'l775 l1366 l115x k8', 'tower', 'blk'],
]);
K('Cooler Master', [
  ['Cooler Master kylare med fläkt Pentium MMX', 1997, 2000, 15, 2, 30, 's57', 'heatsink-fan', 'blk'],
  ['Cooler Master kylare med fläkt Slot 1/A', 1998, 2001, 25, 3, 60, 'slot1 slota', 'heatsink-fan', 'blk'],
  ['Cooler Master kylare med fläkt Socket 370/A', 1999, 2003, 20, 2, 70, 's370 sA', 'heatsink-fan', 'blk'],
  ['Cooler Master Aero 7', 2004, 2006, 30, 3, 90, 'sA p478 k8', 'heatsink-fan', 'blue'],
  ['Cooler Master Hyper 6', 2004, 2006, 50, 4, 110, 'p478 k8', 'tower', 'cu'],
  ['Cooler Master Hyper TX2', 2008, 2011, 25, 3, 130, 'l775 k8 l115x', 'tower', 'blk'],
  ['Cooler Master V8', 2008, 2012, 70, 5, 200, 'l775 k8 l1366 l115x', 'tower', 'red'],
  ['Cooler Master Hyper 212 Plus', 2009, 2012, 30, 3, 150, 'l775 k8 l1366 l115x', 'tower', 'blk'],
  ['Cooler Master Hyper N520', 2009, 2011, 40, 4, 150, 'l775 k8 l1366 l115x', 'tower', 'blk'],
  ['Cooler Master Hyper 212 EVO', 2011, 2019, 35, 3, 180, 'k8 l775 l1366 l115x l2011 am4', 'tower', 'blk'],
  ['Cooler Master Hyper TX3 EVO', 2011, 2016, 20, 2, 130, 'k8 l775 l115x', 'tower', 'blk'],
  ['Cooler Master Vortex Plus', 2011, 2014, 25, 2, 110, 'k8 l775 l115x', 'low', 'blk'],
  ['Cooler Master GeminII S524', 2011, 2015, 50, 4, 140, 'k8 l1366 l115x l2011', 'low', 'blk'],
  ['Cooler Master Hyper 103', 2012, 2016, 15, 1, 100, 'k8 l775 l115x', 'tower', 'blk'],
  ['Cooler Master Seidon 120V', 2012, 2016, 50, 3, 150, 'k8 l115x l2011', 'aio', 'allblk'],
  ['Cooler Master Hyper T4', 2013, 2017, 25, 2, 130, 'k8 l775 l115x', 'tower', 'blk'],
  ['Cooler Master Nepton 140XL', 2014, 2017, 110, 5, 250, 'k8 l115x l2011', 'aio', 'allblk'],
  ['Cooler Master MasterAir MA410M', 2017, 2020, 70, 4, 180, 'l115x l2011 am4', 'tower', 'allblk', { rgb: true }],
  ['Cooler Master MasterAir MA620P', 2017, 2021, 80, 4, 220, 'l115x l2011 am4', 'tower', 'allblk', { rgb: true }],
  ['Cooler Master Wraith Ripper', 2018, 2020, 99, 5, 250, 'tr', 'tower', 'allblk', { rgb: true }],
  ['Cooler Master MasterLiquid ML240L RGB', 2018, 2022, 70, 3, 220, 'l115x l2011 am4', 'aio', 'allblk', { rgb: true }],
  ['Cooler Master MasterLiquid ML360R RGB', 2018, 2022, 130, 5, 280, 'l115x l2011 am4', 'aio', 'allblk', { rgb: true }],
  ['Cooler Master Hyper 212 RGB Black Edition', 2019, 2024, 50, 2, 150, MODERN, 'tower', 'hyper', { id: 'hyper-212-rgb', rgb: true, colors: ['#1a1a1a', '#3a3a3a', '#2e2f33'] }],
  ['Cooler Master MasterLiquid ML240 Illusion', 2020, 2023, 100, 4, 240, MODERN, 'aio', 'allblk', { rgb: true }],
  ['Cooler Master Hyper 212 Black', 2022, 2026, 30, 2, 150, 'l115x am4 l1700', 'tower', 'hyper', { id: 'hyper-212' }],
  ['Cooler Master Hyper 212 Halo', 2023, 2026, 40, 3, 180, 'l115x am4 l1700', 'tower', 'allblk', { rgb: true }],
  ['Cooler Master MasterLiquid PL360 Flux', 2023, 2026, 150, 5, 300, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true }],
]);

// ---------------------------------------------------------------------------
// Entusiastkylare 2001–2026
// ---------------------------------------------------------------------------
K('Thermalright', [
  ['Thermalright SK-6', 2001, 2003, 45, 5, 100, 'sA', 'heatsink-fan', 'cu'],
  ['Thermalright SK-7', 2002, 2004, 45, 5, 110, 'sA', 'heatsink-fan', 'cu'],
  ['Thermalright SLK-800', 2002, 2004, 45, 5, 110, 'sA', 'heatsink-fan', 'cu'],
  ['Thermalright SLK-900A', 2003, 2005, 55, 5, 120, 'sA k8', 'heatsink-fan', 'cu'],
  ['Thermalright SP-97', 2003, 2005, 55, 5, 120, 'p478', 'heatsink-fan', 'cu'],
  ['Thermalright XP-90', 2004, 2007, 45, 5, 130, 'p478 l775 k8', 'low', 'blk'],
  ['Thermalright XP-120', 2004, 2007, 55, 5, 140, 'p478 l775 k8', 'low', 'blk'],
  ['Thermalright Ultra-120', 2006, 2008, 55, 5, 160, 'l775 k8', 'tower', 'blk'],
  ['Thermalright Ultra-120 Extreme', 2007, 2010, 65, 5, 180, 'l775 k8 l1366', 'tower', 'blk'],
  ['Thermalright IFX-14', 2008, 2010, 80, 5, 200, 'l775 k8 l1366', 'tower', 'blk'],
  ['Thermalright Archon', 2009, 2012, 70, 5, 200, 'l775 k8 l1366 l115x', 'tower', 'blk'],
  ['Thermalright Venomous X', 2010, 2012, 65, 5, 200, 'l775 k8 l1366 l115x', 'tower', 'blk'],
  ['Thermalright Silver Arrow', 2010, 2013, 85, 5, 250, 'k8 l1366 l115x l2011', 'tower', 'blk'],
  ['Thermalright HR-02 Macho', 2011, 2015, 50, 4, 200, 'k8 l1366 l115x l2011', 'tower', 'blk'],
  ['Thermalright True Spirit 120', 2011, 2016, 30, 2, 150, 'k8 l115x', 'tower', 'blk'],
  ['Thermalright Macho Rev.B', 2015, 2020, 60, 4, 220, 'k8 l115x l2011 am4', 'tower', 'blk'],
  ['Thermalright Le Grand Macho RT', 2016, 2020, 90, 5, 250, 'k8 l115x l2011 am4', 'tower', 'blk'],
  ['Thermalright Assassin King 120 SE', 2021, 2025, 25, 2, 180, 'l115x am4 l1700', 'tower', 'allblk'],
  ['Thermalright Assassin X 120 Refined SE', 2022, 2026, 18, 1, 200, 'l115x am4 l1700', 'tower', 'allblk'],
  ['Thermalright Peerless Assassin 120 SE', 2022, 2026, 35, 3, 250, 'l115x am4 l1700', 'tower', 'blk'],
  ['Thermalright AXP-90 X47', 2022, 2026, 25, 2, 130, 'l115x am4 l1700', 'low', 'blk'],
  ['Thermalright Phantom Spirit 120 SE', 2023, 2026, 38, 3, 260, 'l115x am4 l1700', 'tower', 'blk'],
  ['Thermalright Burst Assassin 120 SE ARGB', 2023, 2026, 25, 2, 200, 'l115x am4 l1700', 'tower', 'allblk', { rgb: true }],
  ['Thermalright Frost Commander 140', 2023, 2026, 55, 4, 280, 'l115x am4 l1700', 'tower', 'allblk'],
  ['Thermalright Frozen Warframe 360', 2023, 2026, 80, 4, 300, 'l115x am4 l1700', 'aio', 'white', { rgb: true }],
  ['Thermalright Phantom Spirit 120 EVO', 2024, 2026, 55, 4, 280, 'l115x am4 l1700', 'tower', 'allblk'],
  ['Thermalright Aqua Elite 360 V3', 2024, 2026, 55, 3, 290, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true }],
]);
K('Zalman', [
  ['Zalman CNPS6000-Cu', 2001, 2003, 45, 5, 90, 'sA p478', 'low', 'zal'],
  ['Zalman CNPS7000A-Cu', 2003, 2006, 50, 5, 120, 'sA p478 k8', 'low', 'zal'],
  ['Zalman CNPS7000B-AlCu LED', 2004, 2007, 40, 4, 110, 'sA p478 k8 l775', 'low', 'zalalu'],
  ['Zalman CNPS7700-Cu', 2004, 2007, 60, 5, 130, 'p478 k8 l775', 'low', 'zal'],
  ['Zalman CNPS9500 LED', 2005, 2008, 55, 5, 150, 'p478 k8 l775', 'tower', 'zal'],
  ['Zalman CNPS9700 LED', 2007, 2009, 65, 5, 170, 'k8 l775', 'tower', 'zal'],
  ['Zalman CNPS8700 LED', 2008, 2011, 50, 4, 130, 'k8 l775 l1366 l115x', 'low', 'zalalu'],
  ['Zalman CNPS9900 LED', 2008, 2011, 70, 5, 200, 'k8 l775 l1366 l115x', 'tower', 'zal'],
  ['Zalman CNPS10X Extreme', 2009, 2012, 75, 5, 220, 'k8 l775 l1366 l115x', 'tower', 'zalalu'],
  ['Zalman CNPS10X Optima', 2011, 2015, 35, 3, 160, 'k8 l775 l1366 l115x l2011', 'tower', 'zalalu'],
  ['Zalman CNPS9900 Max', 2012, 2015, 80, 5, 230, 'k8 l1366 l115x l2011', 'tower', 'zal'],
  ['Zalman CNPS20LQ', 2014, 2017, 70, 4, 200, 'k8 l115x l2011', 'aio', 'allblk'],
  ['Zalman CNPS9X Optima', 2015, 2021, 25, 2, 150, 'k8 l115x am4', 'tower', 'blk'],
  ['Zalman CNPS10X Performa', 2016, 2019, 35, 3, 180, 'k8 l115x l2011 am4', 'tower', 'blk'],
  ['Zalman Reserator 3 Max', 2019, 2021, 120, 4, 250, 'l115x l2011 am4', 'aio', 'allblk'],
  ['Zalman CNPS17X', 2020, 2023, 40, 3, 180, 'l115x l2011 am4', 'tower', 'blk'],
]);
K('Arctic', [
  ['Arctic Cooling Super Silent Pro', 2002, 2004, 25, 3, 80, 'sA p478', 'heatsink-fan', 'arctic'],
  ['Arctic Cooling Copper Silent 2L', 2003, 2005, 15, 2, 90, 'sA', 'heatsink-fan', 'cu'],
  ['Arctic Cooling Freezer 4', 2004, 2006, 25, 3, 110, 'p478', 'tower', 'arctic'],
  ['Arctic Cooling Freezer 64 Pro', 2005, 2011, 25, 3, 120, 'k8', 'tower', 'arctic'],
  ['Arctic Cooling Alpine 64 Pro', 2006, 2010, 12, 1, 90, 'k8', 'low', 'arctic'],
  ['Arctic Cooling Alpine 7 Pro', 2006, 2010, 12, 1, 90, 'l775', 'low', 'arctic'],
  ['Arctic Cooling Freezer 7 Pro', 2006, 2010, 25, 3, 130, 'l775', 'tower', 'arctic'],
  ['Arctic Cooling Freezer Xtreme', 2008, 2011, 45, 4, 160, 'l775 k8 l1366', 'tower', 'arctic'],
  ['Arctic Cooling Freezer 7 Pro Rev. 2', 2009, 2014, 25, 3, 140, 'l775 l115x', 'tower', 'arctic'],
  ['Arctic Cooling Alpine 11 Pro', 2009, 2016, 15, 1, 95, 'l775 l115x', 'low', 'arctic'],
  ['Arctic Cooling Freezer 13', 2010, 2015, 35, 3, 200, 'l775 l115x k8 l1366', 'tower', 'arctic'],
  ['ARCTIC Freezer i30', 2013, 2017, 45, 4, 200, 'l115x l2011', 'tower', 'arctic'],
  ['ARCTIC Freezer A30', 2013, 2016, 45, 4, 180, 'k8', 'tower', 'arctic'],
  ['ARCTIC Liquid Freezer 240', 2016, 2019, 80, 4, 250, 'l115x l2011 k8 am4', 'aio', 'arcticaio'],
  ['ARCTIC Alpine 23', 2016, 2020, 10, 1, 95, 'k8 am4', 'low', 'arctic'],
  ['ARCTIC Freezer 33 eSports ONE', 2018, 2022, 35, 3, 200, 'l115x l2011 am4', 'tower', 'allblk'],
  ['ARCTIC Freezer 34 eSports DUO', 2019, 2023, 45, 3, 210, 'l115x l2011 am4 l1700', 'tower', 'allblk'],
  ['ARCTIC Freezer 7 X', 2019, 2026, 20, 1, 100, 'l115x am4 l1700', 'low', 'arctic', { id: 'freezer-7x', colors: ['#1d1d1d', '#d8d8d8', '#c8ccd0'] }],
  ['ARCTIC Liquid Freezer II 240', 2019, 2023, 80, 4, 250, MODERN, 'aio', 'arcticaio'],
  ['ARCTIC Liquid Freezer II 280', 2019, 2023, 90, 4, 280, MODERN, 'aio', 'arcticaio'],
  ['ARCTIC Liquid Freezer II 360', 2019, 2023, 100, 5, 300, MODERN, 'aio', 'arcticaio'],
  ['ARCTIC Freezer A35', 2022, 2025, 30, 2, 180, 'am4', 'tower', 'arctic'],
  ['ARCTIC Alpine 17', 2022, 2026, 15, 1, 100, 'l1700', 'low', 'arctic'],
  ['ARCTIC Freezer 36', 2024, 2026, 35, 2, 200, 'l115x am4 l1700', 'tower', 'allblk'],
  ['ARCTIC Freezer 36 A-RGB', 2024, 2026, 42, 3, 200, 'l115x am4 l1700', 'tower', 'allblk', { rgb: true }],
  ['ARCTIC Liquid Freezer III 240', 2024, 2026, 75, 3, 250, 'l115x am4 l1700', 'aio', 'arcticaio'],
  ['ARCTIC Liquid Freezer III 280', 2024, 2026, 85, 4, 280, 'l115x am4 l1700', 'aio', 'arcticaio'],
  ['ARCTIC Liquid Freezer III 360', 2024, 2026, 95, 4, 300, 'l115x am4 l1700', 'aio', 'arcticaio', { id: 'lf3-360' }],
  ['ARCTIC Liquid Freezer III 420', 2024, 2026, 120, 5, 320, 'l115x am4 l1700', 'aio', 'arcticaio'],
  ['ARCTIC Liquid Freezer III Pro 360', 2025, 2026, 110, 5, 320, 'l115x am4 l1700', 'aio', 'arcticaio'],
]);
K('Scythe', [
  ['Scythe Ninja', 2005, 2008, 45, 5, 130, 'p478 l775 k8', 'tower', 'blk'],
  ['Scythe Andy Samurai Master', 2006, 2009, 40, 4, 130, 'l775 k8', 'low', 'blk'],
  ['Scythe Mugen', 2007, 2009, 45, 4, 160, 'l775 k8', 'tower', 'blk'],
  ['Scythe Katana 2', 2007, 2010, 30, 3, 110, 'l775 k8', 'tower', 'blk'],
  ['Scythe Ninja 2', 2008, 2011, 50, 4, 160, 'l775 k8 l1366', 'tower', 'blk'],
  ['Scythe Mugen 2', 2009, 2012, 45, 4, 180, 'l775 k8 l1366 l115x', 'tower', 'blk'],
  ['Scythe Katana 3', 2010, 2013, 30, 3, 130, 'l775 k8 l115x', 'tower', 'blk'],
  ['Scythe Ninja 3', 2011, 2014, 55, 4, 190, 'k8 l1366 l115x', 'tower', 'blk'],
  ['Scythe Ashura', 2011, 2014, 45, 4, 180, 'k8 l1366 l115x', 'tower', 'blk'],
  ['Scythe Big Shuriken 2 Rev.B', 2012, 2016, 40, 3, 110, 'k8 l775 l115x', 'low', 'blk'],
  ['Scythe Mugen 3', 2012, 2015, 45, 4, 200, 'k8 l1366 l115x l2011', 'tower', 'blk'],
  ['Scythe Mugen 4', 2014, 2017, 45, 4, 200, 'k8 l115x l2011', 'tower', 'blk'],
  ['Scythe Fuma', 2014, 2018, 50, 4, 200, 'k8 l115x l2011 am4', 'tower', 'blk'],
  ['Scythe Kotetsu', 2015, 2018, 35, 3, 160, 'k8 l115x l2011 am4', 'tower', 'blk'],
  ['Scythe Big Shuriken 3', 2016, 2021, 45, 3, 120, 'k8 l115x am4', 'low', 'blk'],
  ['Scythe Mugen 5 Rev.B', 2017, 2022, 45, 4, 220, 'k8 l115x l2011 am4', 'tower', 'blk'],
  ['Scythe Kotetsu Mark II', 2018, 2022, 35, 3, 180, 'l115x l2011 am4', 'tower', 'blk'],
  ['Scythe Choten', 2018, 2022, 45, 3, 150, 'l115x am4', 'low', 'blk'],
  ['Scythe Fuma 2', 2019, 2024, 55, 4, 220, MODERN, 'tower', 'blk'],
  ['Scythe Mugen 6', 2023, 2026, 60, 4, 250, 'l115x am4 l1700', 'tower', 'blk'],
  ['Scythe Fuma 3', 2023, 2026, 55, 4, 230, 'l115x am4 l1700', 'tower', 'blk'],
]);
K('Noctua', [
  ['Noctua NH-U9', 2005, 2007, 50, 4, 110, 'p478 l775 k8', 'tower', 'noc'],
  ['Noctua NH-U12', 2005, 2007, 55, 5, 130, 'p478 l775 k8', 'tower', 'noc'],
  ['Noctua NH-U12P', 2007, 2009, 65, 5, 160, 'l775 k8', 'tower', 'noc'],
  ['Noctua NH-C12P', 2008, 2010, 65, 5, 130, 'l775 k8 l1366', 'low', 'noc'],
  ['Noctua NH-U12P SE2', 2009, 2013, 70, 5, 180, 'l775 k8 l1366 l115x', 'tower', 'noc'],
  ['Noctua NH-D14', 2009, 2014, 85, 5, 220, 'l775 k8 l1366 l115x l2011', 'tower', 'noc'],
  ['Noctua NH-C14', 2010, 2015, 80, 5, 180, 'k8 l1366 l115x l2011', 'low', 'noc'],
  ['Noctua NH-U9B SE2', 2011, 2016, 60, 4, 140, 'k8 l1366 l115x l2011', 'tower', 'noc'],
  ['Noctua NH-L12', 2012, 2018, 60, 4, 120, 'k8 l115x l2011 am4', 'low', 'noc'],
  ['Noctua NH-L9i', 2012, 2021, 40, 3, 65, 'l115x', 'low', 'noc'],
  ['Noctua NH-L9a', 2013, 2016, 40, 3, 65, 'k8', 'low', 'noc'],
  ['Noctua NH-U12S', 2013, 2019, 60, 4, 180, 'k8 l115x l2011 am4', 'tower', 'noc'],
  ['Noctua NH-U14S', 2013, 2019, 70, 5, 200, 'k8 l115x l2011 am4', 'tower', 'noc'],
  ['Noctua NH-D15', 2014, 2026, 90, 4, 250, 'k8 l115x l2011 am4 l1700', 'tower', 'noc', { id: 'nh-d15' }],
  ['Noctua NH-C14S', 2015, 2021, 75, 4, 180, 'k8 l115x l2011 am4', 'low', 'noc'],
  ['Noctua NH-L9x65', 2015, 2021, 50, 3, 95, 'k8 l115x l2011 am4', 'low', 'noc'],
  ['Noctua NH-D15S', 2015, 2024, 80, 4, 230, 'k8 l115x l2011 am4 l1700', 'tower', 'noc'],
  ['Noctua NH-U9S', 2016, 2024, 60, 3, 140, 'k8 l115x l2011 am4 l1700', 'tower', 'noc'],
  ['Noctua NH-D9L', 2016, 2024, 60, 3, 140, 'k8 l115x l2011 am4 l1700', 'tower', 'noc'],
  ['Noctua NH-L9a-AM4', 2017, 2023, 40, 3, 65, 'am4', 'low', 'noc'],
  ['Noctua NH-U14S TR4-SP3', 2017, 2022, 80, 5, 280, 'tr', 'tower', 'noc'],
  ['Noctua NH-L12S', 2018, 2026, 55, 3, 120, 'l115x l2011 am4 l1700', 'low', 'noc'],
  ['Noctua NH-U12A', 2019, 2026, 100, 5, 220, 'l115x l2011 am4 l1700', 'tower', 'noc'],
  ['Noctua NH-D15 chromax.black', 2020, 2026, 110, 5, 250, 'l115x l2011 am4 l1700', 'tower', 'chromax'],
  ['Noctua NH-U12S chromax.black', 2020, 2026, 70, 4, 180, 'l115x l2011 am4 l1700', 'tower', 'chromax'],
  ['Noctua NH-U12S redux', 2020, 2026, 50, 3, 170, 'l115x am4 l1700', 'tower', 'redux'],
  ['Noctua NH-L9i-17xx', 2021, 2026, 45, 3, 65, 'l1700', 'low', 'noc'],
  ['Noctua NH-L9a-AM5', 2022, 2026, 45, 3, 65, 'am4', 'low', 'noc'],
  ['Noctua NH-U12A chromax.black', 2023, 2026, 130, 5, 220, 'l115x am4 l1700', 'tower', 'chromax'],
  ['Noctua NH-D15 G2', 2024, 2026, 150, 5, 280, 'l115x am4 l1700', 'tower', 'noc'],
]);
K('be quiet!', [
  ['be quiet! Dark Rock Pro 2', 2012, 2015, 80, 5, 250, 'k8 l1366 l115x l2011', 'tower', 'bq'],
  ['be quiet! Shadow Rock 2', 2013, 2016, 50, 4, 180, 'k8 l115x l2011', 'tower', 'bq'],
  ['be quiet! Dark Rock 3', 2014, 2018, 70, 4, 190, 'k8 l115x l2011 am4', 'tower', 'bq'],
  ['be quiet! Dark Rock Pro 3', 2014, 2018, 85, 5, 250, 'k8 l115x l2011 am4', 'tower', 'bq'],
  ['be quiet! Shadow Rock LP', 2014, 2019, 45, 3, 130, 'k8 l115x am4', 'low', 'bq'],
  ['be quiet! Pure Rock', 2015, 2020, 35, 2, 150, 'k8 l115x l2011 am4', 'tower', 'bq'],
  ['be quiet! Shadow Rock 3', 2017, 2023, 50, 3, 190, MODERN, 'tower', 'bq'],
  ['be quiet! Silent Loop 280mm', 2017, 2020, 130, 5, 300, 'l115x l2011 am4', 'aio', 'bq'],
  ['be quiet! Dark Rock 4', 2018, 2024, 75, 4, 200, MODERN, 'tower', 'bq'],
  ['be quiet! Dark Rock Pro 4', 2018, 2024, 90, 5, 250, MODERN, 'tower', 'bq'],
  ['be quiet! Dark Rock Slim', 2019, 2024, 60, 4, 180, MODERN, 'tower', 'bq'],
  ['be quiet! Pure Rock 2', 2020, 2026, 40, 2, 150, MODERN, 'tower', 'bq'],
  ['be quiet! Pure Rock Slim 2', 2020, 2026, 30, 1, 130, 'l115x am4 l1700', 'tower', 'bq'],
  ['be quiet! Pure Loop 240mm', 2020, 2023, 90, 4, 250, MODERN, 'aio', 'bq'],
  ['be quiet! Silent Loop 2 360mm', 2021, 2025, 150, 5, 300, MODERN, 'aio', 'bq', { rgb: true }],
  ['be quiet! Dark Rock 5', 2023, 2026, 80, 4, 230, 'l115x am4 l1700', 'tower', 'bq'],
  ['be quiet! Dark Rock Pro 5', 2023, 2026, 100, 5, 270, 'l115x am4 l1700', 'tower', 'bq'],
  ['be quiet! Dark Rock Elite', 2023, 2026, 115, 5, 280, 'l115x am4 l1700', 'tower', 'bq', { rgb: true }],
  ['be quiet! Pure Loop 2 FX 360mm', 2023, 2026, 150, 5, 300, 'l115x am4 l1700', 'aio', 'bq', { rgb: true }],
  ['be quiet! Light Loop 360mm', 2024, 2026, 140, 5, 300, 'l115x am4 l1700', 'aio', 'bq', { rgb: true }],
  ['be quiet! Pure Rock Pro 3', 2024, 2026, 50, 3, 230, 'l115x am4 l1700', 'tower', 'bq'],
]);
K('DeepCool', [
  ['DeepCool Ice Blade Pro v2.0', 2012, 2016, 30, 3, 150, 'k8 l775 l115x', 'tower', 'blue'],
  ['DeepCool Gammaxx 400', 2013, 2019, 25, 2, 130, 'k8 l775 l115x am4', 'tower', 'blue'],
  ['DeepCool Neptwin', 2014, 2017, 50, 4, 180, 'k8 l115x l2011', 'tower', 'blk'],
  ['DeepCool Lucifer K2', 2014, 2017, 55, 4, 200, 'k8 l115x l2011', 'tower', 'blk'],
  ['DeepCool Assassin II', 2015, 2019, 80, 5, 220, 'k8 l115x l2011 am4', 'tower', 'allblk'],
  ['DeepCool Gammaxx 400 V2', 2019, 2023, 25, 2, 180, 'l115x am4 l1700', 'tower', 'allblk', { rgb: true }],
  ['DeepCool Gammaxx L240 V2', 2019, 2022, 70, 3, 220, 'l115x l2011 am4', 'aio', 'allblk', { rgb: true }],
  ['DeepCool Castle 360EX', 2019, 2022, 150, 5, 280, 'l115x l2011 am4', 'aio', 'allblk', { rgb: true }],
  ['DeepCool Assassin III', 2019, 2022, 90, 5, 280, 'l115x l2011 am4', 'tower', 'allblk'],
  ['DeepCool AK620', 2021, 2026, 65, 4, 260, MODERN, 'tower', 'allblk'],
  ['DeepCool AK400', 2022, 2026, 35, 2, 220, 'l115x am4 l1700', 'tower', 'allblk'],
  ['DeepCool AK500', 2022, 2026, 55, 3, 240, 'l115x am4 l1700', 'tower', 'allblk'],
  ['DeepCool AG400', 2022, 2025, 30, 2, 220, 'l115x am4 l1700', 'tower', 'allblk'],
  ['DeepCool AK620 WH', 2022, 2026, 70, 4, 260, 'l115x am4 l1700', 'tower', 'white'],
  ['DeepCool LS720', 2022, 2026, 130, 4, 300, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true }],
  ['DeepCool LT720', 2022, 2026, 150, 5, 300, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true }],
  ['DeepCool AK620 Digital', 2023, 2026, 80, 4, 260, 'l115x am4 l1700', 'tower', 'allblk', { rgb: true, screen: true }],
  ['DeepCool AK400 Digital', 2023, 2026, 45, 3, 220, 'l115x am4 l1700', 'tower', 'allblk', { rgb: true, screen: true }],
  ['DeepCool Assassin IV', 2023, 2026, 100, 5, 280, 'l115x am4 l1700', 'tower', 'allblk'],
  ['DeepCool LE720', 2023, 2026, 80, 3, 280, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true }],
  ['DeepCool Mystique 360', 2024, 2026, 150, 5, 300, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true, screen: true }],
]);
K('Corsair', [
  ['Corsair Hydro Series H50', 2009, 2012, 80, 4, 150, 'l775 k8 l1366 l115x', 'aio', 'allblk'],
  ['Corsair Hydro Series H70', 2010, 2012, 100, 5, 180, 'l775 k8 l1366 l115x', 'aio', 'allblk'],
  ['Corsair Hydro Series H60', 2011, 2015, 70, 4, 170, 'k8 l775 l1366 l115x l2011', 'aio', 'allblk'],
  ['Corsair Hydro Series H80', 2011, 2013, 90, 5, 200, 'k8 l1366 l115x l2011', 'aio', 'allblk'],
  ['Corsair Hydro Series H100', 2011, 2013, 120, 5, 250, 'k8 l1366 l115x l2011', 'aio', 'allblk'],
  ['Corsair Hydro Series H55', 2013, 2018, 60, 3, 150, 'k8 l115x l2011 am4', 'aio', 'allblk'],
  ['Corsair Hydro Series H100i', 2013, 2016, 110, 5, 250, 'k8 l1366 l115x l2011', 'aio', 'allblk'],
  ['Corsair Hydro Series H110', 2013, 2016, 130, 5, 260, 'k8 l1366 l115x l2011', 'aio', 'allblk'],
  ['Corsair Hydro Series H80i GT', 2014, 2017, 100, 4, 220, 'k8 l115x l2011 am4', 'aio', 'allblk'],
  ['Corsair Hydro Series H100i v2', 2016, 2019, 110, 4, 260, 'k8 l115x l2011 am4', 'aio', 'allblk'],
  ['Corsair Hydro Series H115i', 2016, 2019, 130, 5, 280, 'k8 l115x l2011 am4', 'aio', 'allblk'],
  ['Corsair Hydro Series H100i RGB PLATINUM', 2018, 2021, 140, 5, 260, 'l115x l2011 am4', 'aio', 'allblk', { rgb: true }],
  ['Corsair Hydro Series H150i PRO RGB', 2018, 2021, 170, 5, 300, 'l115x l2011 am4', 'aio', 'allblk', { rgb: true }],
  ['Corsair A500', 2019, 2022, 100, 5, 250, 'l115x l2011 am4', 'tower', 'allblk'],
  ['Corsair iCUE H100i ELITE CAPELLIX', 2020, 2023, 150, 5, 260, MODERN, 'aio', 'allblk', { rgb: true }],
  ['Corsair iCUE H150i ELITE CAPELLIX', 2020, 2023, 180, 5, 300, MODERN, 'aio', 'allblk', { rgb: true }],
  ['Corsair iCUE H170i ELITE CAPELLIX', 2021, 2024, 210, 5, 320, MODERN, 'aio', 'allblk', { rgb: true }],
  ['Corsair iCUE H150i ELITE CAPELLIX XT', 2022, 2025, 190, 5, 300, 'l115x am4 l1700', 'aio', 'white', { rgb: true }],
  ['Corsair iCUE H150i ELITE LCD', 2022, 2025, 270, 5, 300, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true, screen: true }],
  ['Corsair iCUE H100x RGB ELITE', 2023, 2026, 100, 4, 250, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true }],
  ['Corsair iCUE LINK H150i RGB', 2023, 2026, 190, 5, 320, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true }],
  ['Corsair NAUTILUS 360 RS ARGB', 2024, 2026, 100, 4, 300, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true }],
]);
K('NZXT', [
  ['NZXT Havik 140', 2011, 2014, 60, 4, 200, 'k8 l775 l1366 l115x', 'tower', 'allblk'],
  ['NZXT Kraken X40', 2012, 2014, 100, 4, 200, 'k8 l1366 l115x l2011', 'aio', 'allblk'],
  ['NZXT Kraken X60', 2012, 2014, 140, 5, 260, 'k8 l1366 l115x l2011', 'aio', 'allblk'],
  ['NZXT Kraken X41', 2014, 2016, 110, 4, 220, 'k8 l115x l2011', 'aio', 'allblk'],
  ['NZXT Kraken X61', 2014, 2016, 140, 5, 270, 'k8 l115x l2011', 'aio', 'allblk'],
  ['NZXT Kraken X42', 2016, 2019, 110, 4, 230, 'k8 l115x l2011 am4', 'aio', 'allblk', { rgb: true }],
  ['NZXT Kraken X52', 2016, 2019, 130, 5, 250, 'k8 l115x l2011 am4', 'aio', 'allblk', { rgb: true }],
  ['NZXT Kraken X62', 2016, 2019, 160, 5, 280, 'k8 l115x l2011 am4', 'aio', 'allblk', { rgb: true }],
  ['NZXT Kraken X53', 2019, 2022, 130, 4, 250, MODERN, 'aio', 'allblk', { rgb: true }],
  ['NZXT Kraken X63', 2019, 2022, 150, 5, 280, MODERN, 'aio', 'allblk', { rgb: true }],
  ['NZXT Kraken X73', 2019, 2022, 180, 5, 300, MODERN, 'aio', 'allblk', { rgb: true }],
  ['NZXT Kraken Z73', 2019, 2023, 280, 5, 300, MODERN, 'aio', 'allblk', { rgb: true, screen: true }],
  ['NZXT Kraken 240', 2023, 2026, 110, 4, 250, 'l115x am4 l1700', 'aio', 'allblk'],
  ['NZXT Kraken 360 RGB', 2023, 2026, 170, 5, 300, 'l115x am4 l1700', 'aio', 'white', { rgb: true }],
  ['NZXT Kraken Elite 280', 2023, 2026, 250, 5, 280, 'l115x am4 l1700', 'aio', 'allblk', { screen: true }],
  ['NZXT Kraken Elite 360 RGB', 2023, 2026, 300, 5, 300, 'l115x am4 l1700', 'aio', 'white', { id: 'kraken-elite-360', rgb: true, screen: true, colors: ['#e9e9e6', '#f5f5f5', '#e9e9e6'] }],
  ['NZXT T120 RGB', 2023, 2026, 40, 2, 200, 'l115x am4 l1700', 'tower', 'allblk', { rgb: true }],
]);
K('Lian Li', [
  ['Lian Li Galahad AIO 360 RGB', 2020, 2023, 150, 5, 300, MODERN, 'aio', 'allblk', { rgb: true }],
  ['Lian Li Galahad II Trinity 360', 2023, 2026, 170, 5, 320, 'l115x am4 l1700', 'aio', 'white', { rgb: true }],
  ['Lian Li Galahad II LCD 360', 2023, 2026, 220, 5, 320, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true, screen: true }],
  ['Lian Li HydroShift LCD 360S', 2024, 2026, 180, 5, 300, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true, screen: true }],
]);
K('EK', [
  ['EK-AIO 360 D-RGB', 2020, 2024, 150, 5, 300, MODERN, 'aio', 'allblk', { rgb: true }],
  ['EK-AIO Basic 240', 2021, 2024, 90, 3, 250, 'l115x am4 l1700', 'aio', 'allblk'],
  ['EK-Nucleus AIO CR360 Lux D-RGB', 2023, 2026, 170, 5, 320, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true }],
]);
K('ASUS', [
  ['ASUS TUF Gaming LC 240 RGB', 2020, 2023, 100, 4, 240, MODERN, 'aio', 'allblk', { rgb: true }],
  ['ASUS ROG Strix LC II 360 ARGB', 2021, 2024, 170, 5, 300, MODERN, 'aio', 'allblk', { rgb: true }],
  ['ASUS ROG Ryujin II 360', 2021, 2024, 300, 5, 320, MODERN, 'aio', 'allblk', { rgb: true, screen: true }],
  ['ASUS ROG Ryuo III 360 ARGB', 2023, 2026, 230, 5, 300, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true, screen: true }],
  ['ASUS ROG Ryujin III 360', 2023, 2026, 330, 5, 320, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true, screen: true }],
]);
K('MSI', [
  ['MSI MAG CoreLiquid 240R', 2020, 2023, 100, 4, 240, MODERN, 'aio', 'allblk', { rgb: true }],
  ['MSI MEG CoreLiquid S360', 2021, 2024, 250, 5, 320, MODERN, 'aio', 'allblk', { screen: true }],
  ['MSI MAG CoreLiquid E360', 2023, 2026, 110, 4, 300, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true }],
  ['MSI MAG CoreLiquid I360', 2024, 2026, 130, 4, 300, 'l115x am4 l1700', 'aio', 'allblk', { rgb: true, screen: true }],
]);
K('Fractal Design', [
  ['Fractal Design Kelvin S36', 2014, 2017, 130, 5, 280, 'k8 l115x l2011', 'aio', 'allblk'],
  ['Fractal Design Celsius S24', 2016, 2019, 110, 4, 250, 'k8 l115x l2011 am4', 'aio', 'allblk'],
  ['Fractal Design Celsius+ S36 Prisma', 2021, 2024, 150, 5, 300, MODERN, 'aio', 'allblk', { rgb: true }],
  ['Fractal Design Lumen S36 RGB', 2021, 2024, 110, 4, 300, MODERN, 'aio', 'allblk', { rgb: true }],
]);
K('Enermax', [
  ['Enermax ETS-T40', 2014, 2018, 40, 3, 200, 'k8 l115x l2011 am4', 'tower', 'blk'],
  ['Enermax Liqtech TR4 280', 2017, 2020, 150, 5, 300, 'tr', 'aio', 'allblk'],
  ['Enermax Liqmax III 240', 2018, 2021, 80, 3, 220, 'l115x l2011 am4', 'aio', 'allblk', { rgb: true }],
  ['Enermax Liqtech TR4 II 360', 2019, 2022, 180, 5, 350, 'tr', 'aio', 'allblk', { rgb: true }],
]);
K('Cryorig', [
  ['Cryorig H7', 2014, 2019, 35, 3, 140, 'k8 l115x l2011 am4', 'tower', 'blk'],
  ['Cryorig R1 Ultimate', 2014, 2018, 90, 5, 250, 'k8 l115x l2011 am4', 'tower', 'blk'],
  ['Cryorig H5 Universal', 2015, 2019, 50, 4, 180, 'k8 l115x l2011 am4', 'tower', 'blk'],
  ['Cryorig C7', 2015, 2021, 35, 3, 100, 'k8 l115x am4', 'low', 'blk'],
]);
K('ID-COOLING', [
  ['ID-COOLING FROSTFLOW X 240', 2019, 2023, 70, 3, 250, 'l115x l2011 am4', 'aio', 'allblk'],
  ['ID-COOLING SE-224-XT', 2020, 2025, 25, 2, 180, 'l115x am4 l1700', 'tower', 'allblk'],
  ['ID-COOLING SE-207-XT', 2020, 2024, 50, 4, 250, MODERN, 'tower', 'allblk'],
  ['ID-COOLING IS-55', 2021, 2026, 30, 2, 100, 'l115x am4 l1700', 'low', 'allblk'],
]);

export default P;
