// ===== escaleras.js: tres escaleras en planta (borde igual al de una pared, escalables con 8 asas, con medidas y color editable) =====
// Todas son objetos {k:'item', n:'Escalera'}; el campo `t` dice cuál es: sin t = recta, 'descanso' = con descanso, 'espiral' = espiral.
// (Así los archivos antiguos y todo lo que ya trataba "Escalera" siguen funcionando.)
const PELDANO = .28;                      // separación entre peldaños (m): al alargar la escalera aparecen más
const BORDE = .2, SEP = .08;              // BORDE = grosor de una pared; SEP = separación de los peldaños al borde
const DV = .11, DW = .16;                 // escalera con descanso: dos líneas gruesas (grosor DW, centradas a ±DV) con una ranura chica entre ellas (ancho 2·DV−DW)
const COL_SUBE = '#1d2a2f', COL_BAJA = '#2e86de';
const tipoEsc = o => o.t || 'recta';
const esEsc = o => o.k == 'item' && o.n == 'Escalera';
const NOMBRE_ESC = { recta: 'recta', descanso: 'con descanso', espiral: 'espiral' };

// ---------- Flechas de recorrido ----------
function punta(x, y, dx, dy, col, k = 1) {   // cabeza de flecha con la punta en (x,y) apuntando en la dirección (dx,dy)
  const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
  const L = .24 * k, W = .11 * k, bx = x - dx * L, by = y - dy * L;
  return `<polygon points="${x},${y} ${bx - dy * W},${by + dx * W} ${bx + dy * W},${by - dx * W}" fill="${col}" pointer-events="none"/>`;
}
const flecha = (d, col, hx, hy, dx, dy, k) => `<path d="${d}" fill="none" stroke="${col}" stroke-width=".05" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>`
  + `<path data-flecha="${col == COL_BAJA ? 'baja' : 'sube'}" d="${d}" fill="none" stroke="transparent" stroke-width=".3" stroke-linecap="round" pointer-events="stroke" style="cursor:pointer"/>`   // zona de clic de la flecha (doble clic = cambiar de planta, ver interaccion.js)
  + punta(hx, hy, dx, dy, col, k);

const rotulo = (x, y, fs, t = 'Escalera') => `<text x="${x}" y="${y}" font-size="${fs}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#1d2a2f" stroke="#fff" stroke-width="${fs * .3}" paint-order="stroke" font-family="Segoe UI,Arial,sans-serif" pointer-events="none">${t}</text>`;

