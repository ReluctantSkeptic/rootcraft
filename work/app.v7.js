'use strict';
/* Rootcraft v6: worlds -> levels (one root each) -> 1 or 2 halves.
   start half: root at the beginning, pick endings.  end half: root at the end, pick beginnings. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
const live = $('#live');
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const FINE = matchMedia('(hover: hover) and (pointer: fine)');
const WIDE = matchMedia('(min-width: 760px)');
const KEY = 'rootcraft.v6', OLD_KEY = 'rootcraft.v2';
const PTS = { hit: 10, wrong: -5, miss: -5 };
const ALL = new URLSearchParams(location.search).get('all') === '1';
let WORLDS = [];
let prog = {};
let justDone = null; // {wid, id, unlocked} for the map's arrival animation

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const star = (cls = '') => `<svg class="star ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#star"/></svg>`;
const ICON = {
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></svg>',
  replay: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/></svg>',
  arrow: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
};

/* ---------- progress ---------- */
const pk = (w, l) => `${w.id}/${l.id}`;
function load() {
  try { prog = JSON.parse(localStorage.getItem(KEY)) || null; } catch { prog = null; }
  if (!prog) { // migrate v2 (single world, ids = w1 level ids). Old 12-card scores don't carry over.
    prog = {};
    try {
      const old = JSON.parse(localStorage.getItem(OLD_KEY)) || {};
      const w1 = WORLDS.find(w => w.id === 'w1');
      if (w1) for (const [id, v] of Object.entries(old)) {
        if (w1.levels.some(l => l.id === id) && v && v.stars > 0) prog[`w1/${id}`] = { stars: Math.min(3, v.stars | 0), best: 0 };
      }
    } catch {}
    save();
  }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch {} }
const starsOf = (w, l) => (prog[pk(w, l)] && prog[pk(w, l)].stars) || 0;
const currentIndex = w => { let i = 0; while (i < w.levels.length && starsOf(w, w.levels[i]) > 0) i++; return i; };
const levelOpen = (w, i) => ALL || i <= currentIndex(w);
const worldStars = w => w.levels.reduce((s, l) => s + starsOf(w, l), 0);
function worldOpen(i) {
  if (ALL || i === 0) return true;
  const p = WORLDS[i - 1];
  return starsOf(p, p.levels[p.levels.length - 1]) > 0;
}
const say = t => { live.textContent = ''; setTimeout(() => (live.textContent = t), 30); };
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
function buzz(ms) { if (navigator.vibrate && !RM.matches) try { navigator.vibrate(ms); } catch {} }
const hrefWorld = w => `#/w/${w.id}`;
const hrefLevel = (w, l) => `#/w/${w.id}/${l.id}`;

/* ---------- theme + ambient particles ---------- */
function foilGradient(f) {
  const c = f.length >= 5 ? f : Array.from({ length: 7 }, (_, i) => f[i % f.length]);
  return `linear-gradient(125deg, ${c.map((x, i) => `${x} ${(i / (c.length - 1) * 100).toFixed(1)}%`).join(', ')})`;
}
let themeId = null;
function applyTheme(w) {
  if (!w || themeId === w.id) return;
  themeId = w.id;
  const t = w.theme, s = document.documentElement.style;
  s.setProperty('--bg', t.bg); s.setProperty('--bg2', t.bg2); s.setProperty('--accent', t.accent);
  s.setProperty('--foil', foilGradient(t.foil)); s.setProperty('--glitter', t.glitter);
  document.documentElement.dataset.world = t.name || w.id;
  const m = $('meta[name="theme-color"]'); if (m) m.content = t.bg;
  FX.set(t.particle, t.glitter);
}
const FX = (() => {
  const cv = $('#fx'), ctx = cv.getContext('2d');
  let kind = 'none', tint = '#fff', parts = [], raf = 0, W = 0, H = 0, dpr = 1, t0 = 0;
  const rgb = hex => { const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  function seed() {
    const area = W * H / 1e5;
    const n = kind === 'stars' ? Math.round(14 * area) : kind === 'sparkle' ? Math.round(5 * area) : kind === 'dust' ? Math.round(6 * area) : 0;
    parts = Array.from({ length: Math.min(n, 220) }, () => ({
      x: Math.random() * W, y: Math.random() * H, r: kind === 'stars' ? .4 + Math.random() * 1.1 : kind === 'sparkle' ? 1.5 + Math.random() * 2.5 : .6 + Math.random() * 1.6,
      a: kind === 'dust' ? .05 + Math.random() * .2 : .15 + Math.random() * .55, ph: Math.random() * 6.28, sp: .3 + Math.random() * .9,
      vx: (Math.random() - .5) * .08, vy: kind === 'dust' ? -.05 - Math.random() * .12 : kind === 'sparkle' ? -.03 - Math.random() * .05 : 0,
    }));
  }
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); seed();
  }
  function frame(t) {
    const sec = (t - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    const [r, g, b] = rgb(tint);
    for (const p of parts) {
      if (!RM.matches) { p.x += p.vx; p.y += p.vy; if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; } if (p.x < -8) p.x = W + 8; if (p.x > W + 8) p.x = -8; }
      const tw = kind === 'dust' ? 1 : .5 + .5 * Math.sin(sec * p.sp * 1.6 + p.ph);
      const a = p.a * (kind === 'sparkle' ? Math.pow(tw, 3) : tw);
      if (a < .01) continue;
      ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
      if (kind === 'sparkle') { // four-point glint
        const s = p.r * (.6 + .4 * tw);
        ctx.beginPath(); ctx.moveTo(p.x, p.y - s * 2.2); ctx.quadraticCurveTo(p.x, p.y, p.x + s * 2.2, p.y);
        ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s * 2.2); ctx.quadraticCurveTo(p.x, p.y, p.x - s * 2.2, p.y);
        ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s * 2.2); ctx.fill();
      } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
    }
    raf = RM.matches || kind === 'none' || document.hidden ? 0 : requestAnimationFrame(frame);
  }
  const start = () => { cancelAnimationFrame(raf); raf = 0; t0 = performance.now(); frame(t0); };
  addEventListener('resize', () => { size(); start(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf) start(); });
  RM.addEventListener && RM.addEventListener('change', start);
  return { set(k, c) { kind = ['dust', 'sparkle', 'stars'].includes(k) ? k : 'none'; tint = c || '#fff'; size(); start(); } };
})();

