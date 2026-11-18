// ---------- Interacción ----------
const col = () => $('#col').value, fil = () => $('#fill').value, lin = () => $('#lstyle').value;
const add = o => (push(), o.id = nid++, o.pl = o.pl === undefined ? S.plantaAct : o.pl, o.cp = o.cp === undefined ? S.capaAct : o.cp, completarTipo(o), S.objs.push(o), o);   // un cable que ya trae su planta y capa (donde se empezó a dibujar) las conserva aunque termine en otra planta
function arrastrar(d) {                  // arrastre que modifica objetos (mover, asas, girar): guarda qué objetos cambia, copia de sus escaleras y el rehacer, para poder volver atrás al soltar
  d.os = d.os || (d.o ? [d.o] : d.lista ? d.lista.map(x => x.o) : []); d.antes = d.os.filter(o => o && esEsc(o)).map(copiar); d.fut = fut.slice(); return drag = d;
}
function moverObjs(os, dx, dy, raw, aj = sn) {   // mueve varios objetos a la vez (arrastre o flechas). raw = cursor real, para deslizar puertas (sin él no se mueven); aj = ajuste de la posición final
  os.forEach(o => {
    if (o.k == 'line') o.pts.forEach(q => { if (!q.ref && !q.rl && !q.es && puntoEn(o, q)) { q.x += dx; q.y += dy; } });   // solo los puntos libres de ESTA planta (los de escalera siguen a su escalera)
    else if (o.k == 'puerta') { if (raw && !os.some(x => x.id == o.pared)) moverPuerta(o, raw); }   // se desliza por la pared
    else if (o.k == 'medida') { o.a = { x: o.a.x + dx, y: o.a.y + dy }; o.b = { x: o.b.x + dx, y: o.b.y + dy }; }
    else { o.x = aj(o.x + dx); o.y = aj(o.y + dy); }
  });
}
function orto(a, p) {                    // Mayús: lleva p a la horizontal, la vertical o la diagonal de 45° que pasa por a (la que quede más cerca)
  const dx = p.x - a.x, dy = p.y - a.y, ax = Math.abs(dx), ay = Math.abs(dy), T22 = .4142;   // tan(22,5°)
  if (ay <= ax * T22) return { x: p.x, y: a.y }; if (ax <= ay * T22) return { x: a.x, y: p.y };
  const m = sn((ax + ay) / 2); return { x: r3(a.x + Math.sign(dx) * m), y: r3(a.y + Math.sign(dy) * m) };
}
function soltarArrastre() {              // fin de un arrastre (soltar o puntero cancelado): una escalera que quedó en un lugar no válido descarta el paso del arrastre
  if (drag && drag.pu && drag.antes && revisarEscalerasMovidas(drag.os, drag.antes)) descartarPaso(drag.fut);
  else if (drag && drag.pu) { if (drag.m == 'h' && drag.o.k == 'line') empalmar(drag.o); TR.jer.alSoltarArrastre(drag); }   // F6: anclar o desanclar equipos de las mesas; un giro que no entra en su mesa se descarta
  drag = null; render();
}
function finishLine() {
  if (!tmp || tmp.k != 'line') return; const q = tmp.pts, a = q[q.length - 1], b = q[q.length - 2];
  if (b && Math.hypot(a.x - b.x, a.y - b.y) < .05 && !a.ref && !a.es) q.pop();
  if (q.length > 1) { delete tmp.cur; add(tmp); empalmar(tmp); } tmp = null; render();   // empalmar después de add: el vértice nuevo del otro cable entra en el mismo paso
}
svg.addEventListener('pointerdown', e => {
  svg.setPointerCapture(e.pointerId); let p = toW(e); avisoMsg = '';
  if (e.button == 2) {                                            // clic derecho: termina el cable, cancela la medición o la pieza a medio colocar; sin herramienta ni operación en curso abre el menú contextual (Fase 3)
    const enCurso = !!tmp || !!drag; finishLine();
    if (tmp && (tmp.k == 'medida' || tmp.pa)) { tmp = null; drag = null; render(); } else if (!tool && !enCurso) TR.ctx.abrir(e);
    return;
  }
  if (e.button == 1) { drag = { m: 'pan', sx: e.clientX, sy: e.clientY, ox: V.ox, oy: V.oy }; return; }
  // Doble clic detectado a mano: la página se redibuja en cada clic y el evento 'dblclick' nativo se pierde.
  const now = Date.now(), dbl = (!e.shiftKey || !!tmp) && now - lastDown.t < 350 && Math.hypot(e.clientX - lastDown.x, e.clientY - lastDown.y) < 6;
  lastDown = { t: dbl ? 0 : now, x: e.clientX, y: e.clientY };
  if (dbl) {
    if (tmp && tmp.k == 'line') { finishLine(); return; }
    const t = e.target.closest('[data-id]'), o = t && byId(t.dataset.id);
    const fl = !tool && flechaEn(e);                                    // flecha de una escalera: la negra sube de planta y la azul baja
    if (fl) { drag = null; irPlanta(fl == 'baja' ? -1 : 1); return; }
    if (!tool && o && esAscensor(o) && !e.altKey) {                 // ascensor: sube (o baja si ya es la planta más alta); Alt+doble clic = etiqueta
      const i = S.plantas.findIndex(p => p.id == S.plantaAct); drag = null; irPlanta(i < S.plantas.length - 1 || i < 1 ? 1 : -1); return;
    }
    if (!tool && o && o.k == 'line' && esCable(o) && !e.target.closest('[data-h]')) {   // doble clic en un tramo de cable: nodo nuevo ahí, ya agarrado para plegar el cable (un paso)
      const t = tramoEnergia(p, 18 / V.z, [o]);
      if (t) { push(); const i = insertarVertice(o, t); sel = o.id; multi = []; arrastrar({ m: 'h', o, h: String(i), p0: p, pu: 1 }); render(); return; }
    }
    if (!tool && o && TR.rack.esRack(o)) { drag = null; TR.vr.abrir(o.id); return; }   // F8: doble clic en un rack abre su vista (la etiqueta se edita en el menú o el inspector)
    if (!tool && o && o.k != 'medida') { const v = prompt('Etiqueta:', o.label || ''); if (v !== null && v !== (o.label || '')) { push(); o.label = v; drag = null; render(); } return; }
  }
  if (!tool) {
    if (e.target.closest('[data-rot]')) { iniciarRot(); render(); return; }   // asa de rotación
    const hh = e.target.closest('[data-h]'), t = e.target.closest('[data-id]'), ed = e.target.closest('[data-e]'), prevEdge = selEdge; selEdge = null;
    // Mayús + clic izquierdo: si no se arrastra, añade/quita el objeto de la selección; si se arrastra, dibuja un rectángulo de selección
    const gr = e.target.closest('[data-grab]');   // hoja de una puerta: se agarra directamente para girarla
    if (gr && t && !e.shiftKey) { const dd = byId(+t.dataset.id); if (dd && dd.k == 'puerta') { sel = dd.id; multi = []; arrastrar({ m: 'h', o: dd, h: 'gi', p0: p }); render(); return; } }
    if (e.shiftKey && !(hh && byId(sel))) { const r = rawW(e); drag = { m: 'box', id: t ? +t.dataset.id : null, sx: e.clientX, sy: e.clientY, x0: r.x, y0: r.y, moved: false }; return; }
    if (hh && byId(sel)) { selEdge = prevEdge; arrastrar({ m: 'h', o: byId(sel), h: hh.dataset.h, p0: p }); }
    else if (t && ed && +t.dataset.id === sel && !multi.length) { selEdge = { id: sel, i: +ed.dataset.e }; drag = { m: 'lado', o: byId(sel), i: selEdge.i, last: p }; }   // clic en un lado de la forma ya seleccionada
    else if (t) { const id = TR.sup.prioridad(+t.dataset.id, rawW(e));   // F10A: sobre cables superpuestos gana el destacado
      if (!multi.includes(id)) { sel = id; multi = []; } arrastrar({ m: 'mv', os: seleccionados(), last: p, p0: p }); }
    else { sel = null; multi = []; drag = { m: 'pan', sx: e.clientX, sy: e.clientY, ox: V.ox, oy: V.oy }; }
    render(); return;
  }
  if (tool.k == 'puerta') { colocarPuerta(e); return; }   // las puertas validan la capa de su pared
  if (!capaEditable()) { avisoMsg = '⚠ La capa «' + capaActual().nombre + '» está oculta o bloqueada: elige otra capa para dibujar'; render(); return; }
  if (tool.k == 'line' && tmp && tmp.k == 'line') {          // cable a medio dibujar: un clic sobre una escalera ofrece pasarlo a la planta de arriba o de abajo (ver trazas.js); Esc cancela ese clic
    const E = escaleraEn(rawW(e));                                      // se busca por geometría: el reflejo de la escalera de abajo no recibe clics del DOM
    if (E) { menuEscalera(E, e); return; }
  }
  if (usaDosPuntos(tool)) { snapPt = null; snapNodo = null; snapMedio = false; imanNodos(rawW(e)); if (!snapPt) imanMedio(rawW(e)); if (snapPt) p = { x: snapPt.x, y: snapPt.y }; }   // escalera y formas: se pegan a los extremos de las paredes o, con ◇ Medio, a los puntos medios
  else if (medioOn && tool.k != 'medida' && tool.k != 'line') { snapPt = null; snapMedio = false; imanMedio(rawW(e)); if (snapMedio) p = { x: snapPt.x, y: snapPt.y }; }   // colocar justo en el punto medio
  if (usaDosPuntos(tool)) clicDosPuntos(p, e);               // escalera y formas: dos puntos (ver colocar.js)
  else if (tool.k == 'item') { const o = tool.pt || tool.mid ? TR.mod.equipo(tool, p) : { k: 'item', n: tool.n, ic: tool.ic, w: tool.w, h: tool.h, x: p.x, y: p.y, label: '', ...(tool.puestos && { puestos: tool.puestos }) }; if (TR.jer.puedeColocar(o)) add(o); }   // F6: sobre una mesa se ancla a un puesto; si no entra, no se coloca   // F4A: los equipos del catálogo y los modelos propios nacen con su modelo (modelos.js)
  else if (tool.k == 'texto') { const t = prompt('Texto:'); if (t) add({ k: 'texto', x: p.x, y: p.y, label: t }); }
  else if (tool.k == 'zona') { tmp = { k: 'zona', s: tool.s, x: p.x, y: p.y, w: 0, h: 0, c: col(), f: fil(), ls: lin(), label: '' }; drag = { m: 'zona', x0: p.x, y0: p.y }; }
  else if (tool.k == 'medida') {
    const q = snapPt || p;                                  // 3 clics: punto a, punto b y posición de la cota
    if (!tmp) tmp = { k: 'medida', a: q, b: q, off: 0, st: 1, u: S.unidad };   // la medición queda en la unidad elegida al crearla
    else if (tmp.st == 1) { if (Math.hypot(q.x - tmp.a.x, q.y - tmp.a.y) > .05) { tmp.b = q; tmp.st = 2; } }
    else { tmp.off = offDe(tmp, p); delete tmp.st; add(tmp); tmp = null; }
  }
  else if (tool.k == 'line') {
    snapPt = null; snapNodo = null; snapMedio = false; imanNodos(rawW(e)); if (!snapPt) imanMedio(rawW(e));   // los imanes miden la distancia con el cursor real, no con el punto ya ajustado a la grilla
    const it = itemAt(e); let q = snapNodo ? enlaceDe(snapNodo, snapPt) : snapMedio ? { x: snapPt.x, y: snapPt.y } : it ? { x: it.x, y: it.y, ref: it.id } : snapPt ? { x: snapPt.x, y: snapPt.y } : p;   // nodo del mismo tipo > dispositivo > eje de una canalización > punto libre
    if (e.shiftKey && tmp && tmp.k == 'line') q = orto(pt(tmp.pts[tmp.pts.length - 1]), p);   // Mayús: tramo recto (punto libre, sin uniones)
    { const m = q.ref && byId(q.ref); if (m && m.ru) q.ref = m.parent; }   // F8B: el nodo de otro cable que termina en un equipo montado está en el centro del rack: se une al rack, que pregunta a cuál de sus equipos
    const dev = q.ref ? byId(q.ref) : null, conP = TR.con.conPuertos(tool, dev);   // F7A: un cable de red unido a un equipo con puertos pide el puerto (conexiones.js); el equipo es el de la unión, no el que está bajo el cursor (el imán de nodos puede unir desde fuera del icono)
    if (!tmp) { tmp = { k: 'line', n: tool.n, c: esCable(tool) ? tool.c : col(), w: tool.w, d: tool.d, pts: [q], label: '', pl: S.plantaAct, cp: S.capaAct }; TR.con.alEmpezar(conP && dev, e); }   // pl y cp: dónde empieza el cable
    else if (conP && tmp.pts.length == 1 && (tmp.pts[0].ref == dev.id || (byId(tmp.pts[0].ref) || {}).parent == dev.id)) return;   // segundo clic sobre el mismo equipo (o sobre el rack del equipo): no hay cable sin recorrido; dos equipos del mismo rack se unen con un patch cord en su vista
    else {
      if (S.plantaAct != tmp.pl) { q.pl = S.plantaAct; q.cp = S.capaAct; } tmp.pts.push(q);   // un punto en otra planta (tras cruzar una escalera) lleva la suya
      if (conP) { const L = tmp; finishLine(); TR.con.elegir(L.id, 'b', e, true); return; }   // el cable termina solo en el segundo equipo y pide su puerto (mismo paso de historial)
    }
  }
  render();
});
svg.addEventListener('pointermove', e => {
  const p = curP = toW(e);
  const eligiendoCota = tmp && tmp.k == 'medida' && tmp.st == 2;
  snapPt = (tool && tool.k == 'medida' && !eligiendoCota) || (drag && drag.m == 'h' && drag.o.k == 'medida' && drag.h != 'o') ? cercano(rawW(e)) : null;
  prevPuerta = tool && tool.k == 'puerta' ? puertaHover(rawW(e)) : null;
  snapMedio = false; snapNodo = null; if (!snapPt) imanNodos(rawW(e));
  if (!snapPt && !eligiendoCota) imanMedio(rawW(e));
  const q = snapPt || p;   // el cursor se pega al imán más cercano (puntos, nodos o puntos medios)
  if (tmp && tmp.k == 'line') { if (e.shiftKey) { snapPt = null; snapNodo = null; snapMedio = false; tmp.cur = orto(pt(tmp.pts[tmp.pts.length - 1]), p); } else tmp.cur = snapPt || p; } else if (eligiendoCota) tmp.off = offDe(tmp, p); else if (tmp && tmp.k == 'medida') tmp.b = q; else if (tmp && tmp.pa) ajustarColocacion(tmp, q, e.shiftKey);
  if (drag) {
    const d = drag;
    if (d.m == 'pan') { V.ox = d.ox + e.clientX - d.sx; V.oy = d.oy + e.clientY - d.sy; }
    else if (d.m == 'rot') moverRot(e);
    else if (d.m == 'lado') { const dx = p.x - d.last.x, dy = p.y - d.last.y; d.last = p; if (dx || dy) { if (!d.pu) { push(); d.pu = 1; } moverLado(d.o, d.i, dx, dy); } }
    else if (d.m == 'box') {
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4) { d.moved = true; cajaSel = { x0: d.x0, y0: d.y0, x1: d.x0, y1: d.y0 }; }
      if (d.moved) { const r = rawW(e); cajaSel.x1 = r.x; cajaSel.y1 = r.y; }
    }
    else if (d.m == 'zona') { Object.assign(tmp, { x: Math.min(d.x0, p.x), y: Math.min(d.y0, p.y), w: Math.abs(p.x - d.x0), h: Math.abs(p.y - d.y0) }); }
    else if (d.m == 'mv') {
      const dx = p.x - d.last.x, dy = p.y - d.last.y; d.last = p;
      if ((dx || dy) && !d.pu) { push(); d.pu = 1; }
      moverObjs(d.os, dx, dy, rawW(e));
    } else if (d.m == 'h') {
      const o = d.o; if (!d.pu && (p.x != d.p0.x || p.y != d.p0.y || o.k == 'puerta')) { push(); d.pu = 1; }
      if (o.k == 'zona') { d.ar ||= o.w / o.h; redimZona(o, p); if (e.shiftKey && !o.rot) { o.w = r3(Math.max(o.w, o.h * d.ar)); o.h = r3(o.w / d.ar); } }   // Mayús: conserva la proporción del inicio del arrastre (shortcut: solo zonas sin giro; para las giradas hay que llevar el cálculo a redimZona)
      else if (o.k == 'puerta') redimPuerta(o, d.h, rawW(e));
      else if (o.k == 'item') (esImagen(o) || e.shiftKey ? redimProporcional : redimensionarRot)(o, d.h, p, d.ar ||= o.w / o.h);   // escaleras e imágenes sueltas (las esquinas de una imagen conservan la proporción que tenía al empezar el arrastre)
      else if (o.k == 'shape') { if (String(d.h)[0] == 'v') moverVertice(o, +String(d.h).slice(1), snapMedio ? q : p); else (e.shiftKey ? redimProporcional : redimensionarRot)(o, d.h, p, d.ar ||= o.w / o.h); }   // Mayús en una esquina: conserva la proporción
      else if (o.k == 'medida') { if (d.h == 'o') o.off = offDe(o, p); else o[d.h] = q; }
      else { const it = itemAt(e), nb = o.pts[d.h - 1] || o.pts[d.h + 1], v = e.shiftKey && nb ? orto(pt(nb), p) : snapNodo ? enlaceDe(snapNodo, snapPt) : snapMedio ? { x: snapPt.x, y: snapPt.y } : it ? { x: it.x, y: it.y, ref: it.id } : snapPt ? { x: snapPt.x, y: snapPt.y } : p, antes = o.pts[d.h];   // Mayús: el tramo hasta el punto vecino queda recto (punto libre)
        if (antes.pl) { v.pl = antes.pl; v.cp = antes.cp; }
        if (d.r0 === undefined) d.r0 = antes.ref || null;                 // unión que tenía la punta al empezar el arrastre
        if (v.ref != null && d.r0 && (byId(d.r0) || {}).parent == v.ref) v.ref = d.r0;   // F8: sigue sobre el rack de su equipo montado (que no está en el plano): conserva el equipo y, con él, el puerto
        o.pts[d.h] = v; }   // el punto conserva su planta y capa
    }
  }
  repintarMovimiento();   // solo se redibuja lo que cambió (ver dibujo.js): sin herramienta ni arrastre, solo la barra de estado
});
svg.addEventListener('pointerup', e => {
  if (drag && drag.m == 'colocar' && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) terminarColocacion();   // pulsar, arrastrar y soltar también coloca
  if (drag && drag.m == 'box') { if (drag.moved) fijarSeleccion(dentroDeCaja()); else if (drag.id != null) alternar(drag.id); cajaSel = null; }
  if (drag && drag.m == 'zona') { if (tmp.w > .2 && tmp.h > .2) add(tmp); tmp = null; }
  soltarArrastre();
});
svg.addEventListener('pointercancel', soltarArrastre);   // toque o lápiz cancelado: misma revisión que al soltar
svg.addEventListener('pointerleave', () => { prevPuerta = null; snapPt = null; renderTmp(); });
svg.addEventListener('contextmenu', e => e.preventDefault());
svg.addEventListener('wheel', e => {
  e.preventDefault(); const r = svg.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
  const z = Math.min(3000, Math.max(8, V.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
  V.ox = mx - (mx - V.ox) * z / V.z; V.oy = my - (my - V.oy) * z / V.z; V.z = z; renderFondo(); renderTmp(); rulers(); status();   // el zoom solo cambia la vista, la grilla y las ayudas de medida (#g-tmp): los objetos no dependen de ella
}, { passive: false });
