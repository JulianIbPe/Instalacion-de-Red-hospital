// ===== puertas.js: puertas que solo se colocan sobre paredes =====
// Una puerta {k:'puerta', pared, si, s, w, lado, hojas, bis} es una "división": un hueco de ancho w en el tramo si de una pared,
// centrado a s metros del inicio del tramo. lado = hacia qué lado de la pared abre (+1/-1). hojas = 1 o 2 puertas en el mismo hueco.
// Con 2 hojas (puerta doble clásica) cada hoja mide w/2, con su bisagra en un extremo del hueco, y ambas abren hacia el mismo lado.
// bis = 'izq' | 'der': extremo donde está la bisagra cuando hay una sola hoja.
function geoPuerta(d) {                  // geometría actual de la puerta (sigue a la pared si ésta se mueve o cambia de largo)
  const o = byId(d.pared); if (!o || o.k != 'line') return null;
  const P = o.pts.map(q => pt(q)), a = P[d.si], b = P[d.si + 1]; if (!a || !b) return null;
  const L = Math.hypot(b.x - a.x, b.y - a.y); if (L < .2) return null;
  const u = { x: (b.x - a.x) / L, y: (b.y - a.y) / L }, n = { x: -u.y, y: u.x }, w = Math.min(d.w, L), s = Math.min(Math.max(d.s, w / 2), L - w / 2);
  const c = { x: a.x + u.x * s, y: a.y + u.y * s };
  return { si: d.si, o, a, b, L, u, n, w, s, c, lado: d.lado, hojas: d.hojas, bis: d.bis, p0: { x: c.x - u.x * w / 2, y: c.y - u.y * w / 2 }, p1: { x: c.x + u.x * w / 2, y: c.y + u.y * w / 2 } };
}
function simboloPuerta(g) {              // hojas abiertas 90° + sector del suelo que recorre cada una al abrirse
  const nl = { x: g.n.x * g.lado, y: g.n.y * g.lado };
  const hoja = (H, T, r) => {            // H = bisagra, T = extremo de la hoja cerrada, r = largo de la hoja
    const O = { x: H.x + nl.x * r, y: H.y + nl.y * r }, f = nl.x * (T.y - H.y) - nl.y * (T.x - H.x) > 0 ? 1 : 0;
    return `<path d="M${H.x} ${H.y}L${O.x} ${O.y}A${r} ${r} 0 0 ${f} ${T.x} ${T.y}Z" fill="#2e86de26" stroke="#2e86de" stroke-width=".03" stroke-dasharray=".12 .08" pointer-events="all"/>`
      + `<line x1="${H.x}" y1="${H.y}" x2="${O.x}" y2="${O.y}" stroke="#34495e" stroke-width=".07" stroke-linecap="round" pointer-events="none"/>`;
  };
  if (g.hojas == 2) return hoja(g.p0, g.c, g.w / 2) + hoja(g.p1, g.c, g.w / 2);          // espejo: una gira a cada lado del hueco
  return g.bis == 'der' ? hoja(g.p1, g.p0, g.w) : hoja(g.p0, g.p1, g.w);
}
function dibujarPuerta(d, id, on, hd) {
  const g = geoPuerta(d); if (!g) return '';
  let h = `<g ${id}>${simboloPuerta(g)}</g>`;
  if (on) { h += hd(g.p0.x, g.p0.y, 'da') + hd(g.p1.x, g.p1.y, 'db'); h += cota({ a: g.p0, b: g.p1, off: -g.lado * .6 }, '', false, null); }   // asas en los costados + ancho del hueco
  return h;
}
function puertasDe(wallId) { return S.objs.filter(d => d.k == 'puerta' && d.pared == wallId); }
function tramosPared(o) {                // tramos continuos de la pared sin los huecos de las puertas (null si no tiene puertas)
  const doors = puertasDe(o.id).map(geoPuerta).filter(Boolean); if (!doors.length) return null;
  const P = o.pts.map(pt), runs = []; let cur = [P[0]];
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1], L = Math.hypot(b.x - a.x, b.y - a.y) || 1e-9, at = t => ({ x: a.x + (b.x - a.x) * t / L, y: a.y + (b.y - a.y) * t / L });
    const gaps = doors.filter(g => g.si === i).map(g => [g.s - g.w / 2, g.s + g.w / 2]).sort((x, y) => x[0] - y[0]);
    for (const [g0, g1] of gaps) { if (g0 > .001) cur.push(at(g0)); if (cur.length > 1) runs.push(cur); cur = [at(g1)]; }
    cur.push(b);
  }
  if (cur.length > 1) runs.push(cur);
  return runs;
}
function paredConHuecos(o, runs, id) {   // dibuja la pared por tramos (con extremos redondos solo en los extremos reales)
  const est = `fill="none" stroke="${o.c}" stroke-width="${o.w}" stroke-dasharray="${o.d}" stroke-linejoin="round" stroke-linecap="butt"`, P = o.pts.map(pt);
  let h = runs.map(r => `<polyline points="${r.map(q => q.x + ',' + q.y).join(' ')}" ${est}/>`).join('');
  [[P[0], runs[0][0]], [P[P.length - 1], runs[runs.length - 1][runs[runs.length - 1].length - 1]]].forEach(([e, r]) => { if (e.x == r.x && e.y == r.y) h += `<circle cx="${e.x}" cy="${e.y}" r="${o.w / 2}" fill="${o.c}" pointer-events="none"/>`; });
  return h + `<polyline ${id} points="${P.map(q => q.x + ',' + q.y).join(' ')}" fill="none" stroke="transparent" stroke-width="${Math.max(.3, o.w)}" pointer-events="stroke"/>`;
}

