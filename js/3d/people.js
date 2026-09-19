// Människor i 3D-butiken: riggade figurer med gå/stå-animation som följer simuleringen
// (kunder, expedit, personal, kompisar i co-op, folk på trottoaren). Figurerna är Mixamo-
// karaktärer (assets/3d/chars/*.glb, konverterade med tools/mixamo-convert.mjs) som laddas vid
// behov; animationerna (idle/walk/run) kommer från three.js-mannekängen Xbot och läggs på
// Mixamo-skeletten (samma bennamn). Tills en figur laddats – eller om inga finns – visas Xbot
// färgad efter personens kläder.
import * as THREE from 'three';
import { clone as cloneRig } from 'three/addons/utils/SkeletonUtils.js';
import { loadRig, BASE } from './assets.js';
import { tag, marker } from './textures.js';


// ---------- Kläder ----------
// 0 hud, 1 tröja, 2 byxor, 3 skor, 4 underarm/hand (hud eller ärm), 5 underben (byxa eller hud), 6 huvud
const GROUP_RE = [[/Head|Eye|Neck/, 6], [/ForeArm|Hand/, 4], [/Shoulder|Arm|Spine/, 1], [/UpLeg|Hips/, 2], [/Foot|Toe/, 3], [/Leg/, 5]];
function groupOf(name) { for (const [re, g] of GROUP_RE) if (re.test(name)) return g; return 1; }
function clothColors(look, fallback) {
  const c = (v, d) => new THREE.Color(v || d);
  const skin = c(look.skin, '#e0b090'), shirt = c(look.shirt, fallback || '#7ea0c8'), pants = c(look.pants, '#2d3a5c'), shoes = c(look.shoes, '#222222');
  const longSleeve = look.top && look.top !== 'tee' && look.top !== 'vest';
  const shorts = look.bottom === 'shorts' || look.bottom === 'skirt';
  return [skin, shirt, pants, shoes, longSleeve ? shirt : skin, shorts ? skin : pants, skin, skin];
}
// ett material per figur: färgen räknas ut per vertex ur benvikterna (mjuka övergångar vid lederna)
function clothMaterial(groups, cols, joints) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: joints ? 0.55 : 0.8, metalness: joints ? 0.15 : 0.0 });
  const uCols = { value: cols.map((c) => (joints ? c.clone().multiplyScalar(0.72) : c)) };
  const uGroup = { value: Array.from(groups) };
  m.customProgramCacheKey = () => 'cloth' + groups.length;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCols = uCols; sh.uniforms.uGroup = uGroup;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nuniform vec3 uCols[8]; uniform float uGroup[${Math.max(1, groups.length)}]; varying vec3 vCloth;`)
      .replace('#include <skinbase_vertex>', `#include <skinbase_vertex>\n#ifdef USE_SKINNING\n vec3 cc = skinWeight.x * uCols[int(uGroup[int(skinIndex.x)])] + skinWeight.y * uCols[int(uGroup[int(skinIndex.y)])] + skinWeight.z * uCols[int(uGroup[int(skinIndex.z)])] + skinWeight.w * uCols[int(uGroup[int(skinIndex.w)])];\n vCloth = cc / max(0.001, skinWeight.x + skinWeight.y + skinWeight.z + skinWeight.w);\n#else\n vCloth = uCols[1];\n#endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCloth;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vCloth;');
  };
  return m;
}
function findBone(root, re) { let b = null; root.traverse((o) => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; }
// benens världsrotationer i riggens laddade viloläge (T-pose = bindpose hos Mixamo)
function restRotations(root) {
  root.updateMatrixWorld(true);
  const out = new Map(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  root.traverse((o) => { if (o.isBone) { o.matrixWorld.decompose(p, q, sc); out.set(o.name, q.clone()); } });
  return out;
}
const srcName = (n) => n.replace(/^mixamorig\d*:?/, 'mixamorig');
// Delta-retargeting: hur mycket varje Xbot-ben vridit sig från sin vilopose (i världsrymd) läggs på
// målbenets vilopose. Fungerar mellan Mixamo-riggar med olika lokala benaxlar, så länge båda
// vilar i T-pose. Höften får Xbots rörelse skalad efter höfthöjden. Ger ett clip bundet på nodnamn.
function retargetDelta(srcRoot, srcRest, tgtRoot, tgtRest, clip, fps = 30) {
  const srcBones = new Map(); srcRoot.traverse((o) => { if (o.isBone) srcBones.set(o.name, o); });
  const tgtBones = []; tgtRoot.traverse((o) => { if (o.isBone) tgtBones.push(o); });
  const saved = tgtBones.map((b) => [b.quaternion.clone(), b.position.clone()]);
  const srcHips = srcBones.get('mixamorigHips'), tgtHips = tgtBones.find((b) => srcName(b.name) === 'mixamorigHips');
  const srcHipsRest = srcHips ? srcHips.position.clone() : null, tgtHipsRest = tgtHips ? tgtHips.position.clone() : null;
  const ratio = srcHipsRest && tgtHipsRest && srcHipsRest.y ? tgtHipsRest.y / srcHipsRest.y : 1;
  const mixer = new THREE.AnimationMixer(srcRoot), action = mixer.clipAction(clip); action.play();
  const n = Math.max(2, Math.round(clip.duration * fps) + 1), times = new Float32Array(n);
  const rot = tgtBones.map(() => new Float32Array(n * 4)), hip = new Float32Array(n * 3);
  const p = new THREE.Vector3(), sc = new THREE.Vector3(), qs = new THREE.Quaternion(), qp = new THREE.Quaternion(), q = new THREE.Quaternion(), inv = new THREE.Quaternion();
  for (let f = 0; f < n; f++) {
    const t = Math.min(clip.duration, f / fps); times[f] = t;
    mixer.setTime(t); srcRoot.updateMatrixWorld(true);
    tgtBones.forEach((b, i) => {
      const sn = srcName(b.name), sb = srcBones.get(sn), r0 = srcRest.get(sn), t0 = tgtRest.get(b.name);
      if (sb && r0 && t0) {
        sb.matrixWorld.decompose(p, qs, sc);
        q.copy(qs).multiply(inv.copy(r0).invert()).multiply(t0);        // målets världsrotation
        if (b.parent) { b.parent.matrixWorld.decompose(p, qp, sc); b.quaternion.copy(qp.invert()).multiply(q); } else b.quaternion.copy(q);
        if (b === tgtHips) b.position.copy(tgtHipsRest).addScaledVector(p.copy(sb.position).sub(srcHipsRest), ratio);
      }
      b.updateWorldMatrix(false, false);
      rot[i].set([b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w], f * 4);
    });
    if (tgtHips) hip.set([tgtHips.position.x, tgtHips.position.y, tgtHips.position.z], f * 3);
  }
  const tracks = tgtBones.map((b, i) => new THREE.QuaternionKeyframeTrack(b.name + '.quaternion', times, rot[i]));
  if (tgtHips) tracks.push(new THREE.VectorKeyframeTrack(tgtHips.name + '.position', times, hip));
  tgtBones.forEach((b, i) => { b.quaternion.copy(saved[i][0]); b.position.copy(saved[i][1]); });
  action.stop(); mixer.uncacheClip(clip);
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}
// Reserv om riktig retargeting misslyckas: byt bara benprefix (mixamorig<N>) och skala höftens lägesspår
function retarget(clip, prefix, ratio) {
  const c = clip.clone();
  for (const t of c.tracks) {
    t.name = t.name.replace(/^mixamorig\d*:?/, prefix);
    if (ratio !== 1 && /\.position$/.test(t.name)) for (let i = 0; i < t.values.length; i++) t.values[i] *= ratio;
  }
  return c;
}
// Figurernas drag (Mixamo-exporterna i assets/3d/chars): kvinna/man, skägg, ung – så att en
// skäggig kund får en skäggig figur och ett barn en ung utan skägg
const TRAITS = {
  'ch03.glb': { fem: 1, young: 1 }, 'ch22.glb': { fem: 1, young: 1 }, 'ch13.glb': { fem: 1 }, 'ch37.glb': { fem: 1 }, 'ch02.glb': { fem: 1, young: 1 },
  'ch31.glb': {}, 'ch42.glb': { young: 1 }, 'shoes.glb': { young: 1 }, 'ch08.glb': { beard: 1 }, 'ch17.glb': { beard: 1 },
};
const FEM_NAMES = new Set(['alva', 'elsa', 'maja', 'ella', 'wilma', 'saga', 'nora', 'vera', 'liv', 'stina', 'ines', 'greta', 'leila', 'mira', 'aiko', 'sofia', 'olga', 'birgitta', 'agneta', 'eva', 'anna', 'karin', 'lena', 'sara', 'emma', 'linnea', 'astrid', 'ebba', 'klara', 'freja', 'signe', 'tuva', 'moa', 'ida', 'julia', 'hanna', 'lisa', 'malin']);
const MASC_NAMES = new Set(['oscar', 'liam', 'noah', 'hugo', 'william', 'elias', 'ludvig', 'sixten', 'vincent', 'frans', 'kalle', 'bosse', 'ahmed', 'yusuf', 'kenji', 'mateo', 'ivan', 'gunnar', 'sven', 'nils', 'erik', 'lars', 'anders', 'johan', 'karl', 'per', 'olle', 'axel', 'arvid', 'viktor', 'leo', 'adam', 'samuel', 'samos', 'carl', 'jonas', 'martin', 'fredrik', 'mikael']);
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return (h ^ (h >>> 13)) >>> 0; };
function dressHead(head, look, cols) {
  const hair = new THREE.Color(look.hair || '#4a2f1d');
  const mat = (c, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  if (look.style && look.style !== 'bald') {
    const full = !/buzz/.test(look.style);
    const h = new THREE.Mesh(new THREE.SphereGeometry(full ? 10.6 : 10.2, 20, 14, 0, Math.PI * 2, 0, Math.PI * (full ? 0.62 : 0.5)), mat(hair, full ? 0.9 : 0.7));
    h.position.set(0, full ? 8.5 : 9.5, -0.5); h.castShadow = true; head.add(h);
    if (/long|pony|bob/.test(look.style)) { const back = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 7.5, 16, 16, 1, false, Math.PI, Math.PI), mat(hair, 0.9)); back.position.set(0, 2, -3); head.add(back); }
  }
  if (look.hat === 'cap') {
    const cap = new THREE.Color(look.cap || '#c9323a');
    const crown = new THREE.Mesh(new THREE.SphereGeometry(11.2, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(cap, 0.75)); crown.position.set(0, 10.5, -0.5); crown.castShadow = true; head.add(crown);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 10.5, 1.2, 20, 1, false, 0, Math.PI), mat(cap, 0.75)); brim.position.set(0, 10.6, 5); brim.rotation.y = -Math.PI / 2; head.add(brim);
  } else if (look.hat === 'beanie') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(11.4, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), mat(new THREE.Color(look.cap || '#8a2a2a'), 0.95)); b.position.set(0, 9, -0.5); head.add(b);
  }
  if (look.glasses) {
    const g = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.4, 6, 16), mat(0x222222, 0.4)); g.position.set(-3.2, 10, 9.5); head.add(g);
    const g2 = g.clone(); g2.position.x = 3.2; head.add(g2);
  }
  if (look.beard) {
    const bd = new THREE.Mesh(new THREE.SphereGeometry(6.5, 14, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.4), mat(hair, 0.95)); bd.position.set(0, 4.5, 5.5); head.add(bd);
  }
}

