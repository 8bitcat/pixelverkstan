// Logiktest: slumpade beställningar på alla nivåer ska gå att bygga och starta.
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:8777/index.html");
const res = await page.evaluate(async () => {
  const shop = (await import('/js/shops/dator/index.js')).default;
  const L = shop.layout, out = { perLevel: {}, problems: [] };
  for (let level = 1; level <= 5; level++) {
    let ok = 0, missingSum = 0, choice = 0;
    const templates = {};
    for (let i = 0; i < 300; i++) {
      const stock = {};
      shop.parts.forEach((p) => { if (Math.random() < 0.5) stock[p.id] = 1; });
      const game = { level, stockFree: (id) => stock[id] || 0 };
      const o = shop.generateOrder(game, ['Test']);
      if (!o) { out.problems.push(`nivå ${level}: ingen order`); continue; }
      templates[o.template] = (templates[o.template] || 0) + 1;
      if (o.items.some((x) => x.choice)) choice++;
      missingSum += o.items.filter((x) => x.part && !stock[x.part]).length;
      // bygg i slot-ordning; valfria delar: välj första kompatibla i lagret
      const b = { placed: {}, acts: new Map(), cables: new Map() };
      for (const a of L.ACTIONS) b.acts.set(a.id, new Set(a.points.map((_, i) => i)));
      const parts = o.items.map((it) => it.part ? shop.part[it.part] : null);
      const used = new Set();
      let fail = null;
      const need = () => { const cpu = o.items.find((x) => x.cat === 'cpu'), gpu = o.items.find((x) => x.cat === 'gpu'); return shop.part[cpu.part].watt + (gpu ? shop.part[gpu.part].watt : 0) + 150; };
      for (const slot of L.SLOTS) {
        const idx = o.items.findIndex((it, j) => !used.has(j) && (parts[j] ? L.slotsFor(parts[j]).includes(slot) : it.cat === slot.cat && slot.id !== 'bay'));
        if (idx < 0) continue;
        let part = parts[idx];
        if (!part) {
          const mbSize = shop.part[o.items.find((x) => x.cat === 'mb').part].size;
          const cpuW = shop.part[o.items.find((x) => x.cat === 'cpu').part].watt;
          part = shop.parts.find((p) => p.cat === slot.cat && stock[p.id] && L.canPlace(slot, p, b).ok && (slot.cat !== 'case' || p.fits.includes(mbSize)) && (slot.cat !== 'psu' || p.watt >= need()) && (slot.cat !== 'cooler' || p.maxW >= cpuW));
          if (!part) { fail = `inget valbart för ${slot.id}`; break; }
        }
        const r = L.canPlace(slot, part, b);
        if (!r.ok) { fail = `${slot.id}: ${r.msg}`; break; }
        b.placed[slot.id] = part; used.add(idx);
      }
      // alla kablar ska gå att koppla till ett rätt uttag
      if (!fail) for (const c of L.CABLES) {
        if (!L.cableReady(c, b)) continue;
        const port = c.wants.find((w) => L.availablePorts(b).includes(w) && !L.portBusy(w, b));
        if (!port) { fail = `inget ledigt uttag för ${c.id}`; break; }
        const r = L.canConnect(c, port, b, true);
        if (!r.ok) { fail = `${c.id}: ${r.msg}`; break; }
        b.cables.set(c.id, port);
      }
      if (!fail && L.wattNeed(b) > b.placed.psu.watt) fail = `för svagt nätagg ${b.placed.psu.watt} < ${L.wattNeed(b)}`;
      if (!fail && b.placed.cooler.maxW < b.placed.cpu.watt) fail = 'för svag kylare';
      if (!fail && !b.placed.cpu.igpu && !b.placed.gpu) fail = 'ingen grafik';
      const placedCount = Object.keys(b.placed).length;
      if (!fail && placedCount !== o.items.length) fail = `placerade ${placedCount}/${o.items.length}`;
      if (fail) { if (out.problems.length < 12) out.problems.push(`nivå ${level} ${o.template}: ${fail}`); }
      else ok++;
    }
    out.perLevel[level] = { ok, missingAvg: +(missingSum / 300).toFixed(2), choice, templates };
  }
  return out;
});
console.log(JSON.stringify(res, null, 1));
console.log(errors.join("\n") || "inga sidfel");
await browser.close();
