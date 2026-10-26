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
const ROOTS = [
  ['trans', 'across, to the other side', 'Latin', 'Prefix'], ['port', 'to carry', 'Latin', 'Root'],
  ['spect', 'to look at', 'Latin', 'Root'], ['phon', 'sound', 'Greek', 'Root'],
  ['graph', 'to write or draw', 'Greek', 'Root'], ['rupt', 'to break or burst', 'Latin', 'Root'],
  ['struct', 'to build', 'Latin', 'Root'], ['mot', 'to move', 'Latin', 'Root'],
  ['aud', 'to hear', 'Latin', 'Root'], ['vis', 'to see', 'Latin', 'Root'],
  ['super', 'above, or beyond', 'Latin', 'Prefix'], ['sub', 'under, below', 'Latin', 'Prefix'],
];
const WORLDS = [
  { name: 'Ink', p: 'dust', bg: '#0C0B0A', bg2: '#1E1C1A', accent: '#F1EDE4', glitter: '#F1EDE4', foil: ['#0B0A09', '#6A635B', '#26221F'],
    card: ['#E4DED2', '#F7F4EE', '#161412'],
    roots: [['trans', 'across'], ['port', 'to carry'], ['spect', 'to look'], ['rupt', 'to break']] },
  { name: 'Gold', p: 'dust', bg: '#120E08', bg2: '#2A2010', accent: '#E9B949', glitter: '#F2C866', foil: ['#8A5A12', '#F6D57E', '#C48A22'],
    roots: [['tele', 'far'], ['astro', 'star'], ['photo', 'light'], ['chron', 'time']] },
  { name: 'Silver', p: 'stars', bg: '#0D0F12', bg2: '#1E232B', accent: '#C8D2DD', glitter: '#DDE5EE', foil: ['#8D97A3', '#F3F6F9', '#A9B3BE'],
    roots: [['uni', 'one'], ['tri', 'three'], ['cent', 'hundred'], ['poly', 'many']] },
  { name: 'Amethyst', p: 'sparkle', bg: '#100A17', bg2: '#271838', accent: '#C9A2F5', glitter: '#E7D4FF', foil: ['#5B3592', '#EAD7FF', '#9A6AD8'],
    roots: [['manu', 'hand'], ['ped', 'foot'], ['cardi', 'heart'], ['derm', 'skin']] },
];
const HAND = [ // port + endings: 3 real, 3 fake; order mixes both in 3x2 and 2x3
  ['able', 'can be', true, 'easy to carry'], ['ful', 'full of', false, 'not a word'],
  ['ness', 'state of', false, 'not a word'], ['folio', 'pages', true, 'carries your work'],
  ['er', 'one who', true, 'carries the bags'], ['ish', 'kind of', false, 'not a word'],
];
const TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

const holoLayers = `<i class="holo" aria-hidden="true"><i class="holo-rb"></i><i class="holo-gl"></i><i class="holo-gl holo-gl2"></i></i>`;
const overLayers = `<i class="sheen" aria-hidden="true"><i class="sheen-rb"></i></i><i class="glare" aria-hidden="true"><i class="glare-dot"></i></i>`;
const rootCard = ([n, m, o, t]) => `<div class="tilt"><article class="rcard" aria-label="${n}: ${m}">
  <div class="rcard-in"><h3 class="rcard-name">${n}</h3>
  <div class="rcard-art"><img src="img/${n}.webp" alt="" width="440" height="440" loading="lazy" decoding="async">${holoLayers}</div>
  <p class="rcard-mean">${m}</p><footer class="rcard-foot"><span>${o}</span><span>${t}</span></footer></div>${overLayers}</article></div>`;
const backCard = w => `<div class="tilt"><div class="cback" role="img" aria-label="${w.name} world card">
  <div class="cback-in"><svg aria-hidden="true"><use href="#sprout"/></svg><span class="cb-word">Rootcraft</span>${holoLayers}</div>${overLayers}</div></div>`;

