// Hamburgerbaren: ingredienser, tillbehör, drycker och efterrätter 1955–2026. Samma form som
// datorbutikens delar (id, cat, name, cost, year, until, tier, look) så att motorn (lager, grossist,
// montrar, beställningar) fungerar rakt av. Ingen DOM här – filen körs även i Node (tools/).

export const CATS = {
  brod:      { name: 'Bröd', icon: '🍞', color: '#d8a65a' },
  biff:      { name: 'Biff', icon: '🥩', color: '#8a3b2a' },
  ost:       { name: 'Ost', icon: '🧀', color: '#f0b429' },
  extra:     { name: 'Extra', icon: '🥓', color: '#c2553a' },
  gront:     { name: 'Grönt', icon: '🥬', color: '#4a9a3a' },
  sas:       { name: 'Sås', icon: '🥫', color: '#c92a2a' },
  tillbehor: { name: 'Tillbehör', icon: '🍟', color: '#e8a02a' },
  dryck:     { name: 'Dryck', icon: '🥤', color: '#2f6fb7' },
  dessert:   { name: 'Efterrätt', icon: '🍦', color: '#d85a9a' },
};
// ordningen i lagerlistor – och stapelordningen i burgaren (underifrån): bröd, biff, ost, extra, grönt, sås, bröd
export const CAT_ORDER = ['brod', 'biff', 'ost', 'extra', 'gront', 'sas', 'tillbehor', 'dryck', 'dessert'];
export const BURGER_CATS = ['brod', 'biff', 'ost', 'extra', 'gront', 'sas'];
export const PRODUCT_CATS = ['dryck', 'dessert'];
export const FIRST_YEAR = 1955, LAST_YEAR = 2026;

export const ERAS = [
  { from: 1955, title: 'Femtiotalsdinern', emoji: '🎸' },
  { from: 1965, title: 'Bacon och milkshake', emoji: '🥤' },
  { from: 1975, title: 'Grillkiosken', emoji: '🌭' },
  { from: 1985, title: 'Kycklingburgarens intåg', emoji: '🍗' },
  { from: 1996, title: 'Snabbmatskedjan', emoji: '🍟' },
  { from: 2005, title: 'Vego och aioli', emoji: '🥑' },
  { from: 2016, title: 'Gourmetburgaren', emoji: '👨‍🍳' },
  { from: 2022, title: 'Smash och plantbaserat', emoji: '🌱' },
];
export const eraOf = (y) => [...ERAS].reverse().find((e) => y >= e.from) || ERAS[0];

const P = [];
// cost = inköp per styck (kr, ungefär 1990 års pengar – motorn skalar priserna efter år)
const add = (cat, id, name, cost, year, tier, look, opts = {}) => P.push({ cat, id, name, cost, year, until: opts.until ?? LAST_YEAR, tier, brand: opts.brand || '', desc: opts.desc || '', look, ...(opts.spec || {}) });

