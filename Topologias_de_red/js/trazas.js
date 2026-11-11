// ===== trazas.js: un cable que atraviesa escaleras entre plantas es UN SOLO objeto (ajuste de la Fase 3, 01/11/2026) =====
// Formato (campos opcionales en los PUNTOS de un cable; los archivos sin ellos no cambian; registrados en esquema.js, R9):
//   pl, cp  = planta y capa a las que pertenece el punto (sin ellos: la planta y capa del cable, o.pl / o.cp = donde se empezó a dibujar).
//   es, ed  = el punto pertenece al recorrido de la escalera con id `es`; ed = 1 (sube) o -1 (baja). Los puntos consecutivos con el mismo es+ed forman UNA corrida.
//             Los puntos de una corrida los calcula la escalera (trazaEscalera): no se arrastran y sincronizarTrazas() los recoloca si la escalera se mueve, gira o cambia de tamaño.
// El recorrido de una escalera se parte en dos mitades que se repiten en el punto medio: la primera es de la planta de salida y la segunda de la de llegada.
// Cada planta ve en sólido su mitad y, translúcida, la otra mitad (como el reflejo de las escaleras). Borrar la escalera, o una planta o capa que el cable atraviesa, borra el cable completo (con aviso).
const plantaDe = (o, q) => q.pl || o.pl;                      // planta de un punto de un cable
const capaIdDe = (o, q) => q.cp || o.cp;
const capaPunto = (o, q) => { const p = S.plantas.find(x => x.id == plantaDe(o, q)); return p && p.capas.find(c => c.id == capaIdDe(o, q)); };
const esMultiplanta = o => o.k == 'line' && !!o.pts && o.pts.some(q => q.pl && q.pl != o.pl);
const puntoEn = (o, q) => (o.pl === undefined && !q.pl) || plantaDe(o, q) == S.plantaAct;          // el punto está en la planta actual
const puntoVisible = (o, q) => { const c = capaPunto(o, q); return plantaDe(o, q) == S.plantaAct && !!c && c.visible; };
const puntoEditable = (o, q) => { const c = capaPunto(o, q); return plantaDe(o, q) == S.plantaAct && !!c && c.visible && !c.bloqueada; };

