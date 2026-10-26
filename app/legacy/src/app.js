/* Rootcraft — word roots for kids. Vanilla JS, no build step beyond hashing. */
(() => {
'use strict';

// ---------- tiny helpers ----------
const $ = (s, r = document) => r.querySelector(s);
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(9)) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(k));
  return el;
}
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const CHECK = () => { const s = document.createElement('span'); s.className = 'ck'; s.setAttribute('aria-hidden', 'true'); s.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; return s; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- progress ----------
const KEY = 'rootcraft.v1';
const store = Object.assign({ build: {}, cards: {}, grow: {}, dig: { right: 0, total: 0 }, mystery: { right: 0, total: 0 }, sort: { rounds: 0, perfect: 0 }, minted: [] },
  (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })());
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} };

// ---------- data ----------
let D, MO, WORDS, BY_WORD, FAM, BUILD_BASES;
const typeOf = id => MO[id].type;
const kindClass = id => ({ prefix: 'pre', base: 'base', suffix: 'suf' })[typeOf(id)];
const sumText = w => w.parts.map(p => p[0]).join(' + ');
const gloss = id => MO[id].meaning.split(';')[0];

function tile(surface, id, extra = {}) {
  return h('button', Object.assign({ class: `tile ${kindClass(id)} ${extra.class || ''}`, type: 'button' }, extra.attrs || {}),
    h('span', { class: 'tile-word' }, surface), extra.sub ? h('span', { class: 'tile-sub' }, extra.sub) : null);
}

// ---------- shell ----------
const app = $('#app');
const live = $('#live');
let screenAbort = new AbortController();
const say = msg => { live.textContent = ''; requestAnimationFrame(() => live.textContent = msg); };

function frame(title, body, opts = {}) {
  const head = h('header', { class: 'bar' },
    h('a', { class: 'back', href: opts.back || '#/', 'aria-label': 'Back',
      html: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' }),
    opts.right || null);
  return h('div', { class: `screen ${opts.cls || ''}` }, head,
    title ? h('h1', { class: 'title' }, title) : h('h1', { class: 'sr-only' }, opts.sr || 'Rootcraft'), body);
}

function mount(node) {
  screenAbort.abort(); screenAbort = new AbortController();
  app.replaceChildren(node);
  window.scrollTo(0, 0);
  const t = node.querySelector('h1'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
}

// ---------- drag (pointer events) ----------
function draggable(el, { onDrop, onTap, zone }) {
  let sx, sy, ghost = null, over = null, id = null;
  el.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    id = e.pointerId; sx = e.clientX; sy = e.clientY;
    el.setPointerCapture(id);
  });
  el.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!ghost && Math.hypot(dx, dy) > 7) {
      const r = el.getBoundingClientRect();
      ghost = el.cloneNode(true); ghost.classList.add('ghost');
      Object.assign(ghost.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      document.body.append(ghost); el.classList.add('lifted');
    }
    if (ghost) {
      ghost.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.max(-6, Math.min(6, dx / 30))}deg) scale(1.06)`;
      const t = document.elementFromPoint(e.clientX, e.clientY);
      const z = t && t.closest(zone);
      if (z !== over) { over && over.classList.remove('over'); over = z; over && over.classList.add('over'); }
      if (over && over.dataset.reflow) over.dispatchEvent(new CustomEvent('dragx', { detail: e.clientX }));
    }
  });
  const end = e => {
    if (e.pointerId !== id) return; id = null;
    if (ghost) {
      ghost.remove(); ghost = null; el.classList.remove('lifted');
      over && over.classList.remove('over');
      onDrop(over, e.clientX, e.clientY); over = null;
    } else if (e.type === 'pointerup') onTap();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } });
  el.addEventListener('click', e => e.preventDefault());
}

// ======================================================================
// HOME
// ======================================================================
function miniTiles(parts) {
  return h('div', { class: 'mini' }, parts.map(([t, k], i) => h('span', { class: `mt ${k}`, style: { '--i': i } }, t)));
}
function home() {
  const n = o => Object.keys(o).length;
  const growN = Object.values(store.grow).reduce((a, b) => a + b.length, 0);
  const items = [
    ['#/build', 'Build', 'Fill a word family', 'c1', [['re', 'pre'], ['port', 'base'], ['er', 'suf']], n(store.build)],
    ['#/cards', 'Cards', 'Snap parts into words', 'c2', [['tele', 'pre'], ['scope', 'base']], n(store.cards)],
    ['#/grow', 'Grow, Dig, Mint', 'Find, split, invent', 'c3', [['in', 'pre'], ['spect', 'base'], ['or', 'suf']], growN + store.dig.right + store.minted.length],
    ['#/sort', 'Sort', 'Catch the impostors', 'c4', [['ped', 'base'], ['?', 'pre']], store.sort.rounds],
  ];
  return h('div', { class: 'screen home' },
    h('h1', { class: 'brand' }, 'Rootcraft'),
    h('nav', { class: 'acts' }, items.map(([href, t, s, c, mini, count], i) =>
      h('a', { href, class: `act ${c}`, style: { '--i': i } },
        miniTiles(mini),
        h('span', { class: 'act-text' }, h('span', { class: 'act-title' }, t), h('span', { class: 'act-sub' }, s)),
        count ? h('span', { class: 'act-count', 'aria-label': `${count} done` }, count) : null))));
}

// ======================================================================
// 1. BUILD — matrix + word sums + mystery words
// ======================================================================
function buildIndex() {
  const grid = h('div', { class: 'root-grid' },
    h('a', { href: '#/build/mystery', class: 'root-card mystery' },
      h('span', { class: 'rc-root' }, '?'), h('span', { class: 'rc-mean' }, 'Never-seen words'),
      h('span', { class: 'rc-count' }, `${store.mystery.right}`)),
    BUILD_BASES.map((b, i) => {
      const fam = familySums(b), got = fam.filter(w => store.build[w.w]).length;
      return h('a', { href: `#/build/${b}`, class: `root-card ${got === fam.length ? 'done' : ''}`, style: { '--i': i } },
        h('span', { class: 'rc-root' }, MO[b].label), h('span', { class: 'rc-mean' }, MO[b].meaning),
        h('span', { class: 'rc-count' }, h('span', { class: 'meter-bar', style: { '--p': got / fam.length } }), `${got}/${fam.length}`));
    }));
  return frame('Pick a root', grid, { cls: 'build-index' });
}
const familySums = b => WORDS.filter(w => w.parts.some(p => p[1] === b));

