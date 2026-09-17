// Byggregler för datorbutiken. Varje beställning får en egen rigg (rig.js) med
// platser, handgrepp, kablar och uttag som passar datorns epok.
// core/build.js hämtar riggen med rigFor(order).
export { VIEW, MAX_K } from './geom.js';
export { CONN, connectorIcon } from './connectors.js';
export { rigFor, FACTS, fact } from './rig.js';