// ---------- Geometría del recorrido ----------
const CARRIL = .13, CARRIL_DESC = .10;   // separación (m) entre el eje de la flecha de la escalera y el cable, para que la flecha no lo tape
function trazaLocal(E, sube) {           // {inicio, fin} en coordenadas locales (sin giro): inicio = mitad de la planta de salida, fin = la de llegada (el punto medio está en las dos)
  // Cada cable va a la DERECHA de su sentido de marcha, pegado a un costado de la flecha: así el que sube y el que baja (que recorre el camino al revés) quedan en carriles distintos y no chocan.
  const w = E.w, h = E.h, t = tipoEsc(E), c = Math.min;
  if (t == 'descanso') {                 // sube por el tramo izquierdo, da la vuelta en el descanso y sigue por el derecho (igual que la flecha de gDescanso)
    const Dl = c(h * .4, Math.max(.8, w / 2)), a0 = -w / 2 + BORDE / 2, a1 = -DV - DW / 2, xl = (a0 + a1) / 2, yL = -h / 2 + Dl * .72, yT = -h / 2 + Dl;
    const dF = Math.max(0, c(CARRIL, ((a1 - SEP) - (a0 + SEP)) / 2 - .03)), dL = Math.max(0, c(CARRIL_DESC, (yT - DW / 2) - yL - .03, yL - (-h / 2 + BORDE / 2) - .03));
    return sube ? { inicio: [[xl + dF, h / 2], [xl + dF, yL + dL], [0, yL + dL]], fin: [[0, yL + dL], [-xl - dF, yL + dL], [-xl - dF, h / 2]] }
                : { inicio: [[-xl + dF, h / 2], [-xl + dF, yL - dL], [0, yL - dL]], fin: [[0, yL - dL], [xl - dF, yL - dL], [xl - dF, h / 2]] };
  }
  if (t == 'espiral') {                  // 270° en sentido horario (al subir), de 195° a 435° (como gEspiral); el que sube va por dentro del anillo de la flecha y el que baja por fuera
    // Entra y sale por el CUARTO ABIERTO (abajo a la izquierda), en línea recta: sube en vertical cruzando el borde recto horizontal (izquierdo) y sale en horizontal cruzando el borde recto vertical (inferior); no atraviesa la pared curva.
    const rx = w / 2, ry = h / 2, dS = c(CARRIL, .3 * c(rx, ry)) / ((rx + ry) / 2), f = sube ? .62 - dS : .62 + dS, ext = c(.3, .5 * c(rx, ry));   // ext: cuánto sale del borde recto hacia el cuarto abierto
    const pc = (g, k = f) => { const q = g * Math.PI / 180; return [rx * k * Math.cos(q), ry * k * Math.sin(q)]; };
    const sentido = (g0, g1) => { const r = []; for (let g = g0; g1 >= g0 ? g <= g1 : g >= g1; g += g1 >= g0 ? 15 : -15) r.push(pc(g)); return r; };
    const entra = [pc(195)[0], ext], sale = [-ext, pc(435)[1]];                       // extremos en el cuarto abierto: bajo el inicio del arco y a la izquierda de su final
    return sube ? { inicio: [entra, ...sentido(195, 315)], fin: [...sentido(315, 435), sale] }
                : { inicio: [sale, ...sentido(435, 315)], fin: [...sentido(315, 195), entra] };
  }
  const d = Math.max(0, c(CARRIL, w / 2 - BORDE / 2 - SEP - .03));   // recta: sube por la derecha del eje de la flecha (este) y baja por su izquierda (oeste)
  return sube ? { inicio: [[d, h / 2], [d, 0]], fin: [[d, 0], [d, -h / 2]] } : { inicio: [[-d, -h / 2], [-d, 0]], fin: [[-d, 0], [-d, h / 2]] };
}
function trazaEscalera(E, sube) {        // {inicio, fin}: puntos del mundo; inicio = mitad de la planta desde la que se sale, fin = mitad de la planta a la que se llega (punto medio repetido)
  const L = trazaLocal(E, sube), c = { x: E.x, y: E.y }, rot = E.rot || 0;
  const mundo = ([x, y]) => { const p = rotP({ x: E.x + x, y: E.y + y }, c, rot); return { x: r3(p.x), y: r3(p.y) }; };
  return { inicio: L.inicio.map(mundo), fin: L.fin.map(mundo) };
}
function escaleraEn(r) {                 // escalera (real de esta planta o reflejo de la de abajo) bajo el punto r, por geometría (el reflejo no recibe clics del DOM)
  const dentro = E => {
    const l = rotP(r, { x: E.x, y: E.y }, -(E.rot || 0)), dx = l.x - E.x, dy = l.y - E.y; if (Math.abs(dx) > E.w / 2 || Math.abs(dy) > E.h / 2) return false;
    if (tipoEsc(E) != 'espiral') return true;
    const rx = E.w / 2, ry = E.h / 2; return (dx / rx) ** 2 + (dy / ry) ** 2 <= 1 && !(dx < 0 && dy > 0);   // la espiral deja libre el cuarto de abajo a la izquierda
  };
  return S.objs.filter(o => esEsc(o) && esVisible(o)).find(dentro) || escalerasDeAbajo().find(dentro) || null;
}

// ---------- Cruzar una escalera con el cable en curso ----------
function puedeCruzar(E, d) {            // reglas: subir desde una escalera de ESTA planta (arriba se verá su reflejo); bajar solo si justo debajo hay una escalera igual (mismo tipo, lugar, tamaño y giro), o si se hizo clic en el reflejo de la de abajo
  const i = S.plantas.findIndex(p => p.id == S.plantaAct), q = S.plantas[i + d], real = E.pl == S.plantaAct;
  if (!q) return { ok: false, motivo: d > 0 ? 'no hay planta superior' : 'no hay planta inferior' };
  if (d > 0) return real ? { ok: true } : { ok: false, motivo: 'esta escalera llega aquí desde abajo' };
  return !real || igualAbajo(E) ? { ok: true } : { ok: false, motivo: 'no hay una escalera igual justo debajo' };
}
function menuEscalera(E, e) {            // con un cable en curso, un clic sobre una escalera ofrece las dos plantas (desactivada la que no se puede)
  const i = S.plantas.findIndex(p => p.id == S.plantaAct), arr = S.plantas[i + 1], aba = S.plantas[i - 1], u = puedeCruzar(E, 1), v = puedeCruzar(E, -1);
  TR.ctx.abrirItems('Pasar el cable a…', [
    { id: 'sube', texto: u.ok ? '⬆ Planta superior: «' + arr.nombre + '»' : '⬆ Planta superior: ' + u.motivo, habil: u.ok },
    { id: 'baja', texto: v.ok ? '⬇ Planta inferior: «' + aba.nombre + '»' : '⬇ Planta inferior: ' + v.motivo, habil: v.ok }
  ], e, id => cruzarEscalera(E, id == 'sube' ? 1 : -1));
}
function cruzarEscalera(E, d) {          // agrega al cable en curso el recorrido de la escalera y pasa a la otra planta, donde se sigue dibujando desde la salida
  const t = tmp, i = S.plantas.findIndex(p => p.id == S.plantaAct), q = S.plantas[i + d];
  if (!t || t.k != 'line' || !q || !byId(E.id) || !puedeCruzar(E, d).ok) return false;
  const cd = q.capas.find(x => x.id == q.ca) || q.capas[0];
  if (!cd.visible || cd.bloqueada) { avisoEmergente('La capa «' + cd.nombre + '» de «' + q.nombre + '» está oculta o bloqueada: el cable no puede continuar ahí'); return false; }
  const { inicio, fin } = trazaEscalera(E, d > 0), aqui = { pl: S.plantaAct, cp: S.capaAct }, alla = { pl: q.id, cp: cd.id }; delete t.cur;
  inicio.forEach(p => t.pts.push({ x: p.x, y: p.y, ...aqui, es: E.id, ed: d })); fin.forEach(p => t.pts.push({ x: p.x, y: p.y, ...alla, es: E.id, ed: d }));
  S.plantaAct = q.id; S.capaAct = cd.id; panel(); render(); return true;   // no se llama a irPlanta: limpiaría el cable en curso
}