export class People {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group(); this.group.name = 'people';
    scene.add(this.group);
    this.rig = null; this.clips = {}; this.height = 1.8;
    this.chars = []; this.charRigs = new Map();   // Mixamo-figurer ur chars/manifest.json, laddade vid behov
    this.actors = new Map();
    this.t = 0;
  }
  async load() {
    const g = await loadRig('chars/Xbot.glb');
    if (!g) return;
    this.rig = g.scene;
    for (const c of g.animations) this.clips[c.name] = c;
    // höjden i viloposition: benens världsmatriser måste vara uppdaterade innan skinnade positioner mäts
    this.rig.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.rig, true);
    this.height = Math.max(1.0, box.max.y - box.min.y);
    // bengrupp per benindex (samma ordning i alla kloner): kläderna målas per grupp i skinningen
    this.srcRest = restRotations(this.rig);   // Xbots vilopose – utgångsläge för retargeting
    let sk = null; this.rig.traverse((o) => { if (o.isSkinnedMesh && !sk) sk = o; });
    this.groups = new Float32Array(sk ? sk.skeleton.bones.length : 0);
    if (sk) sk.skeleton.bones.forEach((b, i) => { this.groups[i] = groupOf(b.name); });
    try { const r = await fetch(BASE + 'chars/manifest.json'); if (r.ok) this.chars = ((await r.json()).chars || []).filter((c) => c.file && c.file !== 'Xbot.glb'); } catch { this.chars = []; }
  }
  // vilken figur en person får: bestäms av nyckeln (samma kund → samma figur)
  charFor(a) {
    if (!this.chars.length) return null;
    const L = a.look || {}, first = String(a.name || '').split(/[\s·]/)[0].toLowerCase();
    // kvinna/man: namnet, annars frisyren
    const fem = FEM_NAMES.has(first) ? true : MASC_NAMES.has(first) ? false : /long|ponytail|bun|bob|braids|pigtails|wavy/.test(L.style || '') ? true : /buzz|mohawk|bald|spiky/.test(L.style || '') ? false : null;
    const beard = !!L.beard && !L.kid;
    const t = (c) => TRAITS[c.file] || {};
    let cands = this.chars;
    if (L.kid) cands = cands.filter((c) => t(c).young && !t(c).beard);
    else if (beard) cands = cands.filter((c) => t(c).beard);
    else cands = cands.filter((c) => !t(c).beard);
    if (fem !== null) { const g = cands.filter((c) => !!t(c).fem === fem); if (g.length) cands = g; }
    if (!cands.length) cands = this.chars;
    return cands[hashStr(a.key + '|' + (L.skin || '') + (L.hair || '')) % cands.length];
  }
  // laddar figuren (en gång) och gör om Xbots clips för dess skelett
  ensureChar(c) {
    let e = this.charRigs.get(c.file);
    if (e) return e;
    e = { rig: null, clips: null, height: c.height || 170 };
    this.charRigs.set(c.file, e);
    loadRig('chars/' + c.file).then((g) => {
      if (!g) return;
      g.scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(g.scene, false);
      e.height = Math.max(50, box.max.y - box.min.y);
      e.footY = box.min.y;   // fötterna i bindposen (0 hos Mixamo)
      const hips = findBone(g.scene, /Hips$/), xh = this.rig ? findBone(this.rig, /Hips$/) : null;
      const ratio = hips && xh && xh.position.y ? hips.position.y / xh.position.y : 1;
      const prefix = c.prefix || (hips ? hips.name.replace(/Hips$/, '') : 'mixamorig');
      e.clips = {};
      // riktig retargeting: Mixamo-riggarna har olika lokala benaxlar, så Xbots rotationer kan
      // inte kopieras rakt av – deltat mot viloposen räknas om i världsrymd (retargetDelta)
      const tgtRest = restRotations(g.scene);
      const restore = []; this.rig.traverse((o) => { if (o.isBone) restore.push([o, o.quaternion.clone(), o.position.clone()]); });
      for (const [k, clip] of Object.entries(this.clips)) {
        if (!['idle', 'walk', 'run'].includes(k)) continue;
        try { e.clips[k] = retargetDelta(this.rig, this.srcRest, g.scene, tgtRest, clip, 30); }
        catch (err) { console.warn('3D: retargeting misslyckades för ' + c.file, err); e.clips[k] = retarget(clip, prefix, ratio); }
        e.clips[k].name = k;
      }
      for (const [o, qq, pp] of restore) { o.quaternion.copy(qq); o.position.copy(pp); }   // Xbot tillbaka i vila
      this.rig.updateMatrixWorld(true);
      g.scene.updateMatrixWorld(true);
      // fötterna: spela första bildrutan av idle på en testkopia och mät hur långt från golvet de hamnar
      try {
        const test = cloneRig(g.scene), mx = new THREE.AnimationMixer(test), clip = e.clips.idle || Object.values(e.clips)[0];
        if (clip) { mx.clipAction(clip).play(); mx.update(0); }
        test.updateMatrixWorld(true);
        const bb = new THREE.Box3().setFromObject(test, true);
        e.footFix = Number.isFinite(bb.min.y) ? -bb.min.y : 0;
      } catch { e.footFix = 0; }
      g.scene.traverse((o) => { if (o.isMesh || o.isSkinnedMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; if (o.material) o.material.envMapIntensity = 0.6; } });
      e.rig = g.scene;
    });
    return e;
  }
  // en ny figur
  make(a) {
    const g = new THREE.Group();
    let root, mixer = null, actions = null;
    const ch = this.charFor(a), ce = ch ? this.ensureChar(ch) : null;
    if (ce?.rig) {
      // riktig Mixamo-figur med egna kläder och hår
      root = cloneRig(ce.rig);
      root.traverse((o) => { if (o.isMesh || o.isSkinnedMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; o.raycast = () => {}; } });
      const s = (a.kid ? 1.25 : 1.76) / ce.height;
      root.scale.setScalar(s);
      root.position.y = (ce.footFix || 0) * s;
      mixer = new THREE.AnimationMixer(root);
      actions = {};
      for (const k of ['idle', 'walk', 'run', 'agree', 'headShake']) if (ce.clips[k]) actions[k] = mixer.clipAction(ce.clips[k]);
      if (actions.idle) actions.idle.play();
    } else if (this.rig) {
      root = cloneRig(this.rig);
      const cols = clothColors(a.look || {}, a.color);
      root.traverse((o) => {
        if (!o.isMesh && !o.isSkinnedMesh) return;
        o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false;
        o.raycast = () => {};   // siktet träffar kapseln nedan i stället (billigare och pålitligt)
        const joints = /joint/i.test(o.name) || /joint/i.test(o.material?.name || '');
        o.material = clothMaterial(this.groups, cols, joints);
      });
      // hår och keps på huvudbenet (benens lokala enhet är cm)
      const head = findBone(root, /Head$/);
      if (head) dressHead(head, a.look || {}, cols);
      const s = (a.kid ? 1.25 : 1.76) / this.height;
      root.scale.setScalar(s);
      mixer = new THREE.AnimationMixer(root);
      actions = {};
      for (const k of ['idle', 'walk', 'run', 'agree', 'headShake']) if (this.clips[k]) actions[k] = mixer.clipAction(this.clips[k]);
      if (actions.idle) { actions.idle.play(); }
    } else {
      // reserv: en enkel kapselfigur
      const h = a.kid ? 1.25 : 1.76;
      const m = new THREE.MeshStandardMaterial({ color: a.color || '#8899aa', roughness: 0.7 });
      root = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, h - 0.44, 6, 12), m);
      root.position.y = h / 2; root.castShadow = true;
    }
    g.add(root);
    // osynlig träffkapsel för siktet
    const hh = a.kid ? 1.25 : 1.76;
    const hit = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, hh - 0.56, 4, 8), new THREE.MeshBasicMaterial());
    hit.position.y = hh / 2; hit.visible = false; hit.name = 'hitbox';
    g.add(hit);
    this.group.add(g);
    const ac = { g, root, mixer, actions, cur: 'idle', yaw: a.yaw || 0, label: null, labelText: '', mark: null, seed: Math.random() * 10, char: ce?.rig ? ch.file : null, wantChar: ch && !ce?.rig ? ch.file : null };
    this.actors.set(a.key, ac);
    return ac;
  }
  setLabel(ac, text, color, big) {
    if (ac.labelText === (text || '')) return;
    ac.labelText = text || '';
    if (ac.label) { ac.g.remove(ac.label); ac.label.material.map.dispose(); ac.label.material.dispose(); ac.label = null; }
    if (!text) return;
    const t = tag(text, { color, big });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false }));
    const k = big ? 0.0022 : 0.0016;
    sp.scale.set(t.userData.w * k, t.userData.h * k, 1);
    sp.position.y = ac.h + 0.32;
    sp.renderOrder = 10;
    ac.g.add(sp);
    ac.label = sp;
  }
  setMark(ac, on) {
    if (!!ac.mark === !!on) return;
    if (ac.mark) { ac.g.remove(ac.mark); ac.mark.material.dispose(); ac.mark = null; return; }
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: marker('!'), transparent: true, depthTest: false, depthWrite: false, color: new THREE.Color(1.4, 1.4, 1.4) }));
    sp.scale.set(0.2, 0.2, 1); sp.position.y = ac.h + 0.5; sp.renderOrder = 11;
    ac.g.add(sp);
    ac.mark = sp;
  }
  // list: [{ key, x, z, yaw, moving, run, kid, color, label, labelColor, big, mark, y }]
  sync(list, dt) {
    this.t += dt;
    const seen = new Set();
    for (const a of list) {
      seen.add(a.key);
      let ac = this.actors.get(a.key);
      // figuren blev klar: byt ut platshållaren
      if (ac?.wantChar && this.charRigs.get(ac.wantChar)?.rig) { const yaw = ac.yaw; this.remove(a.key, ac); ac = this.make(a); ac.yaw = yaw; }
      if (!ac) ac = this.make(a);
      ac.h = a.kid ? 1.25 : 1.76;
      ac.g.position.set(a.x, a.y || 0, a.z);
      let d = (a.yaw ?? 0) - ac.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      ac.yaw += d * Math.min(1, dt * 9);
      ac.g.rotation.y = ac.yaw;
      if (ac.mixer) {
        const want = a.moving ? (a.run && ac.actions.run ? 'run' : 'walk') : 'idle';
        if (want !== ac.cur && ac.actions[want]) {
          const from = ac.actions[ac.cur], to = ac.actions[want];
          to.reset().setEffectiveTimeScale(want === 'walk' ? (a.kid ? 1.15 : 1) : 1).setEffectiveWeight(1).play();
          if (from) from.crossFadeTo(to, 0.25, false);
          ac.cur = want;
        }
        ac.mixer.update(dt);
      }
      this.setLabel(ac, a.label, a.labelColor, a.big);
      this.setMark(ac, a.mark);
      if (ac.mark) ac.mark.position.y = ac.h + (ac.label ? 0.55 : 0.2) + Math.sin(this.t * 4 + ac.seed) * 0.05;
    }
    for (const [k, ac] of this.actors) if (!seen.has(k)) this.remove(k, ac);
  }
  remove(k, ac) {
    this.group.remove(ac.g);
    // Xbot-kopior har egna klädmaterial; Mixamo-figurerna delar material med riggen
    if (!ac.char) ac.g.traverse((o) => { if (o.material && o !== ac.label && o !== ac.mark) { if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose()); else o.material.dispose(); } });
    if (ac.label) { ac.label.material.map.dispose(); ac.label.material.dispose(); }
    if (ac.mark) ac.mark.material.dispose();
    this.actors.delete(k);
  }
  // objektet (för raycast) → nyckel
  keyOf(obj) {
    for (const [k, ac] of this.actors) { let o = obj; while (o) { if (o === ac.g) return k; o = o.parent; } }
    return null;
  }
  dispose() { this.scene.remove(this.group); }
}
