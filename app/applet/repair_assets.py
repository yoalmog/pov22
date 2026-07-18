import os
from PIL import Image

def repair_android_pngs():
    base_dir = "android/app/src/main/res"
    if not os.path.exists(base_dir):
        print(f"Directory {base_dir} not found.")
        return

    print(f"🚀 Starting Asset Repair in {base_dir}...")
    repaired_count = 0
    
    for root, dirs, files in os.walk(base_dir):
        if 'mipmap' not in root and 'drawable' not in root:
            continue

        for filename in files:
            if filename.lower().endswith('.png'):
                file_path = os.path.join(root, filename)
                try:
                    with Image.open(file_path) as img:
                        # Convert to standard RGBA
                        img = img.convert('RGBA')
                        # Save back without optimization to ensure standard chunks
                        img.save(file_path, format='PNG')
                        repaired_count += 1
                        print(f"🛠️  Repaired: {file_path}")
                except Exception as e:
                    print(f"❌ Error processing {file_path}: {e}")

    print(f"✅ Asset Repair Complete. Repaired {repaired_count} files.")

if __name__ == "__main__":
    repair_android_pngs()
