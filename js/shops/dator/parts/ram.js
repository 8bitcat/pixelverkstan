// RAM-minne 1983–2026: lösa DRAM-kretsar, SIMM, SDRAM och DDR–DDR5.
// Genereras ur tabeller per tillverkare/serie. Priser = ungefärligt svenskt
// butikspris lanseringsåret (USD-gatupris × SEK_PER_USD × 1,25).
import { SEK_PER_USD } from './canon.js';

const P = [];
const IDS = new Set();
const END = { DIP: 1991, SIMM30: 1996, SIMM72: 1999, SDR: 2003, DDR: 2007, DDR2: 2011, DDR3: 2017, DDR4: 2025, DDR5: 2026 };
const slug = (s) => s.toLowerCase().replace(/µ/g, 'u').replace(/ö/g, 'o').replace(/ä/g, 'a').replace(/å/g, 'a')
  .replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
const rnd = (v) => (v < 100 ? Math.max(5, Math.round(v)) : v < 1000 ? Math.round(v / 5) * 5 : Math.round(v / 10) * 10);
const sek = (usd, y) => rnd(usd * SEK_PER_USD[y] * 1.25);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Typisk "normal" minnesmängd i en dator per år – styr segment (tier).
const MAIN_MB = {
  1983: 0.256, 1984: 0.512, 1985: 0.64, 1986: 0.64, 1987: 1, 1988: 1, 1989: 2, 1990: 2, 1991: 4, 1992: 4,
  1993: 8, 1994: 8, 1995: 16, 1996: 16, 1997: 32, 1998: 64, 1999: 128, 2000: 128, 2001: 256, 2002: 512,
  2003: 512, 2004: 1024, 2005: 1024, 2006: 2048, 2007: 2048, 2008: 4096, 2009: 4096, 2010: 4096, 2011: 8192,
  2012: 8192, 2013: 8192, 2014: 8192, 2015: 16384, 2016: 16384, 2017: 16384, 2018: 16384, 2019: 16384,
  2020: 16384, 2021: 16384, 2022: 32768, 2023: 32768, 2024: 32768, 2025: 32768, 2026: 32768,
};
const tierFor = (mb, y, adj = 0) => clamp(Math.round(2.5 + 0.8 * Math.log2(mb / MAIN_MB[y]) + adj), 1, 5);

function add(o) {
  const id = o.id || 'ram-' + slug(o.name);
  if (IDS.has(id)) return;
  IDS.add(id);
  const until = Math.min(o.until ?? o.year + 4, END[o.type]);
  const part = { id, cat: 'ram', name: o.name, brand: o.brand, year: o.year, until: Math.max(until, o.year), cost: o.cost, tier: o.tier,
    rgb: !!o.rgb, type: o.type, mb: o.mb, sticks: o.sticks, speed: o.speed, look: o.look };
  if (o.lvl) part.lvl = o.lvl;
  P.push(part);
}

// ---------------------------------------------------------------------------
// DIP – lösa DRAM-kretsar (1983–1991)
// ---------------------------------------------------------------------------
// Gatupris i USD per krets per år
const CHIP_USD = {
  '16K': { 1983: 1.5, 1984: 1.2 },
  '64K': { 1983: 5, 1984: 3.5, 1985: 1.6, 1986: 1.3, 1987: 1.3, 1988: 2.5, 1989: 2.2 },
  '256K': { 1984: 28, 1985: 7, 1986: 3.5, 1987: 3.2, 1988: 8, 1989: 4.5, 1990: 2.8, 1991: 2.4 },
  '1Mbit': { 1986: 45, 1987: 20, 1988: 28, 1989: 13, 1990: 6.5, 1991: 5 },
  '256Kx4': { 1988: 30, 1989: 15, 1990: 7, 1991: 5.5 },
};
// [densitet, sista år, kbit per krets, satser (antal kretsar), hastigheter [från år, ns]]
const CHIP = {
  '16K': { end: 1984, kbit: 16, kits: [9, 18], speeds: [[1983, 200]] },
  '64K': { end: 1989, kbit: 64, kits: [9, 36], speeds: [[1983, 150], [1986, 120]] },
  '256K': { end: 1991, kbit: 256, kits: [9, 18, 36], speeds: [[1984, 150], [1987, 120], [1989, 100]] },
  '1Mbit': { end: 1991, kbit: 1000, kits: [9, 36], speeds: [[1986, 100], [1989, 80], [1991, 70]] },
  '256Kx4': { end: 1991, kbit: 0, kits: [8, 16], speeds: [[1988, 80], [1990, 70]] },
};
// [tillverkare, krets, densitet, första år]
const DIP_CHIPS = [
  ['Mostek', 'MK4116', '16K', 1983], ['NEC', 'µPD416', '16K', 1983],
  ['Texas Instruments', 'TMS4164', '64K', 1983], ['NEC', 'µPD4164', '64K', 1983], ['Hitachi', 'HM4864', '64K', 1983],
  ['Fujitsu', 'MB8264A', '64K', 1983], ['Mitsubishi', 'M5K4164', '64K', 1983], ['Motorola', 'MCM6665', '64K', 1983],
  ['Intel', '2164A', '64K', 1983], ['Micron', 'MT4264', '64K', 1984], ['Mostek', 'MK4564', '64K', 1983],
  ['Samsung', 'KM4164B', '64K', 1985], ['Siemens', 'HYB4164', '64K', 1985], ['Oki', 'MSM3764', '64K', 1984],
  ['NEC', 'µPD41256', '256K', 1984], ['Hitachi', 'HM50256', '256K', 1984], ['Fujitsu', 'MB81256', '256K', 1984],
  ['Texas Instruments', 'TMS4256', '256K', 1985], ['Mitsubishi', 'M5M4256', '256K', 1985], ['Motorola', 'MCM6256', '256K', 1985],
  ['Micron', 'MT1259', '256K', 1986], ['Samsung', 'KM41256', '256K', 1986], ['Siemens', 'HYB41256', '256K', 1986],
  ['Oki', 'MSM41256', '256K', 1985],
  ['Toshiba', 'TC511000', '1Mbit', 1986], ['NEC', 'µPD421000', '1Mbit', 1987], ['Hitachi', 'HM511000', '1Mbit', 1987],
  ['Texas Instruments', 'TMS4C1024', '1Mbit', 1988], ['Micron', 'MT4C1024', '1Mbit', 1988], ['Samsung', 'KM41C1000', '1Mbit', 1988],
  ['Siemens', 'HYB511000', '1Mbit', 1989], ['Oki', 'MSM511000', '1Mbit', 1988], ['Mitsubishi', 'M5M41000', '1Mbit', 1988],
  ['Fujitsu', 'MB811000', '1Mbit', 1988], ['Motorola', 'MCM511000', '1Mbit', 1989],
  ['NEC', 'µPD424256', '256Kx4', 1988], ['Hitachi', 'HM514256', '256Kx4', 1988], ['Toshiba', 'TC514256', '256Kx4', 1989],
  ['Samsung', 'KM44C256', '256Kx4', 1989], ['Micron', 'MT4C4256', '256Kx4', 1990], ['Texas Instruments', 'TMS44C256', '256Kx4', 1990],
];
const DIP_LABEL = { '16K': '16K DRAM', '64K': '64K DRAM', '256K': '256K DRAM', '1Mbit': '1Mbit DRAM', '256Kx4': '256Kx4 DRAM' };
for (const [brand, chip, dens, first] of DIP_CHIPS) {
  const C = CHIP[dens];
  const batches = C.speeds.filter(([y]) => y <= C.end).map(([y, ns], i, arr) => [Math.max(first, y), ns, arr[i + 1] ? arr[i + 1][0] : C.end + 1]);
  batches.forEach(([y, ns, nextY], bi) => {
    if (y > C.end || y >= nextY) return;
    const until = Math.min(C.end, Math.max(y + 2, nextY));
    const kits = bi === 0 ? C.kits : [C.kits[0]];
    for (const n of kits) {
      const mb = dens === '256Kx4' ? n / 8 : (n / 9) * (C.kbit / 1000);
      const suffix = ns >= 100 ? ns / 10 : ns;
      const cost = sek(n * CHIP_USD[dens][y] * 1.3, y);
      add({ name: `${brand} ${chip}-${suffix} ${DIP_LABEL[dens]} (${n} st)`, brand, type: 'DIP', year: y, until, mb: Math.round(mb * 1000) / 1000,
        sticks: 1, speed: `${ns}ns`, cost, tier: tierFor(mb, y), look: { color: '#26262a', accent: '#b9bcc0', style: 'bare' } });
    }
  });
}
// Färdiga uppgraderingssatser för XT/AT-kort
const DIP_SETS = [
  ['NEC', 'NEC µPD41256 + µPD4164 640K-uppgradering (36 st)', 1985, 1988, 0.64, 18 * 7 + 18 * 1.6, '150ns'],
  ['Texas Instruments', 'Texas Instruments TMS4256 640K-uppgradering (36 st)', 1986, 1989, 0.64, 36 * 3.5 * 0.75, '150ns'],
  ['Micron', 'Micron MT1259 1MB AT-sats (36 st)', 1987, 1990, 1, 36 * 3.2, '120ns'],
  ['Samsung', 'Samsung KM41256 640K-uppgradering (36 st)', 1987, 1990, 0.64, 36 * 3.2 * 0.75, '120ns'],
  ['Toshiba', 'Toshiba TC511000 4MB 386-sats (36 st)', 1989, 1991, 4, 36 * 13, '80ns'],
  ['Hitachi', 'Hitachi HM511000 4MB 386-sats (36 st)', 1990, 1991, 4, 36 * 6.5, '80ns'],
];
for (const [brand, name, year, until, mb, usd, speed] of DIP_SETS) {
  add({ name, brand, type: 'DIP', year, until, mb, sticks: 1, speed, cost: sek(usd * 1.3, year), tier: tierFor(mb, year),
    look: { color: '#26262a', accent: '#b9bcc0', style: 'bare' } });
}

// ---------------------------------------------------------------------------
// SIMM – 30-pin (1987–1996) och 72-pin FPM/EDO (1993–1999)
// ---------------------------------------------------------------------------
const SIMM_USD_MB = {
  SIMM30: { 1987: 220, 1988: 380, 1989: 160, 1990: 75, 1991: 45, 1992: 35, 1993: 40, 1994: 38, 1995: 36, 1996: 11 },
  SIMM72: { 1993: 43, 1994: 40, 1995: 38, 1996: 10, 1997: 4.3, 1998: 1.9, 1999: 2.2 },
};
const SIMM_GREEN = { color: '#2e6b3c', accent: '#1d1d20', style: 'bare' };
// [tillverkare, första år, sista år, PCB-färg]
const SIMM30_BRANDS = [
  ['Samsung', 1987, 1996, '#2e6b3c'], ['Micron', 1987, 1996, '#2f7040'], ['NEC', 1987, 1995, '#2a6438'],
  ['Siemens', 1988, 1996, '#2e6b3c'], ['Toshiba', 1987, 1995, '#2b6a3e'], ['Hitachi', 1987, 1995, '#2e6b3c'],
  ['Kingston', 1988, 1996, '#2f7a45'], ['Mitsubishi', 1988, 1995, '#2a6438'],
];
const S30_CAPS = [[0.256, 1987, 1991], [1, 1987, 1996], [4, 1990, 1996], [16, 1993, 1996]];
const s30speed = (y) => (y <= 1988 ? '100ns' : y <= 1990 ? '80ns' : y <= 1994 ? '70ns' : '60ns');
SIMM30_BRANDS.forEach(([brand, a, b, pcb], bi) => {
  for (let y = a; y <= b; y++) {
    if ((y + bi) % 2) continue; // varje tillverkare släpper nya moduler vartannat år
    for (const [cap, c0, c1] of S30_CAPS) {
      if (y < c0 || y > c1) continue;
      const capName = cap < 1 ? '256KB' : `${cap}MB`;
      const packs = cap >= 16 ? [1] : cap >= 4 ? [1, 2] : cap >= 1 ? [1, 4] : [4];
      for (const n of packs) {
        const mb = cap * n, speed = s30speed(y);
        const usd = mb * SIMM_USD_MB.SIMM30[y] * (cap < 1 ? 1.2 : 1) + n * 4;
        add({ name: `${brand} ${capName} 30-pin SIMM ${speed}${n > 1 ? ` (${n} st)` : ''}`, brand, type: 'SIMM30', year: y, until: y + 3,
          mb, sticks: n, speed, cost: sek(usd, y), tier: tierFor(mb, y, brand === 'Kingston' ? 0.2 : 0), look: { ...SIMM_GREEN, color: pcb } });
      }
    }
  }
});

const SIMM72_BRANDS = [
  ['Kingston', 1993, 1999, '#2f7a45'], ['Micron', 1993, 1999, '#2f7040'], ['Samsung', 1993, 1999, '#2e6b3c'],
  ['Hyundai', 1994, 1999, '#2a6438'], ['Viking', 1993, 1998, '#2b6a3e'], ['Simple Technology', 1994, 1999, '#2e6b3c'],
];
// [MB per modul, FPM från–till, EDO från–till]
const S72_CAPS = [[4, [1993, 1996], [1995, 1997]], [8, [1993, 1996], [1995, 1998]], [16, [1994, 1996], [1995, 1999]],
  [32, [1995, 1996], [1995, 1999]], [64, [0, 0], [1997, 1999]]];
