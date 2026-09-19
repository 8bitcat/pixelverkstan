# Plockar ut de inbäddade texturerna (PNG) ur Mixamo-FBX:erna i assets/3d/mixamo/ och skalar ner
# dem till 512 px i assets/3d/mixamo-tex/<figur>/ (ignoreras av git). Diffuse sparas som PNG
# (alfa för hår), normalkartor som JPG. Specular/Glossiness hoppas över (glTF använder
# metal/roughness). tools/mixamo-convert.mjs läser sedan dessa i stället för de inbäddade
# 4096²-bilderna, som webbläsaren inte hinner avkoda.
#   python tools/fbx-textures.py [filter] [storlek=512]
import io, os, re, sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', '3d', 'mixamo')
DST = os.path.join(ROOT, 'assets', '3d', 'mixamo-tex')
flt = sys.argv[1] if len(sys.argv) > 1 else ''
SIZE = int(sys.argv[2]) if len(sys.argv) > 2 else 512
NAME_RE = re.compile(rb'([A-Za-z0-9_\-]+)\.(png|jpg|jpeg|tga)', re.I)

def textures_in(b):
    """[(namn, png-bytes)] – varje inbäddad PNG hör till närmast föregående filnamn (Video-noden)."""
    out, i = [], 0
    while True:
        s = b.find(b'\x89PNG\r\n\x1a\n', i)
        if s < 0: break
        e = b.find(b'IEND', s)
        if e < 0: break
        e += 8
        names = [m for m in NAME_RE.finditer(b, max(0, s - 4000), s)]
        name = names[-1].group(1).decode('latin1') if names else 'tex%d' % len(out)
        out.append((name, b[s:e]))
        i = e
    return out

os.makedirs(DST, exist_ok=True)
for f in sorted(os.listdir(SRC)):
    if not f.lower().endswith('.fbx') or flt not in f: continue
    b = open(os.path.join(SRC, f), 'rb').read()
    texs = textures_in(b)
    if not texs: print(f, 'inga texturer'); continue
    # figurens namn = första delen av första texturnamnet (Ch03_1001_Diffuse → Ch03, Remy_Shoes_Diffuse → Remy)
    base = texs[0][0].split('_')[0]
    d = os.path.join(DST, base)
    os.makedirs(d, exist_ok=True)
    written = []
    for name, png in texs:
        kind = name.split('_')[-1].lower()
        if kind in ('specular', 'glossiness', 'gloss'): continue
        try:
            im = Image.open(io.BytesIO(png))
            im.load()
        except Exception as e:
            print('  trasig', name, e); continue
        if im.width > SIZE or im.height > SIZE: im = im.resize((SIZE, SIZE), Image.LANCZOS)
        if kind == 'normal':
            path = os.path.join(d, name + '.jpg'); im.convert('RGB').save(path, quality=88)
        else:
            has_alpha = im.mode in ('RGBA', 'LA') and im.getextrema()[-1][0] < 250
            if has_alpha: path = os.path.join(d, name + '.png'); im.convert('RGBA').save(path, optimize=True)
            else: path = os.path.join(d, name + '.jpg'); im.convert('RGB').save(path, quality=88)
        written.append('%s (%d KB)' % (os.path.basename(path), os.path.getsize(path) // 1024))
    print(f, '->', base, ':', ', '.join(written))
