# Rootcraft v6 engine notes (for world agents and integration)

## Build and deploy
- `python3 app/build.py`: strict. Any invalid world fails the build (exit 1) and the errors are listed per world.
- `python3 app/build.py --allow-partial`: leaves out invalid worlds, names them loudly, and builds the rest. Use it while worlds are still in progress.
- Validate one world without building:
  `cd app && python3 -c "import sys;sys.argv=['x'];sys.path.insert(0,'.');import build;print(build.validate_world('src/worlds/w2/world.json')[1:])"`
- Deploy: `python3 tools/cf_pages_deploy.py app/dist rootcraft main`. It needs `pip install blake3 wordfreq english-words playwright`; reinstall them if the sandbox resets.
- Output layout:
  - `dist/`: everything in `app/src/landing/` is copied here when it has an `index.html`. Otherwise `dist/index.html` is a redirect to `/play/`.
  - `dist/play/`: the game (`index.html`, hashed `app.*.js`, `styles.*.css`, `data.*.json`, `fonts/`, `art/<world>/<level>.<hash>.webp`).
  - A `landing/play` folder is ignored.

## What the validator enforces (errors)
- `world.json`: `id` matches the folder name, `order`, `name`, and all theme keys (`bg bg2 accent foil[>=2] glitter particle`).
- Level: unique `id`, plus `root`, `meaning`, `origin`, `type`. The art file at `art` (default `art/<id>.webp`) must exist. At least one half.
- Every half: exactly 6 cards, 3–4 of them real. Every card has `part`, `meaning` and `word`.
  - `start` parts must begin with `-` ("-able").
  - `end` parts must end with `-` ("trans-").
  - Real words must be in the dictionary (`english-words` web2+gcide, or wordfreq zipf >= 1.5).
  - Fakes must not be a dictionary word and must have wordfreq zipf 0.
  - No duplicate words in a half.
- Warnings only: a real word with no root form in it (root + variants); a start word that doesn't start with a root form; an end word that doesn't start with its part; a start word that doesn't end with its part; a root repeated across worlds.

## Optional card field
- `"def": "kid meaning of the whole word"` on real cards appears under the word in the results tree. Cards without it just show the word, so add `def` if you can. All of w1 has it.

## Engine behaviour worth knowing
- `variants` are the extra spellings. The title shows `root · variant · ...`, and the results highlight whichever form appears in the word. Listing every spelling your words use gives better highlighting.
- `theme.foil` with 5+ colours is used as-is (spread evenly at 125deg). With fewer colours they are cycled to 7 stops. The orb ring on the world map is a conic gradient of the same colours.
- `theme.glitter` tints the holo layer (mix-blend colour at .35), the orb face, and the ambient particles.
- `particle` options: `dust` (soft rising motes), `sparkle` (four-point glints), `stars` (twinkling dots), `none`.
- `accent` drives the buttons, the selection ring, the root word in the prompt, the trail, the tree branches and the highlighted root in words. Star icons stay gold in every world.
- `levels[0].art` is the picture on the world's orb in the world select.
- Unlocks:
  - Within a world, levels open in order.
  - A world opens when the previous world's LAST level has 1 or more stars.
  - `/play/?all=1` unlocks everything.
- Routes:
  - `#/` world select
  - `#/w/<world>` world map
  - `#/w/<world>/<level>` a level
  - Old `#/l/<id>` links go to w1.
- Progress lives in `localStorage['rootcraft.v6']`, keyed `"<world>/<level>"`. Stars from v2 (`rootcraft.v2`) are migrated for w1 levels whose ids match. Old best scores are dropped (12-card scale).
- Results tree:
  - Two-half levels: words from the `end` half branch LEFT and words from the `start` half branch RIGHT.
  - Single-half levels: words are split evenly across both sides.

## Notes for integration
- w1 Ink and w2 Gold both use accent `#E9B949`. The worlds are told apart by the foil and particles, but if Gold should feel more distinct, w2 could push its accent warmer or deeper.
- w1 `world.json` is generated from `app/src/levels.py` (`python3 app/src/levels.py`). Edit `levels.py`, not the JSON.

