// Nätaggregat 1983–2026. AT-agg (P8/P9) fram till 1999, ATX (20-pin) 1996–2005,
// ATX 24-pin från 2004. Kontakterna härleds ur år och effekt i conn() men kan
// skrivas över per serie/modell. Priser: USD-lanseringspris × SEK_PER_USD × 1,25.
import { SEK_PER_USD } from './canon.js';

const P = [];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const slug = (s) => s.toLowerCase().replace(/!/g, '').replace(/\+/g, '-plus').replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
const sek = (usd, y) => Math.max(10, Math.round((usd * SEK_PER_USD[y] * 1.25) / 10) * 10);

// ---------------------------------------------------------------- AT-nätagg
const AT_LOOK = {
  'at-silver': { color: '#b4b8bc', accent: '#5a5f66' },
  'at-beige': { color: '#d8cfb4', accent: '#8a7f66' },
};
function at(brand, name, year, until, watt, usd, tier, style = 'at-silver', x = {}) {
  P.push({
    id: x.id || 'psu-' + slug(name), cat: 'psu', name, brand, year, until,
    cost: x.cost ?? sek(usd, year), tier,
    form: 'AT', watt, main: 'AT', cpu: null, pcie: [], v12vhpwr: false,
    sata: 0, molex: x.molex ?? (watt < 150 ? 2 : watt < 200 ? 3 : 4), berg: x.berg ?? (year < 1988 || watt < 150 ? 1 : 2),
    modular: false, eff: 'none',
    look: { ...AT_LOOK[style], ...(x.look || {}), style },
  });
}

at('IBM', 'IBM 5160 PC/XT 130W', 1983, 1987, 130, 220, 3, 'at-beige');
at('Astec', 'Astec 135W XT-nätagg', 1983, 1988, 135, 120, 2);
at('Lite-On', 'Lite-On 150W XT-nätagg', 1984, 1990, 150, 90, 2);
at('IBM', 'IBM 5170 PC/AT 192W', 1984, 1989, 192, 300, 4, 'at-beige');
at('Astec', 'Astec 200W AT-nätagg', 1985, 1992, 200, 150, 3);
at('PC Power & Cooling', 'PC Power & Cooling 150W XT', 1985, 1990, 150, 130, 4);
at('HiPro', 'HiPro 150W XT-nätagg', 1985, 1989, 150, 70, 1);
at('Delta', 'Delta 150W XT-nätagg', 1985, 1991, 150, 80, 2);
at('PC Power & Cooling', 'PC Power & Cooling 200W AT', 1986, 1992, 200, 170, 4);
at('Delta', 'Delta 180W AT-nätagg', 1986, 1992, 180, 95, 2);
at('HiPro', 'HiPro 200W AT-nätagg', 1986, 1993, 200, 90, 2);
at('Astec', 'Astec 150W Baby AT-nätagg', 1986, 1991, 150, 90, 2);
at('Lite-On', 'Lite-On 200W AT-nätagg', 1987, 1993, 200, 85, 2);
at('Seventeam', 'Seventeam 200W AT-nätagg', 1987, 1994, 200, 70, 1);
at('Astec', 'Astec 220W AT-nätagg', 1987, 1994, 220, 120, 3);
at('Sparkle', 'Sparkle 200W AT-nätagg', 1988, 1995, 200, 65, 1);
at('Delta', 'Delta 230W AT-nätagg', 1988, 1995, 230, 90, 2);
at('Deer', 'Deer 150W XT-nätagg', 1988, 1992, 150, 45, 1);
at('PC Power & Cooling', 'PC Power & Cooling Turbo-Cool 250 AT', 1989, 1995, 250, 190, 5);
at('Deer', 'Deer 200W AT-nätagg', 1989, 1996, 200, 50, 1);
at('PC Power & Cooling', 'PC Power & Cooling Silencer 200 AT', 1990, 1996, 200, 130, 4);
at('Astec', 'Astec 250W AT-nätagg', 1990, 1997, 250, 110, 3);
at('Lite-On', 'Lite-On 230W AT-nätagg', 1991, 1997, 230, 70, 2);
at('PC Power & Cooling', 'PC Power & Cooling Turbo-Cool 300 AT', 1991, 1999, 300, 180, 5);
at('Enermax', 'Enermax 235W AT-nätagg', 1991, 1997, 235, 75, 3);
at('Seventeam', 'Seventeam 230W AT-nätagg', 1992, 1998, 230, 50, 1);
at('Delta', 'Delta 200W Baby AT-nätagg', 1992, 1998, 200, 55, 2);
at('Sparkle', 'Sparkle 250W AT-nätagg', 1993, 1999, 250, 55, 2);
at('HiPro', 'HiPro 230W AT-nätagg', 1993, 1999, 230, 50, 1);
at('Enermax', 'Enermax 300W AT-nätagg', 1994, 1999, 300, 90, 4);
at('Deer', 'Deer 250W AT-nätagg', 1994, 1999, 250, 35, 1);
at('Antec', 'Antec 250W AT-nätagg', 1994, 1999, 250, 55, 2);
at('Delta', 'Delta 250W AT-nätagg', 1994, 1999, 250, 60, 2);
at('PC Power & Cooling', 'PC Power & Cooling Silencer 250 AT', 1995, 1999, 250, 120, 4);
at('Channel Well', 'Channel Well 200W AT-nätagg', 1995, 1999, 200, 30, 1);
at('Enermax', 'Enermax 250W AT-nätagg', 1996, 1999, 250, 60, 3);
at('Sparkle', 'Sparkle 300W AT-nätagg', 1997, 1999, 300, 50, 2);
at('Seventeam', 'Seventeam 300W AT-nätagg', 1997, 1999, 300, 45, 2);
at('Deer', 'Deer 300W AT-nätagg', 1997, 1999, 300, 30, 1);
at('Antec', 'Antec 300W AT-nätagg', 1997, 1999, 300, 60, 3);

// ---------------------------------------------------------------- ATX/SFX
function conn(y, w, e) {
  const main = e.main ?? (y >= 2005 ? 'ATX24' : 'ATX20');
  const cpu = e.cpu !== undefined ? e.cpu
    : y < 2000 ? null
    : y <= 2006 ? 'ATX12V4'
    : y === 2007 ? (w >= 600 ? 'EPS8' : 'ATX12V4')
    : y <= 2009 ? (w >= 500 ? 'EPS8' : 'ATX12V4')
    : 'EPS8';
  let n;
  if (y < 2004) n = 0;
  else if (y < 2007) n = w < 400 ? 0 : w < 550 ? 1 : w < 800 ? 2 : 4;
  else n = w < 350 ? 0 : w < 450 ? 1 : w < 600 ? 2 : w < 750 ? (y >= 2013 ? 4 : 2) : w < 950 ? 4 : w < 1150 ? 6 : w < 1400 ? 8 : 10;
  if (e.v12 && n > 2) n -= 2;
  const pcie = e.pcie ?? Array.from({ length: n }, (_, i) => (y < 2007 ? 'pcie6' : y < 2010 && i >= Math.ceil(n / 2) ? 'pcie6' : 'pcie8'));
  const sata = e.sata ?? (y < 2003 ? 0 : y < 2005 ? 2 : y < 2007 ? 4 : w < 450 ? 4 : w < 650 ? 6 : w < 850 ? 8 : w < 1100 ? 10 : 12);
  const molex = e.molex ?? (y < 2003 ? (w < 300 ? 4 : w < 400 ? 6 : 8) : y < 2009 ? (w < 500 ? 6 : w < 900 ? 8 : 10) : y < 2015 ? (w < 600 ? 4 : w < 900 ? 6 : 8) : (w < 600 ? 3 : w < 1100 ? 4 : 6));
  const berg = e.berg ?? (y < 2012 ? (w >= 600 ? 2 : 1) : y < 2021 ? 1 : (w >= 750 ? 1 : 0));
  return { main, cpu, pcie, sata, molex, berg };
}

const tierFor = (b, w, y) => {
  const big = y < 2004 ? 450 : y < 2008 ? 750 : y < 2016 ? 1000 : 1200;
  const small = y < 2004 ? 300 : y < 2008 ? 400 : y < 2016 ? 500 : 550;
  return clamp(b + (w >= big ? 1 : 0) - (w <= small && b > 1 ? 1 : 0), 1, 5);
};

// d: { brand, tpl ('{w}' = watt, '{m}' = modellkod), year, life|until, eff, tier, modular, form, style, color, accent, rgb, v12, main, cpu }
// models: [watt, usd, { m, name, id, cost, tier, year, until, ...överskrivningar }]
function S(d, models) {
  for (const [w, usd, x = {}] of models) {
    const e = { ...d, ...x };
    const y = e.year;
    const name = x.name ?? d.tpl.replace('{w}', w).replace('{m}', x.m ?? '');
    const c = conn(y, w, e);
    let until = e.until ?? y + (e.life ?? 5);
    if (c.main === 'ATX20') until = Math.min(until, 2005);
    if (c.cpu === 'ATX12V4') until = Math.min(until, 2009);
    until = Math.max(y, Math.min(2026, until));
    const style = e.style ?? (e.modular ? 'modular' : y < 2004 ? 'atx-silver' : 'atx-black');
    P.push({
      id: x.id || 'psu-' + slug(name), cat: 'psu', name, brand: d.brand, year: y, until,
      cost: x.cost ?? sek(usd, y), tier: x.tier ?? tierFor(e.tier, w, y),
      ...(e.rgb ? { rgb: true } : {}),
      form: e.form ?? 'ATX', watt: w, main: c.main, cpu: c.cpu, pcie: c.pcie, v12vhpwr: !!e.v12,
      sata: c.sata, molex: c.molex, berg: c.berg, modular: !!e.modular, eff: e.eff ?? 'none',
      look: { color: e.color ?? (style === 'atx-silver' ? '#b9bdc2' : '#1d1e21'), accent: e.accent ?? '#8a9199', style },
    });
  }
}

// ---- Tidiga ATX-agg (20-pin, utan ATX12V) ----
S({ brand: 'Astec', tpl: 'Astec {w}W ATX-nätagg', year: 1996, until: 2000, tier: 2 }, [[200, 45], [250, 55, { year: 1997 }]]);
S({ brand: 'Delta', tpl: 'Delta {w}W ATX-nätagg', year: 1996, until: 2000, tier: 2 }, [[230, 45], [300, 60, { year: 1998, until: 2001 }]]);
S({ brand: 'Sparkle', tpl: 'Sparkle {w}W ATX-nätagg', year: 1997, until: 2001, tier: 2 }, [[235, 40], [300, 55, { year: 1998, until: 2002 }]]);
S({ brand: 'Seventeam', tpl: 'Seventeam {w}W ATX-nätagg', year: 1997, until: 2001, tier: 1 }, [[250, 35], [300, 45, { year: 1999, until: 2002 }]]);
S({ brand: 'Enermax', tpl: 'Enermax {m} {w}W', year: 1997, until: 2001, tier: 3, accent: '#d4452a' }, [[250, 55, { m: 'EG251P-VB' }], [300, 70, { m: 'EG301P-VB', year: 1998, until: 2002 }]]);
S({ brand: 'Antec', tpl: 'Antec {m} {w}W', year: 1997, until: 2001, tier: 3, accent: '#c9323a' }, [[250, 50, { m: 'PP-253X' }], [300, 65, { m: 'PP-303X', year: 1998, until: 2002 }]]);
S({ brand: 'Deer', tpl: 'Deer {w}W ATX-nätagg', year: 1998, until: 2002, tier: 1 }, [[250, 25], [300, 30, { year: 1999, until: 2003 }]]);
S({ brand: 'HiPro', tpl: 'HiPro {w}W ATX-nätagg', year: 1998, until: 2002, tier: 1 }, [[250, 35]]);
S({ brand: 'PC Power & Cooling', tpl: 'PC Power & Cooling Silencer 275 ATX', year: 1999, until: 2002, tier: 4, accent: '#2c6fb7' }, [[275, 90]]);
S({ brand: 'Channel Well', tpl: 'Channel Well {w}W ATX-nätagg', year: 1999, until: 2003, tier: 1 }, [[250, 25]]);

