# Latin & Greek Roots Database: Methodology

**Files:** `roots.csv`, `roots.json` (same 237 rows, same fields). Built Oct 21, 2026.
**Size:** 237 elements: 57 prefixes, 34 suffixes, 146 roots. Tier 1 = 60, Tier 2 = 90, Tier 3 = 87.

## Goal
A Pareto-ranked list of the word parts that unlock the most everyday English words for kids in grades 2–8. Words kids actually meet are weighted above academic, medical or legal words.

## Research basis (sources actually read)
| Source | What it contributed | URL |
|---|---|---|
| White, Sowell & Yanagihara (1989), *The Reading Teacher* 42: 302–308. Based on Carroll, Davies & Richman's *American Heritage Word Frequency Book* (1971) | Frequency rank and % share for the top 20 prefixes (un- 26%, re- 14%, in-/im-/il-/ir- 'not' 11%, dis- 7% … under- 0.8%; together 97% of prefixed words) and the top 20 suffixes (-s/-es 31%, -ed 20%, -ing 14%, -ly 7%, -er/-or 4%, -tion 4%, -able 2% …) | https://keystoliteracy.com/wp-content/uploads/2017/03/CommonPrefix.pdf ; https://resources.finalsite.net/images/v1585198128/aidan/x7a9prlevob9gr68vdra/ListsofCommonPrefixesSuffixesRoots.pdf |
| Honig, Diamond & Gutlohn, *Teaching Reading Sourcebook* (Figs. 83–85). The root list draws on Diamond & Gutlohn 2006, Ebbers 2005 and Stahl & Kapinus 2001 | Core elementary root list (aud, astro, bio, cept, dict, duct, geo, graph, ject, meter, min, mit/mis, ped, phon, port, rupt, scrib/script, spect, struct, tele, tract, vers) | same finalsite PDF as above |
| Lane, Gutlohn & van Dijk (2019), "Morpheme frequency in academic words," *Literacy Research and Instruction* 58(3), via the Iowa Reading Research Center | Frequency-ordered prefixes, suffixes, Latin roots and Greek roots in academic and ELA words (con-, re-, in-, ad-, de-, pre-, ex-, pro- …; pos, sta, fac, dic, jec …; log, graph, syn …) | https://irrc.education.uiowa.edu/sites/irrc.education.uiowa.edu/files/2026-04/High-Frequency-Morphemes-in-ELA.pdf |
| McEwan (2008), *The Reading Puzzle: Word Analysis*, published on Reading Rockets | Common Latin roots, Greek roots, prefixes and suffixes taught in schools | https://www.readingrockets.org/topics/spelling-and-word-study/articles/root-words-suffixes-and-prefixes |
| Center for Development & Learning (Alice Thomas) | Supporting root list (dict, dorm, geo, graph, ject, port, psycho, rupt, spect) | https://d1yqpar94jqbqm.cloudfront.net/documents/Common-Prefixes-Suffixes-and-Roots-8.5.13.pdf |
| Rasinski, Padak, Newton & Newton (2011), "The Latin–Greek Connection," *The Reading Teacher* 65(2) | Reasons to teach roots in the elementary grades: one root can unlock 20+ words, and most multisyllabic and academic words are Latin or Greek. Its root list was **not** retrieved (the PDF links returned 404). | https://eric.ed.gov/?id=EJ961014 ; https://doi.org/10.1002/trtr.01015 |
| Nagy & Anderson (1984), "How Many Words Are There in Printed School English?" *Reading Research Quarterly* | About 88,500 word families in school English. For each word a child learns, 1–3 related words become understandable through morphology. | https://doi.org/10.2307/747823 ; https://hdl.handle.net/2142/17796 |
| "Examining the Underlying Dimensions of Morphological Awareness and Vocabulary Knowledge" (PMC; citing Nagy & Anderson 1984, Anglin 1993) | About 60% of unfamiliar words in text can be predicted from their parts. Grades 1–5 learn about 3,500 derived words a year, against about 1,100 root words. | https://pmc.ncbi.nlm.nih.gov/articles/PMC4530804/ |
| Vocabulary.com Book Nook (quoting White et al.) | Confirms the White et al. coverage figures: top 3 prefixes = 51%, top 4 = 58% | https://www.vocabulary.com/articles/booknook/teaching-word-parts-to-enhance-student-understanding/ |
| Membean root pages (spot-checked) | Spot checks of root meanings and variants (e.g. dict/dic, graph/-graphy) | https://membean.com/roots/dict-say ; https://membean.com/roots/graph-write |
| Manyak, Baumann & Manyak (2018), "Which Morphemes to Teach," *The Reading Teacher* 72(3) | Confirms the selection principles: high frequency, consistent and concrete meaning, semantic grouping. The full table was **not** retrieved (both PDF URLs returned 404). | https://doi.org/10.1002/trtr.1713 |