// ---------- Bröd (shape 'bun') ----------
add('brod', 'brod-klassiskt', 'Klassiskt hamburgerbröd', 2, 1955, 1, { shape: 'bun', color: '#d9a55d', crust: '#b8823f' }, { desc: 'Mjukt vitt bröd – som på dinern.' });
add('brod', 'brod-sesam', 'Sesambröd', 2.5, 1968, 1, { shape: 'bun', color: '#d9a55d', crust: '#b8823f', sesame: true }, { desc: 'Med sesamfrön på toppen. Klassikern sedan sjuttiotalet.' });
add('brod', 'brod-rag', 'Rågbröd', 3, 1985, 2, { shape: 'bun', color: '#9a6a3a', crust: '#6a4520' }, { desc: 'Mörkt och mustigt.' });
add('brod', 'brod-fullkorn', 'Fullkornsbröd', 3, 1990, 2, { shape: 'bun', color: '#b8834a', crust: '#8a5a2a', seeds: true }, { desc: 'Grövre och nyttigare.' });
add('brod', 'brod-pita', 'Pitabröd', 2.5, 1990, 2, { shape: 'bun', color: '#e6d2a0', crust: '#c9ad70', flat: true }, { desc: 'Platt bröd – kebabburgarens val.' });
add('brod', 'brod-ciabatta', 'Ciabatta', 4, 2000, 3, { shape: 'bun', color: '#e2cf9a', crust: '#b89a60', flour: true }, { desc: 'Italienskt bröd med stora luftbubblor.' });
add('brod', 'brod-bagel', 'Bagel', 4, 2005, 3, { shape: 'bun', color: '#cf9a4a', crust: '#a86f2a', hole: true }, { desc: 'Kokt och sedan gräddad – seg och blank.' });
add('brod', 'brod-slider', 'Sliderbröd (mini)', 1.5, 2008, 2, { shape: 'bun', color: '#d9a55d', crust: '#b8823f', mini: true }, { desc: 'Litet bröd till miniburgare.' });
add('brod', 'brod-glutenfritt', 'Glutenfritt bröd', 5, 2010, 3, { shape: 'bun', color: '#e6cf9a', crust: '#c9a86a' }, { desc: 'För den som inte tål gluten.' });
add('brod', 'brod-brioche', 'Briochebröd', 5, 2012, 3, { shape: 'bun', color: '#e8b35a', crust: '#c98a2e', gloss: true }, { desc: 'Smörigt och blankt – gourmetburgarens bröd.' });
add('brod', 'brod-pretzel', 'Pretzelbröd', 6, 2013, 4, { shape: 'bun', color: '#a65a2a', crust: '#7a3e1a', salt: true }, { desc: 'Mörkt, salt och segt.' });
add('brod', 'brod-surdeg', 'Surdegsbröd', 6, 2014, 4, { shape: 'bun', color: '#d8b880', crust: '#9a6a30', flour: true }, { desc: 'Syrligt och segt med hård skorpa.' });
add('brod', 'brod-potatis', 'Potatisbröd', 4, 2015, 3, { shape: 'bun', color: '#f0d27a', crust: '#d9b24a' }, { desc: 'Extra mjukt – smashburgarens bröd.' });
add('brod', 'brod-sallad', 'Salladsblad i stället för bröd', 3, 2015, 3, { shape: 'bun', color: '#8fd05a', crust: '#5a9a2a', lettuce: true }, { desc: 'Low carb: burgaren i ett salladsblad.' });
add('brod', 'brod-svart', 'Svart kolbröd', 7, 2016, 5, { shape: 'bun', color: '#2a2224', crust: '#161214', sesame: true }, { desc: 'Färgat med aktivt kol – ser ut som natten.' });

