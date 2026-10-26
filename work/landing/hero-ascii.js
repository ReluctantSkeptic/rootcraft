/* ---------------- hero: ambient ASCII trees ---------------- */
// A few procedural trees made of monospace glyphs, rooted at the hero's bottom corners. Trunks grow char by char,
// branches fork, leaves fade in at the tips; then they sway (sine offset growing with height) and sprout now and then.
// One 2D canvas, glyph atlas + drawImage, DPR capped, ~30fps, paused offscreen / hidden tab. Barely-there ink.
function heroAscii() {
  const hero = $('.hero'), cv = $('.hero-ascii');
  if (!hero || !cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  const MONO = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
  const INK = 'rgb(241,237,228)', GOLD = 'rgb(233,185,73)';
  const LEAF = '&%@*o';
  const LETTERS = 'portspectgraphaudvisdictscope';
  const GLYPHS = '|/\\_-()`\',.;:~' + LEAF + LETTERS;
  let W = 0, H = 0, dpr = 1, fs = 13, cw = 8, ch = 15, gw = 0, gh = 0;
  let atlas = null, amap = new Map();
  let cells = [], occ = new Map(), tips = [], trees = [], groups = [], avoid = [];
  let rnd = Math.random, clock0 = 0, raf = 0, last = 0, visible = true, built = false, nextSprout = 0, growEnd = 0;

  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const now = () => (performance.now() - clock0) / 1000;

  function makeAtlas() {
    gw = Math.ceil(cw * 1.6); gh = Math.ceil(ch * 1.3);
    const n = GLYPHS.length;
    atlas = document.createElement('canvas');
    atlas.width = Math.ceil(gw * dpr) * n; atlas.height = Math.ceil(gh * dpr) * 2;
    const a = atlas.getContext('2d');
    a.scale(dpr, dpr); a.font = `400 ${fs}px ${MONO}`; a.textAlign = 'center'; a.textBaseline = 'middle';
    const sw = Math.ceil(gw * dpr) / dpr, sh = Math.ceil(gh * dpr) / dpr;
    amap.clear();
    [...GLYPHS].forEach((g, i) => {
      a.fillStyle = INK; a.fillText(g, i * sw + gw / 2, gh / 2);
      a.fillStyle = GOLD; a.fillText(g, i * sw + gw / 2, sh + gh / 2);
      amap.set(g, i);
    });
  }

  // keep-out zones around everything in the hero you read (padded), branches stop at their edge
  function measureAvoid() {
    const hr = hero.getBoundingClientRect();
    avoid = $$('.hero .w, .hero .gloss, .hero .lede, .hero .btn-gold, .nav').map(el => {
      const r = el.getBoundingClientRect();
      if (el.classList.contains('w')) { // the forge grows sideways with prefixes: reserve the widest word
        const cx = r.left + r.width / 2, half = Math.min(hr.width * .46, r.height * 2.6);
        return { l: cx - half - hr.left, r: cx + half - hr.left, t: r.top - hr.top, b: r.bottom - hr.top };
      }
      return { l: r.left - hr.left, r: r.right - hr.left, t: r.top - hr.top, b: r.bottom - hr.top };
    }).filter(r => r.r > r.l);
  }
  const PADX = () => cw * 2.5, PADY = () => ch * 1.2;
  function dist(x, y) { // distance (px) to the nearest keep-out rect, 0 inside
    let d = 1e9;
    for (const r of avoid) {
      const dx = Math.max(r.l - PADX() - x, 0, x - r.r - PADX()), dy = Math.max(r.t - PADY() - y, 0, y - r.b - PADY());
      d = Math.min(d, Math.hypot(dx, dy));
    }
    return d;
  }

  function glyphFor(ang) {
    const a = ang * 180 / Math.PI;
    if (Math.abs(a) < 13) return '|';
    if (Math.abs(a) > 68) return rnd() < .7 ? '_' : '-';
    return a > 0 ? '/' : '\\';
  }
  function put(tr, x, y, g, color, alpha, birth, depth, extra) {
    const col = Math.round(x / cw), row = Math.round(y / ch), key = col * 4096 + row;
    if (occ.has(key) || x < cw || x > W - cw || y < ch * 3 || y > H) return null;
    const d = dist(col * cw, row * ch);
    if (d <= 0) return null;
    const c = Object.assign({
      x: col * cw, y: row * ch, g, gold: color, a: alpha * Math.min(1, d / (cw * 7)), b: birth, f: .9,
      k: Math.pow(Math.max(0, Math.min(1, (tr.y0 - row * ch) / tr.h)), 1.6) * (1 + depth * .12),
      tr, ph: rnd() * 6.283, leaf: false, key, die: 0,
    }, extra);
    occ.set(key, c); cells.push(c);
    return c;
  }

  function leaves(tr, x, y, t, depth, n, group) {
    const rx = cw * (2.4 + rnd() * 1.6), ry = ch * (1.1 + rnd() * .6);
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.283, r = Math.sqrt(rnd());
      const g = rnd() < .14 ? LETTERS[(rnd() * LETTERS.length) | 0] : rnd() < .25 ? '.' : LEAF[(rnd() * LEAF.length) | 0];
      const c = put(tr, x + Math.cos(a) * rx * r, y - ch * .4 + Math.sin(a) * ry * r, g, rnd() < .55, tr.al * (g === '.' ? .8 : 1.15),
        t + .15 + rnd() * 1.4, depth + 1, { leaf: true, f: 1.4 });
      if (c && group) group.push(c);
    }
  }

  // one branch, stepped in continuous px and rasterised to the grid; forks recurse, the tip gets a leaf cluster
  function branch(tr, x, y, ang, len, depth, t, group) {
    const step = cw * 1.05, n = Math.max(2, Math.round(len / step));
    const width = depth === 0 ? tr.trunkW : depth === 1 && len > tr.h * .3 ? 2 : 1;
    let side = rnd() < .5 ? -1 : 1;
    for (let i = 0; i < n; i++) {
      if (dist(x, y) <= 0 || y < ch * 3 || x < cw || x > W - cw) break;
      const g = glyphFor(ang), al = tr.al * (1 - depth * .14);
      const w = i > n * .7 ? Math.max(1, width - 1) : width;
      for (let j = 0; j < w; j++) {
        const off = (j - (w - 1) / 2) * cw;
        const edge = w > 1 && (j === 0 || j === w - 1);
        const gg = w > 2 && !edge ? (rnd() < .5 ? ':' : '|') : edge && Math.abs(ang) < .23 ? (j === 0 ? (rnd() < .3 ? '(' : '|') : (rnd() < .3 ? ')' : '|')) : g;
        const c = put(tr, x + off * Math.cos(ang), y + off * Math.sin(ang), gg, false, al * (gg === ':' ? .7 : 1), t, depth);
        if (c && group) group.push(c);
      }
      if (depth < tr.maxD && i > n * (depth ? .25 : .35) && i < n - 2 && rnd() < tr.pB[depth]) {
        const ca = ang + side * (.5 + rnd() * .45);
        branch(tr, x, y, ca, len * (.42 + rnd() * .2) * (depth ? .9 : 1), depth + 1, t + .05, group);
        side = -side;
      }
      const target = depth === 0 ? tr.lean : Math.sign(ang || tr.lean) * (.55 + depth * .12);
      ang += (target - ang) * .07 + (rnd() - .5) * .16;
      x += Math.sin(ang) * step; y -= Math.cos(ang) * step * (ch / cw) * .62;
      t += depth === 0 ? .1 : .075;
    }
    tips.push({ tr, x, y, ang, depth });
    leaves(tr, x, y, t, depth, depth === 0 ? 10 : tr.leafN, group);
    growEnd = Math.max(growEnd, t + 2);
  }

  function layout() {
    const phone = W < 720, wide = W >= 1100;
    fs = phone ? 10 : wide ? 13 : 12;
    if (phone) return [
      { fx: .05, h: .34, lean: .1, d: .9, trunkW: 2, maxD: 2, pB: [.22, .2], leafN: 5, al: .075 },
      { fx: .95, h: .28, lean: -.1, d: 2.2, trunkW: 2, maxD: 2, pB: [.22, .2], leafN: 5, al: .07 },
    ];
    const t = [
      { fx: .085, h: .66, lean: .06, d: .9, trunkW: 3, maxD: 3, pB: [.17, .2, .2], leafN: 7, al: .07 },
      { fx: .915, h: .56, lean: -.06, d: 2.1, trunkW: 3, maxD: 3, pB: [.17, .2, .2], leafN: 7, al: .065 },
    ];
    if (wide) t.push({ fx: .245, h: .3, lean: -.12, d: 3.6, trunkW: 2, maxD: 2, pB: [.2, .2], leafN: 6, al: .055 });
    return t;
  }

  function build(grown) {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    rnd = rng(7 + Math.round(W / 50));
    const specs = layout();
    cw = fs * .6; ch = fs * 1.18;
    makeAtlas(); measureAvoid();
    cells = []; occ.clear(); tips = []; groups = []; growEnd = 0;
    const shift = grown ? -100 : 0;
    trees = specs.map((s, i) => {
      const tr = { ...s, x0: s.fx * W, y0: H - ch * .5, h: s.h * H, ph: rnd() * 6.283, sp: .5 + rnd() * .12 };
      tr.h = Math.min(tr.h, H - ch * 6);
      const t0 = s.d + shift;
      // roots: a little flare and ground line at the base
      for (let k = 1; k <= 3; k++) {
        put(tr, tr.x0 - cw * (tr.trunkW / 2 + k - .5), tr.y0 - (k === 1 ? ch * .0 : 0), k === 1 ? '/' : '_', false, tr.al * (1 - k * .18), t0 + k * .12, 0);
        put(tr, tr.x0 + cw * (tr.trunkW / 2 + k - .5), tr.y0, k === 1 ? '\\' : '_', false, tr.al * (1 - k * .18), t0 + k * .12, 0);
      }
      branch(tr, tr.x0, tr.y0 - ch, tr.lean * .5, tr.h * .62, 0, t0, null);
      return tr;
    });
    nextSprout = Math.max(now(), growEnd + shift) + 2;
    built = true;
  }

  // after growing: now and then a tip sends out a little twig with a few leaves; the oldest twig fades once there are many
  function sprout(T) {
    if (!tips.length) return;
    const tip = tips[(rnd() * tips.length) | 0], tr = tip.tr, group = [];
    const save = tips.length;
    branch(tr, tip.x, tip.y, tip.ang + (rnd() - .5) * .9, cw * (2 + rnd() * 3), Math.min(tip.depth + 1, 3), T, group);
    tips.length = save; // twigs do not become sprouting points themselves
    if (group.length) groups.push(group);
    if (groups.length > 14) for (const c of groups.shift()) c.die = T;
  }

  function draw(T) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const sw = Math.ceil(gw * dpr), sh = Math.ceil(gh * dpr);
    const amp = W < 720 ? 4 : 7;
    for (const tr of trees) {
      tr.w1 = RM ? 0 : Math.sin(T * tr.sp + tr.ph);
      tr.w2 = RM ? 0 : Math.sin(T * tr.sp * 2.3 + tr.ph * 1.7);
    }
    let alive = 0;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      let p = (T - c.b) / c.f;
      if (p <= 0) { alive++; continue; }
      p = p >= 1 ? 1 : p * p * (3 - 2 * p);
      let al = c.a * p;
      if (c.die) { const q = 1 - (T - c.die) / 2.5; if (q <= 0) { occ.delete(c.key); cells[i] = cells[cells.length - 1]; cells.pop(); i--; continue; } al *= q; }
      if (c.leaf && !RM) al *= .8 + .2 * Math.sin(T * .7 + c.ph);
      if (al < .004) continue;
      alive++;
      const tr = c.tr, dx = c.k * amp * (tr.w1 * .78 + tr.w2 * .22 * Math.sin(c.y * .01 + T * .3));
      ctx.globalAlpha = al;
      ctx.drawImage(atlas, amap.get(c.g) * sw, c.gold ? sh : 0, sw, sh, c.x + dx - gw / 2, c.y - gh / 2, gw, gh);
    }
    ctx.globalAlpha = 1;
  }

  function frame(ts) {
    raf = 0;
    if (!visible || document.hidden) return;
    raf = requestAnimationFrame(frame);
    if (ts - last < 32) return; // ~30fps is plenty for something this slow
    last = ts;
    const T = now();
    if (T > nextSprout) { sprout(T); nextSprout = T + 3 + rnd() * 4; }
    draw(T);
  }
  const start = () => { if (!raf && !RM && visible && !document.hidden) raf = requestAnimationFrame(frame); };

  const init = () => {
    clock0 = performance.now();
    build(RM);
    cv.classList.add('on');
    if (RM) { draw(1e4); return; }
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : (cancelAnimationFrame(raf), raf = 0); }).observe(hero);
    document.addEventListener('visibilitychange', start);
    let rt = 0, lastW = W;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        const w = hero.getBoundingClientRect().width;
        if (Math.abs(w - lastW) < 2 && Math.abs(hero.getBoundingClientRect().height - H) < 120) return; // ignore phone URL-bar jiggle
        lastW = w; build(true); RM ? draw(1e4) : draw(now());
      }, 220);
    });
    start();
  };
  // stay out of the way of first paint and the hero's own intro: begin once the page has loaded and gone idle
  const go = () => (window.requestIdleCallback ? requestIdleCallback(init, { timeout: 1200 }) : setTimeout(init, 300));
  document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
}