SIMM72_BRANDS.forEach(([brand, a, b, pcb], bi) => {
  for (let y = a; y <= b; y++) {
    if ((y + bi) % 2 && y !== a) continue;
    for (const [cap, fpm, edo] of S72_CAPS) {
      for (const [kind, r] of [['FPM', fpm], ['EDO', edo]]) {
        if (y < r[0] || y > r[1]) continue;
        const speed = kind === 'FPM' ? (y <= 1994 ? '70ns' : '60ns') : (y <= 1996 ? '60ns' : '50ns');
        const packs = cap >= 32 || kind === 'FPM' ? [1] : [1, 2];
        for (const n of packs) {
          const mb = cap * n;
          const usd = mb * SIMM_USD_MB.SIMM72[y] * (kind === 'EDO' && y <= 1996 ? 1.08 : 1) * (cap >= 32 && y <= 1996 ? 1.15 : 1) + n * 4;
          add({ name: `${brand} ${cap}MB 72-pin ${kind} SIMM ${speed}${n > 1 ? ` (${n} st)` : ''}`, brand, type: 'SIMM72', year: y,
            until: Math.min(y + 3, r[1] + 1), mb, sticks: n, speed, cost: sek(usd, y), tier: tierFor(mb, y, kind === 'EDO' ? 0.2 : 0),
            look: { ...SIMM_GREEN, color: pcb } });
        }
      }
    }
  }
});

// ---------------------------------------------------------------------------
// DIMM-generationer: tabeller för hastigheter, satser och pris
// ---------------------------------------------------------------------------
// hastighet: [första år, sista år, prisfaktor]
const SPEEDS = {
  SDR: { PC66: [1997, 1999, 1], PC100: [1998, 2003, 1], PC133: [1999, 2003, 1.05] },
  DDR: { 'DDR-266': [2001, 2004, 1], 'DDR-333': [2002, 2006, 1], 'DDR-400': [2003, 2007, 1.05], 'DDR-433': [2003, 2005, 1.3], 'DDR-500': [2004, 2006, 1.5] },
  DDR2: { 'DDR2-400': [2004, 2006, 1], 'DDR2-533': [2004, 2008, 1], 'DDR2-667': [2005, 2010, 1], 'DDR2-800': [2006, 2011, 1.05],
    'DDR2-1066': [2006, 2010, 1.35], 'DDR2-1250': [2007, 2009, 1.8] },
  DDR3: { 'DDR3-1066': [2007, 2012, 1], 'DDR3-1333': [2007, 2017, 1], 'DDR3-1600': [2008, 2017, 1.05], 'DDR3-1800': [2008, 2011, 1.25],
    'DDR3-1866': [2010, 2017, 1.15], 'DDR3-2000': [2008, 2013, 1.4], 'DDR3-2133': [2010, 2017, 1.3], 'DDR3-2400': [2011, 2016, 1.45],
    'DDR3-2666': [2012, 2015, 1.7], 'DDR3-2800': [2013, 2015, 2] },
  DDR4: { 'DDR4-2133': [2014, 2020, 1], 'DDR4-2400': [2014, 2022, 1], 'DDR4-2666': [2014, 2025, 1.02], 'DDR4-2800': [2014, 2019, 1.08],
    'DDR4-3000': [2014, 2025, 1.08], 'DDR4-3200': [2015, 2025, 1.1], 'DDR4-3600': [2016, 2025, 1.25], 'DDR4-4000': [2016, 2025, 1.5],
    'DDR4-4400': [2018, 2022, 1.9], 'DDR4-4600': [2019, 2022, 2.1], 'DDR4-5000': [2020, 2022, 2.4] },
  DDR5: { 'DDR5-4800': [2021, 2026, 1], 'DDR5-5200': [2021, 2026, 1.03], 'DDR5-5600': [2022, 2026, 1.06], 'DDR5-6000': [2021, 2026, 1.12],
    'DDR5-6400': [2022, 2026, 1.25], 'DDR5-6800': [2022, 2026, 1.35], 'DDR5-7200': [2022, 2026, 1.5], 'DDR5-7600': [2023, 2026, 1.7],
    'DDR5-8000': [2023, 2026, 1.9], 'DDR5-8200': [2024, 2026, 2.1] },
};
// sats "NxM" (N moduler × M GB, "m" = MB): [första år, sista år]
const KITS = {
  SDR: { '1x16m': [1997, 1998], '1x32m': [1997, 2000], '1x64m': [1997, 2002], '1x128m': [1998, 2003], '1x256m': [1999, 2003],
    '1x512m': [2001, 2003], '2x128m': [1999, 2002], '2x256m': [2001, 2003] },
  DDR: { '1x256m': [2001, 2005], '1x512m': [2001, 2007], '1x1': [2003, 2007], '2x256m': [2003, 2005], '2x512m': [2003, 2007], '2x1': [2004, 2007] },
  DDR2: { '1x512m': [2004, 2008], '1x1': [2004, 2011], '2x512m': [2004, 2008], '2x1': [2005, 2011], '1x2': [2006, 2011], '2x2': [2006, 2011],
    '4x2': [2008, 2011] },
  DDR3: { '2x1': [2007, 2010], '1x2': [2008, 2014], '2x2': [2008, 2014], '3x1': [2008, 2009], '3x2': [2008, 2012], '3x4': [2010, 2012],
    '1x4': [2009, 2017], '2x4': [2009, 2017], '4x4': [2010, 2016], '1x8': [2011, 2017], '2x8': [2011, 2017], '4x8': [2012, 2017], '8x8': [2013, 2016] },
  DDR4: { '2x4': [2014, 2021], '4x4': [2014, 2018], '1x8': [2014, 2025], '2x8': [2014, 2025], '4x8': [2014, 2022], '1x16': [2016, 2025],
    '2x16': [2015, 2025], '4x16': [2016, 2024], '1x32': [2019, 2025], '2x32': [2018, 2025], '4x32': [2019, 2024] },
  DDR5: { '1x8': [2021, 2024], '2x8': [2021, 2024], '1x16': [2021, 2026], '2x16': [2021, 2026], '2x24': [2023, 2026], '2x32': [2021, 2026],
    '2x48': [2023, 2026], '4x16': [2022, 2025], '1x32': [2022, 2026], '1x48': [2023, 2026] },
};
// gatupris USD per MB för vanligt minne av typen, per år
const USD_MB = {
  SDR: { 1997: 4.5, 1998: 1.5, 1999: 1.4, 2000: 0.95, 2001: 0.18, 2002: 0.25, 2003: 0.25 },
  DDR: { 2001: 0.32, 2002: 0.28, 2003: 0.19, 2004: 0.18, 2005: 0.11, 2006: 0.1, 2007: 0.08 },
  DDR2: { 2004: 0.32, 2005: 0.16, 2006: 0.12, 2007: 0.05, 2008: 0.02, 2009: 0.017, 2010: 0.026, 2011: 0.022 },
  DDR3: { 2007: 0.25, 2008: 0.08, 2009: 0.03, 2010: 0.024, 2011: 0.0075, 2012: 0.0055, 2013: 0.0075, 2014: 0.0085, 2015: 0.0058,
    2016: 0.0042, 2017: 0.0085 },
  DDR4: { 2014: 0.015, 2015: 0.0068, 2016: 0.0045, 2017: 0.0092, 2018: 0.009, 2019: 0.0042, 2020: 0.0036, 2021: 0.0041, 2022: 0.0029,
    2023: 0.0019, 2024: 0.0017, 2025: 0.0025 },
  DDR5: { 2021: 0.0099, 2022: 0.0043, 2023: 0.0027, 2024: 0.0023, 2025: 0.0032, 2026: 0.0087 },
};
// typiska latenser (CL) per hastighet
const CL = {
  'DDR2-400': 'CL3', 'DDR2-533': 'CL4', 'DDR2-667': 'CL5', 'DDR2-800': 'CL5', 'DDR2-1066': 'CL5', 'DDR2-1250': 'CL5',
  'DDR3-1066': 'CL7', 'DDR3-1333': 'CL9', 'DDR3-1600': 'CL9', 'DDR3-1800': 'CL8', 'DDR3-1866': 'CL9', 'DDR3-2000': 'CL9',
  'DDR3-2133': 'CL9', 'DDR3-2400': 'CL10', 'DDR3-2666': 'CL11', 'DDR3-2800': 'CL12',
  'DDR4-2133': 'CL15', 'DDR4-2400': 'CL16', 'DDR4-2666': 'CL16', 'DDR4-2800': 'CL16', 'DDR4-3000': 'CL15', 'DDR4-3200': 'CL16',
  'DDR4-3600': 'CL18', 'DDR4-4000': 'CL19', 'DDR4-4400': 'CL19', 'DDR4-4600': 'CL19', 'DDR4-5000': 'CL19',
  'DDR5-4800': 'CL40', 'DDR5-5200': 'CL40', 'DDR5-5600': 'CL36', 'DDR5-6000': 'CL36', 'DDR5-6400': 'CL32', 'DDR5-6800': 'CL34',
  'DDR5-7200': 'CL34', 'DDR5-7600': 'CL36', 'DDR5-8000': 'CL38', 'DDR5-8200': 'CL40',
};
// när vanliga JEDEC-moduler (utan överklockningsprofil) fanns i den hastigheten
const JEDEC = { 'DDR3-1333': 2009, 'DDR3-1600': 2011, 'DDR4-2400': 2016, 'DDR4-2666': 2017, 'DDR4-3200': 2019, 'DDR5-5600': 2023 };
const gbStr = (v) => (v >= 1024 ? `${v / 1024}GB` : `${v}MB`);

// En produktserie → alla satser × hastigheter × färger som serien fanns i.
// s = { type, brand, line, years, speeds, kits, look:{color,accent,style}, colors?: [[namn, färg, accent, från, till]],
//       prem (prisfaktor), adj (segmentjustering), rgb, cl (sträng | {hastighet: CL} | false), life,
//       skip: ['2x8@DDR4-3200', '2x16@DDR5-6000@vit'] (varianter som redan finns som egna poster) }
function series(s) {
  const T = s.type;
  const colors = s.colors || [['', s.look.color, s.look.accent]];
  for (const sp of s.speeds) {
    const S = SPEEDS[T][sp];
    if (!S) throw new Error(`okänd hastighet ${sp}`);
    for (const k of s.kits) {
      const K = KITS[T][k];
      if (!K) throw new Error(`okänd sats ${T} ${k}`);
      const m = /^(\d+)x(\d+)(m?)$/.exec(k);
      const n = +m[1], per = m[3] ? +m[2] : +m[2] * 1024, mb = n * per;
      const y0 = Math.max(s.years[0], S[0], K[0], s.cl === false ? JEDEC[sp] || 0 : 0);
      const y1 = Math.min(s.years[1], S[1], K[1], END[T]);
      for (const [cn, c, a, cy0, cy1] of colors) {
        const y = Math.max(y0, cy0 ?? 0), yEnd = Math.min(y1, cy1 ?? 9999);
        if (y > yEnd) continue;
        if (s.skip && (s.skip.includes(`${k}@${sp}`) || s.skip.includes(`${k}@${sp}@${cn}`))) continue;
        let cl = '';
        if (typeof s.cl === 'string') cl = s.cl;
        else if (s.cl && s.cl[sp]) cl = s.cl[sp];
        else if (s.cl !== false && T !== 'SDR' && T !== 'DDR') cl = CL[sp] || '';
        const kitTxt = n > 1 ? ` (${n}x${gbStr(per)})` : '';
        const name = [s.brand, s.line].filter(Boolean).join(' ') + ' ' + gbStr(mb) + kitTxt + ' ' + sp + (cl ? ' ' + cl : '') + (cn ? ', ' + cn : '');
        const usd = mb * USD_MB[T][y] * (s.prem ?? 1) * S[2] * (s.rgb ? 1.12 : 1) + n * (s.base ?? 2);
        add({ name, brand: s.brand, type: T, year: y, until: Math.min(yEnd, y + (s.life ?? 4)), mb, sticks: n, speed: sp, cost: sek(usd, y),
          tier: tierFor(mb, y, (s.adj ?? 0) + (S[2] - 1) * 1.5), rgb: !!s.rgb, look: { color: c, accent: a, style: s.look.style } });
      }
    }
  }
}
const BARE = (color = '#2e6b3c', accent = '#1d1d20') => ({ color, accent, style: 'bare' });
const SPREAD = (color, accent) => ({ color, accent, style: 'spreader' });

