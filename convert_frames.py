"""Convert journey_frames PNGs to WebP for web delivery.

PNG originals stay untouched; WebP output goes to public/journey_frames_webp.
"""
import os
import sys
from concurrent.futures import ProcessPoolExecutor
from PIL import Image

SRC = r"D:\portfolio\frames_src_png"
DST = r"D:\portfolio\public\journey_frames"
QUALITY = 72


def convert(name: str) -> int:
    out = os.path.join(DST, name[:-4] + ".webp")
    if os.path.exists(out):
        return os.path.getsize(out)
    im = Image.open(os.path.join(SRC, name)).convert("RGB")
    im.save(out, "WEBP", quality=QUALITY, method=4)
    return os.path.getsize(out)


if __name__ == "__main__":
    os.makedirs(DST, exist_ok=True)
    names = sorted(n for n in os.listdir(SRC) if n.endswith(".png"))
    print(f"Converting {len(names)} frames at quality {QUALITY}...")
    total = 0
    with ProcessPoolExecutor() as pool:
        for i, size in enumerate(pool.map(convert, names, chunksize=20)):
            total += size
            if (i + 1) % 200 == 0:
                print(f"  {i + 1}/{len(names)} done, avg {total // (i + 1) // 1024} KB")
    print(f"DONE: {len(names)} frames, total {total / 1024 / 1024:.1f} MB, avg {total // len(names) // 1024} KB/frame")