/* ---------------- tilt engine (spring, from the game) ---------------- */
const cards = [];
function makeCard(t, ambient) {
  const card = t.firstElementChild;
  const c = {
    t, card, ambient, hover: false, down: false, live: true,
    rb: $$('.holo-rb, .sheen-rb', card), gl: $('.holo-gl', card), gl2: $('.holo-gl2', card),
    holo: $('.holo', card), sheen: $('.sheen', card), glare: $('.glare', card), dot: $('.glare-dot', card),
    cur: { x: .5, y: .5, o: 0 }, vel: { x: 0, y: 0, o: 0 }, tgt: { x: .5, y: .5, o: 0 }, still: false,
  };
  if (RM) return c;
  const move = e => {
    if (!FINE.matches && !c.down) return;
    const r = t.getBoundingClientRect();
    c.hover = true;
    c.tgt = { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height), o: 1 };
    c.still = false; kick();
  };
  t.addEventListener('pointerdown', e => { c.down = true; move(e); });
  t.addEventListener('pointermove', move);
  t.addEventListener('pointerleave', () => { c.down = false; c.hover = false; c.still = false; kick(); });
  t.addEventListener('pointerup', () => { if (!FINE.matches) { c.down = false; c.hover = false; c.still = false; kick(); } });
  t.addEventListener('pointercancel', () => { c.down = false; c.hover = false; c.still = false; kick(); });
  cards.push(c);
  return c;
}
function paint(c) {
  const dx = c.cur.x - .5, dy = c.cur.y - .5, o = c.cur.o;
  const hyp = Math.min(1, Math.hypot(dx, dy) * 2);
  c.card.style.transform = `rotateX(${(-dy * 22 * o).toFixed(2)}deg) rotateY(${(dx * 26 * o).toFixed(2)}deg) translateZ(0) scale(${(1 + .03 * Math.max(0, o - .6) / .4).toFixed(4)})`;
  const ang = Math.atan2(dy, dx), sx = (-dx * 66).toFixed(2), sy = (-dy * 66).toFixed(2);
  for (const e of c.rb) e.style.transform = `translate3d(${sx}%, ${sy}%, 0) rotate(${(ang * 8).toFixed(2)}deg)`;
  if (c.gl) c.gl.style.transform = `translate3d(${(dx * 6).toFixed(2)}%, ${(dy * 6).toFixed(2)}%, 0)`;
  if (c.gl2) c.gl2.style.transform = `translate3d(${(-dx * 10).toFixed(2)}%, ${(-dy * 10).toFixed(2)}%, 0) rotate(90deg)`;
  const base = c.card.classList.contains('cback') ? .22 : .16;
  c.holo.style.opacity = (base + o * (.5 + hyp * .4)).toFixed(3);
  c.sheen.style.opacity = (.07 + o * (.22 + hyp * .18)).toFixed(3);
  c.glare.style.opacity = (o * (.55 + hyp * .35)).toFixed(3);
  c.dot.style.transform = `translate3d(${(dx * 50).toFixed(2)}%, ${(dy * 50).toFixed(2)}%, 0)`;
}
function stepCard(c) {
  if (!c.hover && c.ambient) { const t = c.ambient(); if (!t) return; c.tgt = t; }
  else if (!c.hover) c.tgt = { x: .5, y: .5, o: 0 };
  let moving = false;
  for (const k of ['x', 'y', 'o']) {
    const stiff = k === 'o' ? .09 : (c.hover ? .16 : .07);
    c.vel[k] = (c.vel[k] + (c.tgt[k] - c.cur[k]) * stiff) * .72;
    c.cur[k] += c.vel[k];
    if (Math.abs(c.vel[k]) > .0004 || Math.abs(c.tgt[k] - c.cur[k]) > .0008) moving = true;
  }
  paint(c);
  c.still = !moving && !c.ambient;
}

/* ---------------- one frame loop ---------------- */
let raf = 0;
const tasks = new Set();
function kick() { if (!raf && !RM) raf = requestAnimationFrame(frame); }
let lastT = performance.now();
function frame(now) {
  raf = 0;
  const dt = Math.min(50, now - lastT); lastT = now;
  let more = false;
  for (const fn of tasks) if (fn(dt) !== false) more = true;
  for (const c of cards) if (c.live && !c.still) { stepCard(c); more = true; }
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
  document.body.classList.add('intro');
  const glossTo = txt => {
    const old = $('.gloss-in', gloss);
    const nu = document.createElement('span'); nu.className = 'gloss-in'; nu.textContent = txt;
    gloss.appendChild(nu);
    if (RM) { old && old.remove(); return; }
    nu.animate([{ opacity: 0, transform: 'translateY(.6em)' }, { opacity: 1, transform: 'none' }], { duration: 800, easing: SOFT, delay: 300, fill: 'backwards' });
    if (old) old.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-.5em)' }], { duration: 220, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }).onfinish = () => old.remove();
  };
  if (RM) { L.textContent = 'trans'; glossTo('to carry across'); return; }

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
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? schedule(1400) : clearTimeout(timer); }).observe(w);
  document.addEventListener('visibilitychange', () => document.hidden ? clearTimeout(timer) : schedule(1200));
  setTimeout(() => { ROOT.textContent = 'port'; }, 1300);
  schedule(1700);
}

