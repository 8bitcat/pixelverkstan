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
// novelty/square/flat/mini/lettuce/hole = används bara när menyn ber om det
const brod = (id, name, cost, year, tier, look, desc) => add('brod', id, name, cost, year, tier, { shape: 'bun', ...look }, { desc });
brod('brod-klassiskt', 'Klassiskt hamburgerbröd', 2, 1955, 1, { color: '#d9a55d', crust: '#b8823f' }, 'Mjukt vitt bröd – som på dinern.');
brod('brod-fralla', 'Fralla', 2, 1955, 1, { color: '#e0b878', crust: '#b88a48', flour: true }, 'Svensk frukostfralla med lite hårdare skorpa.');
brod('brod-formbrod', 'Rostat formbröd', 1.5, 1955, 1, { color: '#e6c98a', crust: '#a8763a', square: true }, 'Två rostade skivor – patty melt-brödet.');
brod('brod-sesam', 'Sesambröd', 2.5, 1968, 1, { color: '#d9a55d', crust: '#b8823f', sesame: true }, 'Med sesamfrön på toppen. Klassikern sedan sjuttiotalet.');
brod('brod-vallmo', 'Vallmofröbröd', 2.5, 1972, 2, { color: '#dcae66', crust: '#b8823f', poppy: true }, 'Små svarta vallmofrön på toppen.');
brod('brod-grovt', 'Grovt bröd', 2.5, 1975, 2, { color: '#a87848', crust: '#7a5028', seeds: true }, 'Grovt och mättande – hälsokosten kom på sjuttiotalet.');
brod('brod-tunnbrod', 'Tunnbröd', 2, 1978, 1, { color: '#e8d8b0', crust: '#c8b080', flat: true }, 'Mjukt norrländskt tunnbröd – rullens bröd.');
brod('brod-kaiser', 'Kaiserbröd', 3, 1980, 2, { color: '#dcb070', crust: '#a87838', star: true }, 'Österrikiskt bröd med stjärnmönster på toppen.');
brod('brod-rag', 'Rågbröd', 3, 1985, 2, { color: '#9a6a3a', crust: '#6a4520' }, 'Mörkt och mustigt.');
brod('brod-fullkorn', 'Fullkornsbröd', 3, 1990, 2, { color: '#b8834a', crust: '#8a5a2a', seeds: true }, 'Grövre och nyttigare.');
brod('brod-pita', 'Pitabröd', 2.5, 1990, 2, { color: '#e6d2a0', crust: '#c9ad70', flat: true }, 'Platt bröd – kebabburgarens val.');
brod('brod-baguette', 'Baguettebit', 3, 1995, 2, { color: '#e8d4a0', crust: '#c09858', flour: true, square: true }, 'En bit fransk baguette – knaprig skorpa.');
brod('brod-ciabatta', 'Ciabatta', 4, 2000, 3, { color: '#e2cf9a', crust: '#b89a60', flour: true }, 'Italienskt bröd med stora luftbubblor.');
brod('brod-vitlok', 'Vitlöksbröd', 4, 2000, 3, { color: '#e6c98a', crust: '#b88a48', herbs: true }, 'Rostat med vitlökssmör och persilja.');
brod('brod-focaccia', 'Focaccia', 4, 2003, 3, { color: '#e2cf9a', crust: '#c0a060', dimples: true, square: true }, 'Italienskt plattbröd med olivolja och rosmarin.');
brod('brod-bagel', 'Bagel', 4, 2005, 3, { color: '#cf9a4a', crust: '#a86f2a', hole: true }, 'Kokt och sedan gräddad – seg och blank.');
brod('brod-slider', 'Sliderbröd (mini)', 1.5, 2008, 2, { color: '#d9a55d', crust: '#b8823f', mini: true }, 'Litet bröd till miniburgare.');
brod('brod-naan', 'Naanbröd', 3.5, 2008, 3, { color: '#ecd8a8', crust: '#b8905a', flat: true, blister: true }, 'Indiskt bröd bakat i tandoor – med brända bubblor.');
brod('brod-glutenfritt', 'Glutenfritt bröd', 5, 2010, 3, { color: '#e6cf9a', crust: '#c9a86a' }, 'För den som inte tål gluten.');
brod('brod-brioche', 'Briochebröd', 5, 2012, 3, { color: '#e8b35a', crust: '#c98a2e', gloss: true }, 'Smörigt och blankt – gourmetburgarens bröd.');
brod('brod-donut', 'Donutbröd (glaserad)', 4, 2012, 4, { color: '#e8a860', crust: '#c8884a', hole: true, glaze: '#f4e4ec', novelty: true }, 'En glaserad donut som bröd. Sött möter salt – "Luther burger".');
brod('brod-pretzel', 'Pretzelbröd', 6, 2013, 4, { color: '#a65a2a', crust: '#7a3e1a', salt: true }, 'Mörkt, salt och segt.');
brod('brod-ramen', 'Ramenbröd', 5, 2013, 4, { color: '#e8c860', crust: '#c8a040', noodles: true, novelty: true }, 'Stekta nudlar pressade till en "bulle". Från New York 2013.');
brod('brod-surdeg', 'Surdegsbröd', 6, 2014, 4, { color: '#d8b880', crust: '#9a6a30', flour: true }, 'Syrligt och segt med hård skorpa.');
brod('brod-vaffla', 'Våffelbröd', 4, 2014, 4, { color: '#e8b860', crust: '#c09040', waffle: true, novelty: true }, 'Två våfflor som bröd – brunchburgaren.');
brod('brod-potatis', 'Potatisbröd', 4, 2015, 3, { color: '#f0d27a', crust: '#d9b24a' }, 'Extra mjukt – smashburgarens bröd.');
brod('brod-sallad', 'Salladsblad i stället för bröd', 3, 2015, 3, { color: '#8fd05a', crust: '#5a9a2a', lettuce: true }, 'Low carb: burgaren i ett salladsblad.');
brod('brod-bao', 'Baobröd (ångat)', 4, 2015, 3, { color: '#f8f4ec', crust: '#e8e0d0', bao: true, novelty: true }, 'Kinesiskt ångat bröd – mjukt som ett moln.');
brod('brod-svart', 'Svart kolbröd', 7, 2016, 5, { color: '#2a2224', crust: '#161214', sesame: true }, 'Färgat med aktivt kol – ser ut som natten.');
brod('brod-ris', 'Risbullar (sushiburgare)', 5, 2016, 4, { color: '#f8f6f0', crust: '#e8e4d8', grain: true, novelty: true }, 'Pressat sushiris i stället för bröd.');
brod('brod-spenat', 'Spenatbröd', 6, 2018, 4, { color: '#7aa84a', crust: '#4a7a2a' }, 'Grönt bröd bakat med spenat.');
brod('brod-rodbeta', 'Rödbetsbröd', 6, 2019, 4, { color: '#c04a6a', crust: '#8a2a48', sesame: true }, 'Rosa bröd bakat med rödbeta.');
brod('brod-mjolkbrod', 'Mjölkbröd (Hokkaido)', 6, 2020, 4, { color: '#f0d8a0', crust: '#d0a860', gloss: true }, 'Japanskt fluffigt mjölkbröd.');

