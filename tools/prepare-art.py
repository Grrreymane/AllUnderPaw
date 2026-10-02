"""Cut inspected LightAI sheets into fixed game assets (Pillow required).

python tools/prepare-art.py SHEET --plan art/source-sheets.json
Original sheets and service responses remain in the ignored .cache/art folder.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFilter, ImageChops
from portrait_crops import save_face

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('sheet')
p.add_argument('--plan', default='art/source-sheets.json')
args = p.parse_args()
spec = next(s for s in json.loads(Path(args.plan).read_text('utf-8')) if s['sheet'] == args.sheet)
source = ImageOps.exif_transpose(Image.open(Path('.cache/art') / (args.sheet + '_01.png'))).convert('RGB')
cols, rows = spec['cols'], spec['rows']
assert len(spec['ids']) == cols * rows
kind = spec.get('kind', 'portraits')
folder = Path('art') / kind
folder.mkdir(parents=True, exist_ok=True)
if kind == 'portraits':
    (Path('art') / 'faces').mkdir(parents=True, exist_ok=True)
for i, name in enumerate(spec['ids']):
    x, y = i % cols, i // cols
    # Observed sheet borders are thin black rules, not character content.
    inset = spec.get('inset', round(min(source.width / cols, source.height / rows) * .015))
    tile = source.crop((x * source.width // cols + inset, y * source.height // rows + inset,
                        (x+1) * source.width // cols - inset, (y+1) * source.height // rows - inset))
    if kind == 'portraits':
        # Mechanical chroma key for the explicitly requested flat magenta sheet.
        rgba = tile.convert('RGBA')
        rgba.putdata([(r, g, b, 0 if (r > 210 and b > 210 and r-g > 100 and b-g > 100)
                      or (args.sheet == 'cast-2' and r > 210 and b > 100 and g < 65) else 255)
                      for r, g, b in tile.getdata()])
        # Some sheets add detached measurement marks despite the prompt. Keep
        # the central connected character, so those marks never ship in-game.
        alpha = rgba.getchannel('A')
        cx, cy = alpha.width // 2, alpha.height // 2
        if not alpha.getpixel((cx, cy)):
            cx, cy = min(((x, y) for y in range(alpha.height) for x in range(alpha.width) if alpha.getpixel((x, y))),
                         key=lambda pt: (pt[0]-cx)**2 + (pt[1]-cy)**2)
        ImageDraw.floodfill(alpha, (cx, cy), 128)
        alpha = alpha.point(lambda v: 255 if v == 128 else 0)
        # Remove magenta spill only along the cut edge, preserving purple robes.
        edge = ImageChops.subtract(alpha, alpha.filter(ImageFilter.MinFilter(7)))
        rgba.putdata([(min(r, g+12), g, min(b, g+12), a) if e and r > g+25 and b > g+25 else (r,g,b,a)
                      for (r,g,b,a),e in zip(rgba.getdata(),edge.getdata())])
        rgba.putalpha(alpha)
        bounds = rgba.getbbox()
        if not bounds:
            raise ValueError('Empty character: ' + name)
        figure = rgba.crop(bounds)
        figure.thumbnail((352, 480), Image.Resampling.LANCZOS)
        tile = Image.new('RGBA', (384, 512))
        tile.alpha_composite(figure, ((384 - figure.width)//2, 496 - figure.height))
        tile.save(folder / (name + '.webp'), 'WEBP', quality=91, method=6)
        save_face(tile, name)
    else:
        tile = ImageOps.fit(tile, (1280, 720), method=Image.Resampling.LANCZOS)
        tile.save(folder / (name + '.webp'), 'WEBP', quality=90, method=6)
    print(f'{name}: {tile.width}x{tile.height}')