/* ---------------- parade ---------------- */
function parade() {
  const box = $('[data-marquee]'), track = $('.track', box);
  track.innerHTML = ROOTS.map(rootCard).join('') + ROOTS.map(rootCard).join('');
  $$('.tilt', track).slice(ROOTS.length).forEach(t => t.setAttribute('aria-hidden', 'true'));
  const tilts = $$('.tilt', track);
  let x = 0, speed = 0, boost = 0, half = 0, cw = 0, gap = 0, on = false, lastY = scrollY, hoverAny = 0;
  const measure = () => { half = track.scrollWidth / 2; cw = tilts[0].offsetWidth; gap = parseFloat(getComputedStyle(track).columnGap) || 24; };
  measure(); addEventListener('resize', measure);
  const vw = () => innerWidth;
  tilts.forEach((t, i) => {
    const c = makeCard(t, () => {
      let cx = i * (cw + gap) + cw / 2 + x;            // position inside the viewport, from maths (no layout reads)
      cx = ((cx % (half)) + half) % half; if (cx > vw() + cw) cx -= half;
      const dx = (cx - vw() / 2) / (vw() / 2);
      if (Math.abs(dx) > .5) return null;               // only cards crossing the centre shimmer; the rest hold still (cheap)
      return { x: .5 + dx * .7, y: .44, o: on ? .24 : 0 };
    });
    t.addEventListener('pointerenter', () => hoverAny++);
    t.addEventListener('pointerleave', () => hoverAny = Math.max(0, hoverAny - 1));
    c.live = false;
  });
  const myCards = cards.filter(c => tilts.includes(c.t));
  if (RM) return;
  const drift = dt => {
    if (!on) return false;
    const y = scrollY; boost += (y - lastY) * .9; lastY = y; boost *= .9;
    const want = hoverAny ? .006 : .045;
    speed += (want - speed) * .06;
    x -= speed * dt + boost * .12;
    if (x <= -half) x += half; if (x > 0) x -= half;
    track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
  };
  tasks.add(drift);
  new IntersectionObserver(([e]) => { on = e.isIntersecting; lastY = scrollY; myCards.forEach(c => { c.live = on; c.still = false; }); if (on) kick(); }, { rootMargin: '80px' }).observe(box);
}

/* ---------------- how it works ---------------- */
function how() {
  const sec = $('.how'), h = $('.how-h'), hand = $('.hand'), stars = $('.stars');
  $('.slot-root').innerHTML = rootCard(ROOTS[1]);
  makeCard($('.slot-root .tilt'), null);
  // jittered 3x2 grid tiles the card exactly -> shards
  const P = []; for (let i = 0; i <= 3; i++) { P[i] = []; for (let j = 0; j <= 2; j++) {
    let x = i / 3 * 100, y = j / 2 * 100;
    if (i > 0 && i < 3) x += (Math.random() - .5) * 18; if (j > 0 && j < 2) y += (Math.random() - .5) * 30;
    P[i][j] = [x, y]; } }
  const polys = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++)
    polys.push([P[i][j], P[i + 1][j], P[i + 1][j + 1], P[i][j + 1]].map(([a, b]) => `${a.toFixed(1)}% ${b.toFixed(1)}%`).join(','));
  hand.innerHTML = HAND.map(([part, mean, real, def], k) => {
    const face = `<div class="pc-face"><div class="pc-a"><span class="pc-part"><span class="hy">-</span>${part}</span><span class="pc-mean">${mean}</span></div>
      <div class="pc-b"><span class="pc-word">${real ? `<b>port</b>${part}` : `<s><b>port</b>${part}</s>`}</span><span class="pc-def">${def}</span></div></div>`;
    const shards = real ? '' : `<div class="shards">${polys.map((p, s) => {
      const r = () => Math.random() - .5;
      return `<div class="shard" style="clip-path:polygon(${p});--sd:${s * 35}ms;--cx:${(r() * 6).toFixed(1)}px;--cy:${(r() * 6).toFixed(1)}px;--cr:${(r() * 5).toFixed(1)}deg;--fx:${(r() * 120).toFixed(0)}px;--fy:${(180 + Math.random() * 260).toFixed(0)}px;--fr:${(r() * 120).toFixed(0)}deg">${face}</div>`;
    }).join('')}</div>`;
    return `<div class="pcard ${real ? 'real' : 'fake'}" style="--k:${k}" aria-label="-${part}: ${real ? 'port' + part + ', a real word' : 'not a word'}">${face}${real ? `<i class="pc-tick">${TICK}</i>` : ''}${shards}</div>`;
  }).join('');
  const pcs = $$('.pcard', hand), reals = pcs.filter(p => p.classList.contains('real')), fakes = pcs.filter(p => p.classList.contains('fake'));
  // shards copy the "wrong" state of the face
  let last = -1;
  const apply = p => {
    hand.classList.toggle('dealt', p > .02);
    h.classList.toggle('s1', p > .14); h.classList.toggle('s2', p > .5);
    reals.forEach((c, i) => c.classList.toggle('lit', p > .2 + i * .09));
    fakes.forEach((c, i) => {
      c.classList.toggle('wrong', p > .5 + i * .03);
      c.classList.toggle('crack', p > .61 + i * .03);
      c.classList.toggle('fall', p > .69 + i * .03);
    });
    stars.classList.toggle('on', p > .8);
  };
  if (RM) { apply(1); return; }
  tasks.add(() => {
    const r = sec.getBoundingClientRect(), span = r.height - innerHeight;
    const p = clamp(-r.top / span);
    if (Math.abs(p - last) > .0005) { apply(p); last = p; }
    return false;
  });
}

