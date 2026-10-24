// ===== rotacion.js: rotar la selección (uno o varios objetos) con el asa ↻ o con la tecla R (90°; Mayús+R = -90°) =====
// Giran su posición alrededor del centro de la selección. Dispositivos, círculos, zonas y textos guardan además su ángulo (o.rot);
// paredes, cables, mediciones y formas con lados giran directamente sus puntos.
function rotP(q, c, deg) {               // gira el punto q alrededor de c; grados positivos = sentido horario (igual que SVG)
  const t = deg * Math.PI / 180, s = Math.sin(t), k = Math.cos(t), dx = q.x - c.x, dy = q.y - c.y;
  return { x: c.x + dx * k - dy * s, y: c.y + dx * s + dy * k };
}
function esqRot(P, c, rot) {             // esquinas [x,y] giradas -> {xs, ys}
  const R = P.map(([x, y]) => rot ? rotP({ x, y }, c, rot) : { x, y }); return { xs: R.map(q => q.x), ys: R.map(q => q.y) };
}
function esquinasZona(o) {               // esquinas y centro de una zona (con su giro)
  const c = { x: o.x + o.w / 2, y: o.y + o.h / 2 }, r = o.rot || 0;
  return [[o.x, o.y], [o.x + o.w, o.y], [o.x, o.y + o.h], [o.x + o.w, o.y + o.h], [c.x, c.y]].map(([x, y]) => rotP({ x, y }, c, r));
}
function geoSel() {                      // centro y borde superior de lo seleccionado (todos juntos)
  const os = seleccionados(); if (!os.length) return null; const b = os.map(bboxDe);
  const x0 = Math.min(...b.map(q => q.x0)), x1 = Math.max(...b.map(q => q.x1)), y0 = Math.min(...b.map(q => q.y0)), y1 = Math.max(...b.map(q => q.y1));
  return { c: { x: (x0 + x1) / 2, y: (y0 + y1) / 2 }, top: y0 };
}
function rotarDesde(o, g, ang, c) {      // deja en o el resultado de girar la copia original g un ángulo ang alrededor de c
  const rp = q => { const r = rotP(q, c, ang); return { x: r3(r.x), y: r3(r.y) }; };
  if (o.k == 'line') o.pts = g.pts.map(q => q.ref || q.rl ? { ...q } : rp(q));
  else if (o.k == 'medida') { o.a = rp(g.a); o.b = rp(g.b); }
  else if (o.k == 'shape' && o.n != 'Círculo') fijarVerts(o, vertsAbs(g).map(rp));
  else {
    const zona = o.k == 'zona', n = rp(zona ? { x: g.x + g.w / 2, y: g.y + g.h / 2 } : { x: g.x, y: g.y });
    if (zona) { o.x = r3(n.x - g.w / 2); o.y = r3(n.y - g.h / 2); } else { o.x = n.x; o.y = n.y; }
    o.rot = (((g.rot || 0) + ang) % 360 + 360) % 360;
  }
}
const copiar = o => JSON.parse(JSON.stringify(o));
function rotarSeleccion(deg) {           // giro rápido (tecla R)
  const os = seleccionados(), g = geoSel(); if (!g) return; push();
  os.forEach(o => rotarDesde(o, copiar(o), deg, g.c)); render();
}
function iniciarRot() {                  // se pulsó el asa ↻
  const g = geoSel(); if (!g) return;
  drag = { m: 'rot', c: g.c, h0: { x: g.c.x, y: g.top - .8 }, delta: 0, pu: false, lista: seleccionados().map(o => ({ o, g: copiar(o) })) };
}
function moverRot(e) {                   // el ángulo sale de la posición del cursor respecto al centro (a pasos de 15° con grilla, de 1° sin ella)
  const d = drag, r = rawW(e); let a = Math.atan2(r.y - d.c.y, r.x - d.c.x) * 180 / Math.PI + 90; if (a > 180) a -= 360;
  const paso = rejilla ? 15 : 1; a = Math.round(a / paso) * paso; if (a === d.delta) return;
  if (!d.pu) { push(); d.pu = true; }
  d.delta = a; d.lista.forEach(({ o, g }) => rotarDesde(o, g, a, d.c));
}
function rotHtml() {                     // asa de rotación sobre la selección
  if (tool || tmp || ladoSel() !== null) return ''; const g = geoSel(); if (!g) return '';
  const rot = drag && drag.m == 'rot', c = rot ? drag.c : g.c, h0 = rot ? rotP(drag.h0, drag.c, drag.delta) : { x: g.c.x, y: g.top - .8 };
  return `<g data-rot="1" style="cursor:grab"><line x1="${c.x}" y1="${c.y}" x2="${h0.x}" y2="${h0.y}" stroke="#2e86de" stroke-width=".03" stroke-dasharray=".1 .08" pointer-events="none"/><circle cx="${c.x}" cy="${c.y}" r=".06" fill="#2e86de" pointer-events="none"/><circle cx="${h0.x}" cy="${h0.y}" r=".2" fill="#2e86de" stroke="#fff" stroke-width=".04"/><text x="${h0.x}" y="${h0.y}" font-size=".28" fill="#fff" text-anchor="middle" dominant-baseline="central" pointer-events="none">↻</text></g>`
    + (rot ? T(h0.x, h0.y - .4, drag.delta + '°', .3) : '');
}
function redimZona(o, p) {               // arrastrar la esquina de una zona (con o sin giro): la esquina opuesta queda fija
  if (!o.rot) { o.w = Math.max(.2, p.x - o.x); o.h = Math.max(.2, p.y - o.y); return; }
  const c = { x: o.x + o.w / 2, y: o.y + o.h / 2 }, F = rotP({ x: o.x, y: o.y }, c, o.rot), l = rotP(p, F, -o.rot);
  const w = Math.max(.2, l.x - F.x), h = Math.max(.2, l.y - F.y), n = rotP({ x: F.x + w / 2, y: F.y + h / 2 }, F, o.rot);
  o.w = r3(w); o.h = r3(h); o.x = r3(n.x - w / 2); o.y = r3(n.y - h / 2);
}
function redimensionarRot(o, h, p) {     // como redimensionar, pero en el sistema de ejes girado de la forma (círculos con giro)
  if (!o.rot) return redimensionar(o, h, p);
  const ox = o.x, oy = o.y; redimensionar(o, h, rotP(p, { x: ox, y: oy }, -o.rot));
  const s = rotP({ x: o.x - ox, y: o.y - oy }, { x: 0, y: 0 }, o.rot); o.x = r3(ox + s.x); o.y = r3(oy + s.y);
}