// ---------- Mantener el recorrido pegado a su escalera ----------
function corridas(o) {                   // [[desde, hasta]] de las corridas de escalera de un cable
  const r = []; for (let i = 0; i < o.pts.length;) { const q = o.pts[i]; if (!q.es) { i++; continue; } let j = i; while (j + 1 < o.pts.length && o.pts[j + 1].es == q.es && o.pts[j + 1].ed == q.ed) j++; r.push([i, j]); i = j + 1; }
  return r;
}
function sincronizarTrazas() {           // recoloca los puntos de cada corrida según su escalera (idempotente; se llama al dibujar los objetos)
  const lista = tmp && tmp.k == 'line' ? [...S.objs, tmp] : S.objs;
  for (const o of lista) {
    if (o.k != 'line' || !o.pts.some(q => q.es)) continue;
    for (const [i, j] of corridas(o)) {
      const E = byId(o.pts[i].es); if (!E || !esEsc(E)) continue;
      const { inicio, fin } = trazaEscalera(E, o.pts[i].ed > 0), todos = [...inicio, ...fin]; if (todos.length != j - i + 1) continue;
      todos.forEach((p, k) => { const q = o.pts[i + k]; if (q.x !== p.x || q.y !== p.y) { q.x = p.x; q.y = p.y; } });
    }
  }
}
function soltarTrazasHuerfanas() {       // las escaleras que ya no existen dejan sus puntos como puntos libres (conservan su lugar, planta y capa)
  S.objs.forEach(o => { if (o.k == 'line') o.pts.forEach(q => { if (q.es) { const E = byId(q.es); if (!E || !esEsc(E)) { delete q.es; delete q.ed; } } }); });
}
// Un cable que baja usando la escalera de ARRIBA (sus puntos de escalera llegan a una planta inferior a la de esa escalera) depende de la escalera igual que hay justo debajo.
// ver(o) = cómo quedaría cada escalera (null si se borra); rel(U, pid) = si importa ese caso. Devuelve los cables que se quedarían sin esa escalera de abajo.
function cablesSinApoyo(ver, rel = () => true) {
  const idx = id => S.plantas.findIndex(p => p.id == id), escs = S.objs.filter(esEsc).map(ver).filter(Boolean);
  return S.objs.filter(c => c.k == 'line' && c.pts.some(q => {
    const U0 = q.es && byId(q.es); if (!U0 || !esEsc(U0)) return false; const U = ver(U0); if (!U) return false;   // si se borra la propia escalera, lo resuelve borrar()
    const pid = plantaDe(c, q); if (idx(pid) >= idx(U.pl) || !rel(U, pid)) return false;
    return !escs.some(o => o.pl == pid && o.id !== U.id && igualEsc(o, U));
  }));
}
function soltarPunto(q) { const p = pt(q), n = { ...q, x: p.x, y: p.y }; delete n.ref; delete n.rl; delete n.ri; return n; }   // quita la unión a un objeto o nodo y conserva lo demás (planta, capa)

