// ===== nodos.js: al dibujar con un tipo de línea (cable, pared...), se marcan los nodos de las líneas del MISMO tipo y el cursor se pega a ellos =====
// Una línea nueva puede quedar unida a un nodo de otra: su punto guarda {rl: id de la línea, ri: índice del nodo} y lo sigue si ese nodo se mueve.
// Paredes, cables de energía y canalizaciones: cuentan todos los vértices (cada conexión). Resto de cables: solo los extremos.
// Empalme (cables de energía y canalizaciones, cada uno con los de su tipo): el cursor también se pega a cualquier punto de un tramo de otro cable de energía; al terminar el cable (o soltar la punta)
//   ese punto se agrega como vértice del otro cable y queda unido a él (empalmar). Mientras tanto el punto lleva emp = id de ese cable (campo transitorio).
const empalma = tipo => tipo == 'energia' || tipo == 'canal';   // las canalizaciones se empalman igual que los cables de energía
const todosVertices = tipo => tipo == 'pared' || empalma(tipo);
// Al colocar una escalera o una forma (dos puntos) se marcan los extremos de las paredes y las esquinas de las escaleras, y el cursor se pega a ellos (sin unir nada).
let snapNodo = null;                                    // nodo al que está pegado el cursor: {lid, i} (lid null = punto de la línea que se está dibujando)
function raizNodo(lid, i) {                             // sigue la cadena de enlaces hasta el nodo "original"
  let L = byId(lid), q = L.pts[i], n = 0;
  while (q.rl && n++ < 10) { const M = byId(q.rl); if (!M || !M.pts[q.ri]) break; L = M; i = q.ri; q = L.pts[i]; }
  return { lid: L.id, i, q };
}
function nodosDeTipo(tipo, ex) {
  const r = [];
  S.objs.filter(esVisible).forEach(o => {
    if (o.k != 'line' || claveLinea(o) != tipo) return;
    o.pts.forEach((q, i) => {
      if (q.es || !puntoEn(o, q)) return;                 // los puntos de escalera no son nodos; solo los de esta planta
      if (!todosVertices(tipo) && i != 0 && i != o.pts.length - 1) return;
      if (ex) { const rz = raizNodo(o.id, i); if (rz.lid == ex.lid && rz.i == ex.i) return; }   // no pegarse a sí mismo ni a lo que depende de ello
      r.push({ ...pt(q), lid: o.id, i, c: o.c });
    });
  });
  if (tmp && tmp.k == 'line' && claveLinea(tmp) == tipo)          // puntos ya puestos de la línea en curso (para cerrar un contorno)
    tmp.pts.slice(0, -1).forEach((q, i) => { if (!q.es && puntoEn(tmp, q) && (todosVertices(tipo) || i == 0)) r.push({ ...pt(q), lid: null, i, c: tmp.c }); });
  if (tipo == 'pared')                                   // esquinas de las escaleras: el cursor se pega a ellas (queda un punto libre, no unido a la escalera)
    S.objs.filter(o => esVisible(o) && o.k == 'item' && esEscalera(o)).forEach(o => {
      const { xs, ys } = esqRot([[o.x - o.w / 2, o.y - o.h / 2], [o.x + o.w / 2, o.y - o.h / 2], [o.x + o.w / 2, o.y + o.h / 2], [o.x - o.w / 2, o.y + o.h / 2]], { x: o.x, y: o.y }, o.rot || 0);
      xs.forEach((x, i) => r.push({ x: r3(x), y: r3(ys[i]), lid: null, i: -1, c: o.c || '#444444' }));
    });
  return r;
}
function tipoActivo() { return tool && tool.k == 'line' ? claveLinea(tool) : usaDosPuntos(tool) ? 'pared' : (drag && drag.m == 'h' && drag.o.k == 'line' ? claveLinea(drag.o) : null); }
function exclusion() { return drag && drag.m == 'h' && drag.o.k == 'line' ? raizNodo(drag.o.id, +drag.h) : null; }
function imanNodos(p) {                                 // pega el cursor al nodo más cercano (~18 px) del mismo tipo
  const tipo = tipoActivo(); if (!tipo) return;
  let b = null, bd = 18 / V.z;
  for (const c of nodosDeTipo(tipo, exclusion())) { const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < bd) { bd = d; b = c; } }
  if (b) { snapPt = { x: b.x, y: b.y }; snapNodo = { lid: b.lid, i: b.i }; return; }
  if (empalma(tipo)) { const ex = exclusion(), t = tramoEnergia(p, 18 / V.z, S.objs.filter(o => o.k == 'line' && esVisible(o) && claveLinea(o) == tipo && !(ex && ex.lid == o.id) && !(drag && drag.o === o))); if (t) { snapPt = { x: t.x, y: t.y }; snapNodo = { lid: t.lid, emp: true }; } }
  if (tipo != 'pared' && tipo != 'canal' && !snapPt) { const t = tramoEnergia(p, 18 / V.z, S.objs.filter(o => o.k == 'line' && esVisible(o) && esCanal(o))); if (t) { snapPt = { x: t.x, y: t.y }; return; } }   // un cable se pega al eje de una canalización (solo la posición: no queda unido a ella)
}
function tramoEnergia(p, max, lineas) {                 // punto más cercano a p sobre un tramo de esos cables, en esta planta: {x, y, lid, k (índice del primer punto del tramo), d}
  let b = null;
  lineas.forEach(o => {
    for (let k = 0; k + 1 < o.pts.length; k++) {
      const qa = o.pts[k], qb = o.pts[k + 1]; if (qa.es || qb.es || !puntoEn(o, qa) || !puntoEn(o, qb)) continue;   // no se empalma dentro de una escalera
      const a = pt(qa), c = pt(qb), dx = c.x - a.x, dy = c.y - a.y, l2 = dx * dx + dy * dy; if (!l2) continue;
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)), x = r3(a.x + t * dx), y = r3(a.y + t * dy), d = Math.hypot(p.x - x, p.y - y);
      if (d < max && (!b || d < b.d)) b = { x, y, lid: o.id, k, d };
    }
  });
  return b;
}
function empalmar(L) {                                   // convierte cada punto con emp (ver arriba) en un vértice nuevo del otro cable y lo une a él. Sin push: va en el paso de quien llama
  L.pts.forEach(q => {
    const id = q.emp; delete q.emp; const M = byId(id); if (!M || M === L) return;
    const t = tramoEnergia(q, .01, [M]); if (!t) return;   // se busca de nuevo: un empalme anterior pudo cambiar los índices
    q.rl = M.id; q.ri = insertarVertice(M, t);
  });
}
function insertarVertice(M, t) {                         // agrega a M un vértice en t (de tramoEnergia) y devuelve su índice. Sin push: va en el paso de quien llama
  const ri = t.k + 1, a = M.pts[t.k], v = { x: t.x, y: t.y, ...(a.pl ? { pl: a.pl, cp: a.cp } : {}) };
  S.objs.forEach(o => o.k == 'line' && o.pts.forEach(z => { if (z.rl == M.id && z.ri >= ri) z.ri++; }));   // las uniones a vértices posteriores siguen apuntando al mismo vértice
  M.pts.splice(ri, 0, v); return ri;
}
function enlaceDe(nd, pos) {                            // punto nuevo (para una línea) ya unido al nodo elegido
  if (nd.emp) return { x: pos.x, y: pos.y, emp: nd.lid };   // empalme pendiente: se resuelve con empalmar()
  if (!nd.lid) return { x: pos.x, y: pos.y };
  const r = raizNodo(nd.lid, nd.i);
  return r.q.ref ? { x: pos.x, y: pos.y, ref: r.q.ref } : { x: pos.x, y: pos.y, rl: r.lid, ri: r.i };   // si el nodo está en un dispositivo, se une al dispositivo
}
function nodosHtml() {                                  // círculos blancos sobre los nodos disponibles
  const tipo = tipoActivo(); if (!tipo) return '';
  return nodosDeTipo(tipo, exclusion()).map(n => `<circle class="nodo" cx="${n.x}" cy="${n.y}" r=".11" fill="#fff" stroke="${n.c}" stroke-width=".05" pointer-events="none"/>`).join('');
}