// ---------- Biffar (shape 'patty' om inget annat) ----------
// kind: not, kalv, flask, kyckling, fisk, lamm, vilt, vego
const biff = (id, name, cost, year, tier, look, desc) => add('biff', id, name, cost, year, tier, { shape: 'patty', h: 0.7, kind: 'not', ...look }, { desc });
// nöt & bland
biff('biff-90', 'Nötfärsbiff 90 g', 6, 1955, 1, { color: '#7a3a26', dark: '#4a2016' }, 'Den klassiska biffen. Stek 2–3 minuter per sida.');
biff('biff-pannbiff', 'Pannbiff med lök', 6, 1955, 1, { color: '#6e3a26', dark: '#4a2016', h: 0.8, flecks: true }, 'Svensk pannbiff – hackad lök i färsen.');
biff('biff-los', 'Lös köttfärs (Sloppy Joe)', 5, 1955, 1, { shape: 'chunky', color: '#8a3a26', light: '#c85a30' }, 'Kryddig köttfärs i tomatsås – kladdigt och gott.');
biff('biff-diner', 'Dinerbiff 135 g', 8.5, 1957, 2, { color: '#7a3a26', dark: '#4a2016', h: 0.9 }, 'Storleken som gjorde Whoppern känd.');
biff('biff-kalv', 'Kalvfärsbiff', 8, 1958, 2, { color: '#a86a5a', dark: '#7a4a3a', h: 0.75, kind: 'kalv' }, 'Ljusare och mildare än nöt.');
biff('biff-bland', 'Blandfärsbiff', 5.5, 1960, 1, { color: '#8a4a36', dark: '#5a2a1e', h: 0.75 }, 'Hälften nöt, hälften fläsk – saftig och billig.');
biff('biff-120', 'Nötfärsbiff 120 g', 7.5, 1962, 1, { color: '#7a3a26', dark: '#4a2016', h: 0.85 }, 'Lite mer att bita i.');
biff('biff-kottbulle', 'Köttbullsbiff', 6, 1965, 2, { color: '#6a3a2a', dark: '#3a1a10', h: 0.8, flecks: true }, 'Svenska köttbullar plattade till en biff – med kryddpeppar.');
biff('biff-150', 'Stor biff 150 g', 9, 1970, 2, { color: '#7a3a26', dark: '#4a2016', h: 0.95 }, 'Tjockare och saftigare – "quarter pounder".');
biff('biff-180', 'Jättebiff 180 g', 11, 1978, 3, { color: '#7a3a26', dark: '#4a2016', h: 1.1 }, 'För den riktigt hungrige.');
biff('biff-ryggbiff', 'Ryggbiffskivor', 12, 1980, 3, { shape: 'strips', color: '#8a3a2a', fat: '#d8a080', h: 0.4 }, 'Tunna skivor stekt ryggbiff – steak sandwich.');
biff('biff-kebab', 'Kebabkött', 7, 1990, 2, { color: '#7a4a30', dark: '#4a2a16', shredded: true }, 'Skivat från spettet – kebabburgaren.');
biff('biff-alg', 'Älgfärsbiff', 14, 1990, 3, { color: '#5a2a20', dark: '#3a1a12', h: 0.85, kind: 'vilt' }, 'Svensk skog på brickan. Magert – stek försiktigt.');
biff('biff-hjort', 'Hjortfärsbiff', 14, 2000, 3, { color: '#6a2e24', dark: '#3e1a12', h: 0.85, kind: 'vilt' }, 'Mörkt och smakrikt viltkött.');
biff('biff-angus', 'Angusbiff 150 g', 14, 2005, 3, { color: '#7a3020', dark: '#4a1a10', h: 0.95, marbled: true }, 'Skotsk ras, mer marmorerat kött.');
biff('biff-ren', 'Renbiff', 18, 2005, 4, { color: '#5e2a22', dark: '#3a1610', h: 0.8, kind: 'vilt' }, 'Från Norrland – mörkt och mört.');
biff('biff-slider-60', 'Sliderbiff 60 g', 4.5, 2008, 2, { color: '#7a3a26', dark: '#4a2016', h: 0.55, mini: true }, 'Liten biff till minibröd.');
biff('biff-bison', 'Bisonbiff', 18, 2010, 4, { color: '#6e3024', dark: '#3e1610', h: 0.9 }, 'Amerikansk buffel – magrare än nöt.');
biff('biff-vildsvin', 'Vildsvinsbiff', 15, 2012, 4, { color: '#7a4030', dark: '#4a2418', h: 0.85, kind: 'vilt' }, 'Kraftig smak av skog och ek.');
biff('biff-chuck', 'Chuck & brisket-biff', 16, 2014, 4, { color: '#7a3226', dark: '#4a1a12', h: 1.0, marbled: true }, 'Egen malning av högrev och bringa.');
biff('biff-smash', 'Smashbiff 70 g', 7, 2016, 3, { color: '#6e3220', dark: '#3e1a10', h: 0.45, crispy: true }, 'Tunn biff som pressas platt på grillen – knaprig kant!');
biff('biff-wagyu', 'Wagyubiff 180 g', 28, 2018, 5, { color: '#8a3e2a', dark: '#5a2216', h: 1.0, marbled: true }, 'Marmorerat lyxkött från Japan.');
biff('biff-blend', 'Blendbiff (nöt & svamp)', 12, 2019, 4, { color: '#7a4a36', dark: '#4a2a1a', h: 0.8, flecks: true }, 'Hälften nötfärs, hälften svamp – för klimatet.');
biff('biff-dryaged', 'Dry aged-biff 200 g', 32, 2022, 5, { color: '#6a2a20', dark: '#3a140e', h: 1.1, marbled: true }, 'Hängmörat i 40 dagar.');
// fläsk & korv
biff('biff-skinka', 'Stekt skinkskiva', 5, 1962, 1, { color: '#e89aa0', dark: '#c06a70', h: 0.5, kind: 'flask' }, 'En tjock skiva stekt skinka.');
biff('biff-korv', 'Grillad korv (delad)', 5, 1975, 1, { color: '#c8613a', dark: '#8a3a1a', h: 0.6, kind: 'flask', split: true }, 'Grillkioskens burgare: en delad korv i bröd.');
biff('biff-flask', 'Fläskfärsbiff', 6, 1975, 2, { color: '#a86a4a', dark: '#7a4a2a', h: 0.75, kind: 'flask' }, 'Mildare än nöt, saftig.');
biff('biff-bratwurst', 'Bratwurst (delad)', 6, 1985, 2, { color: '#d8a888', dark: '#a87858', h: 0.6, kind: 'flask', split: true }, 'Tysk grillkorv, delad på längden.');
biff('biff-gyros', 'Gyros', 7, 1995, 2, { color: '#a86a48', dark: '#7a4428', kind: 'flask', shredded: true }, 'Grekiskt kryddat fläsk från spettet.');
biff('biff-chorizo', 'Chorizoburgare', 9, 2005, 3, { color: '#b83a2a', dark: '#7a2016', kind: 'flask', flecks: true }, 'Paprikakryddad spansk korvfärs.');
biff('biff-pulledpork', 'Pulled pork', 10, 2012, 3, { color: '#a85a3a', dark: '#6a3018', h: 0.9, kind: 'flask', shredded: true }, 'Långkokt fläsk som faller isär.');
// fågel
biff('biff-kyckling', 'Panerad kycklingfilé', 8, 1985, 2, { color: '#e6b45a', dark: '#c48a30', h: 0.8, kind: 'kyckling', crumbs: true }, 'Panerad kycklingfilé. Kom till Sverige på åttiotalet.');
biff('biff-kyckling-grill', 'Grillad kycklingfilé', 9, 1995, 3, { color: '#f0d2a0', dark: '#b08a50', kind: 'kyckling', grillmarks: true }, 'Grillad, inte panerad – lättare.');
biff('biff-kalkon', 'Kalkonbiff', 8, 2000, 2, { color: '#d8b898', dark: '#a8886a', kind: 'kyckling' }, 'Magert och milt.');
biff('biff-kyckling-spicy', 'Spicy kyckling', 9, 2008, 3, { color: '#d8823a', dark: '#a85a1a', h: 0.8, kind: 'kyckling', crumbs: true, spicy: true }, 'Panerad med chili – het!');
biff('biff-pulled-chicken', 'Pulled chicken', 9, 2014, 3, { color: '#e0b888', dark: '#b08858', h: 0.8, kind: 'kyckling', shredded: true }, 'Rivet kycklinglår i bbq.');
biff('biff-kyckling-lar', 'Grillat kycklinglår', 10, 2015, 3, { color: '#d8a060', dark: '#a87030', h: 0.75, kind: 'kyckling', grillmarks: true }, 'Saftigare än filé – lårkött.');
biff('biff-katsu', 'Pankopanerad kyckling (katsu)', 10, 2016, 3, { color: '#e8b868', dark: '#c08838', h: 0.85, kind: 'kyckling', crumbs: true }, 'Japansk panering med stora, luftiga flingor.');
biff('biff-anka', 'Pulled duck', 16, 2016, 4, { color: '#8a4a30', dark: '#5a2a18', h: 0.8, kind: 'kyckling', shredded: true }, 'Långstekt anka, riven.');
biff('biff-nashville', 'Nashville hot chicken', 11, 2018, 4, { color: '#b83a1a', dark: '#7a2010', h: 0.85, kind: 'kyckling', crumbs: true, spicy: true }, 'Friterad kyckling doppad i chiliolja. Brännhet.');
biff('biff-kyckling-korean', 'Koreansk friterad kyckling', 11, 2019, 4, { color: '#c8502a', dark: '#8a3018', h: 0.85, kind: 'kyckling', crumbs: true, spicy: true }, 'Dubbelfriterad och glaserad – extra knaprig.');
// fisk & skaldjur
biff('biff-fiskbiff', 'Fiskbiff', 5, 1960, 1, { color: '#e8d8b0', dark: '#b8a070', kind: 'fisk' }, 'Svensk fiskbiff på torskfärs.');
biff('biff-fisk', 'Panerad fiskfilé', 7, 1965, 2, { color: '#e0a84a', dark: '#b8802a', h: 0.8, kind: 'fisk', square: true }, 'Panerad torsk – fredagsburgaren.');
biff('biff-torsk', 'Grillad torskfilé', 12, 2005, 3, { color: '#f4ecd8', dark: '#c8b890', h: 0.75, kind: 'fisk', grillmarks: true }, 'Vit och flagig – nästan för fin för bröd.');
biff('biff-raka', 'Räkburgare', 12, 2006, 3, { color: '#f0a888', dark: '#d07858', kind: 'fisk', crumbs: true }, 'Hackade räkor i panering.');
biff('biff-tonfisk', 'Tonfiskbiff', 15, 2008, 4, { color: '#c86a6a', dark: '#8a3a3a', h: 0.8, kind: 'fisk', grillmarks: true }, 'Grillad hastigt – rosa i mitten.');
biff('biff-lax', 'Laxburgare', 14, 2010, 4, { color: '#e88a6a', dark: '#c05a3a', h: 0.8, kind: 'fisk' }, 'Hackad lax med dill.');
biff('biff-krabba', 'Krabbkaka', 14, 2010, 4, { color: '#e8c890', dark: '#b89050', kind: 'fisk', crumbs: true }, 'Krabbkött, majonnäs och ströbröd – från Maryland.');
// lamm
biff('biff-lamm', 'Lammfärsbiff', 12, 1998, 3, { color: '#8a4a3a', dark: '#5a2a1e', h: 0.85, kind: 'lamm' }, 'Kryddig lammfärs med mynta.');
biff('biff-kofta', 'Lammkofta', 12, 2010, 3, { color: '#7a3a2e', dark: '#4a1e16', h: 0.8, kind: 'lamm', flecks: true }, 'Lammfärs med spiskummin och persilja.');
// vego
biff('biff-soja', 'Sojabiff', 6, 1990, 2, { color: '#8a6a3a', dark: '#5a4222', h: 0.65, kind: 'vego', flecks: true }, 'Den första vegobiffen – lite torr, mycket kärlek.');
biff('biff-gronsak', 'Grönsaksbiff (morot & majs)', 6, 1992, 2, { color: '#d8a040', dark: '#a87020', h: 0.65, kind: 'vego', flecks: true }, 'Färgglad biff av rotfrukter.');
biff('biff-vego', 'Vegobiff (bönor)', 8, 1995, 2, { color: '#8a7a3a', dark: '#5a4e22', kind: 'vego', flecks: true }, 'Bönor, morötter och kryddor.');
biff('biff-quorn', 'Quornbiff', 7, 1998, 2, { color: '#b89a70', dark: '#8a6a40', kind: 'vego' }, 'Svampprotein – nästan som kyckling.');
biff('biff-falafel', 'Falafel (mosad)', 6, 2000, 2, { color: '#a8823a', dark: '#6a4e1a', kind: 'vego', flecks: true }, 'Kikärtor, örter och spiskummin.');
biff('biff-portobello', 'Portobellosvamp', 7, 2009, 3, { color: '#6a4a3a', dark: '#3a2418', kind: 'vego', round: true }, 'En hel grillad jättechampinjon.');
biff('biff-halloumi', 'Grillad halloumi', 10, 2010, 3, { color: '#f0e2b0', dark: '#c9a860', h: 0.6, kind: 'vego', square: true, grillmarks: true }, 'Salt grillost som håller formen.');
biff('biff-lins', 'Linsbiff', 7, 2010, 3, { color: '#8a5a3a', dark: '#5a3a1e', h: 0.65, kind: 'vego', flecks: true }, 'Röda linser och lök.');
biff('biff-tofu', 'Rökt tofu', 8, 2012, 3, { color: '#c8a870', dark: '#8a6a40', h: 0.65, kind: 'vego', square: true }, 'Fast och rökig.');
biff('biff-rodbeta', 'Rödbetsbiff', 8, 2012, 3, { color: '#a83a5a', dark: '#6a1a3a', kind: 'vego', flecks: true }, 'Knallrosa – rödbetor, havregryn och fetaost.');
biff('biff-tempeh', 'Tempeh', 8, 2014, 3, { color: '#d8c090', dark: '#a89060', h: 0.6, kind: 'vego', square: true, crumbs: true }, 'Fermenterade sojabönor från Indonesien.');
biff('biff-seitan', 'Seitan', 9, 2015, 3, { color: '#a8785a', dark: '#7a5038', kind: 'vego' }, 'Vetegluten – segt som kött.');
biff('biff-svamp', 'Svampbiff (shiitake)', 9, 2016, 3, { color: '#6a4a3a', dark: '#3a2418', kind: 'vego', flecks: true }, 'Umami från skogen.');
biff('biff-jackfruit', 'Pulled jackfruit', 9, 2017, 3, { color: '#c8905a', dark: '#8a6030', h: 0.8, kind: 'vego', shredded: true }, 'Tropisk frukt som rivs som pulled pork.');
biff('biff-plant', 'Plantbaserad biff', 12, 2019, 4, { color: '#7a3e2e', dark: '#4e2418', h: 0.75, kind: 'vego' }, 'Smakar och blöder nästan som kött – gjord på ärtprotein.');
biff('biff-kyckling-plant', 'Plantbaserad kyckling', 11, 2021, 4, { color: '#e6c48a', dark: '#b8944a', h: 0.75, kind: 'vego', crumbs: true }, 'Vegansk "kyckling" med panering.');
biff('biff-vegansk-fisk', 'Vegansk fiskfilé', 11, 2022, 4, { color: '#e8c070', dark: '#b89040', h: 0.8, kind: 'vego', crumbs: true, square: true }, 'Panerad "fisk" på bönor och alger.');