// ---------- Borrar plantas y capas ----------
const cuentaEn = (pid, cid) => S.objs.filter(o => (o.pl == pid && (!cid || o.cp == cid)) || (esMultiplanta(o) && o.pts.some(q => plantaDe(o, q) == pid && (!cid || capaIdDe(o, q) == cid)))).length;
const cruzaEn = (o, pid, cid) => esMultiplanta(o) && o.pts.some(q => plantaDe(o, q) == pid && (!cid || capaIdDe(o, q) == cid));
const cablesQueCruzan = (pid, cid) => S.objs.filter(o => cruzaEn(o, pid, cid)).length;
function podarCables(pid, cid) { S.objs = S.objs.filter(o => !cruzaEn(o, pid, cid)); }   // los cables que atraviesan esa planta (o capa) se borran completos, en todas las plantas

// ---------- Dibujo en la planta actual ----------
function segmentosEnPlanta(o, pid) {     // polilíneas (puntos reales) de un cable que están en la planta pid y en capas visibles, sin los tramos de escalera (esos los dibuja dibujarCableMP)
  if (!esMultiplanta(o)) return o.pl == pid && (capaDe(o) || {}).visible ? [o.pts.map(v => pt(v))] : [];
  const r = []; let g = [];
  const cierra = () => { if (g.length > 1) r.push(g); g = []; };
  o.pts.forEach(q => { const c = capaPunto(o, q); if (plantaDe(o, q) == pid && c && c.visible && !q.es) g.push(pt(q)); else cierra(); }); cierra();
  return r;
}
function dibujarCableMP(o, id, on, hd) { // cable con puntos de varias plantas: en la planta actual, su parte en sólido y la otra mitad de cada escalera translúcida
  const X = S.plantaAct, ed = esEditable(o), Q = o.pts.map(q => ({ q, p: pt(q) }));
  if (o.cur) Q.push({ q: { pl: X, cp: S.capaAct }, p: o.cur });
  const pla = i => plantaDe(o, Q[i].q), cap = i => capaPunto(o, Q[i].q), corr = new Array(Q.length).fill(null);
  for (let i = 0; i < Q.length;) {      // plantas que toca cada corrida de escalera
    const q = Q[i].q; if (!q.es) { i++; continue; } let j = i; const s = new Set([pla(i)]);
    while (j + 1 < Q.length && Q[j + 1].q.es == q.es && Q[j + 1].q.ed == q.ed) { j++; s.add(pla(j)); } for (let k = i; k <= j; k++) corr[k] = s; i = j + 1;
  }
  const estilo = i => {
    if (pla(i) != pla(i + 1)) return null;                                          // salto entre plantas (punto medio de la escalera): no se dibuja
    const c = cap(i); if (!c || !c.visible) return null;
    if (pla(i) == X) return 'sol';
    return corr[i] && corr[i] === corr[i + 1] && corr[i].has(X) ? 'fan' : null;     // la otra mitad de una escalera que toca esta planta
  };
  const grupos = []; let g = null;
  for (let i = 0; i < Q.length - 1; i++) {
    const st = estilo(i); if (!st) { g = null; continue; }
    if (!g || g.st != st) { g = { st, pts: [Q[i].p], esc: false }; grupos.push(g); }
    g.pts.push(Q[i + 1].p); if (corr[i] && corr[i] === corr[i + 1]) g.esc = true;
  }
  const est = `fill="none" stroke="${o.c}" stroke-width="${o.w}" stroke-dasharray="${o.d}" stroke-linecap="round" stroke-linejoin="round"`, ancho = Math.max(.3, o.w);
  let h = '';
  grupos.forEach(gr => {
    const s = gr.pts.map(q => `${q.x},${q.y}`).join(' ');
    h += `<polyline points="${s}" ${est}${gr.st == 'fan' ? ' opacity=".35"' : ''} pointer-events="none"/>`;
    const hit = `<polyline ${id} points="${s}" fill="none" stroke="transparent" stroke-width="${ancho}" pointer-events="stroke"/>`;
    if (gr.esc && ed) hitsOut.push(hit); else h += hit;                                // el cable dentro de una escalera se dibuja por encima de ella para poder agarrarlo
  });
  const g0 = grupos.find(x => x.st == 'sol'); if (o.label && g0) { const m = g0.pts[g0.pts.length >> 1]; h += T(m.x, m.y - .2, o.label); }
  if (on) Q.forEach(({ q, p }, i) => { if (!q.es && pla(i) == X && !(o.cur && i == Q.length - 1)) { const c = cap(i); if (c && c.visible && !c.bloqueada) hd(p.x, p.y, i); } });
  return h;
}