function buildMatrix(b) {
  const fam = familySums(b);
  const pres = [], bases = [], sufs = [];
  const add = (arr, s, id) => { if (!arr.some(x => x[0] === s)) arr.push([s, id]); };
  fam.forEach(w => {
    const bi = w.parts.findIndex(p => p[1] === b);
    w.parts.forEach((p, i) => add(i < bi ? pres : i === bi ? bases : sufs, p[0], p[1]));
  });
  const surfaceSeq = w => w.parts.map(p => p[0]).join('|');
  let tray = [];
  const used = new Set();
  const refreshUsed = () => { used.clear(); fam.filter(w => store.build[w.w]).forEach(w => w.parts.forEach(p => used.add(p[0]))); };
  refreshUsed();

  const trayEl = h('div', { class: 'tray', 'aria-live': 'polite' });
  const countEl = h('span', { class: 'count tnum' });
  const foundEl = h('div', { class: 'found-grid' });
  const hintEl = h('p', { class: 'hint' });

  const col = (list, cls) => h('div', { class: `mcol ${cls}` }, list.map(([s, id]) => {
    const t = tile(s, id, { attrs: { 'data-s': s } });
    t.addEventListener('click', () => tap(s, id, cls));
    return t;
  }));
  const matrix = h('div', { class: `matrix ${pres.length ? '' : 'no-pre'} ${sufs.length ? '' : 'no-suf'}` },
    pres.length ? col(pres, 'pre') : null, col(bases, 'base'), sufs.length ? col(sufs, 'suf') : null);

  function paintMatrix() {
    matrix.querySelectorAll('.tile').forEach(t => t.classList.toggle('lit', used.has(t.dataset.s)));
  }
  function paintTray(state) {
    const word = tray.map(x => x[0]).join('');
    trayEl.className = `tray ${state || ''}`;
    trayEl.replaceChildren(
      tray.length ? h('div', { class: 'sum' }, tray.map((x, i) => [i ? h('span', { class: 'plus' }, '+') : null, h('span', { class: `chip ${kindClass(x[1])}` }, x[0])]))
        : h('div', { class: 'sum empty' }, h('span', { class: 'chip ghosty' }, '\u00a0')),
      h('div', { class: 'arrow-word' }, tray.length ? [h('span', { class: 'eq' }, '→'), h('span', { class: 'big-word' }, word)] : null),
      tray.length ? h('button', { class: 'icon-btn clear', type: 'button', 'aria-label': 'Clear', onclick: () => { tray = []; paintTray(); } }, '×') : null);
  }
  function paintFound() {
    const got = fam.filter(w => store.build[w.w]);
    countEl.textContent = `${got.length}/${fam.length}`;
    foundEl.replaceChildren(...fam.map(w => store.build[w.w]
      ? h('div', { class: 'found', 'data-w': w.w }, h('span', { class: 'f-word' }, w.w), h('span', { class: 'f-sum' }, sumText(w)), h('span', { class: 'f-def' }, w.d))
      : h('div', { class: 'found empty', 'aria-label': `${w.w.length} letters` }, h('span', { class: 'f-dots' }, '·'.repeat(Math.min(w.w.length, 14))))));
  }
  function tap(s, id, cls) {
    if (cls === 'pre' && tray.some(x => typeOf(x[1]) !== 'prefix')) tray = [];
    if (cls === 'base' && tray.some(x => typeOf(x[1]) !== 'prefix')) tray = [];
    if (cls === 'suf' && !tray.some(x => typeOf(x[1]) === 'base')) { say('Start with a root'); trayEl.animate && !reduced() && trayEl.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], 260); return; }
    tray.push([s, id]);
    const seq = tray.map(x => x[0]).join('|');
    const match = fam.find(w => surfaceSeq(w) === seq);
    const alive = fam.some(w => surfaceSeq(w).startsWith(seq + '|') || surfaceSeq(w) === seq);
    if (match) {
      const fresh = !store.build[match.w];
      store.build[match.w] = 1; save(); refreshUsed(); paintMatrix(); paintFound();
      paintTray(fresh ? 'win' : 'known');
      say(fresh ? `${match.w}! ${match.d}` : `${match.w}, found already`);
      hintEl.textContent = '';
      if (fresh) { const f = foundEl.querySelector(`[data-w="${match.w}"]`); f && f.classList.add('pop'); }
      if (fam.every(w => store.build[w.w])) say('Every word found');
    } else if (!alive) {
      paintTray('nope'); say('Not a word here');
      const snap = tray.length;
      setTimeout(() => { if (tray.length === snap) { tray = []; paintTray(); } }, 900);
    } else paintTray();
  }
  const hintBtn = h('button', { class: 'pill', type: 'button', onclick: () => {
    const left = fam.filter(w => !store.build[w.w]);
    hintEl.textContent = left.length ? `“${pick(left).d}”` : 'Every word found';
  } }, 'Hint');

  paintMatrix(); paintTray(); paintFound();
  const head = h('div', { class: 'root-head' }, h('span', { class: 'root-big' }, MO[b].label), h('span', { class: 'root-mean' }, `${MO[b].meaning} · ${MO[b].origin}`));
  return frame(null, h('div', { class: 'build' }, head, trayEl, matrix, h('div', { class: 'row-between' }, hintBtn, countEl), hintEl, foundEl),
    { back: '#/build', cls: 'build-screen', sr: `Build words with ${MO[b].label}` });
}