## v8 (Oct 23, 2026): home menu + Words mode
- Routes: `#/` is now the HOME MENU (Play / Words). `#/worlds` is the world select (it used to be `#/`). `#/w/<world>[/<level>]` and the old `#/l/<id>` links still work. Words: `#/words`, `#/words/<world>/<level>`, `#/words?w=<word>` (jumps to the word's first root and highlights its branch). When a root settles, the hash is replaced with `#/words/<world>/<level>`.
- Landing nav: a "Words" link (`/play/#/words`) sits next to Play (`.nav-r` > `.nav-words` + `.nav-play`).
- Words mode code is in app.js after drawTree: `wordsData()` (flat roots + A–Z index), `TREE.make()` (landing ribbon technique: tapered ribbons rebuilt each frame by arc length, no masks; modes `radial` for desktop and the menu mini tree, `trunk` for under 700px), `renderMenu()`, `renderWords()` / `wordsMode()` (spring timeline, pointer drag with axis lock, trackpad and wheel at one root per gesture, keys ← → Home End PgUp PgDn / and f, scrubber, prev/next with neighbour names at 900px and up, index sheet with Words/Roots tabs, search and an A–Z rail).
- Only the current root and its neighbours are in the DOM. Only the settled root builds and animates a tree. Each page carries its own world's --accent, --foil and --glitter; the global theme and particles follow the root in view.
- Every real card now has a `def`. Worlds 2–4 take theirs from work/art/word_defs.py (DEFS), which the three generators import through `add_defs()`. A real word without a def makes the generator raise. Run: `python3 work/art/w2/make_world.py; python3 work/art/w3/make_world.py; python3 work/art/w4/build_world.py`.
- Tests: work/words/shoot.py (screens), work/words/func.py (routes and input).

## v11 (Oct 23, 2026): holo auto shimmer + press sparkle
- bindTilt now drifts cards on touch/no-hover screens while in view and fires holoSparkle on pointerdown (passive). See work/landing/NOTES.md "v11 holo extras".

## v13 (Oct 23, 2026): smoke background in the game
- `<div id="smoke">` (index.html, before #fx) holds two plain `<img>` layers per palette: app/src/smoke/<neutral|ink|gold|silver|amethyst>-<a|b>.webp, 384px RGBA, colour baked in, density in alpha, seamless. Generator: work/v13/gen_smoke.py. ~10 KB (a, billows) + ~13.5 KB (b, wisps) per palette; only the current palette loads.
- build.py copies them to play/art/smoke/<name>.<hash>.webp and rewrites the `'smoke/x.webp'` strings in app.js (SMOKE map).
- app.js `Smoke.set(key)` is called from `applyTheme(w, smoke)`: world screens use theme.name; home menu and world select pass 'neutral'. Words mode follows the root's world. New layers decode first, then crossfade 1.4s (opacity only) with a shared animation phase (negative animation-delay from T0).
- CSS block "v13 SMOKE BACKGROUND" at the end of styles.css: 170vmax layers, keyframes smkA 96s / smkB 74s alternate, transform only; opacity .10/.08 (.12/.10 at >=900px); html.smoke-off pauses on hidden tab; reduced motion = static.
- Two layout fixes so the smoke reads cleanly: .backdrop vignette is now a mask on the img (the old opaque ::after hid the smoke at the edges), and the .dock scrim is a full-width ::before (the old background stopped at the #app column and showed as a box).
- Tests: work/v13/shoot13.py (screens + seeked drift strip), work/v13/check13.py (trace, Words tint, crossfade, hidden, reduced motion). Pre-v13 copies: work/v13/bak/.

## v14 (Oct 25, 2026): crayon cards + card backs
- Root card = .tilt > .rcard > .rface (+ .rback after first flip). Border colour per level from CRAYON (world palette, rotates by level); paintCrayons() runs at boot and sets lv.cb / lv.cbi / lv.cbs. Tap (no drag) flips any root card; .pcard option cards never flip.
- Art is now transparent cut-outs (work/art/v14); textures in app/src/card/ are hashed by build.py into play/art/card/. Details: work/v14/NOTES.md.
