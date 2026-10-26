# Rootcraft background: Consult B

Mockup: `work/design/consult-b.png` is the top section with the proposed field placed behind the real v10 screenshot. `consult-b-bg.png` is the field alone, and `mock_b.py` is the script that renders both. The faint streaks at the bottom left are leftovers of the ASCII trees in the source screenshot.

## My recommendation: "Iron-Gall"

**Mood.** Ink that is still settling on old paper, under one warm desk lamp. Etymology is a manuscript subject: scribes, vellum and marginalia. The background should feel like the place words come from. A screensaver feel would be wrong. It reads dark and expensive, and adults read it as craft, so it is not childish. The cartoon cards then look like collectibles laid on a scholar's desk.

**What it is.** One fixed full-screen WebGL canvas behind everything. It holds three layers:
1. **Ink marbling.** Domain-warped fBm, the suminagashi look. The difference between the darkest and lightest ink is tiny, about 4% luminance, so you feel it more than see it.
2. **Iron-gall veins.** A thin band where the noise field crosses about 0.52 turns umber and plum, like ink pooling at its edges. This is the "extraordinary" detail people notice the third time they look.
3. **Lamplight pool.** A soft gold falloff behind the headline at the upper right, plus a cool violet veil low on the page that hints at the worlds ahead. The existing paper grain stays on top.

**Palette**
| role | hex |
|---|---|
| ink deep | `#0B0A0E` |
| ink lift | `#16121A` |
| vein umber | `#2A1D12` |
| vein plum | `#2B1A30` |
| lamplight | `#E9B949` at 6–9% |
| violet veil | `#3B2A4A` at ≤22% |

**Motion and opacity**
- The warp offset drifts about 0.012 units per second, so one full "breath" takes about 90 seconds.
- The lamp pool sways ±3% of the viewport over about 40 seconds.
- Scroll adds a tiny parallax (uScroll × 0.08), so the ink seems deeper than the content.
- Nothing ever moves fast enough to track with the eye. Below the fold, ink contrast never goes over 5%.

**How it changes down the page.** Each section sets `uInk`, `uLamp` and `uVeil`. An IntersectionObserver fades the uniforms over about 1.2 seconds, so the page moves from one ink to the next.
| section | ink lift | lamp | note |
|---|---|---|---|
| Top | `#16121A` | `#E9B949` | lamp behind the h1 |
| Forge | `#22180F` | `#F6D57E` | the forge glow, the hottest point |
| Tree | `#141813` | `#B9C79A` at 4% | a breath of moss for the roots |
| Pieces / Guess | `#16121A` | `#E9B949` at 5% | the quietest stretch |
| How (crumple) | `#1A1620` | none | keeps the paper balls legible |
| Worlds | each panel's own `bg2` | its `accent` | the canvas becomes the world panels, so the existing radial glow on each panel can go |

The worlds were already the part people liked, so the whole page grows toward them.

**Legibility guardrails**
- Text always sits on L* ≤ 9. The lamp pool is clamped so the gold `em` keeps at least 7:1 contrast.
- No vein runs behind headline glyphs: a soft mask lowers ink contrast 50% inside the h1 and Play boxes. The boxes are passed in as uniforms on resize.
- The cream cards stay opaque, so they are unaffected.

**Performance**
- Render at 0.5× resolution, capped at 960 px wide, and upscale with CSS. The canvas is linearly filtered, so the blur suits ink anyway.
- Run at 30 fps, and pause on `visibilitychange` and while a pinned WebGL scene (How) is active, reusing a single context if possible.
- On phones: three fBm octaves instead of five, 0.4× resolution.
- `prefers-reduced-motion`, or no WebGL: a static PNG of one frame per section (about 40 KB webp each), cross-faded with CSS.
- Expected cost is under 1.5 ms per frame on an integrated GPU.

```glsl
// fragment: iron-gall ink, lamplight, veil
uniform float t, uScroll; uniform vec2 res;
uniform vec3 uInk0, uInk1, uVein, uLamp, uVeil;
float n(vec2 p); // value noise
float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*n(p); p=p*2.02+vec2(3.1,1.7); a*=.5;} return s; }
void main(){
  vec2 uv = gl_FragCoord.xy/res.y; uv.y += uScroll*.08;
  vec2 p = uv*2.2 + t*.012;
  vec2 q = vec2(fbm(p), fbm(p+vec2(5.2,1.3) - t*.008));
  float f = fbm(p + 3.*q);
  vec3 c = mix(uInk0, uInk1, clamp(f*1.4-.2, 0., 1.));
  c = mix(c, uVein, exp(-pow((f-.52)/.035, 2.))*.28);          // ink edge
  vec2 lp = vec2(.82 + .03*sin(t*.16), .88);                      // lamp sway
  c += uLamp * exp(-dot(uv-lp, uv-lp)*3.2) * (.55+.45*q.x) * .085;
  c += uVeil * exp(-dot(uv-vec2(1.45,-.05), uv-vec2(1.45,-.05))*2.2) * .22;
  gl_FragColor = vec4(c, 1.);
}
```

## Alternate: "Understory"

**Mood.** Late light through a canopy (komorebi). You stand among the roots looking up at dusk. It is softer and more natural than Iron-Gall, and it ties straight to the "roots" name.

**Palette**
| role | hex |
|---|---|
| floor | `#0C0D0A` |
| loam | `#17150F` |
| leaf shadow | `#1C2117` |
| light flecks | `#F6D57E` at 5–7% |
| dusk rim | `#2A2236` |

**Technique.** This version uses no WebGL. Two `@property`-registered radial gradients drift their positions over 60 and 85 seconds. They are masked by an SVG `feTurbulence` leaf pattern rendered once to a 512 px PNG. That mask slides 8 px over 20 seconds, so the dappled light shimmers like leaves moving.

**How it changes down the page.** The light grows warmer at the Forge, greener at the Tree, then dims to `#2A2236` as the page reaches the Worlds.

**Performance.** It costs almost nothing, because it is compositor-only (transform and background-position). With reduced motion the animation simply stops.

**Trade-off.** It is cheaper and safer, but less singular. Some of the dappled flecks can read as noise behind the tight display type, so it needs the same h1 mask.

```css
@property --lx { syntax:'<percentage>'; inherits:false; initial-value:30%; }
.bg-understory { position:fixed; inset:0; z-index:-1;
  background:
    radial-gradient(45% 35% at var(--lx) 18%, #F6D57E12, transparent 70%),
    radial-gradient(60% 50% at 80% 110%, #2A2236, transparent 70%), #0C0D0A;
  animation: lx 60s ease-in-out infinite alternate; }
.bg-understory::after { content:''; position:absolute; inset:-20px;
  background:url(img/leafmask.png) 0 0/512px; mix-blend-mode:soft-light; opacity:.35;
  animation: dapple 20s ease-in-out infinite alternate; }
@keyframes lx { to { --lx: 70%; } }
@keyframes dapple { to { transform: translate(8px,-6px); } }
@media (prefers-reduced-motion: reduce){ .bg-understory, .bg-understory::after { animation:none; } }
```

**Verdict.** Ship Iron-Gall. It is the one with a point of view, scholarly ink and lamplight, and it carries the page smoothly into the world colors he already likes.
