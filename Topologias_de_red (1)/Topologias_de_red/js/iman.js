// ===== iman.js: ajuste automático del cursor al medir (puntas de paredes/cables, centros de dispositivos, esquinas) =====
let snapPt = null;                      // punto al que está pegado el cursor (se dibuja como un círculo ámbar)
function puntosIman() {
  const E = S.edificio, c = [{ x: 0, y: 0 }, { x: E.w, y: 0 }, { x: 0, y: E.h }, { x: E.w, y: E.h }];
  S.objs.filter(esVisible).forEach(o => {
    if (o.k == 'item' || o.k == 'shape' || o.k == 'texto') c.push({ x: o.x, y: o.y });          // centro
    else if (o.k == 'line') o.pts.forEach(q => c.push(pt(q)));                                    // puntas y vértices
    else if (o.k == 'zona') c.push(...esquinasZona(o));
  });
  return c;
}
function cercano(p) {                   // punto de imán más cercano dentro de ~18 px, o null
  let b = null, bd = 18 / V.z;
  for (const c of puntosIman()) { const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < bd) { bd = d; b = c; } }
  return b;
}

// ---------- Imán al punto medio de líneas (se activa y desactiva desde el menú izquierdo o con la tecla M) ----------
let medioOn = false, snapMedio = false;             // snapMedio = el cursor está pegado ahora a un punto medio
function puntosMedios(excl) {                       // mitad de cada tramo de líneas/paredes/cables y de cada lado de las formas
  const r = [], mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  S.objs.filter(esVisible).forEach(o => {
    if (o === excl) return;
    if (o.k == 'line') { const P = o.pts.map(q => pt(q)); for (let i = 0; i < P.length - 1; i++) r.push(mid(P[i], P[i + 1])); }
    else if (o.k == 'shape' && o.n != 'Círculo') { const A = vertsAbs(o), hid = o.hid || []; A.forEach((a, i) => { if (!hid.includes(i)) r.push(mid(a, A[(i + 1) % A.length])); }); }
  });
  return r;
}
function imanMedio(p) {                             // pega el cursor al punto medio más cercano (~18 px) al colocar, dibujar, medir o mover puntos
  if (!medioOn) return;
  const d = drag, h = d && d.m == 'h' ? d.o : null;
  if (!(tool || (h && (h.k == 'line' || (h.k == 'medida' && d.h != 'o') || (h.k == 'shape' && String(d.h)[0] == 'v'))))) return;
  let b = null, bd = 18 / V.z;
  for (const c of puntosMedios(h)) { const dd = Math.hypot(c.x - p.x, c.y - p.y); if (dd < bd) { bd = dd; b = c; } }
  if (b) { snapPt = b; snapMedio = true; }
}
function rombo() {                                  // marca en forma de rombo para distinguir un punto medio de otros imanes
  if (!snapPt || !snapMedio) return ''; const { x, y } = snapPt;
  return `<path d="M${x} ${y - .24}L${x + .24} ${y}L${x} ${y + .24}L${x - .24} ${y}Z" fill="none" stroke="#e0a030" stroke-width=".05" pointer-events="none"/>`;
}