// ---------------------------------------------------------------------------
// SDR – SDRAM DIMM PC66/PC100/PC133 (1997–2003)
// ---------------------------------------------------------------------------
const SDR_ALL = ['1x16m', '1x32m', '1x64m', '1x128m', '1x256m', '1x512m'];
[
  { brand: 'Kingston', line: '', years: [1997, 1998], speeds: ['PC66', 'PC100'], kits: SDR_ALL, look: BARE('#2f7a45') },
  { brand: 'Kingston', line: 'ValueRAM', years: [1999, 2003], speeds: ['PC100', 'PC133'], kits: SDR_ALL, look: BARE('#2f7a45'), prem: 0.95, adj: -0.3 },
  { brand: 'Crucial', line: '', years: [1997, 2003], speeds: ['PC66', 'PC100', 'PC133'], kits: SDR_ALL, look: BARE('#2e6b3c') },
  { brand: 'Samsung', line: '', years: [1997, 2003], speeds: ['PC66', 'PC100', 'PC133'], kits: ['1x32m', '1x64m', '1x128m', '1x256m'], look: BARE('#2a6438'), prem: 0.95, adj: -0.3 },
  { brand: 'Micron', line: '', years: [1997, 2002], speeds: ['PC66', 'PC100', 'PC133'], kits: ['1x32m', '1x64m', '1x128m', '1x256m'], look: BARE('#2f7040'), prem: 0.95, adj: -0.3 },
  { brand: 'Siemens', line: '', years: [1998, 1999], speeds: ['PC100'], kits: ['1x32m', '1x64m', '1x128m'], look: BARE('#2e6b3c'), prem: 0.95 },
  { brand: 'Infineon', line: '', years: [2000, 2003], speeds: ['PC133'], kits: ['1x128m', '1x256m', '1x512m'], look: BARE('#2e6b3c'), prem: 0.95, adj: -0.3 },
  { brand: 'Hyundai', line: '', years: [1998, 2000], speeds: ['PC100', 'PC133'], kits: ['1x32m', '1x64m', '1x128m'], look: BARE('#2a6438'), prem: 0.93, adj: -0.4 },
  { brand: 'Hynix', line: '', years: [2001, 2003], speeds: ['PC133'], kits: ['1x128m', '1x256m', '1x512m'], look: BARE('#2a6438'), prem: 0.93, adj: -0.4 },
  { brand: 'Corsair', line: '', years: [2000, 2003], speeds: ['PC133'], kits: ['1x128m', '1x256m', '1x512m', '2x256m'], look: BARE('#20508a'), prem: 1.45, adj: 0.7, cl: 'CAS2' },
  { brand: 'OCZ', line: '', years: [2001, 2003], speeds: ['PC133'], kits: ['1x256m', '1x512m'], look: SPREAD('#b87333', '#2a2a2a'), prem: 1.5, adj: 0.8, cl: 'CL2' },
  { brand: 'Mushkin', line: 'High Performance', years: [2000, 2002], speeds: ['PC133'], kits: ['1x128m', '1x256m', '2x128m'], look: SPREAD('#b8bcc0', '#1d4f91'), prem: 1.35, adj: 0.6, cl: 'CL2' },
  { brand: 'Kingmax', line: 'TinyBGA', years: [2000, 2002], speeds: ['PC133'], kits: ['1x128m', '1x256m'], look: BARE('#1f5a8a'), prem: 1.15, adj: 0.3 },
  { brand: 'PQI', line: '', years: [2001, 2003], speeds: ['PC133'], kits: ['1x256m', '1x512m'], look: BARE('#2e6b3c'), prem: 0.92, adj: -0.4 },
  { brand: 'TwinMOS', line: '', years: [2001, 2003], speeds: ['PC133'], kits: ['1x128m', '1x256m', '1x512m'], look: BARE('#2e6b3c'), prem: 0.92, adj: -0.4 },
].forEach((s) => series({ type: 'SDR', life: 3, ...s }));

// ---------------------------------------------------------------------------
// DDR – DDR-266/333/400 (2001–2007)
// ---------------------------------------------------------------------------
const HYPERX_BLUE = { color: '#1f4fa8', accent: '#c8ccd0', style: 'hyperx' };
[
  { brand: 'Kingston', line: 'ValueRAM', years: [2001, 2007], speeds: ['DDR-266', 'DDR-333', 'DDR-400'], kits: ['1x256m', '1x512m', '1x1'], look: BARE('#2f7a45'), prem: 0.95, adj: -0.3 },
  { brand: 'Kingston', line: 'HyperX', years: [2002, 2006], speeds: ['DDR-400', 'DDR-433', 'DDR-500'], kits: ['1x512m', '2x512m', '2x1'], look: HYPERX_BLUE, prem: 1.35, adj: 0.6 },
  { brand: 'Corsair', line: 'Value Select', years: [2004, 2007], speeds: ['DDR-333', 'DDR-400'], kits: ['1x256m', '1x512m', '1x1', '2x512m', '2x1'], look: BARE('#2e6b3c'), prem: 0.95, adj: -0.3 },
  { brand: 'Corsair', line: 'XMS', years: [2002, 2006], speeds: ['DDR-333', 'DDR-400', 'DDR-500'], kits: ['1x256m', '1x512m', '1x1'], look: SPREAD('#1c1c1e', '#c0c4c8'), prem: 1.3, adj: 0.5, cl: { 'DDR-333': 'CL2', 'DDR-400': 'CL2.5', 'DDR-500': 'CL3' } },
  { brand: 'Corsair', line: 'XMS TwinX', years: [2003, 2006], speeds: ['DDR-400', 'DDR-433', 'DDR-500'], kits: ['2x256m', '2x512m', '2x1'], look: SPREAD('#1c1c1e', '#c0c4c8'), prem: 1.45, adj: 0.7, cl: { 'DDR-400': 'CL2', 'DDR-433': 'CL2.5', 'DDR-500': 'CL3' } },
  { brand: 'OCZ', line: 'Platinum Rev. 2', years: [2004, 2006], speeds: ['DDR-400'], kits: ['2x512m', '2x1'], look: SPREAD('#c9ccd0', '#2a2a2a'), prem: 1.45, adj: 0.7, cl: 'CL2' },
  { brand: 'OCZ', line: 'Gold', years: [2004, 2006], speeds: ['DDR-400', 'DDR-433', 'DDR-500'], kits: ['1x512m', '2x512m', '2x1'], look: SPREAD('#c9a13a', '#2a2a2a'), prem: 1.35, adj: 0.6, cl: { 'DDR-400': 'CL2.5', 'DDR-433': 'CL2.5', 'DDR-500': 'CL3' } },
  { brand: 'Crucial', line: '', years: [2001, 2007], speeds: ['DDR-266', 'DDR-333', 'DDR-400'], kits: ['1x256m', '1x512m', '1x1'], look: BARE('#2e6b3c') },
  { brand: 'Crucial', line: 'Ballistix', years: [2004, 2007], speeds: ['DDR-400', 'DDR-500'], kits: ['1x512m', '2x512m', '2x1'], look: { color: '#2a2c30', accent: '#d8a23a', style: 'ballistix' }, prem: 1.4, adj: 0.7, cl: { 'DDR-400': 'CL2', 'DDR-500': 'CL3' } },
  { brand: 'Mushkin', line: 'Level II', years: [2003, 2005], speeds: ['DDR-400'], kits: ['1x512m', '2x512m'], look: SPREAD('#b8bcc0', '#1d4f91'), prem: 1.4, adj: 0.6, cl: 'CL2' },
  { brand: 'Mushkin', line: 'Redline', years: [2005, 2007], speeds: ['DDR-400', 'DDR-500'], kits: ['2x512m', '2x1'], look: SPREAD('#b3262e', '#1c1c1e'), prem: 1.5, adj: 0.8, cl: { 'DDR-400': 'CL2', 'DDR-500': 'CL3' } },
  { brand: 'GeIL', line: 'Golden Dragon', years: [2003, 2005], speeds: ['DDR-400'], kits: ['1x512m', '2x512m'], look: SPREAD('#c9a13a', '#8a2020'), prem: 1.25, adj: 0.5, cl: 'CL2.5' },
  { brand: 'GeIL', line: 'Ultra', years: [2004, 2006], speeds: ['DDR-400', 'DDR-500'], kits: ['2x512m', '2x1'], look: SPREAD('#c0c4c8', '#1c1c1e'), prem: 1.3, adj: 0.5, cl: { 'DDR-400': 'CL2', 'DDR-500': 'CL3' } },
  { brand: 'G.Skill', line: 'ZX', years: [2005, 2007], speeds: ['DDR-400'], kits: ['2x512m', '2x1'], look: SPREAD('#1c1c1e', '#8a9199'), prem: 1.3, adj: 0.5, cl: 'CL2' },
  { brand: 'G.Skill', line: '', years: [2004, 2007], speeds: ['DDR-400'], kits: ['1x512m', '1x1', '2x512m', '2x1'], look: BARE('#2a6438'), prem: 0.95, adj: -0.3 },
  { brand: 'TwinMOS', line: 'Twister', years: [2003, 2005], speeds: ['DDR-400'], kits: ['1x512m', '2x512m'], look: SPREAD('#c0c4c8', '#1f62b0'), prem: 1.2, adj: 0.4 },
  { brand: 'TwinMOS', line: '', years: [2002, 2006], speeds: ['DDR-333', 'DDR-400'], kits: ['1x256m', '1x512m'], look: BARE('#2e6b3c'), prem: 0.92, adj: -0.4 },
  { brand: 'A-DATA', line: 'Vitesta', years: [2004, 2007], speeds: ['DDR-400', 'DDR-500'], kits: ['1x512m', '1x1', '2x512m', '2x1'], look: SPREAD('#b8bcc0', '#1c1c1e'), prem: 1.15, adj: 0.3 },
  { brand: 'A-DATA', line: '', years: [2003, 2007], speeds: ['DDR-333', 'DDR-400'], kits: ['1x256m', '1x512m', '1x1'], look: BARE('#2a6438'), prem: 0.9, adj: -0.5 },
  { brand: 'PQI', line: 'Turbo', years: [2004, 2006], speeds: ['DDR-400', 'DDR-433'], kits: ['1x512m', '2x512m'], look: SPREAD('#c0c4c8', '#c9323a'), prem: 1.15, adj: 0.3 },
  { brand: 'PQI', line: '', years: [2002, 2006], speeds: ['DDR-333', 'DDR-400'], kits: ['1x256m', '1x512m'], look: BARE('#2e6b3c'), prem: 0.9, adj: -0.5 },
  { brand: 'Samsung', line: '', years: [2001, 2007], speeds: ['DDR-266', 'DDR-333', 'DDR-400'], kits: ['1x256m', '1x512m', '1x1'], look: BARE('#2a6438'), prem: 0.92, adj: -0.4 },
  { brand: 'Infineon', line: '', years: [2001, 2006], speeds: ['DDR-266', 'DDR-333', 'DDR-400'], kits: ['1x256m', '1x512m'], look: BARE('#2e6b3c'), prem: 0.92, adj: -0.4 },
  { brand: 'Hynix', line: '', years: [2001, 2007], speeds: ['DDR-266', 'DDR-400'], kits: ['1x256m', '1x512m', '1x1'], look: BARE('#2a6438'), prem: 0.9, adj: -0.5 },
].forEach((s) => series({ type: 'DDR', life: 3, ...s }));

