// ===== escaleras.js: la escalera se dibuja como en planta (borde igual al de una pared, peldaños separados del borde y la flecha ▲ Escalera), se escala con 8 asas, muestra sus medidas y su color se puede cambiar =====
const PELDANO = .28;                      // separación entre peldaños (m): al alargar la escalera aparecen más
function dibujarEscalera(o, id, on, hd, baja = false) {   // baja = true: la flecha apunta hacia abajo (reflejo en la planta de arriba)
  const w = o.w, h = o.h, n = Math.max(2, Math.round(h / PELDANO)), paso = h / n, fs = Math.max(.1, Math.min(.3, w / 6.5));
  const c = o.c || '#444444', BORDE = .2, SEP = .08, x0 = -w / 2 + BORDE / 2 + SEP, x1 = w / 2 - BORDE / 2 - SEP;   // BORDE = grosor de una pared; SEP = separación de los peldaños al borde
  let g = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#fff" stroke="${c}" stroke-width="${BORDE}" stroke-linejoin="round"/>`;
  if (x1 > x0) for (let i = 1; i < n; i++) g += `<line x1="${x0}" y1="${-h / 2 + i * paso}" x2="${x1}" y2="${-h / 2 + i * paso}" stroke="${c}" stroke-opacity=".6" stroke-width=".03" pointer-events="none"/>`;
  g += `<text x="0" y="0" font-size="${fs}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#1d2a2f" stroke="#fff" stroke-width="${fs * .3}" paint-order="stroke" font-family="Segoe UI,Arial,sans-serif" pointer-events="none">${baja ? '▼' : '▲'} Escalera</text>`;
  let r = `<g ${id} transform="translate(${o.x} ${o.y}) rotate(${o.rot || 0})">${g}</g>`;
  if (o.label) r += T(o.x, bboxDe(o).y1 + .3, o.label);
  if (!on) return r;
  const rot = o.rot ? ` transform="rotate(${o.rot} ${o.x} ${o.y})"` : '';
  r += `<g${rot} pointer-events="none"><rect x="${o.x - w / 2 - .1}" y="${o.y - h / 2 - .1}" width="${w + .2}" height="${h + .2}" fill="none" stroke="#e0a030" stroke-dasharray=".15 .1" stroke-width=".04"/>${cotasForma(o)}</g>`;   // marco y medidas (ancho y alto)
  return r + manijasForma(o, hd);
}

// ---------- Escaleras de la planta de abajo ----------
// Una escalera de la planta inmediatamente inferior (la de justo debajo en el panel) se ve también en la planta actual,
// en el mismo lugar, con el mismo diseño, tamaño y giro, pero con la flecha hacia abajo (▼ Escalera: es por donde se baja). Es un reflejo: no se puede seleccionar ni mover desde aquí (se edita en su planta)
// y, si cambia o se mueve allá, aquí cambia igual. Se oculta si la capa de la escalera original está oculta.
function escalerasDeAbajo() {
  const i = S.plantas.findIndex(p => p.id == S.plantaAct); if (i < 1) return [];
  const q = S.plantas[i - 1], aca = S.objs.filter(o => o.k == 'item' && o.n == 'Escalera' && o.pl == S.plantaAct);
  return S.objs.filter(o => o.k == 'item' && o.n == 'Escalera' && o.pl == q.id && (capaDe(o) || {}).visible
    && !aca.some(a => Math.abs(a.x - o.x) < .01 && Math.abs(a.y - o.y) < .01 && Math.abs(a.w - o.w) < .01 && Math.abs(a.h - o.h) < .01 && (a.rot || 0) == (o.rot || 0)));   // si ya hay una igual en esta planta, no se repite
}
function escalerasFantasma() {           // se dibujan debajo de todo lo de la planta actual y sin recibir clics
  return escalerasDeAbajo().map(o => `<g pointer-events="none" opacity=".6">${dibujarEscalera(o, '', false, null, true)}</g>`).join('');
}

// ---------- No se puede tapar la escalera de la planta de abajo ----------
// Al colocar una escalera, si su rectángulo (con giro) pisa total o parcialmente a una escalera de la planta inmediatamente inferior, no se coloca y salta un aviso.
// Si solo se tocan por el borde no cuenta como obstrucción.
function polyEsc(o) {                    // esquinas reales (con giro) de una escalera
  const { xs, ys } = esqRot([[o.x - o.w / 2, o.y - o.h / 2], [o.x + o.w / 2, o.y - o.h / 2], [o.x + o.w / 2, o.y + o.h / 2], [o.x - o.w / 2, o.y + o.h / 2]], { x: o.x, y: o.y }, o.rot || 0);
  return xs.map((x, i) => ({ x, y: ys[i] }));
}
function solapanPoly(A, B) {             // dos rectángulos (eje de separación): true si se pisan
  for (const P of [A, B]) for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], nx = -(b.y - a.y), ny = b.x - a.x, pr = Q => Q.map(q => q.x * nx + q.y * ny), pa = pr(A), pb = pr(B);
    if (Math.max(...pa) <= Math.min(...pb) + 1e-6 || Math.max(...pb) <= Math.min(...pa) + 1e-6) return false;
  }
  return true;
}
function escaleraObstruida(t) {          // escalera de la planta de abajo que taparía la nueva escalera t (o null)
  const i = S.plantas.findIndex(p => p.id == S.plantaAct); if (i < 1) return null;
  const q = S.plantas[i - 1], P = polyEsc(t);
  const o = S.objs.find(o => o.k == 'item' && o.n == 'Escalera' && o.pl == q.id && solapanPoly(P, polyEsc(o)));
  return o ? { o, planta: q } : null;
}
function avisoEmergente(msg) {           // cartel visible en el centro del área de trabajo durante unos segundos
  let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'alert'); el.style.cssText = 'position:absolute;left:50%;top:40px;transform:translateX(-50%);z-index:5;max-width:min(460px,90%);padding:12px 16px;border-radius:10px;background:#b52b27;color:#fff;font-size:14px;box-shadow:0 6px 22px rgba(20,35,43,.35);pointer-events:none'; $('#work').appendChild(el); }
  el.textContent = '⚠ ' + msg; el.hidden = false; clearTimeout(avisoEmergente.t); avisoEmergente.t = setTimeout(() => { el.hidden = true; }, 4000);
}
