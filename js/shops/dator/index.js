// Datorbutiken – samlar allt som är specifikt för just den här verksamheten.
// En ny verksamhet (restaurang, bilverkstad …) exporterar samma form.
import * as catalog from './catalog.js';
import * as layout from './layout.js';
import * as orders from './orders.js';
import { iconCanvas } from './art.js';
import { Desk } from './desk.js';

export default {
  id: 'dator',
  name: 'Datorbutiken',
  sign: 'DATORBUTIKEN',
  product: 'dator',
  worker: 'datorbyggare',
  theme: { wall: '#3d5a80', wallDark: '#2c4463', floorA: '#e9e1d2', floorB: '#d8ccb6', counter: '#9e1b22', neon: '#7ee8fa' },
  // glasmontrar på butiksgolvet (kategorier ur lagret) + stjärnobjektet i egen monter
  showcases: [
    { cat: 'gpu', title: 'Grafikkort' },
    { cat: 'cpu', title: 'Processorer' },
    { cat: 'ram', title: 'RAM-minnen' },
  ],
  hero: 'astral-5080',
  cats: catalog.CATS,
  catOrder: catalog.CAT_ORDER,
  parts: catalog.PARTS,
  part: catalog.PART,
  levels: catalog.LEVELS,
  specLine: catalog.specLine,
  retail: catalog.retail,
  icon: iconCanvas,
  layout,
  Finale: Desk,
  start: orders.START,
  tutorialOrder: orders.tutorialOrder,
  tutorialCount: orders.TUTORIAL_COUNT,
  generateOrder: orders.generateOrder,
  priceFor: orders.priceFor,
  xpFor: orders.xpFor,
  feeFor: orders.feeFor,
};
