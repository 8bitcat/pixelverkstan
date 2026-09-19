// Hamburgerbaren – samlar allt som är specifikt för restaurangen. Samma form som
// shops/dator/index.js, så att motorn (kunder, lager, byggvyn, inredning, 3D) fungerar rakt av.
import * as menu from './menu.js';
import * as rig from './rig.js';
import * as orders from './orders.js';
import * as upgrades from './upgrades.js';
import * as products from './products.js';
import { iconCanvas } from './art.js';
import { Serving } from './serve.js';
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
  showcases: [{ cat: 'dryck', title: 'Läskkyl' }],
  hero: null,
  // stjärnobjektet i montern och på affischen: årets finaste biff
  heroFor: (game) => [...menu.onSale(game.year).filter((p) => p.cat === 'biff')].sort((a, b) => b.cost - a.cost)[0] || null,
  floorArt,
  floorPlans: FLOOR_PLANS,          // matbord i stället för stjärnmonter och soffa
  themeFor: floorArt.themeFor,      // epoken bestämmer färger och stil
  dineIn: true,                     // kunderna sätter sig och äter efter att de hämtat brickan
  fit: upgrades,
  products,
  isProduct: products.isProduct,
  hypeAt: products.hypeAt,
  productCats: menu.PRODUCT_CATS,
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
    signSale: 'MENY', signTag: 'ALLTID NYGRILLAT', benchSign: 'KÖKSBÄNK', resultParts: 'Mat + tillagning', resultTime: 'Tillagning', emptyUnit: 'TOMT',
    thing: 'burgare', things: 'burgare', place: 'köket',
    titleFor: (order, gen) => `${order.title} åt ${order.name}`,
    welcome: (name) => `Välkommen till köket! Nu bygger vi ${name}s burgare lager för lager. Följ de gula markeringarna.`,
    build: (name) => `Bygg burgaren åt ${name}. Rosta brödet, stek biffen och lägg lagren i rätt ordning.`,
    pro: 'Proffsläge! Inga markeringar – du vet hur den ska se ut. Lycka till!',
    dragHint: 'Dra ingredienserna från lådan till brickan.',
    standBtn: '🍽️ Servera', openBtn: '🔙 Tillbaka till köket', standStep: '🍽️ Servera brickan', testHead: 'Servering',
    builtHint: 'Allt är på brickan! Tryck på 🍽️ Servera.', doneHint: 'Allt är klart! Tryck på <b>🍽️ Servera</b>.',
    notAllIn: 'Allt är inte på brickan än.', checklistFirst: 'Gör klart checklistan först (bröd, grill och lager).',
    backMsg: 'Brickan står i köket igen.', emptyTray: 'Lådan är tom.',
    resultTitle: '🎉 Kunden är nöjd!', pickup: (name) => `${name} hämtar brickan vid luckan.`,
    doneToast: (name) => `🍔 Burgaren är klar – ${name} hämtar den vid luckan!`,
    noBuilds: 'Inga beställningar att laga just nu – ta emot en kund vid disken först.', whichBuild: 'Vilken beställning vill du laga?',
    buildBtn: '🍳 Laga', repairBtn: '🍳 Laga', acceptedToast: 'Beställningen är mottagen – tryck på 🍳 Laga när du är redo.',
  },
};