// ---------- Biffar (shape 'patty') ----------
const biff = (id, name, cost, year, tier, look, desc) => add('biff', id, name, cost, year, tier, { shape: 'patty', h: 0.7, kind: 'not', ...look }, { desc });
biff('biff-90', 'Nötfärsbiff 90 g', 6, 1955, 1, { color: '#7a3a26', dark: '#4a2016' }, 'Den klassiska biffen. Stek 2–3 minuter per sida.');
biff('biff-120', 'Nötfärsbiff 120 g', 7.5, 1962, 1, { color: '#7a3a26', dark: '#4a2016', h: 0.85 }, 'Lite mer att bita i.');
biff('biff-150', 'Stor biff 150 g', 9, 1970, 2, { color: '#7a3a26', dark: '#4a2016', h: 0.95 }, 'Tjockare och saftigare – "quarter pounder".');
biff('biff-180', 'Jättebiff 180 g', 11, 1978, 3, { color: '#7a3a26', dark: '#4a2016', h: 1.1 }, 'För den riktigt hungrige.');
biff('biff-fisk', 'Panerad fiskfilé', 7, 1965, 2, { color: '#e0a84a', dark: '#b8802a', h: 0.8, kind: 'fisk', square: true }, 'Panerad torsk – fredagsburgaren.');
biff('biff-korv', 'Grillad korv (delad)', 5, 1975, 1, { color: '#c8613a', dark: '#8a3a1a', h: 0.6, kind: 'flask', split: true }, 'Grillkioskens burgare: en delad korv i bröd.');
biff('biff-flask', 'Fläskfärsbiff', 6, 1975, 2, { color: '#a86a4a', dark: '#7a4a2a', h: 0.75, kind: 'flask' }, 'Mildare än nöt, saftig.');
biff('biff-kyckling', 'Panerad kycklingfilé', 8, 1985, 2, { color: '#e6b45a', dark: '#c48a30', h: 0.8, kind: 'kyckling', crumbs: true }, 'Panerad kycklingfilé. Kom till Sverige på åttiotalet.');
biff('biff-soja', 'Sojabiff', 6, 1990, 2, { color: '#8a6a3a', dark: '#5a4222', h: 0.65, kind: 'vego', flecks: true }, 'Den första vegobiffen – lite torr, mycket kärlek.');
biff('biff-vego', 'Vegobiff (bönor)', 8, 1995, 2, { color: '#8a7a3a', dark: '#5a4e22', h: 0.7, kind: 'vego', flecks: true }, 'Bönor, morötter och kryddor.');
biff('biff-kyckling-grill', 'Grillad kycklingfilé', 9, 1995, 3, { color: '#f0d2a0', dark: '#b08a50', h: 0.7, kind: 'kyckling', grillmarks: true }, 'Grillad, inte panerad – lättare.');
biff('biff-lamm', 'Lammfärsbiff', 12, 1998, 3, { color: '#8a4a3a', dark: '#5a2a1e', h: 0.85, kind: 'lamm' }, 'Kryddig lammfärs med mynta.');
biff('biff-kalkon', 'Kalkonbiff', 8, 2000, 2, { color: '#d8b898', dark: '#a8886a', h: 0.7, kind: 'kyckling' }, 'Magert och milt.');
biff('biff-falafel', 'Falafel (mosad)', 6, 2000, 2, { color: '#a8823a', dark: '#6a4e1a', h: 0.7, kind: 'vego', flecks: true }, 'Kikärtor, örter och spiskummin.');
biff('biff-angus', 'Angusbiff 150 g', 14, 2005, 3, { color: '#7a3020', dark: '#4a1a10', h: 0.95, kind: 'not', marbled: true }, 'Skotsk ras, mer marmorerat kött.');
biff('biff-raka', 'Räkburgare', 12, 2006, 3, { color: '#f0a888', dark: '#d07858', h: 0.7, kind: 'fisk', crumbs: true }, 'Hackade räkor i panering.');
biff('biff-kyckling-spicy', 'Spicy kyckling', 9, 2008, 3, { color: '#d8823a', dark: '#a85a1a', h: 0.8, kind: 'kyckling', crumbs: true, spicy: true }, 'Panerad med chili – het!');
biff('biff-portobello', 'Portobellosvamp', 7, 2009, 3, { color: '#6a4a3a', dark: '#3a2418', h: 0.7, kind: 'vego', round: true }, 'En hel grillad jättechampinjon.');
biff('biff-halloumi', 'Grillad halloumi', 10, 2010, 3, { color: '#f0e2b0', dark: '#c9a860', h: 0.6, kind: 'vego', square: true, grillmarks: true }, 'Salt grillost som håller formen.');
biff('biff-lax', 'Laxburgare', 14, 2010, 4, { color: '#e88a6a', dark: '#c05a3a', h: 0.8, kind: 'fisk' }, 'Hackad lax med dill.');
biff('biff-pulledpork', 'Pulled pork', 10, 2012, 3, { color: '#a85a3a', dark: '#6a3018', h: 0.9, kind: 'flask', shredded: true }, 'Långkokt fläsk som faller isär.');
biff('biff-tofu', 'Rökt tofu', 8, 2012, 3, { color: '#c8a870', dark: '#8a6a40', h: 0.65, kind: 'vego', square: true }, 'Fast och rökig.');
biff('biff-chuck', 'Chuck & brisket-biff', 16, 2014, 4, { color: '#7a3226', dark: '#4a1a12', h: 1.0, kind: 'not', marbled: true }, 'Egen malning av högrev och bringa.');
biff('biff-smash', 'Smashbiff 70 g', 7, 2016, 3, { color: '#6e3220', dark: '#3e1a10', h: 0.45, kind: 'not', crispy: true }, 'Tunn biff som pressas platt på grillen – knaprig kant!');
biff('biff-wagyu', 'Wagyubiff 180 g', 28, 2018, 5, { color: '#8a3e2a', dark: '#5a2216', h: 1.0, kind: 'not', marbled: true }, 'Marmorerat lyxkött från Japan.');
biff('biff-plant', 'Plantbaserad biff', 12, 2019, 4, { color: '#7a3e2e', dark: '#4e2418', h: 0.75, kind: 'vego' }, 'Smakar och blöder nästan som kött – gjord på ärtprotein.');
biff('biff-kyckling-plant', 'Plantbaserad kyckling', 11, 2021, 4, { color: '#e6c48a', dark: '#b8944a', h: 0.75, kind: 'vego', crumbs: true }, 'Vegansk "kyckling" med panering.');
biff('biff-dryaged', 'Dry aged-biff 200 g', 32, 2022, 5, { color: '#6a2a20', dark: '#3a140e', h: 1.1, kind: 'not', marbled: true }, 'Hängmörat i 40 dagar.');

