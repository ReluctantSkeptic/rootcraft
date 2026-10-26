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