/* ---------- root card ---------- */
function rootCard(lv, cls = '', side = '') {
  const title = lv.forms.map(esc).join('<span class="rcard-dot"> · </span>');
  return `<div class="tilt ${cls}"><article class="rcard" aria-label="${esc(lv.forms.join(', '))}: ${esc(lv.meaning)}, from ${esc(lv.origin)}">
    <div class="rcard-in">
      <header class="rcard-top"><h1 class="rcard-name" tabindex="-1" data-side="${side}"><i class="slot slot-l" aria-hidden="true"></i><span class="rn">${title}</span><i class="slot slot-r" aria-hidden="true"></i></h1></header>
      <div class="rcard-art"><img src="${lv.art}" alt="" width="600" height="600" decoding="async">
        <i class="holo" aria-hidden="true"><i class="holo-rb"></i><i class="holo-gl"></i><i class="holo-gl holo-gl2"></i><i class="holo-tint"></i></i></div>
      <p class="rcard-mean">${esc(lv.meaning)}</p>
      <footer class="rcard-foot"><span>${esc(lv.origin)}</span><span>${esc(lv.type)}</span></footer>
    </div>
    <i class="sheen" aria-hidden="true"><i class="sheen-rb"></i></i>
    <i class="glare" aria-hidden="true"><i class="glare-dot"></i></i>
  </article></div>`;
}
/* Fit the (possibly multi-form) title on one line: start from the design size, shrink to fit. */
function fitTitles(root) {
  $$('.rcard-name', root).forEach(h => {
    h.style.fontSize = '';
    const avail = h.parentElement.clientWidth;
    if (!avail) return;
    const base = parseFloat(getComputedStyle(h).fontSize);
    const w = h.scrollWidth;
    if (w > avail) h.style.fontSize = (base * avail / w * 0.97).toFixed(2) + 'px';
  });
}
/* Holo tilt: spring-driven holographic trading-card look. Pointer drives rotation, a rainbow
   layer, two parallax glitter layers and a glare; all through transform/opacity. */
