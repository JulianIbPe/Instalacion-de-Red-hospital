// ===== superposicion.js (F10A): cables superpuestos =====
// · Superpuestos = tramos de cables distintos sobre la misma recta (a 2 cm o menos) que comparten más de 1 cm de largo.
//   Un cruce o dos puntas que se tocan no cuentan. Solo se miran los tramos de la planta actual de los cables que se ven.
// · Con el cursor quieto 400 ms sobre esos tramos (sin herramienta ni arrastre) aparece #sup, un panel con esos cables:
//   seleccionar, ver sus extremos y longitud, destacar su recorrido (en #g-tmp: no cambia #c ni el PNG) y aislarlo (filtros.js).
//   El color no se cambia desde acá (D16). Mover el ratón solo reinicia la espera: el cálculo se hace una vez, al cumplirse.
// · Con un cable destacado, un clic sobre cables superpuestos con él lo elige a él (prioridad, desde el pointerdown de interaccion.js).
// · El módulo escucha el ratón del plano por su cuenta (se registra después de interaccion.js); Esc lo cierra desde controles.js.
TR.sup = (() => {
  const SEP = .02, COMUN = .01, ESPERA = 400, SALIDA = 24, GRACIA = 900;   // metros, metros, ms, px que el cursor puede alejarse del punto donde se abrió, ms que tarda en cerrarse (para llegar al panel)
  const panel = $('#sup');
  let timer = 0, ancla = null, destacado = null, previo = null, cierre = 0;

  const tramos = o => segmentosEnPlanta(o, S.plantaAct).flatMap(g => g.slice(1).map((b, i) => ({ id: o.id, a: g[i], b })));   // tramos en la planta actual y en capas visibles (sin los de escalera, trazas.js)
  const segmentos = () => S.objs.filter(o => o.k == 'line' && esCable(o) && !TR.fil.oculto(o)).flatMap(tramos);   // [{id, a, b}] de los cables que se ven
  function superpuestos(segs, p, tol) {     // ids de los cables superpuestos en p (al menos dos), o []
    let s0 = null, d0 = tol;
    for (const s of segs) {                 // el tramo más cercano al cursor
      const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, l2 = dx * dx + dy * dy; if (l2 <= COMUN * COMUN) continue;
      const t = Math.max(0, Math.min(1, ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / l2)), d = Math.hypot(p.x - s.a.x - t * dx, p.y - s.a.y - t * dy);
      if (d <= d0) { d0 = d; s0 = s; }
    }
    if (!s0) return [];
    const len = Math.hypot(s0.b.x - s0.a.x, s0.b.y - s0.a.y), ux = (s0.b.x - s0.a.x) / len, uy = (s0.b.y - s0.a.y) / len;
    const a = q => (q.x - s0.a.x) * ux + (q.y - s0.a.y) * uy, n = q => Math.abs((q.y - s0.a.y) * ux - (q.x - s0.a.x) * uy);   // a lo largo y a lo ancho del tramo
    const tp = a(p), ids = new Set();
    for (const s of segs) {
      if (n(s.a) > SEP || n(s.b) > SEP) continue;                   // no está sobre la misma recta
      const lo = Math.max(0, Math.min(a(s.a), a(s.b))), hi = Math.min(len, Math.max(a(s.a), a(s.b)));
      if (hi - lo > COMUN && tp >= lo - tol && tp <= hi + tol) ids.add(s.id);   // comparte largo con el tramo más cercano, justo donde está el cursor
    }
    return ids.size > 1 ? [...ids] : [];
  }

  function fila(o) {
    const ext = TR.con.esRed(o) ? `A: ${esc(TR.con.txtExt(o.id, 'a'))} ↔ B: ${esc(TR.con.txtExt(o.id, 'b'))}` : 'sin conexión de red', m = TR.cab.medida(o);
    return `<div class="sup-r" data-id="${o.id}"><b>${esc(o.n)}${o.label ? ' «' + esc(o.label) + '»' : ''}</b><span>${ext}</span>${m == null ? '' : `<span>Longitud: ${fmt(m, 'm')}</span>`}`
      + `<div class="sup-b"><button data-a="sel"${esEditable(o) ? '' : ' disabled title="Su capa está bloqueada"'}>Seleccionar</button><button data-a="dest" aria-pressed="${destacado == o.id}">Destacar</button><button data-a="ais">Aislar</button></div></div>`;
  }
  function abrirEn(p, cx, cy) {
    const ids = superpuestos(segmentos(), p, Math.max(.1, 8 / V.z)); if (!ids.length) return;
    panel.innerHTML = `<div class="sup-t">${ids.length} cables superpuestos</div>` + ids.map(id => fila(byId(id))).join('');
    const w = $('#work').getBoundingClientRect(); panel.hidden = false;
    panel.style.left = Math.max(0, Math.min(cx - w.left + 14, w.width - panel.offsetWidth)) + 'px';    // junto al cursor, para poder pasar a él sin cruzar otros cables
    panel.style.top = Math.max(0, Math.min(cy - w.top + 14, w.height - panel.offsetHeight)) + 'px';
    ancla = { x: cx, y: cy };
  }
  function cerrar(todo) {                   // todo = también apaga el cable destacado (Esc)
    clearTimeout(timer); clearTimeout(cierre); cierre = 0; const habia = previo != null || (todo && destacado != null);
    if (ancla) { panel.hidden = true; ancla = null; } previo = null; if (todo) destacado = null;
    if (habia) renderTmp();
  }
  const demorarCierre = () => { if (!cierre) cierre = setTimeout(cerrar, GRACIA); };   // el panel espera un poco antes de cerrarse: da tiempo a pasar a él
  const seguir = () => { clearTimeout(cierre); cierre = 0; };
  const libre = () => !tool && !tmp && !drag;
  function alMover(e) {                     // pointermove del plano
    if (ancla) { if (Math.hypot(e.clientX - ancla.x, e.clientY - ancla.y) > SALIDA) demorarCierre(); else seguir(); }
    clearTimeout(timer);
    if (ancla || !libre() || e.buttons) return;
    const p = rawW(e), cx = e.clientX, cy = e.clientY, pl = S.plantaAct;
    timer = setTimeout(() => { if (libre() && S.plantaAct == pl) abrirEn(p, cx, cy); }, ESPERA);   // en la espera pudo elegirse una herramienta o cambiar la planta
  }
  function trazo() {                        // recorrido destacado (botón «Destacar») y el del renglón bajo el cursor, en la planta actual
    if (destacado == null && previo == null) return '';
    return [...new Set([destacado, previo])].map(byId).filter(o => o && o.k == 'line' && !TR.fil.oculto(o)).map(o => {
      const d = tramos(o).map(s => `M${s.a.x} ${s.a.y}L${s.b.x} ${s.b.y}`).join('');
      return d ? `<path d="${d}" fill="none" stroke="#ff2d95" stroke-opacity=".5" stroke-width="${Math.max(.25, o.w * 4)}" stroke-linecap="round" pointer-events="none"/>` : '';
    }).join('');
  }

  function prioridad(id, p) {               // clic sobre un cable: si está superpuesto con el destacado justo ahí (y éste se puede seleccionar), gana el destacado
    const D = byId(destacado), o = byId(id);
    if (!D || D.id == id || !o || !esCable(o) || !esEditable(D)) return id;
    const ids = superpuestos(segmentos(), p, Math.max(.1, 8 / V.z));
    return ids.includes(id) && ids.includes(D.id) ? D.id : id;
  }

  panel.addEventListener('pointerover', e => { const r = e.target.closest('.sup-r'), id = r ? +r.dataset.id : null; if (id !== previo) { previo = id; renderTmp(); } });
  panel.addEventListener('pointerenter', seguir);
  panel.addEventListener('pointerleave', demorarCierre);
  panel.addEventListener('click', e => {
    const b = e.target.closest('button'), id = b && +b.closest('.sup-r').dataset.id; if (!b || !byId(id)) return;
    if (b.dataset.a == 'sel') { fijarSeleccion([id]); render(); }
    else if (b.dataset.a == 'dest') { destacado = destacado == id ? null : id; panel.querySelectorAll('[data-a=dest]').forEach(x => x.setAttribute('aria-pressed', destacado == +x.closest('.sup-r').dataset.id)); renderTmp(); }
    else { cerrar(); TR.fil.aislar(id); }
  });
  svg.addEventListener('pointermove', alMover);
  svg.addEventListener('pointerdown', () => cerrar());
  svg.addEventListener('wheel', () => cerrar(), { passive: true });
  svg.addEventListener('pointerleave', () => { if (ancla) demorarCierre(); else clearTimeout(timer); });   // al salir hacia el panel, su pointerenter cancela el cierre
  return { superpuestos, segmentos, alMover, abrirEn, cerrar, trazo, prioridad, destacar: id => { destacado = id; renderTmp(); }, abierto: () => !!ancla };
})();
