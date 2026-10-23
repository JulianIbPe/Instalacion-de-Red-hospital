// ===== formas.js: las formas se pueden escalar (8 asas) y, al seleccionarlas, muestran sus medidas =====
const ASAS = { nw: [-1, -1], n: [0, -1], ne: [1, -1], e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0] };   // posición de cada asa respecto al centro (en medios lados)
const r3 = v => +v.toFixed(3);
function manijasForma(o, hd) {
  const fuera = o.n == 'Círculo' ? 0 : .22;   // en formas con lados, las asas de los costados salen un poco para no tapar el centro de cada lado
  return Object.entries(ASAS).map(([k, [fx, fy]]) => hd(o.x + fx * o.w / 2 + (fy == 0 ? fx * fuera : 0), o.y + fy * o.h / 2 + (fx == 0 ? fy * fuera : 0), k)).join('');
}
function redimensionar(o, h, p) {         // arrastrar un asa mueve ese lado/esquina; el lado opuesto se queda fijo
  let L = o.x - o.w / 2, R = o.x + o.w / 2, U = o.y - o.h / 2, B = o.y + o.h / 2; const min = .2;
  if (h.includes('e')) R = Math.max(p.x, L + min);
  if (h.includes('w')) L = Math.min(p.x, R - min);
  if (h.includes('s')) B = Math.max(p.y, U + min);
  if (h.includes('n')) U = Math.min(p.y, B - min);
  o.w = r3(R - L); o.h = r3(B - U); o.x = r3((L + R) / 2); o.y = r3((U + B) / 2);
}
function cotasForma(o) {                  // ancho (debajo), alto (a la izquierda) y, en el círculo, también el radio
  const L = o.x - o.w / 2, R = o.x + o.w / 2, U = o.y - o.h / 2, B = o.y + o.h / 2, g = .55, col = '#d35400';
  const ln = (x1, y1, x2, y2, w = .03) => `<line pointer-events="none" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}"/>`;
  let h = ln(L, B + g, R, B + g) + ln(L, B + .1, L, B + g + .12) + ln(R, B + .1, R, B + g + .12) + T(o.x, B + g + .38, 'ancho ' + fmt(o.w), .3);
  h += ln(L - g, U, L - g, B) + ln(L - .1, U, L - g - .12, U) + ln(L - .1, B, L - g - .12, B) + `<g transform="translate(${L - g - .15} ${o.y}) rotate(-90)">${T(0, 0, 'alto ' + fmt(o.h), .3)}</g>`;
  if (o.n == 'Círculo') {
    const igual = Math.abs(o.w - o.h) < .001;
    h += ln(o.x, o.y, R, o.y, .04) + `<circle pointer-events="none" cx="${o.x}" cy="${o.y}" r=".06" fill="${col}"/>` + T(o.x + o.w / 4, o.y - .12, (igual ? 'r ' : 'rx ') + fmt(o.w / 2), .28);
    if (!igual) h += ln(o.x, o.y, o.x, B, .04) + T(o.x + .1, o.y + o.h / 4, 'ry ' + fmt(o.h / 2), .28);
  }
  return h;
}

// ---------- Tipos de línea del contorno (formas y zonas) ----------   [nombre, grosor en m, patrón de trazo]
const LINEAS = { con: ['Continua', .05, ''], par: ['Gruesa (como pared)', .2, ''], dis: ['Discontinua', .06, '.3 .15'], pun: ['Punteada', .08, '.01 .13'], mix: ['Punto y raya', .06, '.35 .1 .02 .1'] };
function trazo(o) {                       // atributos SVG del contorno según el tipo de línea elegido (o.ls)
  const [, w, d] = LINEAS[o.ls] || LINEAS.con;
  return `stroke="${o.c}" stroke-width="${w}" stroke-dasharray="${d}" stroke-linecap="round" stroke-linejoin="round"`;
}

