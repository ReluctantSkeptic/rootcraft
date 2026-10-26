/* Rootcraft landing background: "Lamplight" (v12, 2026-10-23)
   One fixed WebGL canvas behind the whole page: slow domain-warped ink smoke (umber / wine / ink-teal over near-black),
   faint iron-gall veins where the ink field crosses a level, a soft lamp glow kept above (never behind) the heading,
   vignette, luminance ceiling ~#2A2218. Palette crossfades by section as you scroll. Film grain (body::before) sits on top.
   Quarter-res render (1/6 on phones), 30fps, paused when the tab is hidden, while the How crumple or the Worlds are pinned.
   No WebGL -> CSS "Aurora Pools". Reduced motion -> one still frame (re-tinted per section on scroll). */
(() => {
'use strict';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PHONE = () => innerWidth <= 720;
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);

// per-section palette: base, c1 umber, c2 wine, c3 teal, vein, lamp rgb, lamp alpha, lamp anchor
// anchor: [selector of the heading the lamp hangs above, y offset in viewport heights] or [null, x, y] fixed uv (y up)
const PAL = {
  top:    { c: ['#0D0B0A', '#2A1C11', '#2E1724', '#10201F'], v: '#4A2E16', l: '#E9B949', a: .11, at: ['.top-h', .10] },
  forge:  { c: ['#0E0B09', '#33200F', '#381914', '#1C1611'], v: '#5A3014', l: '#E98F3C', a: .12, at: [null, .5, .18] },
  tree:   { c: ['#0B0D0B', '#17251D', '#261D13', '#0F2220'], v: '#33402A', l: '#C9D28A', a: .08, at: [null, .5, .30], tree: 1 },
  pieces: { c: ['#0D0B0B', '#231B16', '#2B1822', '#161B1C'], v: '#3E2A1C', l: '#E9B949', a: .07, at: ['.split .mid', .08] },
  how:    { c: ['#0C0C0D', '#1D1D21', '#231B29', '#141D20'], v: '#2E2A38', l: '#C8D2DD', a: .06, at: ['.how-h', .08] },
  intro:  { c: ['#0C0B0A', '#1D1B18', '#1F191C', '#131615'], v: '#2E2A25', l: '#F1EDE4', a: .05, at: ['.wintro .mid', .10] },
  worlds: { c: ['#0C0B0A', '#1E1C1A', '#1E1A1E', '#141616'], v: '#2E2B28', l: '#F1EDE4', a: .03, at: [null, .7, .6] },
  end:    { c: ['#0D0B0A', '#2E1E11', '#301824', '#10201F'], v: '#4E3218', l: '#E9B949', a: .14, at: ['.end .huge', .10] },
};
const MAP = [['.top-sec', 'top'], ['.hero', 'forge'], ['.tree-sec', 'tree'], ['.split', 'pieces'], ['.guess', 'pieces'],
  ['.how', 'how'], ['.wintro', 'intro'], ['.worlds', 'worlds'], ['.end', 'end'], ['.foot', 'end']];

function aurora() {
  document.documentElement.classList.add('bg-css');
  const d = document.createElement('div'); d.className = 'bg-aurora'; d.setAttribute('aria-hidden', 'true');
  document.body.prepend(d);
}

const cv = document.createElement('canvas');
cv.className = 'bg-ink'; cv.setAttribute('aria-hidden', 'true');
const gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
if (!gl) { aurora(); return; }

const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FS = (oct) => `precision mediump float;
uniform vec2 u_res;uniform float u_t,u_la,u_cap;uniform vec3 u_c0,u_c1,u_c2,u_c3,u_v,u_lamp;uniform vec2 u_lp;uniform vec4 u_ko;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f*=f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<${oct};i++){s+=a*n(p);p=p*2.03+17.;a*=.5;}return s;}
void main(){
 vec2 uv=gl_FragCoord.xy/u_res;float asp=u_res.x/u_res.y;vec2 p=uv*vec2(asp,1.)*2.2;
 vec2 q=vec2(fbm(p+.05*u_t),fbm(p+vec2(5.2,1.3)-.04*u_t));
 vec2 r=vec2(fbm(p+3.5*q+vec2(1.7,9.2)+.03*u_t),fbm(p+3.5*q+vec2(8.3,2.8)-.02*u_t));
 float f=fbm(p+3.*r);
 vec3 c=mix(u_c0,u_c1,clamp((f-.33)*2.4,0.,1.));
 c=mix(c,u_c2,clamp((r.x-.45)*2.6,0.,1.)*.9);
 c=mix(c,u_c3,clamp((q.y-.48)*2.8,0.,1.)*.8);
 float vein=exp(-pow((f-.53)/.05,2.))+.6*exp(-pow((r.y-.6)/.03,2.));
 c=mix(c,u_v,clamp(vein,0.,1.)*.32);
 vec2 d=(uv-u_lp)*vec2(asp,1.);
 float ko=1.-.75*smoothstep(.0,.06,min(min(uv.x-u_ko.x,u_ko.z-uv.x),min(uv.y-u_ko.y,u_ko.w-uv.y)));
 c+=u_lamp*u_la*exp(-(d.x*d.x/.30+d.y*d.y/.07))*(.55+.9*f)*ko;
 vec2 e=uv-.5;c*=1.-.55*clamp(dot(e,e)*1.7,0.,1.);
 float L=dot(c,vec3(.2126,.7152,.0722));c*=min(1.,u_cap/max(L,1e-4));
 gl_FragColor=vec4(c,1.);}`;

function prog(oct) {
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS(oct)));
  gl.bindAttribLocation(pr, 0, 'p'); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw gl.getProgramInfoLog(pr);
  return pr;
}
let P, U = {};
try {
  P = prog(PHONE() ? 3 : 4); gl.useProgram(P);
  ['u_res', 'u_t', 'u_la', 'u_cap', 'u_c0', 'u_c1', 'u_c2', 'u_c3', 'u_v', 'u_lamp', 'u_lp', 'u_ko'].forEach(k => (U[k] = gl.getUniformLocation(P, k)));
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
} catch (e) { console.warn('bg', e); aurora(); return; }
// luminance ceiling: #2A2218
const CAP = (() => { const [r, g, b] = hex('#2A2218'); return .2126 * r + .7152 * g + .0722 * b; })();
gl.uniform1f(U.u_cap, CAP);
document.body.prepend(cv);
document.documentElement.classList.add('bg-gl');

