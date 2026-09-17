// Tillfälliga testdelar (moderkort, grafikkort, ljudkort) för att prova klassiska
// byggen innan hela databasen finns. node tools/era-fixture.mjs [år …]
import { loadParts, DB } from '../js/shops/dator/parts/index.js';

import { FIX } from './fixture-parts.js';

await loadParts(); globalThis.__fixture = true;
for (const p of FIX) { if (!DB.part[p.id]) { DB.parts.push(p); DB.part[p.id] = p; } }
for (const [y, list] of DB.byYear) for (const p of FIX) if (p.year <= y && p.until >= y && !list.includes(p)) list.push(p);
const years = process.argv.slice(2);
process.argv = [process.argv[0], process.argv[1], ...years];
await import('./era-faults.mjs');