// ---------------------------------------------------------------------------
// DDR2 – DDR2-400 … DDR2-1250 (2004–2011)
// ---------------------------------------------------------------------------
const DOM = (accent = '#b0b4b8', color = '#1d1d1f') => ({ color, accent, style: 'dominator' });
const BALL = (color, accent) => ({ color, accent, style: 'ballistix' });
[
  { brand: 'Kingston', line: 'ValueRAM', years: [2004, 2011], speeds: ['DDR2-533', 'DDR2-667', 'DDR2-800'], kits: ['1x512m', '1x1', '1x2'], look: BARE('#2f7a45'), prem: 0.95, adj: -0.3 },
  { brand: 'Kingston', line: 'HyperX', years: [2005, 2010], speeds: ['DDR2-667', 'DDR2-800', 'DDR2-1066'], kits: ['2x1', '2x2'], look: HYPERX_BLUE, prem: 1.35, adj: 0.6, cl: { 'DDR2-667': 'CL4', 'DDR2-800': 'CL4' } },
  { brand: 'Corsair', line: 'Value Select', years: [2004, 2011], speeds: ['DDR2-533', 'DDR2-667', 'DDR2-800'], kits: ['1x512m', '1x1', '2x1', '2x2'], look: BARE('#2e6b3c'), prem: 0.95, adj: -0.3 },
  { brand: 'Corsair', line: 'XMS2', years: [2004, 2011], speeds: ['DDR2-533', 'DDR2-667', 'DDR2-800'], kits: ['2x512m', '2x1', '2x2', '4x2'], skip: ['4x2@DDR2-533', '4x2@DDR2-667'], look: SPREAD('#1c1c1e', '#8a9199'), prem: 1.2, adj: 0.4, cl: { 'DDR2-533': 'CL3', 'DDR2-667': 'CL4' } },
  { brand: 'Corsair', line: 'XMS2 DHX', years: [2007, 2010], speeds: ['DDR2-800', 'DDR2-1066'], kits: ['2x1', '2x2'], look: SPREAD('#1c1c1e', '#c0c4c8'), prem: 1.35, adj: 0.6, cl: { 'DDR2-800': 'CL4' } },
  { brand: 'Corsair', line: 'Dominator', years: [2006, 2010], speeds: ['DDR2-800', 'DDR2-1066', 'DDR2-1250'], kits: ['2x1', '2x2', '4x2'], look: DOM(), prem: 1.7, adj: 1, cl: { 'DDR2-800': 'CL4' } },
  { brand: 'OCZ', line: 'Platinum', years: [2005, 2008], speeds: ['DDR2-667', 'DDR2-800'], kits: ['2x512m', '2x1', '2x2'], look: SPREAD('#c9ccd0', '#2a2a2a'), prem: 1.3, adj: 0.5, cl: 'CL4' },
  { brand: 'OCZ', line: 'Gold', years: [2005, 2007], speeds: ['DDR2-667', 'DDR2-800'], kits: ['2x512m', '2x1'], look: SPREAD('#c9a13a', '#2a2a2a'), prem: 1.25, adj: 0.4 },
  { brand: 'OCZ', line: 'SLI-Ready Edition', years: [2006, 2007], speeds: ['DDR2-800'], kits: ['2x1'], look: SPREAD('#1c1c1e', '#76b900'), prem: 1.4, adj: 0.6, cl: 'CL4' },
  { brand: 'OCZ', line: 'Reaper HPC', years: [2007, 2010], speeds: ['DDR2-800', 'DDR2-1066'], kits: ['2x1', '2x2'], look: SPREAD('#1c1c1e', '#b87333'), prem: 1.5, adj: 0.8, cl: { 'DDR2-800': 'CL4' } },
  { brand: 'OCZ', line: 'Flex XLC', years: [2007, 2009], speeds: ['DDR2-1066'], kits: ['2x1', '2x2'], look: SPREAD('#1c1c1e', '#b0b4b8'), prem: 1.8, adj: 1 },
  { brand: 'Crucial', line: '', years: [2004, 2011], speeds: ['DDR2-533', 'DDR2-667', 'DDR2-800'], kits: ['1x512m', '1x1', '1x2'], look: BARE('#2e6b3c') },
  { brand: 'Crucial', line: 'Ballistix', years: [2005, 2010], speeds: ['DDR2-667', 'DDR2-800', 'DDR2-1066'], kits: ['2x1', '2x2'], look: BALL('#2a2c30', '#d8a23a'), prem: 1.4, adj: 0.7, cl: { 'DDR2-667': 'CL3', 'DDR2-800': 'CL4' } },
  { brand: 'Crucial', line: 'Ballistix Tracer', years: [2006, 2009], speeds: ['DDR2-800', 'DDR2-1066'], kits: ['2x1', '2x2'], look: BALL('#1c1c1e', '#3aa0e0'), prem: 1.5, adj: 0.8, cl: { 'DDR2-800': 'CL4' } },
  { brand: 'Mushkin', line: 'XP2', years: [2006, 2008], speeds: ['DDR2-800'], kits: ['2x1'], look: SPREAD('#c0c4c8', '#1c1c1e'), prem: 1.35, adj: 0.6, cl: 'CL4' },
  { brand: 'Mushkin', line: 'Redline', years: [2006, 2009], speeds: ['DDR2-800', 'DDR2-1066'], kits: ['2x1', '2x2'], look: SPREAD('#b3262e', '#1c1c1e'), prem: 1.5, adj: 0.8, cl: { 'DDR2-800': 'CL4' } },
  { brand: 'G.Skill', line: 'HZ', years: [2006, 2008], speeds: ['DDR2-800'], kits: ['2x1'], look: SPREAD('#b8bcc0', '#1c1c1e'), prem: 1.15, adj: 0.3, cl: 'CL4' },
  { brand: 'G.Skill', line: 'PI', years: [2007, 2010], speeds: ['DDR2-800', 'DDR2-1066'], kits: ['2x1', '2x2'], look: SPREAD('#2a2c30', '#c9323a'), prem: 1.3, adj: 0.6, cl: { 'DDR2-800': 'CL4' } },
  { brand: 'G.Skill', line: 'NQ', years: [2007, 2011], speeds: ['DDR2-667', 'DDR2-800'], kits: ['2x1', '2x2'], look: BARE('#2a6438'), prem: 0.9, adj: -0.4 },
  { brand: 'GeIL', line: 'Ultra', years: [2005, 2008], speeds: ['DDR2-667', 'DDR2-800'], kits: ['2x512m', '2x1'], look: SPREAD('#c0c4c8', '#1c1c1e'), prem: 1.2, adj: 0.4, cl: 'CL4' },
  { brand: 'GeIL', line: 'Black Dragon', years: [2007, 2010], speeds: ['DDR2-800', 'DDR2-1066'], kits: ['2x1', '2x2'], look: SPREAD('#1c1c1e', '#8a2020'), prem: 1.2, adj: 0.4 },
  { brand: 'Patriot', line: 'Extreme Performance', years: [2006, 2009], speeds: ['DDR2-800', 'DDR2-1066'], kits: ['2x1', '2x2'], look: SPREAD('#1c1c1e', '#c9323a'), prem: 1.25, adj: 0.5, cl: { 'DDR2-800': 'CL4' } },
  { brand: 'Patriot', line: 'Viper', years: [2009, 2011], speeds: ['DDR2-800'], kits: ['2x2'], look: SPREAD('#1c1c1e', '#b3262e'), prem: 1.2, adj: 0.4, cl: 'CL4' },
  { brand: 'A-DATA', line: 'Vitesta', years: [2005, 2009], speeds: ['DDR2-667', 'DDR2-800'], kits: ['1x1', '2x1', '2x2'], look: SPREAD('#b8bcc0', '#1c1c1e'), prem: 1.1, adj: 0.2 },
  { brand: 'Team', line: 'Elite', years: [2007, 2011], speeds: ['DDR2-800'], kits: ['1x1', '1x2', '2x2'], look: BARE('#2a6438'), prem: 0.9, adj: -0.4 },
  { brand: 'Team', line: 'Xtreem Dark', years: [2008, 2010], speeds: ['DDR2-800', 'DDR2-1066'], kits: ['2x2'], look: SPREAD('#1c1c1e', '#4a4d52'), prem: 1.25, adj: 0.5, cl: { 'DDR2-800': 'CL4' } },
  { brand: 'Samsung', line: '', years: [2004, 2011], speeds: ['DDR2-533', 'DDR2-667', 'DDR2-800'], kits: ['1x512m', '1x1', '1x2'], look: BARE('#2a6438'), prem: 0.9, adj: -0.5 },
  { brand: 'Hynix', line: '', years: [2004, 2011], speeds: ['DDR2-533', 'DDR2-667', 'DDR2-800'], kits: ['1x1', '1x2'], look: BARE('#2a6438'), prem: 0.9, adj: -0.5 },
  { brand: 'Qimonda', line: '', years: [2006, 2009], speeds: ['DDR2-667', 'DDR2-800'], kits: ['1x1', '1x2'], look: BARE('#2e6b3c'), prem: 0.88, adj: -0.5 },
].forEach((s) => series({ type: 'DDR2', life: 3, ...s }));

