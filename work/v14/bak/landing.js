(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const SPRING = CSS.supports('transition-timing-function', 'linear(0, 1)')
  ? getComputedStyle(document.documentElement).getPropertyValue('--spring').trim()
  : 'cubic-bezier(.34, 1.4, .64, 1)';
const SOFT = CSS.supports('transition-timing-function', 'linear(0, 1)')
  ? getComputedStyle(document.documentElement).getPropertyValue('--spring-soft').trim()
  : 'cubic-bezier(.23, 1, .32, 1)';

/* ---------------- data ---------------- */
// [root, meaning, origin, type, words ([] marks the root inside each word)] — every root & word is in the game (worlds/*/world.json)
const ROW_A = [
  ['port', 'to carry', 'Latin', 'Root', ['trans[port]', '[port]able', 'im[port]']],
  ['spect', 'to look at', 'Latin', 'Root', ['in[spect]', '[spect]acle', 're[spect]']],
  ['rupt', 'to break or burst', 'Latin', 'Root', ['e[rupt]', 'inter[rupt]', 'dis[rupt]']],
  ['dict', 'to say', 'Latin', 'Root', ['[dict]ionary', 'pre[dict]', 'ver[dict]']],
  ['struct', 'to build', 'Latin', 'Root', ['con[struct]', 'in[struct]', 'ob[struct]']],
  ['aud', 'to hear', 'Latin', 'Root', ['[aud]ience', '[aud]ible', '[aud]ition']],
  ['graph', 'to write or draw', 'Greek', 'Root', ['auto[graph]', 'para[graph]', 'photo[graph]']],
  ['vis', 'to see', 'Latin', 'Root', ['[vis]ion', '[vis]ible', 'tele[vis]ion']],
  ['tract', 'to pull', 'Latin', 'Root', ['at[tract]', 'sub[tract]', 'ex[tract]']],
  ['phon', 'sound', 'Greek', 'Root', ['tele[phon]e', 'micro[phon]e', 'xylo[phon]e']],
  ['mot', 'to move', 'Latin', 'Root', ['[mot]ion', '[mot]or', 're[mot]e']],
  ['form', 'shape', 'Latin', 'Root', ['trans[form]', 'uni[form]', '[form]at']],
];
const ROW_B = [
  ['tele', 'far, far away', 'Greek', 'Prefix', ['[tele]scope', '[tele]vision', '[tele]port']],
  ['aqua', 'water', 'Latin', 'Root', ['[aqua]rium', '[aqua]tic', '[aqua]marine']],
  ['uni', 'one', 'Latin', 'Prefix', ['[uni]cycle', '[uni]corn', '[uni]form']],
  ['astro', 'star', 'Greek', 'Root', ['[astro]naut', '[astro]nomy']],
  ['ped', 'foot', 'Latin', 'Root', ['[ped]estrian', '[ped]al', '[ped]estal']],
  ['therm', 'heat', 'Greek', 'Root', ['[therm]ometer', '[therm]al', '[therm]ostat']],
  ['tri', 'three', 'Latin', 'Prefix', ['[tri]angle', '[tri]pod', '[tri]cycle']],
  ['manu', 'hand', 'Latin', 'Root', ['[manu]script', '[manu]al']],
  ['photo', 'light', 'Greek', 'Root', ['[photo]graph', '[photo]copy']],
  ['cent', 'hundred', 'Latin', 'Prefix', ['[cent]ury', '[cent]ipede']],
  ['scope', 'look at', 'Greek', 'Root', ['tele[scope]', 'micro[scope]', 'peri[scope]']],
  ['auto', 'self', 'Greek', 'Prefix', ['[auto]graph', '[auto]matic', '[auto]mobile']],
];
const PORT = ['port', 'to carry', 'Latin', 'Root'];
const WORLDS = [
  { name: 'Ink', lvl: 'Level One', line: 'The everyday building blocks: Latin roots hiding inside words like construct, predict and invisible.', p: 'dust', bg: '#0C0B0A', bg2: '#1E1C1A', accent: '#F1EDE4', glitter: '#F1EDE4', foil: ['#0B0A09', '#8A837B', '#2E2A26'],
    cat: 'Latin building blocks', lang: 'Latin, a little Greek', step: 'Step 1', note: 'Start here · ages 8+', levels: 31,
    card: ['port', 'to carry', 'Latin', 'Root'], pairs: [['re', '[re]play'], ['pre', '[pre]view'], ['trans', '[trans]port'], ['spect', 'in[spect]']] },
  { name: 'Gold', lvl: 'Level Two', line: 'Greek science and wonder words, like dinosaur, microscope and geography.', p: 'dust', bg: '#120E08', bg2: '#2A2010', accent: '#E9B949', glitter: '#F2C866', foil: ['#8A5A12', '#F6D57E', '#C48A22'],
    cat: 'Greek science & wonder', lang: 'Greek', step: 'Step 2', note: '', levels: 16,
    card: ['tele', 'far, far away', 'Greek', 'Prefix'], pairs: [['tele', '[tele]scope'], ['astro', '[astro]naut'], ['photo', '[photo]graph'], ['chron', '[chron]icle']] },
  { name: 'Silver', lvl: 'Level Three', line: 'Numbers and measuring words, like bicycle, octopus and centimeter.', p: 'stars', bg: '#0D0F12', bg2: '#1E232B', accent: '#C8D2DD', glitter: '#DDE5EE', foil: ['#8D97A3', '#F3F6F9', '#A9B3BE'],
    cat: 'Numbers & measure', lang: 'Latin & Greek', step: 'Step 3', note: '', levels: 17,
    card: ['tri', 'three', 'Latin', 'Prefix'], pairs: [['uni', '[uni]cycle'], ['tri', '[tri]angle'], ['cent', '[cent]ury'], ['poly', '[poly]gon']] },
  { name: 'Amethyst', lvl: 'Level Four', line: 'Living things &amp; the body: words like carnivore, florist and vitamin.', p: 'sparkle', bg: '#100A17', bg2: '#271838', accent: '#C9A2F5', glitter: '#E7D4FF', foil: ['#5B3592', '#EAD7FF', '#9A6AD8'],
    cat: 'Living things & the body', lang: 'Latin & Greek', step: 'Step 4', note: 'The longest words', levels: 16,
    card: ['aqua', 'water', 'Latin', 'Root'], pairs: [['aqua', '[aqua]rium'], ['ped', '[ped]estrian'], ['manu', '[manu]script'], ['dent', '[dent]ist']] },
];
const HAND = [ // port + endings: 3 real, 3 fake; order mixes both in 3x2 and 2x3
  ['able', 'can be', true, 'easy to carry'], ['ful', 'full of', false, 'not a word'],
  ['ness', 'state of', false, 'not a word'], ['folio', 'pages', true, 'carries your work'],
  ['er', 'one who', true, 'carries the bags'], ['ish', 'kind of', false, 'not a word'],
];
const mark = w => w.replace(/\[(.+?)\]/, '<b>$1</b>');
const TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

const holoLayers = `<i class="holo" aria-hidden="true"><i class="holo-rb"></i><i class="holo-gl"></i><i class="holo-gl holo-gl2"></i></i>`;
const overLayers = `<i class="sheen" aria-hidden="true"><i class="sheen-rb"></i></i><i class="glare" aria-hidden="true"><i class="glare-dot"></i></i>`;
const rootCard = ([n, m, o, t, words], cls = '') => `<div class="tilt"><article class="rcard ${cls}" aria-label="${n}: ${m}${words ? '. ' + words.map(w => w.replace(/[\[\]]/g, '')).join(', ') : ''}">
  <div class="rcard-in"><h3 class="rcard-name">${n}</h3>
  <div class="rcard-art"><img src="img/${n}.webp" alt="" width="440" height="440" loading="lazy" decoding="async" draggable="false">${holoLayers}</div>
  <p class="rcard-mean">${m}</p>${words ? `<ul class="rcard-words">${words.map(w => `<li>${mark(w)}</li>`).join('')}</ul>` : `<footer class="rcard-foot"><span>${o}</span><span>${t}</span></footer>`}</div>${overLayers}</article></div>`;

/* ---------- holo extras (v11): auto shimmer on touch screens + press sparkle ----------
   Same code in app/src/app.js and app/src/landing/landing.js (separate bundles). */
const AUTO = matchMedia('(hover: none), (pointer: coarse)');
const hclamp = (v, a, b) => Math.min(b, Math.max(a, v));
/* phone tilt (Android etc. fire deviceorientation without a prompt; iOS needs a permission tap, so it is skipped) */
const ORI = { x: 0, y: 0 };
(() => {
  if (!window.DeviceOrientationEvent || typeof DeviceOrientationEvent.requestPermission === 'function') return;
  let b0 = null, g0 = null;
  addEventListener('deviceorientation', e => {
    if (e.beta == null || e.gamma == null || !AUTO.matches) return;
    if (b0 == null) { b0 = e.beta; g0 = e.gamma; }
    b0 += (e.beta - b0) * .01; g0 += (e.gamma - g0) * .01;          // the rest pose slowly follows how the phone is held
    ORI.x += (hclamp((e.gamma - g0) / 28, -1, 1) - ORI.x) * .2;
    ORI.y += (hclamp((e.beta - b0) / 28, -1, 1) - ORI.y) * .2;
  }, { passive: true });
})();
/* slow Lissajous drift: x every 8.2 s, y every 6.1 s, each card on its own phase; smaller than a real hover */
function holoDrift(ph, now, amp = 1) {
  const t = now / 1000, TAU = 6.2832;
  return {
    x: hclamp(.5 + amp * (.21 * Math.sin(t * TAU / 8.2 + ph)) + .16 * ORI.x, .08, .92),
    y: hclamp(.5 + amp * (.16 * Math.sin(t * TAU / 6.1 + ph * 1.7)) + .14 * ORI.y, .08, .92),
    o: .5 + .08 * Math.sin(t * TAU / 9.4 + ph * .6),
  };
}
/* one IntersectionObserver for every holo card: auto shimmer only runs on cards in view */
const holoSeen = new WeakMap();
const holoIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { const f = holoSeen.get(e.target); if (f) f(e.isIntersecting); }), { rootMargin: '40px' }) : null;
function holoWatch(el, fn) { if (!holoIO) return fn(true); holoSeen.set(el, fn); holoIO.observe(el); }