// ---------- Cuerpo de las escaleras: solo borde y líneas, sin relleno (el interior es transparente pero se puede seleccionar) ----------
const fondoRect = (w, h, c) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="transparent" pointer-events="all" stroke="${c}" stroke-width="${BORDE}" stroke-linejoin="round"/>`;   // solo borde: sin relleno (el interior es transparente pero se puede seleccionar)

// ---------- Escalera recta ----------
// Cada gX devuelve [cuerpo, encima (flechas y nombre)]
function gRecta(o, baja) {
  const w = o.w, h = o.h, n = Math.max(2, Math.round(h / PELDANO)), paso = h / n, fs = Math.max(.04, Math.min(.3, w / 6.5));
  const c = o.c || '#444444', x0 = -w / 2 + BORDE / 2 + SEP, x1 = w / 2 - BORDE / 2 - SEP;
  let g = fondoRect(w, h, c);
  if (x1 > x0) for (let i = 1; i < n; i++) g += `<line x1="${x0}" y1="${-h / 2 + i * paso}" x2="${x1}" y2="${-h / 2 + i * paso}" stroke="${c}" stroke-opacity=".6" stroke-width=".03" pointer-events="none"/>`;
  const yb = h / 2 - .3, yt = -h / 2 + .3, k = Math.min(1, w / 1.2); let top = '';   // flecha por el eje: sube (negra) o, en el reflejo de la planta de abajo, baja (azul)
  if (yb - yt > .3) top += baja ? flecha(`M0 ${yt}V${yb}`, COL_BAJA, 0, yb, 0, 1, k) : flecha(`M0 ${yb}V${yt}`, COL_SUBE, 0, yt, 0, -1, k);
  top += rotulo(0, 0, fs);
  return [g, top];
}

// ---------- Escalera con descanso ----------
// Descanso arriba (-y), dos tramos de peldaños abajo separados por dos líneas gruesas con una ranura chica entre ellas (abierta hasta abajo).
// Se sube por el tramo izquierdo, se da la vuelta en el descanso y se sigue por el derecho.
function gDescanso(o, baja, doble) {
  const w = o.w, h = o.h, c = o.c || '#444444', Dl = Math.min(h * .4, Math.max(.8, w / 2)), yT = -h / 2 + Dl, hf = h - Dl;
  const n = Math.max(2, Math.round(hf / PELDANO)), paso = hf / n;
  const a0 = -w / 2 + BORDE / 2, a1 = -DV - DW / 2, x0 = a0 + SEP, x1 = a1 - SEP, xl = (a0 + a1) / 2, yL = -h / 2 + Dl * .72, yF = h / 2, yb = Math.max(h / 2 - .45, yL + .4), k = Math.min(1, w / 1.6);
  const rn = DV - DW / 2;   // la ranura entre las dos líneas gruesas corta el borde de abajo
  let g = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="transparent" pointer-events="all"/><path d="M${-rn} ${h / 2}H${-w / 2}V${-h / 2}H${w / 2}V${h / 2}H${rn}" fill="none" stroke="${c}" stroke-width="${BORDE}" stroke-linejoin="round"/>`;
  g += `<line x1="${-DV}" y1="${yT}" x2="${-DV}" y2="${yF}" stroke="${c}" stroke-width="${DW}"/><line x1="${DV}" y1="${yT}" x2="${DV}" y2="${yF}" stroke="${c}" stroke-width="${DW}"/>`;   // dos líneas gruesas con una ranura chica
  g += `<line x1="${a0}" y1="${yT}" x2="${-a0}" y2="${yT}" stroke="${c}" stroke-width="${DW}" pointer-events="none"/>`;   // borde del descanso (grueso, como las líneas divisorias)
  if (x1 > x0) for (let i = 1; i < n; i++) { const y = yT + i * paso; g += `<path d="M${x0} ${y}H${x1}M${-x1} ${y}H${-x0}" stroke="${c}" stroke-opacity=".6" stroke-width=".03" pointer-events="none"/>`; }
  let top = rotulo(0, -h / 2 + Dl * .3, Math.max(.04, Math.min(.25, w / 7)));
  const oa = doble ? Math.min(.1, Math.max(0, x1 - x0) * .25) : 0;
  const ruta = (off, col, inv) => { const xa = (inv ? -xl : xl) + off, xb = (inv ? xl : -xl) + off; return flecha(`M${xa} ${yb}V${yL}H${xb}V${yb}`, col, xb, yb, 0, 1, k); };
  if (!baja) top += ruta(doble ? -oa : 0, COL_SUBE, false);        // sube por la izquierda, da la vuelta y baja por la derecha
  if (baja || doble) top += ruta(doble ? oa : 0, COL_BAJA, true);  // recorrido de la planta de abajo: en sentido contrario
  return [g, top];
}

// ---------- Escalera espiral ----------
// Tres cuartos de vuelta (270°): empieza a la izquierda del eje y gira hacia la derecha (sentido horario). El cuarto de abajo a la izquierda queda abierto.
function gEspiral(o, baja, doble) {
  const rx = o.w / 2, ry = o.h / 2, c = o.c || '#444444', N = 12, da = 270 / N, kk = Math.min(1, Math.min(rx, ry) / .9);
  const pc = (a, f = 1) => { const r = a * Math.PI / 180; return { x: r3(rx * f * Math.cos(r)), y: r3(ry * f * Math.sin(r)) }; };
  const cuña = `M0 0L${-rx} 0A${rx} ${ry} 0 1 1 0 ${ry}Z`;
  let g = `<path d="${cuña}" fill="transparent" pointer-events="all" stroke="${c}" stroke-width="${BORDE}" stroke-linejoin="round"/>`;
  for (let i = 1; i < N; i++) { const p = pc(180 + i * da); g += `<line x1="0" y1="0" x2="${p.x}" y2="${p.y}" stroke="${c}" stroke-opacity=".6" stroke-width=".03" pointer-events="none"/>`; }
  g += `<circle cx="0" cy="0" r="${Math.min(.15, Math.max(.06, Math.min(rx, ry) * .1))}" fill="${c}" pointer-events="none"/>`;   // eje central
  let top = rotulo(-rx * .5, ry * .5, Math.max(.04, Math.min(.25, rx / 6.5)));
  const A0 = 195, A1 = 435;
  const arco = (f, col, inv) => {
    const a = pc(inv ? A1 : A0, f), b = pc(inv ? A0 : A1, f), r = (inv ? A0 : A1) * Math.PI / 180;
    let tx = -rx * Math.sin(r), ty = ry * Math.cos(r); if (inv) { tx = -tx; ty = -ty; }   // tangente en la punta (horaria; al revés si baja)
    return flecha(`M${a.x} ${a.y}A${r3(rx * f)} ${r3(ry * f)} 0 1 ${inv ? 0 : 1} ${b.x} ${b.y}`, col, b.x, b.y, tx, ty, kk);
  };
  if (!baja) top += arco(doble ? .76 : .62, COL_SUBE, false);
  if (baja || doble) top += arco(doble ? .46 : .62, COL_BAJA, true);
  return [g, top];
}

