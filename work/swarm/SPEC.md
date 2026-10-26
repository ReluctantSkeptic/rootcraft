# Rootcraft v6 swarm spec (Oct 23, 2026) — shared contract, read before working

Project root: /workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5
Live: https://rootcraft.pages.dev (Cloudflare Pages project `rootcraft`). Current game source app/src (levels.py, app.js, styles.css, index.html, fonts/, art/), build app/build.py -> app/dist.
Audience: kids 8–13. Design bar: top 1% graphic + motion design. Jakub Krehel "less is more": no filler text, no eyebrow labels, restrained UI, intentional motion. Fonts: Bricolage Grotesque (800 titles / 700 card words), Newsreader Italic 500 (meanings), self-hosted in app/src/fonts.
Art style: fuzzy scratchy black-ink creatures/objects, big round white eyes, grayscale misty painterly scenes, square, NO text. Reference: files/uploads/image-b33324bb4184.webp plus existing app/src/art/*.webp. Every root in every world gets a DIFFERENT subject (animal/creature/object) acting out the meaning. Art stays grayscale ink in every world (world flair comes from foil/background/particles, not recoloured art). Generate with deferred_tool generate_image, image_paths=[reference + 1–2 existing art files], 1024 originals in work/art/<world>/, ~600px webp for app.

## New game rules
- A "level" = one root = one map bubble.
- Each level has 1 or 2 HALVES (modes):
  - `start`: root sits at the BEGINNING of the word; child picks ENDINGS (e.g. port + -able, -er).
  - `end`: root sits at the END of the word; child picks BEGINNINGS (e.g. trans- , im- + port).
  - Prefix roots (re, pre, sub…) normally only have `start`. Suffix-type roots (-logy, -phobia, -ology) only `end`. Roots used both ways get both halves: play `start` first, then the page continues to `end` in the same bubble; stars = combined.
- Each half has EXACTLY 6 cards: 3 or 4 real, 2 or 3 fake. Grid: 3x2 on wide screens, 2x3 on phones — always symmetric, never an orphan card.
- Real cards: genuine, kid-recognizable words; correct part meaning. Fake cards must NOT form a real word (validate with the dictionary/frequency check app/build.py already uses — reuse its functions/word lists; install packages if missing).
- Card fields: part (with hyphen showing side, e.g. "-able" or "trans-"), meaning (1–3 words), real (bool), word (full real word, required when real; also store spelled word for fakes for validation e.g. "portish").
- Spelling joins: word must be the true spelling (e.g. "inspect", "erupt", "eject"); variant of root used is allowed (duct, vis/vid).

## World data contract
Each world lives in app/src/worlds/<id>/ :
- world.json
- art/<level-id>.webp

world.json:
```
{
  "id": "w2",
  "order": 2,
  "name": "Gold",            // short world name shown on map (one word or two)
  "theme": {
    "name": "gold",
    "bg": "#...",           // page background (dark, moody, close to world 1 #111/#141210 family)
    "bg2": "#...",          // secondary gradient stop
    "accent": "#...",       // world accent (stars, highlights, root word in prompt)
    "foil": ["#..", "#..", "#.."],   // card frame / holo gradient stops
    "glitter": "#...",      // glitter tint
    "particle": "none|dust|sparkle|stars"  // ambient effect hint
  },
  "levels": [
    {
      "id": "astro",
      "root": "astro",
      "variants": ["astr", "aster"],   // all spellings shown in the title, main first (may be empty)
      "origin": "Greek",               // Latin | Greek
      "type": "Root",                  // Prefix | Root | Suffix
      "meaning": "star",               // italic, short phrase or tiny sentence
      "art": "art/astro.webp",
      "halves": {
        "start": {"cards": [ {"part":"-naut","meaning":"sailor","real":true,"word":"astronaut"}, ... 6 ] },
        "end":   {"cards": [ ... 6 ] }
      }
    }
  ]
}
```
Omit a half that doesn't apply. Levels ordered easiest/most useful first.

## Worlds
- w1 "Ink" (black, existing 31 roots) — rework into the new format (engine agent).
- w2 "Gold" — Greek: science & wonder (star, life, earth, water, light, heat, small, far, look, measure, study, time, self, shape, power…). ~16 levels.
- w3 "Silver" — Numbers, amounts & measure, Latin + Greek (uni/mono, bi/di, tri, quad/tetra, pent, oct, dec, cent, mill, multi/poly, semi/hemi, omni, kilo/micro scale…). ~16 levels.
- w4 "Amethyst" (sparkly purple) — Living things & the body, longer Latin words (manu, ped/pod, corp, cap/capit, dent/dont, cardi, derm, ocul/opt, vor, zoo, arbor, aqua, terr, spir, viv/vit, mort…). ~16 levels; favour longer words (manuscript, carnivorous, subterranean, respiration, dermatologist).
Avoid repeating roots already in w1 (re, in, dis, de, sub, pre, inter, trans, super, con, graph, dict, duc, fac, vis, ex, vert, pro, port, struct, ject, form, spect, mit, mot, fer, phon, scrib, tract, rupt, aud) and across worlds.

## Ownership (avoid collisions)
- engine agent: app/src/app.js, styles.css, index.html, levels.py, build.py, app/src/worlds/w1/, deploy.
- world agents: ONLY app/src/worlds/<their id>/ and work/art/<id>/ and work/swarm/<id>-notes.md.
- landing agent: ONLY app/src/landing/ and work/landing/.
- No one deploys except the engine/integration step.

## Routing (final)
- `/` = landing page (app/src/landing/index.html + assets), CTA -> `/play/`.
- `/play/` = the game (world select map -> levels).
