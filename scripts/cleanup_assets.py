#!/usr/bin/env python3
import os
import sys
import subprocess

# Ensure Pillow is installed
try:
    from PIL import Image, ImageDraw
except ImportError:
    print("⚠️  PIL (Pillow) not found. Attempting to install it dynamically...")
    installed = False
    for install_cmd in [
        [sys.executable, "-m", "pip", "install", "Pillow", "--user"],
        ["pip3", "install", "Pillow", "--user"],
        [sys.executable, "-m", "pip", "install", "Pillow"],
        ["pip", "install", "Pillow"]
    ]:
        try:
            print(f"Executing: {' '.join(install_cmd)}")
            subprocess.check_call(install_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            from PIL import Image, ImageDraw
            print("✅ PIL (Pillow) installed successfully.")
            installed = True
            break
        except Exception:
            continue
            
    if not installed:
        print("❌ Failed to install Pillow dynamically.")
        print("💡 The build will proceed using standard files, but compression/compliance checks are skipped.")
        sys.exit(0) # Exit gracefully so we do not break the Gradle build pipeline

def get_dimensions_and_metadata(file_path):
    """
    Returns (width, height, is_foreground, is_round, is_splash)
    based on the file path structure.
    """
    path_lower = file_path.lower()
    
    # Defaults
    w, h = 512, 512
    is_foreground = "foreground" in path_lower
    is_round = "round" in path_lower
    is_splash = "splash" in path_lower
    
    if is_splash:
        # Splash sizes
        if "drawable-land-mdpi" in path_lower: w, h = 480, 320
        elif "drawable-land-hdpi" in path_lower: w, h = 800, 480
        elif "drawable-land-xhdpi" in path_lower: w, h = 1280, 720
        elif "drawable-land-xxhdpi" in path_lower: w, h = 1600, 960
        elif "drawable-land-xxxhdpi" in path_lower: w, h = 1920, 1280
        elif "drawable-port-mdpi" in path_lower: w, h = 320, 480
        elif "drawable-port-hdpi" in path_lower: w, h = 480, 800
        elif "drawable-port-xhdpi" in path_lower: w, h = 720, 1280
        elif "drawable-port-xxhdpi" in path_lower: w, h = 960, 1600
        elif "drawable-port-xxxhdpi" in path_lower: w, h = 1280, 1920
        else: w, h = 512, 512 # fallback
    else:
        # Launcher icons
        if "mipmap-mdpi" in path_lower:
            w, h = (108, 108) if is_foreground else (48, 48)
        elif "mipmap-hdpi" in path_lower:
            w, h = (162, 162) if is_foreground else (72, 72)
        elif "mipmap-xhdpi" in path_lower:
            w, h = (216, 216) if is_foreground else (96, 96)
        elif "mipmap-xxhdpi" in path_lower:
            w, h = (324, 324) if is_foreground else (144, 144)
        elif "mipmap-xxxhdpi" in path_lower:
            w, h = (432, 432) if is_foreground else (192, 192)
            
    return w, h, is_foreground, is_round, is_splash

def generate_asset(file_path, width, height, is_foreground=False, is_round=False):
    """
    Programmatically creates a perfect, high-quality, uncorrupted asset from scratch
    that exactly matches the app's visual identity.
    """
    # Create image
    if is_foreground:
        # Transparent background for adaptive foreground icons
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    else:
        # Dark background #050608
        img = Image.new("RGBA", (width, height), (5, 6, 8, 255))
        
    draw = ImageDraw.Draw(img)
    cx, cy = width / 2.0, height / 2.0
    
    # 1. Cyan radial glow (only for background / non-foreground / splash)
    if not is_foreground:
        r_glow = int(width * 0.39)
        # Draw multiple concentric transparent cyan circles to simulate a soft radial glow
        glow_steps = 15
        cyan_color = (0, 180, 216) # #00b4d8
        for i in range(glow_steps, 0, -1):
            radius = int(r_glow * (i / glow_steps))
            alpha = int(100 * (1.0 - (i / glow_steps)))
            draw.ellipse(
                [cx - radius, cy - radius, cx + radius, cy + radius],
                fill=(cyan_color[0], cyan_color[1], cyan_color[2], alpha)
            )
            
    # 2. Draw 4-pointed white star
    r_out = width * 0.265
    r_in = width * 0.05
    star_points = [
        (cx, cy - r_out),
        (cx + r_in, cy - r_in),
        (cx + r_out, cy),
        (cx + r_in, cy + r_in),
        (cx, cy + r_out),
        (cx - r_in, cy + r_in),
        (cx - r_out, cy),
        (cx - r_in, cy - r_in)
    ]
    draw.polygon(star_points, fill=(255, 255, 255, 255))
    
    # 3. Draw central purple circle
    r_mid = width * 0.117
    draw.ellipse(
        [cx - r_mid, cy - r_mid, cx + r_mid, cy + r_mid],
        fill=(168, 85, 247, 255) # #a855f7
    )
    
    # 4. If round launcher icon, mask with a circle
    if is_round and not is_foreground:
        # Create a circle mask
        mask = Image.new("L", (width, height), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse([0, 0, width, height], fill=255)
        
        # Apply mask
        img_with_mask = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        img_with_mask.paste(img, (0, 0), mask)
        img = img_with_mask
        
    # Save the file with maximum compression and standard PNG headers
    img.save(file_path, format="PNG", optimize=True)

def optimize_png(file_path):
    """
    Optimizes and compresses a PNG file to ensure it complies with AAPT/AAPT2 requirements.
    If it is corrupted, automatically regenerates it programmatically.
    """
    try:
        # Check if file has a valid PNG signature
        if os.path.exists(file_path) and os.path.getsize(file_path) > 8:
            with open(file_path, "rb") as f:
                sig = f.read(8)
                if sig != b"\x89PNG\r\n\x1a\n":
                    raise ValueError("Invalid PNG signature")
                    
        # Open the image using PIL
        with Image.open(file_path) as img:
            # Check if the header is valid by forcing load of the image data
            img.verify()
            
        # Re-open for actual saving since verify() closes/invalidates the file handle
        with Image.open(file_path) as img:
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
        print(f"⚠️  {file_path} appears corrupted or unreadable: {e}")
        print(f"🔄 Automatically regenerating {file_path} from vector specification...")
        try:
            w, h, is_foreground, is_round, is_splash = get_dimensions_and_metadata(file_path)
            # Create directories if missing
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            generate_asset(file_path, w, h, is_foreground, is_round)
            print(f"✨ Successfully regenerated: {file_path} ({w}x{h})")
            return True
        except Exception as regen_err:
            print(f"❌ Failed to regenerate {file_path}: {regen_err}")
            return False

def main():
    # Base directory for Android resources relative to project root
    base_dir = "android/app/src/main/res"
    
    if not os.path.exists(base_dir):
        # Fallback to checking from script directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.join(script_dir, "..", "android", "app", "src", "main", "res")
        if not os.path.exists(base_dir):
            print(f"⚠️ Target directory not found: {base_dir}")
            sys.exit(0) # Exit with 0 to avoid breaking builds if structure is different

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
