# Rootcraft landing (v7) — notes
Files: app/src/landing/{index.html, landing.css, landing.js, fonts/, img/}. Self-contained, relative paths, only link out is CTA "/play/" (x3). v6 copy kept in work/landing/v6-backup/.
Weight: img ~705 KB (25 art webp @440px, grayscale game art + glitter; lazy), fonts 106 KB.
Design ref: timeless.co/type (tight display type, single gold accent, springy easings), Bricolage Grotesque + Newsreader Italic.

Sections (order) — v10 (2026-10-23) moved the parade to the top:
0 TOP (section.collect.top-sec#top): h1 "Learn the roots of our words" (gold em on roots) + the two-shelf card parade + Play CTA, all above the fold (cards sized by --cw clamp with svh). Behind it: canvas.hero-ascii = ambient ASCII trees (heroAscii() in landing.js; standalone copy work/landing/hero-ascii.js is the pre-move version).
   Trees: 3 on desktop >=1100 (2 at 720-1100, 2 small on phone), rooted at bottom corners, seeded RNG (same look per width), trunk/branch growth char by char over ~15s after load+idle, leaf clusters (& % @ * o . and ~6% root letters, ~55% gold), sway = sine offset * height^1.6 (~11s period, amp 7px desktop / 4px phone), a twig sprouts every 3-7s (max 14 live, oldest fades). Alpha ~5.5-7.5%. Keep-out: h1 lines, Play, nav (branches bend away, stop at edge); cards are opaque and sit on top. Glyph atlas + drawImage, DPR cap 1.5, 30fps throttle, paused by IntersectionObserver/visibilitychange. Reduced motion: fully grown, static.
1 hero forge (#forge, port + trans/able/im/ex/re..er/sup). Play button removed (CTA lives in top section); h1 became sr-only h2. Intro (letters rise) now fires the first time the forge is 40% in view (body.pre hides it until then).
2 TREE "Learn one root. Unlock dozens of words." — pinned 280vh (phone 260vh), scroll-scrubbed. SVG tapered ink ribbons (geometry regrown each frame by arc length — NOT masks: masks were 12fps), leaves spring in, gold glow at growth tip, bud + ring, word blooms (blur->sharp). Desktop: 3 branches per side + 6 twig words; phone: trunk with alternating branches, no twigs.
   Main words: transport, portable, export, import, report, portfolio; twigs passport, porter, airport, teleport, deport, support (twigs 4 are real English words not in the game).
3 PIECES "Big words are just small pieces." — on view, cycles tele|scope, uni|cycle, auto|graph: letters rise, split with gold seam, meanings drop, "= definition".
4 GUESS "Know the pieces. Guess the word." — pedometer: ghost word + "?", ped (foot) and meter (measure) light with paper chips, "It counts your steps." Click replays.
5 HOW (pinned 340vh): deal, reals light gold; fakes go dark, then CRUMPLE: WebGL2 sheet 41x27 verts per fake, cached per-vertex noise (ridged wrinkles -> lumpy ball, printed face folds inward), half flat/half smooth normals, paper-stock back, then drop + 2 bounces to spread landing spots under the hand, DOM contact shadow. Scroll-scrubbed & reversible. No WebGL2 -> CSS fall fallback. Shards/crack removed.
6 PARADE (now section 0, heading "Learn the roots of our words") — two shelves, opposite directions, each tile placed per frame on a drum curve (rotateY + arc + depth), scroll boosts speed, hover slows row, drag scrubs (mouse; touch locks axis, vertical scroll still works). Teaching cards: root, creature, italic meaning, 2-3 words with root in gold. Foil/blend layers only on hovered card (perf).
   Row A (Latin/w1): port spect rupt dict struct aud graph vis tract phon mot form. Row B: tele aqua uni astro ped therm tri manu photo cent scope auto. No fect/fic/duce/verse spellings.
7 WORLDS (pinned 420vh horizontal): each panel = step, level count, language, note, category, 4 root -> word pairs, and a real root card with world-foil frame (port / tele / tri / aqua).
   Ink: Latin building blocks, Step 1, 31 levels, Latin + a little Greek, "Start here · ages 8+". Gold: Greek science & wonder, 16. Silver: Numbers & measure, 17. Amethyst: Living things & the body, 16, "The longest words".
   Level counts + roots verified against worlds/w*/world.json on 2026-10-23 (all shown roots present). Update WORLDS in landing.js if counts/roots change.
8 END "Words have roots." + Play.

Reduced motion: tree finished, pieces static split, guess solved, crumple renders final balls, shelves become horizontal scroll rows, worlds stacked.
Test scripts: shoot7.py (section frames both widths), extra7.py (drag/hover, reduced motion), fps7.py/fps7b.py, stitch7.py (stitched "full" — Chromium full_page capture breaks on sticky pins).
Perf (headless CPU raster, no GPU; do NOT use --use-angle=swiftshader flags, they make compositing ~1fps): hero 60, tree scrub 60, parade 30, how scrub ~38, worlds ~35. Real GPU expected 60.

## Link previews (OG), added 2026-10-23
- Assets live in app/src/share/ (og.jpg 1200x630 poster, og.mp4 1200x630 7.0 s H.264 Main yuv420p silent faststart ~310 KB, apple-touch-icon.png 180) and build.py copies that folder to the dist root.
- Tags (og:*, og:video*, twitter summary_large_image, canonical, apple-touch-icon; landing also got <link rel=icon href=/icon.svg>) are in app/src/landing/index.html and app/src/index.html (/play/). Absolute URLs on https://rootcraft.pages.dev.
- Video = the port tree with twigs removed. Loop: full tree hold, fade, bare "port", regrow, hold. The first frame and the last frame are pixel-identical, so it loops seamlessly (iMessage autoplays it muted and looping).
- Regenerate: python3 work/og/gen.py (extracts tree() from landing.js into work/og/capture.html) -> python3 work/og/shoot.py frames 30 7.0 0 105 and again with 105 210 (DPR 2, deterministic virtual clock: every CSS transition is paused and seeked) -> ffmpeg (see the README in work/og). Poster = frame 0.
- _headers: tools/cf_pages_deploy.py now sends _headers/_redirects as form fields (the way wrangler does). Before this fix they were uploaded as plain assets and never applied, so the immutable cache rules on /play/ assets and Referrer-Policy were not live before 2026-10-23.
- iMessage caches the preview per URL on the sender's device. To test a change, send a fresh URL such as https://rootcraft.pages.dev/?v=2.

## v10 tests (2026-10-23)
- work/landing/ascii10.py (screens at t=2/10/25s both widths + x12 alpha-amplified canvas views), check10.py (sway frame diffs, fps, forge, reduced motion), ab10.py (fps trees on vs off).
- Playwright: latest pip playwright has no linux-arm64 browser build; use playwright==1.49.1. Headless browser here cannot reach the public internet, so live checks are curl-only.
- Deploy needs pip blake3; run tools/cf_pages_deploy.py without the credentials param (proxy injects the token).
- Backup of pre-v10 landing: work/landing/v9-backup/.

## v11 holo extras (2026-10-23): auto shimmer + press sparkle
- Same snippet ("holo extras (v11)": AUTO, ORI, holoDrift, holoWatch, holoSparkle) is pasted in app/src/app.js (before bindTilt) and app/src/landing/landing.js (before makeCard); source copy work/v11/holo-extras.js. Edit both if changed.
- AUTO = matchMedia('(hover: none), (pointer: coarse)'): cards in view (shared IntersectionObserver) drift on a Lissajous (x 8.2 s, y 6.1 s, o ~.5, random phase per card) + Android deviceorientation (no iOS permission flow). Desktop unchanged. Reduced motion: no drift. Paused when tab hidden.
- Landing parade on touch: the cards with |dx| < .72 from centre drop .lite and shimmer; c.fade ramps foil opacity to 0 at the zone edge (no pop). Worlds panel cards add half-amplitude drift on top of their ambient pose.
- Press sparkle: passive pointerdown on every .tilt -> canvas.spark inside .rcard (clipped by card radius): bloom, one rainbow ripple ring, 13 four-point stars + 21 glints, ~780 ms, fades fast on pointercancel (scroll). Game .pcard option cards untouched.
- Tests: work/v11/shoot11.py (drift frames, functional checks), work/v11/press11.py (deterministic frozen-clock burst frames). Backups: work/v11/*.bak, work/v11/app.js, styles.css.

## v12 (2026-10-23): Lamplight background + level panels
- ASCII hero trees REMOVED (canvas, CSS, heroAscii()). Standalone copy still in work/landing/hero-ascii.js; pre-v12 files in work/landing/v11-backup/.
- app/src/landing/bg.js (new, loaded before landing.js): one fixed WebGL1 canvas .bg-ink (z -1) = consultant A "Lamplight" domain-warped fbm smoke + consultant B iron-gall veins; lamp hangs above each section's heading with a keep-out rect (lamp dimmed 75% inside the heading box); vignette; luminance cap = #2A2218. Palette per section in PAL/MAP (top, forge ember, tree green-gold lamp climbing with progress, pieces/guess quiet, how cool silver, intro neutral -> Ink, end warm gold 14%), crossfade over the last ~40vh of each section + 600ms easing. Quarter res (1/6 phones, 3 octaves), 30fps, paused on hidden tab, while How is pinned past 20% (crumple) and while Worlds pinned. Scroll velocity boosts drift up to 1.5x. Reduced motion: one still frame, re-tinted on scroll. No WebGL / context lost: CSS .bg-aurora (Aurora Pools). Test hook window.__rcbg {t, still()}.
- body background is now transparent, html #0D0B0A; .hero-bg::after opaque vignette replaced by a mask on the blurred img.
- CSS lives in the delimited "v12 BACKGROUND + LEVELS" block at the end of landing.css (also .wintro gradient into Level One, .worlds::before top fade, .end top fade from Amethyst bg).
- Worlds: new section .wintro "Four classes of words." (no eyebrow). Panels: giant heading = WORLDS[].lvl ("Level One".."Level Four"), one sentence WORLDS[].line, then the 4 root->word pairs + root card. wmeta/wnote/wcat no longer rendered (step/levels/lang/note fields kept in data, unused). Amethyst line keeps "Living things & the body".
- Tests: work/landing/shoot12.py (screens + 4-frame bg strip -> work/screens/v12-*), check12.py (fallback/RM/draw cost).