// ---------------------------------------------------------------------------
// DDR3 – DDR3-1066 … DDR3-2800 (2007–2017)
// ---------------------------------------------------------------------------
const RED = '#b3262e', BLK = '#1c1c1e', WHT = '#e6e6e4', BLU = '#1f4fa8', GRY = '#8a9199';
[
  { brand: 'Kingston', line: 'ValueRAM', years: [2008, 2017], speeds: ['DDR3-1066', 'DDR3-1333', 'DDR3-1600'], kits: ['1x2', '1x4', '1x8'], look: BARE('#2f7a45'), prem: 0.95, adj: -0.3, cl: false },
  { brand: 'Kingston', line: 'HyperX', years: [2008, 2012], speeds: ['DDR3-1600', 'DDR3-1800', 'DDR3-2000'], kits: ['2x1', '2x2', '3x2', '2x4'], look: HYPERX_BLUE, prem: 1.35, adj: 0.6, cl: { 'DDR3-1600': 'CL8' } },
  { brand: 'Kingston', line: 'HyperX Genesis', years: [2011, 2013], speeds: ['DDR3-1600', 'DDR3-1866', 'DDR3-2133'], kits: ['2x4', '4x4', '2x8'], look: { color: '#5a5f66', accent: BLK, style: 'hyperx' }, prem: 1.2, adj: 0.4, cl: { 'DDR3-2133': 'CL11' } },
  { brand: 'Kingston', line: 'HyperX Beast', years: [2012, 2015], speeds: ['DDR3-1866', 'DDR3-2133', 'DDR3-2400'], kits: ['2x4', '2x8', '4x8'], look: { color: '#2a2c30', accent: RED, style: 'hyperx' }, prem: 1.35, adj: 0.7, cl: { 'DDR3-2133': 'CL11', 'DDR3-2400': 'CL11' } },
  { brand: 'Kingston', line: 'HyperX Fury', years: [2014, 2017], speeds: ['DDR3-1600', 'DDR3-1866'], kits: ['2x8'], look: { style: 'fury' }, prem: 1.05, cl: 'CL10',
    colors: [['svart', '#1e1e1e', '#c9323a'], ['blå', BLU, '#e0e0e0'], ['röd', RED, BLK], ['vit', WHT, BLK]] },
  { brand: 'Kingston', line: 'HyperX Savage', years: [2014, 2017], speeds: ['DDR3-1866', 'DDR3-2133', 'DDR3-2400'], kits: ['2x4', '2x8'], look: { color: RED, accent: BLK, style: 'hyperx' }, prem: 1.2, adj: 0.5, cl: { 'DDR3-2133': 'CL11', 'DDR3-2400': 'CL11' } },
  { brand: 'Kingston', line: 'HyperX Predator', years: [2013, 2017], speeds: ['DDR3-2133', 'DDR3-2400', 'DDR3-2666'], kits: ['2x4', '2x8', '4x8'], look: { color: BLK, accent: GRY, style: 'hyperx' }, prem: 1.4, adj: 0.8, cl: { 'DDR3-2133': 'CL11', 'DDR3-2400': 'CL11' } },
  { brand: 'Corsair', line: 'Value Select', years: [2008, 2017], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['1x2', '1x4', '1x8', '2x4'], look: BARE('#2e6b3c'), prem: 0.95, adj: -0.3, cl: false },
  { brand: 'Corsair', line: 'XMS3', years: [2008, 2015], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['2x2', '3x2', '2x4', '2x8'], look: SPREAD(BLK, '#3a7bd5'), prem: 1.1, adj: 0.2 },
  { brand: 'Corsair', line: 'Dominator', years: [2007, 2011], speeds: ['DDR3-1333', 'DDR3-1600', 'DDR3-1800', 'DDR3-2000'], kits: ['2x1', '2x2', '3x2'], look: DOM(), prem: 1.6, adj: 0.9, cl: { 'DDR3-1600': 'CL8' } },
  { brand: 'Corsair', line: 'Dominator GT', years: [2009, 2012], speeds: ['DDR3-2000', 'DDR3-2133', 'DDR3-2400'], kits: ['2x2', '3x2', '2x4'], look: DOM(RED), prem: 1.9, adj: 1.2, cl: { 'DDR3-2000': 'CL8' } },
  { brand: 'Corsair', line: 'Dominator Platinum', years: [2012, 2017], speeds: ['DDR3-1866', 'DDR3-2400', 'DDR3-2666'], kits: ['2x4', '2x8', '4x8'], look: DOM('#d0d4d8', '#2a2a2c'), prem: 1.8, adj: 1.1 },
  { brand: 'Corsair', line: 'Vengeance', years: [2011, 2017], speeds: ['DDR3-1600', 'DDR3-1866'], kits: ['2x4', '2x8'], look: { style: 'spreader' }, prem: 1.1, adj: 0.2,
    colors: [['blå', BLU, '#c8ccd0'], ['svart', BLK, GRY], ['röd', RED, BLK, 2012]] },
  { brand: 'Corsair', line: 'Vengeance Low Profile', years: [2012, 2016], speeds: ['DDR3-1600'], kits: ['2x4', '2x8'], look: { style: 'lpx' }, prem: 1.08, adj: 0.1,
    colors: [['svart', BLK, GRY], ['blå', BLU, '#c8ccd0'], ['röd', RED, BLK], ['vit', WHT, '#6a6f76'], ['gul', '#e8c030', BLK]] },
  { brand: 'Corsair', line: 'Vengeance Pro', years: [2013, 2017], speeds: ['DDR3-1866', 'DDR3-2400'], kits: ['2x4', '2x8'], look: { style: 'spreader' }, prem: 1.3, adj: 0.6,
    colors: [['silver', '#b8bcc0', BLK], ['röd', RED, BLK], ['blå', BLU, BLK], ['guld', '#c9a13a', BLK]] },
  { brand: 'G.Skill', line: 'Ripjaws', years: [2010, 2014], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['2x2', '2x4', '4x4'], look: { style: 'ripjaws' }, prem: 1.1, adj: 0.3, cl: { 'DDR3-1333': 'CL7' },
    colors: [['röd', RED, BLK], ['blå', BLU, BLK]] },
  { brand: 'G.Skill', line: 'Ripjaws X', years: [2011, 2017], speeds: ['DDR3-1600', 'DDR3-2133'], kits: ['2x4', '2x8'], look: { style: 'ripjaws' }, prem: 1.1, adj: 0.3,
    colors: [['röd', RED, BLK], ['blå', BLU, BLK], ['svart', BLK, GRY]] },
  { brand: 'G.Skill', line: 'Ripjaws Z', years: [2011, 2015], speeds: ['DDR3-1600', 'DDR3-2133', 'DDR3-2400'], kits: ['4x4', '4x8', '8x8'], look: { color: RED, accent: BLK, style: 'ripjaws' }, prem: 1.25, adj: 0.6, cl: { 'DDR3-2400': 'CL11' } },
  { brand: 'G.Skill', line: 'Sniper', years: [2011, 2015], speeds: ['DDR3-1600', 'DDR3-1866'], kits: ['2x4', '2x8'], look: SPREAD(BLK, '#c9323a'), prem: 1.05, adj: 0.1 },
  { brand: 'G.Skill', line: 'Trident', years: [2009, 2012], speeds: ['DDR3-2000', 'DDR3-2133', 'DDR3-2400'], kits: ['2x2', '3x2', '2x4'], look: { color: BLK, accent: RED, style: 'trident' }, prem: 1.7, adj: 1 },
  { brand: 'G.Skill', line: 'TridentX', years: [2012, 2017], speeds: ['DDR3-2133', 'DDR3-2400', 'DDR3-2666', 'DDR3-2800'], kits: ['2x4', '4x4', '2x8'], look: { color: BLK, accent: RED, style: 'trident' }, prem: 1.8, adj: 1.1 },
  { brand: 'G.Skill', line: 'Ares', years: [2012, 2016], speeds: ['DDR3-1600', 'DDR3-1866', 'DDR3-2133'], kits: ['2x4', '2x8'], look: SPREAD(BLK, '#e07a2e'), prem: 1.05, adj: 0.1 },
  { brand: 'Crucial', line: '', years: [2008, 2017], speeds: ['DDR3-1066', 'DDR3-1333', 'DDR3-1600'], kits: ['1x2', '1x4', '1x8'], look: BARE('#2e6b3c'), cl: false },
  { brand: 'Crucial', line: 'Ballistix', years: [2008, 2011], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['2x1', '2x2', '3x2'], look: BALL('#2a2c30', '#d8a23a'), prem: 1.4, adj: 0.7, cl: { 'DDR3-1333': 'CL7', 'DDR3-1600': 'CL8' } },
  { brand: 'Crucial', line: 'Ballistix Sport', years: [2011, 2017], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['1x4', '2x4', '1x8', '2x8'], look: BALL('#3a3d40', '#9aa0a6'), prem: 1.02 },
  { brand: 'Crucial', line: 'Ballistix Tactical', years: [2012, 2017], speeds: ['DDR3-1600', 'DDR3-1866'], kits: ['2x4', '2x8'], look: BALL(BLK, '#e8c030'), prem: 1.2, adj: 0.4, cl: { 'DDR3-1600': 'CL8' } },
  { brand: 'Crucial', line: 'Ballistix Elite', years: [2012, 2015], speeds: ['DDR3-1866', 'DDR3-2133'], kits: ['2x4', '2x8'], look: BALL('#4a4d52', '#e8c030'), prem: 1.35, adj: 0.6 },
  { brand: 'Patriot', line: 'Signature', years: [2010, 2017], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['1x4', '1x8'], look: BARE('#2a6438'), prem: 0.9, adj: -0.5, cl: false },
  { brand: 'Patriot', line: 'Viper II Sector 5', years: [2010, 2012], speeds: ['DDR3-1600', 'DDR3-2000'], kits: ['2x2', '2x4'], look: SPREAD(BLK, '#c9323a'), prem: 1.25, adj: 0.5, cl: { 'DDR3-1600': 'CL8' } },
  { brand: 'Patriot', line: 'Viper 3', years: [2012, 2016], speeds: ['DDR3-1600', 'DDR3-2133'], kits: ['2x4', '2x8'], look: { style: 'spreader' }, prem: 1.1, adj: 0.2,
    colors: [['Black Mamba', BLK, RED], ['Venom Red', RED, BLK]] },
  { brand: 'TeamGroup', line: 'Elite', years: [2010, 2017], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['1x4', '1x8'], look: BARE('#2a6438'), prem: 0.88, adj: -0.5, cl: false },
  { brand: 'TeamGroup', line: 'Vulcan', years: [2013, 2016], speeds: ['DDR3-1600', 'DDR3-1866', 'DDR3-2133'], kits: ['2x4', '2x8'], look: { style: 'spreader' }, prem: 1.05, adj: 0.1,
    colors: [['röd', RED, BLK], ['guld', '#c9a13a', BLK]] },
  { brand: 'ADATA', line: 'XPG Gaming', years: [2010, 2016], speeds: ['DDR3-1600', 'DDR3-2000', 'DDR3-2400'], kits: ['2x2', '2x4', '2x8'], look: SPREAD(RED, BLK), prem: 1.15, adj: 0.3 },
  { brand: 'ADATA', line: 'Premier', years: [2011, 2017], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['1x4', '1x8'], look: BARE('#2a6438'), prem: 0.88, adj: -0.5, cl: false },
  { brand: 'Mushkin', line: 'Blackline', years: [2011, 2015], speeds: ['DDR3-1600', 'DDR3-1866', 'DDR3-2133'], kits: ['2x4', '2x8'], look: SPREAD(BLK, '#4a4d52'), prem: 1.15, adj: 0.3 },
  { brand: 'Mushkin', line: 'Redline', years: [2010, 2015], speeds: ['DDR3-1600', 'DDR3-2133'], kits: ['2x4', '2x8'], look: SPREAD(RED, BLK), prem: 1.3, adj: 0.6, cl: { 'DDR3-1600': 'CL7' } },
  { brand: 'OCZ', line: 'Reaper HPC', years: [2008, 2010], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['2x1', '2x2', '3x2'], look: SPREAD(BLK, '#b87333'), prem: 1.5, adj: 0.8, cl: { 'DDR3-1333': 'CL7', 'DDR3-1600': 'CL7' } },
  { brand: 'OCZ', line: 'Platinum', years: [2007, 2010], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['2x1', '2x2', '3x2'], look: SPREAD('#c9ccd0', '#2a2a2a'), prem: 1.3, adj: 0.5 },
  { brand: 'OCZ', line: 'Gold', years: [2008, 2010], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['2x2', '3x2'], look: SPREAD('#c9a13a', '#2a2a2a'), prem: 1.2, adj: 0.4 },
  { brand: 'OCZ', line: 'Blade', years: [2009, 2011], speeds: ['DDR3-1600', 'DDR3-2000'], kits: ['2x2', '3x2'], look: SPREAD(BLK, '#c9323a'), prem: 1.6, adj: 0.9, cl: { 'DDR3-1600': 'CL7', 'DDR3-2000': 'CL8' } },
  { brand: 'GeIL', line: 'Black Dragon', years: [2008, 2011], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['2x2', '3x2'], look: SPREAD(BLK, '#8a2020'), prem: 1.15, adj: 0.3 },
  { brand: 'GeIL', line: 'EVO Corsa', years: [2012, 2015], speeds: ['DDR3-1866', 'DDR3-2133', 'DDR3-2400'], kits: ['2x4', '2x8'], look: SPREAD(BLK, '#c9a13a'), prem: 1.2, adj: 0.4 },
  { brand: 'GeIL', line: 'EVO Veloce', years: [2013, 2016], speeds: ['DDR3-1600', 'DDR3-1866', 'DDR3-2400'], kits: ['2x4', '2x8'], look: SPREAD(BLK, RED), prem: 1.15, adj: 0.3 },
  { brand: 'Samsung', line: '', years: [2008, 2017], speeds: ['DDR3-1066', 'DDR3-1333', 'DDR3-1600'], kits: ['1x2', '1x4', '1x8'], look: BARE('#2a6438'), prem: 0.9, adj: -0.5, cl: false },
  { brand: 'Samsung', line: '30nm Green', years: [2011, 2013], speeds: ['DDR3-1600'], kits: ['1x4', '2x4'], look: BARE('#2e8b3c'), prem: 0.95, adj: 0.2, cl: 'CL11' },
  { brand: 'Hynix', line: '', years: [2008, 2017], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['1x2', '1x4', '1x8'], look: BARE('#2a6438'), prem: 0.9, adj: -0.5, cl: false },
  { brand: 'Micron', line: '', years: [2008, 2016], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['1x4', '1x8'], look: BARE('#2f7040'), prem: 0.9, adj: -0.5, cl: false },
].forEach((s) => series({ type: 'DDR3', life: 3, ...s }));

// ---------------------------------------------------------------------------
// DDR4 – DDR4-2133 … DDR4-5000 (2014–2025)
// ---------------------------------------------------------------------------
const FURY = (color = '#1e1e1e', accent = '#c9323a') => ({ color, accent, style: 'fury' });
const RGBBAR = (color, accent) => ({ color, accent, style: 'rgbbar' });
const TRI = (color, accent) => ({ color, accent, style: 'trident' });
const ECC = { color: '#2e6b3c', accent: '#1d1d20', style: 'ecc' };
[
  // ECC-minne för arbetsstationer (DDR2/DDR3)
  { type: 'DDR2', brand: 'Kingston', line: 'ValueRAM ECC', years: [2006, 2011], speeds: ['DDR2-667', 'DDR2-800'], kits: ['1x1', '1x2'], look: ECC, prem: 1.3, adj: 0.2, cl: false },
  { type: 'DDR3', brand: 'Kingston', line: 'ValueRAM ECC', years: [2009, 2016], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['1x4', '1x8'], look: ECC, prem: 1.3, adj: 0.2, cl: false },
  { type: 'DDR3', brand: 'Samsung', line: 'ECC Registered', years: [2010, 2016], speeds: ['DDR3-1333', 'DDR3-1600'], kits: ['1x8'], look: { ...ECC, color: '#2a6438' }, prem: 1.4, adj: 0.3, cl: false },
].forEach((s) => series({ life: 4, ...s }));

