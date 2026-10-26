# Generates work/og/capture.html: the landing's port tree alone, driven frame-by-frame (window.__og.frame(t)).
import re, os
ROOT = '/workspace/projects/549d1ed2-e5ae-4f68-9d72-5badfdfe2ad5'
js = open(ROOT + '/app/src/landing/landing.js').read()
a = js.index('function tree() {'); b = js.index('/* ---------------- pieces')
tree = js[a:b]
# drop twigs (cleaner at thumbnail size) and expose render instead of the scroll task
tree = tree.replace("B.push({ s: ts,", "if (!window.NOTWIG) B.push({ s: ts,")
tree = tree.replace("  if (RM) { curP = 1;", "  window.__tree = { render: p => { curP = p; render(p); }, build, ready: () => B.length > 0 };\n  if (window.NOTWIG) twigEls.forEach(e => e.classList.add('off'));\n  return;\n  if (RM) { curP = 1;")
assert 'window.__tree' in tree and 'NOTWIG) B.push' in tree
html = open(os.path.join(os.path.dirname(__file__), 'capture.tpl.html')).read().replace('/*TREE*/', tree)
open(os.path.join(os.path.dirname(__file__), 'capture.html'), 'w').write(html)
print('ok')