// ---------- Ost (shape 'cheese' om inget annat) ----------
const ost = (id, name, cost, year, tier, look, desc) => add('ost', id, name, cost, year, tier, { shape: 'cheese', melt: true, ...look }, { desc });
ost('ost-amerikansk', 'Amerikansk ost', 2, 1955, 1, { color: '#f5b52a' }, 'Smältost i skivor – smälter perfekt på den varma biffen.');
ost('ost-hushall', 'Hushållsost', 2, 1955, 1, { color: '#f4e4a0' }, 'Svensk vardagsost – mild och smältbar.');
ost('ost-prast', 'Prästost', 3, 1955, 2, { color: '#f0d888' }, 'Lagrad svensk ost med lite sting.');
ost('ost-cheddar', 'Cheddar', 3, 1960, 2, { color: '#e8962a' }, 'Skarpare smak, orange färg.');
ost('ost-herrgard', 'Herrgårdsost', 3, 1960, 2, { color: '#f4e0a0', holes: true }, 'Svensk ost med små hål och nötig smak.');
ost('ost-greve', 'Grevé', 3, 1964, 2, { color: '#f6e8b0', holes: true }, 'Svensk ost i schweizerstil – större hål.');
ost('ost-schweizer', 'Schweizerost', 3, 1965, 2, { color: '#f4e4a8', holes: true }, 'Med hål – nötig smak.');
ost('ost-emmentaler', 'Emmentaler', 3.5, 1970, 2, { color: '#f4e4a8', holes: true }, 'Den riktiga från Schweiz – stora hål.');
ost('ost-gouda', 'Gouda', 3, 1980, 2, { color: '#f0c860' }, 'Mild och rund.');
ost('ost-monterey', 'Monterey Jack', 3.5, 1985, 2, { color: '#f6f0d8' }, 'Kalifornisk smältost – mjuk och mild.');
ost('ost-provolone', 'Provolone', 4, 1990, 2, { color: '#f4ecd0' }, 'Italiensk ost som smälter fint – Philly-osten.');
ost('ost-mozzarella', 'Mozzarella', 4, 1995, 2, { color: '#f8f4e8', stretchy: true }, 'Drar trådar när den smälter.');
ost('ost-feta', 'Fetaost', 4, 1995, 2, { color: '#f8f6f0', crumbled: true, melt: false }, 'Smulad grekisk ost – salt och syrlig.');
ost('ost-ostsas', 'Ostsås', 2.5, 1995, 2, { shape: 'sauce', color: '#f0b030' }, 'Rinnig smältostsås – nachosens bästa vän.');
ost('ost-pepperjack', 'Pepper jack', 4, 1998, 3, { color: '#f4ecd0', spots: '#c93a2a' }, 'Med bitar av chili.');
ost('ost-parmesan', 'Parmesanflingor', 5, 2000, 3, { color: '#f0e6c0', flakes: true, melt: false }, 'Hyvlad parmesan – salt och kornig.');
ost('ost-bla', 'Blåmögelost', 5, 2005, 3, { color: '#e8e2c8', spots: '#5a7a9a', melt: false }, 'Kraftig ost för den vuxna burgaren.');
ost('ost-gruyere', 'Gruyère', 5, 2005, 3, { color: '#f0d890' }, 'Schweizisk ost med djup smak – gratängens ost.');
ost('ost-farskost', 'Färskost', 3, 2005, 2, { shape: 'sauce', color: '#f8f4ec', melt: false }, 'Bredbar mjuk ost – bagelns kompis.');
ost('ost-brie', 'Brie', 5, 2008, 3, { color: '#f6f0e0', rind: '#e0d8c0' }, 'Krämig med vit skorpa.');
ost('ost-getost', 'Chèvre', 6, 2008, 4, { color: '#f4f0e6', melt: false, round: true }, 'Krämig getost.');
ost('ost-rokt', 'Rökt ost', 4, 2010, 3, { color: '#d8a050' }, 'Rökt över bokträ.');
ost('ost-camembert', 'Friterad camembert', 6, 2010, 4, { color: '#f4ecd8', rind: '#d8a860', round: true, melt: false, crumbs: true }, 'Panerad och friterad – rinner när du biter.');
ost('ost-cheddar-lagrad', 'Lagrad cheddar', 5, 2010, 3, { color: '#e0862a' }, 'Lagrad 18 månader – kraftig och kornig.');
ost('ost-halloumi-skiva', 'Halloumiskiva', 5, 2012, 3, { color: '#f0e2b0', grillmarks: true, melt: false }, 'En grillad skiva halloumi ovanpå biffen.');
ost('ost-vasterbotten', 'Västerbottensost', 7, 2012, 4, { color: '#f0d070', holes: true }, 'Norrlands guld – smakar lite som parmesan.');
ost('ost-cheddar-vit', 'Vit cheddar', 5, 2015, 3, { color: '#f4ecd0' }, 'Cheddar utan färgämne – samma smak.');
ost('ost-pimento', 'Pimento cheese', 5, 2016, 4, { shape: 'chunky', color: '#f0a060', light: '#f8d0a0' }, 'Sydstatsröra av cheddar, majonnäs och paprika.');
ost('ost-burrata', 'Burrata', 8, 2018, 4, { color: '#fbf9f4', round: true, melt: false }, 'Mozzarella fylld med grädde – rinner ut när den delas.');
ost('ost-vegansk', 'Vegansk ost', 5, 2018, 3, { color: '#f3d27a' }, 'Gjord på kokos och stärkelse.');
ost('ost-raclette', 'Raclette', 7, 2019, 4, { color: '#f0c878', drip: true }, 'Smälts med brännare och skrapas över biffen.');
ost('ost-tryffel', 'Tryffelost', 9, 2019, 5, { color: '#f4ecd8', spots: '#3a2a1a' }, 'Ost med svarta tryffelbitar.');
ost('ost-cheddar-vegansk', 'Vegansk cheddar', 5, 2020, 3, { color: '#f0a030' }, 'Smälter faktiskt – andra generationens vegoost.');

