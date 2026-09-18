# Hämtar CC0-tillgångar från Poly Haven (modeller, PBR-texturer, HDRI) till assets/3d.
# python tools/ph-fetch.py            – hämtar allt i listorna nedan (hoppar över det som finns)
# python tools/ph-fetch.py model X    – hämtar en enskild modell/textur/hdri: model|tex|hdri NAMN
import json, os, sys, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', '3d')
API = 'https://api.polyhaven.com/files/'
MODELS = ['steel_frame_shelves_01', 'wooden_display_shelves_01', 'CashRegister_01', 'sofa_02', 'modern_arm_chair_01',
          'coffee_table_round_01', 'potted_plant_02', 'cardboard_box_01', 'gaming_console',
          'standing_chalkboard_01', 'drawer_cabinet', 'wall_clock', 'mounted_fluorescent_lights',
          'hanging_picture_frame_01', 'plastic_crate_02', 'WetFloorSign_01', 'security_camera_01', 'gamepad']
TEXTURES = ['floor_tiles_06', 'laminate_floor_02', 'terrazzo_tiles', 'concrete_floor_worn_001', 'plastered_wall_04', 'white_plaster_02',
            'beige_wall_001', 'wood_table_001', 'oak_veneer_01', 'plywood', 'dark_wood', 'blue_metal_plate', 'fabric_leather_02',
            'ceiling_interior', 'square_tiles', 'asphalt_floor']
HDRIS = [('docklands_02', '1k')]

def get(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return os.path.getsize(dest)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'pixelverkstan-fetch'})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, 'wb') as f:
        data = r.read(); f.write(data)
    return len(data)

def files(name):
    req = urllib.request.Request(API + name, headers={'User-Agent': 'pixelverkstan-fetch'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))

def model(name, res='1k'):
    d = files(name)['gltf'][res]['gltf']
    base = os.path.join(ROOT, 'models', name)
    total = get(d['url'], os.path.join(base, os.path.basename(d['url'])))
    for rel, inc in d.get('include', {}).items():
        total += get(inc['url'], os.path.join(base, *rel.split('/')))
    print(f'model {name}: {total // 1024} kB')

def texture(name, res='1k'):
    d = files(name)
    base = os.path.join(ROOT, 'tex', name)
    total = 0
    for key in ('Diffuse', 'nor_gl', 'arm'):
        if key not in d:
            print(f'  {name}: saknar {key}'); continue
        u = d[key][res]['jpg']['url']
        total += get(u, os.path.join(base, os.path.basename(u)))
    print(f'tex {name}: {total // 1024} kB')

def hdri(name, res='1k'):
    d = files(name)
    u = d['hdri'][res]['hdr']['url']
    n = get(u, os.path.join(ROOT, 'hdri', os.path.basename(u)))
    print(f'hdri {name} {res}: {n // 1024} kB')

if __name__ == '__main__':
    a = sys.argv[1:]
    if len(a) == 2:
        {'model': model, 'tex': texture, 'hdri': hdri}[a[0]](a[1])
    else:
        for m in MODELS:
            try: model(m)
            except Exception as e: print('FEL model', m, e)
        for t in TEXTURES:
            try: texture(t)
            except Exception as e: print('FEL tex', t, e)
        for h, r in HDRIS:
            try: hdri(h, r)
            except Exception as e: print('FEL hdri', h, e)
        n = get('https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/models/gltf/Xbot.glb', os.path.join(ROOT, 'chars', 'Xbot.glb'))
        print(f'char Xbot: {n // 1024} kB')
