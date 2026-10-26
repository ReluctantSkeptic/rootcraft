# v14 (Oct 25, 2026): crayon card redesign + card backs
Style ref: files/uploads/image-feac33ef14c1.webp (printed kids' activity cards).

## Card structure (game app/src/app.js rootCard + landing.js rootCard, same CSS in styles.css / landing.css)
.tilt (perspective, --cb border colour, --cb-ink back text colour, data-shape dots|star)
  > article.rcard (spring tilt target; transparent; preserve-3d only once it has a back: .has-back)
    > .rface (front: crayon border = var(--cb) + card/grain.webp riso grain; ::before = cream #F8F1E2 panel cut by
      card/panel.webp mask (rough chalk edge); container-type inline-size so cqw = card width)
        > .rcard-in (text + .rcard-art with style="--art:url(...)": img object-fit contain, scale 1.08, overflow visible)
            .holo is masked by var(--art) -> rainbow/glitter only on the character, never on the cream
        > .sheen, .glare, canvas.spark (z 2-4)
    > .rback (added on first flip): solid --cb + grain, ::before big grainy riso shape (card/back-dots.webp lighter tint,
      or card/back-star.webp darker tint), wordmark "Root/craft" (Bricolage 800) + "learn the roots".
Flip: bindFlip(t) on every .tilt (game: tilt-main, tilt-mini results, tilt-wm Words; landing: parade, how, worlds).
A tap = pointerdown->pointerup < 8 px and < 600 ms; drags (parade, Words swipe with pointer capture) never flip.
.rcard.is-flipped rotates .rface to -180 and .rback to 0 (.52s). Reduced motion: opacity crossfade, no rotation.
holoSparkle draws on the visible face. Option cards (.pcard) are untouched (pick only).

## Crayon colours (CRAYON in app.js; landing.js has the generated per-root map)
Each world = a family of 3 crayons, rotating by level index (li % 3); back shape alternates dots/star by li % 2.
ink: red #E0412F, cobalt #2453B8, marigold #F2A61F (primaries, "start here") | gold: marigold #F0A01C, tangerine #E5602A, brick #C7362B
silver: cobalt #2858C2, teal #13938C, cerulean #1E8CD0 | amethyst: grape #7449C2, berry #D0407E, leaf #3E9B50
Landing ROW_A was reordered (port spect rupt aud struct dict mot graph vis form tract phon) so no two neighbours share a colour.
If world.json level order changes, regenerate the landing CRAYON map (snippet in work/v14/NOTES.md history: python over worlds/*/world.json).

## Textures: app/src/card/*.webp (generator work/art/v14/textures.py, seeded)
panel.webp 504x704 alpha (8 KB), grain.webp 192 tile (3 KB), back-star / back-dots 504x704 alpha (~15-19 KB, only load on flip).
build.py: styles.css url(card/x.webp) -> play/art/card/x.<hash>.webp; landing gets dist/img/card/ (copy of app/src/card).

## Transparent art
work/art/v14/: masks.py (rembg isnet-general-use priors, 1024), cutout.py (cream + flat disc colour key; disc circle fit so
every disc piece reaching the rim is background; cream inside the disc is kept (penguin bellies, drum heads); soft matte by
un-mixing edge pixels between nearest bg and fg colour = no halos; per-image overrides in fix.json), export14.py
(600 px game webp + w1 mirror + 440 px landing, q72 / alpha q70), sheet.py (contact sheet on cream/red).
Originals backed up in work/art/v_disc_backup/ (worlds/<w>/art, art/, landing_img/); 1024 sources still work/art/v9/<w>/<id>.png.
Known small leftovers (invisible on cream, visible only on the red check): faint rim arcs on w1_tract, w1_super crescent,
w2_dynam left arc, w3_mono pale swipe; w2_tele / w4_aqua / w2_astro keep their painted scene circles (part of the art).
Outside cards (world orbs, map nodes, home orbs, Words index rows) the old cream + accent disc is painted back with a CSS
radial-gradient on the img (end of styles.css "v14").

## Tests
work/v14/shoot14.py [tag] [level,flip,words,result,map,landing] -> work/screens/v14-cards-*.png
work/v14/func14.py: landing drag no flip / tap flips / tap again unflips, Words swipe navigates without flip, tap flips,
reduced-motion crossfade. Playwright 1.49.1 needs LD_LIBRARY_PATH to a dir with libatk/libatspi/libXcomposite/libXdamage.
Pre-v14 copies: work/v14/bak/ (app.js, styles.css, landing.js, landing.css).
