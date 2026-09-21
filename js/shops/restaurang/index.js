// Hamburgerbaren – samlar allt som är specifikt för restaurangen. Samma form som
// shops/dator/index.js, så att motorn (kunder, lager, byggvyn, inredning, 3D) fungerar rakt av.
import * as menu from './menu.js';
import * as rig from './rig.js';
import * as orders from './orders.js';
import * as upgrades from './upgrades.js';
import * as products from './products.js';
import { iconCanvas } from './art.js';
import { Serving, judge } from './serve.js';
import * as floorArt from './floor-art.js';
import { PLANS as FLOOR_PLANS } from './floor-plans.js';

export default {
  id: 'restaurang',
  name: 'Hamburgerbaren',
  sign: 'HAMBURGERBAREN',
  product: 'burgare',
  worker: 'kock',
  theme: { wall: '#c94a3a', wallDark: '#9a2f24', floorA: '#f2efe6', floorB: '#2a2a30', counter: '#e8e4dc', neon: '#ff6f9c', workshopSign: 'KÖKET' },
  // läskkylen står framme från start; dessertdisken köps
  showcases: [],                    // inga hyllor i dinern – drycken tappas upp och pommesen friteras i köket
  hero: null,
  // stjärnobjektet i montern och på affischen: årets finaste biff
  heroFor: (game) => [...menu.onSale(game.year).filter((p) => p.cat === 'biff')].sort((a, b) => b.cost - a.cost)[0] || null,
  floorArt,
  floorPlans: FLOOR_PLANS,          // matbord i stället för stjärnmonter och soffa
  themeFor: floorArt.themeFor,      // epoken bestämmer färger och stil
  dineIn: true,                     // kunderna sätter sig och äter efter att de hämtat brickan
  // måltiden som byggdes: lagren i stapelordning, pommes, dryck och efterrätt – följer med kunden till bordet
  mealOf(order) {
    const b = order.build, L = rig.rigFor(order);
    const placed = b?.placed || {};
    const stack = L.SLOTS.filter((s) => s.k !== undefined);
    const layers = stack.map((s) => placed[s.id]?.id || s.part?.id).filter(Boolean);
    const side = (id, cat) => placed[id]?.id || order.items.find((it) => it.cat === cat)?.part || null;
    return { layers, pommes: side('pommes', 'tillbehor'), dryck: side('dryck', 'dryck'), dessert: side('dessert', 'dessert'), tray: true, year: order.year };
  },
  // 3D: måltiden ritas med kökets voxlar där den står (luckan, händerna, bordet) och äts upp tugga för tugga
  drawMeal: rig.drawMeal,
  mealAnchor: rig.mealAnchor,
  judge,                            // kundens omdöme om en bricka (tid, kladd, golv) – används när den lämnas för hand i 3D
  // 3D: brickan och det som står på den som egna föremål man kan ta, bära, ställa ner och kasta.
  // Varje del ritas av riggen (samma voxlar som på bänken) kring sin egen fot; måtten är i byggenheter.
  carryKit(order) {
    const L = rig.rigFor(order), b = order.build, P = rig.TRAY_PARTS;
    if (!b) return null;
    const parts = [{ kind: 'tray', ...P.tray }];
    if (b.placed.l0) parts.push({ kind: 'burger', ...P.burger });
    for (const k of ['pommes', 'dryck', 'dessert']) if (b.placed[k]) parts.push({ kind: k, ...P[k] });
    const names = { tray: 'brickan', burger: 'burgaren', pommes: (b.placed.pommes?.name || 'tillbehöret').toLowerCase(), dryck: (b.placed.dryck?.name || 'drycken').toLowerCase(), dessert: (b.placed.dessert?.name || 'efterrätten').toLowerCase() };
    return { parts: parts.map((p) => ({ ...p, name: names[p.kind], draw: (R) => L.drawTrayScene(R, b, { only: p.kind }) })) };
  },
  kitchen3d: true,                  // i 3D byggs burgaren i köket bakom disken med fri kamera – ingen låst byggbild
  fit: upgrades,
  products,
  isProduct: products.isProduct,
  hypeAt: products.hypeAt,
  productCats: [],                  // inget säljs över disk – allt går via köket
  cats: menu.CATS,
  catOrder: menu.CAT_ORDER,
  get parts() { return menu.DB.parts; },
  get part() { return menu.DB.part; },
  onSale: menu.onSale,
  eraOf: menu.eraOf,
  firstYear: menu.FIRST_YEAR,
  lastYear: menu.LAST_YEAR,
  defaultStartYear: 1955,
  startYears: [
    { year: 1955, title: 'Femtiotalsdinern', desc: 'Cheeseburgare, milkshake och jukebox' },
    { year: 1965, title: 'Bacon och fisk', desc: 'Baconburgare, fiskburgare och sockerdricka' },
    { year: 1975, title: 'Grillkiosken', desc: 'Kioskburgare, fläskfärs och lättöl' },
    { year: 1985, title: 'Kycklingburgarens tid', desc: 'Panerad kyckling, Hawaii och Texas BBQ' },
    { year: 1996, title: 'Snabbmatskedjan', desc: 'Vego, trippel, chili cheese och curly fries' },
    { year: 2005, title: 'Vego och aioli', desc: 'Mexicana, räkburgare och blåmögelost' },
    { year: 2016, title: 'Gourmetburgaren', desc: 'Smash, brioche, tryffel och svart bröd' },
    { year: 2022, title: 'Smash och plantbaserat', desc: 'Dry aged, koreanska och plantburgare' },
  ],
  levels: menu.LEVELS,
  specLine: menu.specLine,
  partTag: () => '',
  retail: menu.retail,
  icon: iconCanvas,
  layout: rig,
  Finale: Serving,
  start: orders.START,
  starterKit(game) {
    const kit = game.startInfo?.kit || {};
    return Object.entries(kit).map(([id, n]) => [id, Math.max(0, n - game.stockFree(id) - game.incoming(id))]).filter(([id, n]) => n > 0 && menu.DB.part[id] && menu.onSale(game.year).includes(menu.DB.part[id]) && (!game.canSell || game.canSell(menu.DB.part[id])));
  },
  startFor: orders.startFor,
  tutorialOrder: orders.tutorialOrder,
  tutorialCount: orders.TUTORIAL_COUNT,
  generateOrder: orders.generateOrder,
  replacementFor: orders.replacementFor,
  fixOrder: orders.fixOrder,
  fitsWith: orders.fitsWith,
  priceFor: orders.priceFor,
  xpFor: orders.xpFor,
  feeFor: orders.feeFor,
  optsFor: orders.optsFor,
  // texter i den generiska byggvyn och dialogerna
  text: {
    signSale: 'MENY', signTag: 'ALLTID NYGRILLAT', benchSign: 'KÖKSBÄNK',
    kitDesc: 'råvaror till dina första gästers burgare, pommes och läsk – allt i en låda.', searchHint: 'Sök ingrediens, kött, sås …', resultParts: 'Mat + tillagning', resultTime: 'Tillagning', emptyUnit: 'TOMT',
    thing: 'burgare', things: 'burgare', place: 'köket', thisThing: 'den här burgaren', guideFace: '🧑‍🍳',
    hint3d: 'laga maten vid köksbänken bakom disken · ta brickan och bär ut den', benchName: 'Köksbänken', benchVerb: 'laga',
    workshopHover: 'Köket – maten lagas vid köksbänken bakom disken', workshopToast: 'Maten lagas vid köksbänken bakom disken – gå dit och klicka.',
    swapBtn: '📦 Byt råvara ur lagret', swapNote: 'Gästen betalar för det som ligger på burgaren – finare råvaror ger mer betalt.',
    workshopTab: '🍳 Kök', newsTitle: '📰 Branschnytt:', decadeTitle: 'Decenniets hamburgerbar',
    alreadyIn: 'ligger redan på burgaren', alreadyInToast: 'Den ligger redan på burgaren – ta av den först.',
    yearQ: 'Vilket år öppnar du hamburgerbaren? Åren går framåt när du lagar burgare – och grossisten säljer bara råvaror som fanns just då.',
    coopDo: 'laga burgare tillsammans – ni ser varandras muspekare i köket',
    modeTitle: 'Välj läge i köket', modeVerb: 'laga', modeHelp: 'Markeringar visar var allt ska ligga, checklista steg för steg och förklaringar när något blir fel.', modePro: 'Inga markeringar eller tips. Du får själv veta ordningen: rosta, stek på båda sidor, krydda, fritera och bygg lagren rätt.',
    titleFor: (order, gen) => `${order.title} åt ${order.name}`,
    welcome: (name) => `Välkommen till köket! Nu bygger vi ${name}s burgare lager för lager. Följ de gula markeringarna.`,
    build: (name) => `Bygg burgaren åt ${name}. Rosta brödet, stek biffen och lägg lagren i rätt ordning.`,
    pro: 'Proffsläge! Inga markeringar. Släpp brödet på brödrosten och biffen på stekbordet, vänd den när undersidan fått färg, krydda med salt- och pepparkaret, lägg råvaran i fritöskorgen och sänk ner den, tappa upp drycken – och bygg lagren på brickan i beställningens ordning. Lämna inget för länge: det bränns.',
    dragHint: 'Dra ingredienserna från lådan till brickan.',
    standBtn: '🍽️ Servera', openBtn: '🔙 Tillbaka till köket', standStep: '🍽️ Ställ tallriken på disken', testHead: 'Servering',
    builtHint: 'Allt står på brickan! Tryck på 🍽️ Servera.', doneHint: 'Allt är klart! Tryck på <b>🍽️ Servera</b> och ställ brickan på disken.', doneHint3d: 'Allt är klart! <b>Klicka på brickan</b> för att ta den och bär ut den till kunden.',
    notAllIn: 'Allt är inte på tallriken än.', checklistFirst: 'Gör klart checklistan först (bröd, grill och lager).',
    backMsg: 'Tallriken står på arbetsytan igen.', emptyTray: 'Lådan är tom.',
    resultTitle: '🎉 Tallriken står på disken!', pickup: (name) => `${name} hämtar tallriken vid luckan och betalar.`,
    doneToast: (name) => `🍔 Tallriken står på disken – ${name} hämtar den och betalar!`,
    noBuilds: 'Inga beställningar att laga just nu – ta emot en kund vid disken först.', whichBuild: 'Vilken beställning vill du laga?',
    buildBtn: '🍳 Laga', repairBtn: '🍳 Laga', acceptedToast: 'Beställningen är mottagen – tryck på 🍳 Laga när du är redo.',
  },
};
