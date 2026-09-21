// Byggoperationer: varje ändring av ett bygge är en liten operation som går att
// köra flera gånger utan skada. I co-op skickas de mellan spelarna så att alla
// som bygger samma dator ser samma sak.
//
// op.t:
//   mode {help}            place {slot, part}     remove {slot}      act {id, i}
//   cable {id, port}       unplug {id}            err {}             phase {v}
//   plug {id, key}         unplugd {id}           psu {on}           power {}
//   result {success}

// act kan bära part: råvaran som lades på stationen – den ligger sedan där och går att ta med handen
export function newBuild() {
  return { placed: {}, acts: new Map(), cables: new Map(), errors: 0, time: 0, help: null, phase: 'build', seen: new Set() };
}

// Stjärnor för ett färdigt bygge: tid och misstag, minus en per anmärkning. Guidad kund ger alltid tre.
export function starsFor(order, warnings = []) {
  const b = order.build || { errors: 0, time: 0 };
  const target = 60 + 30 * order.items.length;
  let stars = 1;
  if (b.errors <= 1 && b.time <= target) stars = 3;
  else if (b.errors <= 4 && b.time <= target * 1.8) stars = 2;
  stars = Math.max(1, stars - (warnings?.length || 0));
  return order.guided ? 3 : stars;
}

export function rigOf(shop, order) {
  return shop.layout.rigFor ? shop.layout.rigFor(order) : shop.layout;
}

export function applyBuildOp(shop, order, op) {
  const b = (order.build ||= newBuild());
  const L = rigOf(shop, order);
  const d = (b.desk ||= { plugs: {}, psuOn: false, attempts: {}, success: false });
  // kökets klocka: ett handgrepp från en medspelare kan vara stämplat senare än vår egen klocka – följ med, annars ser
  // tillagningen olika ut hos er (tiden går bara framåt)
  if (op.at !== undefined && op.at > (b.time || 0)) b.time = op.at;
  switch (op.t) {
    case 'mode': if (b.help === null) b.help = !!op.help; break;
    case 'place': {
      const part = shop.part[op.part];
      if (part && !b.placed[op.slot]) { b.placed[op.slot] = part; if (op.at !== undefined) (b.placedAt ||= {})[op.slot] = op.at; }
      break;
    }
    case 'remove': {
      const slot = L.SLOT?.[op.slot];
      if (!b.placed[op.slot]) break;
      delete b.placed[op.slot];
      if (b.placedAt) delete b.placedAt[op.slot];
      if (slot && L.onRemove) L.onRemove(slot, b);
      break;
    }
    case 'act': {
      const set = new Set(b.acts.get(op.id) || []);
      set.add(op.i);
      b.acts.set(op.id, set);
      if (op.part) (b.station ||= {})[op.id] = op.part;
      if (op.at !== undefined) ((b.actAt ||= {})[op.id] ||= {})[op.i] = op.at;   // när det gjordes (tillagning som tar tid)
      break;
    }
    case 'cable': if (!b.cables.has(op.id)) b.cables.set(op.id, op.port); break;
    case 'unplug': b.cables.delete(op.id); break;
    case 'err': b.errors++; break;
    case 'phase': b.phase = op.v; break;
    case 'plug': if (!Object.values(d.plugs).includes(op.key)) { d.plugs[op.id] = op.key; d.success = false; } break;
    case 'unplugd': delete d.plugs[op.id]; d.success = false; break;
    case 'psu': d.psuOn = !!op.on; d.success = false; break;
    case 'result': d.success = !!op.success; break;
  }
  return b;
}

// Hela bygget som JSON (när en kompis kliver in i verkstaden mitt i ett bygge)
export function serializeBuild(b) {
  if (!b) return null;
  return {
    placed: Object.fromEntries(Object.entries(b.placed).map(([k, p]) => [k, p.id])),
    acts: [...b.acts].map(([k, s]) => [k, [...s]]),
    cables: [...b.cables],
    station: { ...(b.station || {}) },
    actAt: JSON.parse(JSON.stringify(b.actAt || {})), placedAt: { ...(b.placedAt || {}) },
    errors: b.errors, time: b.time, help: b.help, phase: b.phase,
    desk: b.desk ? { plugs: { ...b.desk.plugs }, psuOn: b.desk.psuOn, attempts: { ...b.desk.attempts }, success: b.desk.success } : null,
  };
}
export function deserializeBuild(data, shop) {
  if (!data) return null;
  const b = newBuild();
  for (const [k, id] of Object.entries(data.placed || {})) if (shop.part[id]) b.placed[k] = shop.part[id];
  b.acts = new Map((data.acts || []).map(([k, a]) => [k, new Set(a)]));
  b.cables = new Map(data.cables || []);
  b.station = { ...(data.station || {}) };
  b.actAt = JSON.parse(JSON.stringify(data.actAt || {})); b.placedAt = { ...(data.placedAt || {}) };
  Object.assign(b, { errors: data.errors || 0, time: data.time || 0, help: data.help ?? null, phase: data.phase || 'build' });
  if (data.desk) b.desk = { plugs: { ...data.desk.plugs }, psuOn: !!data.desk.psuOn, attempts: { ...data.desk.attempts }, success: !!data.desk.success };
  return b;
}
