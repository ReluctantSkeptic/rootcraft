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
  search: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/></svg>',
  close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
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
      <a class="icon-btn" href="#/" aria-label="Home">${ICON.back}</a>
      <h1 class="brand brand-world" tabindex="-1">Rootcraft</h1>
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
          <a class="orb ${open ? 'is-open' : 'is-locked'}${cur ? ' is-current' : ''}${fresh}" href="${open ? hrefWorld(w) : '#/worlds'}" aria-label="${esc(lbl)}" ${open ? '' : 'aria-disabled="true"'}
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
      <a class="icon-btn" href="#/worlds" aria-label="All worlds">${ICON.back}</a>
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
    : `<a class="btn btn-acc" href="#/worlds">Worlds</a>`;
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

/* ================================================================
   Words mode: every root of every world on one swipeable timeline.
   Each root grows a tree of its real words (same ribbon technique as the
   landing page: tapered ink ribbons regrown each frame by arc length, no masks).
   ================================================================ */

/* ---------- word data (built once from WORLDS) ---------- */
let WD = null;
function wordsData() {
  if (WD) return WD;
  const roots = [], index = [], starts = [];
  WORLDS.forEach((w, wi) => {
    starts.push(roots.length);
    w.levels.forEach((lv, li) => {
      const two = Object.keys(lv.halves).length === 2;
      const words = [];
      for (const side of SIDES) (lv.halves[side] || []).forEach(c => { if (c.real) words.push({ ...c, side }); });
      const R = { i: roots.length, w, wi, lv, li, words };
      // which way each word grows: beginnings (root at the end) left, endings (root first) right
      let n = 0;
      words.forEach(c => { c.dir = two ? (c.side === 'end' ? -1 : 1) : (n++ % 2 ? 1 : -1); c.html = splitWord(c, lv, c.side); });
      roots.push(R);
      words.forEach(c => index.push({ w: c.w, html: c.html, d: c.d || '', r: R.i, root: lv.root, wk: `${c.w} ${lv.forms.join(' ')}`.toLowerCase(), dk: (c.d || '').toLowerCase() }));
    });
  });
  index.sort((a, b) => a.w.localeCompare(b.w) || a.r - b.r);
  const uniq = new Set(index.map(e => e.w)).size;
  return (WD = { roots, index, starts, uniq });
}

