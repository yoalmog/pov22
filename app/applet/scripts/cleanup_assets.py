#!/usr/bin/env python3
import os
import sys
import struct
import zlib
import subprocess

# Try importing PIL (Pillow), but fall back gracefully to standard library pure-Python PNG engine
HAS_PIL = False
try:
    from PIL import Image, ImageDraw
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

def create_pure_png_rgba(width, height, is_foreground=False, is_round=False):
    """
    Creates a valid 32-bit RGBA PNG image as bytes using standard library (zlib, struct)
    without needing Pillow.
    """
    # Generate RGBA pixels (width * height * 4)
    # Background: #050608 (5, 6, 8, 255) for background, (0, 0, 0, 0) for foreground
    bg_r, bg_g, bg_b, bg_a = (0, 0, 0, 0) if is_foreground else (5, 6, 8, 255)
    star_r, star_g, star_b, star_a = (255, 255, 255, 255)
    purple_r, purple_g, purple_b, purple_a = (168, 85, 247, 255)
    cyan_r, cyan_g, cyan_b = (0, 180, 216)

    cx, cy = width / 2.0, height / 2.0
    r_out = width * 0.265
    r_mid = width * 0.117
    r_glow = width * 0.39

    raw_data = bytearray()

    for y in range(height):
        raw_data.append(0)  # Filter byte 0 (None)
        dy = y - cy
        for x in range(width):
            dx = x - cx
            dist_sq = dx * dx + dy * dy
            dist = dist_sq ** 0.5

            # Default background
            r, g, b, a = bg_r, bg_g, bg_b, bg_a

            # Round mask check if is_round
            if is_round and not is_foreground and dist > (width / 2.0):
                raw_data.extend([0, 0, 0, 0])
                continue

            # Soft radial glow for non-foreground
            if not is_foreground and dist <= r_glow:
                glow_factor = max(0.0, 1.0 - (dist / r_glow))
                glow_alpha = int(100 * glow_factor)
                # Alpha blend cyan glow over background
                a_out = bg_a
                r = int(bg_r * (1 - glow_alpha / 255.0) + cyan_r * (glow_alpha / 255.0))
                g = int(bg_g * (1 - glow_alpha / 255.0) + cyan_g * (glow_alpha / 255.0))
                b = int(bg_b * (1 - glow_alpha / 255.0) + cyan_b * (glow_alpha / 255.0))

            # 4-pointed star test: abs(dx) + abs(dy) <= threshold
            # Approximated diamond/star math for fast rendering
            abs_x, abs_y = abs(dx), abs(dy)
            star_val = abs_x + abs_y
            if star_val <= r_out * 0.7 or (abs_x <= r_out and abs_y <= width * 0.05) or (abs_y <= r_out and abs_x <= width * 0.05):
                r, g, b, a = star_r, star_g, star_b, star_a

            # Central purple circle
            if dist <= r_mid:
                r, g, b, a = purple_r, purple_g, purple_b, purple_a

            raw_data.extend([r, g, b, a])

    # Compress IDAT chunk
    compressed_data = zlib.compress(raw_data, level=9)

    def make_chunk(chunk_type, data):
        length = struct.pack(">I", len(data))
        tag = chunk_type.encode('ascii')
        crc = struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
        return length + tag + data + crc

    # PNG Signature
    png_bytes = bytearray(b"\x89PNG\r\n\x1a\n")

    # IHDR: Width, Height, Bit depth = 8, Color type = 6 (RGBA), Compression = 0, Filter = 0, Interlace = 0
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png_bytes.extend(make_chunk("IHDR", ihdr_data))

    # IDAT
    png_bytes.extend(make_chunk("IDAT", compressed_data))

    # IEND
    png_bytes.extend(make_chunk("IEND", b""))

    return bytes(png_bytes)