// ---------- Ost (shape 'cheese') ----------
const ost = (id, name, cost, year, tier, look, desc) => add('ost', id, name, cost, year, tier, { shape: 'cheese', melt: true, ...look }, { desc });
ost('ost-amerikansk', 'Amerikansk ost', 2, 1955, 1, { color: '#f5b52a' }, 'Smältost i skivor – smälter perfekt på den varma biffen.');
ost('ost-cheddar', 'Cheddar', 3, 1960, 2, { color: '#e8962a' }, 'Skarpare smak, orange färg.');
ost('ost-schweizer', 'Schweizerost', 3, 1965, 2, { color: '#f4e4a8', holes: true }, 'Med hål – nötig smak.');
ost('ost-gouda', 'Gouda', 3, 1980, 2, { color: '#f0c860' }, 'Mild och rund.');
ost('ost-mozzarella', 'Mozzarella', 4, 1995, 2, { color: '#f8f4e8', stretchy: true }, 'Drar trådar när den smälter.');
ost('ost-pepperjack', 'Pepper jack', 4, 1998, 3, { color: '#f4ecd0', spots: '#c93a2a' }, 'Med bitar av chili.');
ost('ost-bla', 'Blåmögelost', 5, 2005, 3, { color: '#e8e2c8', spots: '#5a7a9a', melt: false }, 'Kraftig ost för den vuxna burgaren.');
ost('ost-brie', 'Brie', 5, 2008, 3, { color: '#f6f0e0', rind: '#e0d8c0' }, 'Krämig med vit skorpa.');
ost('ost-getost', 'Chèvre', 6, 2008, 4, { color: '#f4f0e6', melt: false, round: true }, 'Krämig getost.');
ost('ost-rokt', 'Rökt ost', 4, 2010, 3, { color: '#d8a050' }, 'Rökt över bokträ.');
ost('ost-vegansk', 'Vegansk ost', 5, 2018, 3, { color: '#f3d27a' }, 'Gjord på kokos och stärkelse.');
ost('ost-raclette', 'Raclette', 7, 2019, 4, { color: '#f0c878', drip: true }, 'Smälts med brännare och skrapas över biffen.');

// ---------- Extra (toppings) ----------
add('extra', 'bacon', 'Bacon', 4, 1963, 2, { shape: 'strips', color: '#b8443a', fat: '#f0c8a8' }, { desc: 'Knaperstekt. Bacon på burgaren blev stort på sextiotalet.' });
add('extra', 'stekt-agg', 'Stekt ägg', 3, 1970, 2, { shape: 'egg', white: '#fbf6ea', yolk: '#f2b01e' }, { desc: 'Med rinnig gula.' });
add('extra', 'champinjoner', 'Stekta champinjoner', 3, 1975, 2, { shape: 'chunky', color: '#8a6a4a', light: '#c8a880' }, { desc: 'Smörstekta skivor.' });
add('extra', 'skinka', 'Skinka', 3, 1980, 2, { shape: 'slice', color: '#e89aa0', inner: '#f4c0c4', n: 1, big: true }, { desc: 'En skiva kokt skinka – "cordon bleu-burgaren".' });
add('extra', 'ananas', 'Grillad ananas', 3, 1985, 2, { shape: 'rings', color: '#f2c84a', h: 0.35, hole: true }, { desc: 'Hawaiiburgarens ring.' });
add('extra', 'krispig-lok', 'Krispig lök', 2, 1990, 2, { shape: 'chunky', color: '#d8a04a', light: '#f0c878', crisp: true }, { desc: 'Friterad strimlad lök.' });
add('extra', 'lokringar-topping', 'Friterade lökringar', 4, 1990, 3, { shape: 'rings', color: '#e0a84a', h: 0.5, hole: true }, { desc: 'Knapriga ringar ovanpå biffen.' });
add('extra', 'chili', 'Chili con carne', 4, 1995, 3, { shape: 'chunky', color: '#8a3a22', light: '#c85a30' }, { desc: 'Kryddig köttfärsgryta ovanpå – "chili cheese".' });
add('extra', 'jalapeno', 'Jalapeño', 3, 1998, 2, { shape: 'pickles', color: '#3a8a3a', ring: true }, { desc: 'Het! Skivad chili i lag.' });
add('extra', 'grillad-paprika', 'Grillad paprika', 3, 2000, 2, { shape: 'strips', color: '#d84a2a', fat: '#f08a5a' }, { desc: 'Söt och rökig.' });
add('extra', 'guacamole', 'Guacamole', 5, 2005, 3, { shape: 'chunky', color: '#8ab84a', light: '#b8d878' }, { desc: 'Mosad avokado med lime.' });
add('extra', 'avokado', 'Avokado', 6, 2012, 3, { shape: 'avocado', color: '#8ab84a', dark: '#5a8a2a' }, { desc: 'Skivad avokado – Kaliforniens gåva till burgaren.' });
add('extra', 'pulledpork-topping', 'Pulled pork-topping', 5, 2012, 3, { shape: 'chunky', color: '#a85a3a', light: '#d08a5a' }, { desc: 'En extra hög med fläsk.' });
add('extra', 'picklad-rodlok', 'Picklad rödlök', 2, 2016, 3, { shape: 'onion', color: '#e05a8a', ring: '#a82a5a' }, { desc: 'Rosa och syrlig.' });
add('extra', 'mac-cheese', 'Mac & cheese', 5, 2016, 4, { shape: 'chunky', color: '#f0b040', light: '#f8d888' }, { desc: 'Makaroner i ostsås ovanpå biffen. Ja, verkligen.' });
add('extra', 'kimchi', 'Kimchi', 4, 2018, 3, { shape: 'leaf', color: '#d84a3a', edge: '#a82a22', wild: true }, { desc: 'Koreansk fermenterad kål.' });
add('extra', 'tryffelost-krisp', 'Parmesankrisp', 6, 2019, 4, { shape: 'chunky', color: '#e8d8a0', light: '#f8f0d0', crisp: true }, { desc: 'Ugnsbakad parmesan – knaprig som chips.' });

