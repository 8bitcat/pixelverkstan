// Nätverk för co-op med en rumskod på fyra bokstäver.
// Signaleringen går via offentliga MQTT-mäklare över WebSocket (tre i tur och ordning – den
// gamla PeerJS-molnservern var ofta nere och då "fanns det ingen signal"). Spelets meddelanden
// går i första hand direkt mellan spelarna i en WebRTC-datakanal; öppnas den inte (mobilnät,
// strikta routrar) skickas de i stället via mäklaren, så det går alltid att spela ihop.
// Värden (host) äger spelet; klienter skickar kommandon och får läget tillbaka.
// Meddelanden är JSON-objekt med fältet t (typ).

const MQTT_JS = 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js';
const BROKERS = [
  { name: 'EMQX', url: 'wss://broker.emqx.io:8084/mqtt' },
  { name: 'HiveMQ', url: 'wss://broker.hivemq.com:8884/mqtt' },
  { name: 'Mosquitto', url: 'wss://test.mosquitto.org:8081' },
];
const TOPIC = 'pixelverkstan/v1/';
const VOLATILE = new Set(['tick', 'pos', 'cur', 'ping']);   // får tappas, nästa kommer strax
const RELAY_MS = 150;   // högst så ofta per flyktig typ via mäklaren
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const ROOM_TTL = 12 * 3600 * 1000;      // så gammal får en rumsannons vara
const NO_RTC = typeof location !== 'undefined' && /[?&]nortc=1/.test(location.search);   // test: tvinga vägen via mäklaren
// STUN hittar vägen mellan två nätverk; TURN skickar vidare när det inte går direkt
const ICE = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
};

let mqttLib = null;
function loadMqtt() {
  if (window.mqtt) return Promise.resolve(window.mqtt);
  if (mqttLib) return mqttLib;
  mqttLib = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = MQTT_JS; s.async = true;
    s.onload = () => resolve(window.mqtt);
    s.onerror = () => { mqttLib = null; reject(new Error('Kunde inte ladda nätverksbiblioteket – är du uppkopplad?')); };
    document.head.append(s);
  });
  return mqttLib;
}
const rnd = (n) => Array.from({ length: n }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
export const makeCode = () => rnd(4);
export const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
const decode = (payload) => { try { return JSON.parse(typeof payload === 'string' ? payload : new TextDecoder().decode(payload)); } catch { return null; } };

// koppla upp mot första mäklaren som svarar
async function connectBroker(onMessage) {
  const mqtt = await loadMqtt();
  const tried = [];
  for (const b of BROKERS) {
    const client = mqtt.connect(b.url, { clientId: 'pv-' + rnd(10), clean: true, connectTimeout: 6000, reconnectPeriod: 2000, keepalive: 30 });
    const okNow = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 7000);
      client.once('connect', () => { clearTimeout(timer); resolve(true); });
      client.once('error', () => { clearTimeout(timer); resolve(false); });
      client.once('close', () => { clearTimeout(timer); resolve(false); });
    });
    if (okNow) { client.on('message', onMessage); return { client, name: b.name }; }
    tried.push(b.name);
    try { client.end(true); } catch {}
  }
  throw new Error(`Ingen kontakt med spelservern (${tried.join(', ')} svarade inte). Kolla internet och brandvägg.`);
}

