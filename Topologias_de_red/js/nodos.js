// ===== nodos.js: al dibujar con un tipo de línea (cable, pared...), se marcan los nodos de las líneas del MISMO tipo y el cursor se pega a ellos =====
// Una línea nueva puede quedar unida a un nodo de otra: su punto guarda {rl: id de la línea, ri: índice del nodo} y lo sigue si ese nodo se mueve.
// Paredes: cuentan todos los vértices (cada conexión). Resto de cables: solo los extremos.
let snapNodo = null;                                    // nodo al que está pegado el cursor: {lid, i} (lid null = punto de la línea que se está dibujando)
function raizNodo(lid, i) {                             // sigue la cadena de enlaces hasta el nodo "original"
  let L = byId(lid), q = L.pts[i], n = 0;
  while (q.rl && n++ < 10) { const M = byId(q.rl); if (!M || !M.pts[q.ri]) break; L = M; i = q.ri; q = L.pts[i]; }
  return { lid: L.id, i, q };
}
function nodosDeTipo(tipo, ex) {
  const r = [];
  S.objs.filter(esVisible).forEach(o => {
    if (o.k != 'line' || o.n != tipo) return;
    o.pts.forEach((q, i) => {
      if (tipo != 'Pared' && i != 0 && i != o.pts.length - 1) return;
      if (ex) { const rz = raizNodo(o.id, i); if (rz.lid == ex.lid && rz.i == ex.i) return; }   // no pegarse a sí mismo ni a lo que depende de ello
      r.push({ ...pt(q), lid: o.id, i, c: o.c });
    });
  });
  if (tmp && tmp.k == 'line' && tmp.n == tipo)          // puntos ya puestos de la línea en curso (para cerrar un contorno)
    tmp.pts.slice(0, -1).forEach((q, i) => { if (tipo == 'Pared' || i == 0) r.push({ ...pt(q), lid: null, i, c: tmp.c }); });
  return r;
}
function tipoActivo() { return tool && tool.k == 'line' ? tool.n : (drag && drag.m == 'h' && drag.o.k == 'line' ? drag.o.n : null); }
function exclusion() { return drag && drag.m == 'h' && drag.o.k == 'line' ? raizNodo(drag.o.id, +drag.h) : null; }
function imanNodos(p) {                                 // pega el cursor al nodo más cercano (~18 px) del mismo tipo
  const tipo = tipoActivo(); if (!tipo) return;
  let b = null, bd = 18 / V.z;
  for (const c of nodosDeTipo(tipo, exclusion())) { const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < bd) { bd = d; b = c; } }
  if (b) { snapPt = { x: b.x, y: b.y }; snapNodo = { lid: b.lid, i: b.i }; }
}
function enlaceDe(nd, pos) {                            // punto nuevo (para una línea) ya unido al nodo elegido
  if (!nd.lid) return { x: pos.x, y: pos.y };
  const r = raizNodo(nd.lid, nd.i);
  return r.q.ref ? { x: pos.x, y: pos.y, ref: r.q.ref } : { x: pos.x, y: pos.y, rl: r.lid, ri: r.i };   // si el nodo está en un dispositivo, se une al dispositivo
}
function nodosHtml() {                                  // círculos blancos sobre los nodos disponibles
  const tipo = tipoActivo(); if (!tipo) return '';
  return nodosDeTipo(tipo, exclusion()).map(n => `<circle class="nodo" cx="${n.x}" cy="${n.y}" r=".11" fill="#fff" stroke="${n.c}" stroke-width=".05" pointer-events="none"/>`).join('');
}