// ---------- Grönt ----------
add('gront', 'sallad', 'Isbergssallad', 1.5, 1955, 1, { shape: 'leaf', color: '#7fc44a', edge: '#4f9a2a' }, { desc: 'Knaprigt och svalt.' });
add('gront', 'tomat', 'Tomatskivor', 2, 1955, 1, { shape: 'slice', color: '#e0392e', inner: '#f0806a', n: 2 }, { desc: 'Två skivor.' });
add('gront', 'lok', 'Lök', 1, 1955, 1, { shape: 'onion', color: '#f3ead0', ring: '#d8c8a0' }, { desc: 'Hackad eller i ringar.' });
add('gront', 'saltgurka', 'Saltgurka', 1.5, 1955, 1, { shape: 'pickles', color: '#5a8a2a' }, { desc: 'Syrliga skivor – tre stycken.' });
add('gront', 'gurka', 'Färsk gurka', 1.5, 1955, 1, { shape: 'pickles', color: '#9ad06a', fresh: true }, { desc: 'Svalt och krispigt.' });
add('gront', 'coleslaw', 'Coleslaw', 3, 1975, 2, { shape: 'leaf', color: '#e6efc8', edge: '#b8c890' }, { desc: 'Vitkål och morot i dressing.' });
add('gront', 'paprika', 'Paprika', 2, 1990, 2, { shape: 'strips', color: '#e8a02a', fat: '#f0c860' }, { desc: 'Strimlad gul paprika.' });
add('gront', 'rodlok', 'Rödlök', 1.5, 1995, 2, { shape: 'onion', color: '#b05a9a', ring: '#7a3a6a' }, { desc: 'Mildare och sötare.' });
add('gront', 'romansallad', 'Romansallad', 2, 2000, 2, { shape: 'leaf', color: '#5aa84a', edge: '#2f7a2a' }, { desc: 'Krispigare än isberg.' });
add('gront', 'ruccola', 'Ruccola', 3, 2008, 3, { shape: 'leaf', color: '#4a8a3a', edge: '#2f6a22', wild: true }, { desc: 'Pepprig sallad.' });
add('gront', 'spenat', 'Babyspenat', 3, 2008, 3, { shape: 'leaf', color: '#3a7a3a', edge: '#245a22' }, { desc: 'Små mjuka blad.' });
add('gront', 'karamelliserad-lok', 'Karamelliserad lök', 4, 2010, 3, { shape: 'onion', color: '#b8783a', ring: '#8a5020', soft: true }, { desc: 'Långsamt stekt tills den är söt och mjuk.' });
add('gront', 'soltorkad-tomat', 'Soltorkad tomat', 4, 2005, 3, { shape: 'slice', color: '#a83a22', inner: '#c85a3a', n: 3, small: true }, { desc: 'Intensiv tomatsmak.' });

