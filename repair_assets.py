import os
from PIL import Image

logo_source = "./src/assets/images/holospin_logo_1779992483848.png"

if not os.path.exists(logo_source):
    print(f"Error: Source image {logo_source} not found. Skipping asset regeneration.")
    exit(0) # Exit gracefully so CI doesn't fail if source is missing

# Mapping of file path to (width, height)
assets_to_generate = {
    # Mipmaps (Icons)
    "android/app/src/main/res/mipmap-mdpi/ic_launcher.png": (48, 48),
    "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png": (48, 48),
    "android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png": (108, 108),
    
    "android/app/src/main/res/mipmap-hdpi/ic_launcher.png": (72, 72),
    "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png": (72, 72),
    "android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png": (162, 162),
    
    "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png": (96, 96),
    "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png": (96, 96),
    "android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png": (216, 216),
    
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png": (144, 144),
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png": (144, 144),
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png": (324, 324),
    
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png": (192, 192),
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png": (192, 192),
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png": (432, 432),
    
    # Splash screens (Drawables)
    "android/app/src/main/res/drawable/splash.png": (512, 512),
    "android/app/src/main/res/drawable-port-mdpi/splash.png": (320, 480),
    "android/app/src/main/res/drawable-port-hdpi/splash.png": (480, 800),
    "android/app/src/main/res/drawable-port-xhdpi/splash.png": (720, 1280),
    "android/app/src/main/res/drawable-port-xxhdpi/splash.png": (960, 1600),
    "android/app/src/main/res/drawable-port-xxxhdpi/splash.png": (1280, 1920),
    
    "android/app/src/main/res/drawable-land-mdpi/splash.png": (480, 320),
    "android/app/src/main/res/drawable-land-hdpi/splash.png": (800, 480),
    "android/app/src/main/res/drawable-land-xhdpi/splash.png": (1280, 720),
    "android/app/src/main/res/drawable-land-xxhdpi/splash.png": (1600, 960),
    "android/app/src/main/res/drawable-land-xxxhdpi/splash.png": (1920, 1280),
}

print(f"Starting asset regeneration using Pillow and source: {logo_source}")

try:
    with Image.open(logo_source) as img:
        # Convert to RGBA if not already
        img = img.convert("RGBA")
        
        for path, (w, h) in assets_to_generate.items():
            # Make sure parent directory exists
            os.makedirs(os.path.dirname(path), exist_ok=True)
            
            if "splash" in path:
                # Create a black canvas of size WxH
                canvas = Image.new("RGBA", (w, h), (0, 0, 0, 255))
                # Scale logo to fit 60% of the smallest dimension
                logo_size = int(min(w, h) * 0.6)
                scaled_logo = img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
                # Paste logo onto center of canvas
                offset = ((w - logo_size) // 2, (h - logo_size) // 2)
                canvas.paste(scaled_logo, offset, scaled_logo)
                # Save as PNG
                canvas.save(path, "PNG")
            else:
                # Standard icon resize
                resized_img = img.resize((w, h), Image.Resampling.LANCZOS)
                resized_img.save(path, "PNG")
                
            print(f"Generated: {path} ({w}x{h})")
            
except Exception as e:
    print(f"Failed to regenerate assets: {e}")

print("Asset regeneration complete!")
