// Konverterar Mixamo-animationsklipp (FBX "Without Skin", exporterade på X Bot) i
// assets/3d/mixamo/anim/ till små glb-filer i assets/3d/anim/ (bara skelett + spår, inga meshar)
// och skriver assets/3d/anim/manifest.json { clips: [{ file, key, src, dur }] }. Nycklarna
// (sit, sitIdle, eat, drink, stand, carry, happy, sad) gissas ur filnamnet – döp om i manifestet
// om något blir fel. people.js laddar manifestet och lägger klippen på alla figurer.
// node tools/mixamo-anim.mjs [filter|sökväg-till-fbx]
import { createRequire } from "module";
import fs from "fs";
import path from "path";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const ROOT = "D:/GamesProjects/pixelverkstan";
const SRC = path.join(ROOT, "assets/3d/mixamo/anim"), DST = path.join(ROOT, "assets/3d/anim");
const arg = process.argv[2] || "";
const files = arg.toLowerCase().endsWith('.fbx') ? [arg] : (fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => f.toLowerCase().endsWith('.fbx') && f.includes(arg)).map((f) => path.join(SRC, f)) : []);
if (!files.length) { console.log('Inga fbx i assets/3d/mixamo/anim/ – exportera klippen från Mixamo (X Bot, Without Skin, FBX Binary, 30 fps) dit.'); process.exit(1); }
fs.mkdirSync(DST, { recursive: true });
const KEYS = [[/stand.*to.*sit/i, 'sit'], [/sit.*to.*stand/i, 'stand'], [/drink/i, 'drink'], [/eat|sitting.*talk/i, 'eat'], [/sitting.*idle|^sitting|sit idle/i, 'sitIdle'], [/carry.*turn/i, 'carryTurn'], [/carry/i, 'carry'], [/happy|cheer|victory/i, 'happy'], [/sad|disappoint/i, 'sad'], [/walk/i, 'walk'], [/run/i, 'run'], [/idle/i, 'idle']];
const keyFor = (name) => (KEYS.find(([re]) => re.test(name)) || [null, name.toLowerCase().replace(/[^a-z0-9]+/g, '')])[1];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 320, height: 320 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://localhost:8777/tools/convert.html");
const manifest = fs.existsSync(path.join(DST, "manifest.json")) ? JSON.parse(fs.readFileSync(path.join(DST, "manifest.json"), "utf8")) : { clips: [] };
for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const url = '/' + rel.split('/').map(encodeURIComponent).join('/');
  const r = await page.evaluate(async (url) => {
    const THREE = await import('three');
    const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const g = await new FBXLoader().loadAsync(url);
    g.traverse((o) => { if (o.name && o.name.includes(':')) o.name = o.name.replace(/:/g, ''); });
    for (const c of g.animations || []) for (const t of c.tracks) t.name = t.name.replace(/mixamorig:/g, 'mixamorig');
    // bara skelettet: ta bort meshar (klippet är exporterat utan skinn, men en platshållarmesh kan finnas)
    const drop = []; g.traverse((o) => { if (o.isMesh || o.isSkinnedMesh) drop.push(o); }); for (const o of drop) o.parent?.remove(o);
    const clips = (g.animations || []).filter((c) => c.tracks.length);
    if (!clips.length) return { err: 'inga animationer i filen' };
    const clip = clips[0];
    // spår som inte rör ett ben i hierarkin tas bort (t.ex. Armature-noden)
    const names = new Set(); g.traverse((o) => { if (o.name) names.add(o.name); });
    clip.tracks = clip.tracks.filter((t) => names.has(t.name.split('.')[0]));
    let bones = 0, hips = null; g.traverse((o) => { if (o.isBone) { bones++; if (/Hips$/.test(o.name)) hips ||= o.name; } });
    const exp = new GLTFExporter();
    const buf = await exp.parseAsync(g, { binary: true, animations: [clip], onlyVisible: false, includeCustomExtensions: false });
    const bytes = new Uint8Array(buf); let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return { name: clip.name, dur: +clip.duration.toFixed(2), tracks: clip.tracks.length, bones, hips, b64: btoa(bin) };
  }, url);
  if (r.err) { console.log(`${path.basename(file)}: ${r.err}`); errors.push(r.err); continue; }
  const base = path.basename(file, path.extname(file)), key = keyFor(base);
  const out = path.join(DST, key + '.glb');
  fs.writeFileSync(out, Buffer.from(r.b64, 'base64'));
  manifest.clips = manifest.clips.filter((c) => c.key !== key);
  manifest.clips.push({ file: key + '.glb', key, src: path.basename(file), dur: r.dur, tracks: r.tracks, bones: r.bones, hips: r.hips, bytes: fs.statSync(out).size });
  console.log(`${path.basename(file)} → ${key}.glb (${(fs.statSync(out).size / 1024).toFixed(0)} kB, ${r.dur} s, ${r.tracks} spår, ${r.bones} ben, höft ${r.hips})`);
}
fs.writeFileSync(path.join(DST, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
