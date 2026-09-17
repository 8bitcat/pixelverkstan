// Chassifläktar 1997–2026 (80/92/120/140 mm). Priser = ungefärligt svenskt
// butikspris lanseringsåret (USD-gatupris × SEK_PER_USD × 1,25).
import { SEK_PER_USD } from './canon.js';

const P = [];
const IDS = new Set();
const slug = (s) => s.toLowerCase().replace(/!/g, '').replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
const rnd = (v) => (v < 100 ? Math.max(5, Math.round(v)) : v < 1000 ? Math.round(v / 5) * 5 : Math.round(v / 10) * 10);
const sek = (usd, y) => rnd(usd * SEK_PER_USD[y] * 1.25);

function add(o) {
  const id = o.id || 'fans-' + slug(o.name);
  if (IDS.has(id)) throw new Error(`dubblett ${id}`);
  IDS.add(id);
  const part = { id, cat: 'fans', name: o.name, brand: o.brand, year: o.year, until: o.until, cost: o.cost, tier: o.tier,
    rgb: !!o.rgb, count: o.count, size: o.size, look: { frame: o.frame, blade: o.blade } };
  if (o.lvl) part.lvl = o.lvl;
  P.push(part);
}

// Färger (ram, blad)
const BLK = ['#1a1a1a', '#262626'];
const BLKW = ['#1a1a1a', '#e9e9e9'];            // svart ram, vita/genomskinliga blad (RGB)
const WHT = ['#ececea', '#f5f5f5'];
const NOCTUA = ['#d8c7a7', '#8a4b34'];
const CHROMAX = ['#1a1a1a', '#1d1d1d'];
const REDUX = ['#6a6d70', '#8a8d90'];
const BLUELED = ['#2f5f9e', '#5a8fd0'];