def get_dimensions_and_metadata(file_path):
    path_lower = file_path.lower()
    w, h = 512, 512
    is_foreground = "foreground" in path_lower
    is_round = "round" in path_lower
    is_splash = "splash" in path_lower

    if is_splash:
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
        else: w, h = 512, 512
    else:
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
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    if HAS_PIL:
        if is_foreground:
            img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        else:
            img = Image.new("RGBA", (width, height), (5, 6, 8, 255))
        draw = ImageDraw.Draw(img)
        cx, cy = width / 2.0, height / 2.0

        if not is_foreground:
            r_glow = int(width * 0.39)
            glow_steps = 15
            cyan_color = (0, 180, 216)
            for i in range(glow_steps, 0, -1):
                radius = int(r_glow * (i / glow_steps))
                alpha = int(100 * (1.0 - (i / glow_steps)))
                draw.ellipse(
                    [cx - radius, cy - radius, cx + radius, cy + radius],
                    fill=(cyan_color[0], cyan_color[1], cyan_color[2], alpha)
                )

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

        r_mid = width * 0.117
        draw.ellipse(
            [cx - r_mid, cy - r_mid, cx + r_mid, cy + r_mid],
            fill=(168, 85, 247, 255)
        )

        if is_round and not is_foreground:
            mask = Image.new("L", (width, height), 0)
            mask_draw = ImageDraw.Draw(mask)
            mask_draw.ellipse([0, 0, width, height], fill=255)
            img_with_mask = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            img_with_mask.paste(img, (0, 0), mask)
            img = img_with_mask

        # Always convert to RGBA (32-bit RGBA)
        clean_img = img.convert('RGBA')
        clean_img.save(file_path, format="PNG", optimize=True)
    else:
        # Use pure Python RGBA PNG builder
        png_data = create_pure_png_rgba(width, height, is_foreground, is_round)
        with open(file_path, "wb") as f:
            f.write(png_data)

def optimize_png(file_path):
    try:
        # Verify valid PNG header signature
        if os.path.exists(file_path) and os.path.getsize(file_path) > 8:
            with open(file_path, "rb") as f:
                sig = f.read(8)
                if sig != b"\x89PNG\r\n\x1a\n":
                    raise ValueError("Invalid PNG signature")

        w, h, is_foreground, is_round, is_splash = get_dimensions_and_metadata(file_path)

        if HAS_PIL:
            with Image.open(file_path) as img:
                img.verify()
            with Image.open(file_path) as img:
                # Always convert to 32-bit RGBA
                clean_img = img.convert('RGBA')
                # Resize if dimensions do not match expected density size
                if clean_img.size != (w, h):
                    clean_img = clean_img.resize((w, h), Image.Resampling.LANCZOS)
                clean_img.save(file_path, format='PNG', optimize=True)
                print(f"✅ Re-encoded & Optimized (32-bit RGBA): {file_path}")
                return True
        else:
            # Check IHDR bit depth & color type using standard library zlib/struct
            with open(file_path, "rb") as f:
                data = f.read()
            # Read IHDR chunk
            ihdr_pos = data.find(b"IHDR")
            if ihdr_pos != -1 and len(data) >= ihdr_pos + 17:
                width_curr, height_curr, bit_depth, color_type = struct.unpack(">IIBB", data[ihdr_pos+4:ihdr_pos+14])
                # Color type 6 = RGBA, bit_depth = 8
                if color_type == 6 and bit_depth == 8 and (width_curr, height_curr) == (w, h):
                    print(f"✅ Verified 32-bit RGBA PNG: {file_path}")
                    return True
            # Otherwise regenerate as clean 32-bit RGBA PNG
            generate_asset(file_path, w, h, is_foreground, is_round)
            print(f"✨ Re-encoded to 32-bit RGBA PNG: {file_path}")
            return True
    except Exception as e:
        print(f"⚠️  {file_path} error or corrupt: {e}. Regenerating...")
        try:
            w, h, is_foreground, is_round, is_splash = get_dimensions_and_metadata(file_path)
            generate_asset(file_path, w, h, is_foreground, is_round)
            print(f"✨ Successfully regenerated 32-bit RGBA PNG: {file_path} ({w}x{h})")
            return True
        except Exception as regen_err:
            print(f"❌ Failed to regenerate {file_path}: {regen_err}")
            return False

def main():
    base_dir = "android/app/src/main/res"
    if not os.path.exists(base_dir):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.join(script_dir, "..", "android", "app", "src", "main", "res")
        if not os.path.exists(base_dir):
            print(f"Target directory not found: {base_dir}")
            sys.exit(0)

    print(f"🚀 Starting Android Asset Optimization and Compliance Cleanup in {base_dir}...")
    success_count = 0
    fail_count = 0
    total_found = 0

    for root, dirs, files in os.walk(base_dir):
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
