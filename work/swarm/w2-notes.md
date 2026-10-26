# World 2 "Gold" notes (w2 agent, Oct 23 2026)

Files: app/src/worlds/w2/world.json (+ art/<id>.webp, 600px q80), originals work/art/w2/<id>.png (1024), source of truth work/art/w2/make_world.py, validator work/art/w2/validate.py, contact sheet work/screens/w2-art-sheet.png, first-pass rejects work/art/w2/v1/.

Theme: bg #13100B, bg2 #1E180F, accent #E9B949 (same gold as w1 --gold), foil #8A5A12/#F6D57E/#C48A22, glitter #F2C866, particle dust.

## Levels (order = usefulness)
1. **tele** (-) Prefix — far, far away — start: telephone, telescope, television, teleport | fakes telechair, telesoup — art: meerkat with tin-can phone, string stretching across a far valley
2. **auto** (-) Prefix — self — start: autograph, automobile, automatic, autobiography | fakes autonap, autopuddle — art: wind-up tin robot turning its own key
3. **bio** (-) Root — life — start: biology, biography, biodegradable | fakes bionose, biospoon, biohat — art: seed creature sprouting leaves from soil
4. **geo** (-) Root — earth — start: geography, geology, geometry | fakes geonaut, geocookie, geopillow — art: armadillo hugging a little Earth globe
5. **photo** (phot) Root — light — start: photograph, photosynthesis, photocopy | fakes photonaut, photosneeze, photopickle — art: glowing firefly lighting a dark forest
6. **logy** (ology) Suffix — the study of — end: technology, zoology, mythology, ecology | fakes sockology, toastology — art: bat in spectacles studying a book (upside down, candle)
7. **scope** (-) Root — look at — end: telescope, microscope, periscope, kaleidoscope | fakes geoscope, nosescope — art: black koala peering into a microscope
8. **meter** (metr) Root — measure — end: thermometer, speedometer, perimeter, diameter | fakes sleepometer, gigglemeter — art: inchworm measuring a mushroom with a tape
9. **cycl** (cycle/cyclo) Root — circle, wheel — start: cyclone, cyclist, cyclops | fakes cyclonaut, cyclish, cycleness ; end: bicycle, tricycle, unicycle, motorcycle | fakes bananacycle, sofacycle — art: black hamster running in a wooden wheel
10. **therm** (thermo) Root — heat — start: thermometer, thermostat, thermal | fakes thermonaut, thermoboot, thermojelly — art: living iron kettle steaming over a campfire
11. **astro** (astr/aster) Root — star — start: astronaut, astronomy, asteroid, asterisk | fakes astrophone, astropuppy — art: narwhal pointing its tusk at a bright star
12. **hydr** (hydro) Root — water — start: hydrant, hydrate, hydrogen | fakes hydronaut, hydrofork, hydrotoast — art: platypus under a waterfall
13. **chron** (chrono) Root — time — start: chronological, chronicle, chronic | fakes chronozebra, chronobounce, chronopizza — art: snail with a pocket-watch shell
14. **dynam** (dyna) Root — power — start: dynamite, dynamic, dynamo | fakes dynamish, dynamful, dynamness — art: rhinoceros beetle lifting a huge boulder
15. **aero** (-) Root — air — start: aerodynamic, aerospace, aerosol, aerobics | fakes aerofish, aeronoodle — art: fuzzball drifting on a dandelion-seed parachute
16. **saur** (saurus) Root — lizard — end: dinosaur, stegosaurus, brontosaurus, tyrannosaurus | fakes toastersaurus, kittysaurus — art: baby stegosaurus in prehistoric ferns

## Decisions
- Skipped micro: SPEC gives micro to w3 (kilo/micro scale); it appears only as a card part (microscope). Skipped morph (no 3 kid words) and pan (pan+x collides with English "pan").
- Only cycl gets both halves; every other root has no honest set of 3 kid words on the other side (e.g. astro end = only disaster).
- thermometer is a real card in both therm (start) and meter (end), on purpose: it is the defining word for both roots. Swap to barometer in meter if the engine dislikes repeats within a world.
- Fakes mix silly (telesoup) with plausible Greek-looking ones (geonaut, astrophone, geoscope, hydronaut) so kids must think. All fakes: wordfreq zipf 0 and not in web2/gcide.
- Validation: 6 cards/half, 3-4 real, word == root form + part exactly, fakes not words, art exists: all pass. Only rare-word warning: none (all reals zipf >= 2.37).
- Art: redid chron (Roman numerals), cycl and scope (too realistic/grey, not black-ink) once each; chron desaturated to pure grayscale. therm keeps a faint warm fire glow like w1 lantern.
