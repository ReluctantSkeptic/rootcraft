# Rootcraft background: consult A

Mockup: `work/design/consult-a.png`. The top is the v10 hero with the black replaced by Direction 1. The strip below it shows the colour for each section down the page. Generator: `work/design/mock_a.py` (a numpy port of the shader below).

The problem isn't that the page is black. It's that the black is **#121110 with no light source anywhere**, so the cream cards look like they float in a void. The worlds feel good because each one has its own light (a radial bloom plus drifting dust). The whole page needs one light source that changes as you scroll.

---

## Direction 1 (recommended): "Lamplight"
**Mood:** a library at night with one brass lamp on, and smoke from the forge drifting through the warm light. Old books and parchment, but grown-up and expensive (Apple TV+ title cards, Linear's dark glow). It isn't a cartoon.

**Technique:** one fixed full-viewport WebGL canvas (`z-index:-1`, under all sections) running a **domain-warped fbm "ink smoke" field**. Three tints swirl over a near-black base, and there's a soft gold lamp glow above the headline. A static grain layer already exists (`body::before`) and doubles as dither, so the gradients won't band.

**Palette, top section (hex):** base `#0D0B0A` · umber `#231910` · wine `#2A1521` · ink-teal `#0F1D1D` · lamp `#E9B949` at 11% peak.

**Section by section** (JS lerps 5 uniforms by scroll position, 600 ms ease):
| Section | base / c1 / c2 / c3 / lamp |
|---|---|
| Top parade | `#0D0B0A #231910 #2A1521 #0F1D1D` lamp gold, top-centre |
| Forge | `#0E0B09 #2B1A0E #311612 #1A1410` lamp drops behind the forge, ember feel |
| Tree | `#0B0D0B #14201A #221A12 #0E1E1C` lamp `#C9D28A` (green-gold, follows the growth tip y) |
| Pieces / Guess | `#0D0B0B #1F1814 #26161E #141819` lamp gold at 7% |
| How | `#0C0C0D #1A1A1D #1F1824 #121A1C` lamp `#C8D2DD` (cool, quieter for WebGL crumple) |
| Into Worlds | lerp to Ink's own `#0C0B0A / #1E1C1A` so the hand-off is seamless; the canvas fades to 0 while worlds are pinned (they own their light) |
| End | gold lamp returns at 14%, the warmest frame on the page |

**Motion:** time runs at 0.04 units/s, so a feature drifts about 2–4 px/s and the field never visibly repeats inside 90 s. Scroll velocity adds a small boost to the warp, up to 1.5× and decaying over 800 ms, which makes the page feel like it breathes when you scroll. Never faster than that. If you can see it move at a glance, it's too fast.

**Legibility guardrails:** clamp output luminance so the brightest pixel is at most about `#2A2218`, which keeps `#F1EDE4` text above 12:1 contrast. Darken toward the edges with a 55% vignette. Behind the h1 and Play, a CPU-side "keep-out" ellipse holds the lamp's centre *above* the type, never behind the letters. Gold text (`em`, roots) must never sit on gold glow, so the hue of `c1` is pulled away from it when the lamp is gold.

**Performance:** render at **¼ resolution** (⅙ on phones) and let CSS upscale it. The field is low-frequency, so the upscale reads as extra softness, and it costs about 0.3 ms/frame. Cap at 30 fps, and pause on `visibilitychange`, while worlds are pinned, and while the How crumple is scrubbing (it has its own WebGL2 context). For reduced motion, render one frame and stop (the colours still change by section, via a CSS transition on a static PNG). Without WebGL, fall back to the CSS layers from Direction 2. Ship the shader inline at about 1.5 KB.

**Why it fits:** the art is warm comic cards on cream with gold foil. Warm light makes them look **lit**, like collectible cards on a desk, instead of stickers on a void. The brand story is roots and age (Latin, the library, the forge), and lamplight says "old and crafted" without any childish shapes. The movement is slow enough that adults read it as atmosphere, and kids still notice that it's alive.

```glsl
// fragment (WebGL1), u_c0..u_c3 = section palette, u_lamp = vec3 rgb, u_la = lamp alpha
precision mediump float;
uniform vec2 u_res; uniform float u_t, u_la; uniform vec3 u_c0,u_c1,u_c2,u_c3,u_lamp; uniform vec2 u_lp;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f*=f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+17.;a*=.5;}return s;}
void main(){
  vec2 uv=gl_FragCoord.xy/u_res; vec2 p=uv*vec2(u_res.x/u_res.y,1.)*2.2;
  vec2 q=vec2(fbm(p+.05*u_t),fbm(p+vec2(5.2,1.3)-.04*u_t));
  vec2 r=vec2(fbm(p+3.5*q+vec2(1.7,9.2)+.03*u_t),fbm(p+3.5*q+vec2(8.3,2.8)));
  float f=fbm(p+3.*r);
  vec3 c=mix(u_c0,u_c1,clamp((f-.35)*2.2,0.,1.));
  c=mix(c,u_c2,clamp((r.x-.45)*2.4,0.,1.)*.85);
  c=mix(c,u_c3,clamp((q.y-.5)*2.6,0.,1.)*.7);
  vec2 d=(uv-u_lp)*vec2(u_res.x/u_res.y,1.);
  c+=u_lamp*u_la*exp(-(d.x*d.x/.35+d.y*d.y/.12))*(.6+.8*f);
  c*=1.-.55*clamp(dot(uv-.5,uv-.5)*1.6,0.,1.);
  gl_FragColor=vec4(min(c,vec3(.165,.133,.094)),1.);   // luminance ceiling ~#2A2218
}
```

---

## Alternate: "Aurora Pools" (CSS only, no JS)
**Mood:** calmer and more Stripe-like. Three or four very large, soft colour pools drift slowly under a dark scrim. It has less character than Lamplight, but it costs almost nothing and is very hard to break.

**Palette:** base `#0E0C0B`. Pools: gold `#E9B949` at 9%, wine `#6B2A4A` at 8%, teal `#1F5A57` at 7%, and near the bottom amethyst `#C9A2F5` at 6% and silver `#C8D2DD` at 5%, which echo the worlds coming up.

**Technique:** each section gets a `::before` with 2–3 `radial-gradient`s whose centres are registered `@property` percentages, animated on 40–70 s alternating loops with offset delays. Every section's pool colours lean toward the next section's, so scrolling blends them. Keep the existing grain on top.

**Speed and opacity:** about 1 px/s, pools at 5–9% alpha, so there's no legibility risk. Reduced motion uses `animation:none`. Animating gradient positions repaints the layer on the main thread, so I'd keep at most 2 sections animating at once (an IntersectionObserver toggles `.on`, like the worlds do now). On phones, keep 2 pools per section.

```css
@property --ax{syntax:'<percentage>';inherits:false;initial-value:30%}
@property --ay{syntax:'<percentage>';inherits:false;initial-value:20%}
.sec::before{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:
    radial-gradient(45% 40% at var(--ax) var(--ay), rgb(233 185 73/.09), transparent 70%),
    radial-gradient(50% 45% at calc(100% - var(--ax)) 70%, rgb(107 42 74/.08), transparent 70%),
    radial-gradient(60% 50% at 50% calc(100% - var(--ay)), rgb(31 90 87/.07), transparent 70%), #0E0C0B;
  animation:pool 52s ease-in-out infinite alternate paused}
.sec.on::before{animation-play-state:running}
@keyframes pool{to{--ax:68%;--ay:46%}}
@media (prefers-reduced-motion:reduce){.sec::before{animation:none}}
```

**My call:** go with Lamplight. It's the one that makes the card art look lit, and that's the "extraordinary" part. Keep Aurora Pools as the no-WebGL and reduced-motion fallback, which makes the second build nearly free.
