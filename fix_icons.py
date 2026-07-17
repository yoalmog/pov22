import os
from PIL import Image, ImageDraw

def create_icon(size, path):
    img = Image.new('RGBA', (size, size), (5, 6, 8, 255))
    draw = ImageDraw.Draw(img)
    # Draw something simple
    draw.ellipse((size*0.1, size*0.1, size*0.9, size*0.9), fill=(0, 180, 216, 255))
    draw.polygon([
        (size*0.5, size*0.2), 
        (size*0.8, size*0.8), 
        (size*0.2, size*0.8)
    ], fill=(255, 255, 255, 255))
    img.save(path, 'PNG')
    print(f"Created {path}")

sizes = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192
}

base_dir = "android/app/src/main/res"

if not os.path.exists(base_dir):
    print(f"Directory {base_dir} not found.")
    exit(0)

for density, size in sizes.items():
    mipmap_dir = os.path.join(base_dir, f"mipmap-{density}")
    if os.path.exists(mipmap_dir):
        # ic_launcher
        icon_path = os.path.join(mipmap_dir, "ic_launcher.png")
        if os.path.exists(icon_path):
            create_icon(size, icon_path)
            
        # ic_launcher_round
        round_path = os.path.join(mipmap_dir, "ic_launcher_round.png")
        if os.path.exists(round_path):
            create_icon(size, round_path)
            
        # ic_launcher_foreground
        fg_path = os.path.join(mipmap_dir, "ic_launcher_foreground.png")
        if os.path.exists(fg_path):
            create_icon(size, fg_path)

print("Icons fixed!")