// ---------- Extra (toppings) ----------
const extra = (id, name, cost, year, tier, look, desc) => add('extra', id, name, cost, year, tier, look, { desc });
extra('rostad-lok', 'Rostad lök', 1.5, 1955, 1, { shape: 'chunky', color: '#c8803a', light: '#e8a860', crisp: true }, 'Torkad, friterad lök i burk – på allt i Sverige.');
extra('rodbetssallad', 'Rödbetssallad', 2, 1955, 1, { shape: 'chunky', color: '#c03a6a', light: '#e87aa0' }, 'Rödbetor i majonnäs – svensk klassiker på biffen.');
extra('kokt-agg', 'Kokt ägg (skivor)', 2, 1960, 1, { shape: 'slice', color: '#f8f4ea', inner: '#f2c030', n: 3, small: true }, 'Skivat hårdkokt ägg.');
extra('bacon', 'Bacon', 4, 1963, 2, { shape: 'strips', color: '#b8443a', fat: '#f0c8a8' }, 'Knaperstekt. Bacon på burgaren blev stort på sextiotalet.');
extra('chili', 'Chili con carne', 4, 1965, 2, { shape: 'chunky', color: '#8a3a22', light: '#c85a30' }, 'Kryddig köttfärsgryta ovanpå – "chili burger".');
extra('stekt-agg', 'Stekt ägg', 3, 1970, 2, { shape: 'egg', white: '#fbf6ea', yolk: '#f2b01e' }, 'Med rinnig gula.');
extra('champinjoner', 'Stekta champinjoner', 3, 1975, 2, { shape: 'chunky', color: '#8a6a4a', light: '#c8a880' }, 'Smörstekta skivor.');
extra('raksallad', 'Räksallad', 4, 1975, 2, { shape: 'chunky', color: '#f4b8a8', light: '#fbe0d0' }, 'Räkor i majonnäs – rullens och kioskens stolthet.');
extra('korvskivor', 'Korvskivor', 2, 1975, 1, { shape: 'slice', color: '#d88a70', inner: '#e8a890', n: 3 }, 'Skivad falukorv, stekt.');
extra('potatismos', 'Potatismos', 2, 1978, 1, { shape: 'chunky', color: '#f4ecc8', light: '#fbf6e0' }, 'En klick mos – i tunnbrödsrullen.');
extra('skinka', 'Skinka', 3, 1980, 2, { shape: 'slice', color: '#e89aa0', inner: '#f4c0c4', n: 1, big: true }, 'En skiva kokt skinka – "cordon bleu-burgaren".');
extra('ananas', 'Grillad ananas', 3, 1985, 2, { shape: 'rings', color: '#f2c84a', h: 0.35, hole: true }, 'Hawaiiburgarens ring.');
extra('krispig-lok', 'Krispig lök', 2, 1990, 2, { shape: 'chunky', color: '#d8a04a', light: '#f0c878', crisp: true }, 'Friterad strimlad lök.');
extra('lokringar-topping', 'Friterade lökringar', 4, 1990, 3, { shape: 'rings', color: '#e0a84a', h: 0.5, hole: true }, 'Knapriga ringar ovanpå biffen.');
extra('pastrami', 'Pastrami', 5, 1990, 3, { shape: 'strips', color: '#8a3a3a', fat: '#3a2a2a' }, 'Rökt, pepprad bringa – New Yorks deli-kött.');
extra('surkal', 'Surkål', 2, 1990, 2, { shape: 'leaf', color: '#e8e0b0', edge: '#c8c080', wild: true }, 'Syrad vitkål – Reubens hemlighet.');
extra('pepperoni', 'Pepperoni', 3, 1995, 2, { shape: 'slice', color: '#b82a2a', inner: '#d84a3a', n: 4, small: true }, 'Pizzans korv på burgaren.');
extra('jalapeno', 'Jalapeño', 3, 1998, 2, { shape: 'pickles', color: '#3a8a3a', ring: true }, 'Het! Skivad chili i lag.');
extra('grillad-paprika', 'Grillad paprika', 3, 2000, 2, { shape: 'strips', color: '#d84a2a', fat: '#f08a5a' }, 'Söt och rökig.');
extra('guacamole', 'Guacamole', 5, 2005, 3, { shape: 'chunky', color: '#8ab84a', light: '#b8d878' }, 'Mosad avokado med lime.');
extra('hashbrown', 'Hash brown', 3, 2005, 2, { shape: 'square', color: '#e0a850', dark: '#b87830', h: 0.4, crumbs: true }, 'Friterad riven potatis – frukostens knaprigaste.');
extra('tomatsalsa', 'Tomatsalsa', 3, 2005, 2, { shape: 'chunky', color: '#c83a2a', light: '#e86a4a' }, 'Hackad tomat, lök och koriander.');
extra('chorizo-skivor', 'Chorizoskivor', 4, 2005, 3, { shape: 'slice', color: '#b03020', inner: '#d05030', n: 3 }, 'Stekta skivor spansk korv.');
extra('grillad-zucchini', 'Grillad zucchini', 3, 2005, 3, { shape: 'strips', color: '#8ab84a', fat: '#d8e890' }, 'Skivad på längden och grillad.');
extra('kalkonbacon', 'Kalkonbacon', 4, 2005, 2, { shape: 'strips', color: '#c88070', fat: '#e8c0b0' }, 'Magrare än fläskbacon.');
extra('grillad-aubergine', 'Grillad aubergine', 3, 2008, 3, { shape: 'slice', color: '#5a2a5a', inner: '#e8d8b8', n: 2 }, 'Mjuk och rökig.');
extra('nachos', 'Krossade nachochips', 2, 2008, 3, { shape: 'chunky', color: '#e8b850', light: '#f8d888', crisp: true }, 'Knaprigt i burgaren – tacoburgarens knep.');
extra('banan', 'Bananskivor', 2, 2010, 3, { shape: 'slice', color: '#f0e0a0', inner: '#f8f0c8', n: 4, small: true }, 'Elvis burger: banan och jordnötssmör.');
extra('pommes-i', 'Pommes i burgaren', 2, 2010, 3, { shape: 'strips', color: '#f0c050', fat: '#f8d878' }, 'Ja – pommes inuti burgaren.');
extra('rokt-lax', 'Rökt lax', 7, 2010, 4, { shape: 'slice', color: '#e8886a', inner: '#f0a888', n: 2 }, 'Kallrökt lax i tunna skivor.');
extra('avokado', 'Avokado', 6, 2012, 3, { shape: 'avocado', color: '#8ab84a', dark: '#5a8a2a' }, 'Skivad avokado – Kaliforniens gåva till burgaren.');
extra('pulledpork-topping', 'Pulled pork-topping', 5, 2012, 3, { shape: 'chunky', color: '#a85a3a', light: '#d08a5a' }, 'En extra hög med fläsk.');
extra('mango-salsa', 'Mangosalsa', 4, 2012, 3, { shape: 'chunky', color: '#f0b030', light: '#f8d870' }, 'Mango, rödlök och chili.');
extra('sidflask', 'Rökt sidfläsk (tjockt)', 6, 2015, 4, { shape: 'strips', color: '#a84030', fat: '#f0c8a8', h: 0.5 }, 'Tjockt skuret bacon – nästan en biff.');
extra('brisket', 'Brisketskivor', 6, 2015, 4, { shape: 'strips', color: '#7a3a2a', fat: '#4a2a1a', h: 0.4 }, 'Rökt bringa i 14 timmar – Texas.');
extra('kraftstjartar', 'Kräftstjärtar', 8, 2015, 4, { shape: 'chunky', color: '#e86a4a', light: '#f8a088' }, 'Augustiburgaren – med dill.');
extra('picklad-rodlok', 'Picklad rödlök', 2, 2016, 3, { shape: 'onion', color: '#e05a8a', ring: '#a82a5a' }, 'Rosa och syrlig.');
extra('mac-cheese', 'Mac & cheese', 5, 2016, 4, { shape: 'chunky', color: '#f0b040', light: '#f8d888' }, 'Makaroner i ostsås ovanpå biffen. Ja, verkligen.');
extra('bacon-jam', 'Baconmarmelad', 5, 2016, 4, { shape: 'sauce', color: '#5a2a1a', spots: '#a85a3a' }, 'Bacon kokt med lök och socker till en marmelad.');
extra('chips-krossade', 'Krossade chips', 2, 2016, 3, { shape: 'chunky', color: '#f0c860', light: '#f8e0a0', crisp: true }, 'Salta chips i burgaren – för knaset.');
extra('stekt-shiitake', 'Stekt shiitake', 5, 2016, 4, { shape: 'chunky', color: '#5a3a2a', light: '#8a6a4a' }, 'Japansk svamp med djup umami.');
extra('grillad-persika', 'Grillad persika', 4, 2016, 4, { shape: 'slice', color: '#e89040', inner: '#f8c070', n: 2 }, 'Sött och rökigt – sommarburgaren.');
extra('kimchi', 'Kimchi', 4, 2018, 3, { shape: 'leaf', color: '#d84a3a', edge: '#a82a22', wild: true }, 'Koreansk fermenterad kål.');
extra('tryffelskivor', 'Tryffelskivor', 12, 2018, 5, { shape: 'slice', color: '#2a1a14', inner: '#3a2a20', n: 4, small: true }, 'Svart tryffel, hyvlad.');
extra('tryffelost-krisp', 'Parmesankrisp', 6, 2019, 4, { shape: 'chunky', color: '#e8d8a0', light: '#f8f0d0', crisp: true }, 'Ugnsbakad parmesan – knaprig som chips.');
extra('vegansk-bacon', 'Veganskt bacon', 4, 2020, 3, { shape: 'strips', color: '#c05040', fat: '#e8a070' }, 'Rispapper eller sojaskivor – rökigt och knaprigt.');

// ---------- Grönt ----------
const gront = (id, name, cost, year, tier, look, desc) => add('gront', id, name, cost, year, tier, look, { desc });
gront('sallad', 'Isbergssallad', 1.5, 1955, 1, { shape: 'leaf', color: '#7fc44a', edge: '#4f9a2a' }, 'Knaprigt och svalt.');
gront('tomat', 'Tomatskivor', 2, 1955, 1, { shape: 'slice', color: '#e0392e', inner: '#f0806a', n: 2 }, 'Två skivor.');
gront('lok', 'Lök', 1, 1955, 1, { shape: 'onion', color: '#f3ead0', ring: '#d8c8a0' }, 'Hackad eller i ringar.');
gront('stekt-lok', 'Stekt lök', 1.5, 1955, 1, { shape: 'onion', color: '#c89050', ring: '#9a6030', soft: true }, 'Mjuk smörstekt lök – pannbiffens kompis.');
gront('saltgurka', 'Saltgurka', 1.5, 1955, 1, { shape: 'pickles', color: '#5a8a2a' }, 'Syrliga skivor – tre stycken.');
gront('gurka', 'Färsk gurka', 1.5, 1955, 1, { shape: 'pickles', color: '#9ad06a', fresh: true }, 'Svalt och krispigt.');
gront('persilja', 'Persilja', 0.5, 1955, 1, { shape: 'herb', color: '#4a9a3a' }, 'Hackad – för färgen och friskheten.');
gront('silverlok', 'Silverlök', 1.5, 1965, 1, { shape: 'pickles', color: '#f4f0e0', ring: true }, 'Små inlagda lökar, delade.');
gront('sotsur-gurka', 'Sötsur gurka', 1.5, 1965, 1, { shape: 'pickles', color: '#8ab040', ring: true }, 'Sötare än saltgurkan – dinerns pickles.');
gront('graslok', 'Gräslök', 0.5, 1970, 1, { shape: 'herb', color: '#5aaa4a' }, 'Finklippt.');
gront('coleslaw', 'Coleslaw', 3, 1975, 2, { shape: 'leaf', color: '#e6efc8', edge: '#b8c890' }, 'Vitkål och morot i dressing.');
gront('rivna-morotter', 'Rivna morötter', 1, 1975, 1, { shape: 'chunky', color: '#f08a2a', light: '#f8b060' }, 'Sött och krispigt – sjuttiotalets hälsokost.');
gront('vitkal', 'Strimlad vitkål', 1, 1985, 1, { shape: 'leaf', color: '#e8f0c8', edge: '#c0d090', wild: true }, 'Tunt strimlad – kebabburgarens grönt.');
gront('bongroddar', 'Böngroddar', 1.5, 1985, 2, { shape: 'chunky', color: '#f0eccc', light: '#fbf8e8' }, 'Krispiga groddar – Kaliforniens åttiotal.');
gront('paprika', 'Paprika', 2, 1990, 2, { shape: 'strips', color: '#e8a02a', fat: '#f0c860' }, 'Strimlad gul paprika.');
gront('krispsallad', 'Krispsallad', 2, 1990, 2, { shape: 'leaf', color: '#a8d860', edge: '#78b040' }, 'Ljusgrön och knaprig.');
gront('rodlok', 'Rödlök', 1.5, 1995, 2, { shape: 'onion', color: '#b05a9a', ring: '#7a3a6a' }, 'Mildare och sötare.');
gront('oliver', 'Oliver', 2, 1995, 2, { shape: 'slice', color: '#3a3a2a', inner: '#6a6a4a', n: 4, small: true }, 'Skivade svarta oliver.');
gront('romansallad', 'Romansallad', 2, 2000, 2, { shape: 'leaf', color: '#5aa84a', edge: '#2f7a2a' }, 'Krispigare än isberg.');
gront('mixsallad', 'Mixsallad', 2, 2000, 2, { shape: 'leaf', color: '#8ac850', edge: '#a03a5a', wild: true }, 'Blandade små blad.');
gront('varlok', 'Vårlök', 1, 2000, 2, { shape: 'herb', color: '#6ab84a' }, 'Skivad salladslök.');
gront('dill', 'Dill', 1, 2000, 2, { shape: 'herb', color: '#5aa85a' }, 'Till fisk och räkor.');
gront('soltorkad-tomat', 'Soltorkad tomat', 4, 2005, 3, { shape: 'slice', color: '#a83a22', inner: '#c85a3a', n: 3, small: true }, 'Intensiv tomatsmak.');
gront('basilika', 'Basilika', 1.5, 2005, 2, { shape: 'leaf', color: '#3a8a3a', edge: '#2a6a2a' }, 'Färska blad – capresens örta.');
gront('chili-farsk', 'Färsk chili', 1.5, 2005, 2, { shape: 'slice', color: '#d82a2a', inner: '#f05a4a', n: 4, small: true }, 'Skivad röd chili – het.');
gront('grillad-tomat', 'Grillad tomat', 2.5, 2005, 3, { shape: 'slice', color: '#b83a2a', inner: '#d86a4a', n: 2 }, 'Mjuk och söt av grillen.');
gront('ruccola', 'Ruccola', 3, 2008, 3, { shape: 'leaf', color: '#4a8a3a', edge: '#2f6a22', wild: true }, 'Pepprig sallad.');
gront('spenat', 'Babyspenat', 3, 2008, 3, { shape: 'leaf', color: '#3a7a3a', edge: '#245a22' }, 'Små mjuka blad.');
gront('korsbarstomater', 'Körsbärstomater', 2.5, 2008, 3, { shape: 'slice', color: '#e03a2a', inner: '#f07a60', n: 3, small: true }, 'Små och söta, halverade.');
gront('rodbeta', 'Inlagd rödbeta', 2, 2008, 2, { shape: 'slice', color: '#a02a5a', inner: '#c84a7a', n: 2, big: true }, 'Australiens burgare har alltid rödbeta.');
gront('karamelliserad-lok', 'Karamelliserad lök', 4, 2010, 3, { shape: 'onion', color: '#b8783a', ring: '#8a5020', soft: true }, 'Långsamt stekt tills den är söt och mjuk.');
gront('balsamicolok', 'Balsamicolök', 3, 2010, 3, { shape: 'onion', color: '#6a3a2a', ring: '#4a2018', soft: true }, 'Lök kokt i balsamvinäger.');
gront('rodkal', 'Picklad rödkål', 2, 2010, 3, { shape: 'leaf', color: '#8a3a8a', edge: '#5a1a5a', wild: true }, 'Lila och syrlig.');
gront('kapris', 'Kapris', 2, 2010, 3, { shape: 'herb', color: '#5a7a3a' }, 'Små salta knoppar.');
gront('koriander', 'Koriander', 1, 2010, 3, { shape: 'herb', color: '#4aa04a' }, 'Älskad eller hatad.');
gront('gronkal', 'Grönkål', 2.5, 2014, 3, { shape: 'leaf', color: '#2f6a30', edge: '#1e4a20', wild: true }, 'Superfooden från 2014.');
gront('artskott', 'Ärtskott', 3, 2014, 3, { shape: 'herb', color: '#7ac860' }, 'Små gröna skott.');
gront('picklad-morot', 'Picklade morötter', 2, 2014, 3, { shape: 'strips', color: '#f0902a', fat: '#f8c070' }, 'Vietnamesiska bánh mì-morötter.');
gront('radisor', 'Rädisor', 2, 2015, 3, { shape: 'slice', color: '#d83a5a', inner: '#f8f0f0', n: 4, small: true }, 'Tunt skivade – pepprig krisp.');
gront('fankal', 'Hyvlad fänkål', 3, 2016, 4, { shape: 'chunky', color: '#e8f0d8', light: '#f8fcf0' }, 'Smakar lite lakrits.');

