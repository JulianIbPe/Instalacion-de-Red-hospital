// ---------- Interacción ----------
const col = () => $('#col').value, fil = () => $('#fill').value;
const add = o => (push(), o.id = nid++, o.pl = S.plantaAct, o.cp = S.capaAct, S.objs.push(o), o);
function finishLine() {
  if (!tmp || tmp.k != 'line') return; const q = tmp.pts, a = q[q.length - 1], b = q[q.length - 2];
  if (b && Math.hypot(a.x - b.x, a.y - b.y) < .05 && !a.ref) q.pop();
  if (q.length > 1) { delete tmp.cur; add(tmp); } tmp = null; render();
}
svg.addEventListener('pointerdown', e => {
  svg.setPointerCapture(e.pointerId); const p = toW(e); avisoMsg = '';
  if (e.button == 2) { finishLine(); if (tmp && tmp.k == 'medida') { tmp = null; render(); } return; }
  if (e.button == 1) { drag = { m: 'pan', sx: e.clientX, sy: e.clientY, ox: V.ox, oy: V.oy }; return; }
  // Doble clic detectado a mano: la página se redibuja en cada clic y el evento 'dblclick' nativo se pierde.
  const now = Date.now(), dbl = !e.shiftKey && now - lastDown.t < 350 && Math.hypot(e.clientX - lastDown.x, e.clientY - lastDown.y) < 6;
  lastDown = { t: dbl ? 0 : now, x: e.clientX, y: e.clientY };
  if (dbl) {
    if (tmp && tmp.k == 'line') { finishLine(); return; }
    const t = e.target.closest('[data-id]'), o = t && byId(t.dataset.id);
    if (!tool && o && o.k != 'medida') { const v = prompt('Etiqueta:', o.label || ''); if (v !== null && v !== (o.label || '')) { push(); o.label = v; drag = null; render(); } return; }
  }
  if (!tool) {
    const hh = e.target.closest('[data-h]'), t = e.target.closest('[data-id]');
    // Mayús + clic izquierdo: si no se arrastra, añade/quita el objeto de la selección; si se arrastra, dibuja un rectángulo de selección
    if (e.shiftKey) { const r = rawW(e); drag = { m: 'box', id: t ? +t.dataset.id : null, sx: e.clientX, sy: e.clientY, x0: r.x, y0: r.y, moved: false }; return; }
    if (hh && byId(sel)) drag = { m: 'h', o: byId(sel), h: hh.dataset.h, p0: p };
    else if (t) { const id = +t.dataset.id; if (!multi.includes(id)) { sel = id; multi = []; } drag = { m: 'mv', os: seleccionados(), last: p, p0: p }; }
    else { sel = null; multi = []; drag = { m: 'pan', sx: e.clientX, sy: e.clientY, ox: V.ox, oy: V.oy }; }
    render(); return;
  }
  if (!capaEditable()) { avisoMsg = '⚠ La capa «' + capaActual().nombre + '» está oculta o bloqueada: elige otra capa para dibujar'; render(); return; }
  if (tool.k == 'item') add({ k: 'item', n: tool.n, ic: tool.ic, w: tool.w, h: tool.h, x: p.x, y: p.y, label: '' });
  else if (tool.k == 'shape') add({ k: 'shape', n: tool.n, x: p.x, y: p.y, w: 1.2, h: 1.2, c: col(), f: fil(), label: '' });
  else if (tool.k == 'texto') { const t = prompt('Texto:'); if (t) add({ k: 'texto', x: p.x, y: p.y, label: t }); }
  else if (tool.k == 'zona') { tmp = { k: 'zona', s: tool.s, x: p.x, y: p.y, w: 0, h: 0, c: col(), f: fil(), label: '' }; drag = { m: 'zona', x0: p.x, y0: p.y }; }
  else if (tool.k == 'medida') {
    const q = snapPt || p;                                  // 3 clics: punto a, punto b y posición de la cota
    if (!tmp) tmp = { k: 'medida', a: q, b: q, off: 0, st: 1 };
    else if (tmp.st == 1) { if (Math.hypot(q.x - tmp.a.x, q.y - tmp.a.y) > .05) { tmp.b = q; tmp.st = 2; } }
    else { tmp.off = offDe(tmp, p); delete tmp.st; add(tmp); tmp = null; }
  }
  else if (tool.k == 'line') {
    const it = itemAt(e), q = it ? { x: it.x, y: it.y, ref: it.id } : p;
    if (!tmp) tmp = { k: 'line', n: tool.n, c: col(), w: tool.w, d: tool.d, pts: [q], label: '' }; else tmp.pts.push(q);
  }
  render();
});
svg.addEventListener('pointermove', e => {
  const p = curP = toW(e);
  const eligiendoCota = tmp && tmp.k == 'medida' && tmp.st == 2;
  snapPt = (tool && tool.k == 'medida' && !eligiendoCota) || (drag && drag.m == 'h' && drag.o.k == 'medida' && drag.h != 'o') ? cercano(p) : null;
  const q = snapPt || p;   // al medir, el cursor se pega al punto de imán más cercano
  if (tmp && tmp.k == 'line') tmp.cur = p; else if (eligiendoCota) tmp.off = offDe(tmp, p); else if (tmp && tmp.k == 'medida') tmp.b = q;
  if (drag) {
    const d = drag;
    if (d.m == 'pan') { V.ox = d.ox + e.clientX - d.sx; V.oy = d.oy + e.clientY - d.sy; }
    else if (d.m == 'box') {
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4) { d.moved = true; cajaSel = { x0: d.x0, y0: d.y0, x1: d.x0, y1: d.y0 }; }
      if (d.moved) { const r = rawW(e); cajaSel.x1 = r.x; cajaSel.y1 = r.y; }
    }
    else if (d.m == 'zona') { Object.assign(tmp, { x: Math.min(d.x0, p.x), y: Math.min(d.y0, p.y), w: Math.abs(p.x - d.x0), h: Math.abs(p.y - d.y0) }); }
    else if (d.m == 'mv') {
      const dx = p.x - d.last.x, dy = p.y - d.last.y; d.last = p;
      if ((dx || dy) && !d.pu) { push(); d.pu = 1; }
      d.os.forEach(o => {               // mueve todos los objetos seleccionados a la vez
        if (o.k == 'line') o.pts.forEach(q => { if (!q.ref) { q.x += dx; q.y += dy; } });
        else if (o.k == 'medida') { o.a = { x: o.a.x + dx, y: o.a.y + dy }; o.b = { x: o.b.x + dx, y: o.b.y + dy }; }
        else { o.x = sn(o.x + dx); o.y = sn(o.y + dy); }
      });
    } else if (d.m == 'h') {
      const o = d.o; if (!d.pu && (p.x != d.p0.x || p.y != d.p0.y)) { push(); d.pu = 1; }
      if (o.k == 'zona') { o.w = Math.max(.2, p.x - o.x); o.h = Math.max(.2, p.y - o.y); }
      else if (o.k == 'medida') { if (d.h == 'o') o.off = offDe(o, p); else o[d.h] = q; }
      else { const it = itemAt(e); o.pts[d.h] = it ? { x: it.x, y: it.y, ref: it.id } : p; }
    }
  }
  render();
});
svg.addEventListener('pointerup', () => {
  if (drag && drag.m == 'box') { if (drag.moved) fijarSeleccion(dentroDeCaja()); else if (drag.id != null) alternar(drag.id); cajaSel = null; }
  if (drag && drag.m == 'zona') { if (tmp.w > .2 && tmp.h > .2) add(tmp); tmp = null; }
  drag = null; render();
});
svg.addEventListener('pointerleave', () => { snapPt = null; render(); });
svg.addEventListener('contextmenu', e => e.preventDefault());
svg.addEventListener('wheel', e => {
  e.preventDefault(); const r = svg.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
  const z = Math.min(300, Math.max(8, V.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
  V.ox = mx - (mx - V.ox) * z / V.z; V.oy = my - (my - V.oy) * z / V.z; V.z = z; render();
}, { passive: false });