function mystery() {
  const pool = shuffle(D.challenges);
  let i = 0, done = false;
  const box = h('div', { class: 'mystery-box' });
  function show() {
    const c = pool[i % pool.length]; done = false;
    const opts = shuffle([c.right, ...c.wrong]);
    const optEl = h('div', { class: 'options' }, opts.map(o => h('button', { class: 'option', type: 'button', onclick: e => choose(e.currentTarget, o === c.right) }, o)));
    function choose(btn, ok) {
      if (done) return; done = true;
      store.mystery.total++; if (ok) store.mystery.right++; save();
      btn.classList.add(ok ? 'right' : 'wrong');
      if (!ok) [...optEl.children].find(b => b.textContent === c.right).classList.add('right');
      say(ok ? 'Yes!' : `It means ${c.right}`);
      next.hidden = false; next.focus();
    }
    const next = h('button', { class: 'cta', type: 'button', hidden: true, onclick: () => { i++; show(); } }, 'Next');
    box.replaceChildren(
      h('div', { class: 'big-word center' }, c.w),
      h('div', { class: 'parts-row' }, c.parts.map(([s, id]) => h('div', { class: `part ${kindClass(id)}` }, h('span', { class: 'p-s' }, s), h('span', { class: 'p-m' }, gloss(id))))),
      optEl, next);
  }
  show();
  return frame('What could it mean?', box, { back: '#/build', cls: 'mystery-screen' });
}