**Corpus:** `wordfreq` Python library (Speer et al.). It blends SUBTLEX film/TV subtitles, Wikipedia, books, news, web text, Reddit and Twitter. https://github.com/rspeer/wordfreq

Not used: COCA/English-Corpora (needs a login), Marzano's lists and Fry's lists (no open copy found within the time budget), and Common Core lists (Common Core names "most common prefixes" in RF.3.3a but gives no list).

## How the ranking was done
1. **Candidate pool.** Every element named in the sources above, plus well-known high-yield roots for kids (number, metric and science roots).
2. **Corpus count (per element).** I matched each element against the ~27,800 lowercase words in wordfreq with Zipf ≥ 3.0 (at least 1 occurrence per million words).
   - Roots: regex on the root and its variants, with a hand-written exclusion list for look-alikes (e.g. *spec* excludes special/species/spice; *terr* excludes terrible/terrify; *port* excludes portion/portrait).
   - Prefixes: counted only when what follows is a real word (un+happy) or a known root (con+struct).
   - Suffixes: counted only when what comes before is a real word (allowing e-drop, y→i and doubled consonants), or a known root for Latin suffixes (-tion, -ity, -ous …).
   - Measures: `n` = number of matching words; `mass` = summed frequency.
3. **Precision discount.** I eyeballed the top matches for each element and set a precision factor (0.1–1.0) for noisy ones. Examples: -er (agent) 0.25, because most *-er* words are comparatives or base words; astro 0.15 (master, eastern); a-/an- 0.1; in- 'into' vs 'not' split by White's 11:3.5 ratio.
4. **Composite score**
   `0.35·log(n·p)` (normalized) + `0.15·log(mass·p)` (normalized) + `0.20·research endorsement` + `0.15·kid accessibility` + `White bonus`
   - Research endorsement weights: White ×2 and Lane ×1.5 (both frequency-based studies); Honig ×1; Reading Rockets ×1; CDL ×0.5.
   - Kid accessibility = (9 − grade)/7, which favors parts a younger child can use.
   - White bonus: up to +0.25, scaled by the element's share of all prefixed or suffixed words in White et al. This keeps the empirically top prefixes and suffixes at the top even when corpus matching undercounts them (e.g. non-, semi-, mid-).
5. **Tiers by rank.** Tier 1 = ranks 1–60 (teach first), Tier 2 = 61–150, Tier 3 = 151–237 (enrichment, science/academic, or "fun hook" items like dino, -phobia).
6. **Difficulty grade.** My own estimate (2–8). Anchors: White's top-9 prefixes and Anglo-Saxon suffixes at grades 2–3, matching CCSS RF.3.3a, which asks grade 3 to know the most common prefixes. Concrete Latin roots at grades 4–5; Greek science roots at grades 5–6; abstract roots at grades 6–8.

## Judgment calls and caveats
- **Anglo-Saxon affixes are included and labeled "Old English":** un-, over-, mis-, fore-, mid-, under-, -ly, -y, -ness, -ful, -less, -er, -est, -en, -ish, -ship, -hood. White's data shows un- alone is 26% of prefixed words, so leaving these out would break the Pareto goal.
- **Inflections left out:** -s/-es, -ed and -ing (65% of suffixed words) were left out because kids already know them and they don't change meaning.
- **Rough numbers, not exact:** corpus counts are approximate. Regex matching has some false positives (e.g. *ten* picks up "britain"; *ver* picks up "every"). The precision factors are hand estimates. Ranks within about ±10 places should be treated as equal.
- **Adult-skewed corpus:** wordfreq leans toward news and the web, so it undercounts kid-world words (dinosaur, telescope, aquarium). The kid-accessibility term partly corrects for this.
- **Merged lookalikes:** some spellings cover two roots, flagged in notes (sol sun/alone; cap take vs capit head; path feeling vs English 'path').
- **Unchecked content:** the example words and kid sentences were written for this database and are not taken from the sources. Have a teacher review them before release.
- **Scripts:** the ranking can be re-run from `work/roots_data.txt`, `work/score.py` → `work/rank.py` → `work/export.py`. Kid-sentence fixes and the extra example words were applied after export, so they live only in the CSV and JSON.