const LPX_CL = { 'DDR4-2133': 'CL13', 'DDR4-2400': 'CL14', 'DDR4-2666': 'CL16', 'DDR4-3000': 'CL15', 'DDR4-3200': 'CL16', 'DDR4-3600': 'CL18', 'DDR4-4000': 'CL19' };
[
  { brand: 'Kingston', line: 'ValueRAM', years: [2014, 2025], speeds: ['DDR4-2133', 'DDR4-2400', 'DDR4-2666', 'DDR4-3200'], kits: ['1x8', '1x16', '1x32'], look: BARE('#2f7a45'), prem: 0.95, adj: -0.3, cl: false },
  { brand: 'Kingston', line: 'Server Premier ECC', years: [2018, 2025], speeds: ['DDR4-2666', 'DDR4-3200'], kits: ['1x16', '1x32'], look: ECC, prem: 1.3, adj: 0.3, cl: false },
  { brand: 'Samsung', line: 'ECC Registered', years: [2015, 2025], speeds: ['DDR4-2400', 'DDR4-2666', 'DDR4-3200'], kits: ['1x16', '1x32'], look: { ...ECC, color: '#2a6438' }, prem: 1.35, adj: 0.3, cl: false },
  { brand: 'Kingston', line: 'HyperX Fury', years: [2015, 2020], speeds: ['DDR4-2400', 'DDR4-3200'], kits: ['2x8', '2x16'], look: { style: 'fury' }, prem: 1.05, cl: { 'DDR4-2400': 'CL15', 'DDR4-3200': 'CL18' },
    colors: [['svart', '#1e1e1e', '#c9323a'], ['röd', RED, BLK], ['vit', WHT, BLK], ['blå', BLU, '#e0e0e0', 2015, 2016]] },
  { brand: 'Kingston', line: 'HyperX Fury RGB', years: [2019, 2020], speeds: ['DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16'], look: FURY(), rgb: true, prem: 1.1, adj: 0.2, cl: { 'DDR4-3600': 'CL17' } },
  { brand: 'Kingston', line: 'HyperX Savage', years: [2015, 2018], speeds: ['DDR4-2400', 'DDR4-2666', 'DDR4-3000'], kits: ['2x8', '4x8'], look: { color: RED, accent: BLK, style: 'hyperx' }, prem: 1.2, adj: 0.4, cl: { 'DDR4-2400': 'CL14', 'DDR4-2666': 'CL13' } },
  { brand: 'Kingston', line: 'HyperX Predator', years: [2014, 2020], speeds: ['DDR4-3000', 'DDR4-3200', 'DDR4-4000'], kits: ['2x8', '2x16'], look: { color: BLK, accent: GRY, style: 'hyperx' }, prem: 1.35, adj: 0.7, cl: { 'DDR4-2666': 'CL13', 'DDR4-3200': 'CL16' } },
  { brand: 'Kingston', line: 'HyperX Predator RGB', years: [2018, 2020], speeds: ['DDR4-3200', 'DDR4-3600', 'DDR4-4000'], kits: ['2x8', '2x16'], look: { color: BLK, accent: GRY, style: 'hyperx' }, rgb: true, prem: 1.4, adj: 0.8, cl: { 'DDR4-3600': 'CL17' } },
  { brand: 'Kingston', line: 'FURY Beast', years: [2021, 2025], speeds: ['DDR4-2666', 'DDR4-3200', 'DDR4-3600'], kits: ['1x8', '2x8', '1x16', '2x16', '2x32'], skip: ['1x8@DDR4-3200'], look: FURY(), prem: 1.05, cl: { 'DDR4-3600': 'CL17' } },
  { brand: 'Kingston', line: 'FURY Beast RGB', years: [2021, 2025], speeds: ['DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16', '2x32'], skip: ['2x8@DDR4-3200'], look: FURY(), rgb: true, prem: 1.08, cl: { 'DDR4-3600': 'CL17' } },
  { brand: 'Kingston', line: 'FURY Renegade', years: [2021, 2025], speeds: ['DDR4-3600', 'DDR4-4000'], kits: ['2x8', '2x16', '2x32'], look: FURY('#1e1e1e', '#b8bcc0'), prem: 1.3, adj: 0.6, cl: { 'DDR4-3600': 'CL16', 'DDR4-4000': 'CL18' } },
  { brand: 'Kingston', line: 'FURY Renegade RGB', years: [2021, 2025], speeds: ['DDR4-3600', 'DDR4-4000'], kits: ['2x8', '2x16'], look: FURY('#1e1e1e', '#b8bcc0'), rgb: true, prem: 1.35, adj: 0.7, cl: { 'DDR4-3600': 'CL16', 'DDR4-4000': 'CL18' } },
  { brand: 'Corsair', line: 'Vengeance LPX', years: [2014, 2025], speeds: ['DDR4-2400', 'DDR4-3000', 'DDR4-3200', 'DDR4-3600'], kits: ['2x4', '2x8', '2x16', '2x32'], skip: ['2x8@DDR4-3200'],
    look: { color: '#1b1b1b', accent: '#e8c030', style: 'lpx' }, prem: 1.05, cl: LPX_CL, life: 6 },
  { brand: 'Corsair', line: 'Vengeance LPX', years: [2015, 2020], speeds: ['DDR4-3000', 'DDR4-3200'], kits: ['2x8', '2x16'], look: { style: 'lpx' }, prem: 1.07, cl: LPX_CL,
    colors: [['röd', RED, BLK], ['vit', WHT, '#6a6f76', 2016, 2019], ['blå', BLU, '#c8ccd0', 2016, 2019]] },
  { brand: 'Corsair', line: 'Vengeance LED', years: [2016, 2019], speeds: ['DDR4-3000', 'DDR4-3200'], kits: ['2x8', '2x16'], look: { style: 'spreader' }, prem: 1.2, adj: 0.3, cl: LPX_CL,
    colors: [['röd LED', BLK, RED], ['vit LED', BLK, WHT], ['blå LED', BLK, '#3a7bd5']] },
  { brand: 'Corsair', line: 'Vengeance RGB', years: [2016, 2019], speeds: ['DDR4-3000', 'DDR4-3200'], kits: ['2x8', '4x8', '2x16'], look: { style: 'rgbbar' }, rgb: true, prem: 1.25, adj: 0.4, cl: LPX_CL,
    colors: [['svart', '#26282c', '#9aa0a6'], ['vit', '#e9e9e6', '#9aa0a6']] },
  { brand: 'Corsair', line: 'Vengeance RGB PRO', years: [2018, 2025], speeds: ['DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16', '2x32'], look: { style: 'rgbbar' }, rgb: true, prem: 1.2, adj: 0.3, cl: LPX_CL,
    colors: [['svart', '#26282c', '#9aa0a6'], ['vit', '#e9e9e6', '#9aa0a6', 2019]] },
  { brand: 'Corsair', line: 'Vengeance RGB PRO SL', years: [2021, 2025], speeds: ['DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16'], look: { style: 'rgbbar' }, rgb: true, prem: 1.2, adj: 0.3, cl: LPX_CL,
    colors: [['svart', '#26282c', '#9aa0a6'], ['vit', '#e9e9e6', '#9aa0a6']] },
  { brand: 'Corsair', line: 'Vengeance RGB RT', years: [2021, 2023], speeds: ['DDR4-3200', 'DDR4-3600', 'DDR4-4000'], kits: ['2x8', '2x16'], look: RGBBAR('#26282c', '#9aa0a6'), rgb: true, prem: 1.22, adj: 0.4, cl: { 'DDR4-3600': 'CL16' } },
  { brand: 'Corsair', line: 'Dominator Platinum', years: [2014, 2019], speeds: ['DDR4-2666', 'DDR4-3000', 'DDR4-3200'], kits: ['4x4', '2x8', '4x8', '2x16'], look: DOM('#d0d4d8', '#2a2a2c'), prem: 1.7, adj: 1, cl: { 'DDR4-2666': 'CL15' } },
  { brand: 'Corsair', line: 'Dominator Platinum RGB', years: [2018, 2025], speeds: ['DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16', '2x32'], look: { style: 'dominator' }, rgb: true, prem: 1.75, adj: 1.1, cl: { 'DDR4-3200': 'CL16' },
    colors: [['svart', '#2a2a2c', '#d0d4d8'], ['vit', '#e9e9e6', '#b8bcc0', 2020]] },
  { brand: 'G.Skill', line: 'Ripjaws 4', years: [2014, 2017], speeds: ['DDR4-2400', 'DDR4-2666'], kits: ['4x4', '4x8'], look: { style: 'ripjaws' }, prem: 1.1, adj: 0.3, cl: { 'DDR4-2400': 'CL15', 'DDR4-2666': 'CL15' },
    colors: [['röd', RED, BLK], ['blå', BLU, BLK], ['svart', BLK, GRY]] },
  { brand: 'G.Skill', line: 'Ripjaws V', years: [2015, 2025], speeds: ['DDR4-3000', 'DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16', '2x32'], look: { style: 'ripjaws' }, prem: 1.08, adj: 0.1,
    cl: { 'DDR4-2400': 'CL15', 'DDR4-3200': 'CL16', 'DDR4-3600': 'CL16', 'DDR4-4000': 'CL18' }, colors: [['Blazing Red', RED, BLK], ['Classic Black', BLK, GRY], ['Steel Blue', '#3a5a80', BLK, 2016, 2019]] },
  { brand: 'G.Skill', line: 'Trident Z', years: [2016, 2021], speeds: ['DDR4-3200', 'DDR4-3600', 'DDR4-4000', 'DDR4-4400'], kits: ['2x8', '2x16'], look: { style: 'trident' }, prem: 1.5, adj: 0.8,
    cl: { 'DDR4-3000': 'CL14', 'DDR4-3200': 'CL14', 'DDR4-3600': 'CL17' }, colors: [['silver/röd', '#b8bcc0', RED], ['svart/vit', BLK, WHT, 2016, 2019]] },
  { brand: 'G.Skill', line: 'Trident Z RGB', years: [2017, 2023], speeds: ['DDR4-3200', 'DDR4-3600', 'DDR4-4000'], kits: ['2x8', '2x16', '4x16', '2x32'], look: TRI('#b8bcc0', BLK), rgb: true, prem: 1.45, adj: 0.8,
    cl: { 'DDR4-3000': 'CL15', 'DDR4-3200': 'CL14', 'DDR4-3600': 'CL16' } },
  { brand: 'G.Skill', line: 'Trident Z Royal', years: [2019, 2023], speeds: ['DDR4-3600', 'DDR4-4000'], kits: ['2x8', '2x16'], look: { style: 'trident' }, rgb: true, prem: 1.9, adj: 1.2,
    cl: { 'DDR4-3200': 'CL16', 'DDR4-3600': 'CL16', 'DDR4-4000': 'CL18' }, colors: [['guld', '#c9a13a', BLK], ['silver', '#c8ccd0', BLK]] },
  { brand: 'G.Skill', line: 'Trident Z Neo', years: [2019, 2025], speeds: ['DDR4-3200', 'DDR4-3600', 'DDR4-4000'], kits: ['2x8', '2x16', '4x16', '2x32'], look: TRI(BLK, '#b8bcc0'), rgb: true, prem: 1.5, adj: 0.9,
    cl: { 'DDR4-3200': 'CL16', 'DDR4-3600': 'CL16', 'DDR4-4000': 'CL18' } },
  { brand: 'G.Skill', line: 'Flare X', years: [2017, 2023], speeds: ['DDR4-2400', 'DDR4-3200'], kits: ['2x8', '2x16'], look: SPREAD(BLK, GRY), prem: 1.25, adj: 0.4, cl: { 'DDR4-2400': 'CL15', 'DDR4-3200': 'CL14' } },
  { brand: 'G.Skill', line: 'Sniper X', years: [2016, 2020], speeds: ['DDR4-2400', 'DDR4-3000', 'DDR4-3200'], kits: ['2x8', '2x16'], look: { style: 'spreader' }, prem: 1.05, adj: 0.1,
    colors: [['Urban Camo', '#6a6f76', BLK], ['Digital Camo', '#4a5a3a', BLK]] },
  { brand: 'G.Skill', line: 'Aegis', years: [2016, 2025], speeds: ['DDR4-2666', 'DDR4-3200'], kits: ['1x8', '1x16', '2x8', '2x16'], look: SPREAD(BLK, RED), prem: 0.98, adj: -0.3 },
  { brand: 'Crucial', line: '', years: [2014, 2025], speeds: ['DDR4-2133', 'DDR4-2400', 'DDR4-2666', 'DDR4-3200'], kits: ['1x8', '1x16', '1x32'], look: BARE('#2e6b3c'), cl: false },
  { brand: 'Crucial', line: 'ECC UDIMM', years: [2017, 2025], speeds: ['DDR4-2666', 'DDR4-3200'], kits: ['1x16', '1x32'], look: ECC, prem: 1.3, adj: 0.3, cl: false },
  { brand: 'Crucial', line: 'Ballistix Sport LT', years: [2015, 2019], speeds: ['DDR4-2400', 'DDR4-3200'], kits: ['2x8', '2x16'], look: { style: 'ballistix' }, prem: 1, adj: 0,
    colors: [['grå', '#6a6f76', BLK], ['röd', RED, BLK], ['vit', WHT, '#6a6f76']] },
  { brand: 'Crucial', line: 'Ballistix Tactical', years: [2015, 2018], speeds: ['DDR4-2666', 'DDR4-3000'], kits: ['2x8', '4x8'], look: BALL(BLK, '#e8c030'), prem: 1.2, adj: 0.4 },
  { brand: 'Crucial', line: 'Ballistix Elite', years: [2015, 2019], speeds: ['DDR4-2666', 'DDR4-3000', 'DDR4-3200'], kits: ['2x8', '4x8', '2x16'], look: BALL('#2a2c30', '#c9a13a'), prem: 1.35, adj: 0.6 },
  { brand: 'Crucial', line: 'Ballistix', years: [2019, 2022], speeds: ['DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16', '2x32'], look: { style: 'ballistix' }, prem: 1.08, adj: 0.2, cl: { 'DDR4-3200': 'CL16', 'DDR4-3600': 'CL16' },
    colors: [['svart', BLK, '#9aa0a6'], ['röd', RED, BLK], ['vit', WHT, '#6a6f76']] },
  { brand: 'Crucial', line: 'Ballistix MAX', years: [2020, 2022], speeds: ['DDR4-4000', 'DDR4-4400', 'DDR4-5000'], kits: ['2x8', '2x16'], look: BALL('#3a3d40', '#d8dce0'), prem: 1.5, adj: 1, cl: { 'DDR4-4000': 'CL18', 'DDR4-4400': 'CL19', 'DDR4-5000': 'CL19' } },
  { brand: 'Crucial', line: 'Ballistix RGB', years: [2020, 2022], speeds: ['DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16'], look: { style: 'ballistix' }, rgb: true, prem: 1.15, adj: 0.3, cl: { 'DDR4-3600': 'CL16' },
    colors: [['svart', BLK, '#9aa0a6'], ['vit', WHT, '#6a6f76']] },
  { brand: 'Crucial', line: 'Pro', years: [2023, 2025], speeds: ['DDR4-3200'], kits: ['1x8', '2x8', '1x16', '2x16', '1x32', '2x32'], look: SPREAD('#2a2c30', GRY), prem: 1.05, cl: 'CL22' },
  { brand: 'TeamGroup', line: 'Elite', years: [2015, 2025], speeds: ['DDR4-2133', 'DDR4-2400', 'DDR4-2666', 'DDR4-3200'], kits: ['1x8', '1x16'], look: BARE('#2a6438'), prem: 0.9, adj: -0.5, cl: false },
  { brand: 'TeamGroup', line: 'T-Force Vulcan', years: [2017, 2020], speeds: ['DDR4-2400', 'DDR4-3000'], kits: ['2x8'], look: { style: 'spreader' }, prem: 1.02,
    colors: [['röd', RED, BLK], ['guld', '#c9a13a', BLK]] },
  { brand: 'TeamGroup', line: 'T-Force Vulcan Z', years: [2019, 2025], speeds: ['DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16', '2x32'], look: { style: 'spreader' }, prem: 1.0,
    colors: [['grå', '#6a6f76', BLK], ['röd', RED, BLK]] },
  { brand: 'TeamGroup', line: 'T-Force Night Hawk RGB', years: [2017, 2020], speeds: ['DDR4-3000', 'DDR4-3200'], kits: ['2x8'], look: RGBBAR('#2a2c30', '#8a9199'), rgb: true, prem: 1.2, adj: 0.3 },
  { brand: 'TeamGroup', line: 'T-Force Delta RGB', years: [2018, 2025], speeds: ['DDR4-3000', 'DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16'], look: { style: 'rgbbar' }, rgb: true, prem: 1.1, adj: 0.2,
    colors: [['svart', BLK, '#6a6f76'], ['vit', WHT, '#9aa0a6']] },
  { brand: 'TeamGroup', line: 'T-Force Xtreem ARGB', years: [2020, 2025], speeds: ['DDR4-3600', 'DDR4-4000'], kits: ['2x8', '2x16'], look: RGBBAR('#b8bcc0', BLK), rgb: true, prem: 1.4, adj: 0.7, cl: { 'DDR4-3600': 'CL14', 'DDR4-4000': 'CL18' } },
  { brand: 'TeamGroup', line: 'T-Force Dark Z', years: [2019, 2023], speeds: ['DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16'], look: SPREAD('#4a4d52', BLK), prem: 1.05, adj: 0.1 },
  { brand: 'Patriot', line: 'Signature', years: [2015, 2025], speeds: ['DDR4-2133', 'DDR4-2400', 'DDR4-2666', 'DDR4-3200'], kits: ['1x8', '1x16'], look: BARE('#2a6438'), prem: 0.9, adj: -0.5, cl: false },
  { brand: 'Patriot', line: 'Viper 4', years: [2016, 2020], speeds: ['DDR4-3000', 'DDR4-3200'], kits: ['2x8', '2x16'], look: SPREAD(BLK, RED), prem: 1.08, adj: 0.2 },
  { brand: 'Patriot', line: 'Viper Elite', years: [2016, 2022], speeds: ['DDR4-2400', 'DDR4-2666', 'DDR4-3000'], kits: ['2x8', '2x16'], look: SPREAD('#4a4d52', RED), prem: 1.0, adj: 0 },
  { brand: 'Patriot', line: 'Viper Steel', years: [2019, 2025], speeds: ['DDR4-3200', 'DDR4-3600', 'DDR4-4400'], kits: ['2x8', '2x16', '2x32'], look: SPREAD('#6a6f76', BLK), prem: 1.15, adj: 0.4 },
  { brand: 'Patriot', line: 'Viper 4 Blackout', years: [2019, 2025], speeds: ['DDR4-3000', 'DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16'], look: SPREAD(BLK, '#3a3d40'), prem: 1.05, adj: 0.1 },
  { brand: 'Patriot', line: 'Viper Steel RGB', years: [2021, 2024], speeds: ['DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16'], look: RGBBAR('#6a6f76', BLK), rgb: true, prem: 1.15, adj: 0.3 },
  { brand: 'ADATA', line: 'Premier', years: [2014, 2025], speeds: ['DDR4-2133', 'DDR4-2400', 'DDR4-2666', 'DDR4-3200'], kits: ['1x8', '1x16'], look: BARE('#2a6438'), prem: 0.88, adj: -0.5, cl: false },
  { brand: 'ADATA', line: 'XPG Z1', years: [2016, 2019], speeds: ['DDR4-2400', 'DDR4-3000', 'DDR4-3200'], kits: ['2x8', '2x16'], look: SPREAD(RED, BLK), prem: 1.15, adj: 0.3 },
  { brand: 'ADATA', line: 'XPG Spectrix D41', years: [2018, 2022], speeds: ['DDR4-3000', 'DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16'], look: RGBBAR('#4a4d52', BLK), rgb: true, prem: 1.15, adj: 0.3 },
  { brand: 'ADATA', line: 'XPG Spectrix D50', years: [2020, 2025], speeds: ['DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16', '2x32'], look: { style: 'rgbbar' }, rgb: true, prem: 1.15, adj: 0.3,
    colors: [['grå', '#6a6f76', BLK], ['vit', WHT, '#9aa0a6']] },
  { brand: 'ADATA', line: 'XPG Gammix D10', years: [2019, 2025], speeds: ['DDR4-3000', 'DDR4-3200'], kits: ['2x8', '2x16'], look: { style: 'spreader' }, prem: 1.0,
    colors: [['svart', BLK, '#6a6f76'], ['röd', RED, BLK]] },
  { brand: 'Mushkin', line: 'Blackline', years: [2015, 2020], speeds: ['DDR4-2400', 'DDR4-2666', 'DDR4-3000'], kits: ['2x8', '2x16'], look: SPREAD(BLK, '#4a4d52'), prem: 1.08, adj: 0.2 },
  { brand: 'Mushkin', line: 'Redline', years: [2016, 2025], speeds: ['DDR4-3200', 'DDR4-3600', 'DDR4-4000'], kits: ['2x8', '2x16', '2x32'], look: SPREAD(BLK, RED), prem: 1.2, adj: 0.4 },
  { brand: 'Mushkin', line: 'Essentials', years: [2016, 2025], speeds: ['DDR4-2400', 'DDR4-2666', 'DDR4-3200'], kits: ['1x8', '1x16'], look: BARE('#2a6438'), prem: 0.9, adj: -0.5, cl: false },
  { brand: 'GeIL', line: 'EVO Potenza', years: [2015, 2019], speeds: ['DDR4-2400', 'DDR4-3000', 'DDR4-3200'], kits: ['2x8', '2x16'], look: { style: 'spreader' }, prem: 1.05, adj: 0.1,
    colors: [['röd', RED, BLK], ['svart', BLK, '#6a6f76']] },
  { brand: 'GeIL', line: 'EVO X', years: [2017, 2020], speeds: ['DDR4-3000', 'DDR4-3200', 'DDR4-3600'], kits: ['2x8', '2x16'], look: RGBBAR(BLK, '#6a6f76'), rgb: true, prem: 1.2, adj: 0.3 },
  { brand: 'GeIL', line: 'Super Luce', years: [2016, 2019], speeds: ['DDR4-2400', 'DDR4-3000'], kits: ['2x8', '2x16'], look: SPREAD(BLK, '#3a7bd5'), prem: 1.1, adj: 0.2 },
  { brand: 'Samsung', line: '', years: [2014, 2025], speeds: ['DDR4-2133', 'DDR4-2400', 'DDR4-2666', 'DDR4-3200'], kits: ['1x8', '1x16', '1x32'], look: BARE('#2a6438'), prem: 0.9, adj: -0.5, cl: false },
  { brand: 'SK hynix', line: '', years: [2014, 2025], speeds: ['DDR4-2133', 'DDR4-2400', 'DDR4-2666', 'DDR4-3200'], kits: ['1x8', '1x16'], look: BARE('#2a6438'), prem: 0.88, adj: -0.5, cl: false },
  { brand: 'Micron', line: '', years: [2014, 2025], speeds: ['DDR4-2400', 'DDR4-2666', 'DDR4-3200'], kits: ['1x8', '1x16'], look: BARE('#2f7040'), prem: 0.88, adj: -0.5, cl: false },
].forEach((s) => series({ type: 'DDR4', life: 4, ...s }));

