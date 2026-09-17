// Datorchassin 1983–2026. AT-profil (XT/AT/Baby AT) fram till 1999, ATX-profil
// (ATX/mATX/ITX) från 1996. Ett chassi blandar aldrig AT- och ATX-format.
// Priser: USD-pris × SEK_PER_USD × 1,25. bays = [ext525, ext35, int35, int25].
import { SEK_PER_USD } from './canon.js';

const P = [];
const slug = (s) => s.toLowerCase().replace(/!/g, '').replace(/\+/g, '-plus').replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
const sek = (usd, y) => Math.max(10, Math.round((usd * SEK_PER_USD[y] * 1.25) / 10) * 10);

const COL = {
  beige: { color: '#d9d2bc', inner: '#b8b09a' },
  grey: { color: '#c9c6bb', inner: '#a9a69b' },
  black: { color: '#1c1d20', inner: '#2a2c30' },
  white: { color: '#e9e9e6', inner: '#d4d4d0' },
  silver: { color: '#c8ccd0', inner: '#9aa0a6' },
  gun: { color: '#4a4d52', inner: '#34373c' },
  red: { color: '#8e1f24', inner: '#2a2c30' },
  blue: { color: '#2c4f7c', inner: '#2a2c30' },
  green: { color: '#3d5a3a', inner: '#2a2c30' },
  wood: { color: '#2b2a28', inner: '#6b4a2e' },
  pink: { color: '#e7b9c6', inner: '#d9a7b5' },
};

const F96 = ['ATX'];
const F98 = ['ATX', 'mATX'];
const FA = ['ATX', 'mATX', 'ITX'];
const FM = ['mATX', 'ITX'];
const FI = ['ITX'];

// d: { brand, name, year, until|life, tier, forms, style, bays:[ext525,ext35,int35,int25], fans, col|color+inner, front, window, rgb, usd }
// variants: [namnsuffix, usd, överskrivningar]
function C(d, variants) {
  for (const [suf, usd, x = {}] of variants || [['', d.usd]]) {
    const e = { ...d, ...x };
    const name = x.name ?? d.name + suf;
    const col = COL[e.col] || {};
    const until = Math.max(e.year, Math.min(2026, e.until ?? e.year + (e.life ?? 5)));
    const [ext525, ext35, int35, int25] = e.bays;
    P.push({
      id: x.id || 'case-' + slug(name), cat: 'case', name, brand: d.brand, year: e.year, until,
      cost: x.cost ?? sek(usd, e.year), tier: e.tier,
      ...(e.rgb ? { rgb: true } : {}),
      forms: e.forms, style: e.style, bays: { ext525, ext35, int35, int25 }, fans: e.fans,
      look: { color: e.color ?? col.color, inner: e.inner ?? col.inner, front: e.front, window: !!e.window },
    });
  }
}

// ---------------------------------------------------------------- AT-eran
const AT = (brand, name, year, until, forms, style, front, bays, fans, usd, tier, col = 'beige') =>
  C({ brand, name, year, until, forms, style, front, bays, fans, usd, tier, col });

AT('Chenbro', 'Chenbro PC/XT-chassi (flip-top)', 1983, 1988, ['XT'], 'desktop', 'beige-xt', [4, 0, 0, 0], [], 90, 2);
AT('Compucase', 'Compucase XT-chassi (flip-top)', 1983, 1989, ['XT'], 'desktop', 'beige-xt', [4, 0, 0, 0], [], 80, 1);
AT('Enlight', 'Enlight AT desktop-chassi', 1984, 1991, ['AT', 'BabyAT'], 'desktop', 'beige-at', [3, 0, 1, 0], [], 120, 3);
AT('Chenbro', 'Chenbro AT desktop-chassi', 1985, 1992, ['AT', 'BabyAT'], 'desktop', 'beige-at', [3, 0, 1, 0], [], 100, 2);
AT('Addtronics', 'Addtronics AT full tower', 1985, 1993, ['AT', 'BabyAT'], 'full', 'beige-tower', [6, 0, 2, 0], [], 250, 4);
AT('Amax', 'Amax XT desktop-chassi med turboknapp', 1985, 1990, ['XT'], 'desktop', 'beige-xt', [4, 0, 0, 0], [], 85, 2);
AT('Compucase', 'Compucase Baby AT desktop med turbo-LED', 1986, 1993, ['XT', 'BabyAT'], 'desktop', 'beige-xt', [3, 1, 1, 0], [], 70, 1);
AT('Enlight', 'Enlight Baby AT desktop med nyckellås', 1987, 1994, ['XT', 'BabyAT'], 'desktop', 'beige-at', [3, 1, 1, 0], [], 90, 2);
AT('YY', 'YY minitower med turboknapp', 1987, 1995, ['BabyAT'], 'minitower', 'beige-tower', [3, 2, 1, 0], [], 70, 2);
AT('In Win', 'In Win AT minitower', 1988, 1995, ['BabyAT'], 'minitower', 'beige-tower', [3, 1, 2, 0], [], 75, 2);
AT('Chenbro', 'Chenbro full tower med nyckellås', 1989, 1997, ['AT', 'BabyAT'], 'full', 'beige-tower', [6, 2, 3, 0], ['front1'], 180, 4);
AT('Enlight', 'Enlight midi tower med LED-display', 1989, 1996, ['AT', 'BabyAT'], 'tower', 'beige-tower', [4, 2, 2, 0], [], 110, 3);
AT('Amax', 'Amax AT full tower med LED-display', 1990, 1997, ['AT', 'BabyAT'], 'full', 'beige-tower', [6, 2, 4, 0], ['front1'], 220, 4);
AT('Compucase', 'Compucase slimline Baby AT desktop', 1990, 1996, ['BabyAT'], 'desktop', 'beige-at', [2, 1, 1, 0], [], 50, 1);
AT('YY', 'YY desktop med LED-display', 1990, 1996, ['BabyAT'], 'desktop', 'beige-at', [3, 1, 1, 0], [], 60, 1);
AT('Elan Vital', 'Elan Vital AT tower', 1990, 1996, ['AT', 'BabyAT'], 'tower', 'beige-tower', [5, 2, 2, 0], [], 150, 3);
AT('Addtronics', 'Addtronics minitower med turbo-LED', 1991, 1997, ['BabyAT'], 'minitower', 'beige-tower', [3, 2, 1, 0], [], 70, 2);
AT('Codegen', 'Codegen Baby AT desktop', 1992, 1998, ['BabyAT'], 'desktop', 'beige-at', [3, 2, 1, 0], [], 45, 1);
AT('Chieftec', 'Chieftec AT midi tower', 1992, 1999, ['BabyAT'], 'tower', 'beige-tower', [4, 2, 2, 0], [], 70, 2);
AT('Chenbro', 'Chenbro minitower med LED-display', 1993, 1999, ['BabyAT'], 'minitower', 'beige-tower', [3, 2, 2, 0], [], 55, 1);
AT('In Win', 'In Win AT midi tower med nyckellås', 1994, 1999, ['BabyAT'], 'tower', 'beige-tower', [4, 2, 3, 0], [], 70, 2);
AT('Enlight', 'Enlight EN-8700 full tower (AT)', 1995, 1999, ['AT', 'BabyAT'], 'full', 'beige-tower', [5, 2, 4, 0], ['rear'], 130, 4);
AT('SuperMicro', 'SuperMicro SC-serien full tower (AT)', 1995, 1999, ['AT', 'BabyAT'], 'full', 'beige-tower', [5, 2, 6, 0], ['front1', 'rear'], 190, 5);
AT('CFI', 'CFI Baby AT minitower', 1995, 1999, ['BabyAT'], 'minitower', 'beige-tower', [3, 2, 2, 0], [], 45, 1);
AT('In Win', 'In Win Baby AT desktop', 1995, 1999, ['BabyAT'], 'desktop', 'beige-at', [3, 2, 1, 0], [], 50, 1);
AT('Addtronics', 'Addtronics AT midi tower', 1996, 1999, ['BabyAT'], 'tower', 'beige-tower', [4, 2, 3, 0], ['rear'], 80, 3);
AT('Elan Vital', 'Elan Vital Baby AT minitower', 1996, 1999, ['BabyAT'], 'minitower', 'beige-tower', [3, 2, 2, 0], [], 60, 2);
AT('Antec', 'Antec AT full tower', 1996, 1999, ['AT', 'BabyAT'], 'full', 'beige-tower', [5, 2, 5, 0], ['rear'], 120, 4);
AT('Compucase', 'Compucase HEC AT midi tower', 1996, 1999, ['BabyAT'], 'tower', 'beige-tower', [4, 2, 3, 0], [], 50, 1);
AT('Chieftec', 'Chieftec Baby AT minitower', 1997, 1999, ['BabyAT'], 'minitower', 'beige-tower', [3, 2, 2, 0], [], 45, 1);

// ---------------------------------------------------------------- Beige ATX (1996–2004)
const BX = { front: 'beige-atx', col: 'beige', window: false };
C({ ...BX, brand: 'Chenbro', name: 'Chenbro ATX midi tower', year: 1996, until: 2000, tier: 2, forms: F96, style: 'midi', bays: [4, 2, 3, 0], fans: [], usd: 70 });
C({ ...BX, brand: 'Compucase', name: 'Compucase ATX minitower', year: 1996, until: 2001, tier: 1, forms: F96, style: 'minitower', bays: [3, 2, 2, 0], fans: [], usd: 50 });
C({ ...BX, brand: 'Antec', name: 'Antec KS282', year: 1996, until: 2000, tier: 2, forms: F96, style: 'midi', bays: [4, 2, 3, 0], fans: [], usd: 60 });
C({ ...BX, brand: 'Enlight', name: 'Enlight EN-7237', year: 1997, until: 2002, tier: 2, forms: F98, style: 'midi', bays: [4, 2, 3, 0], fans: [], usd: 60 });
C({ ...BX, brand: 'Antec', name: 'Antec SX630', year: 1997, until: 2001, tier: 3, forms: F98, style: 'midi', bays: [4, 2, 3, 0], fans: ['rear'], usd: 75 });
C({ ...BX, brand: 'AOpen', name: 'AOpen HX08', year: 1997, until: 2001, tier: 4, forms: F98, style: 'full', bays: [5, 2, 4, 0], fans: ['rear'], usd: 110 });
C({ ...BX, brand: 'AOpen', name: 'AOpen HQ08', year: 1998, until: 2003, tier: 3, forms: F98, style: 'midi', bays: [4, 2, 3, 0], fans: ['rear'], usd: 70 });
C({ ...BX, brand: 'In Win', name: 'In Win Q500', year: 1998, until: 2003, tier: 2, forms: F98, style: 'midi', bays: [4, 2, 3, 0], fans: [], usd: 55 });
C({ ...BX, brand: 'Enlight', name: 'Enlight EN-8700 ATX full tower', year: 1998, until: 2003, tier: 4, forms: F98, style: 'full', bays: [5, 2, 4, 0], fans: ['rear'], usd: 120 });
C({ ...BX, brand: 'SuperMicro', name: 'SuperMicro SC750A', year: 1998, until: 2003, tier: 5, forms: F98, style: 'full', bays: [5, 2, 6, 0], fans: ['front1', 'rear'], usd: 180 });
C({ ...BX, brand: 'Chenbro', name: 'Chenbro mATX minitower', year: 1998, until: 2003, tier: 1, forms: ['mATX'], style: 'minitower', bays: [2, 2, 1, 0], fans: [], usd: 40 });
C({ ...BX, brand: 'Antec', name: 'Antec SX635', year: 1999, until: 2003, tier: 3, forms: F98, style: 'midi', bays: [4, 2, 3, 0], fans: ['rear'], usd: 80 });
C({ ...BX, brand: 'Antec', name: 'Antec SX1030', year: 1999, until: 2003, tier: 4, forms: F98, style: 'full', bays: [5, 2, 5, 0], fans: ['front1', 'rear'], usd: 140 });
C({ ...BX, brand: 'AOpen', name: 'AOpen HQ45', year: 1999, until: 2003, tier: 2, forms: ['mATX'], style: 'desktop', bays: [2, 1, 1, 0], fans: [], usd: 50 });
C({ ...BX, brand: 'Compucase', name: 'Compucase 6A-serien midi tower', year: 1999, until: 2004, tier: 1, forms: F98, style: 'midi', bays: [4, 2, 2, 0], fans: [], usd: 40 });
C({ ...BX, brand: 'AOpen', name: 'AOpen H600A', year: 2000, until: 2004, tier: 3, forms: F98, style: 'midi', bays: [4, 2, 3, 0], fans: ['front1', 'rear'], usd: 75 }, [['', 75], [' (svart)', 80, { name: 'AOpen H600B', col: 'black', front: 'black-atx' }]]);
C({ ...BX, brand: 'Chieftec', name: 'Chieftec Dragon DX-01', year: 2001, until: 2006, tier: 3, forms: F98, style: 'midi', bays: [4, 2, 6, 0], fans: ['front1', 'rear'], usd: 70 }, [
  ['WD', 70], ['BD', 70, { col: 'black', front: 'black-atx' }], ['SL', 75, { col: 'silver', front: 'silver-atx' }], ['BD med fönster', 80, { name: 'Chieftec Dragon DX-01BD-U (fönster)', col: 'black', front: 'black-atx', window: true, year: 2002 }],
]);
C({ ...BX, brand: 'Chieftec', name: 'Chieftec Bravo BH-01', year: 2002, until: 2006, tier: 2, forms: F98, style: 'midi', bays: [4, 2, 4, 0], fans: ['rear'], usd: 55 }, [['W', 55], ['B', 55, { col: 'black', front: 'black-atx' }]]);
C({ ...BX, brand: 'In Win', name: 'In Win J535', year: 2001, until: 2005, tier: 2, forms: F98, style: 'midi', bays: [4, 2, 4, 0], fans: ['rear'], usd: 60 });

