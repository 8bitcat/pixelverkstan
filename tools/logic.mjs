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
      // bygg i slot-ordning; valfria delar: välj första kompatibla
      const b = { placed: {}, acts: new Set(['paste']), cables: new Set() };
      const parts = o.items.map((it) => it.part ? shop.part[it.part] : null);
      let fail = null;
      for (const slot of L.SLOTS) {
        const idx = o.items.findIndex((it, j) => !parts[j]?.__used && (parts[j] ? L.slotsFor(parts[j]).includes(slot) : it.cat === slot.cat && slot.id !== 'bay'));
        if (idx < 0) continue;
        let part = parts[idx];
        if (!part) {
          part = shop.parts.find((p) => p.cat === slot.cat && L.canPlace(slot, p, b).ok && (slot.cat !== 'case' || p.fits.includes(shop.part[o.items.find((x) => x.cat === 'mb').part].size)) && stock[p.id] && (slot.cat !== 'psu' || p.watt >= (shop.part[o.items.find((x) => x.cat === 'cpu').part].watt + (o.items.find((x) => x.cat === 'gpu') ? shop.part[o.items.find((x) => x.cat === 'gpu').part].watt : 0) + 150)) && (slot.cat !== 'cooler' || p.maxW >= (b.placed.cpu?.watt || 0)));
          if (!part) { fail = `inget valbart för ${slot.id}`; break; }
        }
        const r = L.canPlace(slot, part, b);
        if (!r.ok) { fail = `${slot.id}: ${r.msg}`; break; }
        b.placed[slot.id] = part;
        parts[idx] = { ...part, __used: true };
      }
      const placedCount = Object.keys(b.placed).length;
      if (!fail && placedCount !== o.items.length) fail = `placerade ${placedCount}/${o.items.length}`;
      if (!fail) { const boot = L.bootCheck(b); if (boot.length) fail = boot.join(' '); }
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