// ---- ATX 20-pin + ATX12V (Pentium 4-eran) ----
S({ brand: 'Enermax', tpl: 'Enermax {m} {w}W', year: 2000, life: 4, tier: 3, accent: '#d4452a' }, [
  [350, 85, { m: 'EG365P-VE' }], [353, 80, { m: 'EG365AX-VE(G)', year: 2002 }], [431, 105, { m: 'EG465P-VE(FC)', year: 2002 }],
  [480, 120, { m: 'EG485AX-VE(G)', year: 2003 }], [550, 160, { m: 'EG651P-VE(FMA)', year: 2003, tier: 4 }],
]);
S({ brand: 'Antec', tpl: 'Antec {m}', year: 2000, life: 4, tier: 2, accent: '#c9323a' }, [
  [350, 60, { m: 'PP-352X 350W' }], [400, 75, { m: 'PP-412X 400W', year: 2001 }],
]);
S({ brand: 'Antec', tpl: 'Antec SmartPower SL{w}', year: 2002, life: 3, tier: 2, accent: '#c9323a' }, [[300, 45], [350, 55], [400, 65]]);
S({ brand: 'Antec', tpl: 'Antec TruePower {w}', year: 2002, life: 3, tier: 3, accent: '#c9323a' }, [[330, 65], [380, 75], [430, 90, { year: 2003 }], [480, 110, { year: 2003 }], [550, 130, { year: 2003 }]]);
S({ brand: 'PC Power & Cooling', tpl: 'PC Power & Cooling {m}', year: 2000, life: 4, tier: 4, accent: '#2c6fb7' }, [
  [400, 150, { m: 'Turbo-Cool 400 ATX', tier: 5 }], [310, 99, { m: 'Silencer 310', year: 2001 }], [410, 130, { m: 'Silencer 410', year: 2002 }],
  [510, 190, { m: 'Turbo-Cool 510', year: 2002, tier: 5 }], [510, 230, { m: 'Turbo-Cool 510 Deluxe', year: 2003, tier: 5 }],
]);
S({ brand: 'Deer', tpl: 'Deer {w}W P4-nätagg', year: 2001, life: 4, tier: 1 }, [[300, 25], [350, 30, { year: 2002 }], [400, 35, { year: 2003 }]]);
S({ brand: 'Chieftec', tpl: 'Chieftec {m}', year: 2001, life: 4, tier: 2, accent: '#2c6fb7' }, [
  [340, 35, { m: 'HPC-340-102 340W' }], [360, 40, { m: 'HPC-360-202 360W', year: 2002 }], [420, 55, { m: 'HPC-420-302DF 420W', year: 2003 }],
]);
S({ brand: 'FSP', tpl: 'FSP {m}', year: 2002, life: 4, tier: 2, accent: '#3f9b3a' }, [[300, 40, { m: 'FSP300-60GTV 300W' }], [350, 50, { m: 'FSP350-60GLN 350W', year: 2003 }]]);
S({ brand: 'Seasonic', tpl: 'Seasonic Super Tornado {w}', year: 2002, life: 4, tier: 3, accent: '#2c6fb7' }, [[300, 65], [350, 80], [400, 95]]);
S({ brand: 'Seasonic', tpl: 'Seasonic Super Silencer {w}', year: 2003, life: 3, tier: 3, accent: '#2c6fb7' }, [[300, 70], [350, 85], [400, 100]]);
S({ brand: 'Zalman', tpl: 'Zalman {m}', year: 2003, life: 3, tier: 4, accent: '#e07a2e' }, [[300, 90, { m: 'ZM300A-APF 300W' }], [400, 110, { m: 'ZM400A-APF 400W' }]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Silent PurePower {w}W', year: 2003, life: 3, tier: 3, accent: '#c9323a' }, [[420, 70], [480, 90]]);
S({ brand: 'Enermax', tpl: 'Enermax Noisetaker {w}W', year: 2003, life: 3, tier: 4, accent: '#d4452a' }, [[420, 110], [470, 125]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master Real Power {w}W', year: 2003, life: 3, tier: 3, accent: '#7a5bc9' }, [[380, 70], [450, 90]]);

// ---- ATX 24-pin + PCIe (2004–2006) ----
S({ brand: 'Antec', tpl: 'Antec NeoPower 480', year: 2004, life: 3, tier: 4, main: 'ATX24', modular: true, accent: '#c9323a', color: '#b9bdc2' }, [[480, 110]]);
S({ brand: 'Enermax', tpl: 'Enermax Noisetaker II {w}W', year: 2004, life: 3, tier: 4, main: 'ATX24', accent: '#d4452a', style: 'atx-silver' }, [[485, 130], [600, 170, { tier: 5 }]]);
S({ brand: 'OCZ', tpl: 'OCZ PowerStream {w}W', year: 2004, life: 3, tier: 4, main: 'ATX24', accent: '#3a8fd8', style: 'atx-silver' }, [[420, 90], [470, 100], [520, 120], [600, 150, { tier: 5 }]]);
S({ brand: 'Tagan', tpl: 'Tagan {m}', year: 2004, life: 4, tier: 4, main: 'ATX24', accent: '#c9323a', color: '#26282c' }, [
  [420, 80, { m: 'TG420-U22 420W', tier: 3 }], [480, 100, { m: 'TG480-U01 480W' }], [530, 120, { m: 'TG530-U15 530W', year: 2005 }], [580, 140, { m: 'TG580-U33 580W', year: 2005 }],
]);
S({ brand: 'Antec', tpl: 'Antec TruePower 2.0 {w}W', year: 2005, life: 3, tier: 3, accent: '#c9323a', style: 'atx-silver' }, [[430, 90], [480, 100], [550, 120, { tier: 4 }]]);
S({ brand: 'Antec', tpl: 'Antec SmartPower 2.0 {w}W', year: 2005, life: 3, tier: 2, accent: '#c9323a', style: 'atx-silver' }, [[350, 50], [400, 60], [450, 70], [500, 80]]);
S({ brand: 'Antec', tpl: 'Antec NeoHE {w}', year: 2005, life: 4, tier: 3, modular: true, accent: '#c9323a', eff: '80plus' }, [[380, 90], [430, 100], [500, 115], [550, 130, { tier: 4 }]]);
S({ brand: 'Seasonic', tpl: 'Seasonic S12-{w}', year: 2005, life: 4, tier: 3, eff: '80plus', style: 'atx-silver', color: '#a9adb2', accent: '#2c6fb7' }, [[330, 70], [380, 80], [430, 90], [500, 110], [600, 140, { tier: 4 }]]);
S({ brand: 'Enermax', tpl: 'Enermax Liberty {w}W', year: 2005, life: 4, tier: 4, modular: true, accent: '#d4452a' }, [[400, 100, { tier: 3 }], [500, 120], [620, 150]]);
S({ brand: 'Zalman', tpl: 'Zalman {m}', year: 2005, life: 4, tier: 3, accent: '#e07a2e', style: 'atx-silver' }, [[400, 95, { m: 'ZM400B-APS 400W' }], [460, 115, { m: 'ZM460B-APS 460W', tier: 4 }]]);
S({ brand: 'PC Power & Cooling', tpl: 'PC Power & Cooling {m}', year: 2005, life: 4, tier: 4, accent: '#2c6fb7', style: 'atx-silver' }, [
  [470, 140, { m: 'Silencer 470' }], [610, 180, { m: 'Silencer 610' }], [850, 400, { m: 'Turbo-Cool 850 SSI', cpu: 'EPS8', tier: 5 }],
  [1000, 500, { m: 'Turbo-Cool 1KW-SR', year: 2006, cpu: 'EPS8', tier: 5 }],
]);
S({ brand: 'SilverStone', tpl: 'SilverStone {m}', year: 2005, life: 4, tier: 4, accent: '#9aa4ae' }, [
  [560, 130, { m: 'Strider ST56F 560W', modular: true }], [650, 200, { m: 'Zeus ST65ZF 650W', cpu: 'EPS8', tier: 5 }],
]);
S({ brand: 'be quiet!', tpl: 'be quiet! Blackline P5 {w}W', year: 2005, life: 3, tier: 3, accent: '#e07a2e', color: '#1b1b1d' }, [[400, 90], [470, 110], [520, 130, { tier: 4 }]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake PurePower {w}W', year: 2005, life: 3, tier: 3, accent: '#c9323a' }, [[560, 120], [680, 170, { tier: 4 }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master eXtreme Power Plus {w}W', year: 2006, life: 4, tier: 2, accent: '#7a5bc9' }, [[390, 45], [460, 55], [500, 60], [550, 70], [650, 85, { tier: 3 }]]);
S({ brand: 'Antec', tpl: 'Antec TruePower Trio {w}', year: 2006, life: 3, tier: 3, accent: '#c9323a', eff: '80plus' }, [[430, 85], [550, 110], [650, 130, { tier: 4 }]]);
S({ brand: 'Antec', tpl: 'Antec EarthWatts EA-{w}', year: 2006, life: 5, tier: 2, accent: '#6aa84f', eff: '80plus' }, [[380, 55], [430, 65], [500, 80, { tier: 3 }]]);
S({ brand: 'Corsair', tpl: 'Corsair HX{w}W', year: 2006, life: 4, tier: 4, modular: true, accent: '#e8c030', color: '#1a1a1a', eff: '80plus' }, [[520, 130], [620, 170]]);
S({ brand: 'Seasonic', tpl: 'Seasonic M12-{w}', year: 2006, life: 4, tier: 4, modular: true, eff: '80plus', accent: '#2c6fb7' }, [[500, 120], [600, 140], [700, 170]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Toughpower {w}W', year: 2006, life: 4, tier: 4, accent: '#c9323a', modular: true }, [[550, 130], [650, 160], [750, 190], [850, 230, { tier: 5 }], [1000, 300, { cpu: 'EPS8', tier: 5 }]]);
S({ brand: 'Enermax', tpl: 'Enermax Galaxy DXX {w}W', year: 2006, life: 4, tier: 5, accent: '#d4452a', cpu: 'EPS8' }, [[850, 280], [1000, 350]]);
S({ brand: 'OCZ', tpl: 'OCZ GameXStream {w}W', year: 2006, life: 4, tier: 4, accent: '#3a8fd8', cpu: 'EPS8' }, [[600, 130], [700, 150], [850, 200, { tier: 5 }]]);
S({ brand: 'Tagan', tpl: 'Tagan PipeRock {m}', year: 2006, life: 4, tier: 4, accent: '#c9323a', modular: true, color: '#26282c' }, [[700, 180, { m: 'TG700-BZ 700W' }], [800, 220, { m: 'TG800-BZ 800W', tier: 5 }]]);
S({ brand: 'FSP', tpl: 'FSP Blue Storm {w}W', year: 2006, life: 4, tier: 2, accent: '#3a8fd8' }, [[350, 50], [400, 60], [500, 75, { tier: 3 }]]);

// ---- 2007–2010: 80 PLUS, EPS 8-pin och 6+2-pin PCIe ----
S({ brand: 'Corsair', tpl: 'Corsair VX{w}W', year: 2007, life: 4, tier: 3, accent: '#e8c030', color: '#1a1a1a', eff: '80plus' }, [[450, 80], [550, 100]]);
S({ brand: 'Corsair', tpl: 'Corsair TX{w}W', year: 2007, life: 4, tier: 4, accent: '#e8c030', color: '#1a1a1a', eff: '80plus' }, [[650, 120], [750, 140], [850, 180, { year: 2008 }], [950, 200, { year: 2009, eff: 'bronze', tier: 5 }]]);
S({ brand: 'Corsair', tpl: 'Corsair HX{w}W', year: 2008, life: 4, tier: 4, modular: true, accent: '#e8c030', color: '#1a1a1a', eff: 'silver' }, [[1000, 250, { tier: 5 }], [650, 140, { year: 2009 }], [750, 160, { year: 2009 }], [850, 190, { year: 2009, tier: 5 }]]);
S({ brand: 'Antec', tpl: 'Antec Signature {w}', year: 2007, life: 4, tier: 5, modular: true, accent: '#c9323a', eff: '80plus' }, [[650, 200], [850, 280]]);
S({ brand: 'Antec', tpl: 'Antec TruePower Quattro {w}', year: 2007, life: 4, tier: 5, modular: true, accent: '#c9323a', eff: '80plus' }, [[850, 220], [1000, 280]]);
S({ brand: 'Antec', tpl: 'Antec CP-{w}', year: 2008, life: 4, tier: 5, accent: '#c9323a', eff: 'bronze' }, [[850, 200], [1000, 250]]);
S({ brand: 'Antec', tpl: 'Antec EarthWatts EA-{w}', year: 2008, life: 4, tier: 3, accent: '#6aa84f', eff: 'bronze' }, [[650, 90], [750, 110]]);
S({ brand: 'Seasonic', tpl: 'Seasonic S12 Energy Plus-{w}', year: 2007, life: 4, tier: 3, eff: '80plus', accent: '#2c6fb7' }, [[550, 110], [650, 130, { tier: 4 }]]);
S({ brand: 'Seasonic', tpl: 'Seasonic S12II-{w} Bronze', year: 2008, life: 7, tier: 2, eff: 'bronze', accent: '#9aa4ae', color: '#222326' }, [[330, 55], [380, 65], [430, 75], [500, 85, { tier: 3 }], [620, 100, { tier: 3 }]]);
S({ brand: 'Seasonic', tpl: 'Seasonic M12II-{w} Bronze', year: 2009, life: 6, tier: 3, modular: true, eff: 'bronze', accent: '#9aa4ae', color: '#222326' }, [[520, 90], [620, 100], [750, 130, { tier: 4 }], [850, 160, { tier: 4, year: 2011 }]]);
S({ brand: 'Seasonic', tpl: 'Seasonic M12D-{w}', year: 2009, life: 4, tier: 4, modular: true, eff: 'silver', accent: '#9aa4ae', color: '#222326' }, [[750, 150], [850, 170]]);
S({ brand: 'Seasonic', tpl: 'Seasonic X-{w} Gold', year: 2009, life: 6, tier: 4, modular: true, eff: 'gold', accent: '#d8b24a', color: '#222326' }, [[650, 150], [750, 170], [560, 130, { year: 2010 }], [850, 200, { year: 2010 }], [1050, 250, { year: 2010, tier: 5 }], [1250, 300, { year: 2010, tier: 5 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Straight Power E5 {w}W', year: 2007, life: 4, tier: 3, accent: '#e07a2e', color: '#1b1b1d', eff: '80plus' }, [[400, 70], [450, 80], [500, 90], [550, 100], [600, 120, { tier: 4 }], [700, 140, { tier: 4 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Dark Power Pro P7 {w}W', year: 2008, life: 4, tier: 5, accent: '#e07a2e', color: '#1b1b1d', eff: '80plus', modular: true }, [[550, 140, { tier: 4 }], [650, 160, { tier: 4 }], [750, 180], [850, 210], [1000, 270], [1200, 330]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Pure Power L7 {w}W', year: 2009, life: 4, tier: 2, accent: '#e07a2e', color: '#1b1b1d', eff: '80plus' }, [[300, 45, { tier: 1 }], [350, 50], [430, 60], [530, 70], [630, 85, { tier: 3 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Straight Power E8 {w}W', year: 2010, life: 4, tier: 3, accent: '#e07a2e', color: '#1b1b1d', eff: 'gold' }, [[400, 90], [450, 100], [500, 110], [550, 120], [580, 140, { name: 'be quiet! Straight Power E8 580W CM', modular: true, tier: 4 }], [680, 160, { name: 'be quiet! Straight Power E8 680W CM', modular: true, tier: 4 }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master Real Power M{w}', year: 2007, life: 4, tier: 4, modular: true, accent: '#7a5bc9', eff: '80plus' }, [[520, 110, { tier: 3 }], [620, 130], [700, 150], [850, 190, { tier: 5 }], [1000, 260, { tier: 5 }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master Elite Power {w}W', year: 2008, life: 5, tier: 1, accent: '#7a5bc9' }, [[400, 35], [460, 40], [500, 45]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master Silent Pro M{w}', year: 2009, life: 4, tier: 3, modular: true, accent: '#7a5bc9', eff: 'bronze' }, [[500, 90], [600, 110], [700, 130, { tier: 4 }], [850, 170, { tier: 4 }], [1000, 220, { tier: 5 }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master Silent Pro Gold {w}W', year: 2010, life: 4, tier: 4, modular: true, accent: '#d8b24a', eff: 'gold' }, [[550, 120], [700, 160], [800, 180], [1000, 230, { tier: 5 }], [1200, 300, { tier: 5 }]]);
S({ brand: 'OCZ', tpl: 'OCZ EliteXStream {w}W', year: 2007, life: 4, tier: 5, accent: '#3a8fd8', eff: '80plus' }, [[800, 230], [1000, 300]]);
S({ brand: 'OCZ', tpl: 'OCZ StealthXStream {w}W', year: 2007, life: 3, tier: 2, accent: '#3a8fd8', eff: '80plus' }, [[400, 55], [500, 70], [600, 85, { tier: 3 }]]);
S({ brand: 'OCZ', tpl: 'OCZ ModXStream Pro {w}W', year: 2008, life: 4, tier: 3, accent: '#3a8fd8', eff: '80plus', modular: true }, [[500, 80], [600, 95], [700, 115, { tier: 4 }]]);
S({ brand: 'OCZ', tpl: 'OCZ Fatal1ty {w}W', year: 2009, life: 4, tier: 4, accent: '#c9323a', eff: 'bronze', modular: true }, [[550, 90, { tier: 3 }], [750, 130], [1000, 200, { tier: 5 }]]);
S({ brand: 'OCZ', tpl: 'OCZ StealthXStream 2 {w}W', year: 2010, life: 4, tier: 2, accent: '#3a8fd8', eff: '80plus' }, [[400, 50], [500, 60], [600, 70], [700, 85, { tier: 3 }]]);
S({ brand: 'Zalman', tpl: 'Zalman ZM{w}-HP', year: 2007, life: 4, tier: 4, accent: '#e07a2e', modular: true, eff: '80plus' }, [[600, 180], [750, 220, { year: 2008, tier: 5 }], [1000, 330, { year: 2008, tier: 5 }]]);
S({ brand: 'Zalman', tpl: 'Zalman ZM850-HP Plus', year: 2009, life: 4, tier: 5, accent: '#e07a2e', modular: true, eff: 'silver' }, [[850, 250]]);
S({ brand: 'Zalman', tpl: 'Zalman ZM{w}-GT', year: 2009, life: 4, tier: 3, accent: '#e07a2e', eff: 'bronze' }, [[500, 90], [600, 110]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Toughpower {w}W', year: 2007, life: 4, tier: 5, accent: '#c9323a', modular: true, eff: '80plus' }, [[1200, 400], [1500, 480]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Toughpower XT {w}W', year: 2010, life: 4, tier: 4, accent: '#c9323a', modular: true, eff: 'gold' }, [[675, 130], [775, 150], [875, 170]]);
S({ brand: 'Tagan', tpl: 'Tagan {m}', year: 2007, life: 3, tier: 5, accent: '#c9323a', color: '#26282c', eff: '80plus' }, [[1100, 330, { m: 'PipeRock TG1100-BZ 1100W', modular: true }], [900, 280, { m: 'TurboJet TG900-U95 900W' }], [1100, 350, { m: 'TurboJet TG1100-U95 1100W' }]]);
S({ brand: 'Enermax', tpl: 'Enermax Infiniti {w}W', year: 2007, life: 4, tier: 4, accent: '#d4452a', modular: true, eff: '80plus' }, [[650, 190], [720, 220, { tier: 5 }]]);
S({ brand: 'Enermax', tpl: 'Enermax PRO82+ {w}W', year: 2008, life: 4, tier: 3, accent: '#d4452a', eff: 'bronze' }, [[425, 80, { tier: 2 }], [525, 100], [625, 120]]);
S({ brand: 'Enermax', tpl: 'Enermax MODU82+ {w}W', year: 2008, life: 4, tier: 3, accent: '#d4452a', eff: 'bronze', modular: true }, [[425, 100], [525, 120], [625, 140, { tier: 4 }]]);
S({ brand: 'Enermax', tpl: 'Enermax Revolution85+ {w}W', year: 2008, life: 5, tier: 5, accent: '#d4452a', eff: 'silver', modular: true }, [[850, 250], [920, 280], [1050, 330], [1250, 400]]);
S({ brand: 'Enermax', tpl: 'Enermax MODU87+ {w}W', year: 2010, life: 4, tier: 4, accent: '#d4452a', eff: 'gold', modular: true }, [[500, 130, { tier: 3 }], [600, 150], [700, 170], [800, 200, { tier: 5 }], [900, 230, { tier: 5 }]]);
S({ brand: 'PC Power & Cooling', tpl: 'PC Power & Cooling Silencer 750 Quad', year: 2007, life: 4, tier: 5, accent: '#2c6fb7', eff: '80plus' }, [[750, 250]]);
S({ brand: 'PC Power & Cooling', tpl: 'PC Power & Cooling Silencer Mk II {w}', year: 2009, life: 3, tier: 4, accent: '#2c6fb7', eff: 'silver' }, [[500, 100, { tier: 3 }], [610, 120], [750, 150], [910, 200, { tier: 5 }]]);
S({ brand: 'SilverStone', tpl: 'SilverStone {m}', year: 2007, life: 4, tier: 5, accent: '#9aa4ae', eff: '80plus' }, [[650, 170, { m: 'Olympia OP650', tier: 4 }], [1000, 300, { m: 'Olympia OP1000' }]]);
S({ brand: 'SilverStone', tpl: 'SilverStone Decathlon DA{w}', year: 2008, life: 4, tier: 4, accent: '#9aa4ae', eff: '80plus', modular: true }, [[650, 130], [750, 150], [1000, 250, { year: 2009, eff: 'silver', tier: 5 }], [1200, 300, { year: 2009, eff: 'silver', tier: 5 }]]);
S({ brand: 'SilverStone', tpl: 'SilverStone Strider Plus {m}', year: 2009, life: 4, tier: 3, accent: '#9aa4ae', eff: 'silver', modular: true }, [[500, 90, { m: 'ST50F-P' }], [600, 110, { m: 'ST60F-P' }], [750, 140, { m: 'ST75F-P', tier: 4 }], [850, 170, { m: 'ST85F-P', tier: 4 }]]);
S({ brand: 'SilverStone', tpl: 'SilverStone Strider {m}', year: 2009, life: 4, tier: 5, accent: '#9aa4ae', eff: 'silver', modular: true }, [[1500, 400, { m: 'ST1500' }]]);
S({ brand: 'SilverStone', tpl: 'SilverStone Strider Gold {m}', year: 2010, life: 4, tier: 4, accent: '#d8b24a', eff: 'gold', modular: true }, [[750, 150, { m: 'ST75F-G' }], [850, 180, { m: 'ST85F-G' }], [1000, 230, { m: 'ST1000-G', tier: 5 }]]);
S({ brand: 'FSP', tpl: 'FSP Epsilon {w}W', year: 2008, life: 4, tier: 4, accent: '#3f9b3a', eff: '80plus' }, [[600, 110, { tier: 3 }], [700, 130], [800, 150], [1010, 230, { tier: 5 }]]);
S({ brand: 'Chieftec', tpl: 'Chieftec {m}', year: 2007, life: 4, tier: 2, accent: '#2c6fb7', eff: '80plus' }, [[450, 50, { m: 'APS-450S 450W' }], [550, 60, { m: 'APS-550S 550W' }], [650, 75, { m: 'APS-650S 650W', tier: 3 }], [750, 95, { m: 'APS-750S 750W', tier: 3, year: 2008 }]]);
S({ brand: 'Chieftec', tpl: 'Chieftec Nitro85+ {m}', year: 2009, life: 4, tier: 3, accent: '#2c6fb7', eff: 'silver', modular: true }, [[650, 100, { m: 'BPS-650C' }], [750, 120, { m: 'BPS-750C' }], [850, 140, { m: 'BPS-850C', tier: 4 }]]);
S({ brand: 'Corsair', tpl: 'Corsair CX{w}', year: 2010, life: 3, tier: 2, accent: '#e8c030', color: '#1a1a1a', eff: '80plus' }, [[400, 50, { tier: 1 }], [500, 60], [600, 70]]);
S({ brand: 'Corsair', tpl: 'Corsair AX{w}', year: 2010, life: 5, tier: 5, accent: '#e8c030', color: '#1a1a1a', eff: 'gold', modular: true }, [[850, 200], [1200, 300], [650, 150, { year: 2011, tier: 4 }], [750, 170, { year: 2011, tier: 4 }]]);
S({ brand: 'Antec', tpl: 'Antec TruePower New TP-{w}', year: 2010, life: 4, tier: 3, accent: '#c9323a', eff: 'bronze', modular: true }, [[550, 90], [650, 110], [750, 130, { tier: 4 }]]);
S({ brand: 'Antec', tpl: 'Antec High Current Gamer HCG-{w}', year: 2010, life: 5, tier: 3, accent: '#c9323a', eff: 'bronze' }, [[400, 60, { tier: 2 }], [520, 75], [620, 90], [750, 110, { tier: 4 }], [900, 150, { year: 2011, tier: 4 }]]);

// ---- 2011–2015 ----
S({ brand: 'Antec', tpl: 'Antec High Current Pro HCP-{w}', year: 2011, life: 5, tier: 5, accent: '#c9323a', eff: 'gold', modular: true }, [[750, 160, { tier: 4 }], [850, 180], [1000, 230], [1200, 270]]);
S({ brand: 'Antec', tpl: 'Antec HCP-{w} Platinum', year: 2013, life: 5, tier: 5, accent: '#c0c6cc', eff: 'platinum', modular: true }, [[850, 200], [1000, 250], [1300, 320]]);
S({ brand: 'Antec', tpl: 'Antec VP{w}P', year: 2011, life: 5, tier: 1, accent: '#c9323a' }, [[350, 35], [450, 45], [550, 55], [650, 65]]);
S({ brand: 'Antec', tpl: 'Antec EarthWatts Green EA-{w}D', year: 2011, life: 5, tier: 2, accent: '#6aa84f', eff: 'bronze' }, [[380, 45], [430, 55], [500, 60]]);
S({ brand: 'Antec', tpl: 'Antec NeoECO {w}C', year: 2013, life: 5, tier: 2, accent: '#c9323a', eff: 'bronze' }, [[450, 50], [520, 60], [620, 70]]);
S({ brand: 'Antec', tpl: 'Antec VP{w}P Plus', year: 2015, life: 6, tier: 1, accent: '#c9323a', eff: '80plus' }, [[500, 45], [600, 55], [700, 65]]);
S({ brand: 'Corsair', tpl: 'Corsair GS{w}', year: 2011, life: 4, tier: 3, accent: '#c9323a', color: '#1a1a1a', eff: 'bronze' }, [[600, 80, { tier: 2 }], [700, 100], [800, 120]]);
S({ brand: 'Corsair', tpl: 'Corsair CX{w} V2', year: 2012, life: 4, tier: 2, accent: '#e8c030', color: '#1a1a1a', eff: 'bronze' }, [[430, 45, { tier: 1 }], [500, 55], [600, 65], [750, 85, { tier: 3 }]]);
S({ brand: 'Corsair', tpl: 'Corsair TX{w}M', year: 2012, life: 4, tier: 3, accent: '#e8c030', color: '#1a1a1a', eff: 'bronze', modular: true }, [[650, 100], [750, 120], [850, 140, { tier: 4 }]]);
S({ brand: 'Corsair', tpl: 'Corsair HX{w}', year: 2012, life: 5, tier: 4, accent: '#e8c030', color: '#1a1a1a', eff: 'gold', modular: true }, [[650, 130], [750, 150], [850, 170], [1050, 210, { tier: 5 }]]);
S({ brand: 'Corsair', tpl: 'Corsair AX{w}i', year: 2012, life: 6, tier: 5, accent: '#c0c6cc', color: '#1a1a1a', eff: 'platinum', modular: true }, [[860, 250], [1200, 350]]);
S({ brand: 'Corsair', tpl: 'Corsair RM{w}', year: 2013, life: 4, tier: 3, accent: '#e8c030', color: '#1a1a1a', eff: 'gold', modular: true }, [[450, 90], [550, 100], [650, 110], [750, 130, { tier: 4 }], [850, 150, { tier: 4 }], [1000, 190, { tier: 4 }]]);
S({ brand: 'Corsair', tpl: 'Corsair CS{w}M', year: 2013, life: 4, tier: 2, accent: '#e8c030', color: '#1a1a1a', eff: 'gold', modular: true }, [[450, 70], [550, 80], [650, 90, { tier: 3 }], [750, 110, { tier: 3 }]]);
S({ brand: 'Corsair', tpl: 'Corsair VS{w}', year: 2014, life: 5, tier: 1, accent: '#e8c030', color: '#1a1a1a', eff: '80plus' }, [[450, 45], [550, 55], [650, 65]]);
S({ brand: 'Corsair', tpl: 'Corsair HX{w}i', year: 2014, life: 7, tier: 4, accent: '#c0c6cc', color: '#1a1a1a', eff: 'platinum', modular: true }, [[750, 170], [850, 190], [1000, 220, { tier: 5 }], [1200, 290, { tier: 5 }]]);
S({ brand: 'Corsair', tpl: 'Corsair AX{w}', year: 2014, life: 5, tier: 4, accent: '#c0c6cc', color: '#1a1a1a', eff: 'platinum', modular: true }, [[760, 170], [860, 200]]);
S({ brand: 'Corsair', tpl: 'Corsair AX1500i', year: 2014, life: 6, tier: 5, accent: '#e9e9e6', color: '#1a1a1a', eff: 'titanium', modular: true }, [[1500, 450]]);
S({ brand: 'Corsair', tpl: 'Corsair CX{w}M', year: 2015, life: 5, tier: 2, accent: '#e8c030', color: '#1a1a1a', eff: 'bronze', modular: true }, [[450, 60, { tier: 1 }], [550, 70], [650, 80], [750, 90, { tier: 3 }]]);
S({ brand: 'Corsair', tpl: 'Corsair RM{w}i', year: 2015, life: 5, tier: 4, accent: '#e8c030', color: '#1a1a1a', eff: 'gold', modular: true }, [[650, 110, { tier: 3 }], [750, 130], [850, 150], [1000, 190, { tier: 5 }]]);
S({ brand: 'Corsair', tpl: 'Corsair RM{w}x', year: 2015, until: 2023, tier: 3, accent: '#e8c030', color: '#1a1a1a', eff: 'gold', modular: true }, [
  [550, 100], [650, 110], [750, 130, { tier: 4 }],
  [850, 150, { id: 'rm850x', cost: 1500, tier: 4 }],
  [1000, 190, { tier: 4 }],
]);
S({ brand: 'Seasonic', tpl: 'Seasonic X-{w}FL', year: 2011, life: 5, tier: 4, eff: 'platinum', modular: true, accent: '#c0c6cc', color: '#222326' }, [[400, 150], [460, 170]]);
S({ brand: 'Seasonic', tpl: 'Seasonic Platinum-{w}', year: 2011, life: 6, tier: 5, eff: 'platinum', modular: true, accent: '#c0c6cc', color: '#222326' }, [[860, 230], [1000, 260]]);
S({ brand: 'Seasonic', tpl: 'Seasonic S12G-{w}', year: 2013, life: 5, tier: 3, eff: 'gold', accent: '#d8b24a', color: '#222326' }, [[450, 80, { tier: 2 }], [550, 90], [650, 100], [750, 110]]);
S({ brand: 'Seasonic', tpl: 'Seasonic G-{w}', year: 2013, life: 5, tier: 3, eff: 'gold', modular: true, accent: '#d8b24a', color: '#222326' }, [[360, 70, { tier: 2 }], [450, 80], [550, 90], [650, 100]]);
S({ brand: 'Seasonic', tpl: 'Seasonic Snow Silent-{w}', year: 2014, life: 5, tier: 5, eff: 'platinum', modular: true, accent: '#c0c6cc', color: '#e9e9e6' }, [[750, 180], [1050, 250]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Dark Power Pro P9 {w}W', year: 2011, life: 4, tier: 5, accent: '#e07a2e', color: '#1b1b1d', eff: 'gold', modular: true }, [[550, 150, { tier: 4 }], [650, 170, { tier: 4 }], [750, 190], [850, 230], [1000, 280], [1200, 330]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Pure Power L8 {w}W', year: 2012, life: 5, tier: 2, accent: '#e07a2e', color: '#1b1b1d', eff: 'bronze' }, [[300, 45, { tier: 1 }], [350, 50], [430, 60], [530, 70], [630, 80, { tier: 3 }], [730, 95, { tier: 3 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Straight Power E9 {w}W', year: 2012, life: 4, tier: 3, accent: '#e07a2e', color: '#1b1b1d', eff: 'gold' }, [[400, 85], [450, 95], [500, 105], [580, 125, { name: 'be quiet! Straight Power E9 580W CM', modular: true, tier: 4 }], [680, 140, { name: 'be quiet! Straight Power E9 680W CM', modular: true, tier: 4 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Dark Power Pro P10 {w}W', year: 2012, life: 4, tier: 5, accent: '#e07a2e', color: '#1b1b1d', eff: 'gold', modular: true }, [[550, 150, { tier: 4 }], [650, 170, { tier: 4 }], [750, 190], [850, 220], [1000, 270], [1200, 320]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Power Zone {w}W', year: 2013, life: 5, tier: 4, accent: '#e07a2e', color: '#1b1b1d', eff: 'bronze', modular: true }, [[650, 100, { tier: 3 }], [750, 115], [850, 130], [1000, 160]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Dark Power Pro 11 {w}W', year: 2015, life: 6, tier: 5, accent: '#e07a2e', color: '#1b1b1d', eff: 'platinum', modular: true }, [[550, 150, { tier: 4 }], [650, 170, { tier: 4 }], [750, 190], [850, 220], [1000, 280], [1200, 330]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Straight Power 10 {w}W', year: 2015, life: 4, tier: 3, accent: '#e07a2e', color: '#1b1b1d', eff: 'gold' }, [[400, 80], [500, 95], [600, 110], [700, 140, { name: 'be quiet! Straight Power 10 700W CM', modular: true, tier: 4 }], [800, 160, { name: 'be quiet! Straight Power 10 800W CM', modular: true, tier: 4 }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master Silent Pro Hybrid {w}W', year: 2011, life: 4, tier: 5, modular: true, accent: '#d8b24a', eff: 'gold' }, [[1050, 290], [1300, 370]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master GX {w}W', year: 2011, life: 5, tier: 2, accent: '#7a5bc9', eff: 'bronze' }, [[450, 55], [550, 65], [650, 75, { tier: 3 }], [750, 90, { tier: 3 }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master B{w}', year: 2012, life: 5, tier: 1, accent: '#7a5bc9', eff: '80plus' }, [[500, 45], [600, 55], [700, 65]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master V{w}', year: 2013, life: 6, tier: 4, modular: true, accent: '#d8b24a', eff: 'gold' }, [[700, 150], [850, 170], [1000, 200, { tier: 5 }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master V1200 Platinum', year: 2014, life: 6, tier: 5, modular: true, accent: '#c0c6cc', eff: 'platinum' }, [[1200, 290]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master G{w}M', year: 2014, life: 5, tier: 2, modular: true, accent: '#7a5bc9', eff: 'bronze' }, [[450, 60], [550, 70], [650, 80, { tier: 3 }], [750, 90, { tier: 3 }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master V{w}S', year: 2015, life: 5, tier: 3, modular: true, accent: '#d8b24a', eff: 'gold' }, [[550, 90], [650, 100], [750, 120, { tier: 4 }]]);
S({ brand: 'OCZ', tpl: 'OCZ ZS {w}W', year: 2011, until: 2014, tier: 2, accent: '#3a8fd8', eff: 'bronze' }, [[550, 70], [650, 80], [750, 95, { tier: 3 }]]);
S({ brand: 'OCZ', tpl: 'OCZ ZT {w}W', year: 2012, until: 2014, tier: 3, accent: '#3a8fd8', eff: 'bronze', modular: true }, [[650, 90], [750, 100]]);
S({ brand: 'OCZ', tpl: 'OCZ ZX {w}W', year: 2012, until: 2014, tier: 5, accent: '#d8b24a', eff: 'gold', modular: true }, [[850, 170, { tier: 4 }], [1000, 200], [1250, 260]]);
S({ brand: 'PC Power & Cooling', tpl: 'PC Power & Cooling Silencer Mk III {w}W', year: 2012, life: 4, tier: 3, accent: '#2c6fb7', eff: 'bronze' }, [[400, 60, { tier: 2 }], [500, 70, { tier: 2 }], [600, 80], [750, 120, { eff: 'gold', modular: true, tier: 4 }], [850, 140, { eff: 'gold', modular: true, tier: 4 }], [1200, 250, { eff: 'gold', modular: true, tier: 5 }]]);
S({ brand: 'Zalman', tpl: 'Zalman ZM{w}-EBT', year: 2013, life: 5, tier: 4, accent: '#e07a2e', eff: 'gold', modular: true }, [[750, 150], [1000, 220, { tier: 5 }]]);
S({ brand: 'Zalman', tpl: 'Zalman ZM{w}-LX', year: 2011, life: 6, tier: 1, accent: '#e07a2e' }, [[500, 40], [600, 50]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Litepower {w}W', year: 2011, until: 2019, tier: 1, accent: '#c9323a' }, [[450, 35], [550, 45], [650, 55]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Toughpower Grand {w}W', year: 2012, life: 5, tier: 4, accent: '#d8b24a', eff: 'gold', modular: true }, [[650, 150], [750, 170], [850, 190], [1050, 250, { tier: 5 }], [1200, 300, { tier: 5 }]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Smart {w}W', year: 2012, life: 6, tier: 1, accent: '#c9323a', eff: '80plus' }, [[430, 45], [530, 55], [630, 65, { tier: 2 }], [730, 75, { tier: 2 }]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Smart SE {w}W', year: 2013, life: 5, tier: 2, accent: '#c9323a', eff: 'bronze', modular: true }, [[530, 65], [630, 75], [730, 85, { tier: 3 }]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Toughpower DPS G {w}W Gold', year: 2015, life: 5, tier: 4, accent: '#d8b24a', eff: 'gold', modular: true }, [[650, 130, { tier: 3 }], [750, 150], [850, 170], [1050, 220, { tier: 5 }]]);
S({ brand: 'Enermax', tpl: 'Enermax Platimax {w}W', year: 2011, life: 6, tier: 4, accent: '#c0c6cc', eff: 'platinum', modular: true }, [[500, 150], [600, 170], [750, 200], [850, 230, { tier: 5 }], [1000, 290, { tier: 5 }], [1200, 340, { tier: 5 }], [1350, 400, { tier: 5 }], [1500, 450, { tier: 5 }]]);
S({ brand: 'Enermax', tpl: 'Enermax Revolution87+ {w}W', year: 2012, life: 5, tier: 4, accent: '#d4452a', eff: 'gold', modular: true }, [[550, 120, { tier: 3 }], [650, 140], [750, 160], [850, 190], [1000, 240, { tier: 5 }]]);
S({ brand: 'Enermax', tpl: 'Enermax Triathlor {w}W', year: 2012, life: 5, tier: 2, accent: '#d4452a', eff: 'bronze' }, [[385, 55], [450, 65], [550, 80], [650, 90, { tier: 3 }], [700, 100, { tier: 3 }], [800, 120, { tier: 3 }], [1000, 170, { tier: 4 }]]);
S({ brand: 'Enermax', tpl: "Enermax Revolution X't {w}W", year: 2014, life: 5, tier: 3, accent: '#d4452a', eff: 'gold', modular: true }, [[430, 80], [530, 95], [630, 110], [730, 125]]);
S({ brand: 'EVGA', tpl: 'EVGA SuperNOVA {m}', year: 2012, life: 4, tier: 4, accent: '#3a8fd8', modular: true, eff: 'gold' }, [[650, 110, { m: 'NEX650G', tier: 3 }], [750, 130, { m: 'NEX750G' }], [750, 100, { m: 'NEX750B', eff: 'bronze', tier: 3 }], [1500, 400, { m: 'NEX1500 Classified', tier: 5 }]]);
S({ brand: 'EVGA', tpl: 'EVGA SuperNOVA {w} G2', year: 2013, life: 6, tier: 4, accent: '#d8b24a', modular: true, eff: 'gold' }, [[750, 130], [850, 160], [1000, 200, { tier: 5 }], [1300, 260, { tier: 5 }], [550, 90, { year: 2014, tier: 3 }], [650, 110, { year: 2014, tier: 3 }], [1600, 330, { year: 2014, tier: 5 }]]);
S({ brand: 'EVGA', tpl: 'EVGA SuperNOVA {w} P2', year: 2014, life: 6, tier: 4, accent: '#c0c6cc', modular: true, eff: 'platinum' }, [[750, 150], [850, 170], [1000, 220, { tier: 5 }], [1200, 280, { tier: 5 }], [1600, 370, { tier: 5 }], [650, 130, { year: 2015 }]]);
S({ brand: 'EVGA', tpl: 'EVGA SuperNOVA {w} T2', year: 2015, life: 6, tier: 5, accent: '#e9e9e6', modular: true, eff: 'titanium' }, [[750, 190], [850, 220], [1000, 270], [1600, 420]]);
S({ brand: 'EVGA', tpl: 'EVGA {w} W1', year: 2015, life: 6, tier: 1, accent: '#3a8fd8', eff: '80plus' }, [[430, 35], [500, 40], [600, 45]]);
S({ brand: 'FSP', tpl: 'FSP Aurum {w}', year: 2011, life: 5, tier: 3, accent: '#d8b24a', eff: 'gold' }, [[400, 70, { tier: 2 }], [500, 80], [600, 95], [700, 110]]);
S({ brand: 'FSP', tpl: 'FSP Aurum PRO {w}W', year: 2011, life: 5, tier: 4, accent: '#d8b24a', eff: 'gold', modular: true }, [[850, 170], [1000, 200, { tier: 5 }], [1200, 250, { tier: 5 }]]);
S({ brand: 'FSP', tpl: 'FSP Aurum CM {w}W', year: 2012, life: 5, tier: 3, accent: '#d8b24a', eff: 'gold', modular: true }, [[550, 90], [650, 100], [750, 120, { tier: 4 }]]);
S({ brand: 'FSP', tpl: 'FSP Raider {w}W', year: 2012, life: 5, tier: 2, accent: '#3f9b3a', eff: 'silver' }, [[450, 60], [550, 70], [650, 80], [750, 95, { tier: 3 }]]);
S({ brand: 'FSP', tpl: 'FSP Aurum 92+ {w}W', year: 2013, life: 5, tier: 4, accent: '#c0c6cc', eff: 'platinum', modular: true }, [[450, 90, { tier: 3 }], [550, 110], [650, 130], [750, 150]]);
S({ brand: 'FSP', tpl: 'FSP Hydro X {w}W', year: 2015, life: 5, tier: 3, accent: '#3f9b3a', eff: 'gold' }, [[450, 70, { tier: 2 }], [550, 80], [650, 90]]);
S({ brand: 'Fractal Design', tpl: 'Fractal Design Tesla R2 {w}W', year: 2012, life: 5, tier: 3, accent: '#e9e9e6', color: '#202124', eff: 'gold', modular: true }, [[500, 90], [650, 110], [800, 140, { tier: 4 }], [1000, 190, { tier: 4 }]]);
S({ brand: 'Fractal Design', tpl: 'Fractal Design Integra R2 {w}W', year: 2012, life: 4, tier: 2, accent: '#e9e9e6', color: '#202124', eff: 'bronze' }, [[500, 60], [650, 70], [750, 85, { tier: 3 }]]);
S({ brand: 'Fractal Design', tpl: 'Fractal Design Newton R2 {w}W', year: 2012, life: 4, tier: 4, accent: '#c0c6cc', color: '#202124', eff: 'platinum', modular: true }, [[650, 150], [800, 180], [1000, 230, { tier: 5 }]]);
S({ brand: 'Fractal Design', tpl: 'Fractal Design Newton R3 {w}W', year: 2013, life: 5, tier: 4, accent: '#c0c6cc', color: '#202124', eff: 'platinum', modular: true }, [[600, 130], [800, 170], [1000, 220, { tier: 5 }]]);
S({ brand: 'Fractal Design', tpl: 'Fractal Design Edison M {w}W', year: 2013, life: 5, tier: 3, accent: '#e9e9e6', color: '#202124', eff: 'gold', modular: true }, [[450, 90], [550, 100], [650, 110], [750, 130, { tier: 4 }]]);
S({ brand: 'SilverStone', tpl: 'SilverStone Strider Essential {m}', year: 2011, life: 6, tier: 1, accent: '#9aa4ae', eff: '80plus' }, [[400, 45, { m: 'ST40F-ES' }], [500, 55, { m: 'ST50F-ES' }], [600, 65, { m: 'ST60F-ES', tier: 2 }]]);
S({ brand: 'SilverStone', tpl: 'SilverStone {m}', year: 2011, life: 6, tier: 3, form: 'SFX', accent: '#9aa4ae', eff: 'bronze' }, [[300, 60, { m: 'ST30SF' }], [450, 70, { m: 'ST45SF', year: 2012 }], [450, 100, { m: 'ST45SF-G', year: 2013, eff: 'gold', modular: true, tier: 4 }]]);
S({ brand: 'SilverStone', tpl: 'SilverStone Strider Gold S {m}', year: 2013, life: 5, tier: 3, accent: '#d8b24a', eff: 'gold', modular: true }, [[550, 100, { m: 'ST55F-G' }], [650, 110, { m: 'ST65F-G' }]]);
S({ brand: 'SilverStone', tpl: 'SilverStone Strider Platinum {m}', year: 2013, life: 6, tier: 4, accent: '#c0c6cc', eff: 'platinum', modular: true }, [[1000, 250, { m: 'ST1000-PT', tier: 5 }], [1200, 300, { m: 'ST1200-PT', tier: 5 }], [650, 140, { m: 'ST65F-PT', year: 2014 }], [750, 160, { m: 'ST75F-PT', year: 2014 }], [850, 180, { m: 'ST85F-PT', year: 2014 }]]);
S({ brand: 'SilverStone', tpl: 'SilverStone Strider Titanium {m}', year: 2015, life: 6, tier: 5, accent: '#e9e9e6', eff: 'titanium', modular: true }, [[600, 160, { m: 'ST60F-TI', tier: 4 }], [800, 200, { m: 'ST80F-TI' }]]);
S({ brand: 'SilverStone', tpl: 'SilverStone {m}', year: 2015, life: 6, tier: 4, form: 'SFX', accent: '#9aa4ae', eff: 'gold', modular: true }, [[500, 120, { m: 'SX500-LG' }], [600, 120, { m: 'SX600-G' }]]);
S({ brand: 'Chieftec', tpl: 'Chieftec iArena {m}', year: 2012, life: 5, tier: 1, accent: '#2c6fb7', eff: '80plus' }, [[400, 40, { m: 'GPA-400B8' }], [450, 45, { m: 'GPA-450B8' }], [500, 50, { m: 'GPA-500B8' }], [600, 60, { m: 'GPA-600B8', tier: 2 }]]);
S({ brand: 'Chieftec', tpl: 'Chieftec A-80 {m}', year: 2012, life: 5, tier: 3, accent: '#d8b24a', eff: 'gold', modular: true }, [[550, 70, { m: 'CTG-550C' }], [650, 80, { m: 'CTG-650C' }], [750, 90, { m: 'CTG-750C' }]]);
S({ brand: 'Chieftec', tpl: 'Chieftec Proton {m}', year: 2014, life: 6, tier: 2, accent: '#2c6fb7', eff: 'bronze' }, [[500, 55, { m: 'BDF-500S' }], [600, 65, { m: 'BDF-600S' }], [750, 85, { m: 'BDF-750C', modular: true, tier: 3 }], [1000, 120, { m: 'BDF-1000C', modular: true, tier: 3 }]]);
S({ brand: 'Chieftec', tpl: 'Chieftec Force {m}', year: 2015, life: 6, tier: 1, accent: '#2c6fb7', eff: '80plus' }, [[400, 35, { m: 'CPS-400S' }], [500, 45, { m: 'CPS-500S' }], [650, 55, { m: 'CPS-650S' }]]);
S({ brand: 'Super Flower', tpl: 'Super Flower Leadex Gold {w}W', year: 2014, life: 6, tier: 3, accent: '#d8b24a', eff: 'gold', modular: true }, [[550, 90], [650, 100], [750, 110], [850, 130, { tier: 4 }], [1000, 160, { tier: 4 }]]);
S({ brand: 'Super Flower', tpl: 'Super Flower Leadex Platinum {w}W', year: 2014, life: 6, tier: 4, accent: '#c0c6cc', eff: 'platinum', modular: true }, [[850, 170], [1000, 200], [1200, 250, { tier: 5 }], [1600, 350, { tier: 5 }], [2000, 450, { tier: 5 }]]);

// ---- 2016–2021 ----
S({ brand: 'Corsair', tpl: 'Corsair SF{w}', year: 2016, life: 6, tier: 4, form: 'SFX', accent: '#e8c030', color: '#1a1a1a', eff: 'gold', modular: true }, [[450, 100], [600, 120]]);
S({ brand: 'Corsair', tpl: 'Corsair AX850 Titanium', year: 2016, life: 5, tier: 5, accent: '#e9e9e6', color: '#1a1a1a', eff: 'titanium', modular: true }, [[850, 250]]);
S({ brand: 'Corsair', tpl: 'Corsair CX{w}', year: 2017, life: 7, tier: 2, accent: '#e8c030', color: '#1a1a1a', eff: 'bronze' }, [[450, 50, { tier: 1 }], [550, 60], [650, 70], [750, 80, { tier: 3 }]]);
S({ brand: 'Corsair', tpl: 'Corsair TX{w}M Gold', year: 2017, life: 6, tier: 3, accent: '#e8c030', color: '#1a1a1a', eff: 'gold', modular: true }, [[550, 80], [650, 90]]);
S({ brand: 'Corsair', tpl: 'Corsair SF{w} Platinum', year: 2018, life: 6, tier: 5, form: 'SFX', accent: '#c0c6cc', color: '#1a1a1a', eff: 'platinum', modular: true }, [[600, 150, { tier: 4 }], [750, 180]]);
S({ brand: 'Corsair', tpl: 'Corsair AX1600i', year: 2018, life: 8, tier: 5, accent: '#e9e9e6', color: '#1a1a1a', eff: 'titanium', modular: true }, [[1600, 500]]);
S({ brand: 'Corsair', tpl: 'Corsair CX{w}F RGB', year: 2020, life: 5, tier: 2, rgb: true, accent: '#e8c030', color: '#1a1a1a', eff: 'bronze', modular: true }, [[550, 70], [650, 80], [750, 90, { tier: 3 }]]);
S({ brand: 'Corsair', tpl: 'Corsair CV{w}', year: 2021, until: 2026, tier: 1, accent: '#e8c030', color: '#1c1c1c', eff: 'bronze', style: 'atx-black' }, [
  [450, 45], [550, 55, { id: 'cv550', cost: 550 }], [650, 65], [750, 75, { tier: 2 }],
]);
S({ brand: 'Seasonic', tpl: 'Seasonic PRIME Titanium {w}', year: 2016, life: 5, tier: 5, eff: 'titanium', modular: true, accent: '#e9e9e6', color: '#222326' }, [[650, 170], [750, 190], [850, 210]]);
S({ brand: 'Seasonic', tpl: 'Seasonic FOCUS Plus Gold {w}', year: 2017, life: 5, tier: 3, eff: 'gold', modular: true, accent: '#d8b24a', color: '#222326' }, [[550, 80], [650, 90], [750, 110], [850, 130, { tier: 4 }]]);
S({ brand: 'Seasonic', tpl: 'Seasonic FOCUS Plus Platinum {w}', year: 2017, life: 5, tier: 4, eff: 'platinum', modular: true, accent: '#c0c6cc', color: '#222326' }, [[550, 100, { tier: 3 }], [650, 110], [750, 130], [850, 150]]);
S({ brand: 'Seasonic', tpl: 'Seasonic PRIME Ultra Titanium {w}', year: 2018, life: 5, tier: 5, eff: 'titanium', modular: true, accent: '#e9e9e6', color: '#222326' }, [[650, 180], [750, 200], [850, 230], [1000, 270]]);
S({ brand: 'Seasonic', tpl: 'Seasonic FOCUS GX-{w}', year: 2019, until: 2024, tier: 3, eff: 'gold', modular: true, accent: '#9aa4ae', color: '#222326' }, [
  [550, 100], [650, 110], [750, 130, { id: 'focus-gx-750', cost: 1200, tier: 3 }], [850, 150, { tier: 4 }], [1000, 180, { tier: 4 }],
]);
S({ brand: 'Seasonic', tpl: 'Seasonic FOCUS GM-{w}', year: 2019, life: 5, tier: 3, eff: 'gold', modular: true, accent: '#9aa4ae', color: '#222326' }, [[550, 80, { tier: 2 }], [650, 90], [750, 100]]);
S({ brand: 'Seasonic', tpl: 'Seasonic PRIME GX-{w}', year: 2020, life: 5, tier: 4, eff: 'gold', modular: true, accent: '#d8b24a', color: '#222326' }, [[650, 150], [750, 170], [850, 190], [1000, 230, { tier: 5 }], [1300, 300, { tier: 5 }]]);
S({ brand: 'Seasonic', tpl: 'Seasonic PRIME PX-{w}', year: 2020, life: 5, tier: 4, eff: 'platinum', modular: true, accent: '#c0c6cc', color: '#222326' }, [[750, 180], [850, 200], [1000, 250, { tier: 5 }], [1300, 320, { tier: 5 }]]);
S({ brand: 'Seasonic', tpl: 'Seasonic PRIME TX-{w}', year: 2020, life: 5, tier: 5, eff: 'titanium', modular: true, accent: '#e9e9e6', color: '#222326' }, [[650, 220], [750, 250], [850, 280], [1000, 330]]);
S({ brand: 'Seasonic', tpl: 'Seasonic CORE {m}-{w}', year: 2021, life: 5, tier: 2, eff: 'gold', accent: '#9aa4ae', color: '#222326' }, [[500, 60, { m: 'GC' }], [650, 70, { m: 'GC' }], [500, 70, { m: 'GM', modular: true }], [650, 80, { m: 'GM', modular: true }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Pure Power 9 {w}W', year: 2016, life: 4, tier: 2, accent: '#e07a2e', color: '#1b1b1d', eff: 'silver' }, [[300, 50, { tier: 1 }], [350, 55], [400, 60], [500, 70], [600, 85, { tier: 3 }], [700, 100, { tier: 3 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Pure Power 10 {w}W', year: 2017, life: 5, tier: 2, accent: '#e07a2e', color: '#1b1b1d', eff: 'silver' }, [[300, 50, { tier: 1 }], [350, 55], [400, 60], [500, 70], [600, 85, { tier: 3 }], [700, 100, { tier: 3 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! SFX L Power {w}W', year: 2017, life: 7, tier: 4, form: 'SFX', accent: '#e07a2e', color: '#1b1b1d', eff: 'gold', modular: true }, [[500, 110], [600, 130]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Straight Power 11 {w}W', year: 2018, life: 5, tier: 3, accent: '#e07a2e', color: '#1b1b1d', eff: 'gold', modular: true }, [[450, 100], [550, 110], [650, 120], [750, 140, { tier: 4 }], [850, 160, { tier: 4 }], [1000, 200, { tier: 4 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! System Power 9 {w}W', year: 2018, life: 5, tier: 1, accent: '#e07a2e', color: '#1b1b1d', eff: 'bronze' }, [[400, 45], [500, 55], [600, 65, { tier: 2 }], [700, 75, { tier: 2 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Pure Power 11 {w}W', year: 2019, life: 5, tier: 2, accent: '#e07a2e', color: '#1b1b1d', eff: 'gold' }, [[400, 65], [500, 75], [600, 85], [700, 100, { tier: 3 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! SFX Power 3 {w}W', year: 2020, life: 6, tier: 2, form: 'SFX', accent: '#e07a2e', color: '#1b1b1d', eff: 'bronze' }, [[300, 60], [400, 70], [450, 80, { tier: 3 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Dark Power Pro 12 {w}W', year: 2020, life: 5, tier: 5, accent: '#e07a2e', color: '#1b1b1d', eff: 'titanium', modular: true }, [[1200, 400], [1500, 500]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Straight Power 11 Platinum {w}W', year: 2020, life: 4, tier: 4, accent: '#e07a2e', color: '#1b1b1d', eff: 'platinum', modular: true }, [[750, 160], [850, 180], [1000, 220, { tier: 5 }], [1200, 270, { tier: 5 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Dark Power 12 {w}W', year: 2021, life: 4, tier: 5, accent: '#e07a2e', color: '#1b1b1d', eff: 'titanium', modular: true }, [[750, 230], [850, 260]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Pure Power 11 FM {w}W', year: 2021, life: 4, tier: 3, accent: '#e07a2e', color: '#1b1b1d', eff: 'gold', modular: true }, [[550, 95], [650, 110], [750, 125], [850, 140, { tier: 4 }], [1000, 180, { tier: 4 }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master MasterWatt {w}', year: 2016, life: 5, tier: 2, modular: true, accent: '#7a5bc9', eff: 'bronze' }, [[450, 60], [550, 70], [650, 80, { tier: 3 }], [750, 90, { tier: 3 }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master MasterWatt Lite {w}', year: 2016, life: 5, tier: 1, accent: '#7a5bc9', eff: '80plus' }, [[400, 40], [500, 50], [600, 60]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master MasterWatt Maker 1200 MIJ', year: 2016, life: 5, tier: 5, modular: true, accent: '#e9e9e6', eff: 'titanium' }, [[1200, 350]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master MWE {w} White', year: 2017, life: 6, tier: 1, accent: '#7a5bc9', eff: '80plus' }, [[450, 45], [550, 55], [650, 65, { tier: 2 }], [750, 75, { tier: 2 }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master MWE Gold {w}', year: 2018, life: 5, tier: 3, modular: true, accent: '#d8b24a', eff: 'gold' }, [[550, 80], [650, 90], [750, 100]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master MWE Bronze {w} V2', year: 2019, life: 7, tier: 1, accent: '#7a5bc9', eff: 'bronze' }, [[450, 50], [550, 60], [650, 70, { tier: 2 }], [750, 80, { tier: 2 }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master V{w} SFX Gold', year: 2019, life: 6, tier: 4, form: 'SFX', modular: true, accent: '#d8b24a', eff: 'gold' }, [[550, 110], [650, 120], [750, 140], [850, 160]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master V{w} Gold V2', year: 2020, life: 5, tier: 3, modular: true, accent: '#d8b24a', eff: 'gold' }, [[550, 100], [650, 110], [750, 130, { tier: 4 }], [850, 150, { tier: 4 }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master MWE Gold {w} V2 Full Modular', year: 2020, life: 5, tier: 3, modular: true, accent: '#d8b24a', eff: 'gold' }, [[650, 90], [750, 110], [850, 130]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master V{w} Platinum', year: 2019, life: 5, tier: 5, modular: true, accent: '#c0c6cc', eff: 'platinum' }, [[1100, 250], [1300, 280]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master XG{w} Plus Platinum', year: 2021, life: 5, tier: 4, rgb: true, modular: true, accent: '#c0c6cc', eff: 'platinum' }, [[650, 150], [750, 170], [850, 190]]);
S({ brand: 'EVGA', tpl: 'EVGA SuperNOVA {w} G3', year: 2016, life: 5, tier: 3, accent: '#d8b24a', modular: true, eff: 'gold' }, [[550, 90], [650, 100], [750, 120, { tier: 4 }], [850, 140, { tier: 4 }], [1000, 180, { tier: 4 }]]);
S({ brand: 'EVGA', tpl: 'EVGA {w} B3', year: 2016, life: 5, tier: 2, accent: '#3a8fd8', modular: true, eff: 'bronze' }, [[450, 55], [550, 65], [650, 75], [750, 85, { tier: 3 }]]);
S({ brand: 'EVGA', tpl: 'EVGA SuperNOVA {w} GQ', year: 2016, life: 5, tier: 3, accent: '#d8b24a', modular: true, eff: 'gold' }, [[650, 90], [750, 100], [850, 120], [1000, 150, { tier: 4 }]]);
S({ brand: 'EVGA', tpl: 'EVGA {w} BQ', year: 2016, life: 6, tier: 2, accent: '#3a8fd8', modular: true, eff: 'bronze' }, [[500, 55], [600, 65], [750, 75], [850, 90, { tier: 3 }]]);
S({ brand: 'EVGA', tpl: 'EVGA {w} BR', year: 2019, life: 6, tier: 1, accent: '#3a8fd8', eff: 'bronze' }, [[450, 50], [500, 55], [600, 60], [700, 70, { tier: 2 }]]);
S({ brand: 'EVGA', tpl: 'EVGA SuperNOVA {w} G5', year: 2019, life: 5, tier: 3, accent: '#d8b24a', modular: true, eff: 'gold' }, [[550, 90], [650, 100], [750, 120, { tier: 4 }], [850, 140, { tier: 4 }], [1000, 180, { tier: 4 }]]);
S({ brand: 'EVGA', tpl: 'EVGA SuperNOVA {w} P6', year: 2020, life: 5, tier: 4, accent: '#c0c6cc', modular: true, eff: 'platinum' }, [[650, 120], [750, 130], [850, 150], [1000, 190, { tier: 5 }]]);
S({ brand: 'EVGA', tpl: 'EVGA SuperNOVA {w} GT', year: 2020, life: 5, tier: 3, accent: '#d8b24a', modular: true, eff: 'gold' }, [[650, 100], [750, 110], [850, 130], [1000, 170, { tier: 4 }]]);
S({ brand: 'EVGA', tpl: 'EVGA SuperNOVA {w} G6', year: 2021, life: 5, tier: 4, accent: '#d8b24a', modular: true, eff: 'gold' }, [[650, 110, { tier: 3 }], [750, 120], [850, 130], [1000, 180]]);
S({ brand: 'EVGA', tpl: 'EVGA SuperNOVA {w} G7', year: 2022, life: 4, tier: 4, accent: '#d8b24a', modular: true, eff: 'gold' }, [[650, 110, { tier: 3 }], [750, 120], [850, 140], [1000, 180]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Toughpower Grand RGB {w}W Gold', year: 2017, life: 5, tier: 3, rgb: true, accent: '#d8b24a', eff: 'gold', modular: true }, [[650, 120], [750, 140, { tier: 4 }], [850, 160, { tier: 4 }]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Smart RGB {w}W', year: 2017, life: 6, tier: 1, rgb: true, accent: '#c9323a', eff: '80plus' }, [[500, 50], [600, 60], [700, 70, { tier: 2 }]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Toughpower iRGB PLUS {w}W Platinum', year: 2018, life: 5, tier: 5, rgb: true, accent: '#c0c6cc', eff: 'platinum', modular: true }, [[850, 220, { tier: 4 }], [1050, 260], [1250, 330]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Toughpower GF1 {w}W', year: 2019, life: 5, tier: 3, accent: '#d8b24a', eff: 'gold', modular: true }, [[650, 110], [750, 120], [850, 140, { tier: 4 }], [1000, 180, { tier: 4 }]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Smart BX1 {w}W', year: 2019, life: 7, tier: 1, accent: '#c9323a', eff: 'bronze' }, [[450, 50], [550, 60], [650, 70, { tier: 2 }], [750, 80, { tier: 2 }]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Smart BM2 {w}W', year: 2020, life: 6, tier: 2, accent: '#c9323a', eff: 'bronze', modular: true }, [[550, 65], [650, 75], [750, 85]]);
S({ brand: 'Enermax', tpl: "Enermax Revolution X't II {w}W", year: 2016, life: 4, tier: 3, accent: '#d4452a', eff: 'gold', modular: true }, [[550, 90], [650, 100], [750, 120]]);
S({ brand: 'Enermax', tpl: 'Enermax Platimax D.F. {w}W', year: 2017, life: 6, tier: 4, accent: '#c0c6cc', eff: 'platinum', modular: true }, [[500, 110, { tier: 3 }], [600, 130], [750, 160], [850, 180], [1050, 250, { tier: 5 }], [1200, 290, { tier: 5 }]]);
S({ brand: 'Enermax', tpl: 'Enermax Revolution D.F. {w}W', year: 2019, life: 5, tier: 3, accent: '#d4452a', eff: 'gold', modular: true }, [[550, 100], [650, 110], [750, 130, { tier: 4 }], [850, 150, { tier: 4 }]]);
S({ brand: 'Antec', tpl: 'Antec NeoECO Modular NE{w}M', year: 2017, life: 5, tier: 2, accent: '#c9323a', eff: 'bronze', modular: true }, [[550, 65], [650, 75]]);
S({ brand: 'Antec', tpl: 'Antec EarthWatts Gold Pro EA{w}G', year: 2017, life: 6, tier: 3, accent: '#6aa84f', eff: 'gold', modular: true }, [[550, 75, { tier: 2 }], [650, 85], [750, 95]]);
S({ brand: 'Antec', tpl: 'Antec HCG{w} Gold', year: 2017, life: 6, tier: 4, accent: '#c9323a', eff: 'gold', modular: true }, [[650, 110, { tier: 3 }], [750, 120], [850, 140]]);
S({ brand: 'Antec', tpl: 'Antec CSK{w}', year: 2017, life: 6, tier: 1, accent: '#c9323a', eff: 'bronze' }, [[450, 45], [550, 55], [650, 65, { tier: 2 }]]);
S({ brand: 'Antec', tpl: 'Antec NeoECO Gold NE{w}G', year: 2019, life: 6, tier: 3, accent: '#d8b24a', eff: 'gold', modular: true }, [[550, 80, { tier: 2 }], [650, 90], [750, 100]]);
S({ brand: 'Antec', tpl: 'Antec {m}', year: 2019, life: 6, tier: 5, accent: '#c0c6cc', modular: true }, [[1000, 190, { m: 'HCG1000 Extreme', eff: 'gold', tier: 4 }], [1000, 250, { m: 'Signature SP1000', eff: 'platinum' }], [1000, 300, { m: 'Signature ST1000', eff: 'titanium', year: 2020 }]]);
S({ brand: 'FSP', tpl: 'FSP Hydro G {w}W', year: 2016, life: 5, tier: 3, accent: '#3f9b3a', eff: 'gold', modular: true }, [[650, 100], [750, 120, { tier: 4 }], [850, 140, { tier: 4 }]]);
S({ brand: 'FSP', tpl: 'FSP Hydro K {w}W', year: 2017, life: 6, tier: 1, accent: '#3f9b3a', eff: 'bronze' }, [[500, 50], [600, 60], [700, 70, { tier: 2 }]]);
S({ brand: 'FSP', tpl: 'FSP Dagger {m}', year: 2016, life: 7, tier: 4, form: 'SFX', accent: '#3f9b3a', eff: 'gold', modular: true }, [[500, 90, { m: '500W' }], [550, 100, { m: 'PRO 550W', year: 2018 }], [650, 110, { m: 'PRO 650W', year: 2018 }], [750, 130, { m: 'PRO 750W', year: 2018 }], [850, 170, { m: 'PRO 850W', year: 2018, tier: 5 }]]);
S({ brand: 'FSP', tpl: 'FSP Hydro PTM+ {w}W', year: 2019, life: 5, tier: 5, accent: '#c0c6cc', eff: 'platinum', modular: true }, [[850, 280], [1200, 350]]);
S({ brand: 'FSP', tpl: 'FSP Hydro G PRO {w}W', year: 2020, life: 5, tier: 3, accent: '#3f9b3a', eff: 'gold', modular: true }, [[650, 110], [750, 120], [850, 140, { tier: 4 }], [1000, 180, { tier: 4 }]]);
S({ brand: 'Fractal Design', tpl: 'Fractal Design Integra M {w}W', year: 2016, life: 6, tier: 2, accent: '#e9e9e6', color: '#202124', eff: 'bronze', modular: true }, [[450, 55, { tier: 1 }], [550, 65], [650, 75], [750, 85]]);
S({ brand: 'Fractal Design', tpl: 'Fractal Design Ion+ {w}P', year: 2018, life: 4, tier: 4, accent: '#c0c6cc', color: '#202124', eff: 'platinum', modular: true }, [[560, 110, { tier: 3 }], [660, 130], [760, 150], [860, 180]]);
S({ brand: 'Fractal Design', tpl: 'Fractal Design Ion SFX {w}G', year: 2019, life: 6, tier: 4, form: 'SFX', accent: '#d8b24a', color: '#202124', eff: 'gold', modular: true }, [[500, 110], [650, 130]]);
S({ brand: 'Fractal Design', tpl: 'Fractal Design Ion Gold {w}W', year: 2020, life: 5, tier: 3, accent: '#d8b24a', color: '#202124', eff: 'gold', modular: true }, [[550, 90], [650, 100], [750, 120], [850, 140, { tier: 4 }]]);
S({ brand: 'Fractal Design', tpl: 'Fractal Design Ion+ 2 Platinum {w}W', year: 2021, life: 5, tier: 4, accent: '#c0c6cc', color: '#202124', eff: 'platinum', modular: true }, [[560, 120, { tier: 3 }], [660, 140], [760, 160], [860, 190]]);
S({ brand: 'SilverStone', tpl: 'SilverStone {m}', year: 2016, life: 6, tier: 4, form: 'SFX', accent: '#9aa4ae', modular: true }, [[700, 150, { m: 'SX700-LPT', eff: 'platinum' }], [650, 130, { m: 'SX650-G', year: 2017, eff: 'gold' }], [800, 200, { m: 'SX800-LTI', year: 2018, eff: 'titanium', tier: 5 }], [1000, 260, { m: 'SX1000-LPT', year: 2020, eff: 'platinum', tier: 5 }]]);
S({ brand: 'SilverStone', tpl: 'SilverStone Essential Gold {m}', year: 2016, life: 6, tier: 2, accent: '#9aa4ae', eff: 'gold' }, [[550, 70, { m: 'ET550-G' }], [650, 80, { m: 'ET650-G' }], [750, 90, { m: 'ET750-G', tier: 3 }]]);
S({ brand: 'SilverStone', tpl: 'SilverStone {m}', year: 2017, life: 6, tier: 5, accent: '#e9e9e6', modular: true }, [[1500, 380, { m: 'Strider Titanium ST1500-TI', eff: 'titanium' }], [850, 200, { m: 'HELA 850R Platinum', year: 2021, eff: 'platinum', tier: 4 }], [1200, 280, { m: 'HELA 1200R Platinum', year: 2021, eff: 'platinum' }]]);
S({ brand: 'Chieftec', tpl: 'Chieftec Eco {m}', year: 2016, life: 6, tier: 1, accent: '#2c6fb7', eff: '80plus' }, [[500, 40, { m: 'GPE-500S' }], [600, 50, { m: 'GPE-600S' }], [700, 60, { m: 'GPE-700S' }]]);
S({ brand: 'Chieftec', tpl: 'Chieftec PowerPlay {m}', year: 2018, life: 6, tier: 4, accent: '#c0c6cc', eff: 'platinum', modular: true }, [[550, 90, { m: 'GPU-550FC', tier: 3 }], [650, 110, { m: 'GPU-650FC' }], [750, 130, { m: 'GPU-750FC' }], [850, 150, { m: 'GPU-850FC' }]]);
S({ brand: 'Chieftec', tpl: 'Chieftec PowerUP {m}', year: 2019, life: 6, tier: 2, accent: '#d8b24a', eff: 'gold', modular: true }, [[550, 70, { m: 'GPX-550FC' }], [650, 80, { m: 'GPX-650FC' }], [750, 90, { m: 'GPX-750FC', tier: 3 }], [850, 110, { m: 'GPX-850FC', tier: 3 }]]);
S({ brand: 'Chieftec', tpl: 'Chieftec Photon {m}', year: 2019, life: 5, tier: 3, rgb: true, accent: '#d8b24a', eff: 'gold', modular: true }, [[650, 90, { m: 'GDP-650C-RGB' }], [750, 100, { m: 'GDP-750C-RGB' }]]);
S({ brand: 'Chieftec', tpl: 'Chieftec Polaris {m}', year: 2021, life: 5, tier: 3, accent: '#d8b24a', eff: 'gold', modular: true }, [[550, 80, { m: 'PPS-550FC', tier: 2 }], [650, 90, { m: 'PPS-650FC' }], [750, 100, { m: 'PPS-750FC' }], [850, 120, { m: 'PPS-850FC', tier: 4 }], [1050, 150, { m: 'PPS-1050FC', tier: 4 }], [1250, 180, { m: 'PPS-1250FC', tier: 4 }]]);
S({ brand: 'Zalman', tpl: 'Zalman {m}', year: 2016, life: 6, tier: 2, accent: '#e07a2e' }, [[1000, 230, { m: 'ZM1000-ARX', eff: 'platinum', modular: true, tier: 5 }], [600, 60, { m: 'ZM600-GVII', year: 2018, eff: 'bronze' }], [700, 70, { m: 'ZM700-GVII', year: 2018, eff: 'bronze' }]]);
S({ brand: 'Zalman', tpl: 'Zalman MegaMax {w}W', year: 2018, life: 7, tier: 1, accent: '#e07a2e', eff: '80plus' }, [[600, 50], [700, 60], [800, 70, { tier: 2 }]]);
S({ brand: 'Zalman', tpl: 'Zalman GigaMax {w}W', year: 2020, life: 6, tier: 2, accent: '#e07a2e', eff: 'bronze' }, [[650, 65], [750, 75], [850, 85]]);
S({ brand: 'Zalman', tpl: 'Zalman TeraMax {w}W', year: 2020, life: 4, tier: 3, accent: '#e07a2e', eff: 'gold', modular: true }, [[750, 110], [850, 130], [1000, 160, { tier: 4 }]]);
S({ brand: 'Super Flower', tpl: 'Super Flower Leadex Titanium {w}W', year: 2016, life: 6, tier: 5, accent: '#e9e9e6', eff: 'titanium', modular: true }, [[750, 200, { tier: 4 }], [850, 220], [1000, 260], [1600, 400]]);
S({ brand: 'Super Flower', tpl: 'Super Flower Leadex III Gold {w}W', year: 2019, life: 5, tier: 3, accent: '#d8b24a', eff: 'gold', modular: true }, [[650, 100], [750, 110], [850, 120, { tier: 4 }]]);
S({ brand: 'NZXT', tpl: 'NZXT E{w}', year: 2018, life: 3, tier: 4, accent: '#7a5bc9', eff: 'gold', modular: true }, [[500, 125, { tier: 3 }], [650, 150], [850, 180]]);
S({ brand: 'NZXT', tpl: 'NZXT C{w}', year: 2019, life: 4, tier: 3, accent: '#7a5bc9', eff: 'gold', modular: true }, [[650, 90], [750, 100], [850, 120, { tier: 4 }]]);
S({ brand: 'ASUS', tpl: 'ASUS ROG Thor {w}P', year: 2019, life: 4, tier: 5, rgb: true, accent: '#c9323a', color: '#16171a', eff: 'platinum', modular: true }, [[850, 230], [1200, 340]]);
S({ brand: 'ASUS', tpl: 'ASUS ROG Strix {w}G', year: 2020, life: 4, tier: 4, accent: '#c9323a', color: '#16171a', eff: 'gold', modular: true }, [[650, 120, { tier: 3 }], [750, 130], [850, 150], [1000, 190]]);
S({ brand: 'ASUS', tpl: 'ASUS TUF Gaming {w}B', year: 2021, life: 5, tier: 2, accent: '#d8b24a', color: '#1d1e21', eff: 'bronze' }, [[550, 60], [650, 70], [750, 80]]);
S({ brand: 'MSI', tpl: 'MSI MPG A{w}GF', year: 2020, life: 4, tier: 3, accent: '#c9323a', color: '#1a1b1e', eff: 'gold', modular: true }, [[650, 100], [750, 110], [850, 130, { tier: 4 }]]);
S({ brand: 'MSI', tpl: 'MSI MAG A{w}BN', year: 2021, life: 5, tier: 1, accent: '#c9323a', color: '#1a1b1e', eff: 'bronze' }, [[550, 55], [650, 65, { tier: 2 }]]);
S({ brand: 'Gigabyte', tpl: 'Gigabyte {m}', year: 2019, life: 5, tier: 3, accent: '#e07a2e', eff: 'gold', modular: true }, [[850, 150, { m: 'AORUS P850W', rgb: true, tier: 4 }], [750, 90, { m: 'P750GM', year: 2020 }], [850, 110, { m: 'P850GM', year: 2020 }], [750, 90, { m: 'UD750GM', year: 2021 }], [850, 110, { m: 'UD850GM', year: 2021 }], [1200, 280, { m: 'AORUS P1200W', year: 2021, eff: 'platinum', tier: 5 }]]);
S({ brand: 'XPG', tpl: 'XPG {m}', year: 2020, life: 5, tier: 3, accent: '#c9323a', modular: true }, [[650, 90, { m: 'CORE REACTOR 650W', eff: 'gold' }], [750, 100, { m: 'CORE REACTOR 750W', eff: 'gold' }], [850, 120, { m: 'CORE REACTOR 850W', eff: 'gold', tier: 4 }], [550, 60, { m: 'PYLON 550W', eff: 'bronze', modular: false, tier: 2 }], [650, 70, { m: 'PYLON 650W', eff: 'bronze', modular: false, tier: 2 }], [1000, 230, { m: 'CYBERCORE 1000W Platinum', year: 2021, eff: 'platinum', tier: 5 }]]);
S({ brand: 'DeepCool', tpl: 'DeepCool {m}', year: 2019, life: 5, tier: 3, accent: '#3a8fd8' }, [[650, 90, { m: 'DQ650-M-V2L', eff: 'gold', modular: true }], [750, 100, { m: 'DQ750-M-V2L', eff: 'gold', modular: true }], [850, 110, { m: 'DQ850-M-V2L', eff: 'gold', modular: true, tier: 4 }], [550, 50, { m: 'PK550D', year: 2021, eff: 'bronze', tier: 1 }], [650, 60, { m: 'PK650D', year: 2021, eff: 'bronze', tier: 2 }], [750, 70, { m: 'PK750D', year: 2021, eff: 'bronze', tier: 2 }]]);
S({ brand: 'Montech', tpl: 'Montech Century {w}W', year: 2021, life: 5, tier: 3, accent: '#e8c030', eff: 'gold', modular: true }, [[650, 80, { tier: 2 }], [750, 90], [850, 100]]);

// ---- 2022–2026: ATX 3.0/3.1 med 12V-2x6 (12VHPWR) ----
const A3 = { v12: true, modular: true };
S({ brand: 'Thermaltake', tpl: 'Thermaltake Toughpower GF3 {w}W', year: 2022, life: 4, tier: 4, ...A3, accent: '#d8b24a', eff: 'gold' }, [[750, 140, { tier: 3 }], [850, 160], [1000, 200], [1200, 260, { tier: 5 }], [1350, 300, { tier: 5 }], [1650, 420, { tier: 5 }]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Toughpower GF A3 {w}W', year: 2023, life: 4, tier: 3, ...A3, accent: '#d8b24a', eff: 'gold' }, [[750, 110], [850, 130], [1050, 160, { tier: 4 }], [1200, 190, { tier: 4 }]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Toughpower PF3 {w}W', year: 2023, life: 4, tier: 5, ...A3, accent: '#c0c6cc', eff: 'platinum' }, [[850, 190, { tier: 4 }], [1050, 220], [1200, 260]]);
S({ brand: 'Thermaltake', tpl: 'Thermaltake Toughpower TF3 1550W Titanium', year: 2023, life: 4, tier: 5, ...A3, accent: '#e9e9e6', eff: 'titanium' }, [[1550, 500]]);
S({ brand: 'MSI', tpl: 'MSI {m}', year: 2022, life: 4, tier: 4, ...A3, accent: '#c9323a', color: '#1a1b1e', eff: 'gold' }, [[750, 140, { m: 'MPG A750G PCIE5', tier: 3 }], [850, 160, { m: 'MPG A850G PCIE5' }], [1000, 190, { m: 'MPG A1000G PCIE5' }], [1300, 300, { m: 'MEG Ai1300P PCIE5', eff: 'platinum', tier: 5 }]]);
S({ brand: 'MSI', tpl: 'MSI {m}', year: 2023, life: 4, tier: 3, ...A3, accent: '#c9323a', color: '#1a1b1e', eff: 'gold' }, [[750, 100, { m: 'MAG A750GL PCIE5' }], [850, 120, { m: 'MAG A850GL PCIE5' }], [1000, 150, { m: 'MAG A1000GL PCIE5', tier: 4 }], [1000, 250, { m: 'MEG Ai1000P PCIE5', eff: 'platinum', tier: 5 }], [1600, 500, { m: 'MEG Ai1600T PCIE5', year: 2024, eff: 'titanium', tier: 5 }]]);
S({ brand: 'Gigabyte', tpl: 'Gigabyte {m}', year: 2022, life: 4, tier: 3, ...A3, accent: '#e07a2e', eff: 'gold' }, [[1000, 170, { m: 'UD1000GM PG5', tier: 4 }], [850, 130, { m: 'UD850GM PG5', year: 2023 }], [1000, 230, { m: 'AORUS ELITE P1000W Platinum', year: 2023, eff: 'platinum', tier: 5 }]]);
S({ brand: 'Seasonic', tpl: 'Seasonic VERTEX {m}-{w}', year: 2023, life: 4, tier: 4, ...A3, accent: '#9aa4ae', color: '#222326', eff: 'gold' }, [[750, 150, { m: 'GX' }], [850, 170, { m: 'GX' }], [1000, 200, { m: 'GX', tier: 5 }], [1200, 260, { m: 'GX', tier: 5 }], [750, 180, { m: 'PX', eff: 'platinum' }], [850, 210, { m: 'PX', eff: 'platinum', tier: 5 }], [1000, 260, { m: 'PX', eff: 'platinum', tier: 5 }]]);
S({ brand: 'Seasonic', tpl: 'Seasonic FOCUS GX-{w} ATX 3', year: 2023, life: 4, tier: 3, ...A3, accent: '#9aa4ae', color: '#222326', eff: 'gold' }, [[650, 120], [750, 130], [850, 150, { tier: 4 }], [1000, 180, { tier: 4 }]]);
S({ brand: 'Seasonic', tpl: 'Seasonic PRIME {m}', year: 2023, life: 4, tier: 5, ...A3, accent: '#e9e9e6', color: '#222326' }, [[1600, 450, { m: 'PX-1600 ATX 3.0', eff: 'platinum' }], [1600, 500, { m: 'TX-1600 ATX 3.0', eff: 'titanium' }], [2200, 500, { m: 'PX-2200', year: 2024, eff: 'platinum' }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Dark Power 13 {w}W', year: 2023, life: 4, tier: 5, ...A3, accent: '#e07a2e', color: '#1b1b1d', eff: 'titanium' }, [
  [750, 230], [850, 260], [1000, 300, { id: 'dark-power-13', cost: 2900, tier: 5 }],
]);
S({ brand: 'be quiet!', tpl: 'be quiet! Dark Power Pro 13 {w}W', year: 2023, life: 4, tier: 5, ...A3, accent: '#e07a2e', color: '#1b1b1d', eff: 'titanium' }, [[1300, 400], [1600, 480]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Pure Power 12 M {w}W', year: 2023, life: 4, tier: 3, ...A3, accent: '#e07a2e', color: '#1b1b1d', eff: 'gold' }, [[550, 90, { tier: 2 }], [650, 100], [750, 120], [850, 140], [1000, 180, { tier: 4 }], [1200, 230, { tier: 4 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Straight Power 12 {w}W', year: 2023, life: 4, tier: 4, ...A3, accent: '#e07a2e', color: '#1b1b1d', eff: 'platinum' }, [[750, 160], [850, 180], [1000, 220], [1200, 270, { tier: 5 }], [1500, 330, { tier: 5 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! System Power 10 {w}W', year: 2022, life: 5, tier: 1, accent: '#e07a2e', color: '#1b1b1d', eff: 'bronze' }, [[450, 50], [550, 60], [650, 70, { tier: 2 }], [750, 80, { tier: 2 }]]);
S({ brand: 'be quiet!', tpl: 'be quiet! Power Zone 2 {w}W', year: 2024, life: 3, tier: 4, ...A3, accent: '#e07a2e', color: '#1b1b1d', eff: 'platinum' }, [[750, 130, { tier: 3 }], [850, 150], [1000, 180]]);
S({ brand: 'Corsair', tpl: 'Corsair RM{w}x SHIFT', year: 2023, life: 4, tier: 4, ...A3, accent: '#e8c030', color: '#1a1a1a', eff: 'gold' }, [[750, 150, { tier: 3 }], [850, 170], [1000, 210], [1200, 250, { tier: 5 }]]);
S({ brand: 'Corsair', tpl: 'Corsair RM{w}e', year: 2023, life: 4, tier: 3, ...A3, accent: '#e8c030', color: '#1a1a1a', eff: 'gold' }, [[650, 90, { tier: 2 }], [750, 100], [850, 120], [1000, 160, { tier: 4 }]]);
S({ brand: 'Corsair', tpl: 'Corsair HX{w}i ATX 3.0', year: 2023, life: 4, tier: 5, ...A3, accent: '#c0c6cc', color: '#1a1a1a', eff: 'platinum' }, [[1000, 250, { tier: 4 }], [1200, 290], [1500, 400]]);
S({ brand: 'Corsair', tpl: 'Corsair SF1000L', year: 2022, life: 4, tier: 5, form: 'SFX', ...A3, accent: '#d8b24a', color: '#1a1a1a', eff: 'gold' }, [[1000, 230]]);
S({ brand: 'Corsair', tpl: 'Corsair RM{w}x (ATX 3.1)', year: 2024, life: 3, tier: 4, ...A3, accent: '#e8c030', color: '#1a1a1a', eff: 'gold' }, [[750, 130, { tier: 3 }], [850, 150], [1000, 190], [1200, 230, { tier: 5 }]]);
S({ brand: 'Corsair', tpl: 'Corsair SF{w} Platinum ATX 3.1', year: 2024, life: 3, tier: 5, form: 'SFX', ...A3, accent: '#c0c6cc', color: '#1a1a1a', eff: 'platinum' }, [[850, 190, { tier: 4 }], [1000, 230]]);
S({ brand: 'ASUS', tpl: 'ASUS {m}', year: 2023, life: 4, tier: 4, ...A3, accent: '#c9323a', color: '#16171a' }, [
  [850, 190, { m: 'ROG Loki SFX-L 850W Platinum', form: 'SFX', eff: 'platinum' }], [1000, 250, { m: 'ROG Loki SFX-L 1000W Platinum', form: 'SFX', eff: 'platinum', tier: 5 }],
  [1600, 550, { m: 'ROG Thor 1600W Titanium', eff: 'titanium', rgb: true, tier: 5 }],
  [750, 160, { m: 'ROG Strix 750W Gold Aura Edition', eff: 'gold', rgb: true }], [850, 180, { m: 'ROG Strix 850W Gold Aura Edition', eff: 'gold', rgb: true }],
  [1000, 220, { m: 'ROG Strix 1000W Gold Aura Edition', eff: 'gold', rgb: true }], [1200, 260, { m: 'ROG Strix 1200W Gold Aura Edition', eff: 'gold', rgb: true, tier: 5 }],
]);
S({ brand: 'ASUS', tpl: 'ASUS TUF Gaming {w}G', year: 2023, life: 4, tier: 3, ...A3, accent: '#d8b24a', color: '#1d1e21', eff: 'gold' }, [[750, 110], [850, 130], [1000, 160, { tier: 4 }], [1200, 200, { tier: 4 }]]);
S({ brand: 'ASUS', tpl: 'ASUS Prime {w}W Gold', year: 2024, life: 3, tier: 2, ...A3, accent: '#9aa4ae', color: '#1d1e21', eff: 'gold' }, [[750, 100], [850, 120, { tier: 3 }]]);
S({ brand: 'ASUS', tpl: 'ASUS ROG Thor {w}W Platinum III', year: 2024, life: 3, tier: 5, ...A3, rgb: true, accent: '#c9323a', color: '#16171a', eff: 'platinum' }, [[850, 250], [1000, 280], [1200, 330]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master MWE Gold {w} V2 ATX 3.0', year: 2023, life: 4, tier: 3, ...A3, accent: '#d8b24a', eff: 'gold' }, [[850, 110], [1050, 140, { tier: 4 }], [1250, 180, { tier: 4 }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master {m}', year: 2023, life: 4, tier: 5, ...A3, accent: '#c0c6cc', eff: 'platinum' }, [[1100, 260, { m: 'V SFX Platinum 1100', form: 'SFX' }], [2000, 700, { m: 'X Mighty Platinum 2000' }], [1300, 320, { m: 'V Platinum 1300 V2' }], [1600, 450, { m: 'V Platinum 1600 V2' }]]);
S({ brand: 'Cooler Master', tpl: 'Cooler Master GX III Gold {w}', year: 2024, life: 3, tier: 3, ...A3, accent: '#d8b24a', eff: 'gold' }, [[850, 120], [1050, 150, { tier: 4 }], [1250, 190, { tier: 4 }]]);
S({ brand: 'FSP', tpl: 'FSP {m}', year: 2023, life: 4, tier: 4, ...A3, accent: '#3f9b3a' }, [
  [850, 150, { m: 'Hydro G PRO ATX 3.0 850W', eff: 'gold', tier: 3 }], [1000, 180, { m: 'Hydro G PRO ATX 3.0 1000W', eff: 'gold' }], [1200, 230, { m: 'Hydro G PRO ATX 3.0 1200W', eff: 'gold' }],
  [1000, 230, { m: 'Hydro PTM X PRO ATX 3.0 1000W', eff: 'platinum', tier: 5 }], [1200, 270, { m: 'Hydro PTM X PRO ATX 3.0 1200W', eff: 'platinum', tier: 5 }],
  [1000, 320, { m: 'Hydro Ti PRO 1000W', eff: 'titanium', tier: 5 }], [850, 160, { m: 'Dagger PRO ATX 3.0 850W', form: 'SFX', eff: 'platinum' }],
]);
S({ brand: 'Chieftec', tpl: 'Chieftec Polaris 3.0 {m}', year: 2023, life: 4, tier: 3, ...A3, accent: '#d8b24a', eff: 'gold' }, [[850, 130, { m: 'PPS-850FC-A3' }], [1050, 160, { m: 'PPS-1050FC-A3', tier: 4 }], [1250, 190, { m: 'PPS-1250FC-A3', tier: 4 }]]);
S({ brand: 'Zalman', tpl: 'Zalman TeraMax II {w}W', year: 2023, life: 4, tier: 3, ...A3, accent: '#e07a2e', eff: 'gold' }, [[750, 120], [850, 140], [1000, 170, { tier: 4 }], [1200, 230, { tier: 4 }]]);
S({ brand: 'Enermax', tpl: 'Enermax Revolution D.F. 2 {w}W', year: 2023, life: 4, tier: 3, ...A3, accent: '#d4452a', eff: 'gold' }, [[750, 140], [850, 160, { tier: 4 }], [1000, 190, { tier: 4 }], [1200, 250, { tier: 4 }]]);
S({ brand: 'Enermax', tpl: 'Enermax Revolution ATX 3.0 1200W', year: 2022, life: 4, tier: 5, ...A3, accent: '#d4452a', eff: 'gold' }, [[1200, 300]]);
S({ brand: 'Antec', tpl: 'Antec NE{w}G M ATX3.0', year: 2023, life: 4, tier: 3, ...A3, accent: '#d8b24a', eff: 'gold' }, [[850, 120], [1000, 150, { tier: 4 }]]);
S({ brand: 'NZXT', tpl: 'NZXT C{w} Gold V2', year: 2022, life: 3, tier: 3, accent: '#7a5bc9', eff: 'gold', modular: true }, [[650, 90], [750, 100], [850, 120, { tier: 4 }]]);
S({ brand: 'NZXT', tpl: 'NZXT C{w} Bronze', year: 2022, life: 4, tier: 2, accent: '#7a5bc9', eff: 'bronze' }, [[650, 70], [750, 80]]);
S({ brand: 'NZXT', tpl: 'NZXT C{w} Gold ATX 3.1', year: 2024, life: 3, tier: 3, ...A3, accent: '#7a5bc9', eff: 'gold' }, [[850, 130], [1000, 170, { tier: 4 }], [1200, 190, { tier: 4 }]]);
S({ brand: 'NZXT', tpl: 'NZXT C1500 Platinum ATX 3.1', year: 2024, life: 3, tier: 5, ...A3, accent: '#c0c6cc', eff: 'platinum' }, [[1500, 350]]);
S({ brand: 'Lian Li', tpl: 'Lian Li SP{w}', year: 2023, life: 4, tier: 4, form: 'SFX', ...A3, accent: '#9aa4ae', eff: 'gold' }, [[750, 150], [850, 160]]);
S({ brand: 'Lian Li', tpl: 'Lian Li EDGE EG{w} Platinum', year: 2024, life: 3, tier: 5, ...A3, accent: '#9aa4ae', eff: 'platinum' }, [[1000, 250, { tier: 4 }], [1200, 290], [1300, 330]]);
S({ brand: 'XPG', tpl: 'XPG {m}', year: 2023, life: 4, tier: 3, ...A3, accent: '#c9323a' }, [[750, 100, { m: 'CORE REACTOR II VE 750W', eff: 'gold' }], [850, 120, { m: 'CORE REACTOR II VE 850W', eff: 'gold' }], [1600, 600, { m: 'FUSION 1600W Titanium', eff: 'titanium', tier: 5 }]]);
S({ brand: 'DeepCool', tpl: 'DeepCool {m}', year: 2022, life: 4, tier: 3, accent: '#3a8fd8', modular: true }, [[850, 120, { m: 'PQ850M', eff: 'gold' }], [1000, 150, { m: 'PQ1000M', eff: 'gold', tier: 4 }], [1000, 170, { m: 'PX1000G', year: 2023, eff: 'gold', v12: true, tier: 4 }], [1200, 210, { m: 'PX1200G', year: 2023, eff: 'gold', v12: true, tier: 4 }], [750, 90, { m: 'PN750M', year: 2024, eff: 'gold', v12: true }], [850, 100, { m: 'PN850M', year: 2024, eff: 'gold', v12: true }]]);
S({ brand: 'Montech', tpl: 'Montech {m}', year: 2023, life: 4, tier: 3, ...A3, accent: '#e8c030', eff: 'gold' }, [[850, 120, { m: 'TITAN GOLD 850W' }], [1000, 150, { m: 'TITAN GOLD 1000W', tier: 4 }], [1200, 190, { m: 'TITAN GOLD 1200W', tier: 4 }], [850, 110, { m: 'CENTURY II 850W' }], [1050, 140, { m: 'CENTURY II 1050W' }], [1200, 170, { m: 'CENTURY II 1200W', tier: 4 }]]);
S({ brand: 'Super Flower', tpl: 'Super Flower Leadex VII XG {w}W', year: 2023, life: 4, tier: 4, ...A3, accent: '#d8b24a', eff: 'gold' }, [[850, 150, { tier: 3 }], [1000, 180], [1300, 260, { tier: 5 }]]);

export default P;
