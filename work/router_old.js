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