// ---------- Såser (shape 'sauce' om inget annat) ----------
const sas = (id, name, cost, year, tier, color, desc, extra = {}) => add('sas', id, name, cost, year, tier, { shape: 'sauce', color, ...extra }, { desc });
sas('ketchup', 'Ketchup', 1, 1955, 1, '#c92a2a', 'Tomat, socker och vinäger.');
sas('senap', 'Senap', 1, 1955, 1, '#e8b820', 'Gul och skarp.');
sas('majonnas', 'Majonnäs', 1, 1955, 1, '#f4ecc8', 'Ägg, olja och en skvätt vinäger.');
sas('lingon', 'Rårörda lingon', 1.5, 1955, 1, '#b02a3a', 'Svenska skogens ketchup.', { spots: '#e06070' });
sas('remoulad', 'Remouladsås', 1.5, 1960, 1, '#e8e0a0', 'Majonnäs med pickles och curry – dansk favorit.');
sas('tusen-o', 'Thousand island', 1.5, 1960, 1, '#f0a878', 'Majonnäs, ketchup och hackad pickles.', { spots: '#c84a3a' });
sas('dressing', 'Hamburgerdressing', 1.5, 1965, 1, '#f0c48a', 'Majonnäs, ketchup och pickles – den hemliga såsen.');
sas('relish', 'Relish', 1.5, 1965, 1, '#7aa040', 'Söt hackad gurka – amerikansk korvsås.', { shape: 'chunky', light: '#a8c860' });
sas('tartar', 'Tartarsås', 1.5, 1965, 1, '#f0eed0', 'Majonnäs med kapris och gurka – till fisk.', { spots: '#8aa050' });
sas('bostongurka', 'Bostongurka', 1.5, 1970, 1, '#7aa040', 'Svensk hackad gurka i lag – uppfanns i Ahlgrens fabrik.', { shape: 'chunky', light: '#b0d070' });
sas('rhode-island', 'Rhode Island', 1.5, 1972, 1, '#f0b088', 'Svensk sjuttiotalssås – majo, chilisås och grädde.');
sas('chilisas', 'Chilisås (söt)', 1.5, 1975, 1, '#c02a2a', 'Söt tomatchilisås – Rhode Islands ingrediens.');
sas('kryddsmor', 'Kryddsmör', 2, 1980, 2, '#f0e090', 'Smör med örter som smälter på biffen.', { spots: '#5a9a3a' });
sas('bbq', 'BBQ-sås', 2, 1985, 2, '#6a2a1a', 'Rökig och söt.');
sas('curry', 'Currysås', 2, 1985, 2, '#d8a82a', 'Gul och mild.');
sas('vitlokssas', 'Vitlökssås', 2, 1985, 2, '#f4f2e8', 'Kebabens vita sås.');
sas('pepparsas', 'Pepparsås', 2.5, 1985, 2, '#8a6a4a', 'Gräddsås med krossad svartpeppar – krogens klassiker.', { spots: '#2a1a1a' });
sas('dijon', 'Dijonsenap', 2, 1985, 2, '#c8a020', 'Fransk och skarp.');
sas('bearnaise', 'Bearnaisesås', 3, 1990, 2, '#f0e0a0', 'Smör, äggula och dragon.');
sas('kebabsas', 'Kebabsås stark', 2, 1990, 2, '#e05a3a', 'Röd och het.', { drops: true });
sas('vitlokssmor', 'Vitlökssmör', 2, 1990, 2, '#f4e8a0', 'Smält vitlökssmör över biffen.');
sas('yoghurtsas', 'Yoghurtsås', 2, 1990, 2, '#f8f6ee', 'Svalkande med mynta.');
sas('tzatziki', 'Tzatziki', 2, 1995, 2, '#f0f4e8', 'Yoghurt, gurka och vitlök.');
sas('honungssenap', 'Honungssenap', 2, 1995, 2, '#e8c040', 'Söt och skarp.');
sas('grov-senap', 'Grovkornig senap', 2, 1995, 2, '#c8a840', 'Hela senapskorn.', { spots: '#6a4a10' });
sas('ranch', 'Ranchdressing', 2, 1998, 2, '#f4f0e0', 'Kärnmjölk och örter.');
sas('hotsauce', 'Hot sauce', 2, 2000, 2, '#d82a1a', 'Fermenterad chili – stark!', { drops: true });
sas('sweetchili', 'Söt chilisås', 2, 2000, 2, '#e05a2a', 'Thailändsk – söt med chiliflarn.', { spots: '#a02010' });
sas('aioli', 'Aioli', 2.5, 2002, 2, '#f2e8b8', 'Vitlöksmajonnäs.');
sas('currymajo', 'Currymajonnäs', 2, 2002, 2, '#e8c060', 'Gul och mild majo.');
sas('pesto', 'Pesto', 3, 2005, 3, '#5a8a2a', 'Basilika, pinjenötter och parmesan.');
sas('blue-cheese', 'Blue cheese-dressing', 3, 2005, 3, '#f0ecdc', 'Krämig med bitar av mögelost.', { spots: '#5a7a9a' });
sas('mango-chutney', 'Mangochutney', 3, 2005, 3, '#e8a030', 'Söt och kryddig indisk mango.', { shape: 'chunky', light: '#f8c860' });
sas('buffalo', 'Buffalosås', 3, 2005, 3, '#e0502a', 'Hot sauce och smör – vingarnas sås.');
sas('pepparrotsmajo', 'Pepparrotsmajo', 3, 2008, 3, '#f4f2ea', 'Skarp av riven pepparrot.', { spots: '#d0d0c0' });
sas('chiliketchup', 'Chiliketchup', 1.5, 2008, 2, '#b82020', 'Ketchup med hetta.', { drops: true });
sas('chipotle', 'Chipotlemajo', 3, 2010, 3, '#d8703a', 'Rökig chili i majonnäs.');
sas('hollandaise', 'Hollandaise', 3, 2010, 3, '#f4d878', 'Smör och äggula – brunchsåsen.');
sas('wasabimajo', 'Wasabimajonnäs', 3, 2010, 3, '#c8e090', 'Grön och het i näsan.');
sas('jordnotssmor', 'Jordnötssmör', 2.5, 2010, 3, '#c88a48', 'Krämigt jordnötssmör – Elvis favorit.');
sas('carolina-bbq', 'Carolina BBQ (senap)', 3, 2010, 3, '#d8a020', 'Gul senapsbaserad bbq från South Carolina.');
sas('balsamico', 'Balsamicoglaze', 3, 2010, 3, '#3a1a14', 'Inkokt balsamvinäger – ringlas över.', { shape: 'drizzle' });
sas('sriracha', 'Srirachamajo', 3, 2012, 3, '#e86a3a', 'Thailändsk chilisås i majo.');
sas('teriyaki', 'Teriyakisås', 3, 2012, 3, '#4a2a18', 'Söt soja från Japan.');
sas('tahini', 'Tahinisås', 3, 2012, 3, '#e8d8b0', 'Sesampasta med citron.');
sas('skagenrora', 'Skagenröra', 6, 2012, 4, '#f4c0b0', 'Räkor, majonnäs och dill – Skagen på burgaren.', { shape: 'chunky', light: '#fbe4d8' });
sas('dillmajo', 'Dillmajonnäs', 3, 2012, 3, '#eef0d8', 'Till lax och räkor.', { spots: '#5aa85a' });
sas('honung', 'Honung', 2, 2012, 3, '#f0b030', 'Ringlas över getost och halloumi.', { shape: 'drizzle' });
sas('harissa', 'Harissa', 3, 2014, 3, '#b82a1a', 'Nordafrikansk chilipasta.', { spots: '#e06030' });
sas('salsa-verde', 'Salsa verde', 3, 2015, 3, '#5a9a4a', 'Örter, kapris och olivolja.', { spots: '#3a6a2a' });
sas('hoisin', 'Hoisinsås', 3, 2015, 3, '#4a2018', 'Kinesisk söt bönsås – till bao.');
sas('fikonmarmelad', 'Fikonmarmelad', 4, 2015, 4, '#8a3a4a', 'Söt – till getost och brie.', { spots: '#c86a7a' });
sas('chimichurri', 'Chimichurri', 4, 2016, 4, '#4a8a3a', 'Persilja, vitlök och vinäger – från Argentina.');
sas('vegansk-majo', 'Vegansk majonnäs', 2.5, 2016, 3, '#f4f0e0', 'Gjord på kikärtsspad i stället för ägg.');
sas('tonkatsu', 'Tonkatsusås', 3, 2016, 3, '#3a2016', 'Japansk tjock brun sås – till katsu.');
sas('tryffelmajo', 'Tryffelmajonnäs', 6, 2018, 4, '#e8dcb8', 'Lyxig – med riktig tryffel.', { spots: '#3a2a1a' });
sas('misomajo', 'Misomajonnäs', 4, 2019, 4, '#e8d090', 'Umami från fermenterad soja.');
sas('gochujang', 'Gochujangmajo', 4, 2020, 4, '#c8402a', 'Koreansk chilipasta i majo.');
sas('hot-honey', 'Hot honey', 3, 2020, 4, '#f0a020', 'Honung med chili – sött och hett.', { shape: 'drizzle' });
sas('kimchimajo', 'Kimchimajo', 4, 2020, 4, '#e88060', 'Majo med hackad kimchi.');
sas('chili-crisp', 'Chili crisp', 4, 2021, 4, '#c03a1a', 'Kinesisk chiliolja med knaprig lök.', { shape: 'drizzle', spots: '#5a1a0a' });