/* ---------- the growing tree (shared by the menu and the timeline) ---------- */
const NS = 'http://www.w3.org/2000/svg';
const TREE = (() => {
  let seed = 11, uid = 0;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
  function sample(p0, p1, p2, p3, amp, n = 44) {
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
  // tapered ribbon: thick at the root, hair-thin at the tip; g < 1 draws only the grown part (cut by arc length)
  function ribbon({ pts, len, total }, w0, w1, g = 1) {
    if (g <= 0) return '';
    const L = [], Rr = [], n = pts.length - 1, cut = g * total;
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
  function leafPath(x, y, ang, s) {
    const c = Math.cos(ang), si = Math.sin(ang), P = (u, v) => [x + (u * c - v * si) * s, y + (u * si + v * c) * s];
    const a = P(0, 0), b = P(1, 0), c1 = P(.35, -.42), c2 = P(.75, -.3), c3 = P(.75, .3), c4 = P(.35, .42);
    return `M${a}C${c1} ${c2} ${b}C${c3} ${c4} ${a}Z`.replace(/,/g, ' ').replace(/(\d+\.\d{2})\d+/g, '$1');
  }
  const at = (s, g) => {
    const L = g * s.total; let i = 1; while (i < s.len.length - 1 && s.len[i] < L) i++;
    const k = (L - s.len[i - 1]) / ((s.len[i] - s.len[i - 1]) || 1), a = s.pts[i - 1], b = s.pts[i];
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0])];
  };
  const ease = g => g < 1 ? (g * g * (3 - 2 * g)) * .35 + (1 - Math.pow(1 - g, 2.2)) * .65 : 1;
  // shrink a word that would not fit its side
  function fit(el, maxw) {
    const w = $('.tw-w', el);
    w.style.fontSize = '';
    el.style.maxWidth = Math.max(80, maxw).toFixed(0) + 'px';
    const ww = w.scrollWidth;
    if (ww > maxw) w.style.fontSize = (parseFloat(getComputedStyle(w).fontSize) * maxw / ww * .97).toFixed(2) + 'px';
  }

  /* box: positioned element with svg.wt-svg + .wt-words. anchor: the root (card or word) inside box.
     words: [{html, d, dir (-1 left / 1 right), hl}] */
  function make(box, { mode, anchor, words, mini = false, seedN = 11 }) {
    const svg = $('.wt-svg', box), layer = $('.wt-words', box), id = 't' + (++uid);
    layer.innerHTML = words.map(c => `<div class="tw${c.hl ? ' hl' : ''}"><span class="tw-w">${c.html}</span>${c.d && !mini ? `<span class="tw-m">${esc(c.d)}</span>` : ''}</div>`).join('');
    const els = $$('.tw', layer);
    let B = [], end = 1;
    function build() {
      seed = seedN;
      box.style.height = '';
      let W = box.clientWidth, H = box.clientHeight;
      const br = box.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
      const A = { x0: ar.left - br.left, x1: ar.right - br.left, y0: ar.top - br.top, y1: ar.bottom - br.top };
      A.w = A.x1 - A.x0; A.h = A.y1 - A.y0; A.cx = A.x0 + A.w / 2; A.cy = A.y0 + A.h / 2;
      B = [];
      const hasHL = words.some(c => c.hl);
      if (mode === 'trunk') {
        // phone: a trunk drops from the card; branches peel off left and right in turn
        const M = 14, n = words.length;
        const cx = A.cx, top = A.y1 + 6;
        const Ls = words.map((c, k) => k).filter(k => words[k].dir < 0), Rs = words.map((c, k) => k).filter(k => words[k].dir > 0), slots = [];
        while (Ls.length || Rs.length) slots.push(slots.length % 2 === 0 ? (Ls.length ? Ls.shift() : Rs.shift()) : (Rs.length ? Rs.shift() : Ls.shift()));
        let gap = clamp((H - top - 40) / n, 52, 86);
        const need = top + 12 + gap * n + 30;
        if (need > H) { box.style.height = need.toFixed(0) + 'px'; H = need; }
        const tEnd = top + 12 + gap * (n - .5) + gap * .1;
        const trunk = sample([cx, top], [cx + 4, top + (tEnd - top) * .3], [cx - 6, top + (tEnd - top) * .7], [cx, tEnd], 7, 60);
        const tdur = .5 + n * .1;
        B.push({ s: trunk, w0: 8, w1: 2.2, start: .12, dur: tdur, trunk: true,
          leaves: [.2, .5, .8].slice(0, n > 3 ? 3 : 2).map((g, j) => { const p = at(trunk, g); return { g, x: p[0], y: p[1], ang: (j % 2 ? 0 : Math.PI) + (j % 2 ? -.6 : .6), s: 11 }; }) });
        const maxw = cx - 34 - M - 10;
        slots.forEach((k, j) => {
          const side = j % 2 ? 1 : -1, el = els[k];
          el.classList.toggle('r', side < 0);
          fit(el, maxw);
          const ew = el.offsetWidth, wh = $('.tw-w', el).offsetHeight;
          const y0 = top + 12 + j * gap, ty = y0 + gap * .5;
          let tx = side < 0 ? M + ew + 12 : W - M - ew - 12;
          tx = side < 0 ? Math.min(tx, cx - 30) : Math.max(tx, cx + 30);
          const g0 = clamp((y0 - top) / (tEnd - top)), p = at(trunk, g0), dx = tx - p[0];
          const s = sample([p[0], p[1]], [p[0] + dx * .15, p[1] + (ty - p[1]) * .1], [tx - dx * .55, ty], [tx, ty], 2.5, 28);
          const st = hasHL ? (words[k].hl ? .12 + tdur * g0 * .5 : .9 + tdur * g0) : .12 + tdur * g0 + .02;
          B.push({ s, w0: 4.6, w1: 1.1, side, tip: [tx, ty], start: st, dur: .48, el, hl: words[k].hl, leaves: [] });
          el.style.left = (side < 0 ? tx - 10 - ew : tx + 10).toFixed(1) + 'px';
          el.style.top = (ty - wh * .55).toFixed(1) + 'px';
        });
      } else {
        // wide: branches leave the card's flanks and fan out on an ellipse, each word blooming at its tip
        const M = mini ? 6 : 28, cw = A.w, ch = A.h, cx = A.cx, cy = A.cy;
        const gapX = mini ? 14 : 40;
        const room = mini ? 0 : 230;
        const Rx = mini ? Math.max(10, W * .1) : clamp(W / 2 - cw / 2 - gapX - room - M, 30, 200);
        const Ry = mini ? H * .34 : Math.min(H * .38, 300);
        const TH = { 1: [0], 2: [-.42, .42], 3: [-.78, 0, .78], 4: [-.98, -.33, .33, .98], 5: [-1.05, -.52, 0, .52, 1.05] };
        const rank = [];
        [-1, 1].forEach(side => {
          const G = words.map((c, k) => k).filter(k => words[k].dir === side);
          const th = TH[G.length] || G.map((_, j) => -1.1 + 2.2 * j / (G.length - 1));
          G.forEach((k, j) => {
            const el = els[k], a = th[j];
            el.classList.toggle('r', side < 0);
            const tx = cx + side * (cw / 2 + gapX + Rx * Math.cos(a)), ty = cy + Ry * Math.sin(a);
            const maxw = Math.min(mini ? 200 : 320, side < 0 ? tx - 16 - M : W - M - tx - 16);
            fit(el, maxw);
            const ew = el.offsetWidth, wh = $('.tw-w', el).offsetHeight;
            el.style.left = (side < 0 ? tx - 16 - ew : tx + 16).toFixed(1) + 'px';
            el.style.top = (ty - wh * .55).toFixed(1) + 'px';
            const sx = cx + side * (cw / 2 + (mini ? 6 : -6)), sy = cy + Math.sin(a) * ch * (mini ? .12 : .22), dx = tx - sx;
            const s = sample([sx, sy], [sx + dx * (mini ? .5 : .38), sy + (ty - sy) * (mini ? .02 : .12)], [tx - dx * .42, ty], [tx, ty], (mini ? 2.5 : 6) + rnd() * (mini ? 2 : 4));
            const leaves = (mini ? [.5] : [.34, .68]).map((g, q) => { const p = at(s, g); return { g, x: p[0], y: p[1], ang: p[2] + (q ? -1 : 1) * side * .9, s: (mini ? 8 : 12) + rnd() * 5 }; });
            const b = { s, w0: mini ? 4.2 : 7, w1: mini ? .9 : 1.3, side, tip: [tx, ty], el, hl: words[k].hl, leaves, a };
            B.push(b); rank.push(b);
          });
        });
        rank.sort((p, q) => Math.abs(p.a) - Math.abs(q.a) || p.side - q.side);
        let r = 0;
        rank.forEach(b => { b.dur = mini ? .9 : .78; b.start = b.hl ? .1 : (hasHL ? 1.05 : .14) + (r++) * (mini ? .13 : .1); });
      }
      end = Math.max(...B.map(b => b.start + b.dur)) + .7;
      // draw
      svg.setAttribute('viewBox', `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
      svg.setAttribute('width', W.toFixed(0)); svg.setAttribute('height', H.toFixed(0));
      let defs = `<radialGradient id="${id}g"><stop offset="0" style="stop-color:#FFF8E6"/><stop offset=".35" style="stop-color:var(--acc-2);stop-opacity:.9"/><stop offset="1" style="stop-color:var(--acc-2);stop-opacity:0"/></radialGradient>`;
      let body = '';
      B.forEach((b, i) => {
        const [x1, y1] = b.s.pts[0], [x2, y2] = b.trunk ? b.s.pts[b.s.pts.length - 1] : b.tip;
        defs += `<linearGradient id="${id}b${i}" gradientUnits="userSpaceOnUse" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"><stop offset="0" style="stop-color:var(--accent)"/><stop offset=".5" style="stop-color:var(--br-mid)"/><stop offset="1" style="stop-color:var(--paper);stop-opacity:.8"/></linearGradient>`;
        body += `<g>${b.hl ? '<path class="tb-hl" d=""/>' : ''}<path class="tb" d="" fill="url(#${id}b${i})"/>` +
          b.leaves.map(l => `<path class="tl" d="${leafPath(l.x, l.y, l.ang, l.s)}" style="transform-origin:${l.x.toFixed(1)}px ${l.y.toFixed(1)}px"/>`).join('') +
          (b.el ? `<circle class="tbud-ring${b.hl ? ' hl' : ''}" cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="${mini ? 6 : 9}"/><circle class="tbud" cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="${mini ? 3 : 4.4}"/>` : '') +
          `<circle class="tfront" r="${mini ? 7 : 10}" cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" fill="url(#${id}g)"/></g>`;
      });
      svg.innerHTML = `<defs>${defs}</defs>${body}`;
      $$(':scope > g', svg).forEach((g, i) => {
        const b = B[i];
        b.path = $('.tb', g); b.hlp = $('.tb-hl', g); b.leafEls = $$('.tl', g); b.bud = $('.tbud', g); b.ring = $('.tbud-ring', g); b.front = $('.tfront', g); b.last = -1;
      });
    }
    function render(t) {
      for (const b of B) {
        const g = clamp((t - b.start) / b.dur);
        if (Math.abs(g - b.last) < .0005 && !(g === 1 && b.last !== 1) && !(g === 0 && b.last > 0)) continue; b.last = g;
        const ge = ease(g);
        const d = ribbon(b.s, b.w0, b.w1, ge);
        b.path.setAttribute('d', d);
        if (b.hlp) b.hlp.setAttribute('d', ribbon(b.s, b.w0 * 2.6, b.w1 * 3, ge));
        const pt = at(b.s, Math.max(.001, ge));
        b.front.setAttribute('cx', pt[0].toFixed(1)); b.front.setAttribute('cy', pt[1].toFixed(1));
        b.front.style.opacity = g > 0 && g < 1 ? 1 : 0;
        b.leafEls.forEach((l, j) => l.classList.toggle('on', ge > b.leaves[j].g + .04));
        if (b.el) { const on = g >= .94; b.el.classList.toggle('on', on); b.bud.classList.toggle('on', g >= .86); b.ring.classList.toggle('on', on); }
      }
      return t < end;
    }
    build();
    return { build, render, get end() { return end; }, els };
  }
  return { make };
})();

