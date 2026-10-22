// ===== iman.js: ajuste automático del cursor al medir (puntas de paredes/cables, centros de dispositivos, esquinas) =====
let snapPt = null;                      // punto al que está pegado el cursor (se dibuja como un círculo ámbar)
function puntosIman() {
  const E = S.edificio, c = [{ x: 0, y: 0 }, { x: E.w, y: 0 }, { x: 0, y: E.h }, { x: E.w, y: E.h }];
  S.objs.filter(esVisible).forEach(o => {
    if (o.k == 'item' || o.k == 'shape' || o.k == 'texto') c.push({ x: o.x, y: o.y });          // centro
    else if (o.k == 'line') o.pts.forEach(q => c.push(pt(q)));                                    // puntas y vértices
    else if (o.k == 'zona') c.push({ x: o.x, y: o.y }, { x: o.x + o.w, y: o.y }, { x: o.x, y: o.y + o.h }, { x: o.x + o.w, y: o.y + o.h }, { x: o.x + o.w / 2, y: o.y + o.h / 2 });
  });
  return c;
}
function cercano(p) {                   // punto de imán más cercano dentro de ~18 px, o null
  let b = null, bd = 18 / V.z;
  for (const c of puntosIman()) { const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < bd) { bd = d; b = c; } }
  return b;
}
