// Nätverk för co-op: WebRTC via PeerJS med en rumskod på fyra bokstäver.
// Värden (host) äger spelet; klienter skickar kommandon och får läget tillbaka.
// Meddelanden är JSON-objekt med fältet t (typ).

const PEER_JS = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
const PREFIX = 'pixelverkstan-v1-';
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
// STUN hittar vägen mellan två nätverk; TURN skickar vidare när det inte går direkt
// (t.ex. mobilnät). Open Relay är en gratis offentlig TURN-tjänst.
const PEER_OPTS = {
  debug: 0,
  config: {
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
    ],
  },
};

let peerLib = null;
function loadPeer() {
  if (window.Peer) return Promise.resolve(window.Peer);
  if (peerLib) return peerLib;
  peerLib = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PEER_JS; s.async = true;
    s.onload = () => resolve(window.Peer);
    s.onerror = () => { peerLib = null; reject(new Error('Kunde inte ladda nätverksbiblioteket – är du uppkopplad?')); };
    document.head.append(s);
  });
  return peerLib;
}

export const makeCode = () => Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
export const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);

export class Net {
  constructor() {
    this.role = null;        // 'host' | 'client' | null
    this.code = null;
    this.peer = null;
    this.conns = new Map();  // värd: peerId → anslutning
    this.hostConn = null;    // klient: anslutningen till värden
    this.handlers = {};
    this.closed = false;
    this.lastRecv = Date.now();
  }
  on(type, fn) { (this.handlers[type] ||= []).push(fn); return this; }
  emit(type, msg, from) { for (const fn of this.handlers[type] || []) { try { fn(msg, from); } catch (e) { console.error(e); } } }
  get id() { return this.role === 'host' ? 'host' : this.peer?.id; }

  // Skapa ett rum. Försöker några koder om den första är upptagen.
  async host(wanted = null) {
    const Peer = await loadPeer();
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = attempt === 0 && wanted ? cleanCode(wanted) : makeCode();
      try {
        await new Promise((resolve, reject) => {
          const peer = new Peer(PREFIX + code, PEER_OPTS);
          const fail = (err) => { peer.destroy(); reject(err); };
          peer.on('open', () => { this.peer = peer; resolve(); });
          peer.on('error', (err) => { if (!this.peer) fail(err); else this.emit('error', { err }); });
          peer.on('connection', (conn) => this.accept(conn));
          peer.on('disconnected', () => { if (!this.closed) peer.reconnect(); });
        });
        this.role = 'host'; this.code = code;
        return code;
      } catch (err) {
        if (err?.type !== 'unavailable-id') throw friendly(err);
      }
    }
    throw new Error('Kunde inte skapa ett rum just nu. Försök igen.');
  }
  accept(conn) {
    conn.on('open', () => { this.conns.set(conn.peer, conn); this.emit('peer-join', {}, conn.peer); });
    conn.on('data', (msg) => { this.lastRecv = Date.now(); if (msg && msg.t) this.emit(msg.t, msg, conn.peer); });
    const gone = () => { if (this.conns.delete(conn.peer)) this.emit('peer-leave', {}, conn.peer); };
    conn.on('close', gone);
    conn.on('error', gone);
  }

  // Gå med i ett rum
  async join(code) {
    const Peer = await loadPeer();
    code = cleanCode(code);
    if (code.length !== 4) throw new Error('Rumskoden har fyra bokstäver.');
    await new Promise((resolve, reject) => {
      const peer = new Peer(PEER_OPTS);
      let done = false;
      const timer = setTimeout(() => { if (!done) { done = true; peer.destroy(); reject(new Error('Fick inget svar från rummet. Stämmer koden?')); } }, 15000);
      peer.on('error', (err) => {
        if (done) { this.emit('error', { err }); return; }
        done = true; clearTimeout(timer); peer.destroy();
        reject(err?.type === 'peer-unavailable' ? new Error(`Hittar inget rum med koden ${code}.`) : friendly(err));
      });
      peer.on('open', () => {
        this.peer = peer;
        const conn = peer.connect(PREFIX + code, { reliable: true });
        conn.on('open', () => { if (done) return; done = true; clearTimeout(timer); this.hostConn = conn; resolve(); });
        conn.on('data', (msg) => { this.lastRecv = Date.now(); if (msg && msg.t) this.emit(msg.t, msg, 'host'); });
        conn.on('close', () => { if (!this.closed) this.emit('host-leave', {}); });
      });
    });
    this.role = 'client'; this.code = code;
    return code;
  }

  // värden: koppla bort en spelare (t.ex. ett spöke efter omladdning)
  drop(peerId) { const c = this.conns.get(peerId); this.conns.delete(peerId); try { c?.close(); } catch {} }
  send(msg) { if (this.hostConn?.open) this.hostConn.send(msg); }
  sendTo(peerId, msg) { const c = this.conns.get(peerId); if (c?.open) c.send(msg); }
  broadcast(msg, except = null) { for (const [id, c] of this.conns) if (id !== except && c.open) c.send(msg); }
  close() {
    this.closed = true;
    try { this.peer?.destroy(); } catch {}
    this.conns.clear(); this.hostConn = null; this.role = null;
  }
}

function friendly(err) {
  const t = err?.type;
  if (t === 'network' || t === 'server-error' || t === 'socket-error') return new Error('Ingen kontakt med nätverket. Kolla internetuppkopplingen.');
  if (t === 'browser-incompatible') return new Error('Webbläsaren stöder inte co-op (WebRTC).');
  return err instanceof Error ? err : new Error(String(err?.message || err));
}