// ---------- Såser ----------
const sas = (id, name, cost, year, tier, color, desc, extra = {}) => add('sas', id, name, cost, year, tier, { shape: 'sauce', color, ...extra }, { desc });
sas('ketchup', 'Ketchup', 1, 1955, 1, '#c92a2a', 'Tomat, socker och vinäger.');
sas('senap', 'Senap', 1, 1955, 1, '#e8b820', 'Gul och skarp.');
sas('majonnas', 'Majonnäs', 1, 1955, 1, '#f4ecc8', 'Ägg, olja och en skvätt vinäger.');
sas('remoulad', 'Remouladsås', 1.5, 1960, 1, '#e8e0a0', 'Majonnäs med pickles och curry – dansk favorit.');
sas('dressing', 'Hamburgerdressing', 1.5, 1965, 1, '#f0c48a', 'Majonnäs, ketchup och pickles – den hemliga såsen.');
sas('bbq', 'BBQ-sås', 2, 1985, 2, '#6a2a1a', 'Rökig och söt.');
sas('curry', 'Currysås', 2, 1985, 2, '#d8a82a', 'Gul och mild.');
sas('bearnaise', 'Bearnaisesås', 3, 1990, 2, '#f0e0a0', 'Smör, äggula och dragon.');
sas('tzatziki', 'Tzatziki', 2, 1995, 2, '#f0f4e8', 'Yoghurt, gurka och vitlök.');
sas('honungssenap', 'Honungssenap', 2, 1995, 2, '#e8c040', 'Söt och skarp.');
sas('ranch', 'Ranchdressing', 2, 1998, 2, '#f4f0e0', 'Kärnmjölk och örter.');
sas('hotsauce', 'Hot sauce', 2, 2000, 2, '#d82a1a', 'Fermenterad chili – stark!', { drops: true });
sas('aioli', 'Aioli', 2.5, 2002, 2, '#f2e8b8', 'Vitlöksmajonnäs.');
sas('pesto', 'Pesto', 3, 2005, 3, '#5a8a2a', 'Basilika, pinjenötter och parmesan.');
sas('chipotle', 'Chipotlemajo', 3, 2010, 3, '#d8703a', 'Rökig chili i majonnäs.');
sas('sriracha', 'Srirachamajo', 3, 2012, 3, '#e86a3a', 'Thailändsk chilisås i majo.');
sas('teriyaki', 'Teriyakisås', 3, 2012, 3, '#4a2a18', 'Söt soja från Japan.');
sas('chimichurri', 'Chimichurri', 4, 2016, 4, '#4a8a3a', 'Persilja, vitlök och vinäger – från Argentina.');
sas('tryffelmajo', 'Tryffelmajonnäs', 6, 2018, 4, '#e8dcb8', 'Lyxig – med riktig tryffel.', { spots: '#3a2a1a' });
sas('gochujang', 'Gochujangmajo', 4, 2020, 4, '#c8402a', 'Koreansk chilipasta i majo.');

// ---------- Tillbehör (i korgen på brickan) ----------
add('tillbehor', 'pommes', 'Pommes frites', 3, 1955, 1, { shape: 'fries', color: '#f0c050' }, { desc: 'Friterade i två omgångar för att bli knapriga.' });
add('tillbehor', 'coleslaw-skal', 'Coleslaw (skål)', 3, 1975, 1, { shape: 'salad', color: '#e6efc8' }, { desc: 'Vitkålssallad vid sidan.' });
add('tillbehor', 'nuggets', 'Kycklingnuggets', 5, 1985, 2, { shape: 'nuggets', color: '#e0a84a' }, { desc: 'Sex bitar panerad kyckling.' });
add('tillbehor', 'lokringar', 'Lökringar', 4, 1990, 2, { shape: 'ringbasket', color: '#e0a84a' }, { desc: 'Panerade och friterade.' });
add('tillbehor', 'majskolv', 'Grillad majskolv', 3, 1990, 2, { shape: 'corn', color: '#f2c84a' }, { desc: 'Med smör och salt.' });
add('tillbehor', 'curlyfries', 'Curly fries', 4, 1992, 2, { shape: 'fries', color: '#e8b040', curly: true }, { desc: 'Spiralpommes med krydda.' });
add('tillbehor', 'klyftpotatis', 'Klyftpotatis', 3.5, 1995, 2, { shape: 'fries', color: '#d9a84a', wedges: true }, { desc: 'Med skalet kvar.' });
add('tillbehor', 'sallad-skal', 'Sallad', 4, 1998, 2, { shape: 'salad', color: '#7fc44a' }, { desc: 'För den som vill ha något grönt vid sidan.' });
add('tillbehor', 'mozzarellasticks', 'Mozzarellasticks', 5, 2000, 3, { shape: 'nuggets', color: '#e8c060', sticks: true }, { desc: 'Panerad ost som drar trådar.' });
add('tillbehor', 'chilicheese-tops', 'Chili cheese tops', 5, 2005, 3, { shape: 'nuggets', color: '#d8a040', small: true }, { desc: 'Små friterade ostbollar med chili.' });
add('tillbehor', 'sotpotatis', 'Sötpotatispommes', 5, 2012, 3, { shape: 'fries', color: '#e07a3a' }, { desc: 'Orange och söta.' });
add('tillbehor', 'tryffelpommes', 'Tryffelpommes', 8, 2018, 4, { shape: 'fries', color: '#f0c050', truffle: true }, { desc: 'Med tryffelolja och parmesan.' });