// [tillverkare, namn, storlek, år, sista år, USD styck, tier, { rgb, look: [ram, blad], packs, colors }]
// packs: 1 = styck, 'N' (sträng) = tillverkarens N-pack "(N-pack)", tal > 1 = N lösa fläktar "(N st)"
// colors: [[namn, [ram, blad]]] → en variant per färg
const F = [
  // --- 1997–2006: OEM-fläktar och tidiga tysta fläktar ---
  ['Papst', 'Papst 8412 NGL 80mm', 80, 1997, 2006, 16, 3, { look: BLK, packs: [1, 2] }],
  ['Papst', 'Papst 3412 NGL 92mm', 92, 1998, 2006, 17, 3, { look: BLK }],
  ['Papst', 'Papst 4312 120mm', 120, 1998, 2004, 18, 3, { look: BLK }],
  ['ebm-papst', 'ebm-papst 8412 N/2GLE 80mm', 80, 2004, 2012, 17, 3, { look: BLK }],
  ['ebm-papst', 'ebm-papst 4412 F/2GLL 120mm', 120, 2004, 2014, 20, 4, { look: BLK }],
  ['Sunon', 'Sunon KD1208PTB1 80mm', 80, 1997, 2004, 7, 1, { look: BLK, packs: [1, 2] }],
  ['Sunon', 'Sunon MagLev 80mm', 80, 2001, 2008, 8, 2, { look: BLK }],
  ['Sunon', 'Sunon MagLev 92mm', 92, 2002, 2008, 9, 2, { look: BLK }],
  ['Sunon', 'Sunon MagLev 120mm', 120, 2003, 2010, 11, 2, { look: BLK }],
  ['Delta', 'Delta FFB0812EHE 80mm', 80, 1998, 2006, 12, 3, { look: BLK }],
  ['Delta', 'Delta AFB1212SH 120mm', 120, 2002, 2010, 14, 3, { look: BLK }],
  ['Panasonic', 'Panasonic Panaflo FBA08A12L 80mm', 80, 1998, 2006, 9, 2, { look: BLK, packs: [1, 2] }],
  ['Panasonic', 'Panasonic Panaflo FBA12G12L 120mm', 120, 2001, 2007, 12, 3, { look: BLK }],
  ['Antec', 'Antec 80mm Case Fan', 80, 1998, 2004, 6, 1, { look: BLK, packs: [1, 2] }],
  ['Antec', 'Antec SmartCool 80mm', 80, 2002, 2006, 12, 2, { look: BLK }],
  ['Antec', 'Antec Blue LED 80mm', 80, 2002, 2007, 8, 2, { look: BLUELED }],
  ['Antec', 'Antec TriCool 80mm', 80, 2005, 2010, 9, 2, { look: BLK }],
  ['Antec', 'Antec TriCool 92mm', 92, 2005, 2010, 10, 2, { look: BLK }],
  ['Antec', 'Antec TriCool 120mm', 120, 2005, 2012, 11, 2, { look: BLK, packs: [1, 2] }],
  ['Antec', 'Antec TriCool 120mm Blue LED', 120, 2006, 2012, 13, 2, { look: BLUELED }],
  ['Antec', 'Antec TwoCool 120mm', 120, 2009, 2014, 9, 1, { look: BLK }],
  ['Antec', 'Antec TwoCool 140mm', 140, 2009, 2014, 11, 2, { look: BLK }],
  ['Enermax', 'Enermax UC-8EB 80mm', 80, 2003, 2007, 12, 3, { look: BLK }],
  ['Enermax', 'Enermax UC-12EB 120mm', 120, 2004, 2008, 15, 3, { look: BLK }],
  ['Enermax', 'Enermax Magma 120mm', 120, 2007, 2012, 16, 3, { look: ['#1a1a1a', '#3a3d40'] }],
  ['Enermax', 'Enermax Cluster 120mm', 120, 2008, 2012, 17, 3, { look: ['#1a1a1a', '#c9c9c9'] }],
  ['Enermax', 'Enermax T.B.Silence 80mm', 80, 2009, 2014, 10, 2, { look: BLK }],
  ['Enermax', 'Enermax T.B.Silence 120mm', 120, 2009, 2018, 13, 3, { look: BLK, packs: [1, 3] }],
  ['Enermax', 'Enermax T.B.Silence 140mm', 140, 2010, 2018, 15, 3, { look: BLK }],
  ['Enermax', 'Enermax T.B.Apollish 120mm', 120, 2010, 2014, 15, 3, { look: BLUELED }],
  ['Enermax', 'Enermax T.B.RGB 120mm', 120, 2017, 2021, 20, 3, { rgb: true, look: BLKW, packs: [1, '3'] }],
  ['Zalman', 'Zalman ZM-F1 80mm', 80, 2003, 2008, 8, 1, { look: BLK }],
  ['Zalman', 'Zalman ZM-F2 92mm', 92, 2003, 2008, 9, 1, { look: BLK }],
  ['Zalman', 'Zalman ZM-F3 120mm', 120, 2004, 2012, 10, 2, { look: BLK }],
  ['Vantec', 'Vantec Tornado 80mm', 80, 2002, 2007, 14, 3, { look: BLK }],
  ['Vantec', 'Vantec Stealth 80mm', 80, 2003, 2010, 9, 2, { look: BLK, packs: [1, 2] }],
  ['Vantec', 'Vantec Stealth 120mm', 120, 2004, 2010, 12, 2, { look: BLK }],
  ['Nexus', 'Nexus Real Silent 80mm', 80, 2004, 2010, 11, 3, { look: BLK }],
  ['Nexus', 'Nexus Real Silent 120mm', 120, 2004, 2012, 14, 3, { look: BLK }],
  ['Yate Loon', 'Yate Loon D12SL-12 120mm', 120, 2004, 2012, 5, 1, { look: BLK, packs: [1, 2] }],
  ['Thermaltake', 'Thermaltake Thunderblade 80mm', 80, 2003, 2007, 10, 2, { look: BLUELED }],
  ['Cooler Master', 'Cooler Master Blue LED 80mm', 80, 2003, 2009, 6, 1, { look: BLUELED, packs: [1, 2] }],

  // --- Arctic Cooling / ARCTIC ---
  ['Arctic Cooling', 'Arctic Cooling Arctic Fan 8', 80, 2004, 2009, 6, 1, { look: BLK }],
  ['Arctic Cooling', 'Arctic Cooling Arctic Fan 12', 120, 2004, 2010, 7, 1, { look: BLK }],
  ['Arctic Cooling', 'Arctic Cooling Arctic Fan 8 PWM', 80, 2006, 2011, 7, 1, { look: BLK }],
  ['Arctic Cooling', 'Arctic Cooling Arctic Fan 12 PWM', 120, 2006, 2011, 8, 2, { look: BLK }],
  ['ARCTIC', 'ARCTIC F8', 80, 2010, 2016, 5, 1, { look: BLK }],
  ['ARCTIC', 'ARCTIC F9', 92, 2011, 2017, 6, 1, { look: BLK }],
  ['ARCTIC', 'ARCTIC F12', 120, 2010, 2018, 6, 1, { look: BLK }],
  ['ARCTIC', 'ARCTIC F14', 140, 2011, 2018, 8, 1, { look: BLK }],
  ['ARCTIC', 'ARCTIC F12 PWM PST', 120, 2012, 2019, 7, 1, { look: BLK, packs: [1, '5'] }],
  ['ARCTIC', 'ARCTIC F14 PWM PST', 140, 2012, 2019, 9, 1, { look: BLK }],
  ['ARCTIC', 'ARCTIC BioniX F120', 120, 2015, 2019, 15, 2, { look: ['#1a1a1a', '#c9323a'] }],
  ['ARCTIC', 'ARCTIC BioniX F140', 140, 2015, 2019, 17, 2, { look: ['#1a1a1a', '#c9323a'] }],
  ['ARCTIC', 'ARCTIC P8 PWM PST', 80, 2019, 2026, 6, 1, { look: ['#1d1d1d', '#2a2a2a'] }],
  ['ARCTIC', 'ARCTIC P12 PWM PST', 120, 2019, 2026, 8, 1, { look: ['#1d1d1d', '#2a2a2a'], packs: [1, '5'] }],
  ['ARCTIC', 'ARCTIC P14 PWM PST', 140, 2019, 2026, 10, 1, { look: ['#1d1d1d', '#2a2a2a'], packs: [1, '5'] }],
  ['ARCTIC', 'ARCTIC P12 PWM PST A-RGB 0dB', 120, 2021, 2026, 12, 2, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['ARCTIC', 'ARCTIC P14 PWM PST A-RGB 0dB', 140, 2021, 2026, 14, 2, { rgb: true, look: BLKW, packs: [1, '3'] }],
  ['ARCTIC', 'ARCTIC P12 Slim PWM PST', 120, 2023, 2026, 8, 1, { look: BLK }],
  ['ARCTIC', 'ARCTIC P12 Max', 120, 2023, 2026, 11, 2, { look: BLK, packs: [1, '5'] }],
  ['ARCTIC', 'ARCTIC P12 Pro', 120, 2024, 2026, 11, 2, { look: BLK, packs: [1, '3'] }],
  ['ARCTIC', 'ARCTIC P14 Pro', 140, 2024, 2026, 13, 2, { look: BLK, packs: [1, '3'] }],

  // --- Scythe ---
  ['Scythe', 'Scythe S-Flex 120mm', 120, 2006, 2013, 14, 3, { look: ['#1a1a1a', '#d8d8d8'] }],
  ['Scythe', 'Scythe Kaze Maru 140mm', 140, 2007, 2011, 15, 3, { look: BLK }],
  ['Scythe', 'Scythe Slip Stream 120mm', 120, 2008, 2016, 9, 2, { look: BLK, packs: [1, 3] }],
  ['Scythe', 'Scythe Slip Stream 140mm', 140, 2009, 2015, 11, 2, { look: BLK }],
  ['Scythe', 'Scythe Gentle Typhoon 120mm', 120, 2009, 2014, 20, 4, { look: ['#1a1a1a', '#3a3d40'] }],
  ['Scythe', 'Scythe Kaze Flex 120 PWM', 120, 2017, 2023, 11, 2, { look: BLK }],
  ['Scythe', 'Scythe Kaze Flex 140 PWM', 140, 2017, 2023, 13, 2, { look: BLK }],
  ['Scythe', 'Scythe Kaze Flex II 120 PWM', 120, 2023, 2026, 12, 2, { look: BLK, packs: [1, 3] }],
  ['Scythe', 'Scythe Kaze Flex II 120 RGB PWM', 120, 2023, 2026, 14, 2, { rgb: true, look: BLKW }],

  // --- Noctua ---
  ['Noctua', 'Noctua NF-S12-1200', 120, 2005, 2008, 20, 4, { look: NOCTUA }],
  ['Noctua', 'Noctua NF-S12B FLX', 120, 2008, 2012, 20, 4, { look: NOCTUA }],
  ['Noctua', 'Noctua NF-R8', 80, 2008, 2014, 16, 3, { look: NOCTUA }],
  ['Noctua', 'Noctua NF-B9', 92, 2008, 2014, 18, 4, { look: NOCTUA }],
  ['Noctua', 'Noctua NF-P12', 120, 2008, 2016, 20, 4, { look: NOCTUA, packs: [1, 2] }],
  ['Noctua', 'Noctua NF-P14 FLX', 140, 2008, 2015, 23, 4, { look: NOCTUA }],
  ['Noctua', 'Noctua NF-F12 PWM', 120, 2011, 2026, 22, 4, { look: NOCTUA, packs: [1, 3] }],
  ['Noctua', 'Noctua NF-A14 PWM', 140, 2012, 2026, 25, 4, { look: NOCTUA, packs: [1, 3] }],
  ['Noctua', 'Noctua NF-S12A PWM', 120, 2012, 2026, 20, 4, { look: NOCTUA }],
  ['Noctua', 'Noctua NF-A8 PWM', 80, 2013, 2026, 17, 3, { look: NOCTUA }],
  ['Noctua', 'Noctua NF-A9 PWM', 92, 2014, 2026, 19, 3, { look: NOCTUA }],
  ['Noctua', 'Noctua NF-P12 redux-1700 PWM', 120, 2016, 2026, 14, 3, { look: REDUX, packs: [1, 3] }],
  ['Noctua', 'Noctua NF-P14s redux-1200', 140, 2016, 2026, 15, 3, { look: REDUX }],
  ['Noctua', 'Noctua NF-A12x25 PWM', 120, 2018, 2026, 30, 4, { look: NOCTUA }],
  ['Noctua', 'Noctua NF-F12 PWM chromax.black.swap', 120, 2018, 2026, 25, 4, { look: CHROMAX, packs: [1, 3] }],
  ['Noctua', 'Noctua NF-A14 PWM chromax.black.swap', 140, 2019, 2026, 28, 4, { look: CHROMAX, packs: [1, 3] }],
  ['Noctua', 'Noctua NF-A12x25 PWM chromax.black.swap', 120, 2020, 2026, 33, 5, { look: CHROMAX, packs: [1, 3] }],
  ['Noctua', 'Noctua NF-A12x25 G2 PWM', 120, 2024, 2026, 40, 5, { look: NOCTUA, packs: [1, 2] }],
  ['Noctua', 'Noctua NF-A14x25 G2 PWM', 140, 2025, 2026, 43, 5, { look: NOCTUA }],

  // --- be quiet! ---
  ['be quiet!', 'be quiet! Silent Wings 120mm', 120, 2008, 2012, 20, 4, { look: BLK }],
  ['be quiet!', 'be quiet! Pure Wings 120mm', 120, 2009, 2014, 8, 2, { look: BLK }],
  ['be quiet!', 'be quiet! Shadow Wings 120mm', 120, 2012, 2017, 13, 3, { look: BLK }],
  ['be quiet!', 'be quiet! Silent Wings 2 120mm', 120, 2013, 2016, 22, 4, { look: BLK }],
  ['be quiet!', 'be quiet! Silent Wings 2 140mm', 140, 2013, 2016, 24, 4, { look: BLK }],
  ['be quiet!', 'be quiet! Pure Wings 2 80mm', 80, 2014, 2024, 8, 1, { look: BLK }],
  ['be quiet!', 'be quiet! Pure Wings 2 92mm', 92, 2014, 2024, 9, 1, { look: BLK }],
  ['be quiet!', 'be quiet! Pure Wings 2 120mm', 120, 2014, 2024, 10, 2, { look: BLK, packs: [1, 3] }],
  ['be quiet!', 'be quiet! Pure Wings 2 140mm', 140, 2014, 2024, 12, 2, { look: BLK }],
  ['be quiet!', 'be quiet! Silent Wings 3 120mm PWM', 120, 2016, 2022, 22, 4, { look: BLK, packs: [1, 3] }],
  ['be quiet!', 'be quiet! Silent Wings 3 140mm PWM', 140, 2016, 2022, 24, 4, { look: BLK }],
  ['be quiet!', 'be quiet! Shadow Wings 2 120mm PWM', 120, 2017, 2025, 15, 3, { look: BLK, colors: [['svart', BLK], ['vit', WHT]] }],
  ['be quiet!', 'be quiet! Shadow Wings 2 140mm PWM', 140, 2017, 2025, 17, 3, { look: BLK }],
  ['be quiet!', 'be quiet! Light Wings 120mm PWM', 120, 2021, 2026, 22, 3, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['be quiet!', 'be quiet! Light Wings 140mm PWM', 140, 2021, 2026, 24, 3, { rgb: true, look: BLKW, packs: [1, '3'] }],
  ['be quiet!', 'be quiet! Silent Wings 4 120mm PWM', 120, 2022, 2026, 24, 4, { look: BLK }],
  ['be quiet!', 'be quiet! Silent Wings 4 140mm PWM', 140, 2022, 2026, 26, 4, { look: BLK }],
  ['be quiet!', 'be quiet! Silent Wings Pro 4 120mm', 120, 2022, 2026, 30, 5, { look: BLK }],
  ['be quiet!', 'be quiet! Silent Wings Pro 4 140mm', 140, 2022, 2026, 32, 5, { look: BLK }],
  ['be quiet!', 'be quiet! Light Wings LX 120mm PWM', 120, 2024, 2026, 25, 4, { rgb: true, look: BLKW, packs: ['3'] }],
  ['be quiet!', 'be quiet! Pure Wings 3 120mm PWM', 120, 2024, 2026, 12, 2, { look: BLK, packs: [1, 3] }],
  ['be quiet!', 'be quiet! Pure Wings 3 140mm PWM', 140, 2024, 2026, 14, 2, { look: BLK }],

  // --- Corsair ---
  ['Corsair', 'Corsair Air Series AF120 Quiet Edition', 120, 2013, 2019, 15, 3, { look: BLK, packs: [1, '2'] }],
  ['Corsair', 'Corsair Air Series AF140 Quiet Edition', 140, 2013, 2019, 17, 3, { look: BLK }],
  ['Corsair', 'Corsair Air Series SP120 Performance Edition', 120, 2013, 2019, 15, 3, { look: BLK, packs: [1, '2'] }],
  ['Corsair', 'Corsair Air Series SP120 LED', 120, 2014, 2018, 18, 3, { look: ['#1a1a1a', '#d8d8d8'] }],
  ['Corsair', 'Corsair ML120', 120, 2016, 2023, 25, 3, { look: BLK, packs: [1, '2'] }],
  ['Corsair', 'Corsair ML140', 140, 2016, 2023, 28, 3, { look: BLK, packs: [1, '2'] }],
  ['Corsair', 'Corsair SP120 RGB', 120, 2017, 2019, 25, 3, { rgb: true, look: BLKW, packs: ['3'] }],
  ['Corsair', 'Corsair ML120 PRO RGB', 120, 2017, 2021, 35, 4, { rgb: true, look: BLKW, packs: [1, '3'] }],
  ['Corsair', 'Corsair LL120 RGB', 120, 2017, 2023, 40, 4, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['Corsair', 'Corsair LL140 RGB', 140, 2017, 2023, 45, 4, { rgb: true, look: BLKW, packs: [1, '2'] }],
  ['Corsair', 'Corsair SP120 RGB PRO', 120, 2019, 2021, 30, 3, { rgb: true, look: BLKW, packs: ['3'] }],
  ['Corsair', 'Corsair QL120 RGB', 120, 2019, 2025, 42, 4, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['Corsair', 'Corsair QL140 RGB', 140, 2019, 2025, 45, 4, { rgb: true, look: BLKW, packs: [1, '2'] }],
  ['Corsair', 'Corsair iCUE SP120 RGB ELITE', 120, 2020, 2025, 23, 2, { rgb: true, look: ['#161616', '#e9e9e9'], packs: [1] }],
  ['Corsair', 'Corsair iCUE SP140 RGB ELITE', 140, 2020, 2025, 25, 2, { rgb: true, look: ['#161616', '#e9e9e9'], packs: [1, '2'] }],
  ['Corsair', 'Corsair AF120 ELITE', 120, 2021, 2025, 17, 3, { look: BLK, packs: [1, '3'], colors: [['svart', BLK], ['vit', WHT]] }],
  ['Corsair', 'Corsair iCUE AF120 RGB ELITE', 120, 2021, 2025, 25, 3, { rgb: true, look: BLKW, packs: [1, '3'] }],
  ['Corsair', 'Corsair iCUE LINK QX120 RGB', 120, 2023, 2026, 45, 5, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['Corsair', 'Corsair iCUE LINK QX140 RGB', 140, 2023, 2026, 50, 5, { rgb: true, look: BLKW, packs: [1, '2'] }],
  ['Corsair', 'Corsair iCUE LINK RX120 RGB', 120, 2024, 2026, 35, 4, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['Corsair', 'Corsair iCUE LINK RX140 RGB', 140, 2024, 2026, 38, 4, { rgb: true, look: BLKW, packs: [1, '2'] }],
  ['Corsair', 'Corsair iCUE LINK RX120', 120, 2024, 2026, 25, 3, { look: BLK, packs: [1, '3'] }],
  ['Corsair', 'Corsair RS120', 120, 2024, 2026, 15, 2, { look: BLK, packs: [1, '3'] }],

  // --- Cooler Master ---
  ['Cooler Master', 'Cooler Master SickleFlow 120', 120, 2009, 2019, 7, 1, { look: BLK }],
  ['Cooler Master', 'Cooler Master SickleFlow 120 Blue LED', 120, 2009, 2019, 8, 1, { look: BLUELED }],
  ['Cooler Master', 'Cooler Master SickleFlow 92', 92, 2010, 2018, 6, 1, { look: BLK }],
  ['Cooler Master', 'Cooler Master MasterFan Pro 120 Air Flow', 120, 2016, 2019, 15, 3, { look: BLK }],
  ['Cooler Master', 'Cooler Master MasterFan MF120L RGB', 120, 2016, 2021, 9, 1, { rgb: true, look: BLKW, packs: [1, '3'] }],
  ['Cooler Master', 'Cooler Master MasterFan MF120R ARGB', 120, 2018, 2021, 15, 2, { rgb: true, look: BLKW, packs: ['3'] }],
  ['Cooler Master', 'Cooler Master SickleFlow 120 ARGB', 120, 2019, 2022, 12, 2, { rgb: true, look: BLKW, packs: ['3'] }],
  ['Cooler Master', 'Cooler Master SickleFlow 120 V2 RGB', 120, 2020, 2025, 10, 1, { rgb: true, look: BLKW, packs: [1, '3'] }],
  ['Cooler Master', 'Cooler Master MasterFan MF120 Halo', 120, 2020, 2025, 20, 3, { rgb: true, look: CHROMAX, packs: [1, '3'] }],
  ['Cooler Master', 'Cooler Master MasterFan MF140 Halo', 140, 2021, 2025, 23, 3, { rgb: true, look: CHROMAX }],
  ['Cooler Master', 'Cooler Master Mobius 120', 120, 2023, 2026, 23, 4, { look: BLK, packs: [1, '3'] }],
  ['Cooler Master', 'Cooler Master Mobius 140', 140, 2023, 2026, 25, 4, { look: BLK }],

  // --- Lian Li ---
  ['Lian Li', 'Lian Li UNI FAN SL120', 120, 2020, 2022, 30, 3, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['Lian Li', 'Lian Li UNI FAN SL140', 140, 2020, 2022, 35, 3, { rgb: true, look: BLKW, packs: [1, '2'] }],
  ['Lian Li', 'Lian Li UNI FAN LL120 RGB', 120, 2021, 2025, 33, 3, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['Lian Li', 'Lian Li UNI FAN AL120 RGB', 120, 2021, 2025, 30, 3, { rgb: true, look: BLKW, packs: [1, '3'] }],
  ['Lian Li', 'Lian Li UNI FAN SL120 V2 RGB', 120, 2022, 2026, 32, 3, { rgb: true, look: WHT, packs: [1], colors: [['vit', WHT]] }],
  ['Lian Li', 'Lian Li UNI FAN SL120 V2 RGB', 120, 2022, 2026, 32, 3, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW]] }],
  ['Lian Li', 'Lian Li UNI FAN SL140 V2 RGB', 140, 2022, 2026, 36, 3, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['Lian Li', 'Lian Li UNI FAN P28', 120, 2022, 2026, 22, 3, { rgb: true, look: ['#1a1a1a', '#2a2a2a'], packs: [1, '3'], colors: [['svart', ['#1a1a1a', '#2a2a2a']], ['vit', WHT]] }],
  ['Lian Li', 'Lian Li UNI FAN SL-INF 120', 120, 2022, 2026, 38, 4, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['Lian Li', 'Lian Li UNI FAN TL 120', 120, 2023, 2026, 35, 4, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['Lian Li', 'Lian Li UNI FAN TL LCD 120', 120, 2024, 2026, 60, 5, { rgb: true, look: BLKW, packs: ['3'], colors: [['svart', BLKW], ['vit', WHT]] }],

  // --- Phanteks ---
  ['Phanteks', 'Phanteks PH-F140SP', 140, 2014, 2020, 15, 3, { look: BLK }],
  ['Phanteks', 'Phanteks PH-F120MP', 120, 2016, 2021, 13, 2, { look: BLK, packs: [1, '3'] }],
  ['Phanteks', 'Phanteks PH-F140MP', 140, 2016, 2021, 15, 2, { look: BLK }],
  ['Phanteks', 'Phanteks T30-120', 120, 2021, 2026, 30, 5, { look: ['#2a2c30', '#2e3034'], packs: [1, '3'] }],
  ['Phanteks', 'Phanteks D30-120 DRGB', 120, 2022, 2026, 25, 4, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['Phanteks', 'Phanteks D30-140 DRGB', 140, 2024, 2026, 30, 4, { rgb: true, look: BLKW, packs: [1] }],
  ['Phanteks', 'Phanteks M25-120', 120, 2022, 2026, 17, 3, { look: BLK, packs: [1, '3'], colors: [['svart', BLK], ['vit', WHT]] }],
  ['Phanteks', 'Phanteks M25-140', 140, 2022, 2026, 19, 3, { look: BLK }],

  // --- Fractal Design ---
  ['Fractal Design', 'Fractal Design Silent Series R2 120mm', 120, 2011, 2015, 12, 2, { look: ['#1a1a1a', '#e6e6e6'] }],
  ['Fractal Design', 'Fractal Design Silent Series R2 140mm', 140, 2011, 2015, 14, 2, { look: ['#1a1a1a', '#e6e6e6'] }],
  ['Fractal Design', 'Fractal Design Silent Series R3 120mm', 120, 2013, 2019, 11, 2, { look: BLK }],
  ['Fractal Design', 'Fractal Design Silent Series R3 140mm', 140, 2013, 2019, 13, 2, { look: BLK }],
  ['Fractal Design', 'Fractal Design Venturi HP-12 PWM', 120, 2014, 2019, 20, 3, { look: ['#1a1a1a', '#e6e6e6'] }],
  ['Fractal Design', 'Fractal Design Venturi HP-14 PWM', 140, 2014, 2019, 22, 3, { look: ['#1a1a1a', '#e6e6e6'] }],
  ['Fractal Design', 'Fractal Design Dynamic X2 GP-12', 120, 2015, 2021, 12, 2, { look: BLK, colors: [['svart', BLK], ['vit', WHT]] }],
  ['Fractal Design', 'Fractal Design Dynamic X2 GP-14', 140, 2015, 2021, 14, 2, { look: BLK }],
  ['Fractal Design', 'Fractal Design Prisma AL-12', 120, 2019, 2023, 17, 3, { rgb: true, look: BLKW, packs: [1, '3'] }],
  ['Fractal Design', 'Fractal Design Prisma AL-14', 140, 2019, 2023, 19, 3, { rgb: true, look: BLKW }],
  ['Fractal Design', 'Fractal Design Prisma SL-12', 120, 2019, 2023, 15, 2, { rgb: true, look: BLKW, packs: [1, '3'] }],
  ['Fractal Design', 'Fractal Design Aspect 12', 120, 2021, 2026, 12, 2, { look: BLK, packs: [1, '3'], colors: [['svart', BLK], ['vit', WHT]] }],
  ['Fractal Design', 'Fractal Design Aspect 14', 140, 2021, 2026, 14, 2, { look: BLK, packs: [1, '3'] }],
  ['Fractal Design', 'Fractal Design Aspect 12 RGB', 120, 2022, 2026, 17, 3, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['Fractal Design', 'Fractal Design Aspect 14 RGB', 140, 2022, 2026, 19, 3, { rgb: true, look: BLKW }],

  // --- Thermaltake ---
  ['Thermaltake', 'Thermaltake Pure 12', 120, 2014, 2019, 6, 1, { look: BLK }],
  ['Thermaltake', 'Thermaltake Riing 12 LED', 120, 2015, 2019, 12, 2, { look: BLUELED, packs: [1, '3'] }],
  ['Thermaltake', 'Thermaltake Riing 14 LED', 140, 2015, 2019, 15, 2, { look: BLUELED }],
  ['Thermaltake', 'Thermaltake Riing Plus 12 RGB', 120, 2016, 2020, 36, 4, { rgb: true, look: BLKW, packs: ['3'] }],
  ['Thermaltake', 'Thermaltake Riing Plus 14 RGB', 140, 2016, 2020, 40, 4, { rgb: true, look: BLKW, packs: ['3'] }],
  ['Thermaltake', 'Thermaltake Riing Trio 12 RGB', 120, 2018, 2021, 38, 4, { rgb: true, look: BLKW, packs: ['3'] }],
  ['Thermaltake', 'Thermaltake Riing Quad 12 RGB', 120, 2019, 2023, 45, 5, { rgb: true, look: BLKW, packs: ['3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['Thermaltake', 'Thermaltake Riing Quad 14 RGB', 140, 2019, 2023, 50, 5, { rgb: true, look: BLKW, packs: ['3'] }],
  ['Thermaltake', 'Thermaltake ToughFan 12', 120, 2019, 2025, 18, 3, { look: BLK, packs: [1] }],
  ['Thermaltake', 'Thermaltake SWAFAN 12 RGB', 120, 2020, 2023, 40, 4, { rgb: true, look: BLKW, packs: ['3'] }],
  ['Thermaltake', 'Thermaltake SWAFAN EX12 RGB', 120, 2021, 2025, 35, 4, { rgb: true, look: BLKW, packs: ['3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['Thermaltake', 'Thermaltake SWAFAN EX14 RGB', 140, 2021, 2025, 40, 4, { rgb: true, look: BLKW, packs: ['3'] }],
  ['Thermaltake', 'Thermaltake CT120 ARGB Sync', 120, 2022, 2026, 10, 1, { rgb: true, look: BLKW, packs: ['3'], colors: [['svart', BLKW], ['vit', WHT]] }],

  // --- NZXT ---
  ['NZXT', 'NZXT FN V2 120mm', 120, 2013, 2018, 10, 2, { look: BLK }],
  ['NZXT', 'NZXT FN V2 140mm', 140, 2013, 2018, 12, 2, { look: BLK }],
  ['NZXT', 'NZXT Aer F120', 120, 2017, 2021, 20, 3, { look: BLK, packs: [1, '2'] }],
  ['NZXT', 'NZXT Aer F140', 140, 2017, 2021, 22, 3, { look: BLK }],
  ['NZXT', 'NZXT Aer P120', 120, 2018, 2021, 20, 3, { look: BLK }],
  ['NZXT', 'NZXT Aer RGB 2 120mm', 120, 2019, 2023, 35, 4, { rgb: true, look: BLKW, packs: [1, '3'] }],
  ['NZXT', 'NZXT Aer RGB 2 140mm', 140, 2019, 2023, 40, 4, { rgb: true, look: BLKW, packs: [1, '2'] }],
  ['NZXT', 'NZXT F120Q', 120, 2022, 2026, 20, 3, { look: BLK, packs: [1, '2'], colors: [['svart', BLK], ['vit', WHT]] }],
  ['NZXT', 'NZXT F140Q', 140, 2022, 2026, 23, 3, { look: BLK }],
  ['NZXT', 'NZXT F120P', 120, 2022, 2026, 20, 3, { look: BLK }],
  ['NZXT', 'NZXT F120 RGB', 120, 2022, 2026, 25, 3, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['NZXT', 'NZXT F140 RGB', 140, 2022, 2026, 28, 3, { rgb: true, look: BLKW, packs: [1, '2'] }],
  ['NZXT', 'NZXT F120 RGB Duo', 120, 2022, 2026, 30, 4, { rgb: true, look: BLKW, packs: [1, '3'], colors: [['svart', BLKW], ['vit', WHT]] }],
  ['NZXT', 'NZXT F120 RGB Core', 120, 2022, 2026, 30, 4, { rgb: true, look: BLKW, packs: ['3'] }],
  ['NZXT', 'NZXT F140 RGB Core', 140, 2022, 2026, 33, 4, { rgb: true, look: BLKW, packs: ['2'] }],
];

for (const [brand, base, size, year, until, usd, tier, o] of F) {
  const colors = o.colors || [['', o.look]];
  for (const [cn, [frame, blade]] of colors) {
    for (const pk of o.packs || [1]) {
      const official = typeof pk === 'string';
      const n = official ? +pk : pk;
      const packTxt = n === 1 ? '' : official ? ` (${n}-pack)` : ` (${n} st)`;
      const name = base + (cn ? `, ${cn}` : '') + packTxt;
      const usdTotal = usd * n * (official ? (n >= 5 ? 0.8 : 0.9) : 1);
      add({ name, brand, size, year, until, count: n, tier, rgb: o.rgb, frame, blade, cost: sek(usdTotal, year) });
    }
  }
}

// ---------------------------------------------------------------------------
// Delar från den ursprungliga katalogen (samma id, namn och utseende)
// ---------------------------------------------------------------------------
[
  ['p12-pwm-3', 'ARCTIC P12 PWM PST (3-pack)', 'ARCTIC', 2019, 2026, 8 * 3 * 0.9, 1, 1, false, '#1d1d1d', '#2a2a2a'],
  ['sp120-rgb-3', 'Corsair iCUE SP120 RGB ELITE (3-pack)', 'Corsair', 2020, 2025, 23 * 3 * 0.9, 2, 2, true, '#161616', '#e9e9e9'],
  ['uni-sl120-3', 'Lian Li UNI FAN SL120 V2 RGB (3-pack)', 'Lian Li', 2022, 2026, 32 * 3 * 0.9, 3, 3, true, '#ececea', '#f7f7f7'],
  ['nf-a12x25-3', 'Noctua NF-A12x25 PWM (3 st)', 'Noctua', 2018, 2026, 30 * 3, 4, 4, false, '#d8c7a7', '#8a4b34'],
].forEach(([id, name, brand, year, until, usd, tier, lvl, rgb, frame, blade]) => {
  add({ id, name, brand, size: 120, year, until, count: 3, tier, lvl, rgb, frame, blade, cost: sek(usd, year) });
});

export default P;