// ---------- Colocar: vista previa al pasar sobre una pared ----------
let prevPuerta = null;                   // {d: puerta (virtual o existente con 2 hojas), ex: puerta existente a la que se añade la 2.ª hoja, msg}
const PUERTA_W = .9, PUERTA_MIN = .4;
function segmentoCercano(r, dmax = .5) { // tramo de pared más cercano al punto r: {o, si, a, u, L, t, dist}
  let best = null, bd = dmax;
  S.objs.filter(esVisible).forEach(o => {
    if (o.k != 'line' || o.n != 'Pared') return; const P = o.pts.map(q => pt(q));
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1], L = Math.hypot(b.x - a.x, b.y - a.y); if (L < .4) continue;
      const u = { x: (b.x - a.x) / L, y: (b.y - a.y) / L }, t = Math.min(Math.max((r.x - a.x) * u.x + (r.y - a.y) * u.y, 0), L), dist = Math.hypot(r.x - (a.x + u.x * t), r.y - (a.y + u.y * t));
      if (dist < bd) { bd = dist; best = { o, si: i, a, u, L, t, dist }; }
    }
  });
  return best;
}
function puertaHover(r) {
  const sg = segmentoCercano(r); if (!sg) return null;
  const otras = puertasDe(sg.o.id).filter(d => d.si == sg.si).map(d => ({ d, g: geoPuerta(d) })).filter(x => x.g);
  const ex = otras.find(x => Math.abs(sg.t - x.g.s) <= x.g.w / 2);
  if (ex) return ex.d.hojas >= 2 ? { msg: 'Esta división ya tiene dos puertas (máximo)', d: ex.d } : { d: { ...ex.d, hojas: 2 }, ex: ex.d };   // sobre una puerta: se añade la 2.ª hoja
  const w = Math.min(PUERTA_W, sg.L), s = Math.min(Math.max(Math.round(sg.t * 20) / 20, w / 2), sg.L - w / 2);
  if (otras.some(x => Math.abs(s - x.g.s) < (w + x.g.w) / 2)) return { msg: 'No cabe: se solaparía con otra puerta' };
  const n = { x: -sg.u.y, y: sg.u.x }, lado = (r.x - sg.a.x) * n.x + (r.y - sg.a.y) * n.y >= 0 ? 1 : -1;   // abre hacia el lado de la pared donde está el cursor
  return { d: { k: 'puerta', pared: sg.o.id, si: sg.si, s, w, lado, hojas: 1, bis: 'izq' } };
}
function puertaPrevia() {                // la pared se "abre" y se ve la puerta con su recorrido, aún sin colocar
  if (!prevPuerta || prevPuerta.msg || !(tool && tool.k == 'puerta')) return '';
  const g = geoPuerta(prevPuerta.d); if (!g) return '';
  return `<line x1="${g.p0.x}" y1="${g.p0.y}" x2="${g.p1.x}" y2="${g.p1.y}" stroke="#fff" stroke-width="${g.o.w + .03}" pointer-events="none"/><g opacity=".8" pointer-events="none">${simboloPuerta(g)}</g>`;
}
function colocarPuerta(e) {              // clic con la herramienta Puerta
  const pv = puertaHover(rawW(e));
  if (!pv) avisoMsg = '⚠ Las puertas solo se pueden poner sobre una pared';
  else if (pv.msg) avisoMsg = '⚠ ' + pv.msg;
  else {
    const wall = byId(pv.d.pared);
    if (!esEditable(wall)) avisoMsg = '⚠ La pared está en una capa oculta o bloqueada';
    else if (pv.ex) { push(); pv.ex.hojas = 2; }
    else { const d = add(pv.d); d.pl = wall.pl; d.cp = wall.cp; }   // la puerta queda en la misma planta y capa que su pared
  }
  render();
}

