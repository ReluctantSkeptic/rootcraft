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
      words.forEach(c => index.push({ w: c.w, html: c.html, d: c.d || '', r: R.i, root: lv.root, key: `${c.w} ${lv.forms.join(' ')} ${c.d || ''}`.toLowerCase() }));
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
        const M = 14, n = words.length, cx = A.cx, top = A.y1 + 6;
        const Ls = words.map((c, k) => k).filter(k => words[k].dir < 0), Rs = words.map((c, k) => k).filter(k => words[k].dir > 0), slots = [];
        while (Ls.length || Rs.length) slots.push(slots.length % 2 === 0 ? (Ls.length ? Ls.shift() : Rs.shift()) : (Rs.length ? Rs.shift() : Ls.shift()));
        let gap = clamp((H - top - 40) / n, 52, 96);
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
          const st = hasHL ? (words[k].hl ? .12 + tdur * g0 * .6 : .12 + tdur * g0 + .25) : .12 + tdur * g0 + .02;
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
            const sx = cx + side * (cw / 2 - (mini ? 2 : 6)), sy = cy + Math.sin(a) * ch * (mini ? .18 : .22), dx = tx - sx;
            const s = sample([sx, sy], [sx + dx * .38, sy + (ty - sy) * .12], [tx - dx * .42, ty], [tx, ty], (mini ? 2.5 : 6) + rnd() * (mini ? 2 : 4));
            const leaves = (mini ? [.5] : [.34, .68]).map((g, q) => { const p = at(s, g); return { g, x: p[0], y: p[1], ang: p[2] + (q ? -1 : 1) * side * .9, s: (mini ? 8 : 12) + rnd() * 5 }; });
            const b = { s, w0: mini ? 4.2 : 7, w1: mini ? .9 : 1.3, side, tip: [tx, ty], el, hl: words[k].hl, leaves, a };
            B.push(b); rank.push(b);
          });
        });
        rank.sort((p, q) => Math.abs(p.a) - Math.abs(q.a) || p.side - q.side);
        let r = 0;
        rank.forEach(b => { b.dur = mini ? .9 : .78; b.start = b.hl ? .1 : (hasHL ? .55 : .14) + (r++) * (mini ? .13 : .1); });
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
        if (Math.abs(g - b.last) < .0005) continue; b.last = g;
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
    <div class="wm-scrub" role="slider" tabindex="0" aria-label="Root" aria-valuemin="1" aria-valuemax="${N}">
      <div class="ws-track">${WORLDS.map((w, i) => `<div class="ws-seg" style="--c:${w.theme.accent};--n:${w.levels.length}"><i class="ws-bar"><i class="ws-fill"></i></i><span class="ws-name">${esc(w.name)}</span></div>`).join('')}
        <i class="ws-thumb"><b class="ws-tip"></b></i></div>
    </div>
  </div>`;
  WM = wordsMode(D, start, hl);
}

function wordsMode(D, startIdx, startHL) {
  const scr = $('.words-screen', app), stage = $('.wm-stage', scr), scrub = $('.wm-scrub', scr), thumb = $('.ws-thumb', scr), tip = $('.ws-tip', scr);
  const segs = $$('.ws-seg', scr), fills = $$('.ws-fill', scr), wname = $('.wn', scr), wcount = $('.wc', scr);
  const N = D.roots.length, ac = new AbortController(), sig = { signal: ac.signal };
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
    fitTitles(pg); bindTilt(pg);
    fontsReady.then(() => fitTitles(pg));
    S.pages.set(i, pg);
    return pg;
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
    const canScrollY = pg && pg.scrollHeight > pg.clientHeight + 2;
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
      S.target = clamp(Math.abs(off) > .12 ? a + Math.sign(off) : a, 0, N - 1);
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
    const rkeys = D.roots.map(r => `${r.lv.forms.join(' ')} ${r.lv.meaning} ${r.w.name}`.toLowerCase());
    let tab = 'words';
    const filter = () => {
      const q = input.value.trim().toLowerCase();
      let any = 0;
      wrows.forEach(r => { const on = !q || D.index[+r.dataset.n].key.includes(q); r.hidden = !on; if (on) any++; });
      wsecs.forEach(s => { s.hidden = !$('.wx-row:not([hidden])', s); });
      $('.wx-none', lw).hidden = !!any;
      let anyR = 0;
      rrows.forEach(r => { const on = !q || rkeys[+r.dataset.i].includes(q); r.hidden = !on; if (on) anyR++; });
      rsecs.forEach(s => { s.hidden = !$('.wx-row:not([hidden])', s); });
      $('.wx-none', lr).hidden = !!anyR;
      $$('button', az).forEach(b => { const s = $(`.wx-sec[data-l="${b.dataset.l}"]`, lw); b.disabled = !s || s.hidden; });
    };
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
      const en = D.index[+r.dataset.n]; closeIndex(); go(en.r, en.w);
    });
    lr.addEventListener('click', e => {
      const r = e.target.closest('.wx-row'); if (!r) return;
      closeIndex(); go(+r.dataset.i);
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
