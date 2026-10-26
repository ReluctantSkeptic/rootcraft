# World 3 "Silver" — notes (Oct 23, 2026)

Output: app/src/worlds/w3/world.json + app/src/worlds/w3/art/<id>.webp (600px, 14–77 KB each).
Generator + validator: work/art/w3/make_world.py (edit the table there, re-run; it rewrites world.json and validates).
Art export: work/art/w3/export.py (1024 originals work/art/w3/<id>.png -> webp + contact sheet work/screens/w3-art-sheet.png).
Validation: 6 cards/half, 3–4 real, part side/hyphen matches word, the root piece of every word is the root or a listed variant, real words zipf >= 2.0, fakes zipf == 0 and not in english-words web2/gcide (same check as app/build.py). Result: 0 errors, 0 warnings.

Theme: bg #0e1013, bg2 #171a20, accent #c8d2dd, foil #8d97a3 / #f3f6f9 / #a9b3be, glitter #dde5ee, particle "stars".

## Levels (order = easiest first), 17 total
| id | origin | meaning | halves | real words | art |
|---|---|---|---|---|---|
| uni | Latin | one | start | unicorn, unicycle, uniform, unison | unicorn foal |
| bi (var bin) | Latin | two | start | bicycle, binoculars, bilingual, biweekly | furry living bicycle |
| tri | Latin | three | start | triangle, tricycle, triceratops, tripod | baby triceratops |
| quad (quadr, quadri, quart) | Latin | four | start | quarter, quartet, quadruple, quadrilateral | beetle holding four-leaf clover |
| oct (octo, octa) | Latin | eight | start | octopus, octave, October, octet | spider on web counting legs |
| dec (deca, deci) | Latin | ten | start | decade, decimal, decathlon, December | ten-legged crab |
| cent (centi) | Latin | hundred | start | century, centipede, centimeter, centennial | centipede wearing shoes |
| mill (milli) | Latin | thousand | start | million, millennium, millimeter, milligram | porcupine with a thousand quills |
| semi | Latin | half | start | semicircle, semifinal, semicolon | bat hanging from half moon |
| multi | Latin | many | start | multiply, multicolored, multitude, multiplayer | monkey juggling many balls |
| mono (mon) | Greek | one, alone | start | monorail, monotone, monologue, monocle | walrus with monocle |
| du (duo, dupl) | Latin | two | start | duet, dual, duplicate | two kittens singing a duet |
| kilo | Greek | thousand | start | kilogram, kilometer, kilowatt | ant lifting a giant kettlebell |
| equi (equ) | Latin | equal, even | start | equal, equator, equinox, equilateral | two sloths balanced on a seesaw |
| omni | Latin | all | start | omnivore, omnipotent, omnipresent, omniscient | goat eating everything |
| poly | Greek | many | start | polygon, polyhedron, polymer | jellyfish with many tentacles |
| gon | Greek | angle, corner | end | pentagon, hexagon, octagon | bee on hexagon honeycomb |

Fakes are built from parts that are real elsewhere in the world (-pede, -corn, -cycle, -week, -tone, -angle, -lateral, centi-, multi-...), e.g. unipede, octocorn, kilotone, semiquartet, centigon.

## Decisions
- Halves: all start-only except -gon (end-only). cent end ("per-cent") rejected: percent is the only English word ending in centum-"cent" (innocent, descent are unrelated), so no honest 3–4 real cards.
- Dropped: penta (only pentagon is kid-known; pentagon lives in -gon), hemi (only hemisphere), tetra, di (Greek two; weak words). 17 levels vs ~16 asked.
- Fakes avoided after dictionary hits: bicorn, tricorn, bigram, triweekly, quadricycle, monocycle, trigon, kiloton(e) check, bimonthly.
- Kid-difficulty flag: omnipotent/omniscient are long/hard (spec welcomes fun long words); semicolon, quadrilateral, polyhedron are school-math/grammar words.
- Small overlap: -gon appears as a card in poly (polygon) and the gon level; -ipede in cent; -imeter in cent and mill (deliberate repetition).
- Art: all 17 subjects distinct from W1's list and W2's reserved ones. Regenerated once: semi (v1 was a dark night scene, off-style) and bi (v1 bicycle wasn't furry). v1 originals kept as work/art/w3/semi.v1.png, bi.v1.png. Images carry a very faint warm tint (mean saturation 3–14/255), same as W1 art; not desaturated.