/* ---------- home: choose a mode ---------- */
function renderMenu() {
  document.title = 'Rootcraft';
  applyTheme(WORLDS[0]);
  const D = wordsData();
  const total = WORLDS.reduce((s, w) => s + worldStars(w), 0), max = WORLDS.reduce((s, w) => s + w.levels.length * 3, 0);
  const demo = D.roots.find(r => r.lv.id === 'port') || D.roots.reduce((a, b) => (b.words.length > a.words.length ? b : a));
  app.innerHTML = `<div class="screen menu-screen">
    <header class="map-head">
      <h1 class="brand" tabindex="-1">Rootcraft</h1>
      <div class="pill tnum" aria-label="${total} of ${max} stars">${star('on')}<span>${total}</span><span class="dim">/ ${max}</span></div>
    </header>
    <nav class="modes" aria-label="Game modes">
      <a class="mode mode-play" href="#/worlds">
        <span class="mode-vis morbs" aria-hidden="true">${WORLDS.map((w, i) => {
          const f = w.theme.foil;
          return `<span class="morb" style="--i:${i};--o-bg:${w.theme.bg};--o-bg2:${w.theme.bg2};--o-acc:${w.theme.accent};--o-ring:conic-gradient(from 210deg, ${f.concat(f[0]).join(', ')})"><i class="morb-ring"></i><i class="morb-face"><img src="${w.levels[0].art}" alt="" decoding="async"></i></span>`;
        }).join('')}</span>
        <span class="mode-txt"><span class="mode-name">Play</span><span class="mode-sub">${D.roots.length} roots in ${WORLDS.length} worlds</span></span>
        <span class="mode-go" aria-hidden="true">${ICON.arrow}</span>
      </a>
      <a class="mode mode-words" href="#/words">
        <span class="mode-vis mtree" aria-hidden="true"><span class="wt"><svg class="wt-svg"></svg><b class="mt-root">${esc(demo.lv.root)}</b><span class="wt-words"></span></span></span>
        <span class="mode-txt"><span class="mode-name">Words</span><span class="mode-sub">${D.uniq} words, every root</span></span>
        <span class="mode-go" aria-hidden="true">${ICON.arrow}</span>
      </a>
    </nav>
  </div>`;
  window.scrollTo({ top: 0, behavior: 'instant' });
  // the Words tile grows a little tree of one root
  const box = $('.mtree .wt', app), anchor = $('.mt-root', box);
  const pick = demo.words.slice(0, 6);
  let tree = null, raf = 0, t0 = 0;
  const grow = () => {
    if (!box.isConnected) return;
    tree = TREE.make(box, { mode: 'radial', mini: true, anchor, words: pick.map((c, n) => ({ html: c.html, dir: n % 2 ? 1 : -1 })), seedN: 23 });
    if (RM.matches) { tree.render(99); return; }
    cancelAnimationFrame(raf); t0 = performance.now() + 250;
    const tick = now => { if (!box.isConnected) return; if (tree.render((now - t0) / 1000)) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(grow);
  const tile = $('.mode-words', app);
  tile.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && tree && performance.now() - t0 > tree.end * 1000) grow(); });
  menuResize = () => { if (tree) { tree.build(); tree.render(99); } };
}
let menuResize = null;

