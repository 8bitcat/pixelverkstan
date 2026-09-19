// Konverterar Mixamo-FBX (i assets/3d/mixamo/, ignoreras av git) till glb i assets/3d/chars/
// med three.js FBXLoader + GLTFExporter i en webbläsare. FBX:ernas inbäddade 4096²-texturer
// byts mot de nedskalade i assets/3d/mixamo-tex/ (kör `python tools/fbx-textures.py` först),
// morph targets och animationer tas bort (figurerna animeras med Xbots clips i people.js).
// Tar en bild av varje figur (tools/out/char-*.png) och skriver assets/3d/chars/manifest.json.
// node tools/mixamo-convert.mjs [filter]
import { createRequire } from "module";
import fs from "fs";
import path from "path";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const ROOT = "D:/GamesProjects/pixelverkstan";
const SRC = path.join(ROOT, "assets/3d/mixamo"), DST = path.join(ROOT, "assets/3d/chars"), OUT = path.join(ROOT, "tools/out");
const filter = process.argv[2] || "";
const files = fs.readdirSync(SRC).filter((f) => f.toLowerCase().endsWith(".fbx") && f.includes(filter));
const TEX = path.join(ROOT, "assets/3d/mixamo-tex");
const texFiles = fs.existsSync(TEX) ? Object.fromEntries(fs.readdirSync(TEX).filter((d) => fs.statSync(path.join(TEX, d)).isDirectory()).map((d) => [d, fs.readdirSync(path.join(TEX, d))])) : {};
if (!Object.keys(texFiles).length) { console.log('Inga texturer i assets/3d/mixamo-tex/ – kör python tools/fbx-textures.py först.'); process.exit(1); }
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 480, height: 640 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://localhost:8777/tools/convert.html");
const manifest = fs.existsSync(path.join(DST, "manifest.json")) ? JSON.parse(fs.readFileSync(path.join(DST, "manifest.json"), "utf8")) : { chars: [] };
for (const f of files) {
  const url = "/assets/3d/mixamo/" + encodeURIComponent(f);
  const t0 = Date.now();
  const r = await page.evaluate(async ([url, texFiles]) => {
    const THREE = await import('three');
    const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const { mergeVertices } = await import('three/addons/utils/BufferGeometryUtils.js');
    const g = await new FBXLoader().loadAsync(url);
    // Mixamo döper benen "mixamorig:Hips" – kolon är reserverat i three.js spårnamn, ta bort det
    g.traverse((o) => { if (o.name && o.name.includes(':')) o.name = o.name.replace(/:/g, ''); });
    for (const c of g.animations || []) for (const t of c.tracks) t.name = t.name.replace(/mixamorig:/g, 'mixamorig');
    // morph targets (ansiktsuttryck) tas bort – de gör filerna flera MB större och används inte;
    // FBX-geometrin är oindexerad (tre hörn per triangel) – slå ihop lika hörn så filen krymper
    g.traverse((o) => {
      if (!o.isMesh) return;
      if (o.geometry?.morphAttributes && Object.keys(o.geometry.morphAttributes).length) { o.geometry.morphAttributes = {}; o.morphTargetInfluences = undefined; o.morphTargetDictionary = undefined; }
      if (o.geometry && !o.geometry.index) { const geo = mergeVertices(o.geometry, 1e-4); o.geometry.dispose(); o.geometry = geo; }
    });
    // texturer: de inbäddade 4096²-bilderna byts mot de nedskalade (assets/3d/mixamo-tex, tools/fbx-textures.py)
    const allTex = Object.entries(texFiles).flatMap(([d, fl]) => fl.map((f) => ({ d, f, base: f.replace(/\.[a-z]+$/i, '').toLowerCase() })));
    const loader = new THREE.TextureLoader();
    const loadTex = (t) => new Promise((res) => loader.load('/assets/3d/mixamo-tex/' + encodeURIComponent(t.d) + '/' + encodeURIComponent(t.f), (tx) => res(tx), undefined, () => res(null)));
    const matsSeen = []; g.traverse((o) => { for (const m of (o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [])) if (!matsSeen.includes(m)) matsSeen.push(m); });
    // figurens texturmapp: meshens namn (Ch37_body → ch37); materialet kan heta något annat (Ch38_body)
    let meshBase = ''; g.traverse((o) => { if (!meshBase && o.isSkinnedMesh && o.name) meshBase = o.name.split('_')[0].toLowerCase(); });
    const dirOf = (d) => d.toLowerCase();
    const texLog = [], stdOf = new Map();
    for (const [mi, m] of matsSeen.entries()) {
      for (const k of ['roughnessMap', 'metalnessMap', 'specularMap', 'emissiveMap', 'aoMap', 'bumpMap', 'alphaMap', 'lightMap']) if (m[k]) m[k] = null;
      const prefix = (m.name || '').split('_')[0].toLowerCase();
      for (const [k, kind] of [['map', 'diffuse'], ['normalMap', 'normal']]) {
        const nm = String(m[k]?.name || '').toLowerCase().replace(/\.[a-z]+$/, '');
        let t = nm ? allTex.find((x) => x.base.endsWith(kind) && (nm.includes(x.base) || x.base.includes(nm))) : null;
        if (!t) t = allTex.find((x) => x.base.endsWith(kind) && (dirOf(x.d) === meshBase || x.base.startsWith(prefix)) && x.base.includes('_' + (1001 + mi) + '_'));   // 1001 = första materialet osv.
        if (!t && matsSeen.length === 1) t = allTex.find((x) => x.base.endsWith(kind) && x.base.startsWith(prefix));
        const tx = t ? await loadTex(t) : null;
        if (tx) { if (k === 'map') tx.colorSpace = THREE.SRGBColorSpace; if (/\.jpe?g$/i.test(t.f)) tx.userData.mimeType = 'image/jpeg'; m[k] = tx; } else m[k] = null;
        texLog.push(`${m.name}.${k}=${t ? t.d + '/' + t.f : '-'}${nm ? ' (' + nm + ')' : ''}`);
      }
      const std = new THREE.MeshStandardMaterial({ name: m.name, map: m.map || null, normalMap: m.normalMap || null, roughness: /hair/i.test(m.name) ? 0.7 : 0.88, metalness: 0, alphaTest: /hair|lash|brow|opacity/i.test(m.name) || m.map?.image?.src?.endsWith('.png') ? 0.4 : 0, side: THREE.FrontSide });
      stdOf.set(m, std);
    }
    g.traverse((o) => { if (o.material) o.material = Array.isArray(o.material) ? o.material.map((m) => stdOf.get(m) || m) : (stdOf.get(o.material) || o.material); });
    const names = [], mats = new Set(), texes = [];
    let bones = 0, tris = 0, skinned = 0;
    g.traverse((o) => {
      if (o.isSkinnedMesh) { skinned++; names.push(o.name); const geo = o.geometry; tris += geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3; for (const m of Array.isArray(o.material) ? o.material : [o.material]) { mats.add(m.name); for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'specularMap', 'emissiveMap']) if (m[k]?.image) texes.push(k + ':' + (m[k].image.width || '?') + 'x' + (m[k].image.height || '?')); } }
      if (o.isBone) bones++;
    });
    // namn på figuren: första skinnade meshens namn utan "_Body"/"_Mesh"
    const base = (names[0] || 'char').replace(/_.*$/, '');
    const bone0 = []; g.traverse((o) => { if (o.isBone && bone0.length < 3) bone0.push(o.name); });
    // storlek i vila
    g.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(g, true), size = box.getSize(new THREE.Vector3());
    // ta bort tomma/ointressanta animationer? behåll alla
    const clips = (g.animations || []).map((c) => ({ name: c.name, dur: +c.duration.toFixed(2), tracks: c.tracks.length }));
    // bild
    const canvas = document.getElementById('c');
    const renderer = window._renderer || (window._renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x3a3444);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x665544, 1.2));
    const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(2, 4, 3); scene.add(dl);
    const s = 1.8 / size.y;
    // (clone() delar skelettet med originalet – lägg i stället originalet i en skalad grupp och ta ut det igen före exporten)
    const view = new THREE.Group(); view.scale.setScalar(s); view.position.set(-(box.min.x + box.max.x) / 2 * s, -box.min.y * s, -(box.min.z + box.max.z) / 2 * s);
    view.add(g); scene.add(view); view.updateMatrixWorld(true);
    const cam = new THREE.PerspectiveCamera(35, 480 / 640, 0.1, 50); cam.position.set(0, 1.0, 4.2); cam.lookAt(0, 0.9, 0);
    renderer.render(scene, cam);
    const vb = new THREE.Box3().setFromObject(view, true);
    const viewBox = [vb.min.toArray().map((n) => +n.toFixed(2)), vb.max.toArray().map((n) => +n.toFixed(2))];
    // export (utan visningsgruppen)
    view.remove(g); g.position.set(0, 0, 0); g.scale.setScalar(1); g.updateMatrixWorld(true);
    const exp = new GLTFExporter();
    const buf = await exp.parseAsync(g, { binary: true, animations: [], maxTextureSize: 512, onlyVisible: false, includeCustomExtensions: false });
    const bytes = new Uint8Array(buf); let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    const b64 = btoa(bin);
    return { base, names, mats: [...mats], texes: texes.slice(0, 12), texLog, viewBox, bones, bone0, tris: Math.round(tris), skinned, size: size.toArray().map((n) => +n.toFixed(1)), clips, b64 };
  }, [url, texFiles]);
  const slug = (r.base || 'char').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'char';
  let name = slug, k = 2;
  while (manifest.chars.some((c) => c.file === name + '.glb') || fs.existsSync(path.join(DST, name + '.glb'))) name = slug + k++;
  const out = path.join(DST, name + '.glb');
  fs.writeFileSync(out, Buffer.from(r.b64, 'base64'));
  await page.screenshot({ path: path.join(OUT, `char-${name}.png`) });
  const entry = { file: name + '.glb', src: f, base: r.base, height: r.size[1], bones: r.bones, prefix: (r.bone0[0] || '').replace(/Hips$/, ''), tris: r.tris, mats: r.mats, bytes: fs.statSync(out).size };
  manifest.chars.push(entry);
  console.log(`${f} → ${name}.glb ${(entry.bytes / 1048576).toFixed(1)} MB | ${r.base} skinned=${r.skinned} bones=${r.bones} (${r.bone0.join(',')}) tris=${r.tris} h=${r.size[1]} vy=${JSON.stringify(r.viewBox)} ${((Date.now() - t0) / 1000).toFixed(0)} s\n   ${r.texLog.join('\n   ')}`);
}
fs.writeFileSync(path.join(DST, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
