// ===== pruebas.js: pruebas de lógica, referencia de dibujo y medición de rendimiento (Fases 0 a 3; las de la Fase 4 están en pruebas-f4.js) =====
// Solo se carga al abrir index.html?pruebas=1. Aparece un panel «Pruebas» abajo a la izquierda.
// Cada comprobación usa un proyecto de prueba y, al terminar, restaura el proyecto abierto (no toca el historial).
// Aun así, conviene guardar el trabajo antes de ejecutarlas.
const TRP = (() => {
  const casos = [];
  const prueba = (nombre, fn) => casos.push({ nombre, fn });
  const afirmar = (c, m) => { if (!c) throw new Error(m || 'afirmación falsa'); };
  const ser = (a, b, m) => afirmar(a === b, (m || 'valores distintos') + ': esperado ' + JSON.stringify(b) + ', obtenido ' + JSON.stringify(a));
  const igual = (a, b, m) => ser(JSON.stringify(a), JSON.stringify(b), m);

  // ---------- Proyectos de prueba (formato actual, versión 1) ----------
  const P = { pl: 'p1', cp: 'c1' };
  const base = (extra = {}, objs = []) => { const s = estadoInicial('m'); Object.assign(s, extra); s.objs = objs; return s; };
  const item = (id, n, ic, x, y, o = {}) => ({ id, k: 'item', n, ic, w: .8, h: .8, x, y, label: '', ...P, ...o });
  const cable = (id, n, c, w, d, pts, o = {}) => ({ id, k: 'line', n, c, w, d, pts, label: '', ...P, ...o });
  const pared = (id, pts, o = {}) => cable(id, 'Pared', '#444444', .2, '', pts, o);
  const puerta = (id, pared, si, s, w, lado, hojas, bis) => ({ id, k: 'puerta', pared, si, s, w, lado, hojas, bis, ...P });
  const esc = (id, t, w, h, x, y, o = {}) => ({ id, k: 'item', n: 'Escalera', ic: '🪜', w, h, x, y, rot: 0, label: '', c: '#444444', ...(t ? { t } : {}), ...P, ...o });
  const capa = (id, nombre, visible = true, bloqueada = false) => ({ id, nombre, visible, bloqueada });

  const fVacio = () => ({ nombre: 'vacío', vistas: ['p1'], estado: base({ edificio: { w: 30, h: 8 } }) });
  const fDispositivos = () => ({ nombre: 'dispositivos y cables', vistas: ['p1'], estado: base({}, [
    item(1, 'Router', '📡', 3, 2, { label: 'R1' }), item(2, 'Switch', '🔀', 7, 2), item(3, 'Servidor', '🖥️', 11, 2), item(4, 'PC', '💻', 7, 6, { label: 'PC-1' }),
    cable(5, 'UTP Cat6', '#2e86de', .06, '', [{ x: 3, y: 2, ref: 1 }, { x: 7, y: 2, ref: 2 }]),
    cable(6, 'Fibra óptica', '#f39c12', .06, '', [{ x: 7, y: 2, ref: 2 }, { x: 9, y: 4 }, { x: 11, y: 2, ref: 3 }], { label: 'F1' }),
    cable(7, 'UTP Cat6', '#2e86de', .06, '', [{ x: 7, y: 2, ref: 2 }, { x: 7, y: 6, ref: 4 }]),
    cable(8, 'Cable de energía', '#e74c3c', .05, '.3 .08', [{ x: 1, y: 8 }, { x: 11, y: 8 }]),
    item(9, 'Lámpara', '💡', 4, 8, { w: .5, h: .5 }), item(10, 'Rack', '🗄️', 14, 3, { h: 1 })
  ]) });
  const fParedes = () => ({ nombre: 'paredes y puertas', vistas: ['p1'], estado: base({}, [
    pared(1, [{ x: 1, y: 1 }, { x: 9, y: 1 }, { x: 9, y: 6 }, { x: 1, y: 6 }, { x: 1, y: 1 }]),
    pared(2, [{ x: 5, y: 1 }, { x: 5, y: 6 }]),
    puerta(3, 1, 0, 2, .9, 1, 1, 'izq'), puerta(4, 1, 2, 4, 1.4, -1, 2, 'izq'), puerta(5, 2, 0, 2.5, .9, 1, 1, 'der'),
    item(6, 'Ventana', '🪟', 7, 1, { w: 1.2, h: .4 })
  ]) });
  const fFormas = () => ({ nombre: 'formas, zonas y medidas', vistas: ['p1'], estado: base({}, [
    { id: 1, k: 'shape', n: 'Rectángulo', x: 3, y: 3, w: 2, h: 1.5, c: '#2e86de', f: 'sol', ls: 'con', label: 'A', ...P },
    { id: 2, k: 'shape', n: 'Hexágono', x: 7, y: 3, w: 2, h: 1.6, c: '#e0a030', f: 'hat', ls: 'dis', label: '', ...P },
    { id: 3, k: 'shape', n: 'Círculo', x: 11, y: 3, w: 2.4, h: 1.2, rot: 30, c: '#8e44ad', f: 'non', ls: 'par', label: 'C', ...P },
    { id: 4, k: 'shape', n: 'Triángulo', x: 15, y: 3, w: 1.6, h: 1.6, c: '#c0392b', f: 'sol', ls: 'mix', hid: [1], label: '', ...P },
    { id: 5, k: 'zona', s: 'r', x: 1, y: 7, w: 4, h: 2, rot: 15, c: '#27ae60', f: 'hat', ls: 'con', label: 'Zona', ...P },
    { id: 6, k: 'zona', s: 'e', x: 7, y: 7, w: 4, h: 2.2, c: '#16a085', f: 'sol', ls: 'pun', label: '', ...P },
    { id: 7, k: 'texto', x: 13, y: 8, label: 'Texto libre', rot: 10, ...P },
    { id: 8, k: 'medida', a: { x: 1, y: 1 }, b: { x: 6, y: 1 }, off: .6, u: 'm', ...P },
    { id: 9, k: 'medida', a: { x: 1, y: 1.5 }, b: { x: 1, y: 6 }, off: -.6, u: 'cm', ...P }
  ]) });
  const fEscaleras = () => {
    const e = base({ pn: 2, cn: 2 }, [
      esc(1, '', 1.2, 2.8, 3, 3), esc(2, 'descanso', 1.6, 2.8, 6, 3), esc(3, 'espiral', 1.8, 1.8, 9, 3), esc(6, '', 1.2, 2.8, 12, 3, { rot: 90 }),
      cable(4, 'UTP Cat6', '#2e86de', .06, '', [{ x: 2, y: 1 }, { x: 3, y: 3 }, { x: 4, y: 5 }]),
      esc(5, 'descanso', 1.6, 2.8, 6, 3, { pl: 'p2', cp: 'c2' }),
      pared(7, [{ x: 1, y: 8 }, { x: 10, y: 8 }], { pl: 'p2', cp: 'c2' })
    ]);
    e.plantas = [{ id: 'p1', nombre: 'Planta 1', ca: 'c1', capas: [capa('c1', 'Base')] }, { id: 'p2', nombre: 'Planta 2', ca: 'c2', capas: [capa('c2', 'Base')] }];
    return { nombre: 'escaleras y plantas', vistas: ['p1', 'p2'], estado: e };
  };
  const fCapas = () => {
    const e = base({}, [
      { id: 1, k: 'shape', n: 'Rectángulo', x: 4, y: 4, w: 3, h: 2, c: '#2e86de', f: 'sol', ls: 'con', label: '', ...P },
      { id: 2, k: 'shape', n: 'Rectángulo', x: 5, y: 5, w: 3, h: 2, c: '#e74c3c', f: 'sol', ls: 'con', label: '', pl: 'p1', cp: 'c3' },
      item(3, 'PC', '💻', 10, 3, { cp: 'c2' }), cable(4, 'UTP Cat6', '#2e86de', .06, '', [{ x: 8, y: 2 }, { x: 14, y: 2 }], { cp: 'c3' }),
      item(5, 'Switch', '🔀', 12, 6)
    ]);
    e.plantas = [{ id: 'p1', nombre: 'Planta 1', ca: 'c1', capas: [capa('c1', 'Base'), capa('c2', 'Oculta', false), capa('c3', 'Bloqueada', true, true)] }]; e.cn = 3;
    return { nombre: 'capas ocultas y bloqueadas', vistas: ['p1'], estado: e };
  };
  const fixtures = () => [fVacio(), fDispositivos(), fParedes(), fFormas(), fEscaleras(), fCapas()];
  const fEstres = n => {     // n dispositivos en cuadrícula y n/2 cables entre pares
    const objs = [], cols = Math.ceil(Math.sqrt(n)), pos = [];
    for (let i = 0; i < n; i++) { const x = 1 + (i % cols) * 1.5, y = 1 + Math.floor(i / cols) * 1.5; pos.push({ x, y }); objs.push(item(i + 1, 'PC', '💻', x, y)); }
    for (let j = 0; j < Math.floor(n / 2); j++) { const a = 2 * j, b = 2 * j + 1; objs.push(cable(n + j + 1, 'UTP Cat6', '#2e86de', .06, '', [{ x: pos[a].x, y: pos[a].y, ref: a + 1 }, { x: pos[b].x, y: pos[b].y, ref: b + 1 }])); }
    return { nombre: 'estrés ' + n, vistas: ['p1'], estado: base({ edificio: { w: cols * 1.5 + 2, h: cols * 1.5 + 2 } }, objs) };
  };

  // ---------- Utilidades de ejecución ----------
  const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
  function conProyecto(estado, fn) {         // carga un proyecto de prueba, ejecuta fn y restaura el estado de la página
    const g = { hist: [...hist], fut: [...fut], S: JSON.stringify(S), V: { ...V }, sel, multi: [...multi], tmp, drag, selEdge, tool, nid, curP: { ...curP }, snapPt, cajaSel };
    try {
      S = JSON.parse(JSON.stringify(estado)); V = { ox: 40, oy: 40, z: 50 }; sel = null; multi = []; tmp = null; drag = null; selEdge = null; tool = null; snapPt = null; cajaSel = null;
      normalizar(); nid = Math.max(0, ...S.objs.map(o => o.id)) + 1; panel(); render();
      return fn();
    } finally {
      hist.length = 0; hist.push(...g.hist); fut.length = 0; fut.push(...g.fut);   // las pruebas no dejan pasos en el historial del usuario
      S = JSON.parse(g.S); V = g.V; sel = g.sel; multi = g.multi; tmp = g.tmp; drag = g.drag; selEdge = g.selEdge; tool = g.tool; nid = g.nid; curP = g.curP; snapPt = g.snapPt; cajaSel = g.cajaSel;
      panel(); render();
    }
  }
  const irA = v => { S.plantaAct = v; const q = plantaActual(); S.capaAct = (q.capas.find(x => x.id == q.ca) || q.capas[0]).id; };
  function huella(fx) {                      // {vista: {hash, largo}} del dibujo de #c en cada planta del proyecto de prueba
    const out = {};
    conProyecto(fx.estado, () => fx.vistas.forEach(v => { irA(v); render(); const h = $('#c').innerHTML; out[v] = { hash: fnv(h), largo: h.length }; }));
    return out;
  }
  const referenciaActual = () => { const r = {}; fixtures().forEach(fx => { r[fx.nombre] = huella(fx); }); return r; };
  function medirRendimiento(n = 2000) {      // medianas en ms con n dispositivos + n/2 cables (n = 2000 -> 3000 objetos)
    return conProyecto(fEstres(n).estado, () => {
      const mediana = (f, veces) => { const a = []; for (let i = 0; i < veces; i++) { const t0 = performance.now(); f(i); a.push(performance.now() - t0); } a.sort((x, y) => x - y); return +a[a.length >> 1].toFixed(2); };
      const r = svg.getBoundingClientRect(), mover = (i, extra = {}) => svg.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + 100 + (i % 50), clientY: r.top + 100, bubbles: true, ...extra }));
      const out = { objetos: S.objs.length, render_ms: mediana(() => render(), 15), mover_sin_arrastrar_ms: mediana(i => mover(i), 30) };
      const o = S.objs[0];
      drag = { m: 'mv', os: [o], last: { x: o.x, y: o.y }, p0: { x: o.x, y: o.y } };
      out.arrastrar_objeto_ms = mediana(i => mover(i * 3, { clientY: r.top + 100 + (i % 7) * 20 }), 20); drag = null;
      drag = { m: 'pan', sx: r.left + 100, sy: r.top + 100, ox: V.ox, oy: V.oy };
      out.desplazar_ms = mediana(i => mover(i), 30); drag = null;
      out.zoom_ms = mediana(i => svg.dispatchEvent(new WheelEvent('wheel', { clientX: r.left + 300, clientY: r.top + 200, deltaY: i % 2 ? 100 : -100, bubbles: true, cancelable: true })), 20);
      return out;
    });
  }

  // ---------- Pruebas ----------
  prueba('Instalación: js/archivos.js es la versión de la Fase 0 (define construirSvgExport y el botón PNG la usa)', () => {
    afirmar(typeof construirSvgExport === 'function', 'falta construirSvgExport: el navegador está usando un js/archivos.js anterior a la Fase 0 (o está en otra carpeta). Reemplazalo en Topologias_de_red/js/ y recargá con Ctrl+F5');
    afirmar(String($('#png').onclick).includes('construirSvgExport'), 'el botón PNG todavía usa el manejador anterior: js/archivos.js no es la versión de la Fase 0');
  });
  prueba('Proyectos de prueba: ids únicos y referencias válidas', () => {
    fixtures().concat([fEstres(40)]).forEach(fx => {
      const o = fx.estado.objs, ids = o.map(x => x.id), caps = new Set(fx.estado.plantas.flatMap(p => p.capas.map(c => p.id + '/' + c.id)));
      ser(new Set(ids).size, ids.length, fx.nombre + ': ids repetidos');
      o.forEach(x => {
        afirmar(caps.has(x.pl + '/' + x.cp), fx.nombre + ': objeto ' + x.id + ' con planta/capa inexistente');
        (x.pts || []).forEach(q => { if (q.ref) afirmar(ids.includes(q.ref), fx.nombre + ': ref colgante en ' + x.id); });
        if (x.k == 'puerta') afirmar(ids.includes(x.pared), fx.nombre + ': puerta sin pared');
      });
      afirmar(fx.vistas.every(v => fx.estado.plantas.some(p => p.id == v)), fx.nombre + ': vista inexistente');
    });
  });
  prueba('Dibujo: cada proyecto de prueba se dibuja y el resultado es estable', () => {
    fixtures().forEach(fx => { const a = huella(fx), b = huella(fx); igual(a, b, fx.nombre + ': dibujo no determinista'); Object.values(a).forEach(v => afirmar(v.largo > 100, fx.nombre + ': dibujo vacío')); });
  });
  prueba('PNG: sin marcos de selección (múltiple ni simple) y la selección se conserva', () => {
    afirmar(typeof construirSvgExport === 'function', 'falta construirSvgExport (ver la prueba de instalación)');
    conProyecto(fDispositivos().estado, () => {
      multi = [1, 2]; sel = null; render();
      afirmar($('#c').innerHTML.includes('#e0a03022'), 'precondición: con selección múltiple debe verse el marco');
      let r = construirSvgExport();
      afirmar(!r.xml.includes('#e0a03022'), 'el PNG contiene marcos de la selección múltiple');
      igual(multi, [1, 2], 'la selección múltiple no se conservó'); ser(sel, null, 'sel');
      multi = []; sel = 5; render();
      afirmar($('#c').innerHTML.includes('data-h='), 'precondición: con un objeto seleccionado deben verse las asas');
      r = construirSvgExport();
      afirmar(!r.xml.includes('data-h='), 'el PNG contiene asas de edición'); ser(sel, 5, 'la selección simple no se conservó');
    });
  });
  prueba('Teclado: Supr y Retroceso no borran con un botón enfocado, sí con el foco en el plano', () => {
    const orig = window.borrar; let n = 0; window.borrar = () => { n++; };
    const b = document.createElement('button'); document.body.appendChild(b);
    try {
      ['Delete', 'Backspace'].forEach(k => b.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })));
      ser(n, 0, 'borró con un botón enfocado');
      ['Delete', 'Backspace'].forEach(k => svg.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })));
      ser(n, 2, 'no borró con el foco en el plano');
    } finally { window.borrar = orig; b.remove(); }
  });

  // ---------- Pruebas de la Fase 1 (renderizado en capas) ----------
  const mover = (i, extra = {}) => { const r = svg.getBoundingClientRect(); svg.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + 120 + i * 7, clientY: r.top + 90 + (i % 5) * 3, bubbles: true, ...extra })); };
  const conMenuContado = fn => { const m0 = window.menu; window.menu = function () { TR.stats.menu++; return m0.apply(this, arguments); }; try { return fn(); } finally { window.menu = m0; } };
  const cableEnCurso = () => ({ k: 'line', n: tool.n, c: tool.c, w: tool.w, d: tool.d, pts: [{ x: 2, y: 2 }], label: '' });
  prueba('Fase 1: instalación (dibujo.js, interaccion.js y eventos.js son los de la Fase 1)', () => {
    afirmar(typeof TR !== 'undefined', 'falta js/eventos.js: reemplazá index.html y agregá js/eventos.js');
    afirmar(typeof renderObjetos === 'function' && typeof renderTmp === 'function' && typeof repintarMovimiento === 'function', 'js/dibujo.js no es la versión de la Fase 1');
    afirmar(document.querySelector('#svg > #vp > #g-grilla') && document.querySelector('#svg > #vp > #c') && document.querySelector('#svg > #vp > #g-tmp'), 'el SVG no tiene la estructura de capas (#vp con #g-grilla, #c y #g-tmp)');
  });
  prueba('Fase 1: mover el ratón sin herramienta ni arrastre no reconstruye nada', () => {
    afirmar(typeof TR !== 'undefined', 'falta js/eventos.js');
    conProyecto(fDispositivos().estado, () => conMenuContado(() => {
      sel = 2; render(); const antes = $('#c').innerHTML; TR.reiniciar();
      for (let i = 0; i < 25; i++) mover(i);
      igual(TR.stats, { fondo: 0, rejilla: 0, obj: 0, tmp: 0, paneles: 0, menu: 0 }, 'se reconstruyó algo al mover el ratón (js/interaccion.js no es el de la Fase 1)');
      ser($('#c').innerHTML, antes, '#c cambió');
      afirmar($('#status').textContent.includes('x ' + curP.x.toFixed(1)), 'la barra de estado no muestra las coordenadas');
    }));
  });
  prueba('Fase 1: con un cable en curso solo se redibuja la capa temporal', () => {
    conProyecto(fDispositivos().estado, () => conMenuContado(() => {
      tool = CAT['Cables'][0]; tmp = cableEnCurso(); render(); TR.reiniciar();
      for (let i = 0; i < 25; i++) mover(i);
      ser(TR.stats.obj, 0, '#c reconstruido'); ser(TR.stats.tmp, 25, 'capa temporal'); ser(TR.stats.fondo, 0, 'vista'); ser(TR.stats.menu, 0, 'menú');
      afirmar(tmp.cur, 'el cable en curso no sigue al cursor');
    }));
  });
  prueba('Fase 1: el objeto en curso se dibuja en #g-tmp y no altera #c', () => {
    conProyecto(fDispositivos().estado, () => {
      const antes = fnv($('#c').innerHTML); tool = CAT['Cables'][0]; tmp = { ...cableEnCurso(), cur: { x: 5, y: 5 } }; render();
      ser(fnv($('#c').innerHTML), antes, '#c cambió por el objeto en curso');
      afirmar($('#g-tmp').innerHTML.includes('<polyline'), 'el cable en curso no aparece en #g-tmp');
    });
  });
  prueba('Fase 1: desplazar la vista solo cambia la transformación (sin reconstruir #c ni la grilla)', () => {
    conProyecto(fDispositivos().estado, () => {
      const r = svg.getBoundingClientRect(); drag = { m: 'pan', sx: r.left + 100, sy: r.top + 100, ox: V.ox, oy: V.oy }; TR.reiniciar();
      for (let i = 0; i < 25; i++) mover(i);
      ser(TR.stats.obj, 0, '#c reconstruido'); ser(TR.stats.fondo, 25, 'vista'); ser(TR.stats.rejilla, 0, 'grilla regenerada'); ser(TR.stats.tmp, 0, 'capa temporal');
      afirmar(V.ox !== 40 && $('#vp').getAttribute('transform').includes('translate(' + V.ox + ' '), 'la vista no se desplazó');
    });
  });
  prueba('Fase 1: el zoom con la rueda no reconstruye #c y rehace la grilla', () => {
    conProyecto(fDispositivos().estado, () => {
      const r = svg.getBoundingClientRect(), z0 = V.z; TR.reiniciar();
      for (let i = 0; i < 4; i++) svg.dispatchEvent(new WheelEvent('wheel', { clientX: r.left + 300, clientY: r.top + 200, deltaY: -100, bubbles: true, cancelable: true }));
      ser(TR.stats.obj, 0, '#c reconstruido'); ser(TR.stats.paneles, 0, 'paneles'); afirmar(TR.stats.rejilla >= 1, 'la grilla no se rehízo'); afirmar(V.z > z0, 'no hubo zoom');
    });
  });
  prueba('Fase 1: arrastrar un objeto redibuja #c, mueve el objeto y guarda un solo paso de historial', () => {
    conProyecto(fDispositivos().estado, () => {
      const o = byId(1), x0 = o.x, y0 = o.y, r = svg.getBoundingClientRect(), antes = $('#c').innerHTML, h0 = hist.length;
      drag = { m: 'mv', os: [o], last: { x: x0, y: y0 }, p0: { x: x0, y: y0 } }; TR.reiniciar();
      for (let i = 0; i < 10; i++) svg.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + V.ox + x0 * V.z + (i + 1) * 30, clientY: r.top + V.oy + y0 * V.z, bubbles: true }));
      ser(TR.stats.obj, 10, 'redibujos de #c'); afirmar(o.x > x0, 'el objeto no se movió'); afirmar($('#c').innerHTML !== antes, '#c no cambió'); ser(hist.length, h0 + 1, 'pasos de historial');
    });
  });
  prueba('Fase 1: el dibujo es idéntico a la referencia guardada en la Fase 0', () => {
    const ref = leer(CLAVE_REF); afirmar(ref && ref.datos, 'no hay referencia guardada en este navegador (se guarda con «Guardar referencia de dibujo» con la versión de la Fase 0)');
    const act = referenciaActual(), dif = [];
    Object.keys(ref.datos).forEach(n => Object.keys(ref.datos[n]).forEach(v => { const x = ref.datos[n][v], y = (act[n] || {})[v]; if (!y || x.hash !== y.hash || x.largo !== y.largo) dif.push(n + '/' + v); }));
    afirmar(!dif.length, 'diferencias respecto a la referencia: ' + dif.join(', '));
  });

  // ---------- Pruebas de la Fase 2 (tipos estables, formato v2, recursos e historial) ----------
  const bytesUri = (bytes, mime) => { let t = ''; for (const b of bytes) t += String.fromCharCode(b); return 'data:' + mime + ';base64,' + btoa(t); };
  const u32 = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const pngUri = (w, h, extra = 0) => bytesUri([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, ...u32(w), ...u32(h), 8, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 73, 69, 78, 68, 0, 0, 0, 0, ...new Array(extra).fill(7)], 'image/png');   // PNG mínimo con cabecera real (firma e IHDR)
  const v1 = estado => JSON.stringify({ version: 1, ...estado });
  function conR(fn) {                          // empieza con los recursos vacíos y restaura los del usuario al terminar
    const g = { i: R.imgs, m: R.modelos, n: R.nm, l: { ...R.limites } }; R.imgs = {}; R.modelos = {}; R.nm = 0;
    try { return fn(); } finally { R.imgs = g.i; R.modelos = g.m; R.nm = g.n; R.limites = g.l; }
  }
  prueba('Fase 2: instalación (tipos.js, recursos.js, esquema.js, historial.js y archivos.js son los de la Fase 2)', () => {
    afirmar(typeof ESQ !== 'undefined' && typeof R !== 'undefined' && typeof derivarTipo === 'function', 'faltan js/tipos.js, js/recursos.js o js/esquema.js (o index.html no los carga)');
    afirmar(typeof Hist !== 'undefined' && typeof Hist.recortar === 'function', 'js/historial.js no es la versión de la Fase 2');
    afirmar(typeof abrirTexto === 'function', 'js/archivos.js no es la versión de la Fase 2');
  });
  prueba('Fase 2: migración v1 → v2: los proyectos de prueba abren y se dibujan igual que antes', () => {
    fixtures().forEach(fx => {
      const r = ESQ.leer(v1(fx.estado)); afirmar(r.ok, fx.nombre + ': ' + (r.errores || []).join(' | ')); ser(r.version, 1, fx.nombre + ': versión detectada'); ser(r.avisos.length, 0, fx.nombre + ': avisos ' + r.avisos.join(' | '));
      afirmar(r.estado.objs.every(o => o.tipo), fx.nombre + ': objetos sin tipo');
      igual(huella({ ...fx, estado: Object.assign(estadoInicial('m'), r.estado) }), huella(fx), fx.nombre + ': el dibujo cambió tras migrar');
    });
  });
  prueba('Fase 2: guardar v2 → abrir → guardar da el mismo archivo (no se pierde ningún campo)', () => {
    conR(() => fixtures().forEach(fx => {
      const a = ESQ.serializar(fx.estado, R); afirmar(a.ok, fx.nombre + ': ' + a.error); const d = JSON.parse(a.texto); ser(d.version, 2, 'version'); ser(d.formato, 'topologias-de-red', 'formato');
      const r = ESQ.leer(a.texto); afirmar(r.ok && r.version === 2 && !r.avisos.length, fx.nombre + ': no reabre limpio'); ser(ESQ.serializar(r.estado, R).texto, a.texto, fx.nombre + ': la ida y vuelta cambió el archivo');
    }));
  });
  prueba('Fase 2: abrir un archivo v1 con el flujo real reemplaza el proyecto, se puede deshacer y asigna tipos', () => {
    conR(() => conProyecto(fVacio().estado, () => {
      const h0 = hist.length, antes = S.objs.length, r = abrirTexto(v1(fDispositivos().estado));
      afirmar(r.ok, 'no abrió: ' + (r.errores || []).join(' | ')); ser(S.objs.length, 10, 'objetos tras abrir'); ser(hist.length, h0 + 1, 'pasos de historial');
      const t = {}; S.objs.forEach(o => { t[o.id] = o.tipo + (o.sub ? '/' + o.sub : ''); });
      igual([t[1], t[2], t[4], t[5], t[6], t[8], t[9], t[10]], ['dispositivo/router', 'dispositivo/switch', 'dispositivo/pc', 'cable/utp6', 'cable/fibra', 'cable/energia', 'dispositivo/lampara', 'rack'], 'tipos asignados');
      ser(nid, 11, 'siguiente id'); deshacer(); ser(S.objs.length, antes, 'deshacer la apertura');
    }));
  });
  prueba('Fase 2: un archivo inválido no cambia el proyecto, el historial ni los recursos', () => {
    const malos = ['', 'no es json', '[]', '{"version":1}', v1({ objs: {} }), v1({ objs: [{ id: 1, k: 'virus' }] }), v1({ objs: [{ id: 1, k: 'texto', x: 1, y: 1, label: 'a' }, { id: 1, k: 'texto', x: 2, y: 2, label: 'b' }] }),
      JSON.stringify({ formato: 'topologias-de-red', version: 9, estado: {}, recursos: {} }), JSON.stringify({ formato: 'topologias-de-red', version: 2, estado: { objs: [] }, recursos: { imgs: { i_0123456789abcd: { data: 'data:image/png;base64,' + btoa('no soy un png') } } } })];
    conR(() => conProyecto(fDispositivos().estado, () => {
      const S0 = JSON.stringify(S), h0 = hist.length, f0 = fut.length, R0 = JSON.stringify(R.imgs) + JSON.stringify(R.modelos);
      malos.forEach((t, i) => {
        const r = abrirTexto(t); afirmar(!r.ok && r.errores && r.errores.length, 'caso ' + i + ': debía rechazarse');
        ser(JSON.stringify(S), S0, 'caso ' + i + ': cambió el proyecto'); ser(hist.length, h0, 'caso ' + i + ': cambió el historial'); ser(fut.length, f0, 'caso ' + i + ': cambió rehacer'); ser(JSON.stringify(R.imgs) + JSON.stringify(R.modelos), R0, 'caso ' + i + ': cambiaron los recursos');
      });
    }));
  });
  prueba('Fase 2: si algo falla durante la apertura, se conserva el proyecto anterior', () => {
    conR(() => conProyecto(fDispositivos().estado, () => {
      const S0 = JSON.stringify(S), h0 = hist.length, nid0 = nid, n0 = window.normalizar; let r;
      window.normalizar = () => { throw new Error('fallo simulado'); };
      try { r = abrirTexto(v1(fVacio().estado)); } finally { window.normalizar = n0; }
      afirmar(!r.ok && /Error inesperado/.test(r.errores.join()), 'debía informar el error'); ser(JSON.stringify(S), S0, 'cambió el proyecto'); ser(hist.length, h0, 'cambió el historial'); ser(nid, nid0, 'cambió el contador de ids');
    }));
  });
  prueba('Fase 2: imágenes: formato real, dimensiones, límites iniciales (5 MB y 50 MB) y sin duplicados', () => {
    conR(() => {
      ser(R.limites.imagen, 5 * 1024 * 1024, 'límite por imagen'); ser(R.limites.total, 50 * 1024 * 1024, 'límite por proyecto');
      const a = R.agregarImagen(pngUri(10, 20)); afirmar(a.ok, a.error); const v = validarImagen(pngUri(10, 20)); ser(v.w, 10, 'ancho'); ser(v.h, 20, 'alto');
      afirmar(!validarImagen(pngUri(10, 20).replace('image/png', 'image/jpeg')).ok, 'un PNG declarado como JPEG debe rechazarse');
      afirmar(!validarImagen('data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg"/>')).ok, 'un SVG debe rechazarse');
      afirmar(!validarImagen('data:image/png;base64,' + btoa('no soy una imagen')).ok, 'bytes que no son una imagen deben rechazarse');
      afirmar(!validarImagen(pngUri(9000, 2)).ok, 'dimensiones fuera de límite');
      const g = validarImagen(pngUri(10, 10, 5 * 1024 * 1024 + 1)); afirmar(!g.ok && /máximo por imagen/.test(g.error), 'una imagen de más de 5 MB debe rechazarse');
      R.agregarImagen(pngUri(10, 20)); ser(Object.keys(R.imgs).length, 1, 'la misma imagen se duplicó');
      R.limites.total = 60; const t = R.agregarImagen(pngUri(30, 30)); afirmar(!t.ok && /máximo de/.test(t.error), 'superar el total debe rechazarse'); ser(Object.keys(R.imgs).length, 1, 'cambió lo ya cargado');
    });
  });
  prueba('Fase 2: los snapshots del historial nunca contienen imágenes y el archivo las guarda una sola vez', () => {
    conR(() => conProyecto(fDispositivos().estado, () => {
      const r = R.agregarImagen(pngUri(12, 12)); afirmar(r.ok, r.error); byId(1).img = r.id;
      const e = Hist.estrategia.capturar(); afirmar(!e.includes('data:image') && e.includes(r.id), 'el snapshot debe llevar solo la referencia');
      push(); hist.forEach(x => afirmar(!x.includes('data:image'), 'un paso del historial contiene una imagen'));
      const g = ESQ.serializar(S, R); afirmar(g.ok, g.error); ser(g.texto.split('data:image').length - 1, 1, 'copias de la imagen en el archivo');
      R.agregarImagen(pngUri(40, 40)); ser(ESQ.serializar(S, R).texto.split('data:image').length - 1, 1, 'una imagen sin uso se descarta al guardar');
    }));
  });
  prueba('Fase 2: abrir un proyecto con imágenes une los recursos sin perder los actuales y deshacer sigue funcionando', () => {
    conR(() => conProyecto(fDispositivos().estado, () => {
      const A = R.agregarImagen(pngUri(10, 10)).id; byId(1).img = A;
      const B = R.agregarImagen(pngUri(20, 20)).id, est = { ...fVacio().estado, objs: [item(1, 'PC', '💻', 2, 2, { img: B })] }, txt = ESQ.serializar(est, R).texto; delete R.imgs[B];
      const h0 = hist.length, r = abrirTexto(txt); afirmar(r.ok, (r.errores || []).join(' | '));
      afirmar(R.imgs[A] && R.imgs[B], 'faltan imágenes tras abrir'); ser(S.objs.length, 1, 'objetos tras abrir'); ser(S.objs[0].img, B, 'referencia de imagen'); ser(hist.length, h0 + 1, 'pasos de historial');
      deshacer(); ser(S.objs.length, 10, 'deshacer la apertura'); ser(byId(1).img, A, 'la imagen del proyecto anterior'); afirmar(R.imgs[A], 'se perdió la imagen del proyecto anterior');
      ser(Object.keys(JSON.parse(ESQ.serializar(S, R).texto).recursos.imgs).join(), A, 'solo la imagen usada se guarda');
    }));
  });
  prueba('Fase 2: abrir un proyecto cuyas imágenes superan el límite lo rechaza sin cambiar nada', () => {
    conR(() => conProyecto(fVacio().estado, () => {
      const B = R.agregarImagen(pngUri(20, 20)).id, txt = ESQ.serializar({ ...fVacio().estado, objs: [item(1, 'PC', '💻', 2, 2, { img: B })] }, R).texto; R.vaciar();
      R.limites.total = 10; const S0 = JSON.stringify(S), h0 = hist.length, r = abrirTexto(txt);
      afirmar(!r.ok && /máximo/.test(r.errores.join()), 'debía rechazarse por el límite: ' + JSON.stringify(r)); ser(JSON.stringify(S), S0, 'cambió el proyecto'); ser(hist.length, h0, 'cambió el historial'); ser(Object.keys(R.imgs).length, 0, 'cambiaron los recursos');
    }));
  });
  prueba('Fase 2: historial: tope de pasos y de memoria, sin pasos duplicados y estrategia intercambiable', () => {
    const lim = { ...Hist.limites }, est = Hist.estrategia;
    try {
      conProyecto(fVacio().estado, () => {
        hist.length = 0; fut.length = 0; Hist.limites.pasos = 5;
        for (let i = 0; i < 12; i++) { push(); S.edificio.w = 10 + i; }
        ser(hist.length, 5, 'pasos conservados'); ser(JSON.parse(hist[0]).edificio.w, 16, 'el paso más antiguo conservado'); ser(JSON.parse(hist[4]).edificio.w, 20, 'el paso más reciente');
        Hist.limites.pasos = 100; const n = hist.length; push(); push(); ser(hist.length, n + 1, 'dos push sin cambios duplicaron el paso');
        Hist.limites.caracteres = 3000; S.objs.push({ id: 1, k: 'texto', x: 0, y: 0, label: 'x'.repeat(400) });
        for (let i = 0; i < 12; i++) { push(); S.objs[0].x = i + 1; }
        afirmar(Hist.tamano() <= 3000 || hist.length === 1, 'se superó el tope de memoria: ' + Hist.tamano());
        Hist.limites.caracteres = lim.caracteres; hist.length = 0; fut.length = 0; S.edificio.w = 1;
        Hist.estrategia = { nombre: 'prueba', capturar: () => JSON.stringify({ w: S.edificio.w }), aplicar: p => { S.edificio.w = JSON.parse(p).w; }, igual: (a, b) => a === b, peso: p => p.length };
        push(); S.edificio.w = 7; deshacer(); ser(S.edificio.w, 1, 'deshacer con otra estrategia'); rehacer(); ser(S.edificio.w, 7, 'rehacer con otra estrategia');
      });
      ser(est.nombre, 'snapshots', 'estrategia por defecto');
    } finally { Hist.limites.pasos = lim.pasos; Hist.limites.caracteres = lim.caracteres; Hist.estrategia = est; }
  });
  prueba('Fase 2: tipos estables: el tipo sale del campo tipo, no del nombre visible', () => {
    const o = { id: 1, k: 'item', n: 'Nombre cualquiera', tipo: 'escalera', ic: '🪜', w: 1, h: 1, x: 0, y: 0 };
    afirmar(esEscalera(o) && !esAscensor(o) && !esCirculo(o), 'el nombre visible no debe decidir el tipo');
    afirmar(esCirculo({ k: 'shape', n: 'Otro nombre', tipo: 'forma', sub: 'circulo' }) && claveLinea({ k: 'line', n: 'Mi cable', tipo: 'cable', sub: 'fibra' }) === 'fibra' && claveLinea({ k: 'line', n: 'Mi pared', tipo: 'pared' }) === 'pared', 'predicados por tipo y subtipo');
    const e = ESQ.leer(v1(fEscaleras().estado)); afirmar(e.ok && e.estado.objs.filter(x => x.tipo == 'escalera').length === 5 && e.estado.objs.filter(x => x.tipo == 'cable').length === 1 && e.estado.objs.filter(x => x.tipo == 'pared').length === 1, 'escaleras (las tres variantes), cable y pared migrados');
  });

  // ---------- Pruebas de la Fase 2B (el tipo estable decide el comportamiento, no el nombre visible) ----------
  const renombrar = estado => { const e = JSON.parse(JSON.stringify(estado)); e.objs.forEach(completarTipo); e.objs.forEach(o => { if (o.n) o.n = 'Z-' + o.n; }); return e; };   // tipo escrito y nombre visible cambiado
  function sonda() {                           // resultados de las funciones que antes decidían por nombre, sobre el proyecto abierto
    const out = {}, rep = o => JSON.parse(JSON.stringify(o));
    out.bbox = S.objs.map(o => bboxDe(o)); out.medios = puntosMedios(); const sg = segmentoCercano({ x: 5, y: 1.2 }, 2); out.seg = sg && sg.o.id;
    out.nodos = ['pared', 'utp6', 'fibra'].map(k => nodosDeTipo(k).length); out.uDe = S.objs.filter(o => o.k == 'shape').map(o => uDe(o).length);
    out.abajo = [escalerasInferiores().length, escalerasDeAbajo().length];
    out.rot = S.objs.filter(o => o.k == 'shape' || o.k == 'item').map(o => { const c = rep(o); rotarDesde(c, rep(o), 90, { x: 5, y: 5 }); return [c.x, c.y, c.rot, c.u && c.u.length]; });
    out.act = [null, CAT['Cables'][1], CAT['Edificio'][0], CAT['Formas'][0]].map(t => { tool = t; return tipoActivo(); }); tool = null;
    if (S.plantas.length > 1) { irA('p2'); out.reglas = [['', 3, 3, 1.2, 2.8], ['descanso', 3, 3, 1.2, 2.8], ['descanso', 6, 3, 1.6, 2.8], ['espiral', 6, 3, 1.6, 2.8], ['', 15, 3, 1, 2]].map(([t, x, y, w, h]) => { const r = escaleraObstruida({ k: 'item', n: 'Escalera', ...(t ? { t } : {}), x, y, w, h, rot: 0 }); return r ? r.msg.slice(0, 40) : null; }); irA('p1'); }
    return JSON.stringify(out);
  }
  prueba('Fase 2B: instalación (catálogo de formas con subtipo y add() asigna el tipo)', () => {
    afirmar(typeof NOMBRE_FORMA !== 'undefined' && SH.circulo && !SH['Círculo'], 'js/catalogo.js no es el de la Fase 2B (SH debe usar subtipos)');
    igual(CAT['Formas'].map(d => [d.n, d.tipo, d.sub]), [['Rectángulo', 'forma', 'rectangulo'], ['Círculo', 'forma', 'circulo'], ['Triángulo', 'forma', 'triangulo'], ['Rombo', 'forma', 'rombo'], ['Hexágono', 'forma', 'hexagono']], 'catálogo de formas');
    conProyecto(fVacio().estado, () => {
      const f = [add({ k: 'item', n: 'Router', ic: 'x', w: .8, h: .8, x: 1, y: 1, label: '' }), add({ k: 'line', n: 'Fibra óptica', c: '#f39c12', w: .06, d: '', pts: [{ x: 0, y: 0 }, { x: 1, y: 1 }], label: '' }),
        add({ k: 'line', n: 'Pared', c: '#444444', w: .2, d: '', pts: [{ x: 0, y: 0 }, { x: 1, y: 0 }], label: '' }), add({ k: 'shape', n: 'Círculo', w: 1, h: 1, x: 3, y: 3, c: '#000000', f: 'sol', ls: 'con', label: '' }),
        add({ k: 'item', n: 'Ascensor', ic: 'x', w: 1.5, h: 1.5, x: 5, y: 5, label: '' }), add({ k: 'item', n: 'Escalera', ic: 'x', w: 1, h: 2, x: 7, y: 7, t: 'espiral' })];
      igual(f.map(o => o.tipo + (o.sub ? '/' + o.sub : '')), ['dispositivo/router', 'cable/fibra', 'pared', 'forma/circulo', 'ascensor', 'escalera'], 'tipos de los objetos nuevos');
    });
  });
  prueba('Fase 2B: cambiar el nombre visible no cambia el dibujo (6 proyectos de prueba)', () => {
    fixtures().forEach(fx => igual(huella({ ...fx, estado: renombrar(fx.estado) }), huella(fx), fx.nombre + ': el dibujo cambió al renombrar'));
  });
  prueba('Fase 2B: cambiar el nombre visible no cambia el comportamiento (medidas, imanes, nodos, giro, reglas de escaleras)', () => {
    fixtures().filter(fx => ['dispositivos y cables', 'paredes y puertas', 'formas, zonas y medidas', 'escaleras y plantas'].includes(fx.nombre)).forEach(fx => {
      const a = conProyecto(fx.estado, sonda), b = conProyecto(renombrar(fx.estado), sonda); ser(b, a, fx.nombre + ': el comportamiento cambió al renombrar');
    });
  });
  prueba('Fase 2B: el tipo decide y no el nombre (un objeto llamado «Escalera» de otro tipo no es escalera)', () => {
    igual([esEscalera({ k: 'item', n: 'Escalera', tipo: 'dispositivo' }), esEscalera({ k: 'item', n: 'Cosa', tipo: 'escalera' }), esPared({ k: 'line', n: 'Pared', tipo: 'cable', sub: 'utp6' }), esPared({ k: 'line', n: 'Muro', tipo: 'pared' }),
      esCirculo({ k: 'shape', n: 'Círculo', tipo: 'forma', sub: 'rombo' }), esCirculo({ k: 'shape', n: 'Óvalo', tipo: 'forma', sub: 'circulo' }), esAscensor({ k: 'item', n: 'Ascensor', tipo: 'dispositivo' }), esAscensor({ k: 'item', n: 'Lift', tipo: 'ascensor' })],
      [false, true, false, true, false, true, false, true], 'predicados');
    conProyecto(fVacio().estado, () => {      // una línea llamada «Pared» pero de tipo cable no acepta puertas ni agrupa nodos como pared
      add({ k: 'line', n: 'Pared', tipo: 'cable', sub: 'utp6', c: '#2e86de', w: .06, d: '', pts: [{ x: 0, y: 3 }, { x: 8, y: 3 }], label: '' });
      afirmar(!segmentoCercano({ x: 4, y: 3 }, 1), 'un cable llamado «Pared» se trató como pared'); ser(nodosDeTipo('pared').length, 0, 'nodos de pared'); ser(nodosDeTipo('utp6').length, 2, 'nodos del cable');
    });
  });
  prueba('Fase 2B: colocar con dos puntos asigna el tipo (forma con subtipo, escalera)', () => {
    conProyecto(fVacio().estado, () => {
      const out = [];
      [CAT['Formas'][1], CAT['Edificio'].find(x => x.esc == 'espiral'), CAT['Edificio'].find(x => x.n == 'Escalera')].forEach((d, i) => {   // cada pieza en su lugar: dos escaleras no pueden pisarse
        const x = 2 + i * 6; tool = d; tmp = null; drag = null; clicDosPuntos({ x, y: 2 }, { clientX: 0, clientY: 0 }); out.push([tmp.tipo, esCirculo(tmp), esEscalera(tmp)]);
        ajustarColocacion(tmp, { x: x + 2, y: 3 }); terminarColocacion();
      });
      igual(out, [['forma', true, false], ['escalera', false, true], ['escalera', false, true]], 'piezas en vista previa');
      igual(S.objs.map(o => o.tipo + '/' + (o.sub || o.t || '')), ['forma/circulo', 'escalera/espiral', 'escalera/'], 'objetos colocados');
    });
  });
  prueba('Fase 2B: guardar y abrir conserva tipo y subtipo aunque el nombre visible haya cambiado', () => {
    conR(() => {
      const e = renombrar(fFormas().estado), g = ESQ.serializar(e, R); afirmar(g.ok, g.error); const l = ESQ.leer(g.texto); afirmar(l.ok && !l.avisos.length, 'no reabre limpio');
      igual(l.estado.objs.filter(o => o.k == 'shape').map(o => o.tipo + '/' + o.sub), ['forma/rectangulo', 'forma/hexagono', 'forma/circulo', 'forma/triangulo'], 'tipos tras guardar y abrir');
    });
  });

  // ---------- Pruebas de la Fase 3 (inspector y menú contextual) ----------
  // Los eventos de puntero que llegan a svg usan setPointerCapture: con un pointerId inventado fallaría, por eso se reemplaza un momento por una función vacía.
  const sinCaptura = fn => { svg.setPointerCapture = () => {}; try { return fn(); } finally { delete svg.setPointerCapture; } };
  const ptr = (el, tipo, x, y, extra = {}) => el.dispatchEvent(new PointerEvent(tipo, { clientX: x, clientY: y, button: 0, bubbles: true, cancelable: true, pointerId: 1, ...extra }));
  const conConfirm = (resp, fn) => { const cf = window.confirm; let n = 0; window.confirm = () => (n++, resp); try { fn(); } finally { window.confirm = cf; } return n; };   // responde el confirm() y cuenta cuántas veces se preguntó
  const arrastreSim = (d, cambio, fin = 'pointerup') => { arrastrar(d); push(); drag.pu = 1; cambio(); ptr(svg, fin, 0, 0); };   // arrastre como el de interaccion.js: guarda el paso, cambia y suelta (o cancela)
  const enObj = id => document.querySelector('#c [data-id="' + id + '"]');
  const derecho = el => sinCaptura(() => { ptr(el, 'pointerdown', 300, 200, { button: 2, buttons: 2 }); ptr(svg, 'pointerup', 300, 200, { button: 2 }); });
  const campoInsp = c => document.querySelector('#insp [data-campo="' + c + '"]');
  const camposInsp = () => [...document.querySelectorAll('#insp [data-campo]')].map(e => e.dataset.campo).join();
  const idsMenu = () => [...document.querySelectorAll('#ctx [data-a]')].map(b => b.dataset.a);
  const idsAcc = os => TR.acc.paraMenu(os).flatMap(g => g.items.map(i => i.id));
  const conInsp = fn => { const v = TR.insp.visible(); TR.insp.abrir(); try { return fn(); } finally { if (!v) TR.insp.alternar(); TR.ctx.cerrar(); } };
  const conColor = fn => { const c = $('#col'), v = c.value; try { return fn(); } finally { c.value = v; } };
  const fDup = () => {
    const e = base({}, [item(1, 'PC', '💻', 3, 3, { cp: 'c2' }), pared(2, [{ x: 1, y: 6 }, { x: 8, y: 6 }]), puerta(3, 2, 0, 2, .9, 1, 1, 'izq'), cable(4, 'UTP Cat6', '#2e86de', .06, '', [{ x: 3, y: 3, ref: 1 }, { x: 9, y: 3 }])]);
    e.plantas = [{ id: 'p1', nombre: 'Planta 1', ca: 'c1', capas: [capa('c1', 'Base'), capa('c2', 'Otra')] }]; e.cn = 2; return e;
  };
  prueba('Fase 3: instalación (acciones.js, inspector.js, contexto.js, eventos.js obligatorio y TR.stats intacto)', () => {
    afirmar(typeof TR !== 'undefined' && TR.acc && TR.insp && TR.ctx && TR.ui, 'faltan js/acciones.js, js/inspector.js o js/contexto.js (o index.html no los carga)');
    afirmar($('#insp') && $('#insp-cuerpo') && $('#ctx') && $('#binsp'), 'falta el HTML del inspector o del menú en index.html');
    igual(Object.keys(TR.stats), ['fondo', 'rejilla', 'obj', 'tmp', 'paneles', 'menu'], 'las claves de TR.stats no deben cambiar');
    afirmar(TR.acc.campos.length >= 10 && TR.acc.acciones.length >= 10 && typeof TR.acc.fijar == 'function', 'el registro de campos y acciones está vacío');
  });
  prueba('Fase 3: el inspector no se reconstruye con 100 movimientos del ratón y no pierde foco ni texto', () => {
    conInsp(() => conProyecto(fDispositivos().estado, () => {
      sel = 1; render(); const el = campoInsp('label'); afirmar(el, 'no hay campo de etiqueta');
      el.focus(); el.value = 'texto sin confirmar'; const dom = $('#insp-cuerpo').firstElementChild; TR.reiniciar();
      for (let i = 0; i < 100; i++) mover(i);
      ser(TR.ui.inspector, 0, 'reconstrucciones del inspector'); ser(TR.ui.enSitio, 0, 'actualizaciones del inspector'); ser(document.activeElement, el, 'foco'); ser(el.value, 'texto sin confirmar', 'texto');
      ser($('#insp-cuerpo').firstElementChild, dom, 'el DOM cambió');
      render(); ser(TR.ui.inspector, 0, 'un render sin cambios reconstruyó el inspector'); ser(document.activeElement, el, 'foco tras render'); ser(el.value, 'texto sin confirmar', 'texto tras render');
    }));
  });
  prueba('Fase 3: editar desde el inspector: un paso por cambio, deshacer y rehacer, y el proyecto sigue siendo guardable', () => {
    conR(() => conInsp(() => conProyecto(fDispositivos().estado, () => {
      completarTipo(byId(1)); sel = 1; render(); let h = hist.length;   // como al crearlo con add(): el tipo queda escrito, así renombrar no lo cambia
      const cambia = (campo, valor) => { const el = campoInsp(campo); afirmar(el, 'no hay campo ' + campo); el.value = valor; el.dispatchEvent(new Event('change', { bubbles: true })); ser(hist.length, ++h, campo + ': pasos de historial'); };
      cambia('n', 'Router principal'); cambia('label', 'RX'); cambia('x', '5.5'); cambia('w', '1.5'); cambia('rot', '45');
      let o = byId(1); igual([o.n, o.label, o.x, o.w, o.rot, tipoDe(o), subDe(o)], ['Router principal', 'RX', 5.5, 1.5, 45, 'dispositivo', 'router'], 'valores tras editar');
      ser(campoInsp('rot').value, '45', 'el campo no muestra el valor');
      const g = ESQ.serializar(S, R); afirmar(g.ok, g.error); const l = ESQ.leer(g.texto); afirmar(l.ok && !l.avisos.length, 'el proyecto editado no reabre limpio');
      for (let i = 0; i < 5; i++) deshacer(); o = byId(1); igual([o.n, o.label, o.x, o.w, o.rot || 0], ['Router', 'R1', 3, .8, 0], 'valores tras deshacer'); ser(hist.length, h - 5, 'pasos tras deshacer');
      for (let i = 0; i < 5; i++) rehacer(); o = byId(1); igual([o.n, o.label, o.x, o.w, o.rot], ['Router principal', 'RX', 5.5, 1.5, 45], 'valores tras rehacer');
    })));
  });
  prueba('Fase 3: valores inválidos o fuera de rango no rompen nada ni guardan pasos de más', () => {
    conR(() => conProyecto(fDispositivos().estado, () => {
      const h = hist.length, o = byId(1), x0 = o.x;
      ser(TR.acc.fijar([1], 'x', 'abc').ok, false, 'texto en un número'); ser(TR.acc.fijar([1], 'x', '').ok, false, 'vacío'); ser(o.x, x0, 'x cambió'); ser(hist.length, h, 'pasos');
      afirmar(TR.acc.fijar([1], 'x', String(x0)).sinCambio, 'el mismo valor no es un cambio'); ser(hist.length, h, 'pasos con el mismo valor');
      TR.acc.fijar([1], 'w', '-4'); ser(o.w, .2, 'ancho mínimo'); TR.acc.fijar([1], 'x', '1e9'); ser(o.x, 1e5, 'tope de coordenada'); TR.acc.fijar([1], 'rot', '-90'); ser(o.rot, 270, 'giro normalizado'); ser(hist.length, h + 3, 'pasos');
      ser(TR.acc.fijar([1], 'c', '#ff0000').ok, false, 'un dispositivo no tiene color');
      const g = ESQ.serializar(S, R); afirmar(g.ok, g.error);
    }));
    conProyecto(fFormas().estado, () => { const h = hist.length; ser(TR.acc.fijar([7], 'label', '   ').ok, false, 'un texto no puede quedar vacío'); ser(byId(7).label, 'Texto libre'); ser(hist.length, h); });
  });
  prueba('Escaleras: se validan contra la planta de abajo, la misma planta y la de arriba; arrastrar a un lugar inválido vuelve atrás sin historial; se ven las vecinas', () => {
    conProyecto(fEscaleras().estado, () => {
      irA('p1'); tool = null; tmp = null; drag = null; const ne = (t, x, y, w, h, extra) => ({ k: 'item', n: 'Escalera', tipo: 'escalera', ...(t ? { t } : {}), x, y, w, h, rot: 0, ...extra });
      afirmar(/se superpone/.test((escaleraObstruida(ne('', 3.3, 3, 1.2, 2.8)) || {}).msg), 'misma planta: no puede pisar otra escalera');
      ser(escaleraObstruida(ne('', 15, 9, 1.2, 2.8)), null, 'lugar libre');
      S.objs.push({ ...ne('', 15, 9, 1.2, 2.8, { pl: 'p2', cp: 'c2' }), id: 90 }); completarTipo(byId(90));
      afirmar(/obstruye.*superior/.test((escaleraObstruida(ne('descanso', 15, 9, 1.6, 2.8)) || {}).msg), 'arriba hay una recta: no se puede poner nada debajo');
      S.objs.push({ ...ne('espiral', 15, 14, 1.8, 1.8, { pl: 'p2', cp: 'c2' }), id: 91 }); completarTipo(byId(91));
      afirmar(/exactamente debajo/.test((escaleraObstruida(ne('espiral', 15.4, 14, 1.8, 1.8)) || {}).msg), 'espiral arriba: solo exactamente debajo');
      ser(escaleraObstruida(ne('espiral', 15, 14, 1.8, 1.8)), null, 'alineada con la de arriba sí');
      afirmar(/debajo de una del mismo tipo/.test((escaleraObstruida(ne('descanso', 15, 14, 1.8, 1.8)) || {}).msg), 'otro tipo arriba');
      // mover la escalera con descanso de abajo (apilada con la 5 de arriba): si queda pisándola sin alinear, vuelve atrás sin paso de historial
      // escaleras del proyecto: 1 recta, 2 con descanso (apilada con la 5 de la planta 2), 3 espiral, 6 recta girada
      const h = hist.length; sel = 2; multi = []; arrastreSim({ m: 'mv', os: [byId(2)] }, () => { byId(2).x = 6.5; }); ser(byId(2).x, 6, 'volvió a su lugar'); ser(hist.length, h, 'sin paso de historial'); ser(sel, 2, 'conserva la selección');
      arrastreSim({ m: 'mv', os: [byId(2)] }, () => { byId(2).y = 12; }); ser(byId(2).y, 12, 'lejos de las otras sí se puede mover'); ser(hist.length, h + 1); deshacer();
      sel = 2; render(); ser(TR.acc.rotar(90), false, 'girarla la desalinea con la de arriba'); ser(byId(2).rot || 0, 0);
      const P = TR.acc.portapapeles, pp0 = [...P]; try { sel = 1; render(); TR.acc.ejecutar('copiar'); ser(P.length, 1, 'copió'); ser(TR.acc.ejecutar('pegar', { punto: { x: 3, y: 3 } }), false, 'pegar encima de la original'); afirmar(/se superpone/.test($('#toast').textContent), 'motivo del rechazo: ' + $('#toast').textContent); } finally { P.splice(0, P.length, ...pp0); }
      sel = null; ser(escalerasVecinas(), '', 'sin herramienta no se ven'); tool = { k: 'item', n: 'Escalera', tipo: 'escalera' }; afirmar(/↑ Planta 2/.test(escalerasVecinas()), 'en la planta 1 se ven las de arriba');
      irA('p2'); afirmar(/↓ Planta 1/.test(escalerasVecinas()), 'en la planta 2 se ven las de abajo'); tool = null;
    });
  });
  prueba('Fase 3: escaleras editadas desde el inspector se validan con la planta de abajo (se rechaza, se avisa y no hay paso de historial)', () => {
    conInsp(() => conProyecto(fEscaleras().estado, () => {
      irA('p2'); sel = 5; render(); const o = byId(5), h = hist.length, j0 = JSON.stringify(S);
      let r = TR.acc.fijar([5], 'x', '6.5'); ser(r.ok, false, 'movió sobre la de abajo'); afirmar(/exactamente encima/.test(r.motivo), 'motivo: ' + r.motivo);
      const t = $('#toast'); afirmar(t && !t.hidden && /exactamente encima/.test(t.textContent), 'no hay aviso en pantalla');
      ser(TR.acc.fijar([5], 'w', '1.2').ok, false, 'cambió el tamaño sin cumplir la regla'); ser(TR.acc.ejecutar('rotar-der'), false, 'giró y obstruye');
      const pp0 = [...TR.acc.portapapeles]; TR.acc.ejecutar('copiar'); ser(TR.acc.ejecutar('pegar'), false, 'pegó y obstruye'); TR.acc.portapapeles.splice(0, TR.acc.portapapeles.length, ...pp0); ser(JSON.stringify(S), j0, 'cambió el proyecto'); ser(hist.length, h, 'se guardó un paso');
      const el = campoInsp('x'); el.value = '6.5'; el.dispatchEvent(new Event('change', { bubbles: true })); ser(el.value, '6', 'el campo no volvió al valor anterior'); ser(hist.length, h, 'paso tras el campo');
      ser(TR.acc.fijar([5], 'label', 'Escalera A').ok, true, 'la etiqueta no se valida'); ser(hist.length, h + 1);
      ser(TR.acc.fijar([5], 'x', '20').ok, true, 'lejos de la de abajo sí se puede'); ser(byId(5).x, 20); ser(hist.length, h + 2);
      deshacer(); ser(byId(5).x, 6, 'deshacer');
    }));
  });
  prueba('Fase 3: D16: el color de un cable no se puede cambiar (ni al editar ni al dibujar); las paredes sí; en una selección mixta solo cambia la pared', () => {
    conColor(() => conProyecto(base({}, [pared(1, [{ x: 1, y: 1 }, { x: 6, y: 1 }]), cable(2, 'UTP Cat6', '#2e86de', .06, '', [{ x: 1, y: 3 }, { x: 6, y: 3 }])]), () => {
      const h = hist.length, col = $('#col'), mueve = v => { col.value = v; col.oninput(); col.oninput(); col.onchange(); };
      sel = 2; render(); ser(col.disabled, true, 'el selector debe estar desactivado con un cable'); mueve('#ff0000'); ser(byId(2).c, '#2e86de', 'el cable cambió de color'); ser(hist.length, h, 'paso por un cable');
      afirmar(!campoInsp('c') && /lo define su tipo/.test($('#insp-cuerpo').textContent), 'el inspector ofrece color para un cable'); ser(TR.acc.fijar([2], 'c', '#ff0000').ok, false);
      sel = 1; render(); ser(col.disabled, false, 'con una pared el selector debe estar activo'); mueve('#00aa00'); ser(byId(1).c, '#00aa00', 'la pared no cambió'); ser(hist.length, h + 1, 'un paso por gesto');
      deshacer(); ser(byId(1).c, '#444444', 'deshacer el color');
      sel = null; multi = [1, 2]; render(); ser(col.disabled, false, 'selección mixta'); mueve('#0000ff'); ser(byId(1).c, '#0000ff'); ser(byId(2).c, '#2e86de', 'el cable de la selección mixta cambió');
      multi = []; const r = svg.getBoundingClientRect(), dibujar = () => { sinCaptura(() => { ptr(svg, 'pointerdown', r.left + 100, r.top + 100); ptr(svg, 'pointerup', r.left + 100, r.top + 100); ptr(svg, 'pointerdown', r.left + 400, r.top + 100); ptr(svg, 'pointerup', r.left + 400, r.top + 100); }); finishLine(); return S.objs[S.objs.length - 1]; };
      tool = CAT['Cables'][0]; tmp = null; render(); ser(col.disabled, true, 'herramienta de cable'); col.value = '#00ff00'; let n = dibujar(); igual([n.k, n.c], ['line', '#2e86de'], 'el cable nuevo debe usar el color de su tipo');
      tool = CAT['Edificio'][0]; tmp = null; render(); ser(col.disabled, false, 'herramienta de pared'); n = dibujar(); igual([n.k, n.c], ['line', '#00ff00'], 'la pared nueva usa el color elegido');
    }));
  });
  prueba('Fase 3: clic derecho: termina el cable, cancela la medición, abre el menú solo sobre un objeto sin herramienta, y el menú nativo sigue bloqueado', () => {
    conProyecto(fDispositivos().estado, () => {
      const cerrado = () => $('#ctx').hidden;
      tool = CAT['Cables'][0]; tmp = { ...cableEnCurso(), pts: [{ x: 2, y: 2 }, { x: 4, y: 2 }] }; render(); const n0 = S.objs.length, h0 = hist.length; derecho(svg);
      ser(S.objs.length, n0 + 1, 'el cable no terminó'); ser(hist.length, h0 + 1, 'pasos'); ser(tmp, null, 'tmp'); afirmar(cerrado(), 'abrió el menú con un cable en curso');
      tool = { k: 'medida' }; tmp = { k: 'medida', a: { x: 1, y: 1 }, b: { x: 3, y: 1 }, off: 0, st: 1, u: 'm' }; render(); derecho(svg); ser(tmp, null, 'la medición no se canceló'); afirmar(cerrado(), 'abrió el menú midiendo');
      tool = CAT['Dispositivos'][0]; tmp = null; render(); derecho(enObj(1)); afirmar(cerrado(), 'abrió el menú con una herramienta activa');
      tool = null; sel = null; multi = []; render(); derecho(enObj(2)); afirmar(!cerrado(), 'no abrió el menú sobre un objeto'); ser(sel, 2, 'no seleccionó el objeto'); igual(idsMenu().filter(a => ['cortar', 'copiar', 'pegar', 'eliminar', 'duplicar'].includes(a)), ['cortar', 'copiar', 'pegar', 'eliminar'], 'entradas de portapapeles y borrar (sin duplicar)');
      sinCaptura(() => { ptr(svg, 'pointerdown', 10, 10); ptr(svg, 'pointerup', 10, 10); }); afirmar(cerrado(), 'un clic fuera no cerró el menú');
      derecho(svg); afirmar(!cerrado(), 'no hay menú en el fondo vacío'); igual(idsMenu(), ['deshacer', 'rehacer', 'pegar'], 'menú del fondo'); ser(sel, null, 'el fondo debe soltar la selección'); TR.ctx.cerrar();
      const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); svg.dispatchEvent(ev); afirmar(ev.defaultPrevented, 'el menú nativo del navegador ya no está bloqueado');
    });
  });
  prueba('Fase 3: cada tipo ofrece lo que corresponde (cable sin color, pared con color, puerta sin copiar, sinColor para la mesa futura)', () => {
    conProyecto(fDispositivos().estado, () => {
      const cab = idsAcc([byId(5)]), disp = idsAcc([byId(1)]), varios = idsAcc([byId(1), byId(2)]);
      afirmar(!cab.includes('enf-c') && cab.includes('enf-label') && cab.includes('copiar') && !cab.includes('duplicar'), 'menú del cable: ' + cab); afirmar(!disp.includes('enf-c') && disp.includes('enf-geo') && disp.includes('enf-n'), 'menú del dispositivo: ' + disp);
      afirmar(['rotar-der', 'cortar', 'copiar', 'pegar', 'eliminar'].every(a => varios.includes(a)) && !varios.some(a => ['enf-n', 'enf-label', 'enf-geo'].includes(a)), 'acciones comunes de varios objetos: ' + varios);
    });
    conProyecto(fParedes().estado, () => {
      afirmar(idsAcc([byId(1)]).includes('enf-c'), 'la pared debe ofrecer color'); const pu = idsAcc([byId(3)]); afirmar(pu.includes('voltear-lado') && pu.includes('eliminar') && !pu.includes('copiar') && !pu.includes('cortar') && !pu.includes('rotar-der'), 'menú de la puerta: ' + pu);
      const f = o => o.id == 1; TR.acc.sinColor.push(f); try { afirmar(!idsAcc([byId(1)]).includes('enf-c') && TR.acc.fijar([1], 'c', '#123456').ok === false, 'sinColor no se respeta'); } finally { TR.acc.sinColor.splice(TR.acc.sinColor.indexOf(f), 1); }
    });
    conProyecto(fFormas().estado, () => {
      const m = TR.acc.paraMenu([byId(1)]).flatMap(g => g.items); afirmar(m.some(i => i.id == 'f-sol' && i.marca) && m.some(i => i.id == 'ls-con' && i.marca) && m.some(i => i.id == 'enf-c'), 'menú de la forma');
      afirmar(TR.acc.campo('rot').aplica(byId(3)) && !TR.acc.campo('rot').aplica(byId(1)), 'solo el círculo tiene giro numérico');
      const me = idsAcc([byId(8)]); afirmar(me.includes('copiar') && me.includes('cortar') && !me.includes('enf-label') && !me.includes('enf-n'), 'menú de la medida: ' + me);
    });
  });
  prueba('Fase 3: el inspector muestra los campos del tipo (cable sin color, texto sin tamaño, círculo con giro, varios objetos solo lo común)', () => {
    conProyecto(fFormas().estado, () => {
      sel = 1; render(); ser(camposInsp(), 'n,label,x,y,w,h,c,f,ls', 'rectángulo'); sel = 3; render(); ser(camposInsp(), 'n,label,x,y,w,h,rot,c,f,ls', 'círculo'); sel = 5; render(); ser(camposInsp(), 'n,label,x,y,w,h,rot,c,f,ls', 'zona');
      sel = 7; render(); ser(camposInsp(), 'label,x,y,rot', 'texto'); sel = 8; render(); ser(camposInsp(), '', 'medida'); sel = null; multi = [1, 3]; render(); ser(camposInsp(), 'c,f,ls', 'varios');
    });
    conProyecto(fDispositivos().estado, () => { sel = 5; render(); ser(camposInsp(), 'n,label', 'cable'); sel = 1; render(); ser(camposInsp(), 'n,label,x,y,w,h,rot', 'dispositivo'); });
    conProyecto(fParedes().estado, () => { sel = 1; render(); ser(camposInsp(), 'n,label,c', 'pared'); sel = 3; render(); ser(camposInsp(), '', 'puerta'); });
  });
  prueba('Fase 3: con la capa bloqueada ninguna acción ni campo actúa y no se guarda historial', () => {
    conProyecto(fDispositivos().estado, () => {
      sel = 1; render(); const pp0 = [...TR.acc.portapapeles]; TR.acc.ejecutar('copiar'); S.plantas[0].capas[0].bloqueada = true; const h = hist.length, j0 = JSON.stringify(S);
      ser(TR.acc.fijar([1], 'label', 'X').ok, false, 'campo'); ['cortar', 'copiar', 'pegar', 'eliminar', 'rotar-der', 'f-sol'].forEach(a => ser(TR.acc.ejecutar(a), false, 'acción ' + a));
      ser(TR.ctx.abrir({ target: enObj(1), clientX: 5, clientY: 5 }), true, 'sobre algo bloqueado se muestra el menú del fondo'); igual(idsMenu(), ['deshacer', 'rehacer', 'pegar'], 'menú sobre un objeto bloqueado'); TR.ctx.cerrar();
      ser(JSON.stringify(S), j0, 'cambió el proyecto'); ser(hist.length, h, 'historial'); TR.acc.portapapeles.splice(0, TR.acc.portapapeles.length, ...pp0);
    });
  });
  prueba('Fase 3: copiar, cortar y pegar: en la capa activa y en el punto del clic, un paso, reversible, sin uniones ni puertas; no hay «Duplicar»', () => {
    const guardado = [...TR.acc.portapapeles], P = TR.acc.portapapeles;
    try { conProyecto(fDup(), () => {
      ser(TR.acc.acciones.some(a => a.id == 'duplicar'), false, 'duplicar sigue registrado');
      const n0 = S.objs.length, h0 = hist.length; sel = 1; render();
      ser(TR.acc.ejecutar('copiar'), true, 'no copió'); ser(hist.length, h0, 'copiar no debe guardar historial'); ser(S.objs.length, n0, 'copiar no cambia el proyecto'); ser(P.length, 1, 'portapapeles');
      afirmar(!JSON.stringify(P).includes('"id"') && !('pl' in P[0]), 'el portapapeles guarda ids o planta');
      afirmar(TR.acc.ejecutar('pegar', { punto: { x: 10, y: 7 } }), 'no pegó'); ser(S.objs.length, n0 + 1, 'objetos'); ser(hist.length, h0 + 1, 'pasos');
      const c = S.objs[S.objs.length - 1]; igual([c.id > 4, c.pl, c.cp, c.x, c.y, tipoDe(c), subDe(c), sel], [true, 'p1', 'c1', 10, 7, 'dispositivo', 'pc', c.id], 'pegado en la capa activa y en el punto del clic');
      deshacer(); ser(S.objs.length, n0, 'deshacer'); rehacer(); ser(S.objs.length, n0 + 1, 'rehacer');
      sel = 2; render(); TR.acc.ejecutar('copiar'); TR.acc.ejecutar('pegar', { punto: { x: 5, y: 10 } }); const p = S.objs[S.objs.length - 1];
      igual([p.k, p.pts.map(q => [q.x, q.y])], ['line', [[1.5, 10], [8.5, 10]]], 'pared pegada'); ser(S.objs.filter(o => o.k == 'puerta').length, 1, 'se pegó una puerta');
      sel = 4; render(); TR.acc.ejecutar('copiar'); TR.acc.ejecutar('pegar', { punto: { x: 6, y: 5 } }); const k = S.objs[S.objs.length - 1];
      igual(k.pts.map(q => [q.x, q.y]), [[3, 5], [9, 5]], 'cable pegado'); afirmar(k.pts.every(q => !q.ref && !q.rl && !q.ri), 'el cable pegado conserva uniones'); ser(byId(4).pts[0].ref, 1, 'el original perdió su unión');
      const n1 = S.objs.length, h1 = hist.length; fijarSeleccion([1, 4]); render(); TR.acc.copiar(); TR.acc.pegar(); ser(S.objs.length, n1 + 2, 'varios objetos'); ser(hist.length, h1 + 1, 'un paso para varios'); ser(multi.length, 2, 'selección de lo pegado'); afirmar(multi.every(i => i > 4), 'ids nuevos');
      const n2 = S.objs.length, h2 = hist.length; sel = 1; multi = []; render(); ser(TR.acc.ejecutar('cortar'), true, 'no cortó'); ser(byId(1), undefined, 'el objeto cortado sigue'); ser(hist.length, h2 + 1, 'cortar = un paso'); ser(P.length, 1, 'lo cortado debe quedar en el portapapeles');
      deshacer(); afirmar(byId(1), 'deshacer el corte'); ser(S.objs.length, n2, 'objetos tras deshacer'); rehacer(); ser(byId(1), undefined, 'rehacer el corte');
      ser(TR.acc.ejecutar('pegar', { punto: { x: 3, y: 3 } }), true, 'pegar lo cortado'); ser(S.objs.length, n2, 'cortar y pegar mantiene la cantidad');
      sel = 3; multi = []; render(); const n3 = S.objs.length; ser(TR.acc.ejecutar('copiar'), false, 'copió una puerta sola'); ser(TR.acc.ejecutar('cortar'), false, 'cortó una puerta sola'); ser(S.objs.length, n3);
      P.length = 0; sel = null; render(); const h4 = hist.length; ser(TR.acc.ejecutar('pegar'), false, 'pegó con el portapapeles vacío'); ser(hist.length, h4);
    }); } finally { P.splice(0, P.length, ...guardado); }
    conProyecto(fFormas().estado, () => {
      const h = hist.length; sel = 1; selEdge = { id: 1, i: 0 }; render(); TR.acc.ejecutar('eliminar'); ser(byId(1), undefined, 'debe borrarse el objeto completo, no solo el lado'); ser(hist.length, h + 1); deshacer(); afirmar(byId(1), 'deshacer');
    });
  });
  prueba('Fase 3: clic derecho en el fondo vacío: volver atrás, adelante y pegar (se desactivan si no se pueden usar) y pegar en el punto del clic', () => {
    const guardado = [...TR.acc.portapapeles], P = TR.acc.portapapeles;
    try { conProyecto(fDispositivos().estado, () => {
      const ok = () => [...document.querySelectorAll('#ctx button')].map(b => !b.disabled);
      P.length = 0; hist.length = 0; fut.length = 0; sel = 1; render(); derecho(svg); igual(idsMenu(), ['deshacer', 'rehacer', 'pegar'], 'entradas'); igual(ok(), [false, false, false], 'sin historial ni portapapeles todo debe estar desactivado'); ser(sel, null, 'selección'); TR.ctx.cerrar();
      const w0 = S.edificio.w; push(); S.edificio.w = 25; derecho(svg); igual(ok(), [true, false, false], 'con un paso hecho'); $('#ctx [data-a="deshacer"]').click(); ser(S.edificio.w, w0, 'volver atrás'); ser(fut.length, 1, 'rehacer disponible');
      derecho(svg); igual(ok(), [false, true, false], 'tras deshacer'); $('#ctx [data-a="rehacer"]').click(); ser(S.edificio.w, 25, 'adelante');
      sel = 1; render(); TR.acc.ejecutar('copiar'); const n0 = S.objs.length, h0 = hist.length; derecho(svg); igual(ok(), [true, false, true], 'con portapapeles'); $('#ctx [data-a="pegar"]').click();
      const pt0 = toW({ clientX: 300, clientY: 200 }), c = S.objs[S.objs.length - 1]; ser(S.objs.length, n0 + 1, 'no pegó'); ser(hist.length, h0 + 1, 'pasos'); igual([c.x, c.y], [pt0.x, pt0.y], 'debe pegarse centrado en el punto del clic');
      derecho(enObj(2)); igual(idsMenu().filter(a => ['deshacer', 'rehacer'].includes(a)), [], 'el menú de un objeto no lleva deshacer/rehacer'); TR.ctx.cerrar();
    }); } finally { P.splice(0, P.length, ...guardado); TR.ctx.cerrar(); }
  });
  prueba('Fase 3: atajos Ctrl+C, Ctrl+X y Ctrl+V (Cmd en Mac): copian, cortan y pegan en el cursor, un paso cada uno, y no actúan dentro de un campo ni con una herramienta activa', () => {
    const guardado = [...TR.acc.portapapeles], P = TR.acc.portapapeles, tecla = (el, key, extra = {}) => { const ev = new KeyboardEvent('keydown', { key, ctrlKey: true, bubbles: true, cancelable: true, ...extra }); el.dispatchEvent(ev); return ev; };
    try { conProyecto(fDispositivos().estado, () => {
      const n0 = S.objs.length, h0 = hist.length; P.length = 0; sel = 1; render();
      afirmar(tecla(svg, 'c').defaultPrevented, 'Ctrl+C no actuó'); ser(P.length, 1, 'portapapeles'); ser(hist.length, h0, 'copiar no guarda historial'); ser(S.objs.length, n0);
      curP = { x: 12, y: 6 }; afirmar(tecla(svg, 'v').defaultPrevented, 'Ctrl+V no actuó'); const c = S.objs[S.objs.length - 1];
      ser(S.objs.length, n0 + 1, 'pegar'); ser(hist.length, h0 + 1, 'pegar = un paso'); igual([c.x, c.y], [12, 6], 'debe pegarse centrado en el cursor'); ser(sel, c.id, 'selección = lo pegado');
      ser(tecla(svg, 'x').defaultPrevented, true, 'Ctrl+X no actuó'); ser(byId(c.id), undefined, 'cortar'); ser(hist.length, h0 + 2, 'cortar = un paso'); ser(P.length, 1);
      ser(tecla(svg, 'v', { ctrlKey: false, metaKey: true }).defaultPrevented, true, 'Cmd+V (Mac)'); ser(S.objs.length, n0 + 1, 'pegar con Cmd');
      const h1 = hist.length, n1 = S.objs.length, inp = document.createElement('input'); inp.type = 'text'; document.body.appendChild(inp);
      try { tecla(inp, 'v'); tecla(inp, 'x'); } finally { inp.remove(); } ser(S.objs.length, n1, 'los atajos actuaron dentro de un campo'); ser(hist.length, h1);
      tool = CAT['Dispositivos'][0]; sel = null; render(); tecla(svg, 'v'); ser(S.objs.length, n1, 'pegó con una herramienta activa'); tool = null;
      sel = 1; render(); const ev = tecla(svg, 'v', { shiftKey: true }); ser(ev.defaultPrevented, false, 'Ctrl+Mayús+V no es pegar'); ser(S.objs.length, n1);
      sel = null; render(); ser(tecla(svg, 'c').defaultPrevented, false, 'Ctrl+C sin selección no debe bloquear el copiar del navegador');
    }); } finally { P.splice(0, P.length, ...guardado); }
  });
  prueba('Fase 3: una edición escrita y sin confirmar se aplica al objeto original aunque se haga clic en otro objeto', () => {
    conInsp(() => conProyecto(fDispositivos().estado, () => {
      sel = 1; render(); const el = campoInsp('label'); el.focus(); el.value = 'PENDIENTE'; const h = hist.length;
      sinCaptura(() => { ptr(enObj(2), 'pointerdown', 300, 200); ptr(svg, 'pointerup', 300, 200); });
      ser(byId(1).label, 'PENDIENTE', 'la edición se perdió'); ser(byId(2).label, '', 'la edición cayó en otro objeto'); ser(sel, 2, 'selección'); ser(hist.length, h + 1, 'pasos'); ser(campoInsp('label').value, '', 'el inspector no pasó al objeto nuevo');
    }));
  });
  prueba('Fase 3: acciones del menú: relleno (un paso, reversible), «Etiqueta…» enfoca el campo del inspector y rotar guarda un paso', () => {
    conInsp(() => conProyecto(fFormas().estado, () => {
      derecho(enObj(1)); let h = hist.length; $('#ctx [data-a="f-hat"]').click(); ser(byId(1).f, 'hat', 'relleno'); ser(hist.length, h + 1, 'pasos'); afirmar($('#ctx').hidden, 'el menú sigue abierto');
      deshacer(); ser(byId(1).f, 'sol', 'deshacer'); rehacer(); ser(byId(1).f, 'hat', 'rehacer');
      derecho(enObj(1)); $('#ctx [data-a="enf-label"]').click(); ser(document.activeElement, campoInsp('label'), 'el campo de etiqueta no recibió el foco');
      h = hist.length; derecho(enObj(1)); $('#ctx [data-a="rotar-der"]').click(); ser(hist.length, h + 1, 'pasos al rotar');
      const pngSel = (() => { derecho(enObj(1)); const x = construirSvgExport().xml; TR.ctx.cerrar(); return x; })(); afirmar(!/data-a=|insp|ctx/.test(pngSel), 'el PNG incluye partes del menú o del inspector'); ser(sel, 1, 'la selección no se conservó tras exportar');
    }));
  });
  prueba('Fase 3: teclado: Supr/Retroceso no borran con checkbox, color, resumen o textarea enfocados; dentro de un campo los atajos no actúan; Esc cierra primero el menú', () => {
    const b0 = window.borrar, s0 = window.setTool; let nb = 0, ns = 0; window.borrar = () => { nb++; }; window.setTool = () => { ns++; };
    const mk = (tag, type) => { const e = document.createElement(tag); if (type) e.type = type; document.body.appendChild(e); return e; };
    const els = [mk('input', 'checkbox'), mk('input', 'color'), mk('textarea'), mk('input', 'text'), mk('input', 'number')], det = mk('details'), sm = document.createElement('summary'); det.appendChild(sm);
    const tecla = (el, key, extra = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...extra }));
    try {
      [...els, sm].forEach(el => ['Delete', 'Backspace'].forEach(k => tecla(el, k))); ser(nb, 0, 'borró con un campo enfocado');
      ['Delete', 'Backspace'].forEach(k => tecla(svg, k)); ser(nb, 2, 'no borra con el foco en el plano');
      const g0 = rejilla, h0 = hist.length; tecla(els[3], 'g'); tecla(els[3], 'z', { ctrlKey: true }); tecla(els[2], 'g'); ser(rejilla, g0, 'G dentro de un campo'); ser(hist.length, h0, 'Ctrl+Z dentro de un campo');
      conProyecto(fDispositivos().estado, () => {
        derecho(enObj(1)); afirmar(!$('#ctx').hidden, 'el menú no abrió'); tecla(document.activeElement || document.body, 'Escape'); afirmar($('#ctx').hidden, 'Esc no cerró el menú'); ser(ns, 0, 'Esc con el menú abierto cambió la herramienta');
        tecla(svg, 'Escape'); ser(ns, 1, 'Esc sin menú debe seguir soltando la herramienta');
        derecho(enObj(1)); const bs = [...document.querySelectorAll('#ctx button:not(:disabled)')]; tecla(document.activeElement, 'ArrowDown'); ser(document.activeElement, bs[1], 'flecha abajo'); tecla(document.activeElement, 'End'); ser(document.activeElement, bs[bs.length - 1], 'fin'); TR.ctx.cerrar();
      });
    } finally { window.borrar = b0; window.setTool = s0; els.forEach(e => e.remove()); det.remove(); TR.ctx.cerrar(); }
  });
  prueba('Fase 3: abrir y cerrar el inspector (cajón) no cambia el proyecto y mantiene las reglas al día', () => {
    const v = TR.insp.visible(); try {
      const j0 = JSON.stringify(S), h0 = hist.length; TR.insp.alternar(); ser($('#insp').classList.contains('cerrado'), v, 'clase cerrado'); ser($('#binsp').getAttribute('aria-pressed'), String(!v), 'aria-pressed');
      TR.insp.alternar(); ser($('#insp').classList.contains('cerrado'), !v); ser(JSON.stringify(S), j0, 'cambió el proyecto'); ser(hist.length, h0, 'cambió el historial');
    } finally { if (TR.insp.visible() != v) TR.insp.alternar(); }
  });

  // ---------- Pruebas del cable único que atraviesa escaleras (ajuste de la Fase 3) ----------
  const fCruce = () => {                       // 3 plantas; en la planta 2 hay una escalera de cada tipo
    const e = base({ pn: 3, cn: 3 }, [esc(1, 'descanso', 1.6, 2.8, 6, 3, { pl: 'p2', cp: 'c2' }), esc(2, '', 1.2, 2.8, 12, 3, { pl: 'p2', cp: 'c2' }), esc(3, 'espiral', 1.8, 1.8, 9, 3, { pl: 'p2', cp: 'c2' }),
      esc(11, 'descanso', 1.6, 2.8, 6, 3), esc(12, '', 1.2, 2.8, 12, 3), esc(13, 'espiral', 1.8, 1.8, 9, 3)]);   // iguales en la planta 1 (justo debajo): sin ellas no se puede bajar
    e.plantas = [{ id: 'p1', nombre: 'Planta 1', ca: 'c1', capas: [capa('c1', 'Base')] }, { id: 'p2', nombre: 'Planta 2', ca: 'c2', capas: [capa('c2', 'Base')] }, { id: 'p3', nombre: 'Planta 3', ca: 'c3', capas: [capa('c3', 'Base')] }];
    return e;
  };
  const tecla = (el, key) => el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  const pant = (x, y) => { const r = svg.getBoundingClientRect(); return { x: r.left + V.ox + x * V.z, y: r.top + V.oy + y * V.z }; };
  const clic = (x, y) => sinCaptura(() => { const p = pant(x, y); ptr(svg, 'pointerdown', p.x, p.y); ptr(svg, 'pointerup', p.x, p.y); });
  const cruzar = (idEsc, sube, libres = [[1, 7], [2, 7]], destino = [[8, 1], [9, 1]]) => {   // dibuja con la herramienta de cable: puntos libres, clic en la escalera, opción elegida, más puntos libres y termina
    tool = CAT['Cables'][0]; tmp = null; S.plantaAct = 'p2'; S.capaAct = 'c2'; render(); libres.forEach(([x, y]) => clic(x, y));
    const E = byId(idEsc); clic(E.x, E.y); afirmar(!$('#ctx').hidden, 'no se abrió el menú de la escalera');
    const b = $('#ctx [data-a="' + (sube ? 'sube' : 'baja') + '"]'); afirmar(!b.disabled, 'la opción está desactivada'); b.click();
    destino.forEach(([x, y]) => clic(x, y)); finishLine(); return S.objs[S.objs.length - 1];
  };
  prueba('Cable por escalera: la geometría del recorrido de las tres escaleras (mitades, punto medio repetido, giro y sentido contrario)', () => {
    conProyecto(fCruce(), () => {
      const R = (E, s) => trazaEscalera(E, s), ult = a => a[a.length - 1], pn = p => [p.x, p.y];
      const rec = byId(2), a = R(rec, true); igual([a.inicio.map(pn), a.fin.map(pn)], [[[12.13, 4.4], [12.13, 3]], [[12.13, 3], [12.13, 1.6]]], 'recta subiendo');
      const b = R(rec, false); igual([b.inicio.map(pn), b.fin.map(pn)], [[[11.87, 1.6], [11.87, 3]], [[11.87, 3], [11.87, 4.4]]], 'recta bajando');
      const des = byId(1), d = R(des, true); igual(pn(ult(d.inicio)), pn(d.fin[0]), 'el punto medio debe estar en las dos mitades'); ser(d.inicio.length + d.fin.length, 6, 'puntos del descanso'); afirmar(d.inicio[0].x < 6 && d.fin[2].x > 6, 'sube por la izquierda y baja por la derecha'); ser(ult(d.inicio).x, 6, 'el medio del descanso está en el eje');
      const db = R(des, false); afirmar(db.inicio[0].x > 6 && ult(db.fin).x < 6, 'bajando se entra por la derecha (como la imagen de referencia) y se sale por la izquierda');
      const esp = byId(3), e = R(esp, true); ser(e.inicio.length + e.fin.length, 20, 'puntos de la espiral'); igual(pn(ult(e.inicio)), pn(e.fin[0]), 'medio de la espiral'); afirmar(e.inicio[0].x < 9, 'la espiral empieza a la izquierda');
      rec.rot = 90; const g = R(rec, true); igual([g.inicio[0].x, g.inicio[0].y], [10.6, 3.13], 'la escalera girada 90° gira su recorrido (la entrada pasa de abajo a la izquierda)');
    });
  });
  prueba('Cable por escalera: bajar solo si justo debajo hay una escalera igual; subir solo desde una escalera de esta planta; el reflejo solo permite bajar', () => {
    conProyecto(fCruce(), () => {
      tool = CAT['Cables'][0]; tmp = null; S.plantaAct = 'p2'; S.capaAct = 'c2'; render(); const E = byId(1), ok = d => puedeCruzar(E, d);
      ser(ok(1).ok, true, 'subir desde una escalera de esta planta'); ser(ok(-1).ok, true, 'bajar con una igual justo debajo');
      byId(11).x += .5; ser(ok(-1).ok, false, 'la de abajo está corrida'); afirmar(/igual/.test(ok(-1).motivo), ok(-1).motivo); byId(11).x -= .5; ser(ok(-1).ok, true);
      byId(11).t = 'espiral'; ser(ok(-1).ok, false, 'la de abajo es de otro tipo'); byId(11).t = 'descanso'; byId(11).w = 1.8; ser(ok(-1).ok, false, 'la de abajo tiene otro tamaño'); byId(11).w = 1.6; byId(11).rot = 90; ser(ok(-1).ok, false, 'la de abajo está girada'); byId(11).rot = 0;
      byId(11).x += .5; render(); const antes = S.plantaAct; tmp = null; clic(1, 7); clic(E.x, E.y);
      ser($('#ctx [data-a="baja"]').disabled, true, 'el menú debe desactivar bajar'); afirmar(/no hay una escalera igual/.test($('#ctx [data-a="baja"]').textContent), $('#ctx [data-a="baja"]').textContent); ser($('#ctx [data-a="sube"]').disabled, false, 'subir sí'); TR.ctx.cerrar();
      const n = tmp.pts.length; ser(cruzarEscalera(E, -1), false, 'cruzarEscalera debe rechazar bajar'); ser(tmp.pts.length, n, 'no debe agregar puntos'); ser(S.plantaAct, antes, 'no debe cambiar de planta'); byId(11).x -= .5;
      S.plantaAct = 'p1'; S.capaAct = 'c1'; render(); const E1 = byId(11); ser(puedeCruzar(E1, -1).ok, false, 'en la planta más baja no hay planta inferior'); ser(puedeCruzar(E1, 1).ok, true);
      S.objs = S.objs.filter(o => ![1, 2, 3].includes(o.id)); S.plantaAct = 'p2'; S.capaAct = 'c2'; render(); tmp = null; clic(1, 7); clic(6, 3);
      afirmar(!$('#ctx').hidden, 'el reflejo de la escalera de abajo debe recibir el clic'); ser($('#ctx [data-a="sube"]').disabled, true, 'el reflejo no deja subir'); afirmar(/llega aquí desde abajo/.test($('#ctx [data-a="sube"]').textContent)); ser($('#ctx [data-a="baja"]').disabled, false, 'el reflejo sí deja bajar'); $('#ctx [data-a="baja"]').click(); ser(S.plantaAct, 'p1');
    });
  });
  prueba('Cable por escalera: el cable va a un costado de la flecha y el que baja usa otro carril que el que sube (recta, con descanso y espiral)', () => {
    conProyecto(fCruce(), () => {
      const R = (id, s) => trazaEscalera(byId(id), s), todos = r => [...r.inicio, ...r.fin];
      const rs = R(2, true), rb = R(2, false); afirmar(todos(rs).every(p => p.x > 12) && todos(rb).every(p => p.x < 12), 'recta: sube a un lado del eje de la flecha y baja al otro');
      const ds = R(1, true), db = R(1, false); afirmar(ds.inicio[0].x != 6 + (-.445) && Math.abs(ds.inicio[0].x - (6 - .445)) > .1, 'descanso: el cable no debe ir sobre el eje de la flecha');
      afirmar(Math.abs(ds.inicio[0].x - db.fin[2].x) > .2 && Math.abs(ds.fin[2].x - db.inicio[0].x) > .2, 'descanso: carriles distintos al subir y al bajar en cada tramo'); const yL = ds.inicio[1].y, yb = db.inicio[1].y; afirmar(Math.abs(yL - yb) > .15, 'descanso: carriles distintos en el descanso');
      afirmar(todos(ds).every(p => Math.abs(p.x - 6) <= .8 && p.y >= 3 - 1.4 && p.y <= 3 + 1.4), 'descanso: el cable debe quedar dentro de la escalera');
      const es = R(3, true), eb = R(3, false), rad = p => Math.hypot(p.x - 9, p.y - 3); const interno = es.inicio.slice(1).concat(es.fin.slice(0, -1)).map(rad), externo = eb.inicio.slice(1).concat(eb.fin.slice(0, -1)).map(rad);
      afirmar(Math.max(...interno) < Math.min(...externo), 'espiral: el que sube va por dentro del anillo y el que baja por fuera');
    });
  });
  prueba('Cable por escalera: en la espiral el cable entra y sale en línea recta por el cuarto abierto, cruzando los dos bordes rectos y sin cortarse a sí mismo', () => {
    conProyecto(fCruce(), () => {
      const E = byId(3), cx = E.x, cy = E.y, u = trazaEscalera(E, true), d = trazaEscalera(E, false), ult = a => a[a.length - 1], pen = a => a[a.length - 2];
      ser(u.inicio.length + u.fin.length, 20, 'puntos'); ser(u.inicio[0].x, u.inicio[1].x, 'subiendo: la entrada es vertical'); afirmar(u.inicio[0].y > cy && u.inicio[1].y < cy, 'subiendo: cruza el borde recto horizontal (de abajo hacia arriba)'); afirmar(u.inicio[0].x < cx, 'la entrada está en el cuarto abierto (a la izquierda del centro)');
      ser(ult(u.fin).y, pen(u.fin).y, 'subiendo: la salida es horizontal'); afirmar(pen(u.fin).x > cx && ult(u.fin).x < cx, 'cruza el borde recto vertical (hacia la izquierda)'); afirmar(ult(u.fin).y > cy, 'la salida está en el cuarto abierto (debajo del centro)');
      ser(d.inicio[0].y, d.inicio[1].y, 'bajando: entra en horizontal'); afirmar(d.inicio[0].x < cx && d.inicio[1].x > cx, 'bajando: cruza el borde recto vertical hacia la derecha'); ser(ult(d.fin).x, pen(d.fin).x, 'bajando: sale en vertical'); afirmar(pen(d.fin).y < cy && ult(d.fin).y > cy, 'bajando: sale cruzando el borde recto horizontal hacia abajo');
      const corta = (A, B, C, D) => { const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)); return o(A, B, C) != o(A, B, D) && o(C, D, A) != o(C, D, B); };
      [u, d].forEach((r, i) => { const P = [...r.inicio, ...r.fin].filter((q, k, A) => !k || q.x !== A[k - 1].x || q.y !== A[k - 1].y); /* sin el punto medio repetido */ let cruces = 0; for (let a = 0; a < P.length - 1; a++) for (let b = a + 2; b < P.length - 1; b++) if (corta(P[a], P[a + 1], P[b], P[b + 1])) cruces++; ser(cruces, 0, (i ? 'bajando' : 'subiendo') + ': el cable se corta a sí mismo'); });
      const dentro = P => P.every(p => Math.abs(p.x - cx) <= .9 + 1e-6 && Math.abs(p.y - cy) <= .9 + 1e-6); afirmar(dentro([...u.inicio, ...u.fin]) && dentro([...d.inicio, ...d.fin]), 'el cable debe quedar dentro del cuadro de la escalera');
    });
  });
  prueba('Cable por escalera: un solo objeto y un solo paso de historial; opciones según las plantas; Esc cancela el clic', () => {
    conProyecto(fCruce(), () => {
      const n0 = S.objs.length, h0 = hist.length; tool = CAT['Cables'][0]; tmp = null; S.plantaAct = 'p2'; S.capaAct = 'c2'; render();
      clic(1, 7); const E = byId(1); clic(E.x, E.y);
      afirmar(!$('#ctx').hidden && !$('#ctx [data-a="sube"]').disabled && !$('#ctx [data-a="baja"]').disabled, 'en la planta del medio las dos opciones deben estar activas');
      const j0 = JSON.stringify(tmp); tecla(document.activeElement, 'Escape'); afirmar($('#ctx').hidden, 'Esc no cerró'); ser(JSON.stringify(tmp), j0, 'Esc debe cancelar el clic sin tocar el cable'); ser(S.plantaAct, 'p2');
      tmp = null; const o = cruzar(1, true); ser(S.objs.length, n0 + 1, 'debe ser UN objeto'); ser(hist.length, h0 + 1, 'un solo paso'); ser(o.k, 'line'); ser(o.pl, 'p2', 'planta de origen'); ser(S.plantaAct, 'p3', 'la vista pasó a la planta de arriba');
      afirmar(esMultiplanta(o), 'el cable debe tener puntos de varias plantas'); ser(o.pts.length, 2 + 6 + 2, 'puntos: 2 libres, 6 de la escalera y 2 libres arriba');
      igual(o.pts.slice(2, 8).map(q => [q.pl, q.es, q.ed]), [['p2', 1, 1], ['p2', 1, 1], ['p2', 1, 1], ['p3', 1, 1], ['p3', 1, 1], ['p3', 1, 1]], 'marcas del recorrido'); igual(o.pts.slice(8).map(q => q.pl), ['p3', 'p3'], 'puntos libres de la planta de arriba'); afirmar(!o.pts[0].pl && !o.pts[1].pl, 'los puntos de origen no llevan marca');
      const g = ESQ.serializar(S, R); afirmar(g.ok, g.error); const l = ESQ.leer(g.texto); afirmar(l.ok && !l.avisos.length, 'no reabre limpio: ' + (l.avisos || l.errores)); const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v == 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v; ser(JSON.stringify(canon(JSON.parse(ESQ.serializar(l.estado, R).texto))), JSON.stringify(canon(JSON.parse(g.texto))), 'la ida y vuelta perdió o cambió algún campo (sin contar el orden de las claves)');
    });
  });
  prueba('Cable por escalera: cada planta ve su mitad en sólido y la otra translúcida; sin cruzar, nada se ve de más', () => {
    conProyecto(fCruce(), () => {
      const o = cruzar(1, true), solidos = () => [...document.querySelectorAll('#c polyline')].filter(p => p.getAttribute('stroke') == '#2e86de' && !p.getAttribute('opacity')).length, fantasmas = () => [...document.querySelectorAll('#c polyline[opacity=".35"]')].length;
      S.plantaAct = 'p2'; S.capaAct = 'c2'; render(); ser(solidos(), 1, 'planta 2: tramo libre + su mitad en un trazo'); ser(fantasmas(), 1, 'planta 2: la otra mitad translúcida');
      S.plantaAct = 'p3'; S.capaAct = 'c3'; render(); ser(solidos(), 1, 'planta 3: su mitad + los puntos libres de arriba'); ser(fantasmas(), 1, 'planta 3: la mitad de abajo translúcida');
      S.plantaAct = 'p1'; S.capaAct = 'c1'; render(); ser(solidos() + fantasmas(), 0, 'la planta 1 no debe mostrar el cable'); afirmar(!esVisible(o), 'no debe ser visible en la planta 1');
      S.plantaAct = 'p3'; S.capaAct = 'c3'; S.plantas[2].capas[0].visible = false; render(); ser(solidos() + fantasmas(), 0, 'con la capa oculta no se ve'); ser(esVisible(o), false);
      S.plantas[2].capas[0].visible = true; S.plantas[2].capas[0].bloqueada = true; render(); ser(esVisible(o), true); ser(esEditable(o), false, 'capa bloqueada: visible pero no editable');
      S.plantaAct = 'p2'; S.capaAct = 'c2'; render(); ser(esEditable(o), true, 'en la planta 2 sí se edita');
    });
  });
  prueba('Cable por escalera: se puede agarrar dentro de la escalera, es un solo cable (borrar quita todo) y deshacer lo restituye', () => {
    conProyecto(fCruce(), () => {
      const o = cruzar(1, true); tool = null; tmp = null; S.plantaAct = 'p2'; S.capaAct = 'c2'; sel = null; render();
      const enEsc = document.querySelector('#c [data-id="' + o.id + '"][stroke="transparent"]'); afirmar(enEsc, 'no hay zona de clic del cable');
      const hits = [...document.querySelectorAll('#c > [data-id="' + o.id + '"]')]; afirmar(hits.length >= 1, 'la zona de clic de la escalera debe dibujarse por encima de las escaleras (hijo directo de #c)');
      const idx = [...$('#c').children].indexOf(hits[0]), idxEsc = [...$('#c').children].indexOf(document.querySelector('#c > g[data-id="1"]')); afirmar(idx > idxEsc, 'el cable debe quedar por encima de la escalera');
      sinCaptura(() => { ptr(hits[0], 'pointerdown', 300, 200); ptr(svg, 'pointerup', 300, 200); }); ser(sel, o.id, 'no se seleccionó el cable al agarrarlo en la escalera');
      const n = S.objs.length, h = hist.length; borrar(); ser(S.objs.length, n - 1, 'borrar debe quitar el cable completo'); ser(byId(o.id), undefined); ser(hist.length, h + 1);
      S.plantaAct = 'p3'; S.capaAct = 'c3'; render(); ser(document.querySelectorAll('#c polyline[opacity=".35"]').length, 0, 'no debe quedar rastro en la planta de arriba');
      deshacer(); const r = byId(o.id); afirmar(r && r.pts.length == 10 && r.pts.some(q => q.es), 'deshacer no restituyó el cable con su recorrido');
    });
  });
  prueba('Cable por escalera: el recorrido sigue a la escalera si se mueve o gira, y si se borra (con aviso) se borra el cable completo', () => {
    conProyecto(fCruce(), () => {
      const o = cruzar(1, true), E = byId(1), p0 = { x: o.pts[2].x, y: o.pts[2].y }, h = hist.length;
      E.x += 2; E.y += 1; render(); igual([o.pts[2].x, o.pts[2].y], [r3(p0.x + 2), r3(p0.y + 1)], 'el recorrido no siguió a la escalera'); ser(o.pts.length, 10);
      E.rot = 90; render(); const g = trazaEscalera(E, true), t = [...g.inicio, ...g.fin]; igual(o.pts.slice(2, 8).map(q => [q.x, q.y]), t.map(q => [q.x, q.y]), 'el recorrido no giró con la escalera');
      tool = null; tmp = null; S.plantaAct = 'p2'; S.capaAct = 'c2'; const h1 = hist.length;
      ser(conConfirm(false, () => { sel = 1; render(); ser(borrar(), false, 'cancelado'); }), 1, 'debía pedir confirmación'); afirmar(byId(1) && byId(o.id), 'cancelar no debe borrar nada'); ser(hist.length, h1, 'cancelar no guarda historial');
      conConfirm(true, () => { sel = 1; render(); borrar(); }); ser(byId(1), undefined, 'la escalera debe borrarse'); ser(byId(o.id), undefined, 'el cable que la cruza debe borrarse completo'); ser(hist.length, h1 + 1, 'un solo paso');
      deshacer(); afirmar(byId(1) && byId(o.id).pts.some(q => q.es), 'deshacer no restituyó la escalera con su recorrido');
    });
  });
  prueba('Cable por escalera: las otras dos escaleras (recta y espiral) y el sentido hacia abajo', () => {
    conProyecto(fCruce(), () => {
      const a = cruzar(2, true), na = a.pts.filter(q => q.es == 2).length; ser(na, 4, 'recta'); igual([...new Set(a.pts.filter(q => q.es == 2).map(q => q.pl))].sort(), ['p2', 'p3'], 'plantas de la recta');
      const b = cruzar(3, true), nb = b.pts.filter(q => q.es == 3).length; ser(nb, 20, 'espiral'); ser(S.plantaAct, 'p3');
      const c = cruzar(1, false, [[1, 7], [2, 7]], [[8, 5], [9, 5]]); ser(S.plantaAct, 'p1', 'bajando la vista pasa a la planta de abajo'); const bajan = c.pts.filter(q => q.es == 1); ser(bajan.length, 6); afirmar(bajan.every(q => q.ed == -1), 'sentido');
      igual(bajan.map(q => q.pl), ['p2', 'p2', 'p2', 'p1', 'p1', 'p1'], 'al bajar, la primera mitad es de la planta de salida'); afirmar(bajan[0].x > 6, 'bajando se entra por el tramo derecho');
    });
  });
  prueba('Cable por escalera: imanes, nodos, límites y giro actúan solo sobre los puntos de la planta actual; copiar toma solo ese tramo y cortar borra el cable completo', () => {
    const guardado = [...TR.acc.portapapeles];
    try { conProyecto(fCruce(), () => {
      const o = cruzar(1, true); S.plantaAct = 'p2'; S.capaAct = 'c2'; render();
      const x2 = bboxDe(o), en7 = () => puntosIman().filter(p => p.y == 7).length, n2 = en7(); S.plantaAct = 'p3'; S.capaAct = 'c3'; render(); const x3 = bboxDe(o);
      afirmar(x2.y1 > 6 && x3.y1 < 6, 'el rectángulo del cable debe ser distinto en cada planta'); ser(n2, 2, 'imán en la planta 2: los 2 puntos libres'); ser(en7(), 0, 'imán en la planta 3: ninguno de los de la planta 2');
      ser(nodosDeTipo('utp6').length, 1, 'nodos en la planta 3: solo el extremo libre de arriba (el otro extremo está en la planta 2)'); S.plantaAct = 'p2'; S.capaAct = 'c2'; ser(nodosDeTipo('utp6').length, 1, 'nodos en la planta 2: solo el extremo del origen');
      tool = null; tmp = null; sel = o.id; render(); const g = geoSel(), rot = copiar(o); rotarDesde(o, rot, 90, g.c); afirmar(o.pts.slice(2, 8).every((q, i) => q.x == rot.pts[i + 2].x && q.y == rot.pts[i + 2].y), 'el giro no debe mover los puntos de la escalera'); afirmar(o.pts[8].x == rot.pts[8].x, 'ni los de otra planta');
      const P = TR.acc.portapapeles; P.length = 0; const n = S.objs.length; sel = o.id; render(); ser(TR.acc.ejecutar('copiar'), true, 'copiar'); ser(P[0].pts.length, 2, 'solo los 2 puntos libres de esta planta'); afirmar(P[0].pts.every(q => !q.es && !q.pl));
      ser(TR.acc.ejecutar('cortar'), true); ser(byId(o.id), undefined, 'cortar borra el cable completo'); ser(S.objs.length, n - 1);
    }); } finally { TR.acc.portapapeles.splice(0, TR.acc.portapapeles.length, ...guardado); }
  });
  prueba('Cable por escalera: un cable que baja por la escalera de arriba impide mover cualquiera de las dos si abajo no queda una igual; borrar la de abajo borra el cable (con aviso)', () => {
    conProyecto(fCruce(), () => {
      const o = cruzar(1, false), msg = t => (escaleraObstruida(t) || {}).msg || ''; tool = null; tmp = null;
      afirmar(/baja por esta escalera/.test(msg({ ...byId(11), x: 16 })), 'mover la de abajo debía rechazarse: ' + msg({ ...byId(11), x: 16 }));
      afirmar(/baja por esta escalera/.test(msg({ ...byId(1), x: 16 })), 'mover la de arriba debía rechazarse');
      ser(msg({ ...byId(13), x: 16 }), '', 'otra escalera sin cables sí se mueve');
      // 1 = con descanso en la planta 2; 11 = su igual justo debajo (planta 1), por donde llega el cable que baja
      S.plantaAct = 'p1'; S.capaAct = 'c1'; sel = 11; multi = []; render(); const h = hist.length; arrastreSim({ m: 'mv', os: [byId(11)] }, () => { byId(11).x = 16; }); ser(byId(11).x, 6, 'al soltar vuelve atrás'); ser(hist.length, h);
      ser(conConfirm(true, () => { sel = 11; render(); borrar(); }), 1, 'debía avisar'); ser(byId(o.id), undefined, 'el cable que bajaba por ahí se borra'); afirmar(byId(1), 'la de arriba sigue');
    });
  });
  prueba('Revisión del 11/11/2026: teclas durante un arrastre, giro y asas al soltar o cancelar, rehacer, giro conjunto, cables ya sin apoyo, borrar capa, cortar cancelado y orden de plantas', () => {
    conProyecto(fEscaleras().estado, () => {
      irA('p1'); tool = null; tmp = null; sel = 1; multi = []; render(); const h = hist.length;
      arrastrar({ m: 'mv', os: [byId(1)] }); tecla(svg, 'r'); tecla(svg, 'Delete'); tecla(svg, 'z'); ser(hist.length, h, 'ninguna tecla actúa durante un arrastre'); afirmar(byId(1) && !byId(1).rot, 'R y Supr no actuaron'); drag = null;
      sel = 2; render(); iniciarRot(); push(); drag.pu = true; rotarDesde(byId(2), drag.lista[0].g, 90, drag.c); ptr(svg, 'pointerup', 0, 0); ser(byId(2).rot || 0, 0, 'el asa ↻ vuelve atrás al soltar'); ser(hist.length, h);
      arrastreSim({ m: 'h', o: byId(2), h: 'e' }, () => { byId(2).w = 2.2; }, 'pointercancel'); ser(byId(2).w, 1.6, 'las asas vuelven atrás si se cancela el puntero'); ser(drag, null);
      push(); S.edificio.w = 25; deshacer(); ser(fut.length, 1, 'hay un paso para rehacer'); sel = 2; render(); arrastreSim({ m: 'mv', os: [byId(2)] }, () => { byId(2).x = 6.5; }); ser(fut.length, 1, 'un arrastre rechazado conserva el rehacer');
    });
    conProyecto(base({}, [esc(1, '', 1.2, 2.8, 5, 5), esc(2, '', 1.2, 2.8, 7, 5)]), () => {   // dos rectas lado a lado: giradas juntas no se pisan, aunque cada una girada sí pisaría a la otra sin girar
      tool = null; multi = [1, 2]; sel = null; render(); ser(TR.acc.rotar(90), true, 'girar dos escaleras juntas'); ser(byId(1).rot, 90);
    });
    conProyecto(fCruce(), () => {
      cruzar(1, false); tool = null; tmp = null; byId(11).x = 16;   // como un archivo viejo: el cable que baja por 1 ya no tiene la 11 debajo
      ser(escaleraObstruida({ ...byId(13), y: 10 }), null, 'un cable que ya estaba sin apoyo no bloquea otras escaleras'); ser(escaleraObstruida({ ...byId(11), x: 20 }), null, 'ni a la propia');
    });
    conProyecto(fCruce(), () => {
      const o = cruzar(1, false); tool = null; tmp = null; S.plantas[0].capas.push(capa('c9', 'Escaleras')); byId(11).cp = 'c9';   // la escalera de abajo en otra capa que los puntos del cable
      ser(cablesQueCruzan('p1', 'c9'), 1, 'borrar la capa de la escalera afecta al cable'); podarCables('p1', 'c9'); ser(byId(o.id), undefined, 'el cable se borra entero');
    });
    conProyecto(fCruce(), () => {
      cruzar(1, true); tool = null; tmp = null; S.plantaAct = 'p2'; S.capaAct = 'c2'; const P = TR.acc.portapapeles, pp0 = [...P];
      try { P.splice(0, P.length, { k: 'texto', x: 0, y: 0, label: 'previo' }); conConfirm(false, () => { sel = 1; render(); ser(TR.acc.ejecutar('cortar'), false, 'cortar cancelado'); }); ser(P.length, 1); ser(P[0].label, 'previo', 'el portapapeles queda como estaba'); afirmar(byId(1)); }
      finally { P.splice(0, P.length, ...pp0); }
    });
    const tres = fEscaleras().estado; tres.plantas.push({ id: 'p3', nombre: 'Planta 3', ca: 'c3', capas: [capa('c3', 'Base')] }); tres.objs.push(esc(20, '', 1.2, 2.8, 3, 3, { pl: 'p3', cp: 'c3' }));   // recta en la planta 3 justo encima de la recta 1 de la planta 1
    conProyecto(tres, () => {
      tool = null; const orden = () => S.plantas.map(p => p.id).join(), h = hist.length;
      ser(cambioDePlantas(() => intercambiar(S.plantas, 1, 2)), false, 'reordenar junta dos rectas superpuestas'); ser(orden(), 'p1,p2,p3'); ser(hist.length, h, 'sin paso de historial');
      ser(cambioDePlantas(() => { S.objs = S.objs.filter(o => o.pl != 'p2'); S.plantas = S.plantas.filter(x => x.id != 'p2'); normalizar(); }), false, 'borrar la planta del medio también'); ser(orden(), 'p1,p2,p3'); afirmar(byId(5), 'la planta 2 sigue con sus objetos');
      S.objs = S.objs.filter(o => o.id != 20); ser(cambioDePlantas(() => intercambiar(S.plantas, 1, 2)), true, 'sin conflicto sí se reordena'); ser(orden(), 'p1,p3,p2');
    });
  });
  prueba('Cable por escalera: borrar una planta o capa que el cable atraviesa borra el cable completo (con aviso previo)', () => {
    conProyecto(fCruce(), () => {
      const o = cruzar(1, true), id = o.id; ser(cuentaEn('p3'), 1, 'cuenta de objetos en la planta 3'); ser(cablesQueCruzan('p3'), 1, 'cables que cruzan la planta 3'); ser(cablesQueCruzan('p2'), 1);
      const j = JSON.stringify(S); podarCables('p3'); ser(byId(id), undefined, 'borrar la planta de arriba borra el cable completo');
      S = JSON.parse(j); normalizar(); podarCables('p2'); ser(byId(id), undefined, 'borrar la planta de abajo borra el cable completo');
      S = JSON.parse(j); normalizar(); podarCables('p2', 'c2'); ser(byId(id), undefined, 'borrar una capa que atraviesa borra el cable');
      S = JSON.parse(j); normalizar(); podarCables('p1'); afirmar(byId(id), 'planta sin puntos del cable: no cambia nada');
    });
  });
  prueba('Cable por escalera: un archivo con una escalera o planta inexistente en un recorrido se abre soltando esos datos (con aviso) y sin romper nada', () => {
    conR(() => conProyecto(fCruce(), () => {
      const o = cruzar(1, true), g = ESQ.serializar(S, R); afirmar(g.ok, g.error); const d = JSON.parse(g.texto);
      d.estado.objs = d.estado.objs.filter(x => x.id != 1); let l = ESQ.leer(JSON.stringify(d)); afirmar(l.ok, (l.errores || []).join()); afirmar(l.avisos.length > 0, 'debía avisar'); afirmar(l.estado.objs.find(x => x.id == o.id).pts.every(q => !q.es && !q.ed), 'el recorrido sin escalera debe soltarse');
      const d2 = JSON.parse(g.texto); d2.estado.objs.find(x => x.id == o.id).pts[3].pl = 'p9'; l = ESQ.leer(JSON.stringify(d2)); afirmar(l.ok && l.avisos.length > 0 && l.estado.objs.find(x => x.id == o.id).pts[3].pl === undefined, 'una planta inexistente debe soltarse');
      const d3 = JSON.parse(g.texto); d3.estado.objs.find(x => x.id == o.id).pts[3].ed = 5; l = ESQ.leer(JSON.stringify(d3)); afirmar(l.ok && l.avisos.length > 0 && l.estado.objs.find(x => x.id == o.id).pts[3].es === undefined, 'un sentido inválido debe soltar el punto del recorrido');
    }));
  });
  // ---------- Panel ----------
  const CLAVE_REF = 'topologias_ref_f0', CLAVE_PERF = 'topologias_perf_f0', CLAVE_PERF1 = 'topologias_perf_f1';
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const leer = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  function ejecutar(log) {
    let ok = 0, mal = 0;
    casos.forEach(c => { try { c.fn(); ok++; log('✔ ' + c.nombre); } catch (e) { mal++; log('✘ ' + c.nombre + '\n    ' + e.message); } });
    log(`Resultado: ${ok} aprobadas, ${mal} falladas de ${casos.length}.`);
  }
  function montar() {
    if (document.getElementById('trp')) return;
    const d = document.createElement('div'); d.id = 'trp';
    d.style.cssText = 'position:fixed;left:10px;bottom:36px;z-index:30;width:440px;max-height:60vh;display:flex;flex-direction:column;background:#fff;border:1px solid #14232b;border-radius:10px;box-shadow:0 6px 22px rgba(0,0,0,.3);font:12px/1.4 "Segoe UI",Arial,sans-serif;color:#1d2a2f';
    d.innerHTML = '<div style="display:flex;gap:4px;flex-wrap:wrap;padding:8px;border-bottom:1px solid #d3dadd;background:#eef2f4;border-radius:10px 10px 0 0"><b style="flex:1">Pruebas (Fases 0 a 6)</b><button data-a="x">✕</button>'
      + '<button data-a="run">Ejecutar pruebas</button><button data-a="cap">Guardar referencia de dibujo</button><button data-a="cmp">Comparar con la referencia</button><button data-a="perf">Medir rendimiento</button></div>'
      + '<pre id="trp-out" style="margin:0;padding:8px;overflow:auto;white-space:pre-wrap;flex:1"></pre>';
    document.body.appendChild(d);
    const out = d.querySelector('#trp-out'), log = t => { out.textContent += t + '\n'; out.scrollTop = out.scrollHeight; };
    d.onclick = e => {
      const a = e.target.dataset && e.target.dataset.a; if (!a) return;
      try {
        if (a == 'x') d.remove();
        else if (a == 'run') ejecutar(log);
        else if (a == 'cap') { if (leer(CLAVE_REF) && !confirm('Ya hay una referencia guardada (la de la Fase 0). Si la sobrescribís, se pierde la base para comparar el dibujo. ¿Sobrescribir?')) return; const r = referenciaActual(); log(guardar(CLAVE_REF, { fecha: new Date().toISOString(), datos: r }) ? 'Referencia guardada (' + Object.keys(r).length + ' proyectos).' : 'No se pudo guardar en el navegador. Copia esto:\n' + JSON.stringify(r)); }
        else if (a == 'cmp') {
          const ref = leer(CLAVE_REF); if (!ref) { log('No hay referencia guardada: usa «Guardar referencia de dibujo» con la versión anterior.'); return; }
          const act = referenciaActual(); let dif = 0;
          Object.keys(ref.datos).forEach(n => Object.keys(ref.datos[n]).forEach(v => { const x = ref.datos[n][v], y = (act[n] || {})[v]; if (!y || x.hash !== y.hash || x.largo !== y.largo) { dif++; log('✘ DIFERENTE: ' + n + ' / ' + v); } }));
          log(dif ? dif + ' diferencias respecto a la referencia del ' + ref.fecha : '✔ Idéntico a la referencia del ' + ref.fecha);
        } else if (a == 'perf') {
          const r = medirRendimiento(), b = leer(CLAVE_PERF) || { render_ms: 49.9, mover_sin_arrastrar_ms: 43.9, fecha: 'informada por el usuario' };
          log(JSON.stringify(r));
          log('Base de la Fase 0 (' + b.fecha + '): render ' + b.render_ms + ' ms, mover sin arrastrar ' + b.mover_sin_arrastrar_ms + ' ms');
          log('Mover sin arrastrar: ' + (b.mover_sin_arrastrar_ms / Math.max(r.mover_sin_arrastrar_ms, .01)).toFixed(1) + ' veces más rápido que la base');
          log(guardar(CLAVE_PERF1, { fecha: new Date().toISOString(), ...r }) ? 'Medición de la Fase 1 guardada (no sobrescribe la base de la Fase 0).' : 'No se pudo guardar la medición.');
        }
      } catch (err) { log('Error: ' + err.message); }
    };
  }
  if (typeof document !== 'undefined' && document.body) montar();
  return { casos, fixtures, fEstres, huella, referenciaActual, medirRendimiento, ejecutar, util: { prueba, afirmar, ser, igual, item, fVacio, fDispositivos, conProyecto, conR, pngUri, mover, conMenuContado, ptr, sinCaptura, conConfirm, enObj, pant, clic } };   // util: lo que usan los archivos de pruebas por fase (pruebas-f4.js)
})();