export class Net {
  constructor() {
    this.role = null;        // 'host' | 'client' | null
    this.code = null;
    this.myId = rnd(8);
    this.mq = null; this.broker = null;
    this.conns = new Map();  // värd: peerId → { id, pc, dc, rtc, pending, send }
    this.hostConn = null;    // klient: { pc, dc, rtc, pending, send }
    this.handlers = {};
    this.closed = false;
    this.lastRecv = Date.now();
    this.roomSeen = null;
    this.waiters = {};
    this.stats = { sent: 0, recv: 0, rtcSent: 0, rtcRecv: 0, mq: [], sentT: {}, recvT: {} };
    this.seq = 0; this.unacked = new Map(); this.seen = new Map();
  }
  on(type, fn) { (this.handlers[type] ||= []).push(fn); return this; }
  emit(type, msg, from) { for (const fn of this.handlers[type] || []) { try { fn(msg, from); } catch (e) { console.error(e); } } }
  get id() { return this.role === 'host' ? 'host' : this.myId; }
  get T() { return TOPIC + this.code; }
  pub(topic, obj, retain = false, qos = 0) { if (this.mq) { this.stats.sent++; this.mq.publish(topic, JSON.stringify(obj), { qos, retain }); } }
  // spelmeddelanden via mäklaren: kommandon och byggsteg med kvittens (QoS 1, får inte tappas),
  // positioner/pekare/tick utan kvittens och högst ~10 per sekund (mäklaren tappar annars paket)
  relay(topic, wrap, msg) {
    this.stats.sentT[msg?.t] = (this.stats.sentT[msg?.t] || 0) + 1;
    if (!VOLATILE.has(msg?.t)) {
      // viktigt meddelande: löpnummer, kvittens från mottagaren, annars omsändning
      const n = ++this.seq, env = { ...wrap(msg), n };
      this.pub(topic, env, false, 1);
      const rec = { topic, env, tries: 0, timer: null };
      const again = () => { if (!this.unacked.has(n) || this.closed) return; if (++rec.tries > 8) { this.unacked.delete(n); return; } this.stats.resent = (this.stats.resent || 0) + 1; this.pub(topic, env, false, 1); rec.timer = setTimeout(again, 1500); };
      rec.timer = setTimeout(again, 1500);
      this.unacked.set(n, rec);
      return;
    }
    const key = topic + '|' + msg.t, now = performance.now();
    this.vol ||= new Map();
    let v = this.vol.get(key); if (!v) { v = { last: 0, pending: null, timer: null }; this.vol.set(key, v); }
    if (now - v.last >= RELAY_MS && !v.timer) { v.last = now; this.pub(topic, wrap(msg), false, 0); return; }
    v.pending = msg;
    if (!v.timer) v.timer = setTimeout(() => { v.timer = null; v.last = performance.now(); if (v.pending) { this.pub(topic, wrap(v.pending), false, 0); v.pending = null; } }, Math.max(10, RELAY_MS - (now - v.last)));
  }
  // mottagare: kvittera och sålla bort dubbletter (omsändningar)
  fresh(env, from, ackTopic, ackWrap) {
    if (env.n === undefined) return true;
    this.pub(ackTopic, ackWrap({ t: 'ack', n: env.n }), false, 0);
    let seen = this.seen.get(from); if (!seen) { seen = { set: new Set(), q: [] }; this.seen.set(from, seen); }
    if (seen.set.has(env.n)) { this.stats.dups = (this.stats.dups || 0) + 1; return false; }
    seen.set.add(env.n); seen.q.push(env.n); if (seen.q.length > 400) seen.set.delete(seen.q.shift());
    return true;
  }
  acked(n) { const r = this.unacked.get(n); if (r) { clearTimeout(r.timer); this.unacked.delete(n); } }
  watch(mq) { for (const ev of ['close', 'offline', 'reconnect', 'error', 'disconnect']) mq.on(ev, () => { this.stats.mq.push(ev + '@' + Math.round(performance.now() / 1000)); if (this.stats.mq.length > 40) this.stats.mq.shift(); }); }
  sub(topic) { return new Promise((res) => this.mq.subscribe(topic, { qos: 1 }, () => res())); }
  deliver(m, from) { this.lastRecv = Date.now(); if (m && m.t) { this.stats.recvT[m.t] = (this.stats.recvT[m.t] || 0) + 1; this.emit(m.t, m, from); } }
  // vad som händer i nätet just nu (visas i lobbyn)
  status() {
    if (!this.broker) return null;
    if (this.role === 'client') return { broker: this.broker, mode: this.hostConn?.rtc ? 'direktkoppling till värden' : 'via mäklaren' };
    const list = [...this.conns.values()];
    return { broker: this.broker, mode: list.length ? list.map((c) => (c.rtc ? 'direkt' : 'via mäklaren')).join(', ') : '' };
  }
  changed() { this.emit('status', this.status()); }

