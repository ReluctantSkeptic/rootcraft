# World 4 "Amethyst": notes (Oct 23, 2026)

Files
- app/src/worlds/w4/world.json: 16 levels, built by work/art/w4/build_world.py (edit the script, then re-run it from the project root)
- app/src/worlds/w4/art/<id>.webp: 600px, q80, 16 files (~0.9 MB total)
- work/art/w4/<id>.png: 1024 originals
- work/art/w4/validate.py: validator (run from the project root). It checks 6 cards per half, 3–4 real, that each part matches its side, that every word joins its part, that every word contains the root, that every fake is absent from wordfreq and the english-words web2+gcide lists (same check as build.py), and that every art file exists.
- work/screens/w4-art-sheet.png: contact sheet

Theme: bg #130F18, bg2 #1E1626, accent #C9A8F2 (lilac), foil violet→rose [#5A2D8C, #A775E6, #F0B6D6, #8A4FCB, #D9B8FF], glitter #DCC0FF, particle "sparkle".

Levels (order = easiest first): root, meaning, halves, art
1. aqua (aque): water. start: aquarium, aquatic, aqueduct, aquamarine. Art: seahorse
2. ped: foot. start: pedal, pedestrian, pedicure, pedestal. Art: bigfoot leaving footprints
3. manu (man, mani): hand. start: manual, manuscript, manicure. Art: baby gorilla showing its hands
4. dent (dont): tooth. start: dentist, dental, denture. Art: grinning crocodile
5. terr (terra): earth, land. start: terrain, territory, terrarium. end: extraterrestrial, subterranean, mediterranean. Art: wombat digging
6. anim: life, spirit, mind. start: animal, animate, animation. end: inanimate, unanimous (un = one), magnanimous. Art: scarecrow coming to life
7. viv (vit, vive): live. start: vivid, vital, vitamin. Art: hummingbird
8. vor (vore): eat. end: carnivore, herbivore, insectivore. Art: venus flytrap
9. spir (spire, pire): breathe. end: inspire, expire, respiration, perspire. Art: baby dragon puffing breath
10. flor (flour): flower. start: florist, floral, flourish. Art: butterfly on a flower
11. avi: bird. start: aviary, aviator, aviation. Art: pelican in pilot goggles
12. opt (Greek): eye, sight. start: optical, optician, optometrist. Art: tarsier in spectacles
13. cardi (cardio, Greek): heart. start: cardiac, cardiologist, cardiovascular. Art: lamb hugging a heart pillow
14. arbor: tree. start: arboretum, arborist, arboreal. Art: sloth hanging in a tree
15. lingu (langu): tongue, language. start: linguist, linguine, language. Art: giraffe with a long tongue
16. derm (Greek): skin. end: pachyderm, epidermis, hypodermic. Art: thick-skinned baby rhino

Validation: 0 errors. Warnings: insectivore (zipf 1.25) and pachyderm (1.80) are real but rare.
Cross-world: "manuscript" is also a real card in w1. I kept it here because the brief asked for it.
Not used: corp, capit, zoo, mort, carn. carn would have overlapped carnivore in vor, and the others lacked enough kid-friendly real words for a clean half.
Art: these subjects were dropped because w2/w3 already use them: jellyfish, meerkat, koala, bee, robot.
