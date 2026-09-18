// Konverterar Mixamo-FBX (i assets/3d/mixamo/, ignoreras av git) till glb i assets/3d/chars/
// med three.js FBXLoader + GLTFExporter i en webbläsare, texturer ner till 1024 px, och tar en
// bild av varje figur (tools/out/char-*.png). Skriver assets/3d/chars/manifest.json.
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
  const r = await page.evaluate(async (url) => {
    const THREE = await import('three');
    const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const g = await new FBXLoader().loadAsync(url);
    // Mixamo döper benen "mixamorig:Hips" – kolon är reserverat i three.js spårnamn, ta bort det
    g.traverse((o) => { if (o.name && o.name.includes(':')) o.name = o.name.replace(/:/g, ''); });
    for (const c of g.animations || []) for (const t of c.tracks) t.name = t.name.replace(/mixamorig:/g, 'mixamorig');
    // vänta in de inbäddade texturbilderna (annars klagar exportern på tom bilddata); trasiga tas bort
    const texs = new Set();
    g.traverse((o) => { for (const m of (o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [])) for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'specularMap', 'emissiveMap', 'aoMap', 'bumpMap', 'alphaMap']) if (m[k]) texs.add([m, k, m[k]]); });
    for (const [m, k, t] of texs) {
      const img = t.image;
      if (img && typeof img.decode === 'function' && !(img.complete && img.naturalWidth)) { try { await Promise.race([img.decode(), new Promise((r) => setTimeout(r, 15000))]); } catch {} }
      if (!img || !(img.naturalWidth || img.width)) { m[k] = null; m.needsUpdate = true; }
      else if (k === 'specularMap' || k === 'bumpMap') { m[k] = null; m.needsUpdate = true; }   // glTF saknar dessa
    }
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
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x3a3444);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x665544, 1.2));
    const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(2, 4, 3); scene.add(dl);
    const s = 1.8 / size.y;
    const view = g.clone(); view.scale.setScalar(s); view.position.set(-(box.min.x + box.max.x) / 2 * s, -box.min.y * s, -(box.min.z + box.max.z) / 2 * s);
    scene.add(view);
    const cam = new THREE.PerspectiveCamera(35, 480 / 640, 0.1, 50); cam.position.set(0, 1.0, 4.2); cam.lookAt(0, 0.9, 0);
    renderer.render(scene, cam);
    // export
    const exp = new GLTFExporter();
    const buf = await exp.parseAsync(g, { binary: true, animations: g.animations || [], maxTextureSize: 1024, onlyVisible: false, includeCustomExtensions: false });
    const bytes = new Uint8Array(buf); let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    const b64 = btoa(bin);
    renderer.dispose();
    return { base, names, mats: [...mats], texes: texes.slice(0, 12), bones, bone0, tris: Math.round(tris), skinned, size: size.toArray().map((n) => +n.toFixed(1)), clips, b64 };
  }, url);
  const slug = (r.base || 'char').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'char';
  let name = slug, k = 2;
  while (manifest.chars.some((c) => c.file === name + '.glb') || fs.existsSync(path.join(DST, name + '.glb'))) name = slug + k++;
  const out = path.join(DST, name + '.glb');
  fs.writeFileSync(out, Buffer.from(r.b64, 'base64'));
  await page.screenshot({ path: path.join(OUT, `char-${name}.png`) });
  const entry = { file: name + '.glb', src: f, base: r.base, height: r.size[1], bones: r.bones, tris: r.tris, clips: r.clips.map((c) => c.name), bytes: fs.statSync(out).size };
  manifest.chars.push(entry);
  console.log(`${f} → ${name}.glb ${(entry.bytes / 1048576).toFixed(1)} MB | ${r.base} skinned=${r.skinned} bones=${r.bones} (${r.bone0.join(',')}) tris=${r.tris} h=${r.size[1]} tex=${r.texes.join(' ')} clips=${JSON.stringify(r.clips)} ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
fs.writeFileSync(path.join(DST, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
