// ===== inspector.js: panel lateral derecho de propiedades (Fase 3, D8) =====
// Los campos y las acciones salen del registro TR.acc (acciones.js), según el TIPO estable del objeto seleccionado.
// · El DOM solo se reconstruye cuando cambia la "firma" de la selección (ids y tipos). Si no, refrescar() actualiza los valores en sitio y nunca toca el campo que tiene el foco.
// · refrescar() se llama desde renderPaneles() (dibujo.js), o sea al terminar un clic o una acción; NUNCA al mover el ratón (repintarMovimiento no lo llama).
// · Un campo se confirma con change (Enter o salir del campo) o, antes de que el plano cambie la selección, al pulsar fuera (pointerdown en captura):
//   así una edición pendiente siempre se aplica al objeto en el que se escribió. Esc dentro de un campo descarta lo escrito.
// · Cada campo queda atado a los ids de la última construcción (no a la selección actual).
TR.insp = (() => {
  const raiz = $('#insp'), cuerpo = $('#insp-cuerpo'), btn = $('#binsp');
  const SECCIONES = [['objeto', 'Objeto'], ['modelo', 'Modelo'], ['imagen', 'Imagen'], ['geo', 'Posición y tamaño'], ['apar', 'Apariencia'], ['acc', 'Acciones']];
  const TIPO_NOM = { pared: 'Pared', cable: 'Cable', dispositivo: 'Dispositivo', rack: 'Rack', escalera: 'Escalera', ascensor: 'Ascensor', ventana: 'Ventana', imagen: 'Imagen', mesa: 'Mesa', puerta: 'Puerta', forma: 'Forma', zona: 'Zona', texto: 'Texto', medida: 'Medida' };
  const abiertas = { objeto: true, modelo: true, imagen: true, geo: true, apar: true, acc: true };   // estado de las secciones contraíbles (de interfaz: fuera de S y del historial)
  const gestoC = { p: false };                                            // un solo paso de historial por gesto del selector de color
  let firma = null, ids = [], visible = window.innerWidth > 760;
  const fmtNum = v => String(+Number(v).toFixed(3));
  const tipoTxt = os => { if (os.length > 1) return os.length + ' objetos'; const o = os[0], s = subDe(o); return (TIPO_NOM[tipoDe(o)] || tipoDe(o)) + (s && s != 'otro' ? ' · ' + s : ''); };
  const firmaDe = os => os.map(o => o.id + ':' + o.k + ':' + tipoDe(o) + '/' + (subDe(o) || '') + ':' + (o.modelo || '') + (o.modelo && TR.mod.esPropio(o.modelo) ? '*' : '') + ':' + (o.img || '') + '/' + ((modeloDe(o) || {}).img || '') + ':' + (os.length == 1 ? TR.con.firma(o) : '')).join('|');   // los extremos de un cable solo se muestran con un objeto seleccionado   // '*': modelo propio (ofrece «Editar modelo…»); las imágenes activan o desactivan los «Quitar» de la sección «Imagen»
  const aplicables = (def, os) => os.filter(def.aplica);
  function textoDe(def, os) {                                             // valor común como texto ('' si no hay o si difieren)
    const vs = aplicables(def, os).map(def.leer); if (!vs.length || !vs.every(v => v === vs[0])) return '';
    return def.t == 'num' ? fmtNum(vs[0]) : String(vs[0]);
  }
  function fila(def, os) {
    const et = typeof def.et == 'function' ? def.et(os) : def.et, a = `data-campo="${def.id}"`;
    const ctl = def.t == 'texto' ? `<input type="text" ${a} maxlength="${def.max}" autocomplete="off">`
      : def.t == 'num' ? `<input type="number" ${a} step="0.05">`
      : def.t == 'color' ? `<input type="color" ${a}>`
      : `<select ${a}>${def.opc.map(([v, n]) => `<option value="${v}">${esc(n)}</option>`).join('')}</select>`;
    return `<label class="fila"><span>${esc(et)}</span>${ctl}</label>`;
  }
  function construir(os) {                                                // única función que reescribe el DOM del inspector
    TR.ui.inspector++;
    if (!os.length) { cuerpo.innerHTML = '<p class="vacio">Seleccioná un objeto para ver y editar sus propiedades.</p>'; return; }
    const uno = os.length == 1; let h = '';
    for (const [sid, nombre] of SECCIONES) {
      let c = '';
      if (sid == 'objeto') c += `<div class="fila"><span>Tipo</span><b>${esc(tipoTxt(os))}</b></div>`;
      if (sid == 'modelo') c += TR.mod.seccion(os);                       // F4A: datos del modelo (modelos.js); no son campos del objeto
      if (sid == 'imagen') c += TR.img.seccion(os);                       // F4B: imagen del equipo y de su modelo (imagenes.js)
      if (sid == 'acc') c += '<div class="botones">' + TR.acc.paraInspector(os).map(a => `<button data-acc="${a.id}"${a.habil ? '' : ' disabled'}>${esc(a.texto)}</button>`).join('') + '</div>';
      else c += TR.acc.campos.filter(d => d.sec == sid && (uno || d.multi) && os.some(d.aplica)).map(d => fila(d, os)).join('');
      if (sid == 'apar' && os.some(esCable)) c += '<p class="nota">El color de un cable lo define su tipo y no se puede cambiar.</p>';
      if (sid == 'acc' && c == '<div class="botones"></div>') c = '';
      if (c) h += `<details data-sec="${sid}"${abiertas[sid] ? ' open' : ''}><summary>${nombre}</summary><div class="sec">${c}</div></details>`;
    }
    cuerpo.innerHTML = h;
  }
  function actualizarValores(os) {                                        // pone en cada campo el valor actual, sin tocar el que tiene el foco
    TR.ui.enSitio++;
    cuerpo.querySelectorAll('[data-campo]').forEach(el => {
      if (el === document.activeElement) return;
      const def = TR.acc.campo(el.dataset.campo), v = textoDe(def, os);
      if (def.t == 'color' && v === '') return;                           // colores distintos: se deja el que había
      if (el.value !== v) el.value = v;
    });
  }
  function refrescar() {
    TR.acc.sincronizarColor();
    const os = seleccionados(), f = firmaDe(os);
    if (f !== firma) { construir(os); firma = f; ids = os.map(o => o.id); }
    actualizarValores(os);
  }
  function commit(el) {                                                   // confirma lo escrito en un campo (sobre los ids atados al construir)
    const def = TR.acc.campo(el.dataset.campo); if (!def) return;
    const os = ids.map(byId).filter(o => o && def.aplica(o));
    const v = textoDe(def, os); if (el.value === v || (def.t == 'color' && v === '' && !el.value)) return;
    TR.acc.fijar(ids, def.id, el.value, def.id == 'c' ? gestoC : undefined);
    const os2 = ids.map(byId).filter(o => o && def.aplica(o)), nv = textoDe(def, os2);
    if (!(def.t == 'color' && nv === '')) el.value = nv;                  // valor normalizado (p. ej. recortado al mínimo) o, si se rechazó, el anterior
  }
  function aplicarVisible(rul = true) {
    raiz.classList.toggle('cerrado', !visible); btn.classList.toggle('on', visible); btn.setAttribute('aria-pressed', visible);
    if (rul) rulers();                                                    // #work cambia de ancho sin evento resize
  }
  const abrir = () => { if (!visible) { visible = true; aplicarVisible(); } };
  const alternar = () => { visible = !visible; aplicarVisible(); };
  function enfocar(id) {                                                  // lo usa el menú contextual para llevar al usuario al campo
    abrir(); const el = cuerpo.querySelector(`[data-campo="${id}"]`); if (!el) return;
    const d = el.closest('details'); if (d && !d.open) d.open = true;
    el.focus(); if (el.select) el.select();
  }

  cuerpo.addEventListener('change', e => { const el = e.target.closest('[data-campo]'); if (el) { commit(el); if (el.type == 'color') gestoC.p = false; } });
  cuerpo.addEventListener('input', e => { const el = e.target.closest('[data-campo]'); if (el && el.type == 'color') commit(el); });
  cuerpo.addEventListener('click', e => { const b = e.target.closest('[data-acc]'); if (b && !b.disabled) TR.acc.ejecutar(b.dataset.acc); });
  cuerpo.addEventListener('toggle', e => { if (e.target.dataset && e.target.dataset.sec) abiertas[e.target.dataset.sec] = e.target.open; }, true);
  cuerpo.addEventListener('keydown', e => {
    const el = e.target.closest && e.target.closest('[data-campo]');
    if (el && e.key == 'Escape' && ['text', 'number'].includes(el.type)) { el.value = textoDe(TR.acc.campo(el.dataset.campo), ids.map(byId).filter(Boolean)); el.blur(); e.stopPropagation(); }
  });
  document.addEventListener('pointerdown', e => {                         // un clic fuera del inspector confirma lo escrito ANTES de que el plano cambie la selección
    const a = document.activeElement;
    if (a && a.dataset && a.dataset.campo && raiz.contains(a) && !raiz.contains(e.target) && ['text', 'number'].includes(a.type)) { commit(a); a.blur(); }
  }, true);
  btn.onclick = alternar; $('#insp-x').onclick = alternar;
  aplicarVisible(false);
  return { refrescar, abrir, alternar, enfocar, commit, visible: () => visible, ids: () => ids.slice() };
})();
