# v9 comic card art (Oct 23, 2026) — deployed c4e3d65b
Style: 2010s cartoon-shorts (bold brush outlines, flat cel colour, squash/stretch), cream #F5F0E6 bg + one flat world-accent disc
(w1 #E9B949, w2 #D9A441/#C48A22, w3 #C8D2DD silver, w4 #C9A8F2 lavender). Original characters only.
Cast (cast.json, model sheets cast/cast-<id>.png, used as image_paths ref for every card):
fox Fenn (teal scarf), owl Hoot (specs, mustard beanie), turtle Tango (amber shell, red sneakers), rabbit Pip (caramel, floppy ear, yellow overalls; v1 rejected as too Bugs-like),
bear Bo (backwards red cap), frog Ribbit (purple stripe tee), raccoon Rizzo (orange hoodie), otter Ollie (blue goggles), elephant Ellie (pink tee), penguin Percy (red beanie + mittens).
Rotation: one global sequence w1..w4 in level order, animal = CAST[i % 10] -> 8 each, never adjacent repeats (prompts.py).
Files: originals <w>/<id>.png (1024), rejected takes <id>.rN.png. export.py -> worlds/<w>/art 600px webp q78, app/src/art mirror, landing/img 440px.
sheets.py -> work/screens/v9-cast.png, v9-contact-w*.png. shoot.py -> v9-390-*.png.
CSS: removed grayscale(1) from .orb-face img, .morb-face img, .wx-rrow img (locked orbs + blurred backdrops stay grayscale). Pre-v9 css in v_ink_backup/.
Old ink art: work/art/v_ink_backup/.
