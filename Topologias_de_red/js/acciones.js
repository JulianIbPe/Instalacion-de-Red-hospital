// ===== acciones.js: registro central de campos y acciones por tipo (Fase 3) =====
// Lo usan el inspector (inspector.js) y el menú contextual (contexto.js): así la lógica no se duplica. Las fases siguientes agregan sus entradas con
// TR.acc.registrarCampo({...}) y TR.acc.registrar({...}). El tipo decide qué se ofrece (tipoDe / esCable...), nunca el nombre visible (o.n).
// Reglas que cumple todo lo de aquí:
//   · una acción = como máximo UN paso de historial (push() una sola vez) y deshacer/rehacer la revierten;
//   · solo se actúa sobre objetos editables (capa visible y no bloqueada);
//   · el portapapeles (copiar, cortar, pegar) es estado de interfaz: no entra en S ni en el historial;
//   · D16: el color de un cable no se puede cambiar (las paredes sí); D18: la mesa (F6) se agrega a TR.acc.sinColor;
//   · una escalera editada (posición, tamaño o giro) se valida contra la planta de abajo como al colocarla: si obstruye se rechaza, se avisa y no se guarda nada.
TR.acc = (() => {
  const LIM = ESQ.LIM, CTRL = /[\u0000-\u001f\u007f]/g, OFFSET = .5, MIN = .2;   // OFFSET = desplazamiento de una copia (m); MIN = tamaño mínimo (igual que las asas)
  const campos = [], acciones = [], sinColor = [];                                   // sinColor: predicados (o => bool) de objetos cuyo color no se puede cambiar
  const colorable = o => !!o.c && !esCable(o) && !sinColor.some(f => f(o));
  const rellenable = o => o.k == 'shape' || o.k == 'zona';
  const conTam = o => o.k == 'item' || o.k == 'shape' || o.k == 'zona';
  const num = (min, max) => v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? r3(Math.min(max, Math.max(min, n))) : undefined; };
  const txt = max => v => String(v).replace(CTRL, '').slice(0, max);
  const cx = o => o.k == 'zona' ? r3(o.x + o.w / 2) : o.x, cy = o => o.k == 'zona' ? r3(o.y + o.h / 2) : o.y;
  const COORD = LIM.coord, DIM = 1e5;

  function registrarCampo(d) { campos.push({ multi: false, geo: false, ...d }); return d; }
  function registrar(d) { acciones.push({ donde: ['menu'], habilitada: () => true, marca: null, ...d }); return d; }
  const campo = id => campos.find(c => c.id == id);

  // ---------- Campos ----------
  // sec: objeto | geo | apar. parse(crudo) -> valor válido o undefined. leer(o) -> valor actual. poner(o, v) -> lo escribe. geo: toca posición, tamaño o giro (se valida con las escaleras de abajo).
  registrarCampo({ id: 'n', sec: 'objeto', et: 'Nombre', t: 'texto', max: LIM.nombre, aplica: o => ['item', 'line', 'shape', 'zona'].includes(o.k), leer: o => o.n || '', parse: txt(LIM.nombre), poner: (o, v) => { o.n = v; } });
  registrarCampo({ id: 'label', sec: 'objeto', et: os => os[0].k == 'texto' ? 'Texto' : 'Etiqueta', t: 'texto', max: LIM.texto, aplica: o => o.k != 'medida' && o.k != 'puerta', leer: o => o.label || '', parse: txt(LIM.texto), poner: (o, v) => { o.label = v; }, valida: (o, v) => o.k != 'texto' || v.trim() !== '' });
  registrarCampo({ id: 'x', sec: 'geo', et: 'Posición x (m)', t: 'num', geo: true, aplica: o => conTam(o) || o.k == 'texto', leer: cx, parse: num(-COORD, COORD), poner: (o, v) => { o.x = o.k == 'zona' ? r3(v - o.w / 2) : v; } });
  registrarCampo({ id: 'y', sec: 'geo', et: 'Posición y (m)', t: 'num', geo: true, aplica: o => conTam(o) || o.k == 'texto', leer: cy, parse: num(-COORD, COORD), poner: (o, v) => { o.y = o.k == 'zona' ? r3(v - o.h / 2) : v; } });
  registrarCampo({ id: 'w', sec: 'geo', et: 'Ancho (m)', t: 'num', geo: true, aplica: conTam, leer: o => o.w, parse: num(MIN, DIM), poner: (o, v) => { if (o.k == 'zona') { const c = o.x + o.w / 2; o.w = v; o.x = r3(c - v / 2); } else o.w = v; } });
  registrarCampo({ id: 'h', sec: 'geo', et: 'Alto (m)', t: 'num', geo: true, aplica: conTam, leer: o => o.h, parse: num(MIN, DIM), poner: (o, v) => { if (o.k == 'zona') { const c = o.y + o.h / 2; o.h = v; o.y = r3(c - v / 2); } else o.h = v; } });
  registrarCampo({ id: 'rot', sec: 'geo', et: 'Rotación (°)', t: 'num', geo: true, aplica: o => o.k == 'item' || o.k == 'zona' || o.k == 'texto' || esCirculo(o), leer: o => o.rot || 0, parse: v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? r3(((n % 360) + 360) % 360) : undefined; }, poner: (o, v) => { o.rot = v; } });
  registrarCampo({ id: 'c', sec: 'apar', et: 'Color', t: 'color', multi: true, aplica: colorable, leer: o => String(o.c).toLowerCase(), parse: v => /^#[0-9a-fA-F]{6}$/.test(String(v)) ? String(v).toLowerCase() : undefined, poner: (o, v) => { o.c = v; } });
  registrarCampo({ id: 'f', sec: 'apar', et: 'Relleno', t: 'sel', multi: true, opc: [['sol', 'Sólido'], ['hat', 'Líneas diagonales'], ['non', 'Sin relleno']], aplica: rellenable, leer: o => o.f || 'non', parse: v => ['sol', 'hat', 'non'].includes(v) ? v : undefined, poner: (o, v) => { o.f = v; } });
  registrarCampo({ id: 'ls', sec: 'apar', et: 'Contorno', t: 'sel', multi: true, opc: Object.entries(LINEAS).map(([k, d]) => [k, d[0]]), aplica: rellenable, leer: o => o.ls || 'con', parse: v => own(LINEAS, v) ? v : undefined, poner: (o, v) => { o.ls = v; } });
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const igual = (a, b) => typeof a == 'number' && typeof b == 'number' ? Math.abs(a - b) < 5e-4 : a === b;

  // Cambia un campo de uno o varios objetos (por id). Un solo paso de historial; con `gesto` ({p}) el paso se guarda solo la primera vez (selector de color).
  // Devuelve {ok, sinCambio?, motivo?}. Si algo no se puede (valor inválido, objeto no editable, escalera que obstruye), NO cambia nada y NO guarda historial.
  function fijar(ids, id, crudo, gesto) {
    const def = campo(id); if (!def) return { ok: false, motivo: 'campo desconocido' };
    const v = def.parse(crudo); if (v === undefined) return { ok: false, motivo: 'valor no válido' };
    const os = ids.map(byId).filter(o => o && esEditable(o) && def.aplica(o)); if (!os.length) return { ok: false, motivo: 'nada que editar' };
    const cambian = os.filter(o => !igual(def.leer(o), v)); if (!cambian.length) return { ok: true, sinCambio: true };
    const cand = cambian.map(o => { const c = copiar(o); def.poner(c, v); return c; });
    if (def.valida && cand.some(c => !def.valida(c, v))) return { ok: false, motivo: 'valor no válido' };
    if (def.geo) for (const c of cand) if (esEsc(c)) { const ob = escaleraObstruida(c); if (ob) { avisoEmergente(ob.msg); return { ok: false, motivo: ob.msg }; } }
    if (!gesto || !gesto.p) push(); if (gesto) gesto.p = true;
    cambian.forEach(o => def.poner(o, v)); render(); return { ok: true };
  }

  // ---------- Acciones ----------
  function rotar(deg) {                          // como la tecla R, pero una escalera que quedaría obstruyendo la de abajo rechaza TODO el giro
    const os = seleccionados(), g = geoSel(); if (!g || !os.length) return false;
    for (const o of os) if (esEsc(o)) { const c = copiar(o); rotarDesde(c, copiar(o), deg, g.c); const ob = escaleraObstruida(c); if (ob) { avisoEmergente(ob.msg); return false; } }
    rotarSeleccion(deg); return true;
  }
  // ---------- Portapapeles (estado de interfaz: fuera de S y del historial) ----------
  // Lo copiado queda como copias independientes (sin id, planta ni capa; las líneas con puntos libres, sin uniones ref/rl). Las puertas no se copian ni se pegan con su pared.
  const portapapeles = [];
  function copiarSel() {
    const os = seleccionados().filter(o => o.k != 'puerta'); if (!os.length) return false;
    portapapeles.length = 0;
    os.forEach(o => {
      const c = copiar(o); delete c.id; delete c.pl; delete c.cp;
      if (o.k == 'line') { const aqui = o.pts.filter(q => puntoEn(o, q) && !q.es); if (aqui.length < 2) return; c.pts = aqui.map(q => { const p = pt(q); return { x: p.x, y: p.y }; }); }   // un cable que atraviesa plantas: solo su tramo de la planta actual (cortar sí borra el cable completo)
      portapapeles.push(c);
    });
    return portapapeles.length > 0;
  }
  function cortar() { return copiarSel() && eliminar(); }          // copia y borra lo seleccionado (el borrado es un solo paso de historial)
  function trasladar(c, dx, dy) {
    if (c.k == 'line') c.pts = c.pts.map(q => ({ x: r3(q.x + dx), y: r3(q.y + dy) }));
    else if (c.k == 'medida') { c.a = { x: r3(c.a.x + dx), y: r3(c.a.y + dy) }; c.b = { x: r3(c.b.x + dx), y: r3(c.b.y + dy) }; }
    else { c.x = r3(c.x + dx); c.y = r3(c.y + dy); }
  }
  function pegar(extra) {                        // pega en la planta y capa ACTUALES; el centro de lo copiado va al punto del clic (o, sin punto, desplazado OFFSET)
    if (!portapapeles.length) return false;
    if (!capaEditable()) { avisoEmergente('La capa «' + capaActual().nombre + '» está oculta o bloqueada: elegí otra capa para pegar'); return false; }
    const b = portapapeles.map(bboxDe), cx0 = (Math.min(...b.map(q => q.x0)) + Math.max(...b.map(q => q.x1))) / 2, cy0 = (Math.min(...b.map(q => q.y0)) + Math.max(...b.map(q => q.y1))) / 2;
    const p = extra && extra.punto, dx = p ? r3(p.x - cx0) : OFFSET, dy = p ? r3(p.y - cy0) : OFFSET;
    const copias = portapapeles.map(o => { const c = copiar(o); trasladar(c, dx, dy); c.pl = S.plantaAct; c.cp = S.capaAct; return c; });
    for (const c of copias) if (esEsc(c)) { const ob = escaleraObstruida(c); if (ob) { avisoEmergente(ob.msg); return false; } }   // misma regla que al colocar una escalera
    push(); const nuevos = copias.map(c => { c.id = nid++; completarTipo(c); S.objs.push(c); return c.id; });
    fijarSeleccion(nuevos); render(); return true;
  }
  function eliminar() { selEdge = null; borrar(); return true; }   // el objeto completo (un lado de forma seleccionado se borra con Supr)
  const enfocar = id => () => { TR.insp.enfocar(id); return true; };
  const idsDe = os => os.map(o => o.id);
  const unoCon = id => os => os.length == 1 && campo(id).aplica(os[0]);

  registrar({ id: 'enf-n', grupo: 'editar', texto: 'Nombre…', aplica: unoCon('n'), ejecutar: enfocar('n') });
  registrar({ id: 'enf-label', grupo: 'editar', texto: os => os[0].k == 'texto' ? 'Editar texto…' : 'Etiqueta…', aplica: unoCon('label'), ejecutar: enfocar('label') });
  registrar({ id: 'enf-c', grupo: 'editar', texto: 'Color…', aplica: os => os.some(colorable), ejecutar: enfocar('c') });
  registrar({ id: 'enf-geo', grupo: 'editar', texto: 'Posición y tamaño…', aplica: unoCon('x'), ejecutar: enfocar('x') });
  for (const [v, n] of campo('f').opc) registrar({ id: 'f-' + v, grupo: 'relleno', texto: n, aplica: os => os.some(rellenable), marca: os => os.filter(rellenable).every(o => (o.f || 'non') == v), ejecutar: os => fijar(idsDe(os), 'f', v).ok });
  for (const [v, n] of campo('ls').opc) registrar({ id: 'ls-' + v, grupo: 'contorno', texto: n, aplica: os => os.some(rellenable), marca: os => os.filter(rellenable).every(o => (o.ls || 'con') == v), ejecutar: os => fijar(idsDe(os), 'ls', v).ok });
  registrar({ id: 'rotar-izq', grupo: 'transformar', donde: ['menu', 'insp'], texto: '↺ Rotar 90° (Mayús+R)', aplica: os => os.some(o => o.k != 'puerta'), ejecutar: () => rotar(-90) });
  registrar({ id: 'rotar-der', grupo: 'transformar', donde: ['menu', 'insp'], texto: '↻ Rotar 90° (R)', aplica: os => os.some(o => o.k != 'puerta'), ejecutar: () => rotar(90) });
  registrar({ id: 'voltear-lado', grupo: 'transformar', donde: ['menu', 'insp'], texto: 'Voltear lado (F)', aplica: os => os.some(o => o.k == 'puerta'), ejecutar: () => { voltearPuerta('lado'); return true; } });
  registrar({ id: 'voltear-bis', grupo: 'transformar', donde: ['menu', 'insp'], texto: 'Voltear bisagra (H)', aplica: os => os.some(o => o.k == 'puerta'), ejecutar: () => { voltearPuerta('bis'); return true; } });
  registrar({ id: 'deshacer', grupo: 'historial', global: true, texto: '↶ Volver atrás (Ctrl+Z)', aplica: os => !os.length, habilitada: () => hist.length > 0, ejecutar: () => { deshacer(); return true; } });
  registrar({ id: 'rehacer', grupo: 'historial', global: true, texto: '↷ Adelante (Ctrl+Y)', aplica: os => !os.length, habilitada: () => fut.length > 0, ejecutar: () => { rehacer(); return true; } });
  registrar({ id: 'cortar', grupo: 'portapapeles', texto: '✂️ Cortar', aplica: os => os.some(o => o.k != 'puerta'), ejecutar: cortar });
  registrar({ id: 'copiar', grupo: 'portapapeles', texto: '⧉ Copiar', aplica: os => os.some(o => o.k != 'puerta'), ejecutar: copiarSel });
  registrar({ id: 'pegar', grupo: 'portapapeles', global: true, texto: '📋 Pegar', aplica: () => true, habilitada: () => portapapeles.length > 0, ejecutar: (os, extra) => pegar(extra) });
  registrar({ id: 'eliminar', grupo: 'objeto', donde: ['menu', 'insp'], texto: '🗑️ Eliminar', aplica: os => os.length > 0, ejecutar: eliminar });
  const GRUPOS = [['editar', null], ['relleno', 'Relleno'], ['contorno', 'Contorno'], ['transformar', null], ['historial', null], ['portapapeles', null], ['objeto', null]];

  const vista = (a, os) => ({ id: a.id, texto: typeof a.texto == 'function' ? a.texto(os) : a.texto, marca: a.marca ? !!a.marca(os) : false, habil: os.every(esEditable) && a.habilitada(os) });
  function paraMenu(os) {                        // [{titulo, items:[{id, texto, marca, habil}]}] para el menú contextual
    return GRUPOS.map(([g, titulo]) => ({ titulo, items: acciones.filter(a => a.grupo == g && a.aplica(os)).map(a => vista(a, os)) })).filter(g => g.items.length);
  }
  const paraInspector = os => acciones.filter(a => a.donde.includes('insp') && a.aplica(os)).map(a => vista(a, os));
  function ejecutar(id, extra) {                 // ejecuta una acción sobre la selección actual (solo si aplica y los objetos son editables); las globales (deshacer, rehacer, pegar) no necesitan selección. extra = {punto} (dónde se hizo clic)
    const a = acciones.find(x => x.id == id), os = seleccionados(); if (!a || (!a.global && !os.length) || !a.aplica(os) || !os.every(esEditable) || !a.habilitada(os)) return false;
    return a.ejecutar(os, extra) !== false;
  }
  function sincronizarColor() {                  // D16: con una herramienta de cable, o con solo cables seleccionados, el selector de color del menú izquierdo queda desactivado
    const c = $('#col'), os = seleccionados(), bloq = tool ? (tool.k == 'line' && esCable(tool)) : (os.length > 0 && os.every(esCable));
    if (c.disabled !== bloq) c.disabled = bloq; const t = bloq ? 'El color de un cable lo define su tipo' : ''; if (c.title !== t) c.title = t;
  }
  return { campos, acciones, sinColor, portapapeles, registrar, registrarCampo, campo, fijar, rotar, copiar: copiarSel, cortar, pegar, eliminar, ejecutar, paraMenu, paraInspector, sincronizarColor, colorable, OFFSET };
})();