// ---------- Editar una puerta ya colocada ----------
function redimPuerta(d, h, r) {          // estirar por un costado: el otro extremo del hueco queda fijo
  const g = geoPuerta(d); if (!g) return;
  const t = Math.min(Math.max(Math.round(((r.x - g.a.x) * g.u.x + (r.y - g.a.y) * g.u.y) * 20) / 20, 0), g.L), izq = g.s - g.w / 2, der = g.s + g.w / 2;
  const L = h == 'da' ? Math.min(t, der - PUERTA_MIN) : izq, R = h == 'db' ? Math.max(t, izq + PUERTA_MIN) : der;
  d.w = +(R - L).toFixed(3); d.s = +((L + R) / 2).toFixed(3);
}
function moverPuerta(d, r) {             // arrastrar la puerta: se desliza por la pared (o salta a otra pared cercana)
  const sg = segmentoCercano(r, .6); if (!sg) return;
  const g = geoPuerta(d), w = Math.min(d.w, sg.L), s = Math.min(Math.max(Math.round(sg.t * 20) / 20, w / 2), sg.L - w / 2);
  const choca = S.objs.some(x => x.k == 'puerta' && x !== d && x.pared == sg.o.id && x.si == sg.si && geoPuerta(x) && Math.abs(geoPuerta(x).s - s) < (w + geoPuerta(x).w) / 2);
  if (choca) return; d.pared = sg.o.id; d.si = sg.si; d.s = s; if (g && sg.o.pl !== undefined) { d.pl = sg.o.pl; d.cp = sg.o.cp; }
}
function voltearPuerta(que) {            // F: cambia el lado hacia donde abre · H: cambia el extremo de la bisagra (una sola hoja)
  const ds = seleccionados().filter(o => o.k == 'puerta'); if (!ds.length) return; push();
  ds.forEach(d => { if (que == 'lado') d.lado = -d.lado; else d.bis = d.bis == 'der' ? 'izq' : 'der'; }); render();
}
function bboxPuerta(d) {
  const g = geoPuerta(d); if (!g) return { xs: [0], ys: [0] };
  const r = g.hojas == 2 ? g.w / 2 : g.w, k = { x: g.n.x * g.lado * r, y: g.n.y * g.lado * r }, P = [g.p0, g.p1, { x: g.p0.x + k.x, y: g.p0.y + k.y }, { x: g.p1.x + k.x, y: g.p1.y + k.y }];
  return { xs: P.map(q => q.x), ys: P.map(q => q.y) };
}