// ---------------------------------------------------------------------------
// DDR5 – DDR5-4800 … DDR5-8200 (2021–2026)
// ---------------------------------------------------------------------------
const Z5_CL = { 'DDR5-5600': 'CL36', 'DDR5-6000': 'CL30', 'DDR5-6400': 'CL32', 'DDR5-6800': 'CL34', 'DDR5-7200': 'CL34', 'DDR5-7600': 'CL36', 'DDR5-8000': 'CL38', 'DDR5-8200': 'CL40' };
const BEAST5_CL = { 'DDR5-4800': 'CL38', 'DDR5-5200': 'CL40', 'DDR5-5600': 'CL36', 'DDR5-6000': 'CL30', 'DDR5-6400': 'CL32' };
[
  { brand: 'Kingston', line: 'FURY Beast', years: [2021, 2026], speeds: ['DDR5-4800', 'DDR5-5200', 'DDR5-5600', 'DDR5-6000'], kits: ['2x8', '2x16', '2x32'], skip: ['2x8@DDR5-5200'],
    look: FURY(), prem: 1.05, cl: BEAST5_CL },
  { brand: 'Kingston', line: 'FURY Beast', years: [2023, 2026], speeds: ['DDR5-5600', 'DDR5-6000'], kits: ['2x16', '2x32'], look: FURY(WHT, '#9aa0a6'), prem: 1.07, cl: BEAST5_CL, colors: [['vit', WHT, '#9aa0a6']] },
  { brand: 'Kingston', line: 'FURY Beast RGB', years: [2021, 2026], speeds: ['DDR5-5200', 'DDR5-5600', 'DDR5-6000'], kits: ['2x16', '2x32'], look: { style: 'fury' }, rgb: true, prem: 1.08, cl: BEAST5_CL,
    colors: [['svart', '#1e1e1e', '#c9323a'], ['vit', WHT, '#9aa0a6', 2023]] },
  { brand: 'Kingston', line: 'FURY Renegade', years: [2022, 2026], speeds: ['DDR5-6000', 'DDR5-6400', 'DDR5-7200', 'DDR5-8000'], kits: ['2x16', '2x32', '2x48'], look: FURY('#8a9199', BLK), prem: 1.3, adj: 0.6,
    cl: { 'DDR5-6000': 'CL32', 'DDR5-7200': 'CL38', 'DDR5-8000': 'CL38' } },
  { brand: 'Kingston', line: 'FURY Renegade RGB', years: [2022, 2026], speeds: ['DDR5-6000', 'DDR5-6400', 'DDR5-7200'], kits: ['2x16', '2x32'], look: { style: 'fury' }, rgb: true, prem: 1.35, adj: 0.7,
    cl: { 'DDR5-6000': 'CL32', 'DDR5-7200': 'CL38' }, colors: [['silver/svart', '#8a9199', BLK], ['vit', WHT, '#9aa0a6', 2024]] },
  { brand: 'Kingston', line: 'Server Premier ECC', years: [2022, 2026], speeds: ['DDR5-4800', 'DDR5-5600'], kits: ['1x16', '1x32'], look: ECC, prem: 1.3, adj: 0.3, cl: false },
  { brand: 'Corsair', line: 'Vengeance', years: [2021, 2026], speeds: ['DDR5-4800', 'DDR5-5200', 'DDR5-5600', 'DDR5-6000'], kits: ['2x8', '2x16', '2x32', '2x48'], skip: ['2x16@DDR5-5200'],
    look: { color: '#26282c', accent: '#e8c030', style: 'lpx' }, prem: 1.05, cl: { 'DDR5-6000': 'CL30' } },
  { brand: 'Corsair', line: 'Vengeance', years: [2023, 2026], speeds: ['DDR5-5600', 'DDR5-6000'], kits: ['2x16', '2x32'], look: { style: 'lpx' }, prem: 1.07, cl: { 'DDR5-6000': 'CL30' }, colors: [['vit', '#e9e9e6', '#9aa0a6']] },
  { brand: 'Corsair', line: 'Vengeance RGB', years: [2022, 2026], speeds: ['DDR5-5600', 'DDR5-6000', 'DDR5-6400', 'DDR5-7200'], kits: ['2x16', '2x32', '2x48'],
    look: { style: 'rgbbar' }, rgb: true, prem: 1.15, adj: 0.2, cl: { 'DDR5-6000': 'CL30' }, colors: [['svart', '#26282c', '#9aa0a6']] },
  { brand: 'Corsair', line: 'Vengeance RGB', years: [2022, 2026], speeds: ['DDR5-5600', 'DDR5-6000'], kits: ['2x16', '2x32'], skip: ['2x16@DDR5-6000@vit'],
    look: { style: 'rgbbar' }, rgb: true, prem: 1.17, adj: 0.2, cl: { 'DDR5-6000': 'CL30' }, colors: [['vit', '#e9e9e6', '#9aa0a6']] },
  { brand: 'Corsair', line: 'Dominator Platinum RGB', years: [2021, 2026], speeds: ['DDR5-5200', 'DDR5-5600', 'DDR5-6000', 'DDR5-6400', 'DDR5-7200'], kits: ['2x16', '2x32'], look: { style: 'dominator' }, rgb: true, prem: 1.6, adj: 1,
    cl: { 'DDR5-6000': 'CL30' }, colors: [['svart', '#2a2a2c', '#d0d4d8']] },
  { brand: 'Corsair', line: 'Dominator Platinum RGB', years: [2022, 2026], speeds: ['DDR5-5600', 'DDR5-6000'], kits: ['2x16', '2x32'], look: { style: 'dominator' }, rgb: true, prem: 1.62, adj: 1,
    cl: { 'DDR5-6000': 'CL30' }, colors: [['vit', '#e9e9e6', '#b8bcc0']] },
  { brand: 'Corsair', line: 'Dominator Titanium RGB', years: [2023, 2026], speeds: ['DDR5-6000', 'DDR5-6400', 'DDR5-7200'], kits: ['2x16', '2x32', '2x48'], look: { style: 'dominator' }, rgb: true, prem: 1.8, adj: 1.2,
    cl: { 'DDR5-6000': 'CL30' }, colors: [['svart', '#2a2a2c', '#c9ccd0']] },
  { brand: 'Corsair', line: 'Dominator Titanium RGB', years: [2023, 2026], speeds: ['DDR5-6000', 'DDR5-6400'], kits: ['2x16', '2x32'], look: { style: 'dominator' }, rgb: true, prem: 1.82, adj: 1.2,
    cl: { 'DDR5-6000': 'CL30' }, colors: [['vit', '#e9e9e6', '#c9ccd0']] },
  { brand: 'G.Skill', line: 'Trident Z5', years: [2021, 2026], speeds: ['DDR5-5600', 'DDR5-6000', 'DDR5-6400'], kits: ['2x16', '2x32'], look: { style: 'trident' }, prem: 1.3, adj: 0.5, cl: Z5_CL,
    colors: [['silver', '#bfc4c9', '#222222'], ['svart', BLK, '#6a6f76']] },
  { brand: 'G.Skill', line: 'Trident Z5 RGB', years: [2021, 2026], speeds: ['DDR5-5600', 'DDR5-6000', 'DDR5-6400', 'DDR5-7200', 'DDR5-8000'], kits: ['2x16', '2x32'], skip: ['2x32@DDR5-6000'],
    look: TRI('#bfc4c9', '#222222'), rgb: true, prem: 1.35, adj: 0.6, cl: Z5_CL, colors: [['silver', '#bfc4c9', '#222222']] },
  { brand: 'G.Skill', line: 'Trident Z5 RGB', years: [2022, 2026], speeds: ['DDR5-6000', 'DDR5-6400', 'DDR5-7200', 'DDR5-8200'], kits: ['2x16', '2x24', '2x48'], look: TRI(BLK, '#6a6f76'), rgb: true, prem: 1.35, adj: 0.6, cl: Z5_CL,
    colors: [['svart', BLK, '#6a6f76']] },
  { brand: 'G.Skill', line: 'Trident Z5 Neo', years: [2022, 2026], speeds: ['DDR5-6000'], kits: ['2x16', '2x32'], look: TRI(BLK, '#8a9199'), prem: 1.3, adj: 0.5, cl: 'CL30' },
  { brand: 'G.Skill', line: 'Trident Z5 Neo RGB', years: [2022, 2026], speeds: ['DDR5-6000', 'DDR5-6400'], kits: ['2x16', '2x24', '2x32', '2x48'], look: TRI(BLK, '#8a9199'), rgb: true, prem: 1.35, adj: 0.6, cl: Z5_CL },
  { brand: 'G.Skill', line: 'Trident Z5 Royal', years: [2023, 2026], speeds: ['DDR5-6400', 'DDR5-8000'], kits: ['2x16', '2x32'], look: { style: 'trident' }, rgb: true, prem: 1.8, adj: 1.1, cl: Z5_CL,
    colors: [['guld', '#c9a13a', BLK], ['silver', '#c8ccd0', BLK]] },
  { brand: 'G.Skill', line: 'Ripjaws S5', years: [2022, 2026], speeds: ['DDR5-5600', 'DDR5-6000', 'DDR5-6400'], kits: ['2x16', '2x24', '2x32', '2x48'], look: { color: BLK, accent: '#6a6f76', style: 'ripjaws' }, prem: 1.08, cl: Z5_CL },
  { brand: 'G.Skill', line: 'Ripjaws S5', years: [2022, 2026], speeds: ['DDR5-6000', 'DDR5-6400'], kits: ['2x16', '2x32'], look: { style: 'ripjaws' }, prem: 1.1, cl: Z5_CL, colors: [['vit', WHT, '#9aa0a6']] },
  { brand: 'G.Skill', line: 'Ripjaws M5 RGB', years: [2023, 2026], speeds: ['DDR5-5600', 'DDR5-6000', 'DDR5-6400'], kits: ['2x16', '2x32'], look: { style: 'ripjaws' }, rgb: true, prem: 1.15, adj: 0.2, cl: Z5_CL,
    colors: [['svart', BLK, '#6a6f76'], ['vit', WHT, '#9aa0a6']] },
  { brand: 'G.Skill', line: 'Flare X5', years: [2022, 2026], speeds: ['DDR5-5600', 'DDR5-6000'], kits: ['2x16', '2x24', '2x32', '2x48'], look: SPREAD(BLK, GRY), prem: 1.1, adj: 0.1, cl: Z5_CL },
  { brand: 'Crucial', line: '', years: [2021, 2026], speeds: ['DDR5-4800', 'DDR5-5600'], kits: ['1x8', '1x16', '1x32', '1x48', '2x16', '2x32'], look: BARE('#2e6b3c'), cl: false },
  { brand: 'Crucial', line: 'Pro', years: [2023, 2026], speeds: ['DDR5-5600', 'DDR5-6000'], kits: ['2x16', '2x24', '2x32', '2x48'], look: SPREAD('#2a2c30', GRY), prem: 1.05, cl: { 'DDR5-5600': 'CL46', 'DDR5-6000': 'CL48' } },
  { brand: 'Crucial', line: 'Pro Overclocking', years: [2024, 2026], speeds: ['DDR5-6000', 'DDR5-6400'], kits: ['2x16', '2x32'], look: { style: 'spreader' }, prem: 1.12, adj: 0.2, cl: { 'DDR5-6000': 'CL36', 'DDR5-6400': 'CL38' },
    colors: [['svart', '#2a2c30', GRY], ['vit', WHT, '#9aa0a6']] },
  { brand: 'TeamGroup', line: 'T-Force Delta RGB', years: [2021, 2026], speeds: ['DDR5-6000', 'DDR5-6400', 'DDR5-7200'], kits: ['2x16', '2x32'], look: { style: 'rgbbar' }, rgb: true, prem: 1.1, adj: 0.2, cl: Z5_CL,
    colors: [['svart', BLK, '#6a6f76'], ['vit', WHT, '#9aa0a6']] },
  { brand: 'TeamGroup', line: 'T-Force Vulcan', years: [2022, 2026], speeds: ['DDR5-5200', 'DDR5-5600', 'DDR5-6000'], kits: ['2x16', '2x32'], look: { style: 'spreader' }, prem: 1.0, cl: Z5_CL,
    colors: [['svart', BLK, '#6a6f76'], ['röd', RED, BLK]] },
  { brand: 'TeamGroup', line: 'T-Create Expert', years: [2022, 2026], speeds: ['DDR5-6000', 'DDR5-6400', 'DDR5-7200'], kits: ['2x16', '2x32'], look: SPREAD('#2a2c30', '#6a6f76'), prem: 1.1, adj: 0.2, cl: Z5_CL },
  { brand: 'TeamGroup', line: 'T-Force Xtreem', years: [2024, 2026], speeds: ['DDR5-7600', 'DDR5-8000', 'DDR5-8200'], kits: ['2x16', '2x24'], look: SPREAD('#b8bcc0', BLK), prem: 1.4, adj: 0.8, cl: Z5_CL },
  { brand: 'Patriot', line: 'Signature', years: [2022, 2026], speeds: ['DDR5-4800', 'DDR5-5600'], kits: ['1x16', '1x32'], look: BARE('#2a6438'), prem: 0.9, adj: -0.5, cl: false },
  { brand: 'Patriot', line: 'Viper Venom', years: [2022, 2026], speeds: ['DDR5-5600', 'DDR5-6000', 'DDR5-6400', 'DDR5-7200'], kits: ['2x16', '2x32'], look: SPREAD(BLK, RED), prem: 1.05, cl: Z5_CL },
  { brand: 'Patriot', line: 'Viper Venom RGB', years: [2022, 2026], speeds: ['DDR5-5600', 'DDR5-6000', 'DDR5-6400'], kits: ['2x16', '2x32'], look: RGBBAR(BLK, RED), rgb: true, prem: 1.1, adj: 0.2, cl: Z5_CL },
  { brand: 'Patriot', line: 'Viper Xtreme 5 RGB', years: [2023, 2026], speeds: ['DDR5-7600', 'DDR5-8000', 'DDR5-8200'], kits: ['2x16', '2x24'], look: RGBBAR('#4a4d52', RED), rgb: true, prem: 1.45, adj: 0.9, cl: Z5_CL },
  { brand: 'ADATA', line: 'XPG Lancer', years: [2022, 2026], speeds: ['DDR5-5200', 'DDR5-6000'], kits: ['2x16', '2x32'], look: SPREAD(BLK, '#6a6f76'), prem: 1.02, cl: Z5_CL },
  { brand: 'ADATA', line: 'XPG Lancer RGB', years: [2022, 2026], speeds: ['DDR5-6000', 'DDR5-6400', 'DDR5-7200'], kits: ['2x16', '2x32'], look: { style: 'rgbbar' }, rgb: true, prem: 1.1, adj: 0.2, cl: Z5_CL,
    colors: [['svart', BLK, '#6a6f76'], ['vit', WHT, '#9aa0a6']] },
  { brand: 'ADATA', line: 'XPG Lancer Blade', years: [2023, 2026], speeds: ['DDR5-5600', 'DDR5-6000', 'DDR5-6400'], kits: ['2x16', '2x24', '2x32'], look: SPREAD(BLK, '#3a3d40'), prem: 1.0, cl: Z5_CL },
  { brand: 'ADATA', line: 'XPG Lancer Blade RGB', years: [2023, 2026], speeds: ['DDR5-6000', 'DDR5-6400'], kits: ['2x16', '2x32'], look: RGBBAR(BLK, '#3a3d40'), rgb: true, prem: 1.08, adj: 0.1, cl: Z5_CL },
  { brand: 'ADATA', line: 'XPG Caster RGB', years: [2022, 2025], speeds: ['DDR5-6000', 'DDR5-6400', 'DDR5-7200'], kits: ['2x16'], look: RGBBAR('#4a4d52', BLK), rgb: true, prem: 1.2, adj: 0.4, cl: Z5_CL },
  { brand: 'Lexar', line: 'ARES RGB', years: [2023, 2026], speeds: ['DDR5-6000', 'DDR5-6400', 'DDR5-6800'], kits: ['2x16', '2x24'], look: RGBBAR(BLK, '#6a6f76'), rgb: true, prem: 1.05, adj: 0.1, cl: Z5_CL },
  { brand: 'Samsung', line: '', years: [2021, 2026], speeds: ['DDR5-4800', 'DDR5-5600'], kits: ['1x8', '1x16', '1x32'], look: BARE('#2a6438'), prem: 0.9, adj: -0.5, cl: false },
  { brand: 'SK hynix', line: '', years: [2021, 2026], speeds: ['DDR5-4800', 'DDR5-5600'], kits: ['1x16', '1x32'], look: BARE('#2a6438'), prem: 0.88, adj: -0.5, cl: false },
  { brand: 'Micron', line: '', years: [2021, 2026], speeds: ['DDR5-4800', 'DDR5-5600'], kits: ['1x16', '1x32'], look: BARE('#2f7040'), prem: 0.88, adj: -0.5, cl: false },
].forEach((s) => series({ type: 'DDR5', life: 4, ...s }));

