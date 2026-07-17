import os
from PIL import Image, ImageDraw

def create_simple_png(path, size):
    img = Image.new('RGBA', (size, size), (5, 6, 8, 255))
    draw = ImageDraw.Draw(img)
    draw.ellipse((size*0.1, size*0.1, size*0.9, size*0.9), fill=(0, 180, 216, 255))
    draw.polygon([
        (size*0.5, size*0.2), 
        (size*0.8, size*0.8), 
        (size*0.2, size*0.8)
    ], fill=(255, 255, 255, 255))
    # Save simply
    img.save(path, 'PNG')

sizes = {
  "mdpi": 48,
  "hdpi": 72,
  "xhdpi": 96,
  "xxhdpi": 144,
  "xxxhdpi": 192
}

for density, size in sizes.items():
    d = f"android/app/src/main/res/mipmap-{density}"
    if os.path.exists(d):
        create_simple_png(os.path.join(d, 'ic_launcher.png'), size)
        create_simple_png(os.path.join(d, 'ic_launcher_round.png'), size)
        create_simple_png(os.path.join(d, 'ic_launcher_foreground.png'), size)

# also splash
def get_splashes(d):
    res = []
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith('splash.png'):
                res.append(os.path.join(root, f))
    return res

for f in get_splashes("android/app/src/main/res"):
    img = Image.new('RGBA', (512, 512), (5, 6, 8, 255))
    draw = ImageDraw.Draw(img)
    draw.ellipse((100, 100, 412, 412), fill=(0, 180, 216, 255))
    img.save(f, 'PNG')