function dibujarEscalera(o, id, on, hd, baja = false) {   // baja = true: reflejo de la planta de abajo (flecha hacia abajo)
  const tipo = tipoEsc(o), w = o.w, h = o.h, doble = !baja && tipo != 'recta' && igualAbajo(o);   // doble = hay una igual justo debajo: se añade la flecha hacia abajo
  const [cuerpo, top] = tipo == 'descanso' ? gDescanso(o, baja, doble) : tipo == 'espiral' ? gEspiral(o, baja, doble) : gRecta(o, baja);
  const g = cuerpo + top;
  let r = `<g ${id} transform="translate(${o.x} ${o.y}) rotate(${o.rot || 0})">${g}</g>`;
  if (o.label) r += T(o.x, bboxDe(o).y1 + .3, o.label);
  if (!on) return r;
  const rot = o.rot ? ` transform="rotate(${o.rot} ${o.x} ${o.y})"` : '';
  r += `<g${rot} pointer-events="none"><rect x="${o.x - w / 2 - .1}" y="${o.y - h / 2 - .1}" width="${w + .2}" height="${h + .2}" fill="none" stroke="#e0a030" stroke-dasharray=".15 .1" stroke-width=".04"/>${cotasForma(o)}</g>`;   // marco y medidas (ancho y alto)
  return r + manijasForma(o, hd);
}

// ---------- Escaleras de la planta de abajo ----------
// Las escaleras de la planta inmediatamente inferior se ven también en la actual (mismo lugar, diseño, tamaño y giro) con la flecha hacia abajo.
// Es un reflejo: no se selecciona desde aquí. Si ya hay una igual (mismo tipo, lugar y tamaño) en esta planta no se repite: la escalera de esta planta lleva entonces su propia flecha hacia abajo.
function escalerasInferiores() {
  const i = S.plantas.findIndex(p => p.id == S.plantaAct); if (i < 1) return [];
  const q = S.plantas[i - 1]; return S.objs.filter(o => esEsc(o) && o.pl == q.id && (capaDe(o) || {}).visible);
}
const igualEsc = (a, b) => tipoEsc(a) == tipoEsc(b) && Math.abs(a.x - b.x) < .01 && Math.abs(a.y - b.y) < .01 && Math.abs(a.w - b.w) < .01 && Math.abs(a.h - b.h) < .01 && (a.rot || 0) == (b.rot || 0);
const igualAbajo = o => escalerasInferiores().some(l => igualEsc(l, o));
function escalerasDeAbajo() {
  const aca = S.objs.filter(o => esEsc(o) && o.pl == S.plantaAct);
  return escalerasInferiores().filter(o => !aca.some(a => igualEsc(a, o)));
}
function escalerasFantasma() {           // se dibujan debajo de todo lo de la planta actual y sin recibir clics (salvo la flecha: doble clic en ella baja a la planta inferior)
  return escalerasDeAbajo().map(o => `<g pointer-events="none" opacity=".6">${dibujarEscalera(o, '', false, null, true)}</g>`).join('');
}