// ---------- Tillbehör (i fickan på brickan) ----------
const till = (id, name, cost, year, tier, look, desc) => add('tillbehor', id, name, cost, year, tier, look, { desc });
till('pommes', 'Pommes frites', 3, 1955, 1, { shape: 'fries', color: '#f0c050' }, 'Friterade i två omgångar för att bli knapriga.');
till('potatismos-skal', 'Potatismos', 2, 1955, 1, { shape: 'mash', color: '#f4ecc8' }, 'Med en smörklick i mitten.');
till('potatissallad', 'Potatissallad', 2.5, 1960, 1, { shape: 'salad', color: '#f4ecc8', bits: ['#5aa85a', '#f0c030'] }, 'Kall potatis i majonnäs med gräslök.');
till('chips', 'Chips (påse)', 2, 1965, 1, { shape: 'bag', color: '#e8b030', label: '#c02020' }, 'En liten påse saltade chips.');
till('coleslaw-skal', 'Coleslaw (skål)', 3, 1975, 1, { shape: 'salad', color: '#e6efc8' }, 'Vitkålssallad vid sidan.');
till('kroketter', 'Kroketter', 3.5, 1975, 2, { shape: 'nuggets', color: '#d8a050', sticks: true }, 'Friterade potatisrullar.');
till('pommes-stor', 'Stor pommes', 4, 1975, 1, { shape: 'fries', color: '#f0c050', big: true }, 'Dubbelt så mycket pommes.');
till('bakad-potatis', 'Bakad potatis', 3, 1980, 2, { shape: 'potato', color: '#a8783a' }, 'Med smör och gräddfil.');
till('nuggets', 'Kycklingnuggets', 5, 1985, 2, { shape: 'nuggets', color: '#e0a84a' }, 'Sex bitar panerad kyckling.');
till('hashbrowns', 'Hash browns', 3, 1985, 2, { shape: 'nuggets', color: '#e0a850', flat: true }, 'Friterade potatisplattor.');
till('steak-fries', 'Steak fries (tjocka)', 3.5, 1985, 2, { shape: 'fries', color: '#e8b848', thick: true }, 'Tjocka stavar – mjuka inuti.');
till('lokringar', 'Lökringar', 4, 1990, 2, { shape: 'ringbasket', color: '#e0a84a' }, 'Panerade och friterade.');
till('majskolv', 'Grillad majskolv', 3, 1990, 2, { shape: 'corn', color: '#f2c84a' }, 'Med smör och salt.');
till('tater-tots', 'Tater tots', 3.5, 1990, 2, { shape: 'nuggets', color: '#e0a850', tots: true }, 'Små friterade potatisbollar.');
till('curlyfries', 'Curly fries', 4, 1992, 2, { shape: 'fries', color: '#e8b040', curly: true }, 'Spiralpommes med krydda.');
till('klyftpotatis', 'Klyftpotatis', 3.5, 1995, 2, { shape: 'fries', color: '#d9a84a', wedges: true }, 'Med skalet kvar.');
till('kycklingvingar', 'Kycklingvingar', 6, 1995, 2, { shape: 'nuggets', color: '#c8602a', wings: true }, 'Sex vingar i buffalosås.');
till('sallad-skal', 'Sallad', 4, 1998, 2, { shape: 'salad', color: '#7fc44a' }, 'För den som vill ha något grönt vid sidan.');
till('mozzarellasticks', 'Mozzarellasticks', 5, 2000, 3, { shape: 'nuggets', color: '#e8c060', sticks: true }, 'Panerad ost som drar trådar.');
till('cheese-fries', 'Cheese fries', 5, 2000, 2, { shape: 'fries', color: '#f0c050', topping: ['#f0a030'] }, 'Pommes med ostsås över.');
till('nachos-skal', 'Nachos med ostsås', 5, 2000, 2, { shape: 'nachos', color: '#f0c860', topping: ['#f0a030', '#3a8a3a'] }, 'Tortillachips, ostsås och jalapeño.');
till('caesarsallad', 'Caesarsallad', 5, 2000, 2, { shape: 'salad', color: '#8ac850', bits: ['#f8f0d0', '#e0c080'] }, 'Med krutonger och parmesan.');
till('applebitar', 'Äppelbitar', 2, 2004, 1, { shape: 'salad', color: '#d8e8a0', bits: ['#e03a2a'] }, 'Barnmenyns nyttiga val.');
till('fruktbitar', 'Fruktbitar', 3, 2005, 1, { shape: 'salad', color: '#f8f0d0', bits: ['#e03a2a', '#8ab84a', '#f0c030'] }, 'Melon, druvor och äpple.');
till('waffle-fries', 'Waffle fries', 4, 2005, 2, { shape: 'fries', color: '#e8b848', waffle: true }, 'Rutiga pommes – mer yta att bli knaprig på.');
till('jalapeno-poppers', 'Jalapeño poppers', 5, 2005, 3, { shape: 'nuggets', color: '#7aa040', small: true }, 'Chili fyllda med ost och friterade.');
till('chilicheese-tops', 'Chili cheese tops', 5, 2005, 3, { shape: 'nuggets', color: '#d8a040', small: true }, 'Små friterade ostbollar med chili.');
till('gronsaksstavar', 'Grönsaksstavar med dipp', 3, 2008, 2, { shape: 'sticks', colors: ['#f08a2a', '#9ad06a', '#e8e0a0'] }, 'Morot, gurka och paprika.');
till('falafelbollar', 'Falafelbollar', 4, 2008, 2, { shape: 'nuggets', color: '#a8823a', tots: true }, 'Sex bollar med tahini.');
till('sotpotatis', 'Sötpotatispommes', 5, 2012, 3, { shape: 'fries', color: '#e07a3a' }, 'Orange och söta.');
till('poutine', 'Poutine', 7, 2012, 3, { shape: 'fries', color: '#f0c050', topping: ['#8a5a3a', '#f8f4e8'] }, 'Pommes med ostkorn och brun sås – från Québec.');
till('rostade-rotfrukter', 'Rostade rotfrukter', 5, 2012, 3, { shape: 'nuggets', color: '#e08a3a' }, 'Morot, palsternacka och rödbeta.');
till('loaded-fries', 'Loaded fries', 7, 2014, 3, { shape: 'fries', color: '#f0c050', topping: ['#f0a030', '#b8443a', '#5aa85a'] }, 'Ost, bacon och gräslök över pommesen.');
till('asiatisk-kalsallad', 'Asiatisk kålsallad', 4, 2014, 3, { shape: 'salad', color: '#e8f0d8', bits: ['#a03a8a', '#f08a2a'] }, 'Med sesam och lime.');
till('edamame', 'Edamame', 4, 2015, 3, { shape: 'salad', color: '#7ab84a', bits: ['#a8d878'] }, 'Sojabönor med flingsalt.');
till('zucchini-fries', 'Zucchinipommes', 5, 2015, 3, { shape: 'nuggets', color: '#b8c860', sticks: true }, 'Panerade zucchinistavar.');
till('parmesan-pommes', 'Parmesanpommes', 6, 2016, 3, { shape: 'fries', color: '#f0c050', topping: ['#f8f0d0'] }, 'Med riven parmesan och persilja.');
till('halloumi-fries', 'Halloumi fries', 7, 2017, 3, { shape: 'nuggets', color: '#f0e2b0', sticks: true }, 'Friterade halloumistavar.');
till('tryffelpommes', 'Tryffelpommes', 8, 2018, 4, { shape: 'fries', color: '#f0c050', truffle: true }, 'Med tryffelolja och parmesan.');
till('kimchi-fries', 'Kimchi fries', 8, 2019, 4, { shape: 'fries', color: '#f0c050', topping: ['#d84a3a', '#f0a030'] }, 'Pommes med kimchi och ostsås.');

