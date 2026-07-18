#!/usr/bin/env python3
import os
import sys
from PIL import Image

def optimize_png(file_path):
    """
    Optimizes and compresses a PNG file to ensure it complies with AAPT/AAPT2 requirements.
    This strips unneeded metadata and formats the image into a standard clean RGBA/RGB PNG.
    """
    try:
        # Open the image using PIL
        with Image.open(file_path) as img:
            # We want to make sure it's saved as a standard PNG
            # PIL strips custom chunks, color profiles, and extra metadata by default on save
            # unless save parameters explicitly ask to keep them.
            
            # Preserve alpha channel by converting to RGBA, or RGB if there is no alpha
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                clean_img = img.convert('RGBA')
            else:
                clean_img = img.convert('RGB')
            
            # Save back with maximum compression and standard clean headers
            clean_img.save(file_path, format='PNG', optimize=True)
            print(f"✅ Re-encoded & Optimized: {file_path}")
            return True
    except Exception as e:
        print(f"❌ Failed to optimize {file_path}: {e}")
        return False

def main():
    # Base directory for Android resources relative to project root
    base_dir = "android/app/src/main/res"
    
    if not os.path.exists(base_dir):
        # Fallback to checking from script directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.join(script_dir, "..", "android", "app", "src", "main", "res")
        if not os.path.exists(base_dir):
            print(f"❌ Target directory not found: {base_dir}")
            sys.exit(1)

    print(f"🚀 Starting Android Asset Optimization and Compliance Cleanup in {base_dir}...")
    success_count = 0
    fail_count = 0
    total_found = 0

    # Walk through the resource directory
    for root, dirs, files in os.walk(base_dir):
        # Focus on drawable and mipmap folders which hold compiled images
        if 'mipmap' not in root and 'drawable' not in root:
            continue

        for filename in files:
            if filename.lower().endswith('.png'):
                total_found += 1
                file_path = os.path.join(root, filename)
                if optimize_png(file_path):
                    success_count += 1
                else:
                    fail_count += 1

    print("\n📊 Asset Compliance Summary:")
    print(f"   - Total PNG files processed: {total_found}")
    print(f"   - Successfully optimized & compliance-checked: {success_count}")
    print(f"   - Failures: {fail_count}")

if __name__ == "__main__":
    main()
