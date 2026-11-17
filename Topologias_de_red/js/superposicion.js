// ===== superposicion.js (F10A): cables superpuestos =====
// · Superpuestos = tramos de cables distintos sobre la misma recta (a 2 cm o menos) que comparten más de 1 cm de largo.
//   Un cruce o dos puntas que se tocan no cuentan. Solo se miran los tramos de la planta actual de los cables que se ven.
// · Con el cursor quieto 400 ms sobre esos tramos (sin herramienta ni arrastre) aparece #sup, un panel con esos cables:
//   seleccionar, ver sus extremos y longitud, destacar su recorrido (en #g-tmp: no cambia #c ni el PNG) y aislarlo (filtros.js).
//   El color no se cambia desde acá (D16). Mover el ratón solo reinicia la espera: el cálculo se hace una vez, al cumplirse.
TR.sup = (() => {
  const SEP = .02, COMUN = .01, ESPERA = 400, SALIDA = 24, GRACIA = 900;   // metros, metros, ms, px que el cursor puede alejarse del punto donde se abrió, ms que tarda en cerrarse (para llegar al panel)
  const panel = $('#sup');
  let timer = 0, ancla = null, destacado = null, previo = null, cierre = 0;

  function segmentos() {                    // [{id, a, b}] de los cables visibles (y no ocultos por un filtro) en la planta actual
    const r = [];
    for (const o of S.objs) {
      if (o.k != 'line' || !esCable(o) || !esVisible(o) || TR.fil.oculto(o)) continue;
      for (let i = 1; i < o.pts.length; i++) if (puntoEn(o, o.pts[i - 1]) && puntoEn(o, o.pts[i])) r.push({ id: o.id, a: pt(o.pts[i - 1]), b: pt(o.pts[i]) });
    }
    return r;
  }
  function distSeg(p, s) {                  // distancia del punto p al tramo s
    const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, l2 = dx * dx + dy * dy || 1e-12, t = Math.max(0, Math.min(1, ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / l2));
    return Math.hypot(p.x - s.a.x - t * dx, p.y - s.a.y - t * dy);
  }
  function superpuestos(segs, p, tol) {     // ids de los cables superpuestos en p (al menos dos), o []
    let s0 = null, d0 = tol;
    for (const s of segs) {                 // el tramo más cercano al cursor
      const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, l2 = dx * dx + dy * dy; if (l2 <= COMUN * COMUN) continue;
      const d = distSeg(p, s);
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
  function alMover(e) {                     // lo llama el pointermove del plano
    if (ancla) { if (Math.hypot(e.clientX - ancla.x, e.clientY - ancla.y) > SALIDA) demorarCierre(); else seguir(); }
    clearTimeout(timer);
    if (ancla || tool || tmp || drag || e.buttons) return;
    const p = rawW(e), cx = e.clientX, cy = e.clientY;
    timer = setTimeout(() => abrirEn(p, cx, cy), ESPERA);
  }
  function trazo() {                        // recorrido destacado (botón «Destacar») y el del renglón bajo el cursor, en la planta actual
    return [...new Set([destacado, previo])].map(byId).filter(o => o && o.k == 'line').map(o => {
      let d = ''; for (let i = 1; i < o.pts.length; i++) if (puntoEn(o, o.pts[i - 1]) && puntoEn(o, o.pts[i])) { const a = pt(o.pts[i - 1]), b = pt(o.pts[i]); d += `M${a.x} ${a.y}L${b.x} ${b.y}`; }
      return d ? `<path d="${d}" fill="none" stroke="#ff2d95" stroke-opacity=".5" stroke-width="${Math.max(.25, o.w * 4)}" stroke-linecap="round" pointer-events="none"/>` : '';
    }).join('');
  }

  function prioridad(id, p) {               // clic sobre un cable: si el destacado pasa por ese punto (y se puede seleccionar), gana el destacado
    const D = byId(destacado), o = byId(id);
    if (!D || D.id == id || !o || !esCable(o) || !esEditable(D) || TR.fil.estado(D)) return id;
    const tol = Math.max(.1, 8 / V.z);
    return segmentos().some(s => s.id == D.id && distSeg(p, s) <= tol) ? D.id : id;
  }

  panel.addEventListener('pointerover', e => { const r = e.target.closest('.sup-r'), id = r ? +r.dataset.id : null; if (id !== previo) { previo = id; renderTmp(); } });
  panel.addEventListener('pointerenter', seguir);
  panel.addEventListener('pointerleave', demorarCierre);
  panel.addEventListener('click', e => {
    const b = e.target.closest('button'), id = b && +b.closest('.sup-r').dataset.id; if (!b || !byId(id)) return;
    if (b.dataset.a == 'sel') { sel = id; multi = []; selEdge = null; render(); }
    else if (b.dataset.a == 'dest') { destacado = destacado == id ? null : id; panel.querySelectorAll('[data-a=dest]').forEach(x => x.setAttribute('aria-pressed', destacado == +x.closest('.sup-r').dataset.id)); renderTmp(); }
    else { cerrar(); TR.fil.aislar(id); }
  });
  return { superpuestos, segmentos, alMover, abrirEn, cerrar, trazo, prioridad, destacar: id => { destacado = id; renderTmp(); }, abierto: () => !!ancla };
})();