// ---------- Drycker (säljs även över disk; hype = [lansering, topp, utfasning]) ----------
const dryck = (id, name, cost, hype, tier, look, desc) => P.push({ cat: 'dryck', id, name, cost, year: hype[0], until: Math.min(LAST_YEAR, hype[2]), hype, tier, brand: '', desc, look: { shape: 'cup', ...look } });
dryck('cola', 'Cola', 2, [1955, 1990, 2026], 1, { color: '#3a1a12', cup: '#c92a2a' }, 'Den klassiska brunburken.');
dryck('cubacola', 'Cuba Cola', 2, [1955, 1965, 2026], 1, { color: '#3a1a12', cup: '#c8d0d8', bottle: true }, 'Svensk cola – äldre än den amerikanska här.');
dryck('sockerdricka', 'Sockerdricka', 2, [1955, 1965, 1992], 1, { color: '#e8f0e0', cup: '#4a9a3a', bottle: true }, 'Svensk klassiker i glasflaska.');
dryck('julmust', 'Julmust', 2, [1955, 1990, 2026], 1, { color: '#3a1a12', cup: '#c82020', bottle: true }, 'Slår cola varje december.');
dryck('paronsoda', 'Päronsoda', 2, [1955, 1975, 2026], 1, { color: '#e8f0c0', cup: '#7ab84a', bottle: true }, 'Grön flaska, söt päronsmak.');
dryck('trocadero', 'Trocadero', 2, [1955, 1985, 2026], 1, { color: '#f0a020', cup: '#f0a020', bottle: true }, 'Apelsin och äpple – Norrlands nationaldryck.');
dryck('pommac', 'Pommac', 2.5, [1955, 1970, 2015], 1, { color: '#f0d888', cup: '#f0d888', bottle: true }, 'Fin läsk lagrad på ekfat.');
dryck('champis', 'Champis', 2.5, [1955, 1970, 2026], 1, { color: '#f8f0c8', cup: '#f0d040', bottle: true }, 'Festläsken sedan 1918.');
dryck('mjolk', 'Mjölk', 1.5, [1955, 1970, 2026], 1, { color: '#f8f8f4', glass: true }, 'Ett glas kall mjölk.');
dryck('te', 'Te', 1.5, [1955, 1975, 2026], 1, { color: '#c88a3a', cup: '#f4f1ea', hot: true }, 'Svart te med socker.');
dryck('milkshake-vanilj', 'Vaniljmilkshake', 4, [1955, 1962, 2026], 2, { color: '#f4ecd0', cup: '#f4f1ea', shake: true }, 'Tjock nog för sugrör.');
dryck('milkshake-jordgubb', 'Jordgubbsmilkshake', 4, [1955, 1962, 2026], 2, { color: '#f2c8d8', cup: '#f4f1ea', shake: true }, 'Rosa och söt.');
dryck('kaffe', 'Kaffe', 2, [1955, 1975, 2026], 1, { color: '#3a2214', cup: '#f4f1ea', hot: true }, 'Svart bryggkaffe.');
dryck('varmchoklad', 'Varm choklad', 2.5, [1955, 1970, 2026], 1, { color: '#6a3a22', cup: '#f4f1ea', hot: true }, 'Med grädde på.');
dryck('lattol', 'Lättöl', 2.5, [1955, 1980, 2026], 1, { color: '#e8b830', cup: '#f4e0a0', bottle: true }, 'Klass I – till burgaren.');
dryck('milkshake-choklad', 'Chokladmilkshake', 4, [1958, 1965, 2026], 2, { color: '#8a5a3a', cup: '#f4f1ea', shake: true }, 'Mörk och mustig.');
dryck('apelsinlask', 'Apelsinläsk', 2, [1960, 1985, 2026], 1, { color: '#f0902a', cup: '#f0902a' }, 'Orange och bubblig.');
dryck('loranga', 'Loranga', 2, [1960, 1990, 2026], 1, { color: '#f0902a', cup: '#f0a030', bottle: true }, 'Apelsinläsk med fruktkött.');
dryck('lemonad', 'Lemonad', 2, [1960, 1975, 2026], 1, { color: '#f4f0a0', cup: '#f4f1ea', bottle: true }, 'Citron och socker.');
dryck('lemon-lime', 'Lemon-lime-läsk', 2, [1960, 1990, 2026], 1, { color: '#e8f8e0', cup: '#4aa84a' }, 'Klar och frisk.');
dryck('milkshake-banan', 'Bananmilkshake', 4, [1965, 1980, 2026], 2, { color: '#f0e8a0', cup: '#f4f1ea', shake: true }, 'Gul och krämig.');
dryck('chokladmjolk', 'Chokladmjölk', 2, [1965, 1990, 2026], 1, { color: '#a87858', glass: true }, 'Kall chokladmjölk i glas.');
dryck('zingo', 'Zingo', 2, [1965, 1995, 2026], 1, { color: '#f0902a', cup: '#2a8a3a', bottle: true }, 'Apelsinläsk med tigern på etiketten.');
dryck('fruktdryck', 'Fruktdryck', 2, [1970, 1985, 2010], 1, { color: '#e85a3a', cup: '#f4f1ea', box: true }, 'I tetra med sugrör.');
dryck('ginger-ale', 'Ginger ale', 2.5, [1970, 1985, 2026], 1, { color: '#f0d888', cup: '#4a7a3a', bottle: true }, 'Ingefärsläsk.');
dryck('milkshake-mint', 'Mintchokladmilkshake', 4, [1975, 1990, 2026], 2, { color: '#a8e0b8', cup: '#f4f1ea', shake: true }, 'Grön och sval.');
dryck('rootbeer', 'Root beer', 3, [1975, 1985, 2026], 2, { color: '#4a2a18', cup: '#8a5a3a' }, 'Amerikansk läsk med smak av rotbark.');
dryck('apelsinjuice', 'Apelsinjuice', 3, [1975, 2000, 2026], 1, { color: '#f0a030', glass: true }, 'Nypressad.');
dryck('appeljuice', 'Äppeljuice', 3, [1980, 2000, 2026], 1, { color: '#e8d060', cup: '#8ab84a', box: true }, 'I liten tetra – barnmenyns dryck.');
dryck('slush', 'Slush (blå)', 3, [1985, 2000, 2026], 2, { color: '#3a8ae0', slush: true }, 'Krossad is med sirap – tungan blir blå.');
dryck('milkshake-kola', 'Kolamilkshake', 4, [1985, 2000, 2026], 2, { color: '#d8a060', cup: '#f4f1ea', shake: true }, 'Med kolasås i botten.');
dryck('slush-jordgubb', 'Slush jordgubb', 3, [1988, 2005, 2026], 2, { color: '#e83a6a', slush: true }, 'Röd och iskall.');
dryck('mineralvatten', 'Mineralvatten', 2, [1990, 2005, 2026], 1, { color: '#dce8f0', cup: '#7ab0d8', bottle: true }, 'Bubbelvatten på flaska.');
dryck('sportdryck', 'Sportdryck', 3, [1990, 2005, 2026], 2, { color: '#8ad0f0', cup: '#3060c0', bottle: true }, 'Blå och salt-söt.');
dryck('korsbarscola', 'Körsbärscola', 2.5, [1990, 2005, 2026], 1, { color: '#5a1a1a', cup: '#8a1a2a', can: true }, 'Cola med körsbär.');
dryck('exotisk-lask', 'Exotisk fruktläsk', 2, [1990, 2005, 2026], 1, { color: '#f0c030', cup: '#f0902a', can: true }, 'Ananas, mango och passion.');
dryck('citruslask', 'Citrusläsk (grön)', 2, [1995, 2010, 2026], 1, { color: '#d8f040', cup: '#3a8a3a', can: true }, 'Neongrön med extra koffein.');
dryck('cider-af', 'Alkoholfri cider', 3, [1995, 2010, 2026], 2, { color: '#e8d870', cup: '#c8a030', bottle: true }, 'Päron eller äpple.');
dryck('iste', 'Iste', 3, [2000, 2010, 2026], 2, { color: '#c8823a', cup: '#f4f1ea', ice: true }, 'Sött te på is.');
dryck('latte', 'Caffè latte', 3, [2000, 2015, 2026], 2, { color: '#c8a078', cup: '#f4f1ea', hot: true }, 'Espresso och skummad mjölk.');
dryck('milkshake-kaka', 'Kakmilkshake', 4.5, [2000, 2012, 2026], 2, { color: '#d8d8d8', cup: '#f4f1ea', shake: true }, 'Med krossade chokladkakor.');
dryck('energidryck', 'Energidryck', 4, [2005, 2015, 2026], 2, { color: '#d8e83a', cup: '#1a1a1e', can: true }, 'Koffein och taurin.');
dryck('iskaffe', 'Iskaffe (frappé)', 4, [2005, 2015, 2026], 2, { color: '#a87858', cup: '#f4f1ea', ice: true }, 'Kaffe, mjölk och is – mixat.');
dryck('cola-zero', 'Cola utan socker', 2, [2006, 2015, 2026], 1, { color: '#3a1a12', cup: '#1a1a1e', can: true }, 'Samma smak, noll socker.');
dryck('vitaminvatten', 'Vitaminvatten', 3, [2008, 2016, 2026], 2, { color: '#e8a0d0', cup: '#f0f0f0', bottle: true }, 'Rosa vatten med vitaminer.');
dryck('smoothie', 'Smoothie', 5, [2012, 2018, 2026], 3, { color: '#c84a8a', cup: '#f4f1ea' }, 'Mixad frukt och bär.');
dryck('rosa-lemonad', 'Rosa lemonad', 3, [2012, 2020, 2026], 2, { color: '#f0a0c0', cup: '#f4f1ea', ice: true }, 'Med hallon – instagramvänlig.');
dryck('milkshake-lakrits', 'Lakritsmilkshake', 5, [2012, 2018, 2026], 3, { color: '#4a4a4a', cup: '#f4f1ea', shake: true }, 'Salt lakrits – bara i Norden.');
dryck('bubble-tea', 'Bubble tea', 5, [2015, 2022, 2026], 3, { color: '#d8b090', pearls: true }, 'Mjölkte med tapiokapärlor.');
dryck('smakvatten', 'Kolsyrat vatten med smak', 2, [2015, 2022, 2026], 1, { color: '#e8f0f8', cup: '#a0d0e0', can: true }, 'Hallon eller citron, inget socker.');
dryck('energi-zero', 'Energidryck utan socker', 4, [2015, 2022, 2026], 2, { color: '#d8e83a', cup: '#f0f0f0', can: true }, 'Gymmets favorit.');
dryck('cold-brew', 'Cold brew', 4, [2016, 2022, 2026], 3, { color: '#3a2214', cup: '#3a2a2a', can: true }, 'Kallbryggt i 18 timmar.');
dryck('proteinshake', 'Proteinshake', 5, [2016, 2022, 2026], 3, { color: '#e8e0d0', cup: '#2a2a2a', bottle: true }, 'Choklad, 30 g protein.');
dryck('craftsoda', 'Hantverksläsk', 5, [2018, 2022, 2026], 3, { color: '#e07a3a', cup: '#3a2a2a', bottle: true }, 'Rabarber & ingefära från ett litet bryggeri.');
dryck('matcha-latte', 'Iced matcha latte', 5, [2018, 2023, 2026], 3, { color: '#8ac860', cup: '#f4f1ea', ice: true }, 'Grönt tepulver och mjölk på is.');
dryck('ingefarsshot', 'Ingefärsshot', 3, [2018, 2023, 2026], 3, { color: '#f0c040', cup: '#f0f0f0', bottle: true }, 'Liten men stark.');
dryck('havrelatte', 'Havrelatte', 4, [2019, 2024, 2026], 3, { color: '#d0b088', cup: '#f4f1ea', hot: true }, 'Latte på havredryck.');
dryck('kombucha', 'Kombucha', 5, [2019, 2023, 2026], 3, { color: '#c8a040', cup: '#f4f1ea', bottle: true }, 'Fermenterat te med bubblor.');

