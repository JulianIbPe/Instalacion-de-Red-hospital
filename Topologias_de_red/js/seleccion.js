// ===== seleccion.js: selección múltiple (Mayús+clic) y selección por rectángulo (Mayús + clic izquierdo y arrastrar) =====
// Un solo objeto seleccionado -> `sel` (con asas de edición). Varios -> `multi` (lista de ids) y sel = null.
function seleccionados() { return (multi.length ? multi.map(byId) : [byId(sel)]).filter(o => o && esEditable(o)); }
function fijarSeleccion(ids) { sel = ids.length == 1 ? ids[0] : null; multi = ids.length > 1 ? ids : []; }
function alternar(id) {                         // Mayús+clic: añade o quita un objeto de la selección
  const s = seleccionados().map(o => o.id), i = s.indexOf(id); if (i < 0) s.push(id); else s.splice(i, 1); fijarSeleccion(s);
}
function rawW(e) { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left - V.ox) / V.z, y: (e.clientY - r.top - V.oy) / V.z }; }
function bboxDe(o) {                            // rectángulo que ocupa un objeto: {x0,y0,x1,y1} en metros
  let xs, ys;
  if (o.k == 'line') { const P = o.pts.map(pt), m = o.w / 2; xs = P.map(q => q.x); ys = P.map(q => q.y); xs.push(Math.min(...xs) - m, Math.max(...xs) + m); ys.push(Math.min(...ys) - m, Math.max(...ys) + m); }
  else if (o.k == 'medida') { const n = normalMed(o), f = o.off || 0; xs = [o.a.x, o.b.x, o.a.x + n.nx * f, o.b.x + n.nx * f]; ys = [o.a.y, o.b.y, o.a.y + n.ny * f, o.b.y + n.ny * f]; }
  else if (o.k == 'zona') { xs = [o.x, o.x + o.w]; ys = [o.y, o.y + o.h]; }
  else if (o.k == 'texto') { xs = [o.x, o.x + (o.label || ' ').length * .27]; ys = [o.y - .45, o.y]; }
  else { xs = [o.x - o.w / 2, o.x + o.w / 2]; ys = [o.y - o.h / 2, o.y + o.h / 2]; }
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
function resaltar(o) {                          // marco ámbar alrededor de cada objeto de una selección múltiple
  if (!multi.includes(o.id)) return ''; const b = bboxDe(o);
  return `<rect x="${b.x0 - .1}" y="${b.y0 - .1}" width="${b.x1 - b.x0 + .2}" height="${b.y1 - b.y0 + .2}" fill="#e0a03022" stroke="#e0a030" stroke-dasharray=".15 .1" stroke-width=".04" pointer-events="none"/>`;
}
function cajaHtml() {                           // rectángulo azul mientras se arrastra la selección por área
  if (!cajaSel) return ''; const c = cajaSel;
  return `<rect x="${Math.min(c.x0, c.x1)}" y="${Math.min(c.y0, c.y1)}" width="${Math.abs(c.x1 - c.x0)}" height="${Math.abs(c.y1 - c.y0)}" fill="#2e86de22" stroke="#2e86de" stroke-width=".03" stroke-dasharray=".15 .1" pointer-events="none"/>`;
}
function dentroDeCaja() {                       // ids de los objetos que están COMPLETAMENTE dentro del rectángulo
  const x0 = Math.min(cajaSel.x0, cajaSel.x1), x1 = Math.max(cajaSel.x0, cajaSel.x1), y0 = Math.min(cajaSel.y0, cajaSel.y1), y1 = Math.max(cajaSel.y0, cajaSel.y1);
  return S.objs.filter(o => { if (!esEditable(o)) return false; const b = bboxDe(o); return b.x0 >= x0 && b.x1 <= x1 && b.y0 >= y0 && b.y1 <= y1; }).map(o => o.id);
}