// ---------- palette state ----------
const keyVec = k => { const p = PAL[k]; return [...p.c.flatMap(hex), ...hex(p.v), ...hex(p.l), p.a]; }; // 20 floats
const KV = Object.fromEntries(Object.keys(PAL).map(k => [k, keyVec(k)]));
let cur = null, lp = [.5, .85], lpT = [.5, .85], ko = [-1, -1, -1, -1], koT = [-1, -1, -1, -1];
let secs = [];
const measure = () => { secs = MAP.map(([s, k]) => { const el = document.querySelector(s); return el && { el, k }; }).filter(Boolean); };

function lampFor(k, sec, f) { // returns [lamp uv (y up), keep-out rect uv]
  const at = PAL[k].at, H = innerHeight, W = innerWidth;
  if (at[0]) {
    const el = document.querySelector(at[0]);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.bottom > -H * .5 && r.top < H * 1.5) {
        const x = (r.left + r.width / 2) / W, y = 1 - (r.top / H - at[1]);
        return [[x, Math.min(1.08, y)], [r.left / W, 1 - r.bottom / H, r.right / W, 1 - r.top / H]];
      }
    }
    return [[.5, 1.0], [-1, -1, -1, -1]];
  }
  let y = at[2];
  if (PAL[k].tree) y = .22 + .45 * f; // green-gold glow climbs with the growing tree
  return [[at[1], y], [-1, -1, -1, -1]];
}