  // ---------- Värd ----------
  async host(wanted = null) {
    const bc = await connectBroker((topic, payload) => this.onMessage(topic, payload));
    this.mq = bc.client; this.broker = bc.name; this.watch(this.mq);
    for (let attempt = 0; attempt < 6; attempt++) {
      const code = attempt === 0 && wanted ? cleanCode(wanted) : makeCode();
      if (code.length !== 4) continue;
      // är koden upptagen? (en rumsannons ligger kvar hos mäklaren)
      this.code = code; this.roomSeen = null;
      await this.sub(this.T + '/room');
      await new Promise((r) => setTimeout(r, 900));
      this.mq.unsubscribe(this.T + '/room');
      if (this.roomSeen && Date.now() - this.roomSeen < ROOM_TTL) continue;
      await this.sub(this.T + '/host');
      this.pub(this.T + '/room', { t: 'room', at: Date.now(), host: this.myId }, true);
      this.role = 'host';
      this.keep = setInterval(() => this.pub(this.T + '/room', { t: 'room', at: Date.now(), host: this.myId }, true), 60000);
      return code;
    }
    throw new Error('Kunde inte skapa ett rum just nu. Försök igen.');
  }
  onMessage(topic, payload) {
    const m = decode(payload);
    this.stats.recv++;
    if (!this.code) return;
    if (topic === this.T + '/room') { this.roomSeen = m?.at || null; if (this.role === 'client' && !m?.at && !this.closed) this.emit('host-leave', {}); return; }
    if (!m) return;
    if (this.role === 'host' && topic === this.T + '/host') {
      const from = m.from; if (!from || from === this.myId) return;
      if (m.t === 'hello') return this.accept(from);
      const c = this.conns.get(from); if (!c) return;
      if (m.t === 'ack') return this.acked(m.n);
      if (m.t === 'data') { if (this.fresh(m, from, this.T + '/c/' + from, (a) => a)) this.deliver(m.m, from); return; }
      if (m.t === 'answer' && c.pc) c.pc.setRemoteDescription(m.sdp).then(() => this.flushIce(c)).catch(() => {});
      if (m.t === 'ice') this.addIce(c, m.c);
      return;
    }
    if (this.role !== 'host' && topic === this.T + '/c/' + this.myId) {
      if (m.t === 'welcome-sig') { this.waiters.welcome?.(); return; }
      if (m.t === 'ack') return this.acked(m.n);
      if (m.t === 'data') { if (this.fresh(m, 'host', this.T + '/host', (a) => ({ ...a, from: this.myId }))) this.deliver(m.m, 'host'); return; }
      if (m.t === 'bye') { if (!this.closed) this.emit('host-leave', {}); return; }
      const c = this.hostConn; if (!c) return;
      if (m.t === 'offer') this.answer(c, m.sdp);
      if (m.t === 'ice') this.addIce(c, m.c);
    }
  }
  accept(from) {
    if (this.conns.has(from)) { this.pub(this.T + '/c/' + from, { t: 'welcome-sig', host: this.myId }); return; }
    const c = { id: from, pc: null, dc: null, rtc: false, pending: [], send: (msg) => { if (c.rtc && c.dc?.readyState === 'open') { this.stats.rtcSent++; c.dc.send(JSON.stringify(msg)); } else this.relay(this.T + '/c/' + from, (m) => ({ t: 'data', m }), msg); } };
    this.conns.set(from, c);
    this.pub(this.T + '/c/' + from, { t: 'welcome-sig', host: this.myId });
    this.emit('peer-join', {}, from);
    this.changed();
    if (!NO_RTC && typeof RTCPeerConnection !== 'undefined') this.offer(c);
  }
  // ---------- WebRTC-datakanalen (extra fart när den går att öppna) ----------
  wire(c, dc, from) {
    c.dc = dc;
    dc.onopen = () => { c.rtc = true; this.changed(); };
    dc.onclose = () => { c.rtc = false; this.changed(); };
    dc.onerror = () => { c.rtc = false; };
    dc.onmessage = (e) => { this.stats.rtcRecv++; const m = decode(e.data); if (m) this.deliver(m, from); };
  }
  async offer(c) {
    try {
      const pc = c.pc = new RTCPeerConnection(ICE);
      this.wire(c, pc.createDataChannel('game', { ordered: true }), c.id);
      pc.onicecandidate = (e) => { if (e.candidate) this.pub(this.T + '/c/' + c.id, { t: 'ice', c: e.candidate.toJSON() }); };
      const sdp = await pc.createOffer();
      await pc.setLocalDescription(sdp);
      this.pub(this.T + '/c/' + c.id, { t: 'offer', sdp: pc.localDescription });
    } catch (e) { console.warn('rtc offer', e); }
  }
  async answer(c, sdp) {
    try {
      const pc = c.pc = new RTCPeerConnection(ICE);
      pc.ondatachannel = (e) => this.wire(c, e.channel, 'host');
      pc.onicecandidate = (e) => { if (e.candidate) this.pub(this.T + '/host', { t: 'ice', from: this.myId, c: e.candidate.toJSON() }); };
      await pc.setRemoteDescription(sdp);
      this.flushIce(c);
      const ans = await pc.createAnswer();
      await pc.setLocalDescription(ans);
      this.pub(this.T + '/host', { t: 'answer', from: this.myId, sdp: pc.localDescription });
    } catch (e) { console.warn('rtc answer', e); }
  }
  addIce(c, cand) { if (!c.pc || !c.pc.remoteDescription) { c.pending.push(cand); return; } c.pc.addIceCandidate(cand).catch(() => {}); }
  flushIce(c) { for (const cand of c.pending.splice(0)) c.pc.addIceCandidate(cand).catch(() => {}); }