// ---------- Drycker (säljs även över disk; hype = [lansering, topp, utfasning]) ----------
const dryck = (id, name, cost, hype, tier, look, desc) => P.push({ cat: 'dryck', id, name, cost, year: hype[0], until: Math.min(LAST_YEAR, hype[2]), hype, tier, brand: '', desc, look: { shape: 'cup', ...look } });
dryck('cola', 'Cola', 2, [1955, 1990, 2026], 1, { color: '#3a1a12', cup: '#c92a2a' }, 'Den klassiska brunburken.');
dryck('sockerdricka', 'Sockerdricka', 2, [1955, 1965, 1992], 1, { color: '#e8f0e0', cup: '#4a9a3a', bottle: true }, 'Svensk klassiker i glasflaska.');
dryck('milkshake-vanilj', 'Vaniljmilkshake', 4, [1955, 1962, 2026], 2, { color: '#f4ecd0', cup: '#f4f1ea', shake: true }, 'Tjock nog för sugrör.');
dryck('milkshake-jordgubb', 'Jordgubbsmilkshake', 4, [1955, 1962, 2026], 2, { color: '#f2c8d8', cup: '#f4f1ea', shake: true }, 'Rosa och söt.');
dryck('milkshake-choklad', 'Chokladmilkshake', 4, [1958, 1965, 2026], 2, { color: '#8a5a3a', cup: '#f4f1ea', shake: true }, 'Mörk och mustig.');
dryck('kaffe', 'Kaffe', 2, [1955, 1975, 2026], 1, { color: '#3a2214', cup: '#f4f1ea', hot: true }, 'Svart bryggkaffe.');
dryck('varmchoklad', 'Varm choklad', 2.5, [1955, 1970, 2026], 1, { color: '#6a3a22', cup: '#f4f1ea', hot: true }, 'Med grädde på.');
dryck('lattol', 'Lättöl', 2.5, [1955, 1980, 2026], 1, { color: '#e8b830', cup: '#f4e0a0', bottle: true }, 'Klass I – till burgaren.');
dryck('apelsinlask', 'Apelsinläsk', 2, [1960, 1985, 2026], 1, { color: '#f0902a', cup: '#f0902a' }, 'Orange och bubblig.');
dryck('lemonad', 'Lemonad', 2, [1960, 1975, 2026], 1, { color: '#f4f0a0', cup: '#f4f1ea', bottle: true }, 'Citron och socker.');
dryck('fruktdryck', 'Fruktdryck', 2, [1970, 1985, 2010], 1, { color: '#e85a3a', cup: '#f4f1ea', box: true }, 'I tetra med sugrör.');
dryck('rootbeer', 'Root beer', 3, [1975, 1985, 2026], 2, { color: '#4a2a18', cup: '#8a5a3a' }, 'Amerikansk läsk med smak av rotbark.');
dryck('mineralvatten', 'Mineralvatten', 2, [1990, 2005, 2026], 1, { color: '#dce8f0', cup: '#7ab0d8', bottle: true }, 'Bubbelvatten på flaska.');
dryck('iste', 'Iste', 3, [2000, 2010, 2026], 2, { color: '#c8823a', cup: '#f4f1ea', ice: true }, 'Sött te på is.');
dryck('energidryck', 'Energidryck', 4, [2005, 2015, 2026], 2, { color: '#d8e83a', cup: '#1a1a1e', can: true }, 'Koffein och taurin.');
dryck('cola-zero', 'Cola utan socker', 2, [2006, 2015, 2026], 1, { color: '#3a1a12', cup: '#1a1a1e', can: true }, 'Samma smak, noll socker.');
dryck('smoothie', 'Smoothie', 5, [2012, 2018, 2026], 3, { color: '#c84a8a', cup: '#f4f1ea' }, 'Mixad frukt och bär.');
dryck('craftsoda', 'Hantverksläsk', 5, [2018, 2022, 2026], 3, { color: '#e07a3a', cup: '#3a2a2a', bottle: true }, 'Rabarber & ingefära från ett litet bryggeri.');
dryck('kombucha', 'Kombucha', 5, [2019, 2023, 2026], 3, { color: '#c8a040', cup: '#f4f1ea', bottle: true }, 'Fermenterat te med bubblor.');