/* ---------- Words timeline ---------- */
let WM = null;
function renderWords(q) {
  const D = wordsData(), N = D.roots.length;
  // where to start: deep link, else where we were, else the first root
  let start = WM ? WM.idx : 0, hl = null;
  if (q.word) {
    const e = D.index.find(x => x.w === q.word.toLowerCase());
    if (e) { start = e.r; hl = e.w; }
  } else if (q.wid) {
    const r = D.roots.find(x => x.w.id === q.wid && (!q.rid || x.lv.id === q.rid));
    if (r) start = r.i;
  }
  if (WM && WM.alive) { WM.go(start, hl); return; }
  if (WM) WM.destroy();
  document.documentElement.classList.add('is-words');
  app.innerHTML = `<div class="words-screen">
    <header class="wm-head">
      <a class="icon-btn" href="#/" aria-label="Home">${ICON.back}</a>
      <button class="wm-world" aria-label="All roots"><span class="wn"></span><span class="wc tnum"></span></button>
      <button class="icon-btn wm-find" aria-label="All words, A to Z" aria-keyshortcuts="/">${ICON.search}</button>
    </header>
    <div class="wm-stage" tabindex="0" aria-roledescription="carousel" aria-label="Roots. Use the arrow keys to move."></div>
    <div class="wm-foot">
    <button class="wm-step wm-prev" aria-label="Previous root">${ICON.back}<span></span></button>
    <div class="wm-scrub" role="slider" tabindex="0" aria-label="Root" aria-valuemin="1" aria-valuemax="${N}">
      <div class="ws-track">${WORLDS.map((w, i) => `<div class="ws-seg" style="--c:${w.theme.accent};--n:${w.levels.length}"><i class="ws-bar"><i class="ws-fill"></i></i><span class="ws-name">${esc(w.name)}</span></div>`).join('')}
        <i class="ws-thumb"><b class="ws-tip"></b></i></div>
    </div>
    <button class="wm-step wm-next" aria-label="Next root"><span></span>${ICON.back}</button>
    </div>
  </div>`;
  WM = wordsMode(D, start, hl);
}