// ---------------------------------------------------------------- Aluminium och fönster (1999–2007)
const AL = { front: 'silver-atx', col: 'silver', window: false };
C({ ...AL, brand: 'Cooler Master', name: 'Cooler Master ATC-110', year: 1999, until: 2003, tier: 5, forms: F98, style: 'midi', bays: [4, 2, 5, 0], fans: ['front1', 'rear'], usd: 200 });
C({ ...AL, brand: 'Cooler Master', name: 'Cooler Master ATC-201', year: 2000, until: 2004, tier: 5, forms: F98, style: 'midi', bays: [4, 2, 5, 0], fans: ['front1', 'front2', 'rear'], usd: 220 });
C({ ...AL, brand: 'Cooler Master', name: 'Cooler Master ATC-210', year: 2002, until: 2005, tier: 4, forms: F98, style: 'midi', bays: [4, 2, 5, 0], fans: ['front1', 'rear'], usd: 160 });
C({ ...AL, brand: 'Lian Li', name: 'Lian Li PC-60', year: 2000, until: 2004, tier: 5, forms: F98, style: 'midi', bays: [4, 2, 6, 0], fans: ['front1', 'front2', 'rear'], usd: 180 }, [['', 180], ['B', 190, { col: 'black', front: 'black-atx', year: 2002 }], ['USB', 190, { year: 2002 }]]);
C({ ...AL, brand: 'Lian Li', name: 'Lian Li PC-65', year: 2002, until: 2006, tier: 5, forms: F98, style: 'midi', bays: [5, 2, 6, 0], fans: ['front1', 'front2', 'rear'], usd: 200 }, [['', 200], ['B', 210, { col: 'black', front: 'black-atx' }]]);
C({ ...AL, brand: 'Lian Li', name: 'Lian Li PC-7', year: 2002, until: 2005, tier: 4, forms: F98, style: 'midi', bays: [4, 2, 4, 0], fans: ['front1', 'rear'], usd: 110 }, [['', 110], ['B', 115, { col: 'black', front: 'black-atx' }], [' Plus', 120, { year: 2004, until: 2008, forms: FA }], ['B Plus', 125, { year: 2004, until: 2008, forms: FA, col: 'black', front: 'black-atx' }]]);
C({ ...AL, brand: 'Lian Li', name: 'Lian Li PC-70', year: 2003, until: 2007, tier: 5, forms: F98, style: 'full', bays: [5, 2, 6, 0], fans: ['front1', 'front2', 'rear'], usd: 250 }, [['', 250], ['B', 260, { col: 'black', front: 'black-atx' }]]);
C({ ...AL, brand: 'Chenbro', name: 'Chenbro Gaming Bomb', year: 2002, until: 2005, tier: 3, forms: F98, style: 'midi', bays: [4, 2, 5, 0], fans: ['front1', 'rear'], usd: 90, window: true }, [[' (silver)', 90], [' (svart)', 90, { col: 'black', front: 'black-atx' }]]);
C({ ...AL, brand: 'Thermaltake', name: 'Thermaltake Xaser II', year: 2002, until: 2005, tier: 4, forms: F98, style: 'midi', bays: [5, 2, 5, 0], fans: ['front1', 'front2', 'rear', 'top1'], usd: 130, window: true }, [[' (silver)', 130], [' (svart)', 130, { col: 'black', front: 'black-atx' }]]);
C({ ...AL, brand: 'Thermaltake', name: 'Thermaltake Xaser III V1000A', year: 2003, until: 2006, tier: 4, forms: F98, style: 'midi', bays: [5, 2, 6, 0], fans: ['front1', 'front2', 'rear', 'top1'], usd: 150, window: true, col: 'black', front: 'black-atx' });
C({ ...AL, brand: 'Cooler Master', name: 'Cooler Master Wave Master', year: 2003, until: 2007, tier: 4, forms: F98, style: 'midi', bays: [4, 2, 4, 0], fans: ['front1', 'rear'], usd: 150 }, [[' (silver)', 150], [' (svart)', 150, { col: 'black', front: 'black-atx' }]]);
C({ ...AL, brand: 'Antec', name: 'Antec Sonata', year: 2003, until: 2006, tier: 3, forms: F98, style: 'midi', bays: [3, 2, 4, 0], fans: ['rear'], usd: 110, col: 'black', front: 'black-atx' });
C({ ...AL, brand: 'Antec', name: 'Antec Lanboy', year: 2004, until: 2007, tier: 3, forms: FA, style: 'midi', bays: [3, 2, 4, 0], fans: ['front1', 'rear'], usd: 110, window: true }, [[' (silver)', 110], [' (svart)', 110, { col: 'black', front: 'black-atx' }], [' (blå)', 110, { col: 'blue', front: 'black-atx' }]]);
C({ ...AL, brand: 'Cooler Master', name: 'Cooler Master Praetorian', year: 2004, until: 2007, tier: 4, forms: FA, style: 'midi', bays: [4, 2, 4, 0], fans: ['front1', 'rear'], usd: 150 }, [[' PAC-T01 (silver)', 150], [' PAC-T01 (svart)', 150, { col: 'black', front: 'black-atx' }]]);
C({ ...AL, brand: 'Cooler Master', name: 'Cooler Master Stacker STC-T01', year: 2004, until: 2008, tier: 5, forms: FA, style: 'full', bays: [9, 1, 4, 0], fans: ['front1', 'rear'], usd: 200 }, [[' (silver)', 200], [' (svart)', 200, { col: 'black', front: 'black-atx' }]]);
C({ ...AL, brand: 'Thermaltake', name: 'Thermaltake Tsunami Dream', year: 2004, until: 2007, tier: 3, forms: FA, style: 'midi', bays: [4, 2, 4, 0], fans: ['front1', 'rear'], usd: 110, window: true }, [[' (silver)', 110], [' (svart)', 110, { col: 'black', front: 'black-atx' }]]);
C({ ...AL, brand: 'Chieftec', name: 'Chieftec Mesh CG-01B', year: 2004, until: 2008, tier: 2, forms: FA, style: 'midi', bays: [4, 2, 6, 0], fans: ['front1', 'rear'], usd: 70, col: 'black', front: 'black-atx' });
C({ ...AL, brand: 'Antec', name: 'Antec Performance One P180', year: 2005, until: 2008, tier: 4, forms: FA, style: 'midi', bays: [4, 2, 6, 0], fans: ['rear', 'top1'], usd: 130 }, [['', 130], ['B', 135, { year: 2006, col: 'black', front: 'black-atx' }]]);
C({ ...AL, brand: 'Antec', name: 'Antec Sonata II', year: 2005, until: 2007, tier: 3, forms: FA, style: 'midi', bays: [3, 2, 4, 0], fans: ['rear'], usd: 110, col: 'black', front: 'black-atx' });
C({ ...AL, brand: 'Cooler Master', name: 'Cooler Master Centurion 5', year: 2005, until: 2010, tier: 2, forms: FA, style: 'midi', bays: [5, 1, 5, 0], fans: ['front1', 'rear'], usd: 60 }, [[' (silver)', 60], [' (svart)', 60, { col: 'black', front: 'black-atx' }]]);
C({ ...AL, brand: 'Thermaltake', name: 'Thermaltake Armor VA8000', year: 2005, until: 2009, tier: 4, forms: FA, style: 'full', bays: [10, 1, 4, 0], fans: ['front1', 'rear', 'top1'], usd: 170, window: true }, [['BWS (svart)', 170, { col: 'black', front: 'black-atx' }], ['SWS (silver)', 170]]);
C({ ...AL, brand: 'Thermaltake', name: 'Thermaltake Kandalf VE7000', year: 2005, until: 2009, tier: 5, forms: FA, style: 'full', bays: [10, 1, 4, 0], fans: ['front1', 'front2', 'rear', 'top1'], usd: 200, window: true }, [['BWS (svart)', 200, { col: 'black', front: 'black-atx' }], ['SWS (silver)', 200]]);
C({ ...AL, brand: 'Lian Li', name: 'Lian Li PC-V1000', year: 2005, until: 2008, tier: 5, forms: FA, style: 'midi', bays: [4, 1, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 250 }, [['', 250], ['B', 260, { col: 'black', front: 'black-atx' }]]);
C({ ...AL, brand: 'SilverStone', name: 'SilverStone Temjin TJ05', year: 2004, until: 2008, tier: 5, forms: FA, style: 'full', bays: [4, 2, 6, 0], fans: ['front1', 'front2', 'rear'], usd: 220 }, [['S (silver)', 220], ['B (svart)', 220, { col: 'black', front: 'black-atx' }]]);
C({ ...AL, brand: 'SilverStone', name: 'SilverStone Temjin TJ06', year: 2005, until: 2009, tier: 4, forms: FA, style: 'midi', bays: [4, 1, 5, 0], fans: ['front1', 'rear'], usd: 180 }, [['S (silver)', 180], ['B (svart)', 180, { col: 'black', front: 'black-atx' }]]);
C({ ...AL, brand: 'Enermax', name: 'Enermax Chakra', year: 2005, until: 2008, tier: 3, forms: FA, style: 'midi', bays: [4, 2, 4, 0], fans: ['rear'], usd: 120, window: true, col: 'black', front: 'black-atx' });

// ---------------------------------------------------------------- 2006–2011
const BK = (x) => ({ col: 'black', front: 'black-atx', window: false, forms: FA, style: 'midi', ...x });
const WH = { col: 'white' };
C(BK({ brand: 'Antec', name: 'Antec P182', year: 2006, until: 2010, tier: 4, col: 'gun', front: 'solid', bays: [3, 2, 6, 0], fans: ['rear', 'top1'], usd: 160 }));
C(BK({ brand: 'Antec', name: 'Antec P190', year: 2006, until: 2009, tier: 5, style: 'full', front: 'solid', bays: [4, 1, 8, 0], fans: ['rear', 'top1'], usd: 280 }));
C(BK({ brand: 'Antec', name: 'Antec Nine Hundred', year: 2006, until: 2010, tier: 4, front: 'mesh', window: true, bays: [3, 0, 6, 0], fans: ['front1', 'front2', 'rear', 'top1'], usd: 130 }));
C(BK({ brand: 'Antec', name: 'Antec Solo', year: 2006, until: 2010, tier: 3, front: 'solid', bays: [4, 1, 4, 0], fans: ['rear'], usd: 100 }));
C(BK({ brand: 'Antec', name: 'Antec Fusion', year: 2006, until: 2010, tier: 4, col: 'silver', front: 'silver-atx', forms: FM, style: 'desktop', bays: [2, 0, 2, 0], fans: ['rear'], usd: 150 }), [[' (silver)', 150], [' Black', 150, { col: 'black', front: 'black-atx', year: 2007 }]]);
C(BK({ brand: 'Antec', name: 'Antec Sonata III', year: 2007, until: 2010, tier: 3, bays: [3, 2, 4, 0], fans: ['rear'], usd: 130 }));
C(BK({ brand: 'Antec', name: 'Antec Twelve Hundred', year: 2007, until: 2011, tier: 5, style: 'full', front: 'mesh', window: true, bays: [3, 0, 9, 0], fans: ['front1', 'front2', 'front3', 'rear', 'top1'], usd: 180 }));
C(BK({ brand: 'Antec', name: 'Antec Three Hundred', year: 2008, until: 2013, tier: 2, front: 'mesh', bays: [3, 1, 6, 0], fans: ['rear', 'top1'], usd: 60 }));
C(BK({ brand: 'Antec', name: 'Antec Nine Hundred Two', year: 2008, until: 2011, tier: 4, front: 'mesh', window: true, bays: [3, 0, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 130 }));
C(BK({ brand: 'Antec', name: 'Antec P183', year: 2009, until: 2013, tier: 4, front: 'solid', bays: [3, 1, 6, 0], fans: ['rear', 'top1'], usd: 150 }));
C(BK({ brand: 'Antec', name: 'Antec DF-85', year: 2010, until: 2013, tier: 4, style: 'full', front: 'mesh', window: true, bays: [3, 0, 9, 0], fans: ['front1', 'front2', 'front3', 'rear', 'top1'], usd: 170 }));
C(BK({ brand: 'Antec', name: 'Antec Eleven Hundred', year: 2011, until: 2014, tier: 4, front: 'mesh', window: true, bays: [4, 0, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 130 }));
C(BK({ brand: 'Antec', name: 'Antec P280', year: 2011, until: 2015, tier: 4, front: 'solid', bays: [2, 0, 6, 0], fans: ['rear', 'top1', 'top2'], usd: 140 }), [['', 140], [' White', 150, { ...WH, year: 2012 }]]);
C(BK({ brand: 'NZXT', name: 'NZXT Lexa', year: 2006, until: 2009, tier: 3, window: true, bays: [5, 1, 4, 0], fans: ['front1', 'rear'], usd: 90 }), [[' (svart)', 90], [' (silver)', 90, { col: 'silver', front: 'silver-atx' }]]);
C(BK({ brand: 'NZXT', name: 'NZXT Zero', year: 2006, until: 2009, tier: 4, style: 'full', window: true, bays: [5, 1, 5, 0], fans: ['front1', 'front2', 'rear', 'top1'], usd: 150 }));
C(BK({ brand: 'NZXT', name: 'NZXT Apollo', year: 2007, until: 2010, tier: 2, window: true, bays: [5, 1, 5, 0], fans: ['front1', 'rear'], usd: 70 }));
C(BK({ brand: 'NZXT', name: 'NZXT Tempest', year: 2008, until: 2011, tier: 3, front: 'mesh', window: true, bays: [3, 1, 8, 0], fans: ['front1', 'front2', 'rear', 'top1', 'top2'], usd: 100 }));
C(BK({ brand: 'NZXT', name: 'NZXT Hades', year: 2009, until: 2011, tier: 3, window: true, bays: [4, 1, 5, 0], fans: ['front1', 'rear', 'top1'], usd: 90 }));
C(BK({ brand: 'NZXT', name: 'NZXT Gamma', year: 2009, until: 2013, tier: 1, front: 'mesh', bays: [4, 1, 6, 0], fans: ['rear'], usd: 40 }));
C(BK({ brand: 'NZXT', name: 'NZXT Phantom', year: 2009, until: 2013, tier: 4, style: 'full', front: 'solid', window: true, bays: [5, 1, 7, 0], fans: ['front1', 'rear', 'top1'], usd: 140 }), [[' (svart)', 140], [' (vit)', 140, WH], [' (röd)', 140, { col: 'red', year: 2010 }]]);
C(BK({ brand: 'NZXT', name: 'NZXT Tempest EVO', year: 2010, until: 2013, tier: 3, front: 'mesh', window: true, bays: [3, 1, 8, 0], fans: ['front1', 'front2', 'rear', 'top1', 'top2'], usd: 110 }));
C(BK({ brand: 'NZXT', name: 'NZXT Phantom 410', year: 2011, until: 2014, tier: 3, front: 'solid', window: true, bays: [3, 0, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 100 }), [[' (svart)', 100], [' (vit)', 100, WH], [' (röd)', 100, { col: 'red' }], [' (gunmetal)', 100, { col: 'gun' }]]);
C(BK({ brand: 'NZXT', name: 'NZXT Source 210', year: 2011, until: 2015, tier: 1, front: 'mesh', bays: [3, 0, 8, 0], fans: ['rear'], usd: 40 }), [[' (svart)', 40], [' (vit)', 40, WH], [' Elite', 50, { window: true, year: 2012 }]]);
C(BK({ brand: 'NZXT', name: 'NZXT H2', year: 2011, until: 2014, tier: 3, front: 'solid', bays: [3, 0, 8, 0], fans: ['front1', 'front2', 'rear'], usd: 100 }), [[' (svart)', 100], [' (vit)', 100, WH]]);
C(BK({ brand: 'Cooler Master', name: 'Cooler Master Stacker 830', year: 2006, until: 2010, tier: 5, style: 'full', bays: [9, 1, 5, 0], fans: ['front1', 'rear', 'top1'], usd: 230 }), [['', 230], [' Evolution', 240, { window: true, year: 2007 }]]);
C(BK({ brand: 'Cooler Master', name: 'Cooler Master Cosmos 1000', year: 2007, until: 2011, tier: 5, style: 'full', front: 'solid', window: true, bays: [5, 1, 6, 0], fans: ['front1', 'rear', 'top1', 'top2'], usd: 230 }), [[' (svart)', 230], [' (silver)', 230, { col: 'silver' }]]);
C(BK({ brand: 'Cooler Master', name: 'Cooler Master Cosmos S', year: 2008, until: 2011, tier: 5, style: 'full', front: 'mesh', window: true, bays: [6, 1, 6, 0], fans: ['front1', 'rear', 'top1', 'top2'], usd: 250 }));
C(BK({ brand: 'Cooler Master', name: 'Cooler Master CM 690', year: 2008, until: 2011, tier: 3, front: 'mesh', bays: [5, 1, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 90 }), [['', 90], [' NVIDIA Edition', 100, { window: true, year: 2009 }]]);
C(BK({ brand: 'Cooler Master', name: 'Cooler Master CM Storm Sniper', year: 2008, until: 2011, tier: 4, front: 'mesh', window: true, bays: [5, 1, 5, 0], fans: ['front1', 'rear', 'top1'], usd: 130 }));
C(BK({ brand: 'Cooler Master', name: 'Cooler Master HAF 932', year: 2008, until: 2013, tier: 4, style: 'full', front: 'mesh', window: true, bays: [6, 1, 5, 0], fans: ['front1', 'rear', 'top1'], usd: 150 }), [['', 150], [' Advanced', 160, { year: 2010, until: 2014 }]]);
C(BK({ brand: 'Cooler Master', name: 'Cooler Master Elite 330', year: 2008, until: 2012, tier: 1, front: 'mesh', bays: [4, 1, 5, 0], fans: ['rear'], usd: 40 }));
C(BK({ brand: 'Cooler Master', name: 'Cooler Master HAF 922', year: 2009, until: 2013, tier: 3, front: 'mesh', window: true, bays: [5, 0, 5, 0], fans: ['front1', 'rear', 'top1'], usd: 100 }));
C(BK({ brand: 'Cooler Master', name: 'Cooler Master CM Storm Scout', year: 2009, until: 2013, tier: 3, front: 'mesh', window: true, bays: [5, 1, 5, 0], fans: ['front1', 'rear', 'top1'], usd: 100 }));
C(BK({ brand: 'Cooler Master', name: 'Cooler Master Elite 334', year: 2009, until: 2012, tier: 1, front: 'mesh', window: true, bays: [4, 1, 5, 0], fans: ['front1', 'rear'], usd: 50 }));
C(BK({ brand: 'Cooler Master', name: 'Cooler Master HAF X', year: 2010, until: 2015, tier: 5, style: 'full', front: 'mesh', window: true, bays: [4, 1, 6, 0], fans: ['front1', 'rear', 'top1', 'top2'], usd: 200 }));
C(BK({ brand: 'Cooler Master', name: 'Cooler Master HAF 912', year: 2010, until: 2016, tier: 2, front: 'mesh', bays: [4, 1, 6, 0], fans: ['top1', 'rear'], usd: 60 }), [['', 60], [' Advanced', 80, { fans: ['front1', 'top1', 'rear'], window: true }], [' Plus', 70, { year: 2012, fans: ['front1', 'rear'] }]]);
C(BK({ brand: 'Cooler Master', name: 'Cooler Master CM 690 II Advanced', year: 2010, until: 2013, tier: 3, front: 'mesh', window: true, bays: [3, 1, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 100 }), [['', 100], [' White Edition', 110, WH]]);
C(BK({ brand: 'Cooler Master', name: 'Cooler Master Silencio 550', year: 2011, until: 2015, tier: 3, front: 'solid', bays: [2, 1, 5, 0], fans: ['front1', 'rear'], usd: 80 }));
C(BK({ brand: 'Cooler Master', name: 'Cooler Master CM Storm Trooper', year: 2011, until: 2015, tier: 4, style: 'full', front: 'mesh', window: true, bays: [9, 0, 8, 0], fans: ['front1', 'front2', 'rear', 'top1'], usd: 180 }));
C(BK({ brand: 'Cooler Master', name: 'Cooler Master Cosmos II', year: 2011, until: 2016, tier: 5, style: 'full', front: 'solid', window: true, bays: [3, 0, 13, 0], fans: ['front1', 'front2', 'rear', 'top1'], usd: 350 }));
C(BK({ brand: 'Thermaltake', name: 'Thermaltake Soprano', year: 2006, until: 2010, tier: 3, bays: [4, 1, 5, 0], fans: ['front1', 'rear'], usd: 90 }), [[' (svart, fönster)', 90, { window: true }], [' (silver)', 90, { col: 'silver', front: 'silver-atx' }]]);
C(BK({ brand: 'Thermaltake', name: 'Thermaltake Mozart TX', year: 2006, until: 2009, tier: 5, style: 'full', col: 'silver', front: 'silver-atx', bays: [8, 0, 6, 0], fans: ['front1', 'front2', 'rear', 'top1'], usd: 400 }));
C(BK({ brand: 'Thermaltake', name: 'Thermaltake Matrix VX', year: 2007, until: 2010, tier: 1, bays: [4, 1, 4, 0], fans: ['rear'], usd: 45 }));
C(BK({ brand: 'Thermaltake', name: 'Thermaltake Armor+ MX', year: 2008, until: 2011, tier: 4, style: 'full', window: true, bays: [8, 1, 4, 0], fans: ['front1', 'rear', 'top1'], usd: 180 }));
C(BK({ brand: 'Thermaltake', name: 'Thermaltake V9', year: 2008, until: 2012, tier: 2, front: 'mesh', window: true, bays: [5, 1, 5, 0], fans: ['front1', 'rear', 'top1'], usd: 80 }), [['', 80], [' BlacX Edition', 100, { year: 2009 }]]);
C(BK({ brand: 'Thermaltake', name: 'Thermaltake Level 10', year: 2008, until: 2011, tier: 5, front: 'solid', window: true, bays: [3, 0, 6, 0], fans: ['front1', 'rear'], usd: 800 }));
C(BK({ brand: 'Thermaltake', name: 'Thermaltake Element S', year: 2009, until: 2012, tier: 3, front: 'mesh', bays: [5, 1, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 100 }));
C(BK({ brand: 'Thermaltake', name: 'Thermaltake Element V', year: 2009, until: 2012, tier: 4, style: 'full', front: 'mesh', window: true, bays: [5, 1, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 150 }));
C(BK({ brand: 'Thermaltake', name: 'Thermaltake V3 Black Edition', year: 2010, until: 2015, tier: 1, front: 'mesh', window: true, bays: [3, 1, 5, 0], fans: ['front1', 'rear'], usd: 50 }));
C(BK({ brand: 'Thermaltake', name: 'Thermaltake Level 10 GT', year: 2011, until: 2014, tier: 5, style: 'full', front: 'solid', window: true, bays: [5, 0, 5, 0], fans: ['front1', 'rear', 'top1'], usd: 280 }), [['', 280], [' Snow Edition', 290, { ...WH, year: 2012 }]]);
C(BK({ brand: 'Thermaltake', name: 'Thermaltake Chaser A31', year: 2011, until: 2015, tier: 3, front: 'mesh', window: true, bays: [3, 1, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 90 }), [['', 90], [' Snow Edition', 95, { ...WH, year: 2012 }]]);
C(BK({ brand: 'Lian Li', name: 'Lian Li PC-V2000', year: 2006, until: 2010, tier: 5, style: 'full', col: 'silver', front: 'silver-atx', bays: [5, 1, 9, 0], fans: ['front1', 'front2', 'rear', 'top1'], usd: 350 }), [['', 350], ['B', 360, { col: 'black', front: 'black-atx' }]]);
C(BK({ brand: 'Lian Li', name: 'Lian Li PC-A05', year: 2008, until: 2011, tier: 4, col: 'silver', front: 'silver-atx', bays: [3, 1, 4, 0], fans: ['front1', 'rear'], usd: 130 }), [['N', 130], ['NB', 135, { col: 'black', front: 'black-atx' }]]);
C(BK({ brand: 'Lian Li', name: 'Lian Li PC-A71', year: 2009, until: 2012, tier: 5, style: 'full', col: 'silver', front: 'silver-atx', bays: [4, 1, 6, 0], fans: ['front1', 'front2', 'rear', 'top1'], usd: 250 }), [['F', 250], ['FB', 260, { col: 'black', front: 'black-atx' }]]);
C(BK({ brand: 'Lian Li', name: 'Lian Li Lancool PC-K58', year: 2010, until: 2013, tier: 3, front: 'solid', window: true, bays: [4, 1, 6, 0], fans: ['front1', 'rear'], usd: 90 }));
C(BK({ brand: 'Lian Li', name: 'Lian Li Lancool PC-K62', year: 2010, until: 2013, tier: 3, front: 'mesh', window: true, bays: [3, 1, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 110 }));
C(BK({ brand: 'Lian Li', name: 'Lian Li Lancool Dragonlord PC-K65', year: 2010, until: 2013, tier: 4, style: 'full', front: 'mesh', window: true, bays: [5, 1, 6, 0], fans: ['front1', 'front2', 'rear', 'top1'], usd: 140 }));
C(BK({ brand: 'Lian Li', name: 'Lian Li PC-Q08', year: 2010, until: 2014, tier: 3, forms: FI, style: 'sff', front: 'solid', bays: [1, 0, 6, 0], fans: ['front1', 'rear'], usd: 90 }), [['B', 90], ['A', 90, { col: 'silver' }]]);
C(BK({ brand: 'Corsair', name: 'Corsair Obsidian 800D', year: 2009, until: 2013, tier: 5, style: 'full', front: 'solid', window: true, bays: [4, 0, 5, 0], fans: ['front1', 'front2', 'front3', 'rear', 'top1'], usd: 300 }));
C(BK({ brand: 'Corsair', name: 'Corsair Obsidian 700D', year: 2010, until: 2013, tier: 5, style: 'full', front: 'solid', window: true, bays: [4, 0, 5, 0], fans: ['front1', 'front2', 'front3', 'rear'], usd: 250 }));
C(BK({ brand: 'Corsair', name: 'Corsair Obsidian 650D', year: 2011, until: 2014, tier: 5, front: 'solid', window: true, bays: [4, 0, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 200 }));
C(BK({ brand: 'Corsair', name: 'Corsair Carbide 400R', year: 2011, until: 2014, tier: 3, front: 'mesh', window: true, bays: [4, 0, 6, 0], fans: ['front1', 'front2', 'rear'], usd: 90 }));
C(BK({ brand: 'Corsair', name: 'Corsair Carbide 500R', year: 2011, until: 2015, tier: 3, front: 'mesh', window: true, bays: [4, 0, 6, 0], fans: ['front1', 'front2', 'rear'], usd: 120 }), [['', 120], [' White', 120, WH]]);
C(BK({ brand: 'Corsair', name: 'Corsair Graphite 600T', year: 2011, until: 2015, tier: 4, front: 'mesh', window: true, bays: [4, 0, 6, 0], fans: ['front1', 'top1'], usd: 160 }), [['', 160], [' White', 170, WH]]);
C(BK({ brand: 'Fractal Design', name: 'Fractal Design Define R2', year: 2009, until: 2012, tier: 3, front: 'solid', bays: [5, 1, 8, 0], fans: ['front1', 'rear'], usd: 100 }), [[' Black Pearl', 100], [' Titanium Grey', 100, { col: 'gun' }]]);
C(BK({ brand: 'Fractal Design', name: 'Fractal Design Define R3', year: 2010, until: 2013, tier: 3, front: 'solid', bays: [5, 0, 8, 0], fans: ['front1', 'rear'], usd: 110 }), [[' Black Pearl', 110], [' Titanium Grey', 110, { col: 'gun' }], [' Arctic White', 115, { ...WH, year: 2011 }]]);
C(BK({ brand: 'Fractal Design', name: 'Fractal Design Define Mini', year: 2010, until: 2014, tier: 3, forms: FM, style: 'minitower', front: 'solid', bays: [2, 1, 6, 0], fans: ['front1', 'rear'], usd: 100 }));
C(BK({ brand: 'Fractal Design', name: 'Fractal Design Arc', year: 2010, until: 2013, tier: 3, front: 'mesh', bays: [3, 0, 8, 0], fans: ['front1', 'rear', 'top1'], usd: 110 }));
C(BK({ brand: 'Fractal Design', name: 'Fractal Design Core 1000', year: 2011, until: 2016, tier: 1, forms: FM, style: 'minitower', front: 'mesh', bays: [3, 1, 3, 0], fans: ['rear'], usd: 40 }));
C(BK({ brand: 'Fractal Design', name: 'Fractal Design Core 3000', year: 2011, until: 2015, tier: 2, front: 'mesh', bays: [2, 0, 6, 0], fans: ['front1', 'rear'], usd: 70 }));
C(BK({ brand: 'SilverStone', name: 'SilverStone Temjin TJ07', year: 2006, until: 2011, tier: 5, style: 'full', col: 'silver', front: 'silver-atx', bays: [5, 1, 6, 0], fans: ['front1', 'front2', 'rear', 'top1'], usd: 400 }), [['S', 400], ['B', 400, { col: 'black', front: 'black-atx' }]]);
C(BK({ brand: 'SilverStone', name: 'SilverStone Temjin TJ09', year: 2007, until: 2011, tier: 5, style: 'full', bays: [5, 1, 7, 0], fans: ['front1', 'front2', 'rear', 'top1'], usd: 330 }));
C(BK({ brand: 'SilverStone', name: 'SilverStone Temjin TJ10', year: 2008, until: 2012, tier: 5, style: 'full', col: 'silver', front: 'silver-atx', bays: [5, 1, 5, 0], fans: ['front1', 'front2', 'rear'], usd: 350 }), [['S', 350], ['B', 350, { col: 'black', front: 'black-atx' }]]);
C(BK({ brand: 'SilverStone', name: 'SilverStone Fortress FT01', year: 2008, until: 2012, tier: 5, col: 'silver', front: 'silver-atx', bays: [5, 1, 5, 0], fans: ['front1', 'front2', 'rear'], usd: 250 }), [['S', 250], ['B', 250, { col: 'black', front: 'black-atx' }]]);
C(BK({ brand: 'SilverStone', name: 'SilverStone Fortress FT02', year: 2009, until: 2014, tier: 5, front: 'solid', bays: [5, 0, 5, 0], fans: ['front1', 'front2', 'front3', 'rear'], usd: 280 }), [['B', 280], ['B-W', 290, { window: true }], ['S', 290, { col: 'silver' }]]);
C(BK({ brand: 'SilverStone', name: 'SilverStone Raven RV01', year: 2009, until: 2013, tier: 4, front: 'solid', window: true, bays: [5, 0, 5, 0], fans: ['front1', 'front2', 'rear'], usd: 170 }));
C(BK({ brand: 'SilverStone', name: 'SilverStone Raven RV02', year: 2010, until: 2014, tier: 4, front: 'solid', bays: [5, 0, 3, 0], fans: ['front1', 'front2', 'front3'], usd: 180 }), [['', 180], ['-E W', 190, { window: true, year: 2011 }]]);
C(BK({ brand: 'SilverStone', name: 'SilverStone SUGO SG05', year: 2010, until: 2016, tier: 3, forms: FI, style: 'sff', front: 'mesh', bays: [1, 0, 1, 2], fans: ['front1'], usd: 80 }), [['B', 80], ['W', 85, WH]]);
C(BK({ brand: 'SilverStone', name: 'SilverStone Temjin TJ08-E', year: 2011, until: 2016, tier: 3, forms: FM, style: 'minitower', front: 'solid', bays: [2, 1, 4, 0], fans: ['front1', 'rear'], usd: 110 }));
C(BK({ brand: 'SilverStone', name: 'SilverStone Fortress FT03', year: 2011, until: 2015, tier: 4, forms: FM, style: 'minitower', front: 'solid', bays: [1, 0, 3, 2], fans: ['front1', 'front2', 'front3'], usd: 180 }));
C(BK({ brand: 'SilverStone', name: 'SilverStone Temjin TJ11', year: 2011, until: 2015, tier: 5, style: 'full', col: 'silver', front: 'solid', bays: [4, 0, 6, 0], fans: ['front1', 'front2', 'rear'], usd: 600 }));
C(BK({ brand: 'SilverStone', name: 'SilverStone Precision PS07', year: 2011, until: 2015, tier: 2, forms: FM, style: 'minitower', front: 'mesh', bays: [2, 0, 3, 1], fans: ['front1', 'rear'], usd: 70 }), [['B', 70], ['W', 75, WH]]);
C(BK({ brand: 'Zalman', name: 'Zalman TNN 500AF', year: 2006, until: 2010, tier: 5, col: 'silver', front: 'silver-atx', bays: [2, 1, 2, 0], fans: [], usd: 1000 }));
C(BK({ brand: 'Zalman', name: 'Zalman GS1000', year: 2007, until: 2011, tier: 4, col: 'silver', front: 'silver-atx', bays: [4, 1, 10, 0], fans: ['front1', 'rear'], usd: 200 }));
C(BK({ brand: 'Zalman', name: 'Zalman Z9', year: 2009, until: 2013, tier: 2, front: 'mesh', window: true, bays: [5, 1, 5, 0], fans: ['front1', 'rear', 'top1'], usd: 60 }), [['', 60], [' Plus', 70, { year: 2011, until: 2015 }]]);
C(BK({ brand: 'In Win', name: 'In Win Dragon Rider', year: 2006, until: 2009, tier: 4, window: true, bays: [4, 1, 6, 0], fans: ['front1', 'rear'], usd: 130 }));
C(BK({ brand: 'Sharkoon', name: 'Sharkoon Rebel9 Economy', year: 2008, until: 2012, tier: 2, front: 'mesh', bays: [6, 0, 3, 0], fans: ['front1', 'rear'], usd: 60 }));
C(BK({ brand: 'Sharkoon', name: 'Sharkoon T9 Value', year: 2010, until: 2014, tier: 2, front: 'mesh', window: true, bays: [9, 0, 3, 0], fans: ['front1', 'rear', 'top1'], usd: 60 }), [['', 60], [' White Edition', 65, WH]]);
C(BK({ brand: 'Xigmatek', name: 'Xigmatek Asgard', year: 2009, until: 2013, tier: 1, front: 'mesh', bays: [4, 0, 5, 0], fans: ['rear'], usd: 40 }));
C(BK({ brand: 'Xigmatek', name: 'Xigmatek Midgard', year: 2010, until: 2014, tier: 2, front: 'mesh', window: true, bays: [4, 0, 5, 0], fans: ['front1', 'rear', 'top1'], usd: 60 }));

// ---------------------------------------------------------------- 2012–2016
const MD = (x) => ({ col: 'black', front: 'solid', window: false, forms: FA, style: 'midi', ...x });
C(MD({ brand: 'Antec', name: 'Antec One Hundred', year: 2012, until: 2016, tier: 1, front: 'mesh', window: true, bays: [2, 0, 4, 0], fans: ['rear', 'top1'], usd: 50 }));
C(MD({ brand: 'Antec', name: 'Antec GX700', year: 2012, until: 2016, tier: 2, col: 'green', front: 'mesh', bays: [3, 0, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 70 }));
C(MD({ brand: 'Antec', name: 'Antec P100', year: 2014, until: 2018, tier: 3, bays: [0, 0, 6, 2], fans: ['front1', 'front2', 'rear'], usd: 90 }));
C(MD({ brand: 'Antec', name: 'Antec P380', year: 2014, until: 2018, tier: 5, style: 'full', bays: [0, 0, 6, 2], fans: ['front1', 'front2', 'rear'], usd: 200 }));
C(MD({ brand: 'NZXT', name: 'NZXT Switch 810', year: 2012, until: 2015, tier: 4, style: 'full', front: 'mesh', window: true, bays: [4, 0, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 170 }), [[' (svart)', 170], [' (vit)', 170, WH], [' (gunmetal)', 170, { col: 'gun' }]]);
C(MD({ brand: 'NZXT', name: 'NZXT Phantom 820', year: 2012, until: 2015, tier: 5, style: 'full', window: true, rgb: true, bays: [4, 0, 6, 0], fans: ['front1', 'front2', 'rear', 'top1'], usd: 250 }), [[' (svart)', 250], [' (vit)', 250, WH], [' (gunmetal)', 250, { col: 'gun' }]]);
C(MD({ brand: 'NZXT', name: 'NZXT Phantom 530', year: 2013, until: 2016, tier: 4, window: true, bays: [3, 0, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 130 }), [[' (svart)', 130], [' (vit)', 130, WH]]);
C(MD({ brand: 'NZXT', name: 'NZXT H630', year: 2013, until: 2016, tier: 4, style: 'full', bays: [2, 0, 8, 0], fans: ['front1', 'front2', 'rear'], usd: 150 }), [[' (svart)', 150], [' (vit)', 150, WH]]);
C(MD({ brand: 'NZXT', name: 'NZXT Source 530', year: 2013, until: 2016, tier: 2, front: 'mesh', window: true, bays: [3, 0, 6, 0], fans: ['front1', 'rear'], usd: 80 }));
C(MD({ brand: 'NZXT', name: 'NZXT H440', year: 2014, until: 2018, tier: 3, window: true, bays: [0, 0, 6, 2], fans: ['front1', 'front2', 'front3', 'rear'], usd: 120 }), [
  [' Matte Black/Red', 120, { accent: 'red' }], [' Black/Orange', 120], [' Matte White', 120, WH], [' Black/Green', 120], [' Razer Edition', 150, { year: 2015 }],
]);
C(MD({ brand: 'NZXT', name: 'NZXT S340', year: 2014, until: 2018, tier: 2, window: true, bays: [0, 0, 2, 2], fans: ['rear', 'top1'], usd: 70 }), [[' Black', 70], [' White', 70, WH], [' Black/Red', 70], [' Black/Blue', 70, { year: 2015 }]]);
C(MD({ brand: 'NZXT', name: 'NZXT Manta', year: 2016, until: 2019, tier: 4, forms: FI, style: 'sff', window: true, bays: [0, 0, 2, 3], fans: ['front1', 'front2', 'rear'], usd: 140 }), [[' (svart)', 140], [' (vit)', 140, WH]]);
C(MD({ brand: 'Cooler Master', name: 'Cooler Master Silencio 650', year: 2012, until: 2016, tier: 4, bays: [2, 0, 8, 0], fans: ['front1', 'front2', 'rear'], usd: 120 }));
C(MD({ brand: 'Cooler Master', name: 'Cooler Master Elite 430', year: 2012, until: 2016, tier: 1, front: 'mesh', window: true, bays: [3, 1, 5, 0], fans: ['front1', 'rear'], usd: 50 }));
C(MD({ brand: 'Cooler Master', name: 'Cooler Master CM 690 III', year: 2013, until: 2016, tier: 3, front: 'mesh', window: true, bays: [2, 0, 8, 0], fans: ['front1', 'rear'], usd: 100 }));
C(MD({ brand: 'Cooler Master', name: 'Cooler Master N300', year: 2013, until: 2017, tier: 1, front: 'mesh', bays: [3, 0, 7, 0], fans: ['front1', 'rear'], usd: 50 }));
C(MD({ brand: 'Cooler Master', name: 'Cooler Master Elite 130', year: 2013, until: 2018, tier: 2, forms: FI, style: 'sff', front: 'mesh', bays: [1, 0, 1, 2], fans: ['front1'], usd: 50 }));
C(MD({ brand: 'Cooler Master', name: 'Cooler Master Elite 110', year: 2014, until: 2019, tier: 1, forms: FI, style: 'sff', front: 'mesh', bays: [0, 0, 3, 0], fans: ['front1'], usd: 40 }));
C(MD({ brand: 'Cooler Master', name: 'Cooler Master MasterCase 5', year: 2015, until: 2019, tier: 3, front: 'mesh', bays: [2, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 110 }), [['', 110], [' Pro', 140, { window: true, tier: 4 }]]);
C(MD({ brand: 'Cooler Master', name: 'Cooler Master MasterBox 5', year: 2016, until: 2020, tier: 2, front: 'perforated', window: true, bays: [1, 0, 2, 2], fans: ['rear'], usd: 60 }), [['', 60], [' White', 65, WH]]);
C(MD({ brand: 'Thermaltake', name: 'Thermaltake Chaser A41', year: 2012, until: 2015, tier: 3, front: 'mesh', window: true, bays: [3, 1, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 100 }));
C(MD({ brand: 'Thermaltake', name: 'Thermaltake Chaser MK-I', year: 2012, until: 2016, tier: 4, style: 'full', front: 'mesh', window: true, bays: [4, 0, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 130 }));
C(MD({ brand: 'Thermaltake', name: 'Thermaltake Urban S31', year: 2013, until: 2016, tier: 3, bays: [3, 0, 5, 2], fans: ['front1', 'rear'], usd: 80 }));
C(MD({ brand: 'Thermaltake', name: 'Thermaltake Commander MS-I', year: 2014, until: 2018, tier: 1, front: 'mesh', window: true, bays: [2, 1, 4, 2], fans: ['front1', 'rear'], usd: 50 }), [['', 50], [' Snow Edition', 55, WH]]);
C(MD({ brand: 'Thermaltake', name: 'Thermaltake Core V21', year: 2014, until: 2019, tier: 2, forms: FM, style: 'minitower', front: 'mesh', window: true, bays: [0, 0, 3, 2], fans: ['front1', 'rear'], usd: 60 }));
C(MD({ brand: 'Thermaltake', name: 'Thermaltake Core V31', year: 2014, until: 2018, tier: 2, front: 'mesh', window: true, bays: [1, 0, 3, 2], fans: ['front1', 'rear'], usd: 70 }));
C(MD({ brand: 'Thermaltake', name: 'Thermaltake Core V51', year: 2014, until: 2019, tier: 3, front: 'mesh', window: true, bays: [3, 0, 6, 2], fans: ['front1', 'front2', 'rear'], usd: 90 }));
C(MD({ brand: 'Thermaltake', name: 'Thermaltake Core V71', year: 2014, until: 2019, tier: 4, style: 'full', front: 'mesh', window: true, bays: [3, 0, 6, 2], fans: ['front1', 'front2', 'top1'], usd: 130 }));
C(MD({ brand: 'Thermaltake', name: 'Thermaltake Core X9', year: 2015, until: 2020, tier: 4, style: 'full', front: 'mesh', window: true, bays: [3, 0, 6, 3], fans: ['front1', 'rear'], usd: 160 }), [['', 160], [' Snow Edition', 170, WH]]);
C(MD({ brand: 'Thermaltake', name: 'Thermaltake Core P3', year: 2016, until: 2022, tier: 3, window: true, bays: [0, 0, 2, 3], fans: [], usd: 110 }), [['', 110], [' Snow Edition', 120, WH]]);
C(MD({ brand: 'Thermaltake', name: 'Thermaltake Core P5', year: 2016, until: 2021, tier: 4, window: true, bays: [0, 0, 2, 3], fans: [], usd: 170 }));
C(MD({ brand: 'Thermaltake', name: 'Thermaltake Versa H15', year: 2016, until: 2021, tier: 1, forms: FM, style: 'minitower', bays: [1, 1, 2, 2], fans: ['rear'], usd: 35 }));
C(MD({ brand: 'Thermaltake', name: 'Thermaltake Versa H17', year: 2016, until: 2021, tier: 1, forms: FM, style: 'minitower', window: true, bays: [1, 1, 2, 2], fans: ['rear'], usd: 40 }));
C(MD({ brand: 'Thermaltake', name: 'Thermaltake Versa H21', year: 2016, until: 2021, tier: 1, window: true, bays: [1, 1, 2, 2], fans: ['rear'], usd: 45 }));
C(MD({ brand: 'Lian Li', name: 'Lian Li PC-Q25', year: 2013, until: 2017, tier: 4, forms: FI, style: 'sff', bays: [0, 0, 5, 2], fans: ['front1'], usd: 120 }), [['B', 120], ['A', 120, { col: 'silver' }]]);
C(MD({ brand: 'Lian Li', name: 'Lian Li PC-O8', year: 2014, until: 2017, tier: 4, window: true, bays: [0, 0, 3, 2], fans: ['front1', 'rear'], usd: 170 }));
C(MD({ brand: 'Corsair', name: 'Corsair Obsidian 550D', year: 2012, until: 2015, tier: 4, bays: [2, 0, 6, 0], fans: ['front1', 'rear'], usd: 140 }));
C(MD({ brand: 'Corsair', name: 'Corsair Obsidian 350D', year: 2012, until: 2016, tier: 3, forms: FM, style: 'minitower', window: true, bays: [2, 0, 3, 0], fans: ['front1', 'rear'], usd: 110 }));
C(MD({ brand: 'Corsair', name: 'Corsair Vengeance C70', year: 2012, until: 2015, tier: 4, col: 'green', front: 'mesh', window: true, bays: [3, 0, 6, 0], fans: ['front1', 'front2', 'rear'], usd: 140 }), [[' Military Green', 140], [' Gunmetal Black', 140, { col: 'black' }], [' Arctic White', 140, WH]]);
C(MD({ brand: 'Corsair', name: 'Corsair Carbide 300R', year: 2012, until: 2016, tier: 2, front: 'mesh', window: true, bays: [3, 0, 4, 0], fans: ['front1', 'rear'], usd: 70 }));
C(MD({ brand: 'Corsair', name: 'Corsair Obsidian 900D', year: 2013, until: 2018, tier: 5, style: 'full', window: true, bays: [4, 0, 9, 0], fans: ['front1', 'front2', 'front3', 'rear'], usd: 350 }));
C(MD({ brand: 'Corsair', name: 'Corsair Carbide 200R', year: 2013, until: 2016, tier: 2, bays: [2, 0, 4, 4], fans: ['front1', 'rear'], usd: 60 }));
C(MD({ brand: 'Corsair', name: 'Corsair Carbide 330R', year: 2013, until: 2016, tier: 3, bays: [3, 0, 4, 4], fans: ['front1', 'rear'], usd: 90 }));
C(MD({ brand: 'Corsair', name: 'Corsair Carbide Air 540', year: 2013, until: 2018, tier: 4, front: 'mesh', window: true, bays: [2, 0, 2, 4], fans: ['front1', 'front2', 'rear'], usd: 140 }), [['', 140], [' White', 150, { ...WH, year: 2014 }]]);
C(MD({ brand: 'Corsair', name: 'Corsair Obsidian 750D', year: 2014, until: 2018, tier: 4, style: 'full', window: true, bays: [3, 0, 6, 4], fans: ['front1', 'front2', 'rear'], usd: 160 }), [['', 160], [' Airflow Edition', 170, { front: 'mesh', year: 2016 }]]);
C(MD({ brand: 'Corsair', name: 'Corsair Obsidian 450D', year: 2014, until: 2018, tier: 3, front: 'mesh', window: true, bays: [2, 0, 3, 4], fans: ['front1', 'front2', 'rear'], usd: 120 }));
C(MD({ brand: 'Corsair', name: 'Corsair Obsidian 250D', year: 2014, until: 2019, tier: 3, forms: FI, style: 'sff', window: true, bays: [1, 0, 2, 2], fans: ['front1', 'rear'], usd: 90 }));
C(MD({ brand: 'Corsair', name: 'Corsair Graphite 760T', year: 2014, until: 2018, tier: 4, style: 'full', front: 'mesh', window: true, bays: [2, 0, 3, 4], fans: ['front1', 'front2', 'rear'], usd: 190 }), [[' Black', 190], [' White', 190, WH]]);
C(MD({ brand: 'Corsair', name: 'Corsair Graphite 780T', year: 2014, until: 2018, tier: 4, style: 'full', front: 'mesh', window: true, bays: [3, 0, 6, 4], fans: ['front1', 'front2', 'rear'], usd: 190 }), [[' Black', 190], [' White', 190, WH]]);
C(MD({ brand: 'Corsair', name: 'Corsair Carbide SPEC-01', year: 2014, until: 2018, tier: 2, window: true, bays: [2, 0, 4, 2], fans: ['front1', 'rear'], usd: 60 }));
C(MD({ brand: 'Corsair', name: 'Corsair Carbide SPEC-03', year: 2014, until: 2018, tier: 2, front: 'mesh', window: true, bays: [2, 0, 4, 2], fans: ['front1', 'rear'], usd: 70 }));
C(MD({ brand: 'Corsair', name: 'Corsair Carbide SPEC-ALPHA', year: 2015, until: 2019, tier: 3, window: true, bays: [0, 0, 3, 2], fans: ['front1', 'front2', 'rear'], usd: 90 }), [[' Black/Red', 90], [' Black/Silver', 90], [' White/Black', 90, WH]]);
C(MD({ brand: 'Corsair', name: 'Corsair Carbide 100R', year: 2015, until: 2020, tier: 1, bays: [2, 0, 4, 4], fans: ['rear'], usd: 50 }), [['', 50], [' Windowed', 55, { window: true }]]);
C(MD({ brand: 'Corsair', name: 'Corsair Carbide 88R', year: 2015, until: 2019, tier: 1, forms: FM, style: 'minitower', window: true, bays: [1, 0, 2, 2], fans: ['rear'], usd: 50 }));
C(MD({ brand: 'Corsair', name: 'Corsair Carbide 400C', year: 2015, until: 2020, tier: 3, window: true, bays: [0, 0, 2, 2], fans: ['front1', 'rear'], usd: 100 }), [['', 100], [' White', 100, WH], ['', 100, { name: 'Corsair Carbide 400Q', window: false }]]);
C(MD({ brand: 'Corsair', name: 'Corsair Carbide 600C', year: 2015, until: 2019, tier: 4, style: 'full', window: true, bays: [2, 0, 3, 4], fans: ['front1', 'front2', 'rear'], usd: 150 }), [['', 150], ['', 150, { name: 'Corsair Carbide 600Q', window: false }]]);
C(MD({ brand: 'Corsair', name: 'Corsair Crystal 460X RGB', year: 2016, until: 2020, tier: 4, rgb: true, front: 'glass', window: true, bays: [0, 0, 2, 3], fans: ['front1', 'front2', 'front3', 'rear'], usd: 140 }), [['', 140], [' White', 140, { ...WH, year: 2017 }]]);
C(MD({ brand: 'Corsair', name: 'Corsair Crystal 570X RGB', year: 2016, until: 2021, tier: 5, rgb: true, front: 'glass', window: true, bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'front3', 'rear'], usd: 180 }), [['', 180], [' White', 180, { ...WH, year: 2017 }], [' Mirror Black', 190, { year: 2018 }]]);
C(MD({ brand: 'Fractal Design', name: 'Fractal Design Define R4', year: 2012, until: 2015, tier: 3, bays: [2, 0, 8, 0], fans: ['front1', 'rear'], usd: 110 }), [
  [' Black Pearl', 110], [' Arctic White', 115, WH], [' Titanium Grey', 110, { col: 'gun' }], [' Black Pearl Window', 120, { window: true }], [' Arctic White Window', 125, { ...WH, window: true }],
]);
C(MD({ brand: 'Fractal Design', name: 'Fractal Design Arc Midi R2', year: 2012, until: 2016, tier: 3, front: 'mesh', window: true, bays: [2, 0, 8, 0], fans: ['front1', 'rear', 'top1'], usd: 90 }));
C(MD({ brand: 'Fractal Design', name: 'Fractal Design Arc Mini R2', year: 2012, until: 2016, tier: 3, forms: FM, style: 'minitower', front: 'mesh', window: true, bays: [2, 0, 6, 0], fans: ['front1', 'rear', 'top1'], usd: 80 }));
C(MD({ brand: 'Fractal Design', name: 'Fractal Design Node 304', year: 2013, until: 2020, tier: 3, forms: FI, style: 'sff', bays: [0, 0, 6, 0], fans: ['front1', 'front2', 'rear'], usd: 90 }), [[' Black', 90], [' White', 95, WH]]);
C(MD({ brand: 'Fractal Design', name: 'Fractal Design Define XL R2', year: 2013, until: 2017, tier: 4, style: 'full', bays: [4, 0, 8, 0], fans: ['front1', 'rear'], usd: 130 }), [[' Black Pearl', 130], [' Titanium Grey', 130, { col: 'gun' }]]);
C(MD({ brand: 'Fractal Design', name: 'Fractal Design Node 804', year: 2014, until: 2021, tier: 3, forms: FM, style: 'minitower', front: 'perforated', window: true, bays: [0, 0, 8, 2], fans: ['front1', 'front2', 'rear'], usd: 100 }));
C(MD({ brand: 'Fractal Design', name: 'Fractal Design Core 2500', year: 2014, until: 2018, tier: 2, front: 'mesh', bays: [1, 0, 4, 2], fans: ['front1', 'rear'], usd: 60 }));
C(MD({ brand: 'Fractal Design', name: 'Fractal Design Define R5', year: 2014, until: 2019, tier: 3, bays: [2, 0, 8, 2], fans: ['front1', 'rear'], usd: 110 }), [
  [' Black', 110], [' White', 115, WH], [' Titanium', 110, { col: 'gun' }], [' Black Window', 120, { window: true }], [' White Window', 125, { ...WH, window: true }],
]);
C(MD({ brand: 'Fractal Design', name: 'Fractal Design Define S', year: 2015, until: 2019, tier: 3, window: true, bays: [0, 0, 3, 3], fans: ['front1', 'rear'], usd: 90 }));
C(MD({ brand: 'Fractal Design', name: 'Fractal Design Define Nano S', year: 2016, until: 2020, tier: 2, forms: FI, style: 'sff', bays: [0, 0, 2, 3], fans: ['front1', 'rear'], usd: 70 }), [['', 70], [' Window', 75, { window: true }]]);
C(MD({ brand: 'Fractal Design', name: 'Fractal Design Era ITX', year: 2016, until: 2020, tier: 4, forms: FI, style: 'sff', col: 'silver', front: 'solid', bays: [0, 0, 1, 3], fans: ['rear'], usd: 120 }), [[' Silver', 120], [' Titanium Grey', 120, { col: 'gun' }]]);
C(MD({ brand: 'Phanteks', name: 'Phanteks Enthoo Primo', year: 2013, until: 2018, tier: 5, style: 'full', window: true, bays: [5, 0, 6, 0], fans: ['front1', 'front2', 'rear', 'top1', 'top2'], usd: 250 }));
C(MD({ brand: 'Phanteks', name: 'Phanteks Enthoo Pro', year: 2014, until: 2019, tier: 3, style: 'full', window: true, bays: [3, 0, 6, 2], fans: ['front1', 'rear'], usd: 100 }));
C(MD({ brand: 'Phanteks', name: 'Phanteks Enthoo Luxe', year: 2014, until: 2018, tier: 4, style: 'full', rgb: true, window: true, bays: [3, 0, 6, 4], fans: ['front1', 'front2', 'rear'], usd: 160 }), [[' Black', 160], [' White', 160, WH]]);
C(MD({ brand: 'Phanteks', name: 'Phanteks Enthoo Evolv', year: 2014, until: 2018, tier: 3, forms: FM, style: 'minitower', window: true, bays: [0, 0, 2, 2], fans: ['front1', 'rear'], usd: 110 }));
C(MD({ brand: 'Phanteks', name: 'Phanteks Enthoo Evolv ATX', year: 2015, until: 2019, tier: 4, window: true, bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'rear'], usd: 140 }), [[' Black', 140], [' Anthracite Grey', 140, { col: 'gun' }], [' Silver', 150, { col: 'silver' }]]);
C(MD({ brand: 'Phanteks', name: 'Phanteks Enthoo Evolv ITX', year: 2015, until: 2019, tier: 3, forms: FI, style: 'sff', window: true, bays: [0, 0, 2, 2], fans: ['front1', 'rear'], usd: 80 }));
C(MD({ brand: 'Phanteks', name: 'Phanteks Enthoo Pro M', year: 2015, until: 2020, tier: 2, front: 'mesh', window: true, bays: [1, 0, 4, 2], fans: ['front1', 'rear'], usd: 80 }));
C(MD({ brand: 'Phanteks', name: 'Phanteks Eclipse P400', year: 2016, until: 2020, tier: 2, window: true, bays: [0, 0, 2, 3], fans: ['front1', 'rear'], usd: 70 }), [[' Black', 70], [' White', 70, WH], [' Anthracite Grey', 70, { col: 'gun' }], ['S Silent', 80, { window: false }]]);
C(MD({ brand: 'be quiet!', name: 'be quiet! Silent Base 800', year: 2015, until: 2019, tier: 4, bays: [3, 0, 7, 2], fans: ['front1', 'front2', 'rear'], usd: 130 }), [[' Black', 130], [' Orange', 130], [' Silver', 130], [' Window Orange', 140, { window: true }]]);
C(MD({ brand: 'be quiet!', name: 'be quiet! Silent Base 600', year: 2015, until: 2019, tier: 3, bays: [2, 0, 6, 2], fans: ['front1', 'rear'], usd: 100 }), [[' Black', 100], [' Orange', 100], [' Silver', 100], [' Window Black', 110, { window: true }]]);
C(MD({ brand: 'be quiet!', name: 'be quiet! Dark Base 900', year: 2016, until: 2020, tier: 5, style: 'full', window: true, bays: [2, 0, 7, 5], fans: ['front1', 'front2', 'rear'], usd: 230 }), [[' Black', 230], [' Orange', 230], ['', 270, { name: 'be quiet! Dark Base Pro 900', rgb: true }]]);
C(MD({ brand: 'SilverStone', name: 'SilverStone Raven RV03', year: 2012, until: 2016, tier: 4, window: true, bays: [3, 0, 5, 1], fans: ['front1', 'front2', 'rear'], usd: 150 }));
C(MD({ brand: 'SilverStone', name: 'SilverStone Kublai KL05', year: 2012, until: 2015, tier: 2, front: 'mesh', window: true, bays: [3, 0, 6, 0], fans: ['front1', 'rear'], usd: 70 }));
C(MD({ brand: 'SilverStone', name: 'SilverStone Grandia GD08', year: 2012, until: 2017, tier: 3, style: 'desktop', bays: [1, 0, 8, 0], fans: ['front1', 'front2', 'rear'], usd: 120 }));
C(MD({ brand: 'SilverStone', name: 'SilverStone Raven RV05', year: 2015, until: 2019, tier: 4, window: true, bays: [0, 0, 1, 5], fans: ['front1', 'front2'], usd: 130 }));
C(MD({ brand: 'SilverStone', name: 'SilverStone SUGO SG13', year: 2015, until: 2021, tier: 2, forms: FI, style: 'sff', front: 'mesh', bays: [0, 0, 1, 2], fans: ['front1'], usd: 50 }), [['B', 50], ['WB', 55, WH]]);
C(MD({ brand: 'In Win', name: 'In Win D-Frame', year: 2012, until: 2015, tier: 5, col: 'red', window: true, bays: [0, 0, 4, 2], fans: [], usd: 400 }));
C(MD({ brand: 'In Win', name: 'In Win 909', year: 2014, until: 2018, tier: 5, style: 'full', col: 'silver', front: 'glass', window: true, bays: [0, 0, 4, 4], fans: [], usd: 300 }));
C(MD({ brand: 'In Win', name: 'In Win 303', year: 2016, until: 2020, tier: 3, window: true, bays: [0, 0, 2, 2], fans: [], usd: 130 }), [[' Black', 130], [' White', 130, WH]]);
C(MD({ brand: 'In Win', name: 'In Win 101', year: 2016, until: 2020, tier: 3, window: true, bays: [0, 0, 2, 2], fans: ['rear'], usd: 90 }), [[' Black', 90], [' White', 90, WH]]);
C(MD({ brand: 'In Win', name: 'In Win 805', year: 2014, until: 2018, tier: 4, col: 'silver', front: 'glass', window: true, bays: [0, 0, 2, 2], fans: ['rear'], usd: 170 }));

// ---------------------------------------------------------------- 2017–2021
const MO = (x) => ({ col: 'black', front: 'solid', window: true, forms: FA, style: 'midi', ...x });
const GL = { front: 'glass' };
C(MO({ brand: 'NZXT', name: 'NZXT S340 Elite', year: 2017, until: 2019, tier: 3, bays: [0, 0, 2, 2], fans: ['rear', 'top1'], usd: 100 }), [[' Black', 100], [' White', 100, WH]]);
C(MO({ brand: 'NZXT', name: 'NZXT H700i', year: 2017, until: 2020, tier: 4, rgb: true, bays: [0, 0, 7, 3], fans: ['front1', 'front2', 'front3', 'rear'], usd: 200 }), [[' Matte Black', 200], [' Black/Red', 200], [' White', 200, WH]]);
C(MO({ brand: 'NZXT', name: 'NZXT H400i', year: 2017, until: 2020, tier: 4, rgb: true, forms: FM, style: 'minitower', bays: [0, 0, 2, 3], fans: ['front1', 'front2', 'rear'], usd: 150 }), [[' Black', 150], [' White', 150, WH]]);
C(MO({ brand: 'NZXT', name: 'NZXT H200i', year: 2017, until: 2020, tier: 3, rgb: true, forms: FI, style: 'sff', bays: [0, 0, 1, 2], fans: ['front1', 'rear'], usd: 110 }), [[' Black', 110], [' White', 110, WH]]);
C(MO({ brand: 'NZXT', name: 'NZXT H500', year: 2018, until: 2021, tier: 2, bays: [0, 0, 2, 2], fans: ['rear', 'top1'], usd: 70 }), [[' Black', 70], [' White', 70, WH], ['i Black', 100, { rgb: true, tier: 3 }], ['i White', 100, { ...WH, rgb: true, tier: 3 }]]);
C(MO({ brand: 'NZXT', name: 'NZXT H510', year: 2019, until: 2022, tier: 2, bays: [0, 0, 2, 2], fans: ['rear', 'top1'], usd: 70 }), [
  [' Black', 70], [' White', 70, WH], ['i Black', 100, { rgb: true, tier: 3 }], ['i White', 100, { ...WH, rgb: true, tier: 3 }],
  [' Elite Black', 150, { ...GL, rgb: true, tier: 4, fans: ['front1', 'front2', 'rear', 'top1'] }], [' Elite White', 150, { ...WH, ...GL, rgb: true, tier: 4, fans: ['front1', 'front2', 'rear', 'top1'] }],
  [' Flow Black', 90, { front: 'perforated', year: 2021, until: 2023 }], [' Flow White', 90, { ...WH, front: 'perforated', year: 2021, until: 2023 }],
]);
C(MO({ brand: 'NZXT', name: 'NZXT H710', year: 2019, until: 2022, tier: 3, bays: [0, 0, 7, 3], fans: ['front1', 'front2', 'rear', 'top1'], usd: 140 }), [[' Black', 140], [' White', 140, WH], ['i Black', 170, { rgb: true, tier: 4 }], ['i White', 170, { ...WH, rgb: true, tier: 4 }]]);
C(MO({ brand: 'NZXT', name: 'NZXT H210', year: 2019, until: 2022, tier: 2, forms: FI, style: 'sff', bays: [0, 0, 1, 2], fans: ['front1', 'rear'], usd: 80 }), [[' Black', 80], [' White', 80, WH], ['i Black', 110, { rgb: true, tier: 3 }]]);
C(MO({ brand: 'NZXT', name: 'NZXT H1', year: 2020, until: 2024, tier: 5, forms: FI, style: 'sff', front: 'perforated', bays: [0, 0, 0, 2], fans: ['top1'], usd: 350 }), [[' Matte Black', 350], [' Matte White', 350, WH], [' V2 Black', 400, { year: 2022 }]]);
C(MO({ brand: 'Cooler Master', name: 'Cooler Master MasterBox Lite 5', year: 2017, until: 2021, tier: 1, bays: [1, 0, 2, 3], fans: ['rear'], usd: 50 }), [['', 50], [' RGB', 60, { rgb: true, year: 2018, fans: ['front1', 'front2', 'front3'] }]]);
C(MO({ brand: 'Cooler Master', name: 'Cooler Master MasterCase H500P', year: 2017, until: 2021, tier: 4, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 180 }), [['', 180], [' Mesh', 180, { year: 2018 }], [' Mesh White', 180, { ...WH, year: 2018 }]]);
C(MO({ brand: 'Cooler Master', name: 'Cooler Master MasterBox Q300L', year: 2018, until: 2024, tier: 1, forms: FM, style: 'minitower', front: 'perforated', bays: [0, 0, 1, 2], fans: ['rear'], usd: 45 }));
C(MO({ brand: 'Cooler Master', name: 'Cooler Master Cosmos C700P', year: 2018, until: 2022, tier: 5, style: 'full', rgb: true, bays: [2, 0, 4, 3], fans: ['front1', 'front2', 'front3', 'rear'], usd: 330 }), [['', 330], [' Black Edition', 330, { year: 2019 }], ['', 450, { name: 'Cooler Master Cosmos C700M', year: 2019 }]]);
C(MO({ brand: 'Cooler Master', name: 'Cooler Master MasterBox MB511', year: 2019, until: 2023, tier: 2, front: 'mesh', bays: [0, 0, 2, 2], fans: ['rear'], usd: 70 }), [['', 70], [' RGB', 80, { rgb: true, fans: ['front1', 'front2', 'front3'] }]]);
C(MO({ brand: 'Cooler Master', name: 'Cooler Master MasterBox NR600', year: 2019, until: 2023, tier: 2, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 70 }));
C(MO({ brand: 'Cooler Master', name: 'Cooler Master MasterCase H500', year: 2019, until: 2023, tier: 3, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 100 }), [['', 100], ['M', 200, { tier: 5, fans: ['front1', 'front2', 'rear', 'top1', 'top2'] }]]);
C(MO({ brand: 'Cooler Master', name: 'Cooler Master MasterCase SL600M', year: 2019, until: 2023, tier: 5, col: 'silver', bays: [0, 0, 2, 3], fans: ['front1', 'front2'], usd: 250 }));
C(MO({ brand: 'Cooler Master', name: 'Cooler Master MasterBox TD500 Mesh', year: 2020, until: 2024, tier: 3, rgb: true, front: 'triangles', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3'], usd: 100 }), [['', 100], [' White', 100, WH], [' V2', 100, { year: 2023, until: 2026 }]]);
C(MO({ brand: 'Cooler Master', name: 'Cooler Master MasterBox NR200', year: 2020, until: 2026, tier: 3, forms: FI, style: 'sff', front: 'perforated', window: false, bays: [0, 0, 1, 3], fans: ['top1', 'top2'], usd: 80 }), [['', 80], ['P', 100, { window: true }], ['P White', 100, { ...WH, window: true }], ['P MAX', 350, { window: true, tier: 5, year: 2021 }]]);
C(MO({ brand: 'Cooler Master', name: 'Cooler Master MasterBox Q500L', year: 2020, until: 2024, tier: 1, front: 'perforated', bays: [0, 0, 2, 2], fans: ['rear'], usd: 50 }));
C(MO({ brand: 'Cooler Master', name: 'Cooler Master HAF 500', year: 2021, until: 2025, tier: 3, rgb: true, front: 'mesh', bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'rear'], usd: 120 }), [['', 120], [' White', 120, WH]]);
C(MO({ brand: 'Cooler Master', name: 'Cooler Master MasterBox 520 Mesh', year: 2021, until: 2025, tier: 2, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3'], usd: 90 }));
C(MO({ brand: 'Thermaltake', name: 'Thermaltake View 31 TG', year: 2017, until: 2021, tier: 3, bays: [0, 0, 2, 3], fans: ['front1', 'rear'], usd: 100 }), [['', 100], [' RGB', 130, { rgb: true, fans: ['front1', 'front2', 'rear'] }], [' Snow Edition', 110, WH]]);
C(MO({ brand: 'Thermaltake', name: 'Thermaltake View 71 TG', year: 2017, until: 2022, tier: 4, style: 'full', front: 'glass', bays: [0, 0, 6, 4], fans: ['front1', 'front2', 'rear'], usd: 180 }), [['', 180], [' RGB', 220, { rgb: true, tier: 5 }], [' Snow Edition', 190, WH]]);
C(MO({ brand: 'Thermaltake', name: 'Thermaltake Versa J23 TG RGB', year: 2018, until: 2022, tier: 2, rgb: true, bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3'], usd: 70 }));
C(MO({ brand: 'Thermaltake', name: 'Thermaltake Level 20 GT', year: 2018, until: 2022, tier: 5, style: 'full', rgb: true, ...GL, bays: [0, 0, 6, 4], fans: ['front1', 'front2', 'rear'], usd: 280 }), [['', 280], [' Snow Edition', 290, WH]]);
C(MO({ brand: 'Thermaltake', name: 'Thermaltake Versa H26', year: 2019, until: 2024, tier: 1, front: 'mesh', bays: [0, 0, 2, 2], fans: ['rear'], usd: 55 }), [['', 55], [' Snow Edition', 60, WH]]);
C(MO({ brand: 'Thermaltake', name: 'Thermaltake View 51 TG Snow', year: 2019, until: 2023, tier: 4, ...WH, front: 'glass', bays: [0, 0, 3, 3], fans: ['front1', 'front2', 'rear'], usd: 190 }));
C(MO({ brand: 'Thermaltake', name: 'Thermaltake H200 TG RGB', year: 2019, until: 2023, tier: 2, rgb: true, bays: [0, 0, 2, 2], fans: ['rear'], usd: 70 }), [['', 70], [' Snow Edition', 75, WH]]);
C(MO({ brand: 'Thermaltake', name: 'Thermaltake The Tower 900', year: 2019, until: 2024, tier: 5, style: 'full', ...GL, bays: [0, 0, 6, 6], fans: ['rear'], usd: 250 }), [['', 250], [' Snow Edition', 260, WH]]);
C(MO({ brand: 'Thermaltake', name: 'Thermaltake S100 TG', year: 2020, until: 2025, tier: 1, forms: FM, style: 'minitower', front: 'perforated', bays: [0, 0, 2, 2], fans: ['rear'], usd: 50 }), [['', 50], [' Snow Edition', 55, WH]]);
C(MO({ brand: 'Thermaltake', name: 'Thermaltake S300 TG', year: 2020, until: 2024, tier: 2, bays: [0, 0, 2, 2], fans: ['front1', 'rear'], usd: 70 }), [['', 70], [' Snow Edition', 75, WH]]);
C(MO({ brand: 'Thermaltake', name: 'Thermaltake Divider 300 TG', year: 2020, until: 2024, tier: 2, front: 'triangles', bays: [0, 0, 2, 3], fans: ['front1', 'front2', 'rear'], usd: 90 }), [['', 90], [' Air', 90, { front: 'mesh' }], [' Snow', 95, WH]]);
C(MO({ brand: 'Thermaltake', name: 'Thermaltake Core P6 TG', year: 2020, until: 2024, tier: 4, bays: [0, 0, 2, 4], fans: [], usd: 170 }), [['', 170], [' Snow', 180, WH]]);
C(MO({ brand: 'Thermaltake', name: 'Thermaltake AH T600', year: 2020, until: 2024, tier: 5, style: 'full', ...GL, bays: [0, 0, 2, 4], fans: ['front1', 'rear'], usd: 280 }), [['', 280], [' Snow', 290, WH]]);
C(MO({ brand: 'Antec', name: 'Antec P101 Silent', year: 2017, until: 2022, tier: 3, window: false, bays: [0, 0, 6, 2], fans: ['front1', 'front2', 'rear'], usd: 120 }));
C(MO({ brand: 'Antec', name: 'Antec P8', year: 2018, until: 2022, tier: 2, bays: [0, 0, 2, 3], fans: ['front1', 'front2', 'front3', 'rear'], usd: 80 }));
C(MO({ brand: 'Antec', name: 'Antec P120 Crystal', year: 2018, until: 2022, tier: 3, ...GL, bays: [0, 0, 2, 2], fans: [], usd: 120 }));
C(MO({ brand: 'Antec', name: 'Antec DF600 Flux', year: 2019, until: 2023, tier: 2, rgb: true, ...GL, bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3', 'rear'], usd: 80 }));
C(MO({ brand: 'Antec', name: 'Antec NX400', year: 2019, until: 2023, tier: 1, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'rear'], usd: 60 }), [['', 60], ['', 65, { name: 'Antec NX410', year: 2020, until: 2024 }]]);
C(MO({ brand: 'Antec', name: 'Antec DP502 Flux', year: 2020, until: 2024, tier: 2, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 70 }));
C(MO({ brand: 'Antec', name: 'Antec DF700 Flux', year: 2020, until: 2024, tier: 2, rgb: true, ...GL, bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3', 'rear'], usd: 90 }));
C(MO({ brand: 'Antec', name: 'Antec P82 Flow', year: 2021, until: 2025, tier: 2, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 80 }));
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Define C', year: 2017, until: 2021, tier: 3, bays: [0, 0, 3, 3], fans: ['front1', 'rear'], usd: 90 }), [['', 90, { window: false }], [' TG', 100, {}],['', 80, { name: 'Fractal Design Define Mini C', forms: FM, style: 'minitower', window: false }], [' Mini C TG', 90, { name: 'Fractal Design Define Mini C TG', forms: FM, style: 'minitower' }]]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Meshify C', year: 2017, until: 2022, tier: 3, front: 'mesh', bays: [0, 0, 2, 3], fans: ['front1', 'rear'], usd: 90 }), [[' Black TG', 90], [' White TG', 95, { ...WH, year: 2018 }], [' Mini Dark TG', 90, { name: 'Fractal Design Meshify C Mini Dark TG', forms: FM, style: 'minitower', year: 2018 }]]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Define R6', year: 2017, until: 2021, tier: 4, bays: [0, 0, 6, 4], fans: ['front1', 'front2', 'rear'], usd: 150 }), [[' Black', 140, { window: false }], [' Black TG', 150], [' White TG', 155, WH], [' Gunmetal TG', 150, { col: 'gun' }], [' Blackout TG', 150]]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Focus G', year: 2017, until: 2021, tier: 1, front: 'mesh', bays: [2, 0, 2, 2], fans: ['front1', 'front2'], usd: 60 }), [[' Black', 60], [' White', 60, WH], [' Mystic Blue', 60, { col: 'blue' }], [' Petrol Blue', 60, { col: 'blue' }], [' Mystic Red', 60, { col: 'red' }], [' Gunmetal Gray', 60, { col: 'gun' }]]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Vector RS', year: 2018, until: 2021, tier: 4, ...GL, bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'rear'], usd: 180 }), [[' Blackout TG', 180], [' Dark TG', 180, { col: 'gun' }]]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Meshify S2', year: 2018, until: 2022, tier: 4, front: 'mesh', bays: [0, 0, 2, 3], fans: ['front1', 'front2', 'rear'], usd: 150 }), [[' Dark TG', 150], [' White TG', 155, WH]]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Define S2', year: 2019, until: 2022, tier: 4, bays: [0, 0, 3, 3], fans: ['front1', 'front2', 'rear'], usd: 150 }), [[' Blackout TG', 150], [' Vision Blackout', 160, GL]]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Define 7', year: 2020, until: 2024, tier: 4, bays: [0, 0, 6, 4], fans: ['front1', 'front2', 'rear'], usd: 170 }), [[' Black Solid', 160, { window: false }], [' Black TG Dark Tint', 170], [' White TG Clear Tint', 175, WH], [' Compact Black TG', 110, { name: 'Fractal Design Define 7 Compact Black TG', tier: 3 }], [' XL Dark TG', 230, { name: 'Fractal Design Define 7 XL Dark TG', style: 'full', tier: 5 }]]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Meshify 2', year: 2020, until: 2025, tier: 4, front: 'mesh', bays: [0, 0, 6, 4], fans: ['front1', 'front2', 'rear'], usd: 150 }), [
  [' Black TG Dark Tint', 150], [' White TG Clear Tint', 155, WH], [' Lite Black TG', 130, { year: 2022, tier: 3 }],
  [' Compact Black TG', 110, { name: 'Fractal Design Meshify 2 Compact Black TG', year: 2021, tier: 3, bays: [0, 0, 2, 2] }], [' Compact White TG', 115, { name: 'Fractal Design Meshify 2 Compact White TG', ...WH, year: 2021, tier: 3, bays: [0, 0, 2, 2] }],
  [' XL Black TG', 230, { name: 'Fractal Design Meshify 2 XL Black TG', style: 'full', year: 2021, tier: 5 }],
]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Torrent', year: 2020, until: 2025, tier: 5, front: 'mesh', bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'rear'], usd: 230 }), [
  [' Black TG Dark Tint', 230], [' White TG Clear Tint', 230, WH], [' RGB Black TG', 260, { rgb: true }],
  [' Compact Black TG', 150, { name: 'Fractal Design Torrent Compact Black TG', year: 2021, tier: 4 }],
]);
C(MO({ brand: 'Phanteks', name: 'Phanteks Eclipse P300', year: 2018, until: 2021, tier: 2, bays: [0, 0, 2, 2], fans: ['rear'], usd: 60 }), [[' Black', 60], [' White', 60, WH]]);
C(MO({ brand: 'Phanteks', name: 'Phanteks Evolv X', year: 2018, until: 2022, tier: 5, rgb: true, bays: [0, 0, 4, 4], fans: [], usd: 200 }), [[' Galaxy Silver', 200, { col: 'silver' }], [' Anthracite Grey', 200, { col: 'gun' }]]);
C(MO({ brand: 'Phanteks', name: 'Phanteks Evolv Shift', year: 2019, until: 2022, tier: 4, forms: FI, style: 'sff', bays: [0, 0, 0, 2], fans: ['front1'], usd: 130 }));
C(MO({ brand: 'Phanteks', name: 'Phanteks Eclipse P400A', year: 2020, until: 2024, tier: 2, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3'], usd: 80 }), [[' Digital Black', 80], [' Digital White', 80, WH]]);
C(MO({ brand: 'Phanteks', name: 'Phanteks Eclipse P500A', year: 2020, until: 2024, tier: 3, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3'], usd: 130 }), [[' D-RGB Black', 130], [' D-RGB White', 130, WH]]);
C(MO({ brand: 'Phanteks', name: 'Phanteks Eclipse P360A', year: 2021, until: 2025, tier: 1, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2'], usd: 70 }), [[' Black', 70], [' White', 70, WH]]);
C(MO({ brand: 'Phanteks', name: 'Phanteks Enthoo Pro 2', year: 2021, until: 2025, tier: 4, style: 'full', front: 'mesh', bays: [0, 0, 8, 4], fans: [], usd: 150 }), [[' Tempered Glass', 150], [' Closed Panel', 150, { window: false }]]);
C(MO({ brand: 'be quiet!', name: 'be quiet! Pure Base 600', year: 2017, until: 2021, tier: 3, window: false, bays: [2, 0, 3, 3], fans: ['front1', 'rear'], usd: 90 }), [[' Black', 90], [' Window Black', 100, { window: true }], [' Window Orange', 100, { window: true }]]);
C(MO({ brand: 'be quiet!', name: 'be quiet! Dark Base 700', year: 2018, until: 2022, tier: 5, rgb: true, bays: [2, 0, 7, 5], fans: ['front1', 'rear'], usd: 200 }));
C(MO({ brand: 'be quiet!', name: 'be quiet! Pure Base 500', year: 2019, until: 2024, tier: 2, bays: [0, 0, 2, 2], fans: ['front1', 'rear'], usd: 80 }), [[' Black', 80], [' White', 80, WH], ['DX Black', 100, { front: 'mesh', rgb: true, fans: ['front1', 'rear', 'top1'], tier: 3 }], ['DX White', 100, { ...WH, front: 'mesh', rgb: true, fans: ['front1', 'rear', 'top1'], tier: 3 }]]);
C(MO({ brand: 'be quiet!', name: 'be quiet! Silent Base 801', year: 2019, until: 2023, tier: 4, rgb: true, bays: [1, 0, 7, 3], fans: ['front1', 'front2', 'rear'], usd: 150 }), [[' Window Black', 150], [' Window Silver', 150], [' Window Orange', 150]]);
C(MO({ brand: 'be quiet!', name: 'be quiet! Silent Base 601', year: 2019, until: 2023, tier: 3, bays: [1, 0, 3, 3], fans: ['front1', 'front2', 'rear'], usd: 120 }), [[' Window Black', 120], [' Window Silver', 120]]);
C(MO({ brand: 'be quiet!', name: 'be quiet! Dark Base Pro 901', year: 2021, until: 2025, tier: 5, style: 'full', rgb: true, bays: [2, 0, 7, 5], fans: ['front1', 'front2', 'rear'], usd: 270 }), [[' Black', 270], [' Silver', 270, { col: 'silver' }]]);
C(MO({ brand: 'be quiet!', name: 'be quiet! Silent Base 802', year: 2021, until: 2025, tier: 4, bays: [0, 0, 7, 3], fans: ['front1', 'front2', 'rear'], usd: 160 }), [[' Window Black', 160], [' Window White', 160, WH], [' Black', 150, { window: false }]]);
C(MO({ brand: 'Corsair', name: 'Corsair Carbide 270R', year: 2017, until: 2020, tier: 2, bays: [0, 0, 2, 2], fans: ['front1', 'rear'], usd: 60 }));
C(MO({ brand: 'Corsair', name: 'Corsair Crystal 280X RGB', year: 2017, until: 2021, tier: 4, rgb: true, forms: FM, style: 'minitower', ...GL, bays: [0, 0, 2, 3], fans: ['front1', 'front2'], usd: 150 }), [[' Black', 150], [' White', 150, WH]]);
C(MO({ brand: 'Corsair', name: 'Corsair Obsidian 500D', year: 2017, until: 2021, tier: 4, ...GL, bays: [0, 0, 2, 3], fans: ['front1', 'rear'], usd: 150 }), [['', 150], [' RGB SE', 250, { rgb: true, tier: 5, fans: ['front1', 'front2', 'front3'] }]]);
C(MO({ brand: 'Corsair', name: 'Corsair Obsidian 1000D', year: 2018, until: 2022, tier: 5, style: 'full', ...GL, bays: [0, 0, 5, 6], fans: [], usd: 500 }));
C(MO({ brand: 'Corsair', name: 'Corsair Crystal 680X RGB', year: 2018, until: 2022, tier: 5, rgb: true, ...GL, bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'front3', 'rear'], usd: 250 }), [[' Black', 250], [' White', 250, WH]]);
C(MO({ brand: 'Corsair', name: 'Corsair Carbide 275R Airflow', year: 2019, until: 2022, tier: 2, front: 'mesh', bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'rear'], usd: 80 }), [[' Black', 80], [' White', 80, WH]]);
C(MO({ brand: 'Corsair', name: 'Corsair Carbide 175R RGB', year: 2019, until: 2022, tier: 2, rgb: true, bays: [0, 0, 2, 2], fans: ['front1', 'rear'], usd: 70 }));
C(MO({ brand: 'Corsair', name: 'Corsair iCUE 220T RGB', year: 2019, until: 2023, tier: 3, rgb: true, front: 'glass', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3'], usd: 100 }), [[' Black', 100], [' White', 100, WH], [' Airflow', 100, { front: 'mesh', year: 2020 }]]);
C(MO({ brand: 'Corsair', name: 'Corsair iCUE 465X RGB', year: 2019, until: 2023, tier: 4, rgb: true, ...GL, bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3', 'rear'], usd: 140 }), [[' Black', 140], [' White', 140, WH]]);
C(MO({ brand: 'Corsair', name: 'Corsair 4000D', year: 2020, until: 2026, tier: 2, bays: [0, 0, 2, 2], fans: ['front1', 'rear'], usd: 80 }), [
  ['', 80], [' White', 80, WH],
  [' Airflow', 95, { id: '4000d-airflow', cost: 1000, forms: ['mATX', 'ATX', 'ITX'], col: undefined, color: '#e9e9e6', inner: '#d4d4d0', front: 'triangles' }],
  [' Airflow Black', 95, { front: 'triangles' }],
  ['', 150, { name: 'Corsair iCUE 4000X RGB', id: '4000x-rgb', cost: 1500, forms: ['mATX', 'ATX', 'ITX'], tier: 4, rgb: true, color: '#1a1b1e', inner: '#2a2c30', front: 'glass', fans: ['front1', 'front2', 'front3'] }],
  ['', 150, { name: 'Corsair iCUE 4000X RGB White', tier: 4, rgb: true, ...WH, front: 'glass', fans: ['front1', 'front2', 'front3'] }],
  ['', 110, { name: 'Corsair 4000D RGB Airflow', year: 2022, tier: 3, rgb: true, front: 'triangles', fans: ['front1', 'front2', 'front3'] }],
]);
C(MO({ brand: 'Corsair', name: 'Corsair 5000D', year: 2020, until: 2026, tier: 3, bays: [0, 0, 2, 4], fans: ['front1', 'rear'], usd: 160 }), [
  ['', 160], [' White', 160, WH], [' Airflow', 170, { front: 'triangles' }], [' Airflow White', 170, { ...WH, front: 'triangles' }],
  ['', 210, { name: 'Corsair iCUE 5000X RGB', tier: 4, rgb: true, front: 'glass', fans: ['front1', 'front2', 'front3'] }],
  ['', 210, { name: 'Corsair iCUE 5000X RGB White', tier: 4, rgb: true, ...WH, front: 'glass', fans: ['front1', 'front2', 'front3'] }],
  ['', 250, { name: 'Corsair iCUE 5000T RGB', year: 2021, tier: 5, rgb: true, front: 'glass', fans: ['front1', 'front2', 'front3'] }],
]);
C(MO({ brand: 'Corsair', name: 'Corsair 7000D Airflow', year: 2021, until: 2026, tier: 5, style: 'full', front: 'triangles', bays: [0, 0, 6, 4], fans: ['front1', 'front2', 'front3', 'rear'], usd: 250 }), [['', 250], [' White', 250, WH], ['', 300, { name: 'Corsair iCUE 7000X RGB', rgb: true, front: 'glass' }]]);
C(MO({ brand: 'Lian Li', name: 'Lian Li Alpha 550', year: 2017, until: 2020, tier: 4, rgb: true, bays: [0, 0, 2, 3], fans: ['front1', 'front2', 'front3', 'rear'], usd: 150 }), [[' Black', 150], [' White', 150, WH]]);
C(MO({ brand: 'Lian Li', name: 'Lian Li O11 Dynamic', year: 2018, until: 2023, tier: 4, ...GL, bays: [0, 0, 2, 4], fans: [], usd: 130 }), [
  ['', 130], [' White', 130, WH], [' Razer Edition', 170, { rgb: true }], [' XL ROG Certified', 200, { year: 2019, style: 'full', tier: 5 }], [' XL White', 200, { ...WH, year: 2019, style: 'full', tier: 5 }],
  [' Mini', 110, { year: 2020, tier: 3 }], [' Mini White', 110, { ...WH, year: 2020, tier: 3 }],
]);
C(MO({ brand: 'Lian Li', name: 'Lian Li O11 Air', year: 2019, until: 2023, tier: 4, front: 'mesh', bays: [0, 0, 4, 4], fans: ['front1', 'front2', 'rear'], usd: 130 }), [['', 130], [' Mini', 100, { year: 2021, tier: 3 }], [' Mini White', 100, { ...WH, year: 2021, tier: 3 }]]);
C(MO({ brand: 'Lian Li', name: 'Lian Li Lancool One Digital', year: 2019, until: 2022, tier: 3, rgb: true, bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 100 }));
C(MO({ brand: 'Lian Li', name: 'Lian Li Lancool II', year: 2020, until: 2023, tier: 3, bays: [0, 0, 3, 4], fans: ['front1', 'front2', 'rear'], usd: 90 }), [['', 90], [' White', 90, WH], [' Mesh', 100, { front: 'mesh' }], [' Mesh White', 100, { ...WH, front: 'mesh' }], [' Mesh RGB', 120, { front: 'mesh', rgb: true }]]);
C(MO({ brand: 'Lian Li', name: 'Lian Li Lancool 215', year: 2020, until: 2024, tier: 2, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 80 }));
C(MO({ brand: 'Lian Li', name: 'Lian Li TU150', year: 2020, until: 2024, tier: 3, forms: FI, style: 'sff', col: 'silver', bays: [0, 0, 1, 2], fans: [], usd: 110 }), [[' Silver', 110], [' Black', 110, { col: 'black' }], [' Mesh', 110, { col: 'black', front: 'mesh' }]]);
C(MO({ brand: 'Lian Li', name: 'Lian Li Lancool 205', year: 2021, until: 2024, tier: 2, bays: [0, 0, 2, 2], fans: ['front1', 'rear'], usd: 70 }), [['', 70], [' Mesh', 70, { front: 'mesh' }], [' Mesh White', 70, { ...WH, front: 'mesh' }]]);
C(MO({ brand: 'Lian Li', name: 'Lian Li Q58', year: 2021, until: 2025, tier: 4, forms: FI, style: 'sff', front: 'perforated', bays: [0, 0, 0, 3], fans: [], usd: 130 }), [[' Black', 130], [' White', 130, WH]]);
C(MO({ brand: 'Lian Li', name: 'Lian Li A4-H2O', year: 2021, until: 2025, tier: 4, forms: FI, style: 'sff', col: 'silver', front: 'perforated', bays: [0, 0, 0, 2], fans: [], usd: 150 }), [[' Silver', 150], [' Black', 150, { col: 'black' }]]);
C(MO({ brand: 'SilverStone', name: 'SilverStone Redline RL06', year: 2018, until: 2022, tier: 2, front: 'mesh', bays: [0, 0, 2, 3], fans: ['front1', 'front2', 'rear'], usd: 70 }), [['BR-PRO', 70], ['WS-PRO', 70, WH]]);
C(MO({ brand: 'SilverStone', name: 'SilverStone Primera PM01', year: 2018, until: 2022, tier: 3, rgb: true, bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'rear'], usd: 120 }));
C(MO({ brand: 'SilverStone', name: 'SilverStone Fara R1', year: 2019, until: 2023, tier: 1, front: 'mesh', bays: [0, 0, 2, 2], fans: ['rear'], usd: 50 }));
C(MO({ brand: 'SilverStone', name: 'SilverStone SUGO SG14', year: 2019, until: 2024, tier: 3, forms: FI, style: 'sff', front: 'mesh', window: false, bays: [0, 0, 1, 2], fans: ['front1'], usd: 80 }));
C(MO({ brand: 'SilverStone', name: 'SilverStone Alta G1M', year: 2021, until: 2025, tier: 5, forms: FM, style: 'minitower', col: 'silver', bays: [0, 0, 2, 4], fans: ['front1', 'front2'], usd: 250 }));
C(MO({ brand: 'Jonsbo', name: 'Jonsbo UMX4', year: 2016, until: 2021, tier: 3, forms: FM, style: 'minitower', col: 'silver', bays: [0, 0, 2, 2], fans: ['rear'], usd: 90 }), [[' Silver', 90], [' Black', 90, { col: 'black' }]]);
C(MO({ brand: 'Jonsbo', name: 'Jonsbo U4', year: 2017, until: 2021, tier: 2, col: 'silver', bays: [0, 0, 2, 2], fans: ['rear'], usd: 70 }), [[' Silver', 70], [' Black', 70, { col: 'black' }]]);
C(MO({ brand: 'Jonsbo', name: 'Jonsbo A4', year: 2021, until: 2025, tier: 2, forms: FI, style: 'sff', front: 'perforated', window: false, col: 'silver', bays: [0, 0, 0, 2], fans: [], usd: 70 }));
C(MO({ brand: 'Jonsbo', name: 'Jonsbo D30', year: 2021, until: 2025, tier: 2, forms: FM, style: 'minitower', front: 'perforated', bays: [0, 0, 1, 2], fans: [], usd: 70 }), [[' Black', 70], [' White', 70, WH], [' Pink', 70, { col: 'pink' }]]);
C(MO({ brand: 'In Win', name: 'In Win A1 Plus', year: 2019, until: 2023, tier: 4, forms: FI, style: 'sff', rgb: true, bays: [0, 0, 1, 2], fans: ['top1'], usd: 180 }), [[' Black', 180], [' White', 180, WH]]);
C(MO({ brand: 'In Win', name: 'In Win 305', year: 2016, until: 2020, tier: 3, bays: [0, 0, 2, 2], fans: [], usd: 90 }), [[' Black', 90], [' White', 90, WH]]);
C(MO({ brand: 'Gigabyte', name: 'Gigabyte AORUS C300 Glass', year: 2019, until: 2022, tier: 3, rgb: true, bays: [0, 0, 2, 2], fans: ['front1', 'rear'], usd: 90 }));
C(MO({ brand: 'ASUS', name: 'ASUS ROG Strix Helios', year: 2019, until: 2023, tier: 5, style: 'full', rgb: true, ...GL, bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'front3', 'rear'], usd: 300 }), [[' Black', 300], [' White Edition', 310, { ...WH, year: 2021 }]]);
C(MO({ brand: 'ASUS', name: 'ASUS TUF Gaming GT501', year: 2018, until: 2022, tier: 3, rgb: true, front: 'mesh', bays: [0, 0, 4, 3], fans: ['front1', 'front2', 'front3', 'rear'], usd: 170 }));
C(MO({ brand: 'MSI', name: 'MSI MAG Forge 100R', year: 2020, until: 2023, tier: 1, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 60 }));
C(MO({ brand: 'MSI', name: 'MSI MPG GUNGNIR 110R', year: 2020, until: 2023, tier: 3, rgb: true, front: 'mesh', bays: [0, 0, 2, 3], fans: ['front1', 'front2', 'front3', 'rear'], usd: 110 }));
C(MO({ brand: 'DeepCool', name: 'DeepCool MATREXX 55 Mesh', year: 2019, until: 2023, tier: 1, front: 'mesh', bays: [0, 0, 2, 2], fans: ['rear'], usd: 60 }));
C(MO({ brand: 'DeepCool', name: 'DeepCool CK560', year: 2021, until: 2025, tier: 2, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3', 'rear'], usd: 90 }), [['', 90], [' WH', 90, WH]]);
C(MO({ brand: 'Montech', name: 'Montech AIR 903 MAX', year: 2021, until: 2025, tier: 2, front: 'mesh', bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'front3', 'rear'], usd: 90 }), [[' Black', 90], [' White', 90, WH]]);
C(MO({ brand: 'Montech', name: 'Montech X3 Mesh', year: 2020, until: 2024, tier: 1, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3', 'rear'], usd: 60 }), [[' Black', 60], [' White', 60, WH]]);
C(MO({ brand: 'Kolink', name: 'Kolink Observatory', year: 2019, until: 2023, tier: 1, rgb: true, ...GL, bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 60 }));
C(MO({ brand: 'Sharkoon', name: 'Sharkoon TG5 RGB', year: 2018, until: 2022, tier: 2, rgb: true, ...GL, bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3', 'rear'], usd: 70 }));

// ---------------------------------------------------------------- 2022–2026
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Pop Air', year: 2022, until: 2026, tier: 2, front: 'honeycomb', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 80 }), [
  [' Black TG Clear Tint', 80], [' RGB Black TG Clear Tint', 90, { rgb: true, fans: ['front1', 'front2', 'front3', 'rear'] }], [' RGB White TG Clear Tint', 90, { ...WH, rgb: true, fans: ['front1', 'front2', 'front3', 'rear'] }],
  ['', 80, { name: 'Fractal Design Pop Silent Black Solid', front: 'solid', window: false }], ['', 85, { name: 'Fractal Design Pop Silent Black TG Clear Tint', front: 'solid' }],
  ['', 110, { name: 'Fractal Design Pop XL Air RGB Black TG Clear Tint', style: 'full', rgb: true, tier: 3, bays: [0, 0, 4, 2], fans: ['front1', 'front2', 'front3', 'rear'] }],
  ['', 110, { name: 'Fractal Design Pop XL Silent Black TG Clear Tint', style: 'full', front: 'solid', tier: 3, bays: [0, 0, 4, 2] }],
]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Pop Mini', year: 2022, until: 2026, tier: 1, forms: ['mATX', 'ITX'], style: 'minitower', bays: [0, 0, 2, 2], usd: 75 }), [
  [' Silent', 75, { id: 'pop-mini-silent', cost: 800, window: false, fans: ['front2', 'rear'], color: '#26282c', inner: '#34373c', front: 'solid' }],
  [' Silent Black TG Clear Tint', 80, { fans: ['front2', 'rear'], front: 'solid' }],
  [' Air RGB', 85, { id: 'pop-mini-air', cost: 900, rgb: true, fans: ['front1', 'front2', 'front3', 'rear'], color: '#2a2c30', inner: '#3a3d42', front: 'honeycomb' }],
  [' Air RGB White TG Clear Tint', 85, { ...WH, rgb: true, fans: ['front1', 'front2', 'front3', 'rear'], front: 'honeycomb' }],
]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design North', year: 2022, until: 2026, tier: 4, col: 'wood', front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2'], usd: 140 }), [
  [' Charcoal Black TG Dark', 140], [' Chalk White TG Clear', 140, { color: '#e3dfd6', inner: '#8a6a4a' }], [' Charcoal Black Mesh', 130, { window: false }],
  [' XL Charcoal Black TG Dark', 190, { year: 2024, style: 'full', tier: 5, bays: [0, 0, 4, 2], fans: ['front1', 'front2', 'front3'] }],
]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Torrent Nano', year: 2022, until: 2026, tier: 3, forms: FI, style: 'sff', front: 'mesh', bays: [0, 0, 1, 2], fans: ['front1'], usd: 130 }), [[' Black TG Dark Tint', 130], [' White TG Clear Tint', 130, WH]]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Ridge', year: 2022, until: 2026, tier: 3, forms: FI, style: 'sff', front: 'perforated', window: false, bays: [0, 0, 0, 2], fans: [], usd: 130 }), [[' Black', 130], [' White', 130, WH]]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Terra', year: 2023, until: 2026, tier: 4, forms: FI, style: 'sff', front: 'perforated', window: false, bays: [0, 0, 0, 2], fans: [], usd: 180 }), [[' Jade', 180, { col: 'green' }], [' Graphite', 180, { col: 'gun' }], [' Silver', 180, { col: 'silver' }]]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Focus 2', year: 2023, until: 2026, tier: 1, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2'], usd: 80 }), [[' Black TG Clear Tint', 80], [' RGB Black TG', 90, { rgb: true }], [' RGB White TG', 90, { ...WH, rgb: true }]]);
C(MO({ brand: 'Fractal Design', name: 'Fractal Design Mood', year: 2024, until: 2026, tier: 4, forms: FI, style: 'sff', col: 'gun', front: 'perforated', window: false, bays: [0, 0, 0, 2], fans: ['top1'], usd: 150 }), [[' Dark Grey', 150], [' Light Grey', 150, { col: 'grey' }]]);
C(MO({ brand: 'NZXT', name: 'NZXT H5 Flow', year: 2022, until: 2026, tier: 3, front: 'perforated', bays: [0, 0, 1, 2], fans: ['front2', 'rear'], usd: 95 }), [
  ['', 95, { id: 'h5-flow', cost: 950, forms: ['mATX', 'ATX', 'ITX'], color: '#1f2023', inner: '#2e3035' }], [' White', 95, WH],
  ['', 140, { name: 'NZXT H5 Elite', rgb: true, front: 'glass', tier: 4 }], ['', 140, { name: 'NZXT H5 Elite White', ...WH, rgb: true, front: 'glass', tier: 4 }],
  [' RGB', 110, { year: 2024, rgb: true }], [' RGB White', 110, { ...WH, year: 2024, rgb: true }],
]);
C(MO({ brand: 'NZXT', name: 'NZXT H7', year: 2022, until: 2026, tier: 3, bays: [0, 0, 2, 4], fans: ['top1', 'rear'], usd: 130 }), [
  [' Black', 130], [' White', 130, WH], [' Flow Black', 130, { front: 'perforated' }], [' Flow White', 130, { ...WH, front: 'perforated' }],
  [' Elite Black', 200, { rgb: true, front: 'glass', tier: 4, fans: ['front1', 'front2', 'front3', 'rear'] }], [' Elite White', 200, { ...WH, rgb: true, front: 'glass', tier: 4, fans: ['front1', 'front2', 'front3', 'rear'] }],
  [' Flow RGB Black', 150, { year: 2024, rgb: true, front: 'perforated', fans: ['front1', 'front2', 'front3', 'rear'] }],
]);
C(MO({ brand: 'NZXT', name: 'NZXT H9 Flow', year: 2022, until: 2026, tier: 4, front: 'glass', bays: [0, 0, 2, 4], fans: ['top1', 'top2', 'top3', 'rear'], usd: 160 }), [[' Black', 160], [' White', 160, WH], ['', 230, { name: 'NZXT H9 Elite', rgb: true, tier: 5 }], ['', 230, { name: 'NZXT H9 Elite White', ...WH, rgb: true, tier: 5 }]]);
C(MO({ brand: 'NZXT', name: 'NZXT H6 Flow', year: 2023, until: 2026, tier: 3, front: 'glass', bays: [0, 0, 1, 2], fans: ['front1', 'front2', 'front3'], usd: 110 }), [[' Black', 110], [' White', 110, WH], [' RGB Black', 130, { rgb: true }], [' RGB White', 130, { ...WH, rgb: true }]]);
C(MO({ brand: 'Lian Li', name: 'Lian Li LANCOOL 216', year: 2022, until: 2026, tier: 3, front: 'mesh', bays: [0, 0, 2, 4], fans: ['front1', 'front3', 'rear'], usd: 100 }), [
  [' RGB', 110, { id: 'lancool-216-rgb', cost: 1150, forms: ['mATX', 'ATX', 'ITX'], rgb: true, color: '#1d1e21', inner: '#2b2d31' }], [' RGB White', 110, { ...WH, rgb: true }], [' Black', 100], [' White', 100, WH],
]);
C(MO({ brand: 'Lian Li', name: 'Lian Li O11 Dynamic EVO', year: 2022, until: 2026, tier: 5, front: 'glass', bays: [0, 0, 4, 4], fans: [], usd: 170 }), [
  ['', 170, { id: 'o11-evo', cost: 1700, forms: ['mATX', 'ATX', 'ITX'], color: '#dcdcd8', inner: '#c6c6c2' }], [' Black', 170],
  [' XL', 230, { year: 2023, style: 'full' }], [' XL White', 230, { ...WH, year: 2023, style: 'full' }], [' RGB', 190, { year: 2024, rgb: true }],
]);
C(MO({ brand: 'Lian Li', name: 'Lian Li O11 Vision', year: 2023, until: 2026, tier: 4, front: 'glass', bays: [0, 0, 2, 3], fans: [], usd: 130 }), [[' Black', 130], [' White', 130, WH], [' Chrome', 150, { col: 'silver' }], [' Compact', 100, { year: 2024, tier: 3 }]]);
C(MO({ brand: 'Lian Li', name: 'Lian Li LANCOOL III', year: 2022, until: 2026, tier: 4, front: 'mesh', bays: [2, 0, 4, 4], fans: ['front1', 'front2', 'front3', 'rear'], usd: 150 }), [[' Black', 150], [' White', 150, WH], [' RGB Black', 170, { rgb: true }], [' RGB White', 170, { ...WH, rgb: true }]]);
C(MO({ brand: 'Lian Li', name: 'Lian Li LANCOOL 217', year: 2023, until: 2026, tier: 3, rgb: true, col: 'wood', front: 'mesh', bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'rear'], usd: 110 }), [[' Black', 110], [' White', 110, { color: '#e3dfd6', inner: '#8a6a4a' }]]);
C(MO({ brand: 'Lian Li', name: 'Lian Li LANCOOL 207', year: 2024, until: 2026, tier: 2, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 80 }), [[' Black', 80], [' White', 80, WH]]);
C(MO({ brand: 'Lian Li', name: 'Lian Li A3-mATX', year: 2023, until: 2026, tier: 2, forms: FM, style: 'minitower', front: 'perforated', bays: [0, 0, 1, 2], fans: [], usd: 70 }), [[' Black', 70], [' White', 70, WH], [' Wood Black', 80, { col: 'wood', year: 2024 }]]);
C(MO({ brand: 'HYTE', name: 'HYTE Y60', year: 2022, until: 2026, tier: 4, front: 'glass', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 200 }), [[' Black', 200], [' Snow White', 200, WH], [' Red', 200, { col: 'red' }]]);
C(MO({ brand: 'HYTE', name: 'HYTE Revolt 3', year: 2022, until: 2026, tier: 4, forms: FI, style: 'sff', front: 'mesh', window: false, bays: [0, 0, 0, 2], fans: [], usd: 170 }), [[' Black', 170], [' White', 170, WH]]);
C(MO({ brand: 'HYTE', name: 'HYTE Y40', year: 2023, until: 2026, tier: 3, front: 'glass', bays: [0, 0, 1, 2], fans: ['rear'], usd: 150 }), [[' Black', 150], [' Snow White', 150, WH], [' Red', 150, { col: 'red' }]]);
C(MO({ brand: 'HYTE', name: 'HYTE Y70', year: 2023, until: 2026, tier: 5, front: 'glass', bays: [0, 0, 2, 3], fans: ['front1', 'front2', 'rear'], usd: 220 }), [[' Touch Black', 360, { rgb: true }], [' Touch Snow White', 360, { ...WH, rgb: true }], [' Black', 220, { year: 2024 }], [' Snow White', 220, { ...WH, year: 2024 }]]);
C(MO({ brand: 'Jonsbo', name: 'Jonsbo D41 Mesh', year: 2022, until: 2026, tier: 2, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'rear'], usd: 90 }), [[' Black', 90], [' White', 90, WH]]);
C(MO({ brand: 'Jonsbo', name: 'Jonsbo TK-1', year: 2022, until: 2026, tier: 3, forms: FM, style: 'minitower', front: 'glass', bays: [0, 0, 1, 2], fans: [], usd: 110 }), [[' Black', 110], [' White', 110, WH]]);
C(MO({ brand: 'Jonsbo', name: 'Jonsbo C6', year: 2022, until: 2026, tier: 1, forms: FM, style: 'minitower', front: 'perforated', window: false, bays: [0, 0, 1, 2], fans: [], usd: 40 }), [[' Black', 40], [' White', 40, WH]]);
C(MO({ brand: 'Jonsbo', name: 'Jonsbo N2', year: 2022, until: 2026, tier: 3, forms: FI, style: 'sff', front: 'solid', window: false, bays: [0, 0, 5, 1], fans: ['rear'], usd: 130 }));
C(MO({ brand: 'Jonsbo', name: 'Jonsbo D31 Mesh', year: 2023, until: 2026, tier: 2, forms: FM, style: 'minitower', front: 'mesh', bays: [0, 0, 1, 2], fans: [], usd: 80 }), [[' Black', 80], [' White', 80, WH], [' Screen Black', 110, { tier: 3 }]]);
C(MO({ brand: 'Jonsbo', name: 'Jonsbo Z20', year: 2023, until: 2026, tier: 2, forms: FM, style: 'minitower', front: 'perforated', bays: [0, 0, 1, 2], fans: [], usd: 70 }), [[' Black', 70], [' White', 70, WH]]);
C(MO({ brand: 'be quiet!', name: 'be quiet! Shadow Base 800', year: 2022, until: 2026, tier: 4, front: 'glass', bays: [0, 0, 3, 4], fans: ['front1', 'front2', 'rear'], usd: 170 }), [[' Black', 170], [' DX Black', 200, { rgb: true }], [' DX White', 200, { ...WH, rgb: true }], [' FX Black', 230, { rgb: true, year: 2023, tier: 5 }]]);
C(MO({ brand: 'be quiet!', name: 'be quiet! Pure Base 500FX', year: 2023, until: 2026, tier: 3, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3', 'rear'], usd: 150 }), [[' Black', 150]]);
C(MO({ brand: 'be quiet!', name: 'be quiet! Dark Base 701', year: 2023, until: 2026, tier: 5, rgb: true, bays: [0, 0, 5, 5], fans: ['front1', 'front2', 'rear'], usd: 200 }), [[' Black', 200], [' White', 200, WH]]);
C(MO({ brand: 'be quiet!', name: 'be quiet! Light Base', year: 2024, until: 2026, tier: 5, rgb: true, front: 'glass', bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'front3', 'rear'], usd: 250 }), [[' 900 DX Black', 250], [' 900 DX White', 250, WH], [' 600 LX Black', 180, { tier: 4 }], [' 600 LX White', 180, { ...WH, tier: 4 }]]);
C(MO({ brand: 'Corsair', name: 'Corsair 2000D', year: 2022, until: 2026, tier: 4, forms: FI, style: 'sff', front: 'perforated', window: false, bays: [0, 0, 0, 3], fans: [], usd: 140 }), [[' Airflow Black', 140], [' Airflow White', 140, WH], [' RGB Airflow', 200, { rgb: true, fans: ['front1', 'front2', 'front3'] }]]);
C(MO({ brand: 'Corsair', name: 'Corsair 3000D Airflow', year: 2022, until: 2026, tier: 2, front: 'triangles', bays: [0, 0, 2, 2], fans: ['front1', 'front2'], usd: 90 }), [['', 90], [' White', 90, WH], [' RGB', 120, { rgb: true, fans: ['front1', 'front2', 'front3'] }]]);
C(MO({ brand: 'Corsair', name: 'Corsair 2500', year: 2023, until: 2026, tier: 4, forms: FM, style: 'minitower', front: 'glass', bays: [0, 0, 1, 4], fans: [], usd: 140 }), [['D Airflow Black', 140, { front: 'triangles' }], ['D Airflow White', 140, { ...WH, front: 'triangles' }], ['', 180, { name: 'Corsair iCUE LINK 2500X RGB', rgb: true, fans: ['front1', 'front2', 'rear'] }]]);
C(MO({ brand: 'Corsair', name: 'Corsair 3500X', year: 2023, until: 2026, tier: 3, front: 'glass', bays: [0, 0, 2, 4], fans: [], usd: 100 }), [['', 100], [' White', 100, WH], [' RGB', 130, { rgb: true, fans: ['front1', 'front2', 'front3'] }]]);
C(MO({ brand: 'Corsair', name: 'Corsair 6500', year: 2023, until: 2026, tier: 5, front: 'glass', bays: [0, 0, 2, 4], fans: [], usd: 200 }), [['X', 200], ['X White', 200, WH], ['D Airflow', 200, { front: 'triangles' }], ['D Airflow White', 200, { ...WH, front: 'triangles' }]]);
C(MO({ brand: 'Corsair', name: 'Corsair 9000D RGB Airflow', year: 2024, until: 2026, tier: 5, style: 'full', rgb: true, front: 'triangles', bays: [0, 0, 8, 6], fans: ['front1', 'front2', 'front3', 'rear'], usd: 500 }));
C(MO({ brand: 'Phanteks', name: 'Phanteks Eclipse G360A', year: 2021, until: 2025, tier: 2, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3'], usd: 90 }), [[' Black', 90], [' White', 90, WH]]);
C(MO({ brand: 'Phanteks', name: 'Phanteks Eclipse G500A', year: 2022, until: 2026, tier: 3, rgb: true, front: 'mesh', bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'front3', 'rear'], usd: 140 }), [[' Black', 140], [' White', 140, WH]]);
C(MO({ brand: 'Phanteks', name: 'Phanteks NV7', year: 2022, until: 2026, tier: 5, style: 'full', rgb: true, front: 'glass', bays: [0, 0, 4, 6], fans: [], usd: 200 }), [[' Black', 200], [' White', 200, WH]]);
C(MO({ brand: 'Phanteks', name: 'Phanteks NV5', year: 2023, until: 2026, tier: 4, rgb: true, front: 'glass', bays: [0, 0, 2, 4], fans: [], usd: 130 }), [[' Black', 130], [' White', 130, WH]]);
C(MO({ brand: 'Phanteks', name: 'Phanteks XT Pro', year: 2023, until: 2026, tier: 2, front: 'mesh', bays: [0, 0, 2, 3], fans: ['rear'], usd: 70 }), [[' Black', 70], [' White', 70, WH], [' Ultra Black', 100, { rgb: true, fans: ['front1', 'front2', 'front3', 'rear'] }], [' Ultra White', 100, { ...WH, rgb: true, fans: ['front1', 'front2', 'front3', 'rear'] }]]);
C(MO({ brand: 'Phanteks', name: 'Phanteks XT View', year: 2024, until: 2026, tier: 3, rgb: true, front: 'glass', bays: [0, 0, 2, 3], fans: ['front1', 'front2', 'rear'], usd: 100 }), [[' Black', 100], [' White', 100, WH]]);
C(MO({ brand: 'Cooler Master', name: 'Cooler Master HAF 700 EVO', year: 2022, until: 2026, tier: 5, style: 'full', rgb: true, front: 'mesh', bays: [0, 0, 5, 4], fans: ['front1', 'front2', 'rear', 'top1'], usd: 500 }));
C(MO({ brand: 'Cooler Master', name: 'Cooler Master Qube 500 Flatpack', year: 2022, until: 2026, tier: 2, front: 'perforated', bays: [0, 0, 2, 2], fans: ['rear'], usd: 100 }), [[' Black', 100], [' White', 100, WH], [' Macaron Edition', 110, { col: 'pink', year: 2023 }]]);
C(MO({ brand: 'Cooler Master', name: 'Cooler Master MasterFrame 700', year: 2023, until: 2026, tier: 5, front: 'glass', bays: [0, 0, 2, 4], fans: [], usd: 350 }));
C(MO({ brand: 'Cooler Master', name: 'Cooler Master MasterBox 600', year: 2023, until: 2026, tier: 2, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 90 }));
C(MO({ brand: 'Cooler Master', name: 'Cooler Master NCORE 100 MAX', year: 2023, until: 2026, tier: 5, forms: FI, style: 'sff', front: 'perforated', window: false, bays: [0, 0, 0, 2], fans: ['top1'], usd: 450 }));
C(MO({ brand: 'Thermaltake', name: 'Thermaltake Ceres 500 TG ARGB', year: 2022, until: 2026, tier: 3, rgb: true, front: 'perforated', bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'front3', 'rear'], usd: 130 }), [[' Black', 130], [' Snow', 140, WH], ['', 90, { name: 'Thermaltake Ceres 300 TG ARGB', tier: 2, fans: ['front1', 'front2', 'rear'] }]]);
C(MO({ brand: 'Thermaltake', name: 'Thermaltake The Tower 100', year: 2022, until: 2026, tier: 3, forms: FI, style: 'sff', front: 'glass', bays: [0, 0, 1, 3], fans: ['top1', 'top2'], usd: 100 }), [[' Black', 100], [' Snow', 100, WH], [' Racing Green', 110, { col: 'green', year: 2023 }]]);
C(MO({ brand: 'Thermaltake', name: 'Thermaltake The Tower 500', year: 2023, until: 2026, tier: 4, front: 'glass', bays: [0, 0, 2, 4], fans: ['top1', 'top2'], usd: 170 }), [[' Black', 170], [' Snow', 180, WH]]);
C(MO({ brand: 'Thermaltake', name: 'Thermaltake CTE C700 Air', year: 2023, until: 2026, tier: 4, front: 'perforated', bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'front3', 'rear'], usd: 170 }), [[' Black', 170], [' Snow', 180, WH], ['', 220, { name: 'Thermaltake CTE T500 Air', style: 'full', tier: 5 }]]);
C(MO({ brand: 'Antec', name: 'Antec P20C', year: 2022, until: 2026, tier: 3, front: 'mesh', bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'front3', 'rear'], usd: 100 }));
C(MO({ brand: 'Antec', name: 'Antec NX800', year: 2022, until: 2026, tier: 3, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3', 'rear'], usd: 120 }));
C(MO({ brand: 'Antec', name: 'Antec C8', year: 2023, until: 2026, tier: 4, front: 'glass', bays: [0, 0, 2, 4], fans: [], usd: 150 }), [['', 150], [' White', 150, WH], [' Wood', 170, { col: 'wood', year: 2024 }]]);
C(MO({ brand: 'Antec', name: 'Antec Performance 1 FT', year: 2023, until: 2026, tier: 5, style: 'full', front: 'mesh', bays: [0, 0, 4, 4], fans: ['front1', 'front2', 'front3', 'rear'], usd: 230 }), [['', 230], [' White', 230, WH]]);
C(MO({ brand: 'Antec', name: 'Antec Flux Pro', year: 2024, until: 2026, tier: 4, front: 'mesh', bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'rear', 'top1'], usd: 170 }), [['', 170], [' White', 170, WH]]);
C(MO({ brand: 'Montech', name: 'Montech AIR 100', year: 2022, until: 2026, tier: 1, forms: FM, style: 'minitower', front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 70 }), [[' ARGB Black', 70, { rgb: true }], [' ARGB White', 70, { ...WH, rgb: true }]]);
C(MO({ brand: 'Montech', name: 'Montech SKY TWO', year: 2023, until: 2026, tier: 3, rgb: true, front: 'glass', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3', 'rear'], usd: 110 }), [[' Black', 110], [' White', 110, WH]]);
C(MO({ brand: 'Montech', name: 'Montech KING 95', year: 2023, until: 2026, tier: 3, front: 'glass', bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'rear'], usd: 130 }), [[' Black', 130], [' White', 130, WH], [' PRO Black', 160, { rgb: true, tier: 4 }]]);
C(MO({ brand: 'ASUS', name: 'ASUS TUF Gaming GT502', year: 2023, until: 2026, tier: 4, front: 'glass', bays: [0, 0, 2, 4], fans: [], usd: 170 }), [[' Black', 170], [' White', 170, WH]]);
C(MO({ brand: 'ASUS', name: 'ASUS ROG Hyperion GR701', year: 2023, until: 2026, tier: 5, style: 'full', rgb: true, front: 'mesh', bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'front3', 'rear'], usd: 400 }));
C(MO({ brand: 'ASUS', name: 'ASUS ProArt PA602', year: 2023, until: 2026, tier: 5, front: 'mesh', bays: [0, 0, 2, 4], fans: ['front1', 'front2', 'rear'], usd: 230 }));
C(MO({ brand: 'ASUS', name: 'ASUS Prime AP201', year: 2022, until: 2026, tier: 2, forms: FM, style: 'minitower', front: 'perforated', window: false, bays: [0, 0, 2, 2], fans: ['rear'], usd: 80 }), [[' Black', 80], [' White', 80, WH]]);
C(MO({ brand: 'ASUS', name: 'ASUS A21', year: 2023, until: 2026, tier: 1, forms: FM, style: 'minitower', front: 'mesh', bays: [0, 0, 2, 2], fans: [], usd: 70 }), [[' Black', 70], [' White', 70, WH]]);
C(MO({ brand: 'MSI', name: 'MSI MAG Forge 112R', year: 2023, until: 2026, tier: 2, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3', 'rear'], usd: 80 }));
C(MO({ brand: 'MSI', name: 'MSI MPG VELOX 100R', year: 2022, until: 2026, tier: 3, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'front3', 'rear'], usd: 100 }), [['', 100], [' White', 100, WH]]);
C(MO({ brand: 'DeepCool', name: 'DeepCool CH510', year: 2022, until: 2026, tier: 2, front: 'mesh', bays: [0, 0, 2, 2], fans: ['rear'], usd: 70 }), [['', 70], [' WH', 70, WH]]);
C(MO({ brand: 'DeepCool', name: 'DeepCool CH560', year: 2023, until: 2026, tier: 3, rgb: true, front: 'mesh', bays: [0, 0, 2, 2], fans: ['front1', 'front2', 'rear'], usd: 100 }), [['', 100], [' WH', 100, WH], [' Digital', 120, { tier: 3 }]]);
C(MO({ brand: 'DeepCool', name: 'DeepCool CH780', year: 2024, until: 2026, tier: 4, rgb: true, front: 'glass', bays: [0, 0, 2, 4], fans: ['rear'], usd: 160 }), [['', 160], [' WH', 160, WH]]);

export default P;