// ---------- Lados de las formas (todas menos el círculo) ----------
// Cada forma guarda sus vértices normalizados en o.u (respecto a su centro y tamaño; si no existe se usa SH[o.n]) y los lados borrados en o.hid.
// El lado i va del vértice i al (i+1). Al editar un vértice se recalcula el rectángulo (x, y, w, h) que contiene la forma.
const uDe = o => o.u || SH[o.n];
const ladoSel = () => selEdge && selEdge.id == sel ? selEdge.i : null;
function vertsAbs(o) { return uDe(o).map(q => ({ x: o.x + q[0] * o.w, y: o.y + q[1] * o.h })); }
function fijarVerts(o, A) {
  const xs = A.map(a => a.x), ys = A.map(a => a.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const w = Math.max(x1 - x0, .05), h = Math.max(y1 - y0, .05), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, r4 = v => +v.toFixed(4);
  o.u = A.map(a => [r4((a.x - cx) / w), r4((a.y - cy) / h)]); o.x = r3(cx); o.y = r3(cy); o.w = r3(w); o.h = r3(h);
}
function moverVertice(o, i, p) { const A = vertsAbs(o); A[i] = { x: p.x, y: p.y }; fijarVerts(o, A); }
function moverLado(o, i, dx, dy) {
  const A = vertsAbs(o), j = (i + 1) % A.length; A[i].x += dx; A[i].y += dy; A[j].x += dx; A[j].y += dy; fijarVerts(o, A);
}
function borrarLado() {                   // quita el contorno de ese lado (la forma queda "abierta"); si ya no queda ningún lado, se borra la forma
  const o = byId(sel), i = ladoSel(); if (!o || i === null) return; push();
  o.hid = [...(o.hid || []), i]; selEdge = null;
  if (o.hid.length >= uDe(o).length) { S.objs = S.objs.filter(x => x !== o); sel = null; }
  render();
}
function dibujarForma(o, id, on, hd) {
  const fill = `fill="${fillOf(o)}" fill-opacity="${o.f == 'sol' ? .35 : 1}"`, circulo = o.n == 'Círculo';
  const R = x => circulo && o.rot ? `<g transform="rotate(${o.rot} ${o.x} ${o.y})">${x}</g>` : x;   // el círculo (óvalo) puede estar girado
  let h;
  if (circulo) h = `<g ${id} transform="translate(${o.x} ${o.y})"><ellipse rx="${o.w / 2}" ry="${o.h / 2}" ${fill} ${trazo(o)}/></g>`;
  else {
    const u = uDe(o), n = u.length, hid = o.hid || [], P = u.map(q => [q[0] * o.w, q[1] * o.h]);
    let g = `<polygon points="${P.map(q => q.join(',')).join(' ')}" ${fill} ${hid.length ? 'stroke="none"' : trazo(o)} pointer-events="all"/>`;
    if (hid.length) g += P.map((q, i) => hid.includes(i) ? '' : `<line x1="${q[0]}" y1="${q[1]}" x2="${P[(i + 1) % n][0]}" y2="${P[(i + 1) % n][1]}" ${trazo(o)}/>`).join('');
    h = `<g ${id} transform="translate(${o.x} ${o.y})">${g}</g>`;
  }
  if (o.label) h += T(o.x, o.y + .1, o.label);
  if (!on) return R(h);
  const A = circulo ? [] : vertsAbs(o), e = ladoSel(), hid = o.hid || [];
  h += A.map((a, i) => { const b = A[(i + 1) % A.length]; return hid.includes(i) ? '' : `<line ${id} data-e="${i}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="transparent" stroke-width=".35" stroke-linecap="round" pointer-events="stroke"/>`; }).join('');   // zonas de clic de cada lado
  h += `<rect x="${o.x - o.w / 2 - .1}" y="${o.y - o.h / 2 - .1}" width="${o.w + .2}" height="${o.h + .2}" fill="none" stroke="#e0a030" stroke-dasharray=".15 .1" stroke-width=".04" pointer-events="none"/>` + cotasForma(o);
  if (!circulo && e !== null && A[e]) { const a = A[e], b = A[(e + 1) % A.length]; h += `<line pointer-events="none" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#e0a030" stroke-width=".12" stroke-linecap="round" opacity=".85"/>` + medidaLado(a, b) + hd(a.x, a.y, 'v' + e) + hd(b.x, b.y, 'v' + (e + 1) % A.length); }
  else h += manijasForma(o, hd);
  return R(h);
}