// ======================================================================
// 2. CARDS — drag parts into a word
// ======================================================================
function cards() {
  const multi = [...new Set(WORDS.flatMap(w => w.parts.filter(p => typeOf(p[1]) === 'base').map(p => p[1])))]
    .filter(b => familySums(b).filter(w => w.parts.length > 1).length >= 4);
  let hand = [], line = [], possible = [], foundHere = new Set(), busy = false;
  const lineEl = h('div', { class: 'line', 'data-reflow': '1', 'aria-label': 'Word line' });
  const handEl = h('div', { class: 'hand', 'aria-label': 'Your cards' });
  const meta = h('div', { class: 'row-between' });
  const result = h('div', { class: 'card-result', 'aria-live': 'polite' });
  let insertAt = -1;

  function deal() {
    const bases = shuffle(multi).slice(0, 2);
    const cand = WORDS.filter(w => w.parts.length > 1 && w.parts.some(p => bases.includes(p[1])));
    const freq = (t) => { const m = new Map(); cand.forEach(w => w.parts.forEach(p => { if (typeOf(p[1]) === t) m.set(p[0], [p[1], (m.get(p[0])?.[1] || 0) + 1]); })); return [...m.entries()].sort((a, b) => b[1][1] - a[1][1]); };
    const pre = freq('prefix').slice(0, 4), suf = freq('suffix').slice(0, 3);
    const bs = freq('base').filter(([s, [id]]) => bases.includes(id)).slice(0, 3);
    hand = shuffle([...pre, ...bs, ...suf].map(([s, [id]], k) => ({ s, id, k: `${s}-${k}` })));
    const have = new Set(hand.map(c => c.s));
    possible = WORDS.filter(w => w.parts.length > 1 && w.parts.every(p => have.has(p[0])) && new Set(w.parts.map(p => p[0])).size === w.parts.length);
    if (possible.length < 4) return deal();
    hand.forEach(c => { const ids = [...new Set(possible.flatMap(w => w.parts.filter(p => p[0] === c.s).map(p => p[1])))]; c.gl = [...new Set((ids.length ? ids : [c.id]).map(gloss))].join(' / '); });
    line = []; foundHere = new Set(); result.replaceChildren(); paint();
  }
  function paint() {
    const order = { prefix: 0, base: 1, suffix: 2 };
    const inHand = hand.filter(c => !line.includes(c)).sort((a, b) => order[typeOf(a.id)] - order[typeOf(b.id)]);
    handEl.replaceChildren(...inHand.map(c => card(c, 'hand')));
    lineEl.replaceChildren(...(line.length ? line.map(c => card(c, 'line')) : [h('span', { class: 'line-empty' }, 'Drop cards here')]));
    meta.replaceChildren(h('button', { class: 'pill', type: 'button', onclick: deal }, 'New hand'),
      h('span', { class: 'count tnum' }, `${foundHere.size}/${possible.length}`));
  }
  function card(c, where) {
    const el = h('div', { class: `pcard ${kindClass(c.id)}`, role: 'button', tabindex: '0', 'aria-label': `${c.s}, ${c.gl}` },
      h('span', { class: 'pc-s' }, c.s), h('span', { class: 'pc-m' }, c.gl));
    draggable(el, {
      zone: '.line, .hand',
      onTap: () => { if (busy) return; where === 'hand' ? line.push(c) : line.splice(line.indexOf(c), 1); paint(); check(); },
      onDrop: (z, x) => {
        if (busy || !z) return;
        const from = line.indexOf(c);
        if (z === lineEl) {
          let idx = slotFor(x);
          if (from >= 0) { line.splice(from, 1); if (idx > from) idx--; }
          line.splice(idx, 0, c);
        } else if (z === handEl && from >= 0) line.splice(from, 1);
        paint(); check();
      }
    });
    return el;
  }
  function slotFor(x) {
    const kids = [...lineEl.querySelectorAll('.pcard')];
    let i = kids.findIndex(k => { const r = k.getBoundingClientRect(); return x < r.left + r.width / 2; });
    return i < 0 ? kids.length : i;
  }
  async function check() {
    if (!line.length) return;
    const seq = line.map(c => c.s).join('|');
    const w = WORDS.find(w => w.parts.map(p => p[0]).join('|') === seq);
    if (!w) {
      const word = line.map(c => c.s).join('');
      result.replaceChildren(line.length > 1 ? h('span', { class: 'soft' }, word) : '');
      return;
    }
    busy = true;
    const fresh = !foundHere.has(w.w);
    foundHere.add(w.w); store.cards[w.w] = 1; save();
    lineEl.classList.add('win');
    result.replaceChildren(h('span', { class: 'big-word' }, w.w), h('span', { class: 'f-def' }, w.d));
    say(`${w.w}. ${w.d}`);
    meta.querySelector('.count').textContent = `${foundHere.size}/${possible.length}`;
    await sleep(fresh ? 1500 : 900);
    lineEl.classList.remove('win'); line = []; busy = false; paint();
    if (foundHere.size === possible.length) result.replaceChildren(h('span', { class: 'soft' }, 'All found'), h('button', { class: 'cta', type: 'button', onclick: deal }, 'New hand'));
  }
  deal();
  return frame(null, h('div', { class: 'cards' }, lineEl, result, handEl, meta), { cls: 'cards-screen', sr: 'Cards' });
}

// ======================================================================
// 3. GROW / DIG / MINT
// ======================================================================
function labTabs(active) {
  return h('div', { class: 'seg', role: 'tablist' }, [['grow', 'Grow'], ['dig', 'Dig'], ['mint', 'Mint']].map(([k, t]) =>
    h('a', { href: `#/${k}`, role: 'tab', class: active === k ? 'on' : '', 'aria-selected': active === k ? 'true' : 'false' }, t)));
}
const GROW_BASES = () => Object.keys(D.families).filter(b => D.families[b].length >= 4);

