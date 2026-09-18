// Människor i 3D-butiken: riggade figurer med gå/stå-animation som följer simuleringen
// (kunder, expedit, personal, kompisar i co-op, folk på trottoaren). Tills riktiga
// Mixamo-figurer finns används three.js-mannekängen Xbot, färgad efter personens kläder.
import * as THREE from 'three';
import { clone as cloneRig } from 'three/addons/utils/SkeletonUtils.js';
import { loadRig } from './assets.js';
import { tag, marker } from './textures.js';

export class People {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group(); this.group.name = 'people';
    scene.add(this.group);
    this.rig = null; this.clips = {}; this.height = 1.8;
    this.actors = new Map();
    this.t = 0;
  }
  async load() {
    const g = await loadRig('chars/Xbot.glb');
    if (!g) return;
    this.rig = g.scene;
    for (const c of g.animations) this.clips[c.name] = c;
    // höjden ur vilopositionens geometri (skinnade positioner går inte att lita på före första renderingen)
    this.rig.updateMatrixWorld(true);
    const box = new THREE.Box3();
    this.rig.traverse((o) => { if (o.isSkinnedMesh || o.isMesh) { o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
    this.height = Math.max(0.5, box.max.y - box.min.y);
  }
  // en ny figur
  make(a) {
    const g = new THREE.Group();
    let root, mixer = null, actions = null;
    if (this.rig) {
      root = cloneRig(this.rig);
      root.traverse((o) => {
        if (!o.isMesh && !o.isSkinnedMesh) return;
        o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false;
        o.raycast = () => {};   // siktet träffar kapseln nedan i stället (billigare och pålitligt)
        o.material = o.material.clone();
        const surf = /surface/i.test(o.name) || /surface/i.test(o.material.name || '');
        const col = new THREE.Color(a.color || '#8899aa');
        if (surf) { o.material.color.copy(col); o.material.roughness = 0.75; o.material.metalness = 0.05; }
        else { o.material.color.copy(col).multiplyScalar(0.35); o.material.roughness = 0.5; o.material.metalness = 0.3; }
      });
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
    const ac = { g, root, mixer, actions, cur: 'idle', yaw: a.yaw || 0, label: null, labelText: '', mark: null, seed: Math.random() * 10 };
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
    for (const [k, ac] of this.actors) {
      if (seen.has(k)) continue;
      this.group.remove(ac.g);
      ac.g.traverse((o) => { if (o.material && o !== ac.label && o !== ac.mark) { if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose()); else o.material.dispose(); } });
      if (ac.label) { ac.label.material.map.dispose(); ac.label.material.dispose(); }
      this.actors.delete(k);
    }
  }
  // objektet (för raycast) → nyckel
  keyOf(obj) {
    for (const [k, ac] of this.actors) { let o = obj; while (o) { if (o === ac.g) return k; o = o.parent; } }
    return null;
  }
  dispose() { this.scene.remove(this.group); }
}
