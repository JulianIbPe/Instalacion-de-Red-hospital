// ===== pruebas.js: pruebas de lógica, referencia de dibujo y medición de rendimiento (Fases 0, 1 y 2) =====
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
    d.innerHTML = '<div style="display:flex;gap:4px;flex-wrap:wrap;padding:8px;border-bottom:1px solid #d3dadd;background:#eef2f4;border-radius:10px 10px 0 0"><b style="flex:1">Pruebas (Fases 0 a 2)</b><button data-a="x">✕</button>'
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
  return { casos, fixtures, fEstres, huella, referenciaActual, medirRendimiento, ejecutar };
})();