// ---------- Efterrätter (säljs över disk) ----------
const dessert = (id, name, cost, hype, tier, look, desc) => P.push({ cat: 'dessert', id, name, cost, year: hype[0], until: Math.min(LAST_YEAR, hype[2]), hype, tier, brand: '', desc, look: { shape: 'dessert', ...look } });
dessert('applepaj', 'Äppelpaj', 4, [1955, 1970, 2026], 1, { color: '#d8a050', top: '#f0d090' }, 'Varm, med vaniljsås.');
dessert('mjukglass', 'Mjukglass', 3, [1960, 1980, 2026], 1, { color: '#f8f4e8', cone: '#d8a050' }, 'Snurrad i strut.');
dessert('sundae', 'Sundae med chokladsås', 4, [1965, 1985, 2026], 2, { color: '#f8f4e8', top: '#6a3a22' }, 'Glass i bägare med sås och strössel.');
dessert('donut', 'Donut', 3, [1990, 2005, 2026], 2, { color: '#e8a860', top: '#e05a8a' }, 'Med rosa glasyr.');
dessert('brownie', 'Brownie', 4, [2000, 2012, 2026], 2, { color: '#4a2a18', top: '#6a3a22' }, 'Kladdig chokladkaka.');
dessert('cheesecake', 'Cheesecake', 5, [2005, 2015, 2026], 3, { color: '#f4ecd0', top: '#c8402a' }, 'New York-stil med bärsås.');
dessert('churros', 'Churros', 4, [2015, 2020, 2026], 3, { color: '#d8a050', top: '#8a5a3a' }, 'Friterade och doppade i choklad.');
dessert('cookie', 'Chocolate chip cookie', 3, [1985, 2000, 2026], 1, { color: '#c89050', top: '#4a2a18' }, 'Stor och seg.');

export const PARTS = P;
export const PART = Object.fromEntries(P.map((p) => [p.id, p]));
export const DB = { parts: P, part: PART };
export const onSale = (year) => P.filter((p) => year >= p.year && year <= p.until);

// höjd i lager (byggenheter) – används av byggreglerna och grafiken
export function layerHeight(p) {
  const L = p.look || {};
  switch (L.shape) {
    case 'bun': return L.flat ? 0.5 : L.lettuce ? 0.5 : L.mini ? 0.7 : 1.0;
    case 'patty': return L.h || 0.7;
    case 'cheese': return 0.15;
    case 'strips': return 0.3;
    case 'egg': return 0.45;
    case 'rings': return L.h || 0.5;
    case 'avocado': return 0.35;
    case 'leaf': return 0.45;
    case 'slice': return L.small ? 0.2 : 0.3;
    case 'onion': return L.soft ? 0.25 : 0.3;
    case 'pickles': return 0.22;
    case 'sauce': return 0.14;
    case 'chunky': return 0.45;
  }
  return 0.3;
}
export const bunTopHeight = (p) => (p?.look?.flat || p?.look?.lettuce ? 0.6 : p?.look?.mini ? 1.2 : 1.7);
export const burgerRadius = (p) => (p?.look?.mini ? 2.2 : 3.0);

// Beskrivning i listor
export function specLine(p) {
  const L = p.look || {};
  const from = `${p.year}–`;
  switch (p.cat) {
    case 'brod': return `${L.sesame ? 'sesam · ' : ''}${L.gloss ? 'blankt · ' : ''}${L.mini ? 'mini · ' : ''}${from}`;
    case 'biff': return `${{ not: 'nötkött', fisk: 'fisk & skaldjur', kyckling: 'fågel', vego: 'vegetariskt', lamm: 'lamm', flask: 'fläsk' }[L.kind] || ''} · ${from}`;
    case 'ost': return `${L.melt ? 'smälter' : 'smälter inte'} · ${from}`;
    case 'dryck': return `${L.bottle ? 'flaska' : L.can ? 'burk' : L.shake ? 'stor mugg' : L.hot ? 'kopp' : L.box ? 'tetra' : 'mugg'} · het ${p.hype[0]}–${p.hype[2]}`;
    case 'dessert': return `efterrätt · het ${p.hype[0]}–${p.hype[2]}`;
    default: return `${CATS[p.cat]?.name || p.cat} · ${from}`;
  }
}
export const MARKUP = 2.6;   // restaurangpåslag
export const retail = (p) => Math.max(5, Math.round(p.cost * MARKUP));
export const sizeText = (n) => String(n);
export const LEVELS = [
  { xp: 0, title: 'Korvkiosk' },
  { xp: 45, title: 'Kvartersbar' },
  { xp: 130, title: 'Hamburgerbar' },
  { xp: 260, title: 'Restaurang' },
  { xp: 440, title: 'Burgarpalats' },
];
