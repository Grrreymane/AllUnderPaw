"""Rebuild centered 192px avatars from the existing transparent portraits."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CROPS = json.loads((ROOT / 'art/face-crops.json').read_text('utf-8'))


def save_face(figure, name):
    # Manually reviewed head framing, independent of weapons, tails and body pose.
    x, y, side = CROPS[name]
    assert side > 0 and 0 <= x < x + side <= figure.width and 0 <= y < y + side <= figure.height, name
    figure.crop((x, y, x + side, y + side)).resize((192, 192), Image.Resampling.LANCZOS).save(
        ROOT / 'art/faces' / (name + '.webp'), 'WEBP', quality=91, method=6)


if __name__ == '__main__':
    portraits = sorted((ROOT / 'art/portraits').glob('*.webp'))
    assert {p.stem for p in portraits} == set(CROPS), 'Every portrait needs reviewed head framing'
    for path in portraits:
        save_face(Image.open(path).convert('RGBA'), path.stem)
    print(f'Rebuilt {len(portraits)} centered avatars (192x192).')
