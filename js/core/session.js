// Kommandon som ändrar spelet. I ensamspel och hos värden körs de direkt; en
// klient i co-op skickar dem till värden (se net.js) som kör dem och skickar
// tillbaka det nya läget. Allt som ändrar pengar, lager, kunder och beställningar
// ska gå via act().

export const COMMANDS = {
  buy: (g, { id, n = 1 }) => g.buy(id, n),
  buyMany: (g, { list }) => g.buyMany(list),
  buyMissing: (g, { customerId }) => { const c = g.customers.find((x) => x.id === customerId); return !!c && g.buyMissing(c.order); },
  unpack: (g, { box, show = true }) => g.unpack(box, show),
  setShown: (g, { id, n }) => g.setShown(id, n),
  accept: (g, { customerId }) => {
    const c = g.customers.find((x) => x.id === customerId);
    if (!c || c.phase !== 'queue') return null;
    const o = g.accept(c);
    return o ? o.id : null;   // 'sale' = såld över disk
  },
  decline: (g, { customerId }) => { const c = g.customers.find((x) => x.id === customerId); if (c && c.phase === 'queue') g.decline(c); return true; },
  // valfria delar som plockas ur lagret när man bygger
  choose: (g, { orderId, id }) => {
    const o = g.orders.find((x) => x.id === orderId);
    if (!o || !g.takeStock(id)) return false;
    o.chosen[g.shop.part[id].cat] = id;
    return true;
  },
  unchoose: (g, { orderId, id }) => {
    const o = g.orders.find((x) => x.id === orderId), p = g.shop.part[id];
    if (!o || o.chosen[p.cat] !== id || o.items.some((it) => it.part === id)) return false;
    delete o.chosen[p.cat];
    g.returnStock(id);
    return true;
  },
  // butikens inredning
  buySlot: (g, { slot, option }) => g.buySlot(slot | 0, String(option)),
  sellSlot: (g, { slot }) => g.sellSlot(slot | 0),
  buyItem: (g, { id }) => g.buyItem(String(id)),
  deskBuild: (g, { parts }) => g.deskBuild(parts || {}),
  buyArcade: (g, { id }) => g.buyArcade(String(id)),
  swapItem: (g, { customerId, orderId, index, part }) => g.swapItem({ customerId, orderId }, index | 0, String(part)),
  addItem: (g, { customerId, orderId, part }) => g.addItem({ customerId, orderId }, String(part)),
  sellArcade: (g, { i }) => g.sellArcade(i | 0),
  deskUnbuild: (g) => g.deskUnbuild(),
  // egna modeller och händelser
  createModel: (g, { spec }) => g.createModel(spec || {}),
  retireModel: (g, { id }) => g.retireModel(id | 0),
  sequelModel: (g, { id, spec }) => g.sequelModel(id | 0, spec || {}),
  buyForModel: (g, { id, n = 1 }) => g.buyForModel(id | 0, n | 0),
  chooseEvent: (g, { id, choice }) => g.chooseEvent(String(id), String(choice)),
  // personal
  hire: (g, { id }) => g.hire(id | 0),
  fire: (g, { id }) => g.fire(id | 0),
  train: (g, { id, course }) => g.train(id | 0, String(course)),
  touchOrder: (g, { orderId }) => g.touchOrder(orderId | 0),
  // avtal
  setSupplier: (g, { id }) => g.setSupplier(String(id)),
  joinPartner: (g, { brand }) => g.joinPartner(String(brand)),
  leavePartner: (g, { brand }) => g.leavePartner(String(brand)),
  // tjänster och tillval
  doService: (g, { orderId }) => g.doService(orderId | 0),
  setOpts: (g, { customerId, orderId, opts }) => g.setOpts({ customerId, orderId }, opts || {}),
  complete: (g, { orderId, result }) => {
    const o = g.orders.find((x) => x.id === orderId);
    return o ? g.complete(o, result) : null;
  },
};

export function runCommand(game, name, args, actor = null) {
  const fn = COMMANDS[name];
  if (!fn) return undefined;
  const before = game.actor;
  game.actor = actor;
  try { return fn(game, args || {}); } finally { game.actor = before; }
}