/* Press sparkle: a small burst of iridescent glints and four-point stars at the press point, clipped by
   the card's rounded rect (the card has overflow hidden). ~650 ms, canvas only, removed when done. */
function holoSparkle(t, e, reduced) {
  const card = t.querySelector('.rcard'); if (!card) return;
  const r = t.getBoundingClientRect(), w = card.offsetWidth, h = card.offsetHeight;
  if (!r.width || !w) return;
  const px = (e.clientX - r.left) / r.width * w, py = (e.clientY - r.top) / r.height * h;
  const old = card.querySelectorAll('.spark'); if (old.length > 1) old[0].remove();
  const cv = document.createElement('canvas'); cv.className = 'spark'; cv.setAttribute('aria-hidden', 'true');
  const d = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(w * d); cv.height = Math.round(h * d);
  card.appendChild(cv);
  const x = cv.getContext('2d'); x.scale(d, d);
  const R = w * (reduced ? .12 : .3), hue0 = Math.random() * 360, rnd = Math.random;
  const P = [];
  for (let i = 0; i < 34; i++) {
    const a = rnd() * 6.2832, star = i < 13;
    P.push({ a, dist: R * (.12 + .88 * Math.pow(rnd(), .7)), star, s: star ? w * (.026 + rnd() * .036) * (i < 3 ? 1.35 : 1) : w * (.005 + rnd() * .008),
      del: rnd() * (star ? 160 : 90), life: 380 + rnd() * 280, tw: rnd() * 6.28, hue: (hue0 + a * 57.3 + rnd() * 50) % 360, rot: rnd() < .75 ? 0 : .785 });
  }
  const t0 = performance.now(), T = 780; let cut = 0;
  if (e.pointerType !== 'mouse') t.addEventListener('pointercancel', () => { cut = performance.now(); }, { once: true }); // a scroll began: fade out fast
  const star = (X, Y, s, rot, hue, al) => {
    x.save(); x.translate(X, Y); x.rotate(rot);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, s * 1.5);
    g.addColorStop(0, `hsla(${hue},100%,66%,${.55 * al})`); g.addColorStop(1, `hsla(${hue},100%,66%,0)`);
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, s * 1.5, 0, 6.2832); x.fill();
    const k = s * .13;
    x.fillStyle = `hsla(${hue},100%,52%,${al})`; x.beginPath();
    x.moveTo(0, -s); x.lineTo(k, -k); x.lineTo(s, 0); x.lineTo(k, k); x.lineTo(0, s); x.lineTo(-k, k); x.lineTo(-s, 0); x.lineTo(-k, -k); x.closePath(); x.fill();
    x.fillStyle = `rgba(255,255,255,${al})`; x.beginPath(); x.arc(0, 0, s * .24, 0, 6.2832); x.fill();
    x.restore();
  };
  const tick = now => {
    const el = now - t0, cf = cut ? hclamp(1 - (now - cut) / 140, 0, 1) : 1;
    if (el > T || !cv.isConnected || cf <= 0) { cv.remove(); return; }
    x.clearRect(0, 0, w, h);
    const fp = el / 280;                                   // soft iridescent bloom under the finger
    if (fp < 1) {
      const rr = w * (.05 + .17 * (1 - (1 - fp) ** 3)), a0 = (1 - fp) * cf;
      const g = x.createRadialGradient(px, py, 0, px, py, rr);
      g.addColorStop(0, `rgba(255,255,255,${.8 * a0})`); g.addColorStop(.28, `hsla(${hue0},100%,66%,${.42 * a0})`);
      g.addColorStop(.62, `hsla(${(hue0 + 120) % 360},100%,64%,${.22 * a0})`); g.addColorStop(1, 'hsla(0,0%,100%,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, rr, 0, 6.2832); x.fill();
    }
    const rp = el / 460;                                   // one thin rainbow ripple ring
    if (rp < 1 && !reduced) {
      const rr = w * (.04 + .3 * (1 - (1 - rp) ** 2)), g = x.createLinearGradient(px - rr, py - rr, px + rr, py + rr);
      for (let k = 0; k <= 4; k++) g.addColorStop(k / 4, `hsla(${(hue0 + k * 72) % 360},100%,60%,${.42 * (1 - rp) ** 1.4 * cf})`);
      x.strokeStyle = g; x.lineWidth = Math.max(1, w * .008 * (1 - rp)); x.beginPath(); x.arc(px, py, rr, 0, 6.2832); x.stroke();
    }
    for (const p of P) {
      const q = (el - p.del) / p.life; if (q <= 0 || q >= 1) continue;
      const ez = 1 - (1 - q) ** 3, X = px + Math.cos(p.a) * p.dist * ez, Y = py + Math.sin(p.a) * p.dist * ez - w * .02 * q;
      const fall = 1 - .6 * (p.dist / R) ** 2;            // radial falloff: outer glints are fainter
      const al = Math.sin(Math.PI * q) ** 1.2 * (.62 + .38 * Math.sin(q * 19 + p.tw)) * fall * cf;
      const hue = (p.hue + q * 70) % 360;
      if (p.star) star(X, Y, p.s * (.55 + .45 * Math.sin(Math.PI * q)), p.rot + q * .5, hue, al);
      else { x.fillStyle = `hsla(${hue},100%,${q < .4 ? 90 : 58}%,${al})`; x.beginPath(); x.arc(X, Y, p.s, 0, 6.2832); x.fill(); }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------------- tilt engine (spring, from the game) ---------------- */
// Touch / no-hover screens: cards in view drift on their own (holoDrift); c.autoOk can veto (parade: only cards near centre)
const cards = [];
function makeCard(t, ambient, touch = true) {
  const card = t.firstElementChild;
  const c = {
    t, card, ambient, hover: false, down: false, live: true, vis: false, fade: 1, autoOk: null, ph: Math.random() * 6.2832,
    rb: $$('.holo-rb, .sheen-rb', card), gl: $('.holo-gl', card), gl2: $('.holo-gl2', card),
    holo: $('.holo', card), sheen: $('.sheen', card), glare: $('.glare', card), dot: $('.glare-dot', card),
    cur: { x: .5, y: .5, o: 0 }, vel: { x: 0, y: 0, o: 0 }, tgt: { x: .5, y: .5, o: 0 }, still: false,
  };
  t._c = c;
  t.addEventListener('pointerdown', e => holoSparkle(t, e, RM), { passive: true });
  if (RM) return c;
  holoWatch(t, v => { c.vis = v; c.still = false; kick(); });
  const move = e => {
    if (!FINE.matches && !c.down) return;
    const r = t.getBoundingClientRect();
    c.hover = true;
    c.tgt = { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height), o: 1 };
    c.still = false; kick();
  };
  t.addEventListener('pointerdown', e => { if (touch || FINE.matches) { c.down = true; move(e); } }, { passive: true });
  t.addEventListener('pointermove', move, { passive: true });
  t.addEventListener('pointerleave', () => { c.down = false; c.hover = false; c.still = false; kick(); });
  t.addEventListener('pointerup', () => { if (!FINE.matches) { c.down = false; c.hover = false; c.still = false; kick(); } });
  t.addEventListener('pointercancel', () => { c.down = false; c.hover = false; c.still = false; kick(); });
  cards.push(c);
  return c;
}
function paint(c) {
  const dx = c.cur.x - .5, dy = c.cur.y - .5, o = c.cur.o, f = c.fade;
  const hyp = Math.min(1, Math.hypot(dx, dy) * 2);
  c.card.style.transform = `rotateX(${(-dy * 22 * o).toFixed(2)}deg) rotateY(${(dx * 26 * o).toFixed(2)}deg) translateZ(0) scale(${(1 + .03 * Math.max(0, o - .6) / .4).toFixed(4)})`;
  const ang = Math.atan2(dy, dx), sx = (-dx * 66).toFixed(2), sy = (-dy * 66).toFixed(2);
  for (const e of c.rb) e.style.transform = `translate3d(${sx}%, ${sy}%, 0) rotate(${(ang * 8).toFixed(2)}deg)`;
  if (c.gl) c.gl.style.transform = `translate3d(${(dx * 6).toFixed(2)}%, ${(dy * 6).toFixed(2)}%, 0)`;
  if (c.gl2) c.gl2.style.transform = `translate3d(${(-dx * 10).toFixed(2)}%, ${(-dy * 10).toFixed(2)}%, 0) rotate(90deg)`;
  const base = .16;
  c.holo.style.opacity = (f * (base + o * (.5 + hyp * .4))).toFixed(3);
  c.sheen.style.opacity = (f * (.07 + o * (.22 + hyp * .18))).toFixed(3);
  c.glare.style.opacity = (f * o * (.55 + hyp * .35)).toFixed(3);
  c.dot.style.transform = `translate3d(${(dx * 50).toFixed(2)}%, ${(dy * 50).toFixed(2)}%, 0)`;
}
function stepCard(c, now) {
  const auto = !c.hover && AUTO.matches && c.vis && !document.hidden && (!c.autoOk || c.autoOk());
  if (!c.hover && c.ambient) {
    const t = c.ambient(); if (!t) return;
    if (auto) { const d = holoDrift(c.ph, now, .5); c.tgt = { x: clamp(t.x + d.x - .5), y: clamp(t.y + d.y - .5), o: t.o }; } else c.tgt = t;
  }
  else if (!c.hover) c.tgt = auto ? holoDrift(c.ph, now) : { x: .5, y: .5, o: 0 };
  let moving = false;
  for (const k of ['x', 'y', 'o']) {
    const stiff = k === 'o' ? .09 : (c.hover ? .16 : .07);
    c.vel[k] = (c.vel[k] + (c.tgt[k] - c.cur[k]) * stiff) * .72;
    c.cur[k] += c.vel[k];
    if (Math.abs(c.vel[k]) > .0004 || Math.abs(c.tgt[k] - c.cur[k]) > .0008) moving = true;
  }
  paint(c);
  c.still = !moving && !c.ambient && !auto;
}

/* ---------------- one frame loop ---------------- */
let raf = 0;
const tasks = new Set();
function kick() { if (!raf && !RM) raf = requestAnimationFrame(frame); }
document.addEventListener('visibilitychange', () => { if (!document.hidden) { cards.forEach(c => (c.still = false)); kick(); } });
let lastT = performance.now();
function frame(now) {
  raf = 0;
  const dt = Math.min(50, now - lastT); lastT = now;
  let more = false;
  for (const fn of tasks) if (fn(dt) !== false) more = true;
  for (const c of cards) if (c.live && !c.still) { stepCard(c, now); more = true; }
  if (more) kick();
}

/* ---------------- hero: the forge ---------------- */
function hero() {
  const w = $('.w'), L = $('.pl'), R = $('.pr'), ROOT = $('.root'), seam = $('.seam'), gloss = $('.gloss');
  const SEQ = [
    { l: 'trans', r: '', m: 'to carry across' },
    { l: '', r: 'able', m: 'easy to carry' },
    { l: 'im', r: '', m: 'to carry in' },
    { l: 'ex', r: '', m: 'to carry out' },
    { l: 're', r: 'er', m: 'one who carries back the news' },
    { l: 'sup', r: '', m: 'to carry from below' },
  ];
  // intro: letters of the root rise in
  ROOT.innerHTML = [...'port'].map((ch, i) => `<span class="ch" style="--i:${i}">${ch}</span>`).join('');
  let introd = false;
  if (!RM) document.body.classList.add('pre');
  const intro = () => { if (introd) return; introd = true; document.body.classList.remove('pre'); document.body.classList.add('intro'); setTimeout(() => { ROOT.textContent = 'port'; }, 1300); };
  const glossTo = txt => {
    const old = $('.gloss-in', gloss);
    const nu = document.createElement('span'); nu.className = 'gloss-in'; nu.textContent = txt;
    gloss.appendChild(nu);
    if (RM) { old && old.remove(); return; }
    nu.animate([{ opacity: 0, transform: 'translateY(.6em)' }, { opacity: 1, transform: 'none' }], { duration: 800, easing: SOFT, delay: 300, fill: 'backwards' });
    if (old) old.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-.5em)' }], { duration: 220, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }).onfinish = () => old.remove();
  };
  if (RM) { ROOT.textContent = 'port'; L.textContent = 'trans'; glossTo('to carry across'); return; }

  let state = { l: '', r: '' }, i = -1, timer = 0, visible = true;
  function go() {
    i = (i + 1) % SEQ.length;
    const next = SEQ[i];
    const wr = w.getBoundingClientRect();
    const keep = [ROOT]; const before = new Map();
    for (const [k, el] of [['l', L], ['r', R]]) {
      if (state[k] === next[k] && next[k]) keep.push(el);
    }
    for (const el of keep) before.set(el, el.getBoundingClientRect().left);
    // outgoing pieces become ghosts that peel away
    for (const [k, el] of [['l', L], ['r', R]]) {
      if (state[k] && state[k] !== next[k]) {
        const r = el.getBoundingClientRect();
        const g = document.createElement('span'); g.className = 'p ghost'; g.textContent = state[k];
        g.style.left = (r.left - wr.left) + 'px';
        w.appendChild(g);
        const dir = k === 'l' ? -1 : 1;
        g.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dir * .06}em, .22em) rotate(${dir * 6}deg)`, opacity: 0 }],
          { duration: 300, easing: 'cubic-bezier(.5,0,.9,.5)', fill: 'forwards' }).onfinish = () => g.remove();
      }
    }
    const incoming = [];
    for (const [k, el] of [['l', L], ['r', R]]) {
      if (state[k] !== next[k]) { el.textContent = next[k]; if (next[k]) incoming.push([k, el]); }
    }
    for (const el of keep) {
      const d = before.get(el) - el.getBoundingClientRect().left;
      if (Math.abs(d) > .5) el.animate([{ transform: `translateX(${d}px)` }, { transform: 'none' }], { duration: 900, easing: SPRING, delay: 170, fill: 'backwards' });
    }
    for (const [k, el] of incoming) {
      const dir = k === 'l' ? -1 : 1;
      el.animate([{ transform: `translateX(${dir * .7}em)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 950, easing: SPRING, delay: 260, fill: 'backwards' });
    }
    // the snap: a gold seam flashes where piece meets root, root gives a tiny bump
    if (incoming.length) {
      const k = incoming[0][0];
      setTimeout(() => {
        const rr = ROOT.getBoundingClientRect(), w2 = w.getBoundingClientRect();
        seam.style.left = ((k === 'l' ? rr.left : rr.right) - w2.left) + 'px';
        seam.animate([{ opacity: 0, transform: 'scaleY(.2)' }, { opacity: 1, transform: 'scaleY(1)', offset: .25 }, { opacity: 0, transform: 'scaleY(1.05)' }], { duration: 650, easing: 'ease-out' });
        ROOT.animate([{ transform: 'none' }, { transform: `translateX(${(k === 'l' ? 1 : -1) * 0.012}em) scale(1.012)`, offset: .3 }, { transform: 'none' }], { duration: 420, easing: 'ease-out', composite: 'add' });
      }, 520);
    }
    glossTo(next.m);
    state = { l: next.l, r: next.r };
    schedule();
  }
  const schedule = (ms = 2500) => { clearTimeout(timer); if (visible && !document.hidden) timer = setTimeout(go, ms); };
  w.addEventListener('click', () => { clearTimeout(timer); go(); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !introd) { intro(); schedule(2600); return; } visible ? schedule(1400) : clearTimeout(timer); }, { threshold: .4 }).observe(w);
  document.addEventListener('visibilitychange', () => document.hidden ? clearTimeout(timer) : schedule(1200));
}