function bindTilt(root) {
  $$('.tilt', root).forEach(t => {
    const card = $('.rcard', t);
    const rb = $$('.holo-rb, .sheen-rb', card), gl = $('.holo-gl', card), gl2 = $('.holo-gl2', card);
    const holo = $('.holo', card), sheen = $('.sheen', card), glare = $('.glare', card), dot = $('.glare-dot', card);
    if (RM.matches) { t.nudge = () => {}; return; }
    const REST = { x: .5, y: .5, o: 0 };
    const cur = { ...REST }, vel = { x: 0, y: 0, o: 0 };
    let tgt = { ...REST }, raf = 0, down = false;
    const paint = () => {
      const dx = cur.x - .5, dy = cur.y - .5, o = cur.o;
      const hyp = Math.min(1, Math.hypot(dx, dy) * 2);
      card.style.transform = `rotateX(${(-dy * 22 * o).toFixed(2)}deg) rotateY(${(dx * 26 * o).toFixed(2)}deg) translateZ(0) scale(${(1 + .03 * o).toFixed(4)})`;
      const ang = Math.atan2(dy, dx);
      const sx = (-dx * 66).toFixed(2), sy = (-dy * 66).toFixed(2);
      rb.forEach(e => (e.style.transform = `translate3d(${sx}%, ${sy}%, 0) rotate(${(ang * 8).toFixed(2)}deg)`));
      gl.style.transform = `translate3d(${(dx * 6).toFixed(2)}%, ${(dy * 6).toFixed(2)}%, 0)`;
      gl2.style.transform = `translate3d(${(-dx * 10).toFixed(2)}%, ${(-dy * 10).toFixed(2)}%, 0) rotate(90deg)`;
      holo.style.opacity = (.16 + o * (.5 + hyp * .4)).toFixed(3);
      sheen.style.opacity = (.07 + o * (.22 + hyp * .18)).toFixed(3);
      glare.style.opacity = (o * (.55 + hyp * .35)).toFixed(3);
      dot.style.transform = `translate3d(${((cur.x - .5) * 50).toFixed(2)}%, ${((cur.y - .5) * 50).toFixed(2)}%, 0)`;
    };
    const step = () => {
      let moving = false;
      for (const k of ['x', 'y', 'o']) {
        const stiff = k === 'o' ? .09 : (down || FINE.matches) && tgt.o ? .16 : .07;
        vel[k] = (vel[k] + (tgt[k] - cur[k]) * stiff) * .72;
        cur[k] += vel[k];
        if (Math.abs(vel[k]) > .0004 || Math.abs(tgt[k] - cur[k]) > .0008) moving = true;
      }
      paint();
      raf = moving ? requestAnimationFrame(step) : 0;
      card.classList.toggle('is-live', moving || tgt.o > 0);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    const move = e => {
      if (!FINE.matches && !down) return;
      const r = t.getBoundingClientRect();
      tgt = { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)), o: 1 };
      kick();
    };
    const reset = () => { down = false; tgt = { ...REST }; kick(); };
    /* a light flick, used when the half turns over: the card tips toward its new side and springs back */
    t.nudge = dir => { if (tgt.o) return; cur.o = .9; cur.x = .5 + dir * .38; cur.y = .44; vel.x = -dir * .02; kick(); };
    t.addEventListener('pointerdown', e => { down = true; move(e); });
    t.addEventListener('pointermove', move);
    t.addEventListener('pointerleave', reset);
    t.addEventListener('pointerup', () => { if (!FINE.matches) reset(); });
    t.addEventListener('pointercancel', reset);
    paint();
  });
}

