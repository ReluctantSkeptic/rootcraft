# OG preview pipeline
python3 gen.py                                  # capture.tpl.html + tree() from app/src/landing/landing.js -> capture.html
python3 shoot.py stills 0 2.5 5.0               # quick check stills (still-*.png)
python3 shoot.py frames 30 7.0 0 105; python3 shoot.py frames 30 7.0 105 210   # 2400x1260 PNGs (DPR 2), ~45 s per half
ffmpeg -y -framerate 30 -i frames/f%04d.png -vf "scale=1200:630:flags=lanczos,format=yuv420p" -c:v libx264 -profile:v main -level 3.1 -preset slow -crf 16 -tune animation -an -movflags +faststart og.mp4
ffmpeg -y -i frames/f0000.png -vf "scale=1200:630:flags=lanczos" -q:v 2 og.jpg
cp og.jpg og.mp4 apple-touch-icon.png ../../app/src/share/
Timeline (CFG in shoot.py): 0-0.5 s full tree, 0.5-1.05 s fade, bare port, regrow 1.35-5.15 s (blooms settle ~5.8 s), hold to 7.0 s. Needs playwright==1.55.0 (newer has no linux-arm64 build) + apt libatk1.0-0t64 libatspi2.0-0t64 libxcomposite1 libxdamage1.