function target() { // blend of the section at the viewport centre and the next one
  const mid = innerHeight * .5;
  let i = secs.findIndex(s => { const r = s.el.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
  if (i < 0) i = secs[0] && secs[0].el.getBoundingClientRect().top > mid ? 0 : secs.length - 1;
  const s = secs[i], r = s.el.getBoundingClientRect(), f = Math.min(1, Math.max(0, (mid - r.top) / r.height));
  const nx = secs[i + 1];
  // crossfade over the last ~40vh of a section
  const left = r.bottom - mid, w = Math.min(innerHeight * .4, r.height * .5);
  let t = nx && nx.k !== s.k ? 1 - Math.min(1, left / w) : 0; t = t * t * (3 - 2 * t);
  const A = KV[s.k], B = nx ? KV[nx.k] : A, v = A.map((a, j) => a + (B[j] - a) * t);
  const [la, ka] = lampFor(s.k, s, f);
  if (t > 0 && nx) { const [lb] = lampFor(nx.k, nx, 0); la[0] += (lb[0] - la[0]) * t; la[1] += (lb[1] - la[1]) * t; }
  return { v, lp: la, ko: ka, k: s.k };
}

// ---------- sizing ----------
let W = 0, H = 0;
function resize() {
  const k = PHONE() ? 1 / 6 : 1 / 4;
  const w = Math.max(64, Math.round(innerWidth * k)), h = Math.max(64, Math.round(innerHeight * k));
  if (w === W && h === H) return;
  W = cv.width = w; H = cv.height = h; gl.viewport(0, 0, w, h); gl.uniform2f(U.u_res, w, h);
}

// ---------- loop ----------
let t0 = performance.now(), simT = 37, lastTs = 0, raf = 0, boost = 0, lastY = scrollY, paused = false, stillDrawn = false;
const pinned = sel => { const el = document.querySelector(sel); if (!el) return false; const r = el.getBoundingClientRect(); return r.top <= 1 && r.bottom >= innerHeight - 1; };

function draw(tg, ease) {
  if (!cur) cur = tg.v.slice();
  const e = ease;
  for (let j = 0; j < 20; j++) cur[j] += (tg.v[j] - cur[j]) * e;
  lp[0] += (tg.lp[0] - lp[0]) * Math.min(1, e * 1.5); lp[1] += (tg.lp[1] - lp[1]) * Math.min(1, e * 1.5);
  for (let j = 0; j < 4; j++) ko[j] = tg.ko[j];
  gl.uniform3f(U.u_c0, cur[0], cur[1], cur[2]); gl.uniform3f(U.u_c1, cur[3], cur[4], cur[5]);
  gl.uniform3f(U.u_c2, cur[6], cur[7], cur[8]); gl.uniform3f(U.u_c3, cur[9], cur[10], cur[11]);
  gl.uniform3f(U.u_v, cur[12], cur[13], cur[14]); gl.uniform3f(U.u_lamp, cur[15], cur[16], cur[17]);
  gl.uniform1f(U.u_la, cur[18]); gl.uniform2f(U.u_lp, lp[0], lp[1]); gl.uniform4f(U.u_ko, ko[0], ko[1], ko[2], ko[3]);
  gl.uniform1f(U.u_t, simT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function frame(ts) {
  raf = requestAnimationFrame(frame);
  if (ts - lastTs < 32) return; // ~30fps
  const dt = Math.min(.1, (ts - (lastTs || ts)) / 1000); lastTs = ts;
  // pause while the How crumple (its own WebGL2) or the Worlds (own backgrounds) fill the screen
  const p = pinned('.how-pin') && document.querySelector('.how').getBoundingClientRect().top < -innerHeight * .2 || pinned('.worlds-pin');
  if (p) { cv.classList.toggle('dim', pinned('.worlds-pin')); return; }
  cv.classList.remove('dim');
  const y = scrollY, v = Math.abs(y - lastY) / Math.max(dt, .016); lastY = y;
  boost = Math.max(boost * Math.exp(-dt / .8), Math.min(.5, v / 4000)); // up to 1.5x, decays ~800ms
  simT += dt * 0.06 * (1 + boost); // field units: features drift ~2-5 px/s
  draw(target(), 1 - Math.exp(-dt / .6));
}
const start = () => { if (!raf && !document.hidden) { lastTs = 0; raf = requestAnimationFrame(frame); } };
const stop = () => { cancelAnimationFrame(raf); raf = 0; };

function still() { draw(target(), 1); }
window.__rcbg = { set t(v) { simT = v; }, get t() { return simT; }, still }; // test hook

const init = () => {
  measure(); resize();
  if (RM) {
    still(); cv.classList.add('on');
    let q = 0; addEventListener('scroll', () => { if (!q) q = requestAnimationFrame(() => { q = 0; still(); }); }, { passive: true });
    addEventListener('resize', () => { measure(); resize(); still(); });
    return;
  }
  draw(target(), 1); cv.classList.add('on');
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  addEventListener('resize', () => { measure(); resize(); });
  start();
};
cv.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); cv.remove(); document.documentElement.classList.remove('bg-gl'); aurora(); });
document.readyState === 'loading' ? addEventListener('DOMContentLoaded', init, { once: true }) : init();
})();