/* ---------- world select ---------- */
function renderWorlds() {
  document.title = 'Rootcraft';
  const openIdx = WORLDS.map((_, i) => worldOpen(i));
  const latest = WORLDS[Math.max(0, openIdx.lastIndexOf(true))];
  applyTheme(latest);
  const total = WORLDS.reduce((s, w) => s + worldStars(w), 0);
  const max = WORLDS.reduce((s, w) => s + w.levels.length * 3, 0);
  app.innerHTML = `<div class="screen worlds-screen">
    <header class="map-head">
      <h1 class="brand" tabindex="-1">Rootcraft</h1>
      <div class="pill tnum" aria-label="${total} of ${max} stars">${star('on')}<span>${total}</span><span class="dim">/ ${max}</span></div>
    </header>
    <div class="journey" role="list">
      <svg class="jtrail" aria-hidden="true"><path class="jtrail-base"/><path class="jtrail-done"/></svg>
      ${WORLDS.map((w, i) => {
        const open = openIdx[i], s = worldStars(w), m = w.levels.length * 3, cur = w === latest;
        const fresh = justDone && justDone.unlockedWorld === w.id ? ' is-new' : '';
        const lbl = open ? `${w.name}: ${s} of ${m} stars` : `${w.name}, locked`;
        const t = w.theme, foil = t.foil;
        return `<div class="orb-wrap" role="listitem" data-i="${i}">
          <a class="orb ${open ? 'is-open' : 'is-locked'}${cur ? ' is-current' : ''}${fresh}" href="${open ? hrefWorld(w) : '#/'}" aria-label="${esc(lbl)}" ${open ? '' : 'aria-disabled="true"'}
             style="--o-bg:${t.bg};--o-bg2:${t.bg2};--o-acc:${t.accent};--o-glit:${t.glitter};--o-ring:conic-gradient(from 210deg, ${foil.concat(foil[0]).join(', ')});--o-p:${(s / m * 100).toFixed(1)}">
            <span class="orb-ball">
              <span class="orb-ring"></span>
              <span class="orb-face"><img src="${w.levels[0].art}" alt="" decoding="async">${open ? '' : `<span class="orb-lock">${ICON.lock}</span>`}</span>
              <svg class="orb-arc${s ? '' : ' is-empty'}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" pathLength="100"/></svg>
            </span>
            <span class="orb-name">${esc(w.name)}</span>
            <span class="orb-stars tnum">${open ? `${star('on')}${s}<span class="dim"> / ${m}</span>` : ''}</span>
          </a></div>`;
      }).join('')}
    </div>
  </div>`;
  layoutJourney();
  $$('.orb', app).forEach(a => a.addEventListener('click', e => {
    if (a.getAttribute('aria-disabled')) { e.preventDefault(); a.classList.remove('nope'); void a.offsetWidth; a.classList.add('nope'); buzz(20); }
  }));
  justDone = null;
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function layoutJourney() {
  const j = $('.journey', app); if (!j) return;
  const W = j.clientWidth, n = WORLDS.length, wide = W >= 700;
  let pts;
  if (wide) {
    const gap = W / n, H = Math.max(340, Math.min(520, innerHeight - 170));
    pts = WORLDS.map((_, i) => [gap * (i + .5), H / 2 + (i % 2 ? 46 : -46)]);
    j.style.height = H + 'px';
  } else {
    const step = 210, amp = Math.min(W * .2, 90);
    pts = WORLDS.map((_, i) => [W / 2 + (i % 2 ? amp : -amp), 120 + i * step]);
    j.style.height = (pts[n - 1][1] + 140) + 'px';
  }
  $$('.orb-wrap', j).forEach((o, i) => { o.style.transform = `translate(${pts[i][0].toFixed(1)}px, ${pts[i][1].toFixed(1)}px)`; });
  const svg = $('.jtrail', j);
  svg.setAttribute('viewBox', `0 0 ${W} ${j.clientHeight}`);
  const d = p => p.map((q, i) => {
    if (!i) return `M${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
    const a = p[i - 1];
    if (wide) { const mx = (a[0] + q[0]) / 2; return `C${mx.toFixed(1)} ${a[1].toFixed(1)} ${mx.toFixed(1)} ${q[1].toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`; }
    const my = (a[1] + q[1]) / 2; return `C${a[0].toFixed(1)} ${my.toFixed(1)} ${q[0].toFixed(1)} ${my.toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
  }).join('');
  $('.jtrail-base', svg).setAttribute('d', d(pts));
  let k = 0; while (k + 1 < n && worldOpen(k + 1)) k++;
  $('.jtrail-done', svg).setAttribute('d', k > 0 ? d(pts.slice(0, k + 1)) : '');
}

/* ---------- level map (one world) ---------- */
function renderMap(w) {
  applyTheme(w);
  document.title = `${w.name} · Rootcraft`;
  const L = w.levels, cur = Math.min(currentIndex(w), L.length - 1);
  const total = worldStars(w);
  const bd = L[cur];
  app.innerHTML = `<div class="screen map-screen">
    <div class="backdrop" aria-hidden="true"><img src="${bd.art}" alt=""></div>
    <header class="map-head">
      <a class="icon-btn" href="#/" aria-label="All worlds">${ICON.back}</a>
      <h1 class="brand brand-world" tabindex="-1">${esc(w.name)}</h1>
      <div class="pill tnum" aria-label="${total} of ${L.length * 3} stars">${star('on')}<span>${total}</span><span class="dim">/ ${L.length * 3}</span></div>
    </header>
    <div class="map" role="list">
      <svg class="trail" aria-hidden="true"><path class="trail-base"/><path class="trail-done"/></svg>
      ${L.map((l, i) => {
        const s = starsOf(w, l), open = levelOpen(w, i), state = i === currentIndex(w) ? 'is-current' : open ? 'is-done' : 'is-locked';
        const fresh = justDone && justDone.unlocked === l.id && justDone.wid === w.id ? ' is-new' : '';
        const label = open ? `Level ${i + 1}: ${l.root}, ${l.meaning}${s ? `, ${s} star${s > 1 ? 's' : ''}` : ''}` : `Level ${i + 1}, locked`;
        return `<div class="node-wrap" role="listitem" data-i="${i}">
          <button class="node ${state}${fresh}" data-id="${l.id}" aria-label="${esc(label)}" ${open ? '' : 'aria-disabled="true"'}>
            <span class="node-disc">${open ? `<img src="${l.art}" alt="" loading="${i < cur + 6 ? 'eager' : 'lazy'}" decoding="async">` : `<span class="node-lock">${ICON.lock}</span>`}</span>
            <span class="node-label">${esc(l.root)}${Object.keys(l.halves).length === 2 ? '<i class="node-two" aria-hidden="true"></i>' : ''}</span>
            <span class="node-stars${justDone && justDone.id === l.id ? ' is-fresh' : ''}">${[1, 2, 3].map(k => star(k <= s ? 'on' : '')).join('')}</span>
          </button></div>`;
      }).join('')}
    </div>
  </div>`;
  layoutMap(w);
  $$('.node', app).forEach(b => b.addEventListener('click', () => {
    if (b.getAttribute('aria-disabled')) { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); buzz(20); return; }
    location.hash = `#/w/${w.id}/${b.dataset.id}`;
  }));
  const focusI = justDone && justDone.wid === w.id ? L.findIndex(l => l.id === (justDone.unlocked || justDone.id)) : cur;
  const target = $(`.node-wrap[data-i="${Math.min(Math.max(focusI, 0), L.length - 1)}"]`, app);
  if (target) {
    const r = target.getBoundingClientRect();
    window.scrollTo({ top: Math.max(0, r.top + scrollY - innerHeight * 0.42), behavior: 'instant' });
  }
  justDone = null;
}
function layoutMap(w) {
  const map = $('.map', app); if (!map) return;
  const L = w.levels, W = map.clientWidth, phone = W < 520;
  const step = phone ? 118 : 132, top = 64, amp = Math.min(W * (phone ? 0.27 : 0.24), 170);
  const pts = L.map((_, i) => [W / 2 + Math.sin(i * 1.1 + 0.4) * amp, top + i * step]);
  map.style.height = (pts[pts.length - 1][1] + 120) + 'px';
  $$('.node-wrap', map).forEach((n, i) => { n.style.transform = `translate(${pts[i][0].toFixed(1)}px, ${pts[i][1].toFixed(1)}px)`; });
  const svg = $('.trail', map);
  svg.setAttribute('viewBox', `0 0 ${W} ${map.clientHeight}`);
  const d = p => p.map((q, i) => {
    if (!i) return `M${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
    const a = p[i - 1], my = (a[1] + q[1]) / 2;
    return `C${a[0].toFixed(1)} ${my.toFixed(1)} ${q[0].toFixed(1)} ${my.toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
  }).join('');
  $('.trail-base', svg).setAttribute('d', d(pts));
  const cur = Math.min(currentIndex(w), L.length - 1);
  $('.trail-done', svg).setAttribute('d', cur > 0 ? d(pts.slice(0, cur + 1)) : '');
}

/* ---------- level ---------- */
let S = null;
const SIDES = ['start', 'end'];
function partHTML(p) {
  if (p.startsWith('-')) return `<span class="hy">-</span>${esc(p.slice(1))}`;
  if (p.endsWith('-')) return `${esc(p.slice(0, -1))}<span class="hy">-</span>`;
  return esc(p);
}
const handHTML = (cards, cls = '') => cards.map((c, k) => `<button class="pcard ${cls}" data-k="${k}" aria-pressed="false" style="--d:${k * 45}ms">
    <span class="pc-part">${partHTML(c.p)}</span><span class="pc-mean">${esc(c.m)}</span>
    <span class="pc-tick">${ICON.check}</span></button>`).join('');
function renderLevel(w, lv) {
  applyTheme(w);
  const i = w.levels.indexOf(lv);
  const sides = SIDES.filter(s => lv.halves[s]);
  document.title = `${lv.root} · Rootcraft`;
  S = { w, lv, i, sides, h: 0, halves: sides.map(s => ({ side: s, order: shuffle(lv.halves[s]), sel: new Set() })), busy: false };
  const best = starsOf(w, lv);
  const H = S.halves[0];
  app.innerHTML = `<div class="screen level-screen">
    <header class="bar">
      <a class="icon-btn" href="${hrefWorld(w)}" aria-label="Back to ${esc(w.name)}">${ICON.back}</a>
      <span class="bar-mid tnum"><span>${i + 1}<span class="dim"> / ${w.levels.length}</span></span>
        ${sides.length > 1 ? `<span class="hdots" aria-hidden="true"><i class="is-on"></i><i></i></span>` : ''}</span>
      <span class="bar-stars" aria-label="Best: ${best} stars">${[1, 2, 3].map(k => star(k <= best ? 'on' : '')).join('')}</span>
    </header>
    <section class="stage">
      <div class="stage-card">${rootCard(lv, 'tilt-main', H.side)}</div>
      <div class="stage-play">
        <p class="prompt">Tap every card that makes a real word with <b>${esc(lv.root)}</b></p>
        <div class="hand" role="group" aria-label="Word part cards">${handHTML(H.order)}</div>
      </div>
    </section>
    <div class="dock"><button class="btn btn-acc done" disabled>${sides.length > 1 ? 'Next' : 'Done'}</button></div>
  </div>`;
  window.scrollTo({ top: 0, behavior: 'instant' });
  bindTilt(app); fitTitles(app);
  bindHand();
  $('.done', app).addEventListener('click', () => (S.h + 1 < S.halves.length ? turnHalf() : finish()));
  $('.rcard-name', app).focus({ preventScroll: true });
  say(halfHint(H.side, lv));
}
const halfHint = (side, lv) => side === 'start' ? `${lv.root} comes first. Pick endings.` : `${lv.root} comes last. Pick beginnings.`;
function bindHand() {
  const H = S.halves[S.h];
  $$('.pcard', app).forEach(b => b.addEventListener('click', () => {
    if (S.busy) return;
    const k = +b.dataset.k, on = !H.sel.has(k);
    on ? H.sel.add(k) : H.sel.delete(k);
    b.setAttribute('aria-pressed', on); b.classList.toggle('is-sel', on); buzz(on ? 8 : 4);
    $('.done', app).disabled = H.sel.size === 0;
  }));
}
/* The page turns over to the second half: old cards flip away, the root card's blank slides to
   the other side with a little flick, and the new hand deals in. Same bubble, no navigation. */
function turnHalf() {
  if (S.busy) return;
  S.busy = true;
  const next = S.halves[S.h + 1], hand = $('.hand', app), done = $('.done', app);
  const old = $$('.pcard', app), slow = !RM.matches;
  done.disabled = true;
  old.forEach((c, k) => { c.style.setProperty('--o', `${(k % 3) * 40 + Math.floor(k / 3) * 30}ms`); c.classList.add('out'); });
  const h1 = $('.rcard-name', app), tilt = $('.tilt-main', app);
  setTimeout(() => {
    h1.dataset.side = next.side;
    if (tilt.nudge) tilt.nudge(next.side === 'end' ? -1 : 1);
    $$('.hdots i', app).forEach((d, k) => { d.classList.toggle('is-on', k === S.h + 1); d.classList.toggle('is-done', k <= S.h); });
  }, slow ? 140 : 0);
  setTimeout(() => {
    S.h++;
    hand.innerHTML = handHTML(next.order, 'deal2');
    bindHand();
    done.textContent = 'Done';
    S.busy = false;
    say(halfHint(next.side, S.lv));
    setTimeout(() => fitTitles(app), slow ? 480 : 0);
  }, slow ? 350 : 0);
}
function grade(R, hits, wrong) {
  const acc = (hits - wrong) / R;
  return hits === R && wrong === 0 ? 3 : acc >= 0.7 ? 2 : acc >= 0.4 ? 1 : 0;
}
function finish() {
  const { w, lv, halves } = S;
  let R = 0, hits = 0, wrong = 0, perfect = true;
  halves.forEach(H => {
    const r = H.order.filter(c => c.real).length;
    const ht = H.order.filter((c, k) => c.real && H.sel.has(k)).length;
    const wr = H.order.filter((c, k) => !c.real && H.sel.has(k)).length;
    Object.assign(H, { R: r, hits: ht, wrong: wr });
    R += r; hits += ht; wrong += wr;
    if (ht !== r || wr) perfect = false;
  });
  const miss = R - hits;
  const score = Math.max(0, hits * PTS.hit + wrong * PTS.wrong + miss * PTS.miss);
  const stars = perfect ? 3 : Math.min(2, grade(R, hits, wrong));
  const key = pk(w, lv);
  const prev = prog[key] || { stars: 0, best: 0 };
  const firstClear = prev.stars === 0 && stars > 0;
  const newBest = score > (prev.best || 0) && (prev.stars > 0 || prev.best > 0);
  prog[key] = { stars: Math.max(prev.stars, stars), best: Math.max(prev.best || 0, score) };
  save();
  const next = w.levels[S.i + 1];
  const wi = WORLDS.indexOf(w), nextWorld = !next && WORLDS[wi + 1] && worldOpen(wi + 1) ? WORLDS[wi + 1] : null;
  justDone = { wid: w.id, id: lv.id, unlocked: firstClear && next ? next.id : null, unlockedWorld: firstClear && nextWorld ? nextWorld.id : null };
  renderResult({ R, hits, wrong, miss, score, stars, newBest, next, nextWorld });
}

/* ---------- result: both directions branch from the root ---------- */
function splitWord(c, lv, side) {
  const w = c.w, bare = c.p.replace(/-/g, '').toLowerCase();
  const forms = lv.forms.map(f => f.toLowerCase()).sort((a, b) => b.length - a.length);
  let at = -1, f = '';
  for (const x of forms) {
    const from = side === 'end' ? Math.max(0, bare.length - 1) : 0;
    const j = side === 'start' && w.startsWith(x) ? 0 : w.indexOf(x, from);
    if (j >= 0 && (at < 0 || j < at || (j === at && x.length > f.length))) { at = j; f = x; }
  }
  if (at < 0) return esc(w);
  return `${esc(w.slice(0, at))}<b>${esc(w.slice(at, at + f.length))}</b>${esc(w.slice(at + f.length))}`;
}
function renderResult(r) {
  const { R, hits, wrong, miss, score, stars, newBest, next, nextWorld } = r;
  const { w, lv, halves } = S;
  const reals = [], fakes = [];
  halves.forEach((H, hi) => H.order.forEach((c, k) => (c.real ? reals : fakes).push({ ...c, side: H.side, found: H.sel.has(k), picked: H.sel.has(k), id: `${hi}-${k}` })));
  let Lc, Rc;
  if (halves.length === 2) { Lc = reals.filter(c => c.side === 'end'); Rc = reals.filter(c => c.side === 'start'); }
  else { Lc = []; Rc = []; reals.forEach((c, n) => (n % 2 ? Rc : Lc).push(c)); }
  const wcard = c => `<div class="wcard ${c.found ? 'is-found' : 'is-missed'}">
      <p class="w-word">${splitWord(c, lv, c.side)}</p>${c.d ? `<p class="w-def">${esc(c.d)}</p>` : ''}
      ${c.found ? `<span class="w-mark">${ICON.check}</span>` : '<span class="w-tag">missed</span>'}</div>`;
  const primary = stars === 0 ? `<button class="btn btn-acc again">${ICON.replay}<span>Try again</span></button>`
    : next ? `<a class="btn btn-acc" href="${hrefLevel(w, next)}">Next level</a>`
    : nextWorld ? `<a class="btn btn-acc" href="${hrefWorld(nextWorld)}">${esc(nextWorld.name)}${ICON.arrow}</a>`
    : `<a class="btn btn-acc" href="#/">Worlds</a>`;
  const secondary = stars === 0 || (!next && !nextWorld) ? `<a class="btn btn-ghost" href="${hrefWorld(w)}">Map</a>`
    : `<button class="btn btn-ghost again" aria-label="Play again">${ICON.replay}</button><a class="btn btn-ghost" href="${hrefWorld(w)}">Map</a>`;
  const two = halves.length === 2;
  app.innerHTML = `<div class="screen result-screen">
    <header class="bar">
      <a class="icon-btn" href="${hrefWorld(w)}" aria-label="Back to ${esc(w.name)}">${ICON.back}</a>
      <span class="bar-mid tnum"><span>${S.i + 1}<span class="dim"> / ${w.levels.length}</span></span></span>
      <span class="bar-stars"></span>
    </header>
    <section class="verdict" aria-label="${stars} of 3 stars, ${score} points">
      <div class="big-stars">${[1, 2, 3].map(k => `<span class="bs" style="--k:${k}">${star(k <= stars ? 'on' : '')}</span>`).join('')}${stars === 3 ? '<i class="burst" aria-hidden="true"></i>' : ''}</div>
      <div class="v-row">
        <p class="score tnum" data-to="${score}">0</p>
        <dl class="tally tnum">
          <div><dt>found</dt><dd>${hits}<span class="dim">/${R}</span></dd><dd class="pts up">+${hits * PTS.hit}</dd></div>
          <div><dt>wrong</dt><dd>${wrong}</dd><dd class="pts dn">${wrong ? '−' + wrong * -PTS.wrong : '0'}</dd></div>
          <div><dt>missed</dt><dd>${miss}</dd><dd class="pts dn">${miss ? '−' + miss * -PTS.miss : '0'}</dd></div>
        </dl>
      </div>
      ${newBest ? '<p class="best">New best</p>' : ''}
    </section>
    <section class="tree ${two ? 'is-two' : 'is-one'}" aria-label="Words made from ${esc(lv.root)}">
      <svg class="tree-lines" aria-hidden="true"></svg>
      <div class="col col-l">${Lc.map(wcard).join('')}</div>
      <div class="tree-root">${rootCard(lv, 'tilt-mini', two ? 'both' : halves[0].side)}</div>
      <div class="col col-r">${Rc.map(wcard).join('')}</div>
    </section>
    <section class="fakes">
      <h2>Not real words</h2>
      <ul>${fakes.map(c => `<li class="fchip ${c.picked ? 'is-picked' : ''}">${c.picked ? `<span class="f-x">${ICON.x}</span>` : ''}<s>${esc(c.w)}</s></li>`).join('')}</ul>
    </section>
    <div class="dock dock-result">${secondary}${primary}</div>
  </div>`;
  window.scrollTo({ top: 0, behavior: 'instant' });
  bindTilt(app); fitTitles(app);
  $$('.again', app).forEach(b => b.addEventListener('click', () => renderLevel(w, lv)));
  say(`${stars} star${stars === 1 ? '' : 's'}. ${score} points. Found ${hits} of ${R}, ${wrong} wrong, ${miss} missed.`);
  countUp($('.score', app), score);
  if (stars === 3) burst($('.burst', app));
  requestAnimationFrame(() => drawTree(true));
}
function countUp(el, to) {
  if (RM.matches || to === 0) { el.textContent = to; return; }
  const t0 = performance.now() + 250, dur = 800;
  const tick = t => {
    const p = Math.min(1, Math.max(0, (t - t0) / dur));
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1 && el.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function burst(el) {
  if (!el || RM.matches) return;
  el.innerHTML = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2, d = 70 + Math.random() * 60;
    return `<i style="--x:${(Math.cos(a) * d).toFixed(0)}px;--y:${(Math.sin(a) * d * 0.7).toFixed(0)}px;--s:${(0.5 + Math.random() * 0.8).toFixed(2)}"></i>`;
  }).join('');
}
/* Wide: branches leave the root card's sides (beginnings left, endings right).
   Narrow: a short trunk drops from the card and forks left and right. */
function drawTree(animate) {
  const tree = $('.tree', app); if (!tree) return;
  const svg = $('.tree-lines', tree);
  const tb = tree.getBoundingClientRect();
  const box = el => { const b = el.getBoundingClientRect(); return { x: b.left - tb.left, y: b.top - tb.top, w: b.width, h: b.height }; };
  const rc = box($('.tree-root .rcard', tree));
  const cards = $$('.wcard', tree);
  if (!cards.length) return;
  const wide = WIDE.matches;
  svg.setAttribute('viewBox', `0 0 ${tb.width} ${tb.height}`);
  const cx = rc.x + rc.w / 2;
  const info = cards.map(c => {
    const b = box(c), left = !!c.closest('.col-l');
    return { c, left, found: c.classList.contains('is-found'), y: b.y + Math.min(30, b.h / 2), x: left ? b.x + b.w : b.x };
  });
  let html = '', order;
  if (wide) {
    const cy = rc.y + rc.h * .5;
    info.forEach(o => {
      const sx = o.left ? rc.x - 2 : rc.x + rc.w + 2, mid = (sx + o.x) / 2;
      o.d = `M${sx.toFixed(1)} ${cy.toFixed(1)} C${mid.toFixed(1)} ${cy.toFixed(1)} ${mid.toFixed(1)} ${o.y.toFixed(1)} ${(o.x + (o.left ? 2 : -2)).toFixed(1)} ${o.y.toFixed(1)}`;
    });
    html += `<circle class="knot root on" cx="${(rc.x - 2).toFixed(1)}" cy="${cy.toFixed(1)}" r="4"/><circle class="knot root on" cx="${(rc.x + rc.w + 2).toFixed(1)}" cy="${cy.toFixed(1)}" r="4"/>`;
    order = info.slice().sort((a, b) => Math.abs(a.y - cy) - Math.abs(b.y - cy));
  } else {
    const y0 = rc.y + rc.h, yEnd = Math.max(...info.map(o => o.y)) - 24;
    html += `<path class="trunk" d="M${cx} ${y0} L${cx} ${yEnd}"/>`;
    info.forEach(o => {
      const yb = o.y - 24, dir = o.left ? -1 : 1;
      o.d = `M${cx} ${yb} C${cx} ${o.y} ${cx + dir * 14} ${o.y} ${o.x - dir * 2} ${o.y}`;
    });
    order = info.slice().sort((a, b) => a.y - b.y);
  }
  order.forEach(o => { html += `<path class="branch ${o.found ? 'on' : 'off'}" d="${o.d}"/>`; });
  order.forEach(o => { html += `<circle class="knot ${o.found ? 'on' : 'off'}" cx="${o.x}" cy="${o.y}" r="3.5"/>`; });
  svg.innerHTML = html;
  if (!animate || RM.matches) { cards.forEach(c => c.classList.add('in')); svg.classList.add('in'); return; }
  const base = 620;
  const trunk = $('.trunk', svg);
  let t = base;
  if (trunk) {
    const tl = trunk.getTotalLength();
    trunk.style.strokeDasharray = tl; trunk.style.strokeDashoffset = tl;
    trunk.getBoundingClientRect();
    trunk.style.transition = `stroke-dashoffset 420ms cubic-bezier(.4,0,.2,1) ${base}ms`;
    trunk.style.strokeDashoffset = 0;
    t += 160;
  }
  const branches = $$('.branch', svg);
  branches.forEach(b => { const l = b.getTotalLength(); b.style.strokeDasharray = l; b.style.strokeDashoffset = l; });
  svg.getBoundingClientRect();
  order.forEach((o, n) => {
    const at = t + n * 70, b = branches[n];
    b.style.transition = `stroke-dashoffset 380ms cubic-bezier(.3,.7,.2,1) ${at}ms`;
    b.style.strokeDashoffset = 0;
    o.c.style.transitionDelay = `${at + 240}ms`;
    o.c.classList.add('in');
  });
  setTimeout(() => svg.classList.add('in'), t + order.length * 70 + 500);
}

/* ---------- router ---------- */
function route() {
  let h = location.hash;
  const legacy = h.match(/^#\/l\/([\w-]+)/); // v2 links
  if (legacy) { history.replaceState(null, '', `#/w/w1/${legacy[1]}`); h = location.hash; }
  const m = h.match(/^#\/w\/([\w-]+)(?:\/([\w-]+))?/);
  const wi = m ? WORLDS.findIndex(w => w.id === m[1]) : -1;
  if (wi < 0 || !worldOpen(wi)) { if (m) history.replaceState(null, '', '#/'); return renderWorlds(); }
  const w = WORLDS[wi];
  if (m[2]) {
    const li = w.levels.findIndex(l => l.id === m[2]);
    if (li >= 0 && levelOpen(w, li)) return renderLevel(w, w.levels[li]);
    history.replaceState(null, '', hrefWorld(w));
  }
  renderMap(w);
}
let rz = 0;
addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => {
    fitTitles(app);
    const m = location.hash.match(/^#\/w\/([\w-]+)/), w = m && WORLDS.find(x => x.id === m[1]);
    if ($('.map', app) && w) layoutMap(w);
    if ($('.journey', app)) layoutJourney();
    if ($('.tree', app)) drawTree(false);
  }, 120);
});
addEventListener('hashchange', route);
(async function boot() {
  const res = await fetch(document.documentElement.dataset.data);
  WORLDS = (await res.json()).worlds.sort((a, b) => a.order - b.order);
  load();
  route();
  if (document.fonts) document.fonts.ready.then(() => { fitTitles(app); if ($('.tree', app)) drawTree(false); });
})();