// ---------- Reglas al colocar sobre la escalera de la planta de abajo ----------
// · Escalera recta: no puede pisar ninguna escalera de la planta inferior.
// · Con descanso / espiral: si pisa una escalera de OTRO tipo, no se coloca; si pisa una del MISMO tipo, solo se coloca exactamente encima (mismo lugar, tamaño y giro);
//   si no pisa ninguna, se coloca donde quieras.
function polyEsc(o) {                    // esquinas reales (con giro) de una escalera
  const { xs, ys } = esqRot([[o.x - o.w / 2, o.y - o.h / 2], [o.x + o.w / 2, o.y - o.h / 2], [o.x + o.w / 2, o.y + o.h / 2], [o.x - o.w / 2, o.y + o.h / 2]], { x: o.x, y: o.y }, o.rot || 0);
  return xs.map((x, i) => ({ x, y: ys[i] }));
}
function solapanPoly(A, B) {             // dos rectángulos (eje de separación): true si se pisan (si solo se tocan por el borde, no)
  for (const P of [A, B]) for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], nx = -(b.y - a.y), ny = b.x - a.x, pr = Q => Q.map(q => q.x * nx + q.y * ny), pa = pr(A), pb = pr(B);
    if (Math.max(...pa) <= Math.min(...pb) + 1e-6 || Math.max(...pb) <= Math.min(...pa) + 1e-6) return false;
  }
  return true;
}
function encajarAbajo(t) {               // imán: una escalera con descanso/espiral casi encima de una igual de la planta de abajo se ajusta exactamente a ella
  if (tipoEsc(t) == 'recta') return;
  const i = S.plantas.findIndex(p => p.id == S.plantaAct); if (i < 1) return; const q = S.plantas[i - 1];
  const o = S.objs.find(o => esEsc(o) && o.pl == q.id && tipoEsc(o) == tipoEsc(t) && Math.hypot(o.x - t.x, o.y - t.y) < .3
    && Math.abs(Math.max(o.w, o.h) - Math.max(t.w, t.h)) < .3 && Math.abs(Math.min(o.w, o.h) - Math.min(t.w, t.h)) < .3);
  if (o) { t.x = o.x; t.y = o.y; t.w = o.w; t.h = o.h; t.rot = o.rot || 0; }
}
function escaleraObstruida(t) {          // null si se puede colocar; si no, {o, planta, msg} con el motivo
  const i = S.plantas.findIndex(p => p.id == S.plantaAct); if (i < 1) return null;
  const q = S.plantas[i - 1], P = polyEsc(t), tt = tipoEsc(t);
  for (const o of S.objs) {
    if (!(esEsc(o) && o.pl == q.id && solapanPoly(P, polyEsc(o)))) continue;
    const to = tipoEsc(o), r = { o, planta: q };
    if (tt == 'recta') return { ...r, msg: 'No se puede colocar la escalera aquí: obstruye la escalera de «' + q.nombre + '» (planta inferior)' };
    if (to != tt) return { ...r, msg: 'No se puede colocar la escalera ' + NOMBRE_ESC[tt] + ' aquí: debajo hay una escalera ' + NOMBRE_ESC[to] + ' en «' + q.nombre + '». Solo puede ir sobre una del mismo tipo' };
    if (!igualEsc(t, o)) return { ...r, msg: 'Debajo hay una escalera ' + NOMBRE_ESC[tt] + ' en «' + q.nombre + '»: debe colocarse exactamente encima (mismo lugar y tamaño)' };
  }
  return null;
}
function avisoEmergente(msg) {           // cartel visible en el centro del área de trabajo durante unos segundos
  let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'alert'); el.style.cssText = 'position:absolute;left:50%;top:40px;transform:translateX(-50%);z-index:5;max-width:min(460px,90%);padding:12px 16px;border-radius:10px;background:#b52b27;color:#fff;font-size:14px;box-shadow:0 6px 22px rgba(20,35,43,.35);pointer-events:none'; $('#work').appendChild(el); }
  el.textContent = '⚠ ' + msg; el.hidden = false; clearTimeout(avisoEmergente.t); avisoEmergente.t = setTimeout(() => { el.hidden = true; }, 4000);
}

// ---------- Cambiar de planta con doble clic (flecha de una escalera o ascensor; ver interaccion.js) ----------
function irPlanta(d) {                   // pasa a la planta de arriba (d = 1) o de abajo (d = -1), igual que pulsar su nombre en el panel
  const i = S.plantas.findIndex(p => p.id == S.plantaAct), q = S.plantas[i + d];
  if (!q) { avisoEmergente(d > 0 ? 'No hay una planta superior: añade una con «＋ Planta»' : 'No hay una planta inferior'); return; }
  S.plantaAct = q.id; S.capaAct = (q.capas.find(x => x.id == q.ca) || q.capas[0]).id; limpiarSel(); panel(); render();
}