function wordsMode(D, startIdx, startHL) {
  const scr = $('.words-screen', app), stage = $('.wm-stage', scr), scrub = $('.wm-scrub', scr), thumb = $('.ws-thumb', scr), tip = $('.ws-tip', scr);
  const segs = $$('.ws-seg', scr), fills = $$('.ws-fill', scr), wname = $('.wn', scr), wcount = $('.wc', scr);
  const N = D.roots.length, ac = new AbortController(), sig = { signal: ac.signal };
  const prevB = $('.wm-prev', scr), nextB = $('.wm-next', scr);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const S = {
    pos: startIdx, vel: 0, target: startIdx, W: stage.clientWidth, drag: null, scrub: false,
    pages: new Map(), active: -1, tree: null, t0: 0, raf: 0, world: -1, hl: startHL ? { i: startIdx, w: startHL } : null,
    wheelT: 0, wheelAnchor: 0, wheelTimer: 0, lastT: 0, xs: [], idx: startIdx, alive: true, settledAt: 0,
  };
  const phone = () => S.W < 700;

  /* pages */
  function mount(i) {
    let pg = S.pages.get(i);
    if (pg) return pg;
    const R = D.roots[i], t = R.w.theme;
    pg = document.createElement('section');
    pg.className = 'wpage';
    pg.style.cssText = `--accent:${t.accent};--glitter:${t.glitter};--foil:${foilGradient(t.foil)}`;
    pg.setAttribute('aria-label', `${R.lv.forms.join(', ')}: ${R.lv.meaning}`);
    pg.innerHTML = `<div class="wt"><svg class="wt-svg" aria-hidden="true"></svg>
      <div class="wt-card"><div class="wpc">${rootCard(R.lv, 'tilt-wm')}</div></div>
      <div class="wt-words" aria-hidden="true"></div></div>
      <ul class="sr-only">${R.words.map(c => `<li>${esc(c.w)}${c.d ? `: ${esc(c.d)}` : ''}</li>`).join('')}</ul>`;
    stage.appendChild(pg);
    pg._card = $('.wpc', pg); pg._wt = $('.wt', pg);
    seatCard(pg, R.words.length);
    fitTitles(pg); bindTilt(pg);
    fontsReady.then(() => fitTitles(pg));
    S.pages.set(i, pg);
    return pg;
  }
  // phones: card + trunk sit together, centred when the tree is short (same maths as the trunk layout)
  function seatCard(pg, n) {
    const c = $('.wt-card', pg);
    if (!phone()) { c.style.top = ''; return; }
    const H = stage.clientHeight, ch = c.offsetHeight, g = Math.min(86, Math.max(52, (H - ch - 60) / n));
    c.style.top = Math.max(8, (H - (ch + 18 + g * n + 30)) / 2 * .8).toFixed(0) + 'px';
  }
  function unmount(i) { const pg = S.pages.get(i); if (pg) { pg.remove(); S.pages.delete(i); } }
  function clearTree() {
    const pg = S.pages.get(S.active);
    if (pg) { $('.wt-words', pg).innerHTML = ''; $('.wt-svg', pg).innerHTML = ''; pg._wt.style.height = ''; pg.classList.remove('is-live'); }
    S.tree = null;
  }
  function activate(i, instant) {
    if (S.active === i) return;
    clearTree();
    S.active = i; S.idx = i;
    const pg = mount(i), R = D.roots[i];
    const hw = S.hl && S.hl.i === i ? S.hl.w : null; S.hl = null;
    pg.classList.add('is-live');
    pg.scrollTop = 0;
    const tl = $('.tilt', pg); if (tl && tl.nudge && S.lastDir) tl.nudge(S.lastDir);
    const words = R.words.map(c => ({ html: c.html, d: c.d, dir: c.dir, hl: c.w === hw }));
    fontsReady.then(() => {
      if (S.active !== i || !S.alive) return;
      S.tree = TREE.make(pg._wt, { mode: phone() ? 'trunk' : 'radial', anchor: $('.wt-card', pg), words, seedN: 11 + i * 7 });
      S.t0 = instant ? performance.now() - 99000 : performance.now();
      if (RM.matches || instant) S.tree.render(99); else kick();
      if (hw) { // keep the found word in view on phones
        const el = S.tree.els[R.words.findIndex(c => c.w === hw)];
        if (el && phone()) { const y = parseFloat(el.style.top); if (y > pg.clientHeight - 80) pg.scrollTo({ top: y - pg.clientHeight * .5, behavior: RM.matches ? 'auto' : 'smooth' }); }
      }
    });
    const w = R.w;
    history.replaceState(null, '', `#/words/${w.id}/${R.lv.id}`);
    document.title = `${R.lv.root} · Words · Rootcraft`;
    scrub.setAttribute('aria-valuenow', i + 1);
    scrub.setAttribute('aria-valuetext', `${R.lv.root}, ${w.name}, ${i + 1} of ${N}`);
    say(`${R.lv.root}: ${R.lv.meaning}. ${R.words.map(c => c.w).join(', ')}`);
  }

  /* layout per frame: only the current root and its neighbours exist */
  function place() {
    const W = S.W, lo = Math.max(0, Math.floor(S.pos) - 1), hi = Math.min(N - 1, Math.ceil(S.pos) + 1);
    for (const i of [...S.pages.keys()]) if ((i < lo || i > hi) && i !== S.active) unmount(i);
    for (let i = lo; i <= hi; i++) {
      const pg = mount(i), d = i - S.pos, ad = Math.min(1.2, Math.abs(d));
      pg.style.transform = `translate3d(${(d * W).toFixed(1)}px,0,0)`;
      pg._card.style.transform = RM.matches ? '' : `translate3d(${(-d * W * .16).toFixed(1)}px,0,0) rotateY(${(-d * 26).toFixed(2)}deg) scale(${(1 - ad * .1).toFixed(4)})`;
      const tl = clamp(1 - ad * 2.4, 0, 1);
      if (pg._tl !== tl) { pg._tl = tl; $('.wt-words', pg).style.opacity = tl; $('.wt-svg', pg).style.opacity = tl; }
      const vis = ad < .5;
      if (pg._vis !== vis) { pg._vis = vis; pg.setAttribute('aria-hidden', vis ? 'false' : 'true'); pg.inert = !vis; }
    }
    // world theme follows the root in view
    const ci = clamp(Math.round(S.pos), 0, N - 1), R = D.roots[ci];
    if (R.wi !== S.world) {
      S.world = R.wi; applyTheme(R.w);
      wname.textContent = R.w.name; wname.classList.remove('swap'); void wname.offsetWidth; wname.classList.add('swap');
      segs.forEach((s, k) => s.classList.toggle('on', k === R.wi));
    }
    wcount.textContent = `${R.li + 1}/${R.w.levels.length}`;
    if (S.navI !== ci) {
      S.navI = ci;
      const pv = D.roots[ci - 1], nx = D.roots[ci + 1];
      prevB.disabled = !pv; nextB.disabled = !nx;
      prevB.lastElementChild.textContent = pv ? pv.lv.root : ''; nextB.firstElementChild.textContent = nx ? nx.lv.root : '';
      prevB.style.setProperty('--c', pv ? pv.w.theme.accent : ''); nextB.style.setProperty('--c', nx ? nx.w.theme.accent : '');
    }
    // scrubber
    const f = clamp(S.pos, 0, N - 1), a = Math.floor(f), b = Math.min(N - 1, a + 1), x = S.xs.length ? S.xs[a] + (S.xs[b] - S.xs[a]) * (f - a) : 0;
    thumb.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    D.starts.forEach((st, k) => { const n = WORLDS[k].levels.length; fills[k].style.transform = `scaleX(${clamp((f - st + .5) / n, 0, 1).toFixed(4)})`; });
    if (S.scrub || S.drag) tip.textContent = R.lv.root;
  }
  function measureScrub() {
    const tr = $('.ws-track', scr).getBoundingClientRect();
    S.xs = [];
    segs.forEach((s, k) => {
      const r = $('.ws-bar', s).getBoundingClientRect(), n = WORLDS[k].levels.length;
      for (let j = 0; j < n; j++) S.xs.push(r.left - tr.left + (j + .5) / n * r.width);
    });
  }

  /* motion: a spring toward the target root; the visible root's tree grows on arrival */
  function kick() { if (!S.raf && S.alive) S.raf = requestAnimationFrame(frame); }
  function frame(now) {
    S.raf = 0;
    const dt = Math.min(.05, (now - (S.lastT || now)) / 1000) || 1 / 60; S.lastT = now;
    let more = false;
    if (!S.drag && !S.scrub && !S.wheeling) {
      if (RM.matches) { S.pos = S.target; S.vel = 0; }
      else {
        const k = 170, c = 2 * Math.sqrt(k) * .82; // stiffness, ~critical damping with a whisper of overshoot
        S.vel += ((S.target - S.pos) * k - S.vel * c) * dt;
        S.pos += S.vel * dt;
        if (Math.abs(S.target - S.pos) < .0006 && Math.abs(S.vel) < .004) { S.pos = S.target; S.vel = 0; }
        else more = true;
      }
      if (Math.abs(S.pos - S.target) < .08 && S.active !== S.target) activate(S.target);
    } else more = true;
    place();
    if (S.tree && !RM.matches) { if (S.tree.render((now - S.t0) / 1000)) more = true; }
    if (more) kick();
    else S.lastT = 0;
  }
  function go(i, hlWord) {
    i = clamp(i, 0, N - 1);
    S.lastDir = Math.sign(i - S.pos) || S.lastDir;
    if (hlWord) {
      S.hl = { i, w: hlWord };
      if (S.active === i) { S.active = -1; } // regrow with the highlight
    }
    if (Math.abs(i - S.pos) > 2.5 && !RM.matches) {
      // far jump: dissolve and reappear instead of racing past every root
      stage.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-in' }).onfinish = () => {
        S.pos = i + Math.sign(S.pos - i) * .35; S.target = i; S.vel = 0; place(); kick();
        stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
      };
      return;
    }
    S.target = i; kick();
  }
  const step = d => go(Math.round(S.target) + d);

  /* input: drag / swipe */
  stage.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    S.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, p0: S.pos, lock: e.pointerType === 'mouse' ? null : null, s: [[performance.now(), e.clientX]], mouse: e.pointerType === 'mouse', moved: false };
  }, sig);
  stage.addEventListener('pointermove', e => {
    const d = S.drag; if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.lock) {
      if (Math.abs(dx) + Math.abs(dy) < 7) return;
      d.lock = Math.abs(dx) > Math.abs(dy) * .9 ? 'x' : 'y';
      if (d.lock === 'y') { S.drag = null; return; }
      try { stage.setPointerCapture(e.pointerId); } catch {}
      stage.classList.add('dragging'); S.vel = 0;
    }
    d.moved = true;
    let p = d.p0 - dx / S.W;
    if (p < 0) p = -Math.pow(-p, .7) * .35; // rubber band at the ends
    if (p > N - 1) p = N - 1 + Math.pow(p - N + 1, .7) * .35;
    S.pos = p;
    d.s.push([performance.now(), e.clientX]); if (d.s.length > 6) d.s.shift();
    kick();
  }, sig);
  const endDrag = e => {
    const d = S.drag; if (!d || (e && d.id !== e.pointerId)) return;
    S.drag = null; stage.classList.remove('dragging');
    if (!d.moved) return;
    const [t0, x0] = d.s[0], [t1, x1] = d.s[d.s.length - 1];
    const v = t1 - t0 > 0 && performance.now() - t1 < 90 ? -(x1 - x0) / (t1 - t0) * 1000 / S.W : 0; // pages per second
    const from = Math.round(d.p0);
    let to = Math.round(S.pos + v * .12);
    if (Math.abs(v) > .35 && to === from) to = from + Math.sign(v);
    S.target = clamp(clamp(to, from - 1, from + 1), 0, N - 1);
    S.lastDir = Math.sign(S.target - d.p0) || S.lastDir;
    S.vel = clamp(v, -6, 6);
    S.suppress = performance.now();
    kick();
  };
  stage.addEventListener('pointerup', endDrag, sig);
  stage.addEventListener('pointercancel', endDrag, sig);
  stage.addEventListener('click', e => { if (S.suppress && performance.now() - S.suppress < 300) { e.preventDefault(); e.stopPropagation(); } }, { capture: true, signal: ac.signal });
  stage.addEventListener('dragstart', e => e.preventDefault(), sig);

  /* input: trackpad / wheel — one root per gesture, glides then snaps */
  stage.addEventListener('wheel', e => {
    const pg = S.pages.get(S.active);
    const canScrollY = pg && pg.scrollHeight > pg.clientHeight + 4 && phone();
    let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (canScrollY ? 0 : e.deltaY);
    if (!d) return;
    e.preventDefault();
    const now = performance.now();
    const discrete = e.deltaMode !== 0 || (!e.deltaX && Math.abs(e.deltaY) >= 100 && Number.isInteger(e.deltaY));
    if (discrete) { if (now - S.wheelT > 260) { S.wheelT = now; step(Math.sign(d)); } return; }
    if (now - S.wheelT > 240) S.wheelAnchor = Math.round(S.target);
    S.wheelT = now; S.wheeling = true; S.vel = 0;
    const a = S.wheelAnchor;
    let p = S.pos + d / (S.W * .75);
    p = clamp(p, Math.max(-.25, a - 1), Math.min(N - .75, a + 1));
    S.pos = p;
    clearTimeout(S.wheelTimer);
    S.wheelTimer = setTimeout(() => {
      S.wheeling = false;
      const off = S.pos - a;
      S.target = clamp(Math.abs(off) > .12 ? a + Math.sign(off) : a, 0, N - 1); S.lastDir = Math.sign(off) || S.lastDir;
      kick();
    }, 110);
    kick();
  }, { passive: false, signal: ac.signal });

  /* input: keys */
  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if ($('.wx.open', scr)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' && document.activeElement === scrub) { e.preventDefault(); step(1); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' && document.activeElement === scrub) { e.preventDefault(); step(-1); }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(N - 1); }
    else if (k === 'PageDown') { e.preventDefault(); const nx = D.starts.find(s => s > S.target); go(nx ?? N - 1); }
    else if (k === 'PageUp') { e.preventDefault(); const pv = [...D.starts].reverse().find(s => s < S.target); go(pv ?? 0); }
    else if (k === '/' || k === 'f') { e.preventDefault(); openIndex('words'); }
  }, sig);

  /* input: the scrubber */
  const scrubAt = x => {
    const tr = $('.ws-track', scr).getBoundingClientRect(), X = x - tr.left, xs = S.xs;
    if (X <= xs[0]) return 0;
    if (X >= xs[N - 1]) return N - 1;
    let j = 0; while (j < N - 2 && xs[j + 1] < X) j++;
    return j + (X - xs[j]) / ((xs[j + 1] - xs[j]) || 1);
  };
  scrub.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    measureScrub();
    S.scrub = true; scrub.classList.add('scrubbing'); S.vel = 0;
    try { scrub.setPointerCapture(e.pointerId); } catch {}
    S.pos = scrubAt(e.clientX); kick();
  }, sig);
  scrub.addEventListener('pointermove', e => { if (S.scrub) { S.pos = scrubAt(e.clientX); kick(); } }, sig);
  const endScrub = () => { if (!S.scrub) return; S.scrub = false; scrub.classList.remove('scrubbing'); S.target = clamp(Math.round(S.pos), 0, N - 1); kick(); };
  scrub.addEventListener('pointerup', endScrub, sig);
  scrub.addEventListener('pointercancel', endScrub, sig);

  $('.wm-find', scr).addEventListener('click', () => openIndex('words'), sig);
  prevB.addEventListener('click', () => step(-1), sig);
  nextB.addEventListener('click', () => step(1), sig);
  $('.wm-world', scr).addEventListener('click', () => openIndex('roots'), sig);

  /* index: every word A-Z, and every root by world */
  let IX = null;
  function buildIndex() {
    const wrap = document.createElement('div');
    wrap.className = 'wx';
    wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'All words');
    const letters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
    const byL = {}; D.index.forEach((e, n) => { const L = e.w[0].toUpperCase(); (byL[L] = byL[L] || []).push(n); });
    const accent = i => D.roots[i].w.theme.accent;
    const rows = letters.filter(L => byL[L]).map(L => `<section class="wx-sec" data-l="${L}"><h3 class="wx-l" id="wx-${L}">${L}</h3>${byL[L].map(n => {
      const e = D.index[n];
      return `<button class="wx-row" data-n="${n}" style="--c:${accent(e.r)}"><span class="wx-w">${e.html}</span><span class="wx-d">${esc(e.d)}</span><span class="wx-r">${esc(e.root)}</span></button>`;
    }).join('')}</section>`).join('');
    const roots = WORLDS.map((w, k) => `<section class="wx-sec wx-wsec" style="--c:${w.theme.accent}"><h3 class="wx-l wx-wl">${esc(w.name)}<span class="tnum">${w.levels.length}</span></h3>${D.roots.filter(r => r.wi === k).map(r =>
      `<button class="wx-row wx-rrow" data-i="${r.i}" style="--c:${w.theme.accent}"><img src="${r.lv.art}" alt="" loading="lazy" decoding="async"><span class="wx-w">${r.lv.forms.map(esc).join('<i> · </i>')}</span><span class="wx-d">${esc(r.lv.meaning)}</span><span class="wx-r tnum">${r.words.length}</span></button>`).join('')}</section>`).join('');
    wrap.innerHTML = `<div class="wx-back"></div><div class="wx-panel">
      <div class="wx-top">
        <label class="wx-search">${ICON.search}<input type="search" placeholder="Find a word" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" aria-label="Find a word or root"></label>
        <button class="icon-btn wx-close" aria-label="Close">${ICON.close}</button>
      </div>
      <div class="wx-tabs" role="tablist"><button role="tab" data-tab="words">Words <span class="tnum">${D.uniq}</span></button><button role="tab" data-tab="roots">Roots <span class="tnum">${N}</span></button><i class="wx-ink"></i></div>
      <div class="wx-body">
        <div class="wx-list wx-words" role="tabpanel">${rows}<p class="wx-none">No words match</p></div>
        <div class="wx-list wx-roots" role="tabpanel" hidden>${roots}<p class="wx-none">No roots match</p></div>
        <nav class="wx-az" aria-label="Jump to letter">${letters.map(L => `<button data-l="${L}"${byL[L] ? '' : ' disabled'}>${L}</button>`).join('')}</nav>
      </div></div>`;
    scr.appendChild(wrap);
    const input = $('input', wrap), lw = $('.wx-words', wrap), lr = $('.wx-roots', wrap), az = $('.wx-az', wrap);
    const wrows = $$('.wx-words .wx-row', wrap), wsecs = $$('.wx-words .wx-sec', wrap);
    const rrows = $$('.wx-roots .wx-row', wrap), rsecs = $$('.wx-roots .wx-sec', wrap);
    const rkeys = D.roots.map(r => ({ f: r.lv.forms.join(' ').toLowerCase(), m: `${r.lv.meaning} ${r.w.name}`.toLowerCase() }));
    let tab = 'words';
    const filter = () => {
      const q = input.value.trim().toLowerCase();
      let any = 0;
      const re = q ? new RegExp('\\b' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) : null;
      lw.classList.toggle('q', !!q); lr.classList.toggle('q', !!q);
      wrows.forEach(r => { const e = D.index[+r.dataset.n], on = !q || e.wk.includes(q) || re.test(e.dk); r.hidden = !on; if (on) any++; });
      wsecs.forEach(s => { s.hidden = !$('.wx-row:not([hidden])', s); });
      $('.wx-none', lw).hidden = !!any;
      let anyR = 0;
      rrows.forEach(r => { const k = rkeys[+r.dataset.i], on = !q || k.f.includes(q) || re.test(k.m); r.hidden = !on; if (on) anyR++; });
      rsecs.forEach(s => { s.hidden = !$('.wx-row:not([hidden])', s); });
      $('.wx-none', lr).hidden = !!anyR;
      $$('button', az).forEach(b => { const s = $(`.wx-sec[data-l="${b.dataset.l}"]`, lw); b.disabled = !s || s.hidden; });
    };
    const clearQ = () => { if (input.value) { input.value = ''; filter(); lw.scrollTop = 0; } };
    input.addEventListener('input', filter);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { const r = $((tab === 'words' ? '.wx-words' : '.wx-roots') + ' .wx-row:not([hidden])', wrap); if (r) r.click(); }
    });
    const setTab = t => {
      tab = t;
      $$('.wx-tabs button', wrap).forEach(b => { const on = b.dataset.tab === t; b.setAttribute('aria-selected', on); b.classList.toggle('on', on); });
      lw.hidden = t !== 'words'; lr.hidden = t !== 'roots'; az.hidden = t !== 'words';
      wrap.dataset.tab = t;
      input.placeholder = t === 'words' ? 'Find a word' : 'Find a root';
    };
    $$('.wx-tabs button', wrap).forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
    az.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      const h = $(`#wx-${b.dataset.l}`, wrap);
      lw.scrollTo({ top: h.parentElement.offsetTop - lw.offsetTop, behavior: 'instant' });
    });
    // sliding along the letter rail scrubs too (phones)
    az.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse' || !e.buttons && e.pressure === 0) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && el.parentElement === az && !el.disabled) { const h = $(`#wx-${el.dataset.l}`, wrap); lw.scrollTo({ top: h.parentElement.offsetTop - lw.offsetTop, behavior: 'instant' }); }
    });
    lw.addEventListener('click', e => {
      const r = e.target.closest('.wx-row'); if (!r) return;
      const en = D.index[+r.dataset.n]; closeIndex(); clearQ(); go(en.r, en.w);
    });
    lr.addEventListener('click', e => {
      const r = e.target.closest('.wx-row'); if (!r) return;
      closeIndex(); clearQ(); go(+r.dataset.i);
    });
    $('.wx-close', wrap).addEventListener('click', () => closeIndex());
    $('.wx-back', wrap).addEventListener('click', () => closeIndex());
    wrap.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); closeIndex(); }
      if (e.key === 'Tab') { // keep focus inside
        const f = $$('input, button:not([disabled]):not([hidden])', wrap).filter(x => x.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    IX = { wrap, input, setTab, lw, lr, filter, rrows };
  }
  let lastFocus = null;
  function openIndex(t) {
    if (!IX) buildIndex();
    lastFocus = document.activeElement;
    IX.setTab(t);
    IX.wrap.classList.add('open');
    scr.classList.add('has-wx');
    $$('.wx-row.cur', IX.wrap).forEach(r => r.classList.remove('cur'));
    const cur = IX.rrows[S.idx]; if (cur) cur.classList.add('cur');
    requestAnimationFrame(() => {
      if (t === 'roots' && cur && !IX.input.value) IX.lr.scrollTop = cur.offsetTop - IX.lr.offsetTop - IX.lr.clientHeight * .35;
      if (FINE.matches) IX.input.focus({ preventScroll: true }); else $('.wx-close', IX.wrap).focus({ preventScroll: true });
    });
  }
  function closeIndex() {
    if (!IX || !IX.wrap.classList.contains('open')) return;
    IX.wrap.classList.remove('open'); scr.classList.remove('has-wx');
    (lastFocus && lastFocus.isConnected ? lastFocus : stage).focus({ preventScroll: true });
  }

  /* size */
  const onResize = () => {
    S.W = stage.clientWidth;
    S.pages.forEach((pg, i) => seatCard(pg, D.roots[i].words.length));
    measureScrub();
    place();
    if (S.active >= 0) { const i = S.active; clearTree(); S.active = -1; activate(i, true); }
  };
  let rzT = 0;
  addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(onResize, 120); }, sig);

  measureScrub();
  place();
  activate(startIdx);
  fontsReady.then(() => { measureScrub(); place(); });
  stage.focus({ preventScroll: true });

  return {
    get idx() { return S.idx; }, get alive() { return S.alive; },
    go, openIndex, closeIndex,
    destroy() { S.alive = false; ac.abort(); cancelAnimationFrame(S.raf); clearTimeout(S.wheelTimer); document.documentElement.classList.remove('is-words'); },
  };
}

