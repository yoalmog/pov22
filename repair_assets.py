import os
import sys
from PIL import Image

def repair_assets():
    """
    Scans the public/uploads directory and ensures all images are:
    1. Resized to 128x64
    2. Converted to 8-bit grayscale
    3. Optimized for ESP32 memory constraints
    """
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
                    # Check if already optimized
                    if img.size == (128, 64) and img.mode == 'L':
                        continue
                    
                    print(f"🛠️  Repairing: {filename} ({img.size} -> 128x64)")
                    
                    # Convert to grayscale
                    img = img.convert('L')
                    
                    # Maintain aspect ratio with padding if needed, or force resize
                    # For POV, we usually want to fit the display area
                    img.thumbnail((128, 64), Image.Resampling.LANCZOS)
                    
                    # Create black background for padding
                    new_img = Image.new('L', (128, 64), 0)
                    paste_pos = ((128 - img.size[0]) // 2, (64 - img.size[1]) // 2)
                    new_img.paste(img, paste_pos)
                    
                    # Save back
                    new_img.save(file_path, optimize=True)
                    repaired_count += 1
            except Exception as e:
                print(f"❌ Error processing {filename}: {e}")

    print(f"✅ Asset Repair Complete. Repaired {repaired_count} files.")

if __name__ == "__main__":
    repair_assets()
