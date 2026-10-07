"""Prepares every photo ahead of time, so no photo is ever resized while a customer waits.

For each public/images/<name>.jpg it writes public/img/<name>-<width>.webp for every width the site asks
for (next.config.ts imageSizes + deviceSizes). The browser then downloads a finished file straight from
Vercel's global network: instant for every visitor, including the first one after a change.

Run after adding or changing photos (a changed photo must get a NEW file name), then make-blur.py:
    python3 scripts/make-images.py && python3 scripts/make-blur.py
A test fails if this was forgotten."""
import glob, os
from PIL import Image

WIDTHS = [96, 192, 480, 828, 1200, 1600]  # keep in sync with next.config.ts (imageSizes + deviceSizes)
QUALITY = 72
os.makedirs("public/img", exist_ok=True)

made = 0
for path in sorted(glob.glob("public/images/*.jpg")):
    name = os.path.basename(path)[:-4]
    src = Image.open(path).convert("RGB")
    for w in WIDTHS:
        out = f"public/img/{name}-{w}.webp"
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(path):
            continue
        im = src if src.width <= w else src.resize((w, round(src.height * w / src.width)), Image.LANCZOS)
        im.save(out, "WEBP", quality=QUALITY, method=6)
        made += 1
files = glob.glob("public/img/*.webp")
print(f"{made} made, {len(files)} files, {sum(os.path.getsize(f) for f in files) // 1024} KB")