// ---------------------------------------------------------------------------
// Delar från den ursprungliga katalogen (samma id, namn och utseende)
// ---------------------------------------------------------------------------
const legacyCost = (type, speed, mb, sticks, y, prem, rgb) =>
  sek(mb * USD_MB[type][y] * prem * SPEEDS[type][speed][2] * (rgb ? 1.12 : 1) + sticks * 2, y);
[
  ['fury-8-ddr4', 'Kingston FURY Beast 8GB DDR4', 'Kingston', 'DDR4', 'DDR4-3200', 8192, 1, 2021, 2025, 1, 1, false, { color: '#1e1e1e', accent: '#c9323a', style: 'fury' }, 1.05],
  ['lpx-16-ddr4', 'Corsair Vengeance LPX 16GB DDR4', 'Corsair', 'DDR4', 'DDR4-3200', 16384, 2, 2015, 2025, 2, 1, false, { color: '#1b1b1b', accent: '#e8c030', style: 'lpx' }, 1.05],
  ['fury-rgb-16-ddr4', 'Kingston FURY Beast RGB 16GB DDR4', 'Kingston', 'DDR4', 'DDR4-3200', 16384, 2, 2021, 2025, 2, 2, true, { color: '#1e1e1e', accent: '#c9323a', style: 'fury' }, 1.08],
  ['fury-16-ddr5', 'Kingston FURY Beast 16GB DDR5', 'Kingston', 'DDR5', 'DDR5-5200', 16384, 2, 2021, 2024, 3, 3, false, { color: '#1e1e1e', accent: '#c9323a', style: 'fury' }, 1.05],
  ['vengeance-32-ddr5', 'Corsair Vengeance 32GB DDR5', 'Corsair', 'DDR5', 'DDR5-5200', 32768, 2, 2021, 2026, 4, 3, false, { color: '#26282c', accent: '#e8c030', style: 'lpx' }, 1.05],
  ['vengeance-rgb-32-ddr5', 'Corsair Vengeance RGB 32GB DDR5', 'Corsair', 'DDR5', 'DDR5-6000', 32768, 2, 2022, 2026, 4, 4, true, { color: '#e9e9e6', accent: '#9aa0a6', style: 'rgbbar' }, 1.15],
  ['tridentz5-64-ddr5', 'G.Skill Trident Z5 RGB 64GB DDR5', 'G.Skill', 'DDR5', 'DDR5-6000', 65536, 2, 2022, 2026, 5, 5, true, { color: '#bfc4c9', accent: '#222222', style: 'trident' }, 1.35],
].forEach(([id, name, brand, type, speed, mb, sticks, year, until, tier, lvl, rgb, look, prem]) => {
  add({ id, name, brand, type, speed, mb, sticks, year, until, tier, lvl, rgb, look, cost: legacyCost(type, speed, mb, sticks, year, prem, rgb) });
});

export default P;