function grow(b) {
  b = b && D.families[b] ? b : (sessionStorage.getItem('growBase') || 'port');
  sessionStorage.setItem('growBase', b);
  const fam = D.families[b];
  const got = new Set(store.grow[b] || []);
  const picker = h('div', { class: 'scroller' }, GROW_BASES().map(x =>
    h('a', { href: `#/grow/${x}`, class: `chip-link ${x === b ? 'on' : ''}` }, MO[x].label.split('/')[0])));
  const slots = h('div', { class: 'slots' });
  const msg = h('p', { class: 'hint', 'aria-live': 'polite' });
  const count = h('span', { class: 'count tnum' });
  const revealed = {};
  function paint(newW) {
    count.textContent = `${got.size}/${fam.length}`;
    slots.replaceChildren(...fam.map(w => got.has(w)
      ? h('span', { class: `slot got ${w === newW ? 'pop' : ''}` }, w)
      : h('span', { class: 'slot' }, (revealed[w] ? w.slice(0, revealed[w]) : '') + '·'.repeat(Math.max(0, w.length - (revealed[w] || 0))))));
  }
  const input = h('input', { class: 'word-input', type: 'text', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', enterkeyhint: 'go', 'aria-label': `Type a word with ${MO[b].label}`, placeholder: `a word with ${MO[b].forms[0]}…` });
  const form = h('form', { class: 'grow-form', onsubmit: e => {
    e.preventDefault();
    const v = input.value.trim().toLowerCase(); if (!v) return;
    input.value = '';
    if (fam.includes(v)) {
      if (got.has(v)) { msg.textContent = 'Found already'; return; }
      got.add(v); store.grow[b] = [...got]; save();
      const ws = BY_WORD[v];
      msg.textContent = ws ? `${sumText(ws)} → ${ws.d}` : 'Yes!';
      say(`${v}. ${msg.textContent}`);
      paint(v);
    } else {
      const other = Object.keys(D.families).find(k => k !== b && D.families[k].includes(v));
      msg.textContent = other ? `That one grows from ${MO[other].label}` : 'Not one I know in this family';
    }
  } }, input, h('button', { class: 'cta small', type: 'submit' }, 'Add'));
  const hint = h('button', { class: 'pill', type: 'button', onclick: () => {
    const left = fam.filter(w => !got.has(w)); if (!left.length) return;
    const w = left.sort((a, c) => (revealed[a] || 0) - (revealed[c] || 0) || a.length - c.length)[0];
    revealed[w] = Math.min((revealed[w] || 0) + 1, w.length - 1); paint(); input.focus();
  } }, 'Hint');
  paint();
  return frame(null, h('div', { class: 'lab' }, labTabs('grow'), picker,
    h('div', { class: 'root-head' }, h('span', { class: 'root-big' }, MO[b].label), h('span', { class: 'root-mean' }, MO[b].meaning)),
    form, msg, h('div', { class: 'row-between' }, hint, count), slots), { cls: 'lab-screen', sr: 'Grow' });
}

function dig() {
  const pool = shuffle(WORDS.filter(w => w.parts.length >= 2 && w.w.length <= 13 && w.parts.every(([s, id]) => typeOf(id) !== 'prefix' || s === MO[id].forms[0])));
  let i = 0;
  const box = h('div', { class: 'dig' });
  const score = h('span', { class: 'count tnum badge' });
  const setScore = () => { score.replaceChildren(CHECK(), String(store.dig.right)); score.hidden = !store.dig.right; };
  function show() {
    const w = pool[i++ % pool.length];
    const truth = new Set(); let acc = 0; w.parts.slice(0, -1).forEach(p => { acc += p[0].length; truth.add(acc); });
    const cuts = new Set(); let checked = false;
    setScore();
    const wordEl = h('div', { class: 'dig-word', role: 'group', 'aria-label': `Cut ${w.w} into parts` });
    [...w.w].forEach((ch, k) => {
      wordEl.append(h('span', { class: 'dl' }, ch));
      if (k < w.w.length - 1) {
        const gap = h('button', { class: 'gap', type: 'button', 'aria-label': `Cut after ${w.w.slice(0, k + 1)}`, 'aria-pressed': 'false', onclick: () => {
          if (checked) return;
          cuts.has(k + 1) ? cuts.delete(k + 1) : cuts.add(k + 1);
          gap.classList.toggle('cut'); gap.setAttribute('aria-pressed', cuts.has(k + 1));
        } }, h('span', { class: 'gap-line' }));
        wordEl.append(gap);
      }
    });
    const out = h('div', { class: 'dig-out', 'aria-live': 'polite' });
    const btn = h('button', { class: 'cta', type: 'button', onclick: () => {
      if (checked) { show(); return; }
      checked = true;
      const ok = cuts.size === truth.size && [...cuts].every(c => truth.has(c));
      store.dig.total++; if (ok) store.dig.right++; save(); setScore();
      wordEl.querySelectorAll('.gap').forEach((g, k) => { const pos = k + 1; g.classList.toggle('cut', truth.has(pos)); g.classList.toggle('missed', truth.has(pos) && !cuts.has(pos)); g.classList.toggle('extra', !truth.has(pos) && cuts.has(pos)); });
      wordEl.classList.add(ok ? 'ok' : 'shown');
      out.replaceChildren(
        h('p', { class: `verdict ${ok ? 'yes' : ''}` }, ok ? 'Clean cuts' : 'Here are the joints'),
        h('div', { class: 'parts-row' }, w.parts.map(([s, id]) => h('div', { class: `part ${kindClass(id)}` }, h('span', { class: 'p-s' }, s), h('span', { class: 'p-m' }, gloss(id))))),
        h('p', { class: 'f-def center' }, w.d));
      say(`${ok ? 'Correct.' : ''} ${sumText(w)}. ${w.d}`);
      btn.textContent = 'Next';
    } }, 'Check');
    box.replaceChildren(h('p', { class: 'hint center' }, 'Tap between letters to cut'), wordEl, out, btn);
  }
  show();
  return frame(null, h('div', { class: 'lab' }, labTabs('dig'), box), { cls: 'lab-screen', right: score, sr: 'Dig' });
}

// --- Mint: build a literal meaning from parts ---
const strip = s => s.replace(/^(a|an|the) /, '');
function mintMeaning(st, mid, en) {
  const S = st && MO[st], Mi = MO[mid], E = en && MO[en];
  const neg = S && S.type === 'prefix' && S.mint.neg;
  const pre = S && S.type === 'prefix' && !neg ? S.mint : null;
  const sNoun = S && S.type === 'base' ? S.mint.noun : null;
  const kind = E ? (E.type === 'suffix' ? E.mint.kind : 'end:' + E.id) : 'none';
  if (Mi.mint.verb) {
    const v = Mi.mint.verb;
    const obj = sNoun ? sNoun.pl : null;
    let tail = [obj, pre && pre.adv].filter(Boolean).join(' ');
    const P = f => [v[f], tail].filter(Boolean).join(' ').replace(/ at$/, ' at things');
    const no = neg ? 'not ' : '';
    switch (kind) {
      case 'agent': return `someone or something that ${neg ? 'never ' : ''}${P('s')}`;
      case 'act': return `the act of ${no}${P('ing')}`;
      case 'able': return obj ? `${neg ? 'not ' : ''}able to ${P('base')}` : `${neg ? 'cannot' : 'can'} be ${[v.pp, pre && pre.adv].filter(Boolean).join(' ')}`;
      case 'tend': return `${neg ? 'never' : 'always'} ${P('ing')}`;
      case 'rel': return `having to do with ${no}${P('ing')}`;
      case 'expert': return `an expert at ${no}${P('ing')}`;
      case 'place': return `a place for ${no}${P('ing')}`;
      case 'full': return `full of ${no}${P('ing')}`;
      case 'less': return `without any ${P('ing')}`;
      case 'study': return `the study of ${no}${P('ing')}`;
      case 'end:scope': return `a tool for spotting things that ${neg ? "don't " : ''}${P('base')}`;
      case 'end:graph': return `a picture of something ${no}${P('ing')}`;
      case 'end:meter': return `a tool that measures ${no}${P('ing')}`;
      case 'end:phon': return `the sound of ${no}${P('ing')}`;
      case 'end:naut': return `a sailor who ${neg ? 'never ' : ''}${P('s')}`;
      case 'end:logy': return `the study of ${no}${P('ing')}`;
      default: return `to ${no}${P('base')}`;
    }
  }
  const n = Mi.mint.noun;
  const NP = neg ? `anything but ${n.pl}` : [pre && pre.adj, sNoun && strip(sNoun.sg), n.pl].filter(Boolean).join(' ');
  switch (kind) {
    case 'agent': return `someone who works with ${NP}`;
    case 'act': return `everything about ${NP}`;
    case 'able': return `able to turn into ${NP}`;
    case 'tend': return `acting like ${NP}`;
    case 'rel': return `having to do with ${NP}`;
    case 'expert': return `an expert in ${NP}`;
    case 'place': return `a place for ${NP}`;
    case 'full': return `full of ${NP}`;
    case 'less': return `without ${NP}`;
    case 'study': case 'end:logy': return `the study of ${NP}`;
    case 'end:scope': return `a tool for looking at ${NP}`;
    case 'end:graph': return `a picture of ${NP}`;
    case 'end:meter': return `a tool that measures ${NP}`;
    case 'end:phon': return `the sound of ${NP}`;
    case 'end:naut': return `a sailor who travels through ${NP}`;
    default: return neg ? `not ${n.sg}` : (pre || sNoun) ? NP : n.sg;
  }
}
const VOW = /[aeiouy]/;
function mintWord(st, mid, en) {
  const f = id => { const m = MO[id]; return m.type === 'base' ? m.mint.form : m.forms[0]; };
  let w = st ? f(st) : '';
  let m = f(mid);
  if (st && MO[st].type === 'prefix') {
    if ((w === 'in' || w === 'con') && /^[pbm]/.test(m)) w = w.slice(0, -1) + 'm';
  } else if (st && !VOW.test(w.slice(-1)) && !VOW.test(m[0])) w += 'o';
  w += m;
  if (en) {
    let e = MO[en].type === 'base' ? (en === 'phon' ? 'phone' : MO[en].forms[0]) : MO[en].forms[0];
    if (VOW.test(e[0]) && /[aeio]$/.test(w)) w = w.slice(0, -1);
    else if (!VOW.test(e[0]) && !VOW.test(w.slice(-1)) && (MO[en].type === 'base' || en === 'logy')) w += 'o';
    w += e;
  }
  return w;
}
function mint() {
  const starts = [...Object.values(MO).filter(m => m.type === 'prefix' && !['in_into', 'intro', 'retro', 'ob', 'ab', 'ad', 'para', 'sym', 'dia', 'centi'].includes(m.id)).map(m => m.id),
    ...Object.values(MO).filter(m => m.type === 'base' && m.mint.noun && m.id !== 'naut').map(m => m.id)];
  const mids = Object.values(MO).filter(m => m.type === 'base' && m.id !== 'naut').map(m => m.id);
  const ends = [...['er', 'ion', 'able', 'ive', 'ist', 'ic', 'ful', 'less', 'logy'], ...D.mintEndings.filter(e => e !== 'logy')];
  let sel = { st: 'aqua', mid: 'port', en: 'er' };
  const out = h('div', { class: 'mint-out', 'aria-live': 'polite' });
  const rail = (key, ids, optional) => h('div', { class: 'rail', role: 'radiogroup', 'aria-label': key },
    ids.map(id => {
      const shown = key === 'en' && id === 'phon' ? 'phone' : (MO[id].type === 'base' ? MO[id].forms[0] : MO[id].forms[0]);
      return h('button', { type: 'button', role: 'radio', class: `mchip ${kindClass(id)}`, 'data-id': id, 'data-k': key, 'aria-checked': 'false', onclick: () => {
        sel[key] = (optional && sel[key] === id) ? null : id; paint();
      } }, h('span', null, key === 'st' && MO[id].type === 'prefix' ? shown + '-' : key === 'en' && MO[id].type === 'suffix' ? '-' + shown : shown), h('small', null, gloss(id)));
    }));
  const rails = h('div', { class: 'rails' }, rail('st', starts, true), rail('mid', mids, false), rail('en', ends, true));
  function paint() {
    rails.querySelectorAll('.mchip').forEach(b => { const on = sel[b.dataset.k] === b.dataset.id; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    const word = mintWord(sel.st, sel.mid, sel.en);
    const parts = [sel.st, sel.mid, sel.en].filter(Boolean);
    out.replaceChildren(
      h('div', { class: 'big-word mint-word' }, word),
      h('div', { class: 'parts-row' }, parts.map(id => h('div', { class: `part ${kindClass(id)}` }, h('span', { class: 'p-s' }, id === 'phon' && id === sel.en ? 'phone' : MO[id].forms[0]), h('span', { class: 'p-m' }, gloss(id))))),
      h('p', { class: 'mint-mean' }, mintMeaning(sel.st, sel.mid, sel.en)));
  }
  const keepList = h('div', { class: 'kept' });
  function paintKept() {
    keepList.replaceChildren(...store.minted.slice().reverse().map(k => h('div', { class: 'kept-item' }, h('span', { class: 'f-word' }, k.w), h('span', { class: 'f-def' }, k.m))));
  }
  const actions = h('div', { class: 'row-between' },
    h('button', { class: 'pill', type: 'button', onclick: () => {
      sel = { st: Math.random() < .8 ? pick(starts) : null, mid: pick(mids), en: Math.random() < .85 ? pick(ends) : null };
      paint(); ['st', 'mid', 'en'].forEach(k => { const b = rails.querySelector(`[data-k="${k}"].on`); b && b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced() ? 'auto' : 'smooth' }); });
    } }, 'Surprise me'),
    h('button', { class: 'cta small', type: 'button', onclick: () => {
      const w = mintWord(sel.st, sel.mid, sel.en);
      if (!store.minted.some(k => k.w === w)) { store.minted.push({ w, m: mintMeaning(sel.st, sel.mid, sel.en) }); store.minted = store.minted.slice(-40); save(); paintKept(); say(`Kept ${w}`); }
    } }, 'Keep'));
  paint(); paintKept();
  return frame(null, h('div', { class: 'lab' }, labTabs('mint'), out, rails, actions, keepList), { cls: 'lab-screen mint-screen', sr: 'Mint' });
}

// ======================================================================
// 4. SORT — families + impostors
// ======================================================================
function sort() {
  const fams = Object.keys(D.families).filter(b => D.families[b].filter(w => MO[b].forms.some(f => w.includes(f))).length >= 3);
  const box = h('div', { class: 'sort' });
  function round() {
    const withTraps = shuffle(fams.filter(b => D.traps[b]));
    const chosen = [withTraps[0]];
    for (const b of shuffle(fams)) { if (chosen.length >= 3) break; if (!chosen.includes(b)) chosen.push(b); }
    const inAny = w => chosen.filter(b => D.families[b].includes(w)).length;
    const items = [];
    const visible = (w, b) => MO[b].forms.some(f => w.includes(f));
    chosen.forEach(b => shuffle(D.families[b].filter(w => inAny(w) === 1 && visible(w, b))).slice(0, 3).forEach(w => items.push({ w, home: b })));
    const trapPool = shuffle(chosen.flatMap(b => (D.traps[b] || []).map(t => ({ ...t, of: b }))).filter(t => !inAny(t.w)));
    trapPool.slice(0, Math.min(3, Math.max(2, trapPool.length))).forEach(t => items.push({ w: t.w, home: 'trap', why: t.why, of: t.of }));
    const state = new Map(); let picked = null;
    const pool = h('div', { class: 'pool', 'aria-label': 'Words to sort' });
    const bins = h('div', { class: 'bins' });
    const binEl = {};
    [...chosen, 'trap'].forEach(b => {
      const el = h('div', { class: `bin ${b === 'trap' ? 'trap' : ''}`, 'data-b': b, role: 'button', tabindex: '0', 'aria-label': b === 'trap' ? 'Impostors' : `${MO[b].label}, ${MO[b].meaning}` },
        h('div', { class: 'bin-head' }, b === 'trap' ? h('span', { class: 'bin-root' }, 'Impostors') : [h('span', { class: 'bin-root' }, MO[b].label), h('span', { class: 'bin-mean' }, MO[b].meaning)]),
        h('div', { class: 'bin-body' }));
      el.addEventListener('click', () => { if (picked) { const it = picked; picked = null; place(it, b); } });
      el.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && picked) { e.preventDefault(); const it = picked; picked = null; place(it, b); } });
      binEl[b] = el; bins.append(el);
    });
    const checkBtn = h('button', { class: 'cta', type: 'button', disabled: true, onclick: check }, 'Check');
    const notes = h('div', { class: 'notes', 'aria-live': 'polite' });
    function chip(it) {
      const el = h('div', { class: 'wchip', role: 'button', tabindex: '0' }, it.w);
      draggable(el, {
        zone: '.bin, .pool',
        onTap: () => { if (checkBtn.dataset.done) return; if (picked && picked !== it && state.has(it.w)) { const pk = picked; picked = null; place(pk, state.get(it.w)); return; } picked = picked === it ? null : it; paint(); },
        onDrop: z => { if (checkBtn.dataset.done || !z) return; z === pool ? state.delete(it.w) : state.set(it.w, z.dataset.b); picked = null; paint(); }
      });
      if (picked === it) el.classList.add('picked');
      return el;
    }
    function place(it, b) { state.set(it.w, b); paint(); }
    function paint() {
      pool.replaceChildren(...items.filter(it => !state.has(it.w)).map(chip));
      Object.entries(binEl).forEach(([b, el]) => el.querySelector('.bin-body').replaceChildren(...items.filter(it => state.get(it.w) === b).map(chip)));
      bins.classList.toggle('armed', !!picked);
      checkBtn.disabled = state.size < items.length;
      pool.hidden = state.size === items.length;
    }
    function check() {
      if (checkBtn.dataset.done) { round(); return; }
      checkBtn.dataset.done = '1';
      let right = 0;
      Object.entries(binEl).forEach(([b, el]) => el.querySelectorAll('.wchip').forEach(c => {
        const it = items.find(x => x.w === c.textContent);
        const ok = it.home === b; if (ok) right++;
        c.classList.add(ok ? 'ok' : 'bad');
        if (!ok) c.append(h('span', { class: 'belongs' }, it.home === 'trap' ? 'impostor' : MO[it.home].label));
      }));
      store.sort.rounds++; if (right === items.length) store.sort.perfect++; save();
      notes.replaceChildren(h('p', { class: 'verdict tnum' }, `${right}/${items.length}`),
        ...items.filter(it => it.home === 'trap').map(it => h('p', { class: 'note' }, h('b', null, it.w), ' ', it.why)));
      say(`${right} of ${items.length} right`);
      checkBtn.textContent = 'Next round';
    }
    paint();
    box.replaceChildren(pool, bins, notes, checkBtn);
  }
  round();
  return frame(null, box, { cls: 'sort-screen', sr: 'Sort' });
}

// ---------- router ----------
function route() {
  const [, a, b] = (location.hash || '#/').split('/');
  let v;
  if (!a) v = home();
  else if (a === 'build') v = !b ? buildIndex() : b === 'mystery' ? mystery() : MO[b] ? buildMatrix(b) : buildIndex();
  else if (a === 'cards') v = cards();
  else if (a === 'grow') v = grow(b);
  else if (a === 'dig') v = dig();
  else if (a === 'mint') v = mint();
  else if (a === 'sort') v = sort();
  else v = home();
  mount(v);
}

fetch(document.documentElement.dataset.data).then(r => r.json()).then(data => {
  D = data; MO = D.morphemes; WORDS = D.words;
  BY_WORD = Object.fromEntries(WORDS.map(w => [w.w, w]));
  BUILD_BASES = Object.keys(MO).filter(id => MO[id].type === 'base' && familySums(id).length >= 3)
    .sort((x, y) => (MO[x].tier - MO[y].tier) || familySums(y).length - familySums(x).length);
  window.addEventListener('hashchange', route);
  route();
});
})();