/* ---------------- parade: two curved shelves of teaching cards ---------------- */
function parade() {
  const rows = $$('.shelf .row');
  const DATA = [ROW_A, ROW_B];
  const R = rows.map((row, ri) => {
    row.innerHTML = DATA[ri].map(d => rootCard(d, 'teach')).join('');
    const tiles = $$('.tilt', row);
    const st = { row, tiles, dir: +row.dataset.dir, off: ri * -90, vel: 0, drag: null, hover: false, pitch: 0, L: 0, cw: 0, h: 0, xs: tiles.map(() => 0) };
    return st;
  });
  let vw = innerWidth;
  const measure = () => {
    vw = innerWidth;
    for (const r of R) {
      r.cw = r.tiles[0].offsetWidth; r.h = r.tiles[0].offsetHeight;
      const gap = parseFloat(getComputedStyle(r.row).getPropertyValue('--gap')) || 24;
      r.pitch = r.cw + gap; r.L = r.pitch * r.tiles.length;
    }
  };
  measure(); addEventListener('resize', () => { measure(); if (!RM) place(true); });
  // curved path: tiles ride the outside of a slow drum — they turn and recede as they near the edges
  const place = force => {
    for (const r of R) {
      r.tiles.forEach((t, i) => {
        let x = ((i * r.pitch + r.off) % r.L + r.L) % r.L - r.pitch;   // [-pitch, L - pitch)
        const cx = x + r.cw / 2, dx = (cx - vw / 2) / (vw / 2);
        const a = clamp(dx, -1.35, 1.35);
        const ry = a * (vw < 720 ? 22 : 30), z = -Math.abs(a) * a * 0 - a * a * (vw < 720 ? 60 : 140), y = a * a * (vw < 720 ? 14 : 30);
        t.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg)`;
        r.xs[i] = dx;
        // foil/blend layers only on the card under the pointer (touch screens: the 1-2 cards nearest centre, which shimmer on their own): moving shelves stay cheap to composite
        const near = AUTO.matches && Math.abs(dx) < .72;
        const lite = !t._hot && !near;
        if (t._c) t._c.fade = t._hot ? 1 : near ? clamp((.72 - Math.abs(dx)) / .22) : 1;
        if (lite !== t._lite) { t._lite = lite; t.classList.toggle('lite', lite); if (t._c) t._c.still = false; }
      });
    }
  };
  place(true);
  let on = false, lastY = scrollY, boost = 0;
  R.forEach(r => r.tiles.forEach((t, i) => {
    const c = makeCard(t, null, false);
    c.autoOk = () => !t._lite;
    t.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { t._hot = true; t._lite = false; t.classList.remove('lite'); } });
    t.addEventListener('pointerleave', () => { t._hot = false; });
    c.live = false;
  }));
  const myCards = cards.filter(c => R.some(r => r.tiles.includes(c.t)));
  if (RM) { R.forEach(r => { r.row.classList.add('static'); r.tiles.forEach(t => { t.style.transform = ''; t.classList.remove('lite'); }); }); return; }
  // hover slows a row; drag (mouse or touch) scrubs it with a little inertia
  R.forEach(r => {
    r.row.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') r.hover = true; });
    r.row.addEventListener('pointerleave', () => { r.hover = false; });
    r.row.addEventListener('pointerdown', e => {
      r.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), lock: e.pointerType === 'mouse' ? 'x' : null };
      r.vel = 0;
    });
    r.row.addEventListener('pointermove', e => {
      const d = r.drag; if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.lock) { if (Math.abs(dx) + Math.abs(dy) < 6) return; d.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; if (d.lock === 'x') r.row.setPointerCapture(e.pointerId); }
      if (d.lock !== 'x') return;
      const now = performance.now();
      r.off += dx; r.vel = dx / Math.max(8, now - d.t); d.x = e.clientX; d.y = e.clientY; d.t = now;
      r.row.classList.add('dragging'); kick();
    });
    const end = () => { r.drag = null; r.row.classList.remove('dragging'); };
    r.row.addEventListener('pointerup', end); r.row.addEventListener('pointercancel', end);
    r.row.addEventListener('dragstart', e => e.preventDefault());
  });
  tasks.add(dt => {
    if (!on) return false;
    const y = scrollY; boost += (y - lastY) * .5; lastY = y; boost *= .88;
    for (const r of R) {
      if (!r.drag) {
        const want = (r.hover ? .006 : .04) * r.dir;
        r.vel += (want - r.vel) * (Math.abs(r.vel) > .2 ? .04 : .06);
        r.off += r.vel * dt + boost * .1 * r.dir;
      }
    }
    place();
  });
  new IntersectionObserver(([e]) => { on = e.isIntersecting; lastY = scrollY; myCards.forEach(c => { c.live = on; c.still = false; }); if (on) kick(); }, { rootMargin: '120px' }).observe($('.shelf'));
}

/* ---------------- tree: one root, branches grow into words ---------------- */
function tree() {
  const sec = $('.tree-sec'), box = $('.tree'), svg = $('.tree-svg'), wordsBox = $('.tree-words'), rootEl = $('.tree-root'), h = $('.tree-h');
  const MAIN = [ // word, meaning, side (-1 left / 1 right), twig word
    ['trans[port]', 'carry across', -1, 'pass[port]'], ['[port]able', 'easy to carry', 1, '[port]er'],
    ['ex[port]', 'carry out', -1, 'air[port]'], ['im[port]', 'carry in', 1, 'tele[port]'],
    ['re[port]', 'carry back the news', -1, 'de[port]'], ['[port]folio', 'carries your work', 1, 'sup[port]'],
  ];
  const NS = 'http://www.w3.org/2000/svg';
  let B = [], W = 0, H = 0, phone = false;
  wordsBox.innerHTML = MAIN.map(([w, m]) => `<div class="tw"><span class="tw-w">${mark(w)}</span><span class="tw-m">${m}</span></div>`).join('')
    + MAIN.map(([, , , t]) => `<div class="tw tw-s"><span class="tw-w">${mark(t)}</span></div>`).join('');
  const mainEls = $$('.tw:not(.tw-s)', wordsBox), twigEls = $$('.tw-s', wordsBox);
  // deterministic wobble
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]; };
  function sample(p0, p1, p2, p3, amp, n = 48) {
    const ph = rnd() * 6.28, fr = 1.6 + rnd() * 1.2, pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = bez(p0, p1, p2, p3, Math.max(0, t - .002)), b = bez(p0, p1, p2, p3, Math.min(1, t + .002));
      const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
      const [x, y] = bez(p0, p1, p2, p3, t), wob = amp * Math.sin(t * Math.PI * fr + ph) * Math.sin(Math.PI * t);
      pts.push([x - ty / l * wob, y + tx / l * wob]);
    }
    const len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, len, total: len[len.length - 1] };
  }
  // tapered ribbon around a centre line: thick at the root, hair-thin at the tip, a little swell for an inked feel
  // g < 1 draws only the grown part (cut by arc length) — geometry, not masks, so scrubbing stays cheap
  function ribbon({ pts, len, total }, w0, w1, g = 1) {
    const L = [], Rr = [], n = pts.length - 1, cut = g * total;
    if (g <= 0) return '';
    for (let i = 0; i <= n; i++) {
      let p = pts[i], t = i / n;
      if (len[i] > cut) { const k = (cut - len[i - 1]) / ((len[i] - len[i - 1]) || 1), q = pts[i - 1]; p = [q[0] + (p[0] - q[0]) * k, q[1] + (p[1] - q[1]) * k]; t = (i - 1 + k) / n; }
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
      const w = (w1 + (w0 - w1) * Math.pow(1 - t, 1.25)) * (1 + .12 * Math.sin(t * 9.0)) / 2;
      L.push([p[0] - ty / l * w, p[1] + tx / l * w]); Rr.push([p[0] + ty / l * w, p[1] - tx / l * w]);
      if (len[i] > cut) break;
    }
    const f = p => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    return 'M' + L.map(f).join('L') + 'L' + Rr.reverse().map(f).join('L') + 'Z';
  }
  const poly = ({ pts }) => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
  function leafPath(x, y, ang, s) { // almond leaf
    const c = Math.cos(ang), si = Math.sin(ang), P = (u, v) => [x + (u * c - v * si) * s, y + (u * si + v * c) * s];
    const a = P(0, 0), b = P(1, 0), c1 = P(.35, -.42), c2 = P(.75, -.3), c3 = P(.75, .3), c4 = P(.35, .42);
    return `M${a}C${c1} ${c2} ${b}C${c3} ${c4} ${a}Z`.replace(/,/g, ' ');
  }
  const at = (s, g) => { // point at fraction g of arc length
    const L = g * s.total; let i = 1; while (i < s.len.length - 1 && s.len[i] < L) i++;
    const k = (L - s.len[i - 1]) / ((s.len[i] - s.len[i - 1]) || 1), a = s.pts[i - 1], b = s.pts[i];
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0])];
  };
  function build() {
    seed = 11;
    W = box.clientWidth; H = box.clientHeight; phone = W < 720;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    const rr = rootEl.getBoundingClientRect(), br = box.getBoundingClientRect();
    const rx0 = rr.left - br.left, rx1 = rr.right - br.left, ry0 = rr.top - br.top, ry1 = rr.bottom - br.top;
    const word = $('b', rootEl).getBoundingClientRect();
    const wx0 = word.left - br.left, wx1 = word.right - br.left, wcy = word.top - br.top + word.height * .56;
    const cx = (rx0 + rx1) / 2;
    const mw = mainEls.map(e => e.offsetWidth), mh = mainEls.map(e => e.offsetHeight), sw = twigEls.map(e => e.offsetWidth);
    B = [];
    const sw0 = phone ? 6.5 : 7.5;
    if (!phone) {
      // three branches each side, fanning from the root's flanks to the tips; a twig peels off each
      const ys = [-.36, .02, .4];
      MAIN.forEach((m, k) => {
        const side = m[2], row = Math.floor(k / 2), ty = H / 2 + ys[row] * H * (row === 1 ? 1 : 1.05);
        const reach = (row === 1 ? .36 : .27) * W;
        let tx = cx + side * (wx1 - wx0) / 2 + side * reach;
        const minX = 24 + mw[k] + 22, maxX = W - 24 - mw[k] - 22;
        tx = clamp(tx, minX, maxX);
        const wh = word.height, sx = side < 0 ? wx0 + wh * .12 : wx1 - wh * .12, sy = wcy + (row - 1) * wh * .2;
        const dx = tx - sx;
        const s = sample([sx, sy], [sx + dx * .38, sy + (row - 1) * wh * .25], [tx - dx * .42, ty], [tx, ty], 7 + rnd() * 5);
        const b = { s, w0: sw0, w1: 1.3, side, tip: [tx, ty], start: .1 + k * .07, dur: .3, el: mainEls[k], k };
        // leaves along the branch
        b.leaves = [.32, .66].map((g, j) => { const p = at(s, g); return { g, x: p[0], y: p[1], ang: p[2] + (j ? -1 : 1) * side * .9 + (side < 0 ? Math.PI : 0) * 0, s: 13 + rnd() * 6, flip: j }; });
        B.push(b);
        // twig from 58% along, curling away from the centre line
        const p = at(s, row === 1 ? .5 : .42), vy = row === 0 ? -1 : row === 2 ? 1 : (k % 2 ? 1 : -1);
        let ex = p[0] + side * W * (row === 1 ? .05 : -.01), ey = p[1] + vy * H * (row === 1 ? .2 : .17);
        ex = clamp(ex, 24 + sw[k] * .5 + 8, W - 24 - sw[k] * .5 - 8); ey = clamp(ey, 18, H - 30);
        const ts = sample([p[0], p[1]], [p[0] + side * 14, p[1] + vy * 4], [ex - side * 6, ey - vy * 26], [ex, ey], 3, 24);
        B.push({ s: ts, w0: 3.6, w1: .9, side, tip: [ex, ey], start: b.start + b.dur * .5, dur: .2, el: twigEls[k], twig: true, leaves: [] });
      });
    } else {
      // phone: a trunk drops from the root; branches peel left/right in turn, words sit at the outer ends
      const top = ry1 + 6, bottom = H - 34, rows = MAIN.length, gap = (bottom - top - 40) / rows;
      const trunk = sample([cx, top], [cx + 4, top + (bottom - top) * .3], [cx - 6, top + (bottom - top) * .7], [cx, bottom - gap * .6], 9, 60);
      B.push({ s: trunk, w0: 8, w1: 2.4, side: 0, tip: [cx, bottom], start: .06, dur: .52, leaves: [.18, .46, .78].map((g, j) => { const p = at(trunk, g); return { g, x: p[0], y: p[1], ang: (j % 2 ? 0 : Math.PI) + (j % 2 ? -.6 : .6), s: 12, flip: j }; }), trunk: true });
      MAIN.forEach((m, k) => {
        const side = k % 2 ? 1 : -1, y0 = top + 16 + k * gap, ty = y0 + gap * .62;
        const tx = side < 0 ? 20 + mw[k] + 16 : W - 20 - mw[k] - 16;
        const g0 = clamp((y0 - top) / (bottom - gap * .6 - top));
        const p = at(trunk, g0);
        const dx = tx - p[0];
        const s = sample([p[0], p[1]], [p[0] + dx * .15, p[1] + (ty - p[1]) * .1], [tx - dx * .55, ty], [tx, ty], 2.5, 30);
        B.push({ s, w0: 5, w1: 1.2, side, tip: [tx, ty], start: .06 + .52 * g0 + .01, dur: .16, el: mainEls[k], k, leaves: [] });
      });
      twigEls.forEach(e => e.classList.add('off'));
    }
    // draw
    svg.innerHTML = `<defs></defs><g class="tg"></g>`;
    const defs = svg.firstChild, g = svg.lastChild;
    defs.innerHTML = '<radialGradient id="tglow"><stop offset="0" stop-color="#FFF4CF"/><stop offset=".35" stop-color="#F6D57E" stop-opacity=".9"/><stop offset="1" stop-color="#F6D57E" stop-opacity="0"/></radialGradient>';
    B.forEach((b, i) => {
      const id = 'tm' + i, gid = 'tgd' + i;
      const [x1, y1] = b.s.pts[0], [x2, y2] = b.tip;
      defs.insertAdjacentHTML('beforeend', `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="#E9B949"/><stop offset=".45" stop-color="#C9B48A"/><stop offset="1" stop-color="#F1EDE4" stop-opacity=".8"/></linearGradient>`);
      const grp = document.createElementNS(NS, 'g');
      grp.innerHTML = `<path class="tb" d="" fill="url(#${gid})"/>` +
        b.leaves.map(l => `<path class="tl" d="${leafPath(l.x, l.y, l.ang, l.s)}" style="transform-origin:${l.x.toFixed(1)}px ${l.y.toFixed(1)}px"/>`).join('') +
        (b.el ? `<circle class="tbud-ring" cx="${x2}" cy="${y2}" r="9"/><circle class="tbud" cx="${x2}" cy="${y2}" r="${b.twig ? 3 : 4.4}"/>` : '') +
        `<circle class="tfront" r="${b.twig ? 6 : 10}" cx="${x1}" cy="${y1}" fill="url(#tglow)"/>`;
      g.appendChild(grp);
      b.path = $('.tb', grp); b.leafEls = $$('.tl', grp); b.bud = $('.tbud', grp); b.ring = $('.tbud-ring', grp); b.front = $('.tfront', grp);
      b.last = -1;
      if (b.el) { // place the word at the tip
        const e = b.el, ew = e.offsetWidth, eh = e.offsetHeight;
        let lx, ly;
        if (b.twig) { lx = x2 - ew / 2; ly = b.tip[1] < (b.s.pts[0][1]) ? y2 - eh - 8 : y2 + 8; }
        else if (phone) { lx = b.side < 0 ? x2 - 12 - ew : x2 + 12; ly = y2 - eh * .36; }
        else { lx = b.side < 0 ? x2 - 16 - ew : x2 + 16; ly = y2 - eh * .36; }
        e.style.left = lx.toFixed(1) + 'px'; e.style.top = ly.toFixed(1) + 'px';
        e.classList.toggle('r', b.side < 0 && !b.twig);
      }
    });
    last = -1; render(curP);
  }
  let curP = 0, last = -1;
  function render(p) {
    for (const b of B) {
      const g = clamp((p - b.start) / b.dur);
      if (Math.abs(g - b.last) < .0005) continue; b.last = g;
      const e = 1 - Math.pow(1 - g, 2.2) * (1 - g * .0); // ease out
      const ge = g < 1 ? (g * g * (3 - 2 * g)) * .35 + e * .65 : 1;
      b.path.setAttribute('d', ribbon(b.s, b.w0, b.w1, ge));
      const pt = at(b.s, ge);
      b.front.setAttribute('cx', pt[0].toFixed(1)); b.front.setAttribute('cy', pt[1].toFixed(1));
      b.front.style.opacity = g > 0 && g < 1 ? 1 : 0;
      b.leafEls.forEach((l, j) => l.classList.toggle('on', ge > b.leaves[j].g + .04));
      if (b.el) { const on = g >= .97; b.el.classList.toggle('on', on); b.bud.classList.toggle('on', g >= .9); b.ring.classList.toggle('on', on); }
    }
    h.classList.toggle('s1', p > .0); h.classList.toggle('s2', p > .04);
    rootEl.classList.toggle('glow', p > .06);
  }
  const ro = () => { build(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ro); else ro();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(ro, 120); });
  if (RM) { curP = 1; h.classList.add('s1', 's2'); return; }
  let on = false;
  new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) kick(); }).observe(sec);
  tasks.add(() => {
    if (!on) return false;
    const r = sec.getBoundingClientRect(), span = r.height - innerHeight;
    const p = clamp((-r.top + innerHeight * .25) / (span + innerHeight * .1));
    if (Math.abs(p - curP) > .0005 || last < 0) { curP = p; last = p; render(p); }
    return false;
  });
}

/* ---------------- pieces: big words split into small ones ---------------- */
function split() {
  const stage = $('.sp-stage'), wordEl = $('.sp-word'), def = $('.sp-def');
  const SETS = [
    { p: ['tele', 'scope'], m: ['far', 'look at'], d: 'a tool for seeing far' },
    { p: ['uni', 'cycle'], m: ['one', 'wheel'], d: 'a bike with one wheel' },
    { p: ['auto', 'graph'], m: ['self', 'write'], d: 'your name, written by you' },
  ];
  let i = -1, timers = [], on = false;
  const T = (fn, ms) => timers.push(setTimeout(fn, ms));
  const show = k => {
    const s = SETS[k];
    wordEl.innerHTML = s.p.map((p, j) => `<span class="sp-p" style="--j:${j};--o:${j - (s.p.length - 1) / 2}"><span class="sp-t">${[...p].map((c, n) => `<span class="ch" style="--n:${n + j * p.length}">${c}</span>`).join('')}</span><span class="sp-m">${s.m[j]}</span></span>`).join('') + '<i class="sp-seam"></i>';
    def.innerHTML = `<span>${s.d}</span>`;
    stage.className = 'sp-stage';
  };
  const cycle = () => {
    timers.forEach(clearTimeout); timers = [];
    i = (i + 1) % SETS.length; show(i);
    void stage.offsetWidth;
    stage.classList.add('in');
    T(() => stage.classList.add('cut'), 1000);
    T(() => stage.classList.add('meant'), 1550);
    T(() => stage.classList.add('def'), 2250);
    T(() => stage.classList.add('out'), 5200);
    T(() => { if (on) cycle(); }, 5750);
  };
  if (RM) { show(0); stage.classList.add('in', 'cut', 'meant', 'def'); return; }
  show(0);
  new IntersectionObserver(([e]) => { const was = on; on = e.isIntersecting; if (on && !was) { i = -1; cycle(); } if (!on) { timers.forEach(clearTimeout); timers = []; } }, { threshold: .45 }).observe(stage);
}

/* ---------------- guess: decode a never-seen word ---------------- */
function guess() {
  const stage = $('.gs-stage');
  let timers = [];
  const run = () => {
    timers.forEach(clearTimeout); timers = [];
    stage.className = 'gs-stage'; void stage.offsetWidth;
    const T = (c, ms) => timers.push(setTimeout(() => stage.classList.add(c), ms));
    T('s0', 50); T('s1', 1000); T('s2', 1800); T('s3', 2700);
  };
  if (RM) { stage.classList.add('s0', 's1', 's2', 's3'); return; }
  stage.addEventListener('click', run);
  let on = false;
  new IntersectionObserver(([e]) => { if (e.isIntersecting && !on) run(); on = e.isIntersecting; }, { threshold: .5 }).observe(stage);
}

/* ---------------- how it works ---------------- */
// fakes are crumpled into paper balls: a real-time WebGL sheet (31x21 grid), wrinkled with ridged noise, wrapped into a lumpy ball,
// flat-shaded so every crease catches the light; printed face on one side, plain card stock on the back; then it drops and bounces.
const hash3 = (x, y, z) => { let h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (i, j, k) => hash3(xi + i, yi + j, zi + k);
  return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
const ridge = (x, y, z) => 1 - Math.abs(vnoise(x, y, z) * 2 - 1);
const sstep = t => t * t * (3 - 2 * t);

function makeCrumpler(pin, fakes, hand) {
  const cv = document.createElement('canvas'); cv.className = 'crumple'; cv.setAttribute('aria-hidden', 'true');
  pin.appendChild(cv);
  const gl = cv.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: true });
  if (!gl) { cv.remove(); return null; }
  const VS = `#version 300 es
  in vec4 aP; in vec3 aN; in vec2 aUV; uniform vec2 uRes; uniform float uF; out vec2 vUV; out vec3 vP; out vec3 vN; out float vAO;
  void main(){ vec3 p=aP.xyz; vN=aN; float k=uF/(uF-p.z); vec2 c=uRes*.5; vec2 s=c+(p.xy-c)*k; vP=p; vUV=aUV; vAO=aP.w;
    gl_Position=vec4(s.x/uRes.x*2.-1., 1.-s.y/uRes.y*2., -p.z/4000., 1.); }`;
  const FS = `#version 300 es
  precision highp float; in vec2 vUV; in vec3 vP; in vec3 vN; in float vAO; uniform sampler2D uT; uniform vec3 uBack; out vec4 o;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
  void main(){
    vec4 t=texture(uT,vUV); if(t.a<.5) discard;
    vec3 fn=normalize(cross(dFdx(vP),dFdy(vP))); if(fn.z<0.) fn=-fn; vec3 sn=normalize(vN); if(sn.z<0.) sn=-sn;
    vec3 n=normalize(mix(sn,fn,.5));  // half crisp crease, half soft paper: no low-poly look
    vec3 L=normalize(vec3(-.42,-.62,.92)); float d=max(dot(n,L),0.); float d0=L.z;
    float grain=h(floor(vUV*vec2(420.,300.)))*.06-.03;
    vec3 base= gl_FrontFacing ? uBack+grain : t.rgb/t.a;
    float lit=.38+.62*d/d0;
    vec3 H=normalize(L+vec3(0.,0.,1.)); float sp=pow(max(dot(n,H),0.),28.)*(gl_FrontFacing?.16:.10);
    vec3 c=base*lit*(1.-.6*vAO)+sp;
    o=vec4(c,1.);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  gl.useProgram(prog);
  const uRes = gl.getUniformLocation(prog, 'uRes'), uF = gl.getUniformLocation(prog, 'uF'), uBack = gl.getUniformLocation(prog, 'uBack'), uT = gl.getUniformLocation(prog, 'uT');
  const NX = 40, NY = 26, NV = (NX + 1) * (NY + 1);
  const uv = new Float32Array(NV * 2), idx = new Uint16Array(NX * NY * 6);
  for (let j = 0, k = 0; j <= NY; j++) for (let i = 0; i <= NX; i++, k++) { uv[k * 2] = i / NX; uv[k * 2 + 1] = j / NY; }
  for (let j = 0, k = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
    idx.set([a, b, c, b, d, c], k); k += 6;
  }
  const aP = gl.getAttribLocation(prog, 'aP'), aN = gl.getAttribLocation(prog, 'aN'), aUV = gl.getAttribLocation(prog, 'aUV');
  const C = fakes.map((el, n) => {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const ub = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ub); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aUV); gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);
    const pb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferData(gl.ARRAY_BUFFER, NV * 16, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 4, gl.FLOAT, false, 0, 0);
    const nb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, nb); gl.bufferData(gl.ARRAY_BUFFER, NV * 12, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aN); gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 0, 0);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    const tex = gl.createTexture();
    const shadow = document.createElement('i'); shadow.className = 'cr-shadow'; pin.insertBefore(shadow, cv);
    return { el, vao, pb, nb, tex, shadow, data: new Float32Array(NV * 4), nrm: new Float32Array(NV * 3), seed: 3.1 + n * 17.3, dir: n % 2 ? 1 : -1, w: 0, h: 0 };
  });
  let W = 0, H = 0, dpr = 1, pinR = null;
  function paintTex(c) {
    const r = c.el.getBoundingClientRect(); if (r.width < 4) return; c.w = r.width; c.h = r.height; c.tw = r.width;
    const s = 2, cw = Math.round(r.width * s), ch = Math.round(r.height * s);
    const k = document.createElement('canvas'); k.width = cw; k.height = ch; const x = k.getContext('2d');
    const rad = parseFloat(getComputedStyle(c.el).borderRadius) * s || 36;
    x.beginPath(); x.roundRect(0, 0, cw, ch, rad); x.fillStyle = '#1B1917'; x.fill();
    // printed ink is never perfectly flat: faint mottling
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * .025})`; x.fillRect(Math.random() * cw, Math.random() * ch, 1 + Math.random() * 3, 1 + Math.random() * 3); }
    x.save(); x.beginPath(); x.roundRect(1.5 * s / 2, 1.5 * s / 2, cw - 1.5 * s, ch - 1.5 * s, rad - 1); x.lineWidth = 1.5 * s; x.strokeStyle = 'rgba(229,85,58,.55)'; x.stroke(); x.restore();
    const wd = $('.pc-word', c.el), df = $('.pc-def', c.el);
    const wcs = getComputedStyle(wd), dcs = getComputedStyle(df);
    const fs = parseFloat(wcs.fontSize) * s, ds = parseFloat(dcs.fontSize) * s;
    const txt = wd.textContent.trim();
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    x.font = `700 ${fs}px "Bricolage Grotesque"`; x.fillStyle = 'rgba(241,237,228,.75)';
    const gapY = 4 * s, total = fs * 1.05 + gapY + ds * 1.15, y0 = ch / 2 - total / 2 + fs * .85;
    x.fillText(txt, cw / 2, y0);
    const tw = x.measureText(txt).width;
    x.fillStyle = '#E5553A'; x.fillRect(cw / 2 - tw / 2 - s, y0 - fs * .3, tw + 2 * s, 3 * s);
    x.font = `italic 500 ${ds}px "Newsreader"`; x.fillStyle = '#E5553A';
    x.fillText(df.textContent.trim(), cw / 2, y0 + fs * .2 + gapY + ds);
    gl.bindTexture(gl.TEXTURE_2D, c.tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, k);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = pin.clientWidth; H = pin.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    gl.viewport(0, 0, cv.width, cv.height);
    C.forEach(paintTex);
  }
  // one sheet's geometry at crumple c, fall f
  function geom(c, cr, hr, cx, cy, floorY, crum, fall) {
    const { w, h, seed: sd, data } = c;
    const wr = sstep(clamp(crum / .3)), s = sstep(clamp((crum - .1) / .9));
    const R = .19 * Math.sqrt(w * h);
    const sz = 1 - .1 * wr;
    // ball path: lift a touch while crumpling, then drop to the floor and bounce twice
    const D = floorY - R * .95 - (cy - 8);
    let yf;
    if (fall < .5) yf = D * (fall / .5) ** 2;
    else if (fall < .78) { const u = (fall - .5) / .28; yf = D - D * .2 * 4 * u * (1 - u); }
    else if (fall < .93) { const u = (fall - .78) / .15; yf = D - D * .05 * 4 * u * (1 - u); }
    else yf = D;
    const drift = (c.landX - cx) * sstep(fall);
    const bx = cx + drift, by = cy - 8 * s + yf, bz = 26 * s * (1 - fall);
    const roll = drift / R;
    const ax = s * .7 + roll * .35, ay = s * .55 * c.dir + roll, az = s * .5 * c.dir + roll * .6;
    const cxx = Math.cos(ax), sxx = Math.sin(ax), cyy = Math.cos(ay), syy = Math.sin(ay), czz = Math.cos(az), szz = Math.sin(az);
    const mid = Math.sin(Math.PI * s);
    // static per-vertex noise is cached per card size; per frame we only blend and rotate
    if (!c.pre || c.preW !== w || c.preH !== h) {
      const P = new Float32Array(NV * 9);
      for (let j = 0, k = 0; j <= NY; j++) for (let i = 0; i <= NX; i++, k++) {
        const X = (i / NX - .5) * w, Y = (j / NY - .5) * h;
        // 1. the sheet wrinkles: sharp ridges + a broad buckle
        const Xr = X * .8 + Y * .6, Yr = -X * .6 + Y * .8, rr0 = ridge(X / 30 + sd, Y / 30, sd);
        const rz = (ridge(Xr / 34 + sd, Yr / 52, sd) - .55) * w * .045 + (ridge(X / 47, Y / 23 + sd, sd + 2) - .55) * w * .03 + (vnoise(X / 85, Y / 85 + sd, 1) - .5) * w * .12;
        // 2. where it lands on a lumpy ball (card centre folds inward, like a fist closing)
        const qx = X / (w / 2), qy = Y / (h / 2), rinf = Math.max(Math.abs(qx), Math.abs(qy)), rr = rinf * .62 + Math.hypot(qx, qy) * .707 * .38;
        const al = rr * Math.PI * .93, be = Math.atan2(qy * h, qx * w);
        const dx = Math.sin(al) * Math.cos(be), dy = Math.sin(al) * Math.sin(be), dz = -Math.cos(al);
        const lump = .8 + .38 * vnoise(dx * 1.6 + sd, dy * 1.6, dz * 1.6) + .22 * ridge(dx * 4.2, dy * 4.2 + sd, dz * 4.2) + .08 * ridge(dx * 9, dy * 9, dz * 9 + sd);
        // 3. crushed folds that shove the sheet around in between
        const r4 = ridge(X / 26, Y / 26, sd + 4);
        P.set([rz, dx * lump, dy * lump, dz * lump, (vnoise(X / 40 + sd, Y / 40, 2) - .5) * w * .22, (vnoise(X / 40, Y / 40 + sd, 3) - .5) * h * .22, (r4 - .5) * w * .16, 1.05 - lump, 1 - rr0], k * 9);
        (c.r4 = c.r4 || new Float32Array(NV))[k] = r4;
      }
      c.pre = P; c.preW = w; c.preH = h;
    }
    const P = c.pre;
    for (let j = 0, k = 0; j <= NY; j++) for (let i = 0; i <= NX; i++, k++) {
      const X = (i / NX - .5) * w, Y = (j / NY - .5) * h, o = k * 9;
      let px = X * sz, py = Y * sz, pz = P[o] * wr;
      if (s > 0) {
        px = px + (P[o + 1] * R - px) * s + P[o + 4] * mid; py = py + (P[o + 2] * R - py) * s + P[o + 5] * mid; pz = pz + (P[o + 3] * R - pz) * s + P[o + 6] * mid;
        data[k * 4 + 3] = clamp(s * P[o + 7] * 1.6 + mid * .15 * c.r4[k]);
      } else data[k * 4 + 3] = clamp(wr * .25 * P[o + 8]);
      // rotate (Z, Y, X) and place
      let x1 = px * czz - py * szz, y1 = px * szz + py * czz, z1 = pz;
      let x2 = x1 * cyy + z1 * syy, z2 = -x1 * syy + z1 * cyy;
      let y3 = y1 * cxx - z2 * sxx, z3 = y1 * sxx + z2 * cxx;
      data[k * 4] = (bx + x2) * dpr; data[k * 4 + 1] = (by + y3) * dpr; data[k * 4 + 2] = (bz + z3) * dpr;
    }
    // smooth vertex normals from grid neighbours
    const nr = c.nrm, Q = (i, j) => (Math.min(NY, Math.max(0, j)) * (NX + 1) + Math.min(NX, Math.max(0, i))) * 4;
    for (let j = 0, k = 0; j <= NY; j++) for (let i = 0; i <= NX; i++, k++) {
      const a = Q(i + 1, j), b = Q(i - 1, j), cc = Q(i, j + 1), d = Q(i, j - 1);
      const ux = data[a] - data[b], uy = data[a + 1] - data[b + 1], uz = data[a + 2] - data[b + 2];
      const vx = data[cc] - data[d], vy = data[cc + 1] - data[d + 1], vz = data[cc + 2] - data[d + 2];
      nr[k * 3] = uy * vz - uz * vy; nr[k * 3 + 1] = uz * vx - ux * vz; nr[k * 3 + 2] = ux * vy - uy * vx;
    }
    return { bx, by, R, D, yf, s };
  }
  let ready = false;
  const go = () => { resize(); ready = true; };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { go(); api.render(api.lastP, true); }); else go();
  addEventListener('resize', () => { if (ready) { resize(); api.render(api.lastP, true); } });
  const api = {
    lastP: 0,
    render(p, force) {
      api.lastP = p;
      if (!ready) return;
      const active = p > .53;
      if (!active && !api.drawn && !force) { fakes.forEach(f => f.classList.remove('gone')); return; }
      api.drawn = active;
      pinR = pin.getBoundingClientRect();
      const hr = hand.getBoundingClientRect();
      const floorY = hr.bottom - pinR.top + (innerWidth <= 720 ? 62 : 84);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.useProgram(prog);
      gl.uniform2f(uRes, cv.width, cv.height); gl.uniform1f(uF, 1500 * dpr); gl.uniform3f(uBack, .89, .86, .80); gl.uniform1i(uT, 0);
      C.forEach((c, n) => {
        const cs = .53 + n * .045, crum = clamp((p - cs) / .12), fall = clamp((p - cs - .12) / .11);
        c.el.classList.toggle('gone', crum > 0);
        if (crum <= 0) { c.shadow.style.opacity = 0; return; }
        const r = c.el.getBoundingClientRect();
        if (Math.abs((c.tw || 0) - r.width) > 1) paintTex(c);
        const cx = r.left - pinR.left + r.width / 2, cy = r.top - pinR.top + r.height / 2;
        c.landX = hr.left - pinR.left + hr.width * (innerWidth <= 720 ? [.74, .26, .5][n] : [.42, .66, .9][n]);
        const g = geom(c, r, hr, cx, cy, floorY, crum, fall);
        gl.bindVertexArray(c.vao); gl.bindBuffer(gl.ARRAY_BUFFER, c.pb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, c.data); gl.bindBuffer(gl.ARRAY_BUFFER, c.nb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, c.nrm);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, c.tex);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
        // contact shadow on the floor: tighter and darker as the ball lands
        const height = Math.max(0, g.D - g.yf) / Math.max(1, g.D);
        const sw = g.R * 2.3 * (1 + height * .5);
        const sy = fall > 0 ? floorY : cy + c.h * .45;
        c.shadow.style.width = sw + 'px'; c.shadow.style.height = sw * .22 + 'px';
        c.shadow.style.transform = `translate3d(${(g.bx - sw / 2).toFixed(1)}px,${(sy - sw * .11).toFixed(1)}px,0)`;
        c.shadow.style.opacity = (g.s * (fall > 0 ? .35 + .55 * (1 - height) : .25)).toFixed(3);
      });
      gl.bindVertexArray(null);
    },
  };
  return api;
}

function how() {
  const sec = $('.how'), pin = $('.how-pin'), h = $('.how-h'), hand = $('.hand'), stars = $('.stars');
  $('.slot-root').innerHTML = rootCard(PORT);
  makeCard($('.slot-root .tilt'), null);
  hand.innerHTML = HAND.map(([part, mean, real, def], k) => {
    const face = `<div class="pc-face"><div class="pc-a"><span class="pc-part"><span class="hy">-</span>${part}</span><span class="pc-mean">${mean}</span></div>
      <div class="pc-b"><span class="pc-word">${real ? `<b>port</b>${part}` : `<s><b>port</b>${part}</s>`}</span><span class="pc-def">${def}</span></div></div>`;
    return `<div class="pcard ${real ? 'real' : 'fake'}" style="--k:${k}" aria-label="-${part}: ${real ? 'port' + part + ', a real word' : 'not a word'}">${face}${real ? `<i class="pc-tick">${TICK}</i>` : ''}</div>`;
  }).join('');
  const pcs = $$('.pcard', hand), reals = pcs.filter(p => p.classList.contains('real')), fakes = pcs.filter(p => p.classList.contains('fake'));
  let crumpler = null;
  try { crumpler = makeCrumpler(pin, fakes, hand); } catch (e) { console.warn(e); crumpler = null; }
  if (!crumpler) hand.classList.add('no-gl');
  let last = -1;
  const apply = p => {
    hand.classList.toggle('dealt', p > .02);
    h.classList.toggle('s1', p > .14); h.classList.toggle('s2', p > .46);
    reals.forEach((c, i) => c.classList.toggle('lit', p > .2 + i * .09));
    fakes.forEach((c, i) => {
      c.classList.toggle('wrong', p > .46 + i * .03);
      if (!crumpler) c.classList.toggle('gone', p > .53 + i * .045);
    });
    if (crumpler) crumpler.render(p);
    stars.classList.toggle('on', p > .86);
  };
  if (RM) { apply(1); if (crumpler) setTimeout(() => crumpler.render(1, true), 400); return; }
  tasks.add(() => {
    const r = sec.getBoundingClientRect(), span = r.height - innerHeight;
    if (r.bottom < -50 || r.top > innerHeight + 50) return false;
    const p = clamp(-r.top / span);
    if (Math.abs(p - last) > .0003) { apply(p); last = p; }
    return false;
  });
}

/* ---------------- worlds ---------------- */
function worlds() {
  const sec = $('.worlds'), track = $('.wtrack'), bar = $('.wprog i');
  track.innerHTML = WORLDS.map((w, i) => `<article class="wpanel" data-p="${w.p}" style="--bg:${w.bg};--bg2:${w.bg2};--accent:${w.accent};--glitter:${w.glitter};--f0:${w.foil[0]};--f1:${w.foil[1]};--f2:${w.foil[2]}">
    <i class="pt" aria-hidden="true"></i><i class="pt b" aria-hidden="true"></i>
    <div class="wtext">
      <h3 class="wname">${w.lvl}</h3>
      <div class="winfo">
        <p class="wline">${w.line}</p>
        <ul class="wroots">${w.pairs.map(([r, wd]) => `<li><span class="wr">${r}</span><i>${mark(wd)}</i></li>`).join('')}</ul>
      </div>
    </div>
    <div class="wcard">${rootCard(w.card, 'wfoil')}</div></article>`).join('');
  const panels = $$('.wpanel', track), names = $$('.wname', track), infos = $$('.winfo', track);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const field = (col, size, n) => { let c = ''; for (let i = 0; i < n; i++) { const r = rnd(); c += `<circle cx="${(rnd() * size).toFixed(1)}" cy="${(rnd() * size).toFixed(1)}" r="${(r < .8 ? .5 + rnd() * .7 : 1.2 + rnd() * 1.1).toFixed(2)}" opacity="${(.25 + rnd() * .75).toFixed(2)}"/>`; }
    return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' fill='${col}'>${c}</svg>`)}")`; };
  panels.forEach((pn, i) => { const w = WORLDS[i], [a, b] = $$('.pt', pn), n = w.p === 'sparkle' ? 1.7 : w.p === 'stars' ? 1.2 : .8;
    a.style.backgroundImage = field(w.glitter, 420, Math.round(26 * n)); b.style.backgroundImage = field(w.glitter, 610, Math.round(30 * n)); });
  const fitNames = () => {
    names.forEach(n => (n.style.fontSize = ''));
    const phone = innerWidth <= 720;
    const ks = names.map(n => { const pl = phone ? 24 : parseFloat(getComputedStyle(n).left) || 0; const avail = n.closest('.wpanel').clientWidth - 2 * pl;
      return avail && n.scrollWidth > avail ? avail / n.scrollWidth * .98 : 1; });
    const kmin = Math.min(...ks);
    names.forEach((n, i) => { const k = phone ? ks[i] : kmin; if (k < 1) n.style.fontSize = (parseFloat(getComputedStyle(n).fontSize) * k).toFixed(1) + 'px'; });
  };
  fitNames(); addEventListener('resize', fitNames); document.fonts && document.fonts.ready.then(fitNames);
  let pos = 0;
  panels.forEach((pn, i) => {
    const c = makeCard($('.tilt', pn), () => {
      const off = clamp(i - pos, -1, 1);
      return { x: .5 - off * .9, y: .42 + Math.abs(off) * .1, o: .7 };
    });
    c.live = false;
  });
  const wc = cards.filter(c => panels.some(p => p.contains(c.t)));
  if (RM) return;
  let on = false;
  new IntersectionObserver(([e]) => { on = e.isIntersecting; wc.forEach(c => { c.live = on; c.still = false; }); if (on) kick(); }).observe(sec);
  tasks.add(() => {
    if (!on) return false;
    const r = sec.getBoundingClientRect(), span = r.height - innerHeight;
    const p = clamp(-r.top / span);
    const seg = p * 3, k = Math.floor(Math.min(seg, 2.999)), f = seg - k;
    const hold = .18; const ff = clamp((f - hold) / (1 - 2 * hold)); const ee = ff < .5 ? 4 * ff * ff * ff : 1 - Math.pow(-2 * ff + 2, 3) / 2;
    pos = k + (p >= 1 ? 1 : ee);
    track.style.transform = `translate3d(${(-pos * 25).toFixed(3)}%,0,0)`;
    names.forEach((n, i) => { const off = i - pos; n.style.transform = `translate3d(${(off * 18).toFixed(2)}vw,0,0)`; });
    infos.forEach((n, i) => { const off = i - pos; n.style.transform = `translate3d(${(off * 34).toFixed(2)}vw,0,0)`; n.style.opacity = (1 - Math.min(1, Math.abs(off) * 1.4)).toFixed(3); });
    panels.forEach((pn, i) => pn.classList.toggle('on', Math.abs(i - pos) < 1));
    bar.style.transform = `scaleX(${((pos + 1) / 4).toFixed(4)})`;
    bar.parentElement.style.setProperty('--wacc', WORLDS[Math.round(pos)].accent);
    return false;
  });
}

/* ---------------- reveals, nav ---------------- */
function reveals() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .3 });
  $$('.rv, .rv-fade').forEach(el => io.observe(el));
  const nav = $('.nav'); let ly = scrollY;
  tasks.add(() => {
    const y = scrollY;
    if (Math.abs(y - ly) > 6) { nav.classList.toggle('is-hidden', y > ly && y > 200); ly = y; }
    return false;
  });
}

hero(); tree(); split(); guess(); how(); parade(); worlds(); reveals();
addEventListener('scroll', kick, { passive: true });
addEventListener('resize', kick);
kick();
})();