/* ---------- router ---------- */
function route() {
  let h = location.hash || '#/';
  const legacy = h.match(/^#\/l\/([\w-]+)/); // v2 links
  if (legacy) { history.replaceState(null, '', `#/w/w1/${legacy[1]}`); h = location.hash; }
  menuResize = null;
  const wm = h.match(/^#\/words(?:\/([\w-]+)(?:\/([\w-]+))?)?\/?(?:\?(.*))?$/);
  if (wm) {
    const qs = new URLSearchParams(wm[3] || '');
    return renderWords({ wid: wm[1], rid: wm[2], word: qs.get('w') });
  }
  if (WM) { WM.destroy(); WM = null; }
  if (h === '#/' || h === '#' || h === '') return renderMenu();
  if (h.startsWith('#/worlds')) return renderWorlds();
  const m = h.match(/^#\/w\/([\w-]+)(?:\/([\w-]+))?/);
  const wi = m ? WORLDS.findIndex(w => w.id === m[1]) : -1;
  if (wi < 0 || !worldOpen(wi)) { history.replaceState(null, '', m ? '#/worlds' : '#/'); return m ? renderWorlds() : renderMenu(); }
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
    if (WM) return;
    fitTitles(app);
    const m = location.hash.match(/^#\/w\/([\w-]+)/), w = m && WORLDS.find(x => x.id === m[1]);
    if ($('.map', app) && w) layoutMap(w);
    if ($('.journey', app)) layoutJourney();
    if ($('.tree', app)) drawTree(false);
    if (menuResize) menuResize();
  }, 120);
});
addEventListener('hashchange', route);
(async function boot() {
  const res = await fetch(document.documentElement.dataset.data);
  WORLDS = (await res.json()).worlds.sort((a, b) => a.order - b.order);
  load();
  route();
  if (document.fonts) document.fonts.ready.then(() => { if (WM) return; fitTitles(app); if ($('.tree', app)) drawTree(false); });
})();