// ---------- Efterrätter (säljs över disk; form = hur den ritas) ----------
const dessert = (id, name, cost, hype, tier, look, desc) => P.push({ cat: 'dessert', id, name, cost, year: hype[0], until: Math.min(LAST_YEAR, hype[2]), hype, tier, brand: '', desc, look: { shape: 'dessert', ...look } });
dessert('applepaj', 'Äppelpaj', 4, [1955, 1970, 2026], 1, { form: 'wedge', color: '#d8a050', top: '#f0d090' }, 'Varm, med vaniljsås.');
dessert('kanelbulle', 'Kanelbulle', 2, [1955, 1980, 2026], 1, { form: 'bun', color: '#d8a050', top: '#8a5a3a' }, 'Med pärlsocker.');
dessert('chokladboll', 'Chokladboll', 1.5, [1955, 1975, 2026], 1, { form: 'ball', color: '#5a3a2a', top: '#f4f0e0' }, 'Rullad i kokos.');
dessert('munk', 'Sockermunk', 2, [1955, 1975, 2026], 1, { form: 'ring', color: '#e8b060', top: '#f8f4f0' }, 'Friterad och rullad i socker.');
dessert('kulglass', 'Kulglass i strut', 3, [1955, 1985, 2026], 1, { form: 'scoops', color: '#f8f0d8', top: '#f0a0c0' }, 'Vanilj och jordgubb.');
dessert('mazarin', 'Mazarin', 2.5, [1955, 1975, 2026], 1, { form: 'slab', color: '#f0e0b0', top: '#f8f4f0' }, 'Mandelmassa med vit glasyr.');
dessert('mjukglass', 'Mjukglass', 3, [1960, 1980, 2026], 1, { form: 'cone', color: '#f8f4e8', cone: '#d8a050' }, 'Snurrad i strut.');
dessert('isglass', 'Isglass på pinne', 2, [1960, 1985, 2026], 1, { form: 'stick', color: '#f08a2a' }, 'Apelsin – smälter fort.');
dessert('dammsugare', 'Dammsugare', 2.5, [1960, 1985, 2026], 1, { form: 'roll', color: '#5ab86a', top: '#4a2a1a' }, 'Grön marsipan med chokladändar.');
dessert('kulglass-choklad', 'Chokladkulglass', 3, [1960, 1985, 2026], 1, { form: 'scoops', color: '#5a3a2a', top: '#8a5a3a' }, 'Två kulor choklad.');
dessert('sundae', 'Sundae med chokladsås', 4, [1965, 1985, 2026], 2, { form: 'cup', color: '#f8f4e8', top: '#6a3a22' }, 'Glass i bägare med sås och strössel.');
dessert('banana-split', 'Banana split', 5, [1965, 1985, 2026], 2, { form: 'split', color: '#f8f0d8', top: '#6a3a22' }, 'Banan, tre kulor glass och sås.');
dessert('chokladpudding', 'Chokladpudding', 3, [1965, 1985, 2026], 1, { form: 'cup', color: '#5a3a2a', top: '#f8f4f0' }, 'Med vispad grädde.');
dessert('mjukglass-strossel', 'Mjukglass med strössel', 3, [1970, 1990, 2026], 1, { form: 'cone', color: '#f8f4e8', cone: '#d8a050', sprinkles: true }, 'Regnbågsströssel.');
dessert('sundae-kola', 'Sundae med kolasås', 4, [1970, 1990, 2026], 2, { form: 'cup', color: '#f8f4e8', top: '#d8a050' }, 'Vaniljglass och varm kolasås.');
dessert('kladdkaka', 'Kladdkaka', 3, [1975, 2000, 2026], 1, { form: 'wedge', color: '#3a2018', top: '#f8f4f0' }, 'Kladdig i mitten – med grädde.');
dessert('vaffla', 'Våffla med glass', 4, [1975, 1995, 2026], 2, { form: 'waffle', color: '#e8b860', top: '#f8f0d8' }, 'Frasvåffla med glass och sylt.');
dessert('piggelin', 'Päronglass på pinne', 2.5, [1980, 2000, 2026], 1, { form: 'stick', color: '#7ad84a' }, 'Grön och svalkande.');
dessert('fruktsallad', 'Fruktsallad', 3, [1980, 1995, 2026], 1, { form: 'cup', color: '#f8f0d0', top: '#e03a2a' }, 'Med en klick grädde.');
dessert('cookie', 'Chocolate chip cookie', 3, [1985, 2000, 2026], 1, { form: 'disc', color: '#c89050', top: '#4a2a18' }, 'Stor och seg.');
dessert('glass-dipp', 'Mjukglass med chokladdipp', 3.5, [1985, 2000, 2026], 2, { form: 'cone', color: '#f8f4e8', cone: '#d8a050', dip: '#4a2a1a' }, 'Doppad i choklad som stelnar.');
dessert('donut', 'Donut', 3, [1990, 2005, 2026], 2, { form: 'ring', color: '#e8a860', top: '#e05a8a' }, 'Med rosa glasyr.');
dessert('glasspinne-choklad', 'Chokladglass på pinne', 4, [1990, 2010, 2026], 2, { form: 'stick', color: '#4a2a1a', inner: '#f8f4e8' }, 'Vaniljglass i chokladskal.');
dessert('glass-godis', 'Glass med krossat godis', 4, [1995, 2010, 2026], 2, { form: 'cup', color: '#f8f4e8', top: '#e04a8a' }, 'Vaniljglass mixad med godis.');
dessert('muffins', 'Muffins', 3, [1998, 2010, 2026], 2, { form: 'muffin', color: '#c89050', top: '#4a2a18' }, 'Chokladmuffins.');
dessert('brownie', 'Brownie', 4, [2000, 2012, 2026], 2, { form: 'slab', color: '#4a2a18', top: '#6a3a22' }, 'Kladdig chokladkaka.');
dessert('tiramisu', 'Tiramisu', 5, [2000, 2012, 2026], 3, { form: 'slab', color: '#f0e4c8', top: '#5a3a2a' }, 'Kaffe, mascarpone och kakao.');
dessert('cheesecake', 'Cheesecake', 5, [2005, 2015, 2026], 3, { form: 'wedge', color: '#f4ecd0', top: '#c8402a' }, 'New York-stil med bärsås.');
dessert('pannacotta', 'Pannacotta', 5, [2005, 2015, 2026], 3, { form: 'cup', color: '#f8f4ec', top: '#c82a3a' }, 'Italiensk gräddpudding med hallon.');
dessert('sorbet', 'Sorbet', 4, [2008, 2018, 2026], 2, { form: 'cup', color: '#f8f4ec', top: '#e85a3a' }, 'Mango – mjölkfri.');
dessert('cupcake', 'Cupcake', 4, [2010, 2016, 2026], 2, { form: 'muffin', color: '#e8c090', top: '#f0a0c0' }, 'Med rosa smörkräm.');
dessert('froyo', 'Frozen yoghurt', 4, [2010, 2018, 2026], 2, { form: 'cup', color: '#f8f8f4', top: '#8ab84a' }, 'Med kiwi och granola.');
dessert('macarons', 'Macarons', 5, [2012, 2018, 2026], 3, { form: 'macaron', color: '#f0a0c0', top: '#a8d8a0' }, 'Tre franska mandelkakor.');
dessert('brownie-glass', 'Brownie med glass', 6, [2012, 2020, 2026], 3, { form: 'slab', color: '#4a2a18', top: '#f8f4e8', scoop: true }, 'Varm brownie, kall glass.');
dessert('cronut', 'Cronut', 5, [2013, 2018, 2026], 3, { form: 'ring', color: '#e8b060', top: '#f0d0e0' }, 'Croissant möter donut – New York 2013.');
dessert('churros', 'Churros', 4, [2015, 2020, 2026], 3, { form: 'sticks', color: '#d8a050', top: '#8a5a3a' }, 'Friterade och doppade i choklad.');
dessert('cinnamon-roll', 'Amerikansk cinnamon roll', 4, [2015, 2022, 2026], 2, { form: 'bun', color: '#d8a050', top: '#f8f4f0' }, 'Jättebulle med cream cheese-glasyr.');
dessert('mochi', 'Mochiglass', 5, [2019, 2024, 2026], 3, { form: 'ball', color: '#a8d8a0', top: '#f0a0c0' }, 'Japansk risdegsboll med glass inuti.');

export const PARTS = P;
export const PART = Object.fromEntries(P.map((p) => [p.id, p]));
export const DB = { parts: P, part: PART };
export const onSale = (year) => P.filter((p) => year >= p.year && year <= p.until);

// höjd i lager (byggenheter) – används av byggreglerna och grafiken
export function layerHeight(p) {
  const L = p.look || {};
  switch (L.shape) {
    case 'bun': return L.flat || L.lettuce || L.square ? 0.5 : L.mini ? 0.7 : 1.0;
    case 'patty': return L.h || 0.7;
    case 'cheese': return 0.22;
    case 'strips': return L.h || 0.3;
    case 'egg': return 0.45;
    case 'rings': return L.h || 0.5;
    case 'avocado': return 0.35;
    case 'leaf': return 0.55;
    case 'slice': return L.small ? 0.3 : 0.4;
    case 'onion': return L.soft ? 0.3 : 0.4;
    case 'pickles': return 0.35;
    case 'sauce': return 0.2;
    case 'chunky': return 0.45;
    case 'square': return L.h || 0.4;
    case 'herb': return 0.12;
    case 'drizzle': return 0.1;
  }
  return 0.3;
}
export const bunTopHeight = (p) => (p?.look?.flat || p?.look?.lettuce || p?.look?.square ? 0.6 : p?.look?.mini ? 1.2 : p?.look?.bao ? 1.3 : 1.7);
export const burgerRadius = (p) => (p?.look?.mini ? 2.2 : 3.0);

// Beskrivning i listor
export const KIND_NAME = { not: 'nötkött', kalv: 'kalv', fisk: 'fisk & skaldjur', kyckling: 'fågel', vego: 'vegetariskt', lamm: 'lamm', flask: 'fläsk', vilt: 'vilt' };
export function specLine(p) {
  const L = p.look || {};
  const from = `${p.year}–`;
  switch (p.cat) {
    case 'brod': return `${L.sesame ? 'sesam · ' : ''}${L.gloss ? 'blankt · ' : ''}${L.mini ? 'mini · ' : ''}${L.flat ? 'platt · ' : ''}${L.novelty || L.square ? 'special · ' : ''}${from}`;
    case 'biff': return `${KIND_NAME[L.kind] || ''} · ${from}`;
    case 'ost': return `${L.melt ? 'smälter' : 'smälter inte'} · ${from}`;
    case 'dryck': return `${L.bottle ? 'flaska' : L.can ? 'burk' : L.shake ? 'stor mugg' : L.hot ? 'kopp' : L.box ? 'tetra' : L.glass ? 'glas' : 'mugg'} · het ${p.hype[0]}–${p.hype[2]}`;
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
