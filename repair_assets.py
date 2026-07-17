import os
from PIL import Image

def repair_assets():
    target_dir = "public/uploads"
    if not os.path.exists(target_dir):
        print(f"Directory {target_dir} not found. Creating it...")
        os.makedirs(target_dir)
        return

    print(f"🚀 Starting Asset Repair in {target_dir}...")
    repaired_count = 0
    for filename in os.listdir(target_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp')):
            file_path = os.path.join(target_dir, filename)
            try:
                with Image.open(file_path) as img:
                    if img.size == (128, 64) and img.mode == 'L': continue
                    print(f"🛠️  Repairing: {filename} ({img.size} -> 128x64)")
                    img = img.convert('L')
                    img.thumbnail((128, 64), Image.Resampling.LANCZOS)
                    new_img = Image.new('L', (128, 64), 0)
                    paste_pos = ((128 - img.size[0]) // 2, (64 - img.size[1]) // 2)
                    new_img.paste(img, paste_pos)
                    new_img.save(file_path, optimize=True)
                    repaired_count += 1
            except Exception as e:
                print(f"❌ Error processing {filename}: {e}")

    print(f"✅ Asset Repair Complete. Repaired {repaired_count} files.")

if __name__ == "__main__":
    repair_assets()