  // ---------- Klient ----------
  async join(code) {
    code = cleanCode(code);
    if (code.length !== 4) throw new Error('Rumskoden har fyra bokstäver.');
    const bc = await connectBroker((topic, payload) => this.onMessage(topic, payload));
    this.mq = bc.client; this.broker = bc.name; this.code = code; this.role = 'client'; this.watch(this.mq);
    await this.sub(this.T + '/c/' + this.myId);
    await this.sub(this.T + '/room');
    // finns rummet? (värdens annons ligger kvar hos mäklaren)
    const t0 = Date.now();
    while (!(this.roomSeen && Date.now() - this.roomSeen < ROOM_TTL)) {
      if (Date.now() - t0 > 4000) { this.close(); throw new Error(`Hittar inget rum med koden ${code}. Är värdens butik igång?`); }
      await new Promise((r) => setTimeout(r, 100));
    }
    const c = this.hostConn = { pc: null, dc: null, rtc: false, pending: [], send: (msg) => { if (c.rtc && c.dc?.readyState === 'open') { this.stats.rtcSent++; c.dc.send(JSON.stringify(msg)); } else this.relay(this.T + '/host', (m) => ({ t: 'data', from: this.myId, m }), msg); } };
    // säg hej tills värden svarar
    await new Promise((resolve, reject) => {
      let done = false, tries = 0;
      const timer = setInterval(() => { if (tries++ >= 12) { clearInterval(timer); if (!done) { done = true; this.close(); reject(new Error('Fick inget svar från värden. Prova igen om en stund.')); } } else this.pub(this.T + '/host', { t: 'hello', from: this.myId }); }, 1000);
      this.pub(this.T + '/host', { t: 'hello', from: this.myId });
      this.waiters.welcome = () => { if (done) return; done = true; clearInterval(timer); resolve(); };
    });
    this.changed();
    return code;
  }

  // värden: koppla bort en spelare (t.ex. ett spöke efter omladdning)
  drop(peerId) { const c = this.conns.get(peerId); this.conns.delete(peerId); try { c?.pc?.close(); } catch {} this.changed(); }
  send(msg) { this.hostConn?.send(msg); }
  sendTo(peerId, msg) { this.conns.get(peerId)?.send(msg); }
  broadcast(msg, except = null) { for (const [id, c] of this.conns) if (id !== except) c.send(msg); }
  close() {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.keep);
    for (const r of this.unacked.values()) clearTimeout(r.timer); this.unacked.clear();
    try {
      if (this.role === 'host' && this.mq) { for (const id of this.conns.keys()) this.pub(this.T + '/c/' + id, { t: 'bye' }); this.mq.publish(this.T + '/room', '', { qos: 0, retain: true }); }
      for (const c of this.conns.values()) c.pc?.close();
      this.hostConn?.pc?.close();
      const mq = this.mq; this.mq = null;
      if (mq) setTimeout(() => { try { mq.end(true); } catch {} }, 200);
    } catch {}
    this.conns.clear(); this.hostConn = null; this.role = null;
  }
}