/* ---------------- worlds ---------------- */
function worlds() {
  const sec = $('.worlds'), track = $('.wtrack'), bar = $('.wprog i');
  track.innerHTML = WORLDS.map((w, i) => `<article class="wpanel" data-p="${w.p}" style="--bg:${w.bg};--bg2:${w.bg2};--accent:${w.accent};--glitter:${w.glitter};--f0:${w.foil[0]};--f1:${w.foil[1]};--f2:${w.foil[2]}${w.card ? `;--cbg:${w.card[0]};--cbg2:${w.card[1]};--cacc:${w.card[2]}` : ''}">
    <i class="pt" aria-hidden="true"></i><i class="pt b" aria-hidden="true"></i>
    <div class="wtext"><span class="wnum">0${i + 1}</span><h3 class="wname">${w.name}</h3>
      <ul class="wroots">${w.roots.map(([r, m]) => `<li><b>${r}</b><i>${m}</i></li>`).join('')}</ul></div>
    <div class="wcard">${backCard(w)}</div></article>`).join('');
  const panels = $$('.wpanel', track), names = $$('.wname', track), roots = $$('.wroots', track);
  // irregular glitter field per world (seeded so it is stable)
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const field = (col, size, n) => { let c = ''; for (let i = 0; i < n; i++) { const r = rnd(); c += `<circle cx="${(rnd() * size).toFixed(1)}" cy="${(rnd() * size).toFixed(1)}" r="${(r < .8 ? .5 + rnd() * .7 : 1.2 + rnd() * 1.1).toFixed(2)}" opacity="${(.25 + rnd() * .75).toFixed(2)}"/>`; }
    return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' fill='${col}'>${c}</svg>`)}")`; };
  panels.forEach((pn, i) => { const w = WORLDS[i], [a, b] = $$('.pt', pn), n = w.p === 'sparkle' ? 1.7 : w.p === 'stars' ? 1.2 : .8;
    a.style.backgroundImage = field(w.glitter, 420, Math.round(26 * n)); b.style.backgroundImage = field(w.glitter, 610, Math.round(30 * n)); });
  const fitNames = () => {
    names.forEach(n => (n.style.fontSize = ''));
    const phone = innerWidth <= 720;   // phone: each world name is its own poster and fills the width; desktop: one shared size
    const ks = names.map(n => { const pl = phone ? 24 : parseFloat(getComputedStyle(n).left) || 0; const avail = n.closest('.wpanel').clientWidth - 2 * pl;
      return avail && n.scrollWidth > avail ? avail / n.scrollWidth * .98 : 1; });
    const kmin = Math.min(...ks);
    names.forEach((n, i) => { const k = phone ? ks[i] : kmin; if (k < 1) n.style.fontSize = (parseFloat(getComputedStyle(n).fontSize) * k).toFixed(1) + 'px'; });
  };
  fitNames(); addEventListener('resize', fitNames); document.fonts && document.fonts.ready.then(fitNames);
  let pos = 0;
  panels.forEach((pn, i) => {
    const c = makeCard($('.tilt', pn), () => {
      const off = clamp(i - pos, -1, 1);               // -1..1 as the panel slides through
      return { x: .5 - off * .9, y: .42 + Math.abs(off) * .1, o: .75 };
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
    // ease the travel so each world "settles" in frame before the next arrives
    const seg = p * 3, k = Math.floor(Math.min(seg, 2.999)), f = seg - k;
    const e = f < .5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;   // easeInOutCubic
    const hold = .18; const ff = clamp((f - hold) / (1 - 2 * hold)); const ee = ff < .5 ? 4 * ff * ff * ff : 1 - Math.pow(-2 * ff + 2, 3) / 2;
    pos = k + (p >= 1 ? 1 : ee);
    track.style.transform = `translate3d(${(-pos * 25).toFixed(3)}%,0,0)`;
    names.forEach((n, i) => { const off = i - pos; n.style.transform = `translate3d(${(off * 18).toFixed(2)}vw,0,0)`; });
    roots.forEach((n, i) => { const off = i - pos; n.style.transform = `translate3d(${(off * 34).toFixed(2)}vw,0,0)`; n.style.opacity = (1 - Math.min(1, Math.abs(off) * 1.4)).toFixed(3); });
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

hero(); parade(); how(); worlds(); reveals();
addEventListener('scroll', kick, { passive: true });
addEventListener('resize', kick);
kick();
})();
