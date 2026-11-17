// ===== medidas.js: cotas estilo AutoCAD. Una medición = punto a, punto b y "off" (distancia perpendicular a la que se estira la cota) =====
function normalMed(m) {
  const dx = m.b.x - m.a.x, dy = m.b.y - m.a.y, L = Math.hypot(dx, dy) || 1e-9;
  return { dx, dy, L, nx: -dy / L, ny: dx / L };            // (nx, ny) = perpendicular unitaria a la medición
}
function offDe(m, p) {                                       // distancia con signo del cursor a la línea a-b (pegada a 0 si está muy cerca)
  const n = normalMed(m); let o = (p.x - m.a.x) * n.nx + (p.y - m.a.y) * n.ny;
  o = Math.round(o * 20) / 20; return Math.abs(o) < .1 ? 0 : o;
}
function cota(o, id, on, hd) {
  const { dx, dy, L, nx, ny } = normalMed(o), off = o.off || 0, ux = dx / L, uy = dy / L, col = o.col || '#d35400', s = Math.sign(off);   // o.col y o.txt: solo los ponen las ayudas de dibujo (medidaLado)
  const A = { x: o.a.x + nx * off, y: o.a.y + ny * off }, B = { x: o.b.x + nx * off, y: o.b.y + ny * off }, M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const ln = (x1, y1, x2, y2) => `<line pointer-events="none" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width=".03"/>`;
  let h = '';
  if (off) { const g = Math.min(.1, Math.abs(off) / 2); for (const [P, Q] of [[o.a, A], [o.b, B]]) h += ln(P.x + nx * s * g, P.y + ny * s * g, Q.x + nx * s * .15, Q.y + ny * s * .15); }  // líneas de extensión
  h += ln(A.x, A.y, B.x, B.y);
  const flecha = (t, sg) => { const bx = t.x + ux * .25 * sg, by = t.y + uy * .25 * sg; return `<polygon pointer-events="none" points="${t.x},${t.y} ${bx + nx * .07},${by + ny * .07} ${bx - nx * .07},${by - ny * .07}" fill="${col}"/>`; };
  h += flecha(A, 1) + flecha(B, -1);
  let ang = Math.atan2(dy, dx) * 180 / Math.PI; if (ang > 90) ang -= 180; else if (ang <= -90) ang += 180;   // texto siempre legible
  if (id) h += `<line ${id} x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="transparent" stroke-width=".4" pointer-events="stroke"/>`;   // sin id (ayuda de dibujo) no recibe clics
  h += `<g ${id} transform="translate(${M.x} ${M.y}) rotate(${ang})">${T(0, -.12, o.txt || fmt(L, o.u), .3)}</g>`;
  if (on) h += hd(o.a.x, o.a.y, 'a') + hd(o.b.x, o.b.y, 'b') + hd(M.x, M.y, 'o');   // 'o' = asa para estirar la cota
  return h;
}

function medidaLado(a, b, k = 1, txt, col) {   // longitud de un tramo, a un costado. k = escala de la cota: se dibuja en coordenadas divididas por k dentro de un grupo scale(k), así todo (texto, flechas, separación) cambia de tamaño junto
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy); if (L < .005) return '';
  const nx = -dy / L, ny = dx / L, arriba = ny < 0 || (ny == 0 && nx > 0);   // costado de arriba (o el derecho si el tramo es vertical)
  const h = cota({ a: { x: a.x / k, y: a.y / k }, b: { x: b.x / k, y: b.y / k }, off: arriba ? .5 : -.5, txt: txt || fmt(L), col }, '', false, null);
  return k == 1 ? h : `<g transform="scale(${k})" pointer-events="none">${h}</g>`;
}
// ---------- Ayudas al dibujar o seleccionar una línea (van en #g-tmp: no salen en el PNG ni cambian #c) ----------
// Largo de cada tramo; en verde con ↔ / ↕ si está exactamente horizontal o vertical, y si no con su ángulo. Su tamaño sigue al zoom (k): al alejar se agrandan y al acercar se achican, para que se lean siempre.
function ayudasLineas() {
  const k = 50 / V.z; let h = '';
  const texto = (a, b) => {
    const dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y), L = Math.hypot(dx, dy), recta = dx < 1e-6 || dy < 1e-6; if (L < .005) return null;
    return { recta, txt: recta ? (dy < 1e-6 ? '↔ ' : '↕ ') + fmt(L) : fmt(L) + ' · ' + +(Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1) + '°' };
  };
  const tramo = (a, b) => { const t = texto(a, b); if (!t) return ''; h += medidaLado(a, b, k, t.txt, t.recta ? '#1e8e3e' : undefined); return t.txt; };
  const junto = (p, txts) => { txts = txts.filter(Boolean); if (txts.length) h += `<g transform="translate(${p.x} ${p.y}) scale(${k})" pointer-events="none">${txts.map((t, i) => T(1.2, -.5 + i * .4, t, .3)).join('')}</g>`; };   // medidas al lado del cursor, una debajo de otra
  if (tmp && tmp.k == 'line' && tmp.cur && tmp.pts.length) {             // tramo que se está dibujando: la medida va también junto al cursor
    const b = tmp.cur; junto(b, [tramo(pt(tmp.pts[tmp.pts.length - 1]), b)]);
  }
  const o = !tmp && !multi.length && byId(sel);
  if (o && o.k == 'line' && esVisible(o)) segmentosEnPlanta(o, S.plantaAct).forEach(P => P.slice(1).forEach((b, i) => tramo(P[i], b)));   // línea seleccionada (también mientras se estira): todos sus tramos de esta planta
  if (o && o.k == 'line' && drag && drag.m == 'h' && drag.o === o && o.pts[+drag.h]) {   // se estira una punta o un vértice: las medidas de sus tramos van también junto al cursor
    const i = +drag.h, p = pt(o.pts[i]), vec = [o.pts[i - 1], o.pts[i + 1]].filter(q => q && puntoEn(o, q));
    junto(p, vec.map(q => (texto(pt(q), p) || {}).txt));
  }
  return h;
}
