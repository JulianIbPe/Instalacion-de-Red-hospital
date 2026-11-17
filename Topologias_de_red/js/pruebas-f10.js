// ===== pruebas-f10.js: pruebas de la Fase 10 (10A: cables superpuestos y aislar un cable; 10B: filtros) =====
// Se carga después de pruebas-f9.js (solo con ?pruebas=1) y agrega sus casos a los de TRP usando sus utilidades (TRP.util).
(() => {
  const { prueba, afirmar, ser, item, fVacio, conProyecto, pant } = TRP.util;
  const P = { pl: 'p1', cp: 'c1' };
  const cable = (id, pts, o = {}) => ({ id, k: 'line', n: 'UTP Cat6', c: '#2e86de', w: .06, d: '', label: '', ...P, pts, ...o });
  const seg = (id, x0, y0, x1, y1) => ({ id, a: { x: x0, y: y0 }, b: { x: x1, y: y1 } });
  const lista = (segs, x, y) => TR.sup.superpuestos(segs, { x, y }, .1).sort().join();

  prueba('Fase 10A: superpuestos = tramos de cables distintos sobre la misma recta que comparten largo; un cruce, puntas que se tocan o paralelos a 5 cm no cuentan', () => {
    ser(lista([seg(1, 0, 0, 4, 0), seg(2, 2, 0, 6, 0)], 3, 0), '1,2', 'comparten de 2 a 4 m');
    ser(lista([seg(1, 0, 0, 4, 0), seg(2, 2, 0, 6, 0)], 1, 0), '', 'el cursor está donde va uno solo');
    ser(lista([seg(1, 0, 0, 4, 0), seg(2, 4, 0, 1, 0.015)], 3, 0), '1,2', 'sentido contrario y 1,5 cm de diferencia');
    ser(lista([seg(1, 0, 0, 4, 0), seg(2, 2, -2, 2, 2)], 2, 0), '', 'cruce');
    ser(lista([seg(1, 0, 0, 4, 0), seg(2, 4, 0, 8, 0)], 4, 0), '', 'puntas que se tocan');
    ser(lista([seg(1, 0, 0, 4, 0), seg(2, 0, .05, 4, .05)], 2, .02), '', 'paralelos a 5 cm');
    ser(lista([seg(1, 0, 0, 4, 0), seg(1, 1, 0, 3, 0)], 2, 0), '', 'un mismo cable no se superpone consigo');
    ser(lista([seg(1, 0, 0, 3, 3), seg(2, 1, 1, 4, 4), seg(3, 2, 2, 2, 5)], 1.5, 1.5), '1,2', 'en diagonal');
  });

  const proyecto = () => ({ ...fVacio().estado, objs: [
    item(10, 'PC', '💻', 1, 1), item(11, 'PC', '💻', 6, 1), item(12, 'PC', '💻', 6, 4),
    cable(1, [{ x: 1, y: 1, ref: 10 }, { x: 6, y: 1, ref: 11 }]), cable(2, [{ x: 2, y: 1 }, { x: 5, y: 1 }]), cable(3, [{ x: 1, y: 1, ref: 10 }, { x: 6, y: 4, ref: 12 }]),
    { id: 20, k: 'line', n: 'Pared', tipo: 'pared', c: '#34495e', w: .2, d: '', label: '', ...P, pts: [{ x: 0, y: 6 }, { x: 8, y: 6 }] }
  ] });

  prueba('Fase 10A: el panel lista los cables superpuestos con sus extremos; «Destacar» dibuja en #g-tmp sin tocar #c; «Seleccionar» lo selecciona', () => {
    conProyecto(proyecto(), () => {
      ser(TR.sup.superpuestos(TR.sup.segmentos(), { x: 3, y: 1 }, .1).sort().join(), '1,2', 'detecta los dos cables del proyecto');
      const c0 = $('#c').innerHTML, q = pant(3, 1);
      try {
        TR.sup.abrirEn({ x: 3, y: 1 }, q.x, q.y);
        const pn = $('#sup'), filas = [...pn.querySelectorAll('.sup-r')];
        afirmar(!pn.hidden && filas.length == 2, 'panel con dos renglones');
        afirmar(pn.textContent.includes('A: PC') && pn.textContent.includes('Longitud: 5.00 m'), 'extremos y longitud: ' + pn.textContent);
        afirmar(!pn.querySelector('input[type=color]'), 'sin cambio de color (D16)');
        pn.querySelector('.sup-r[data-id="1"] [data-a=dest]').click();
        afirmar($('#g-tmp path[stroke="#ff2d95"]'), 'recorrido destacado'); ser($('#c').innerHTML, c0, '#c no cambia al destacar');
        pn.querySelector('.sup-r[data-id="2"] [data-a=sel]').click(); ser(sel, 2, 'seleccionado desde el panel');
      } finally { TR.sup.cerrar(true); }
      afirmar($('#sup').hidden && !$('#g-tmp path[stroke="#ff2d95"]'), 'Esc (cerrar todo) quita el panel y el destacado');
    });
  });

  prueba('Fase 10A: el panel no se cierra al instante al alejar el cursor; con un cable destacado, un clic sobre los superpuestos lo elige a él', () => {
    conProyecto(proyecto(), () => {
      const q = pant(3, 1);
      try {
        TR.sup.abrirEn({ x: 3, y: 1 }, q.x, q.y);
        TR.sup.alMover({ clientX: q.x + 200, clientY: q.y + 200, buttons: 0 }); afirmar(TR.sup.abierto(), 'sigue abierto justo después de alejarse');
        TR.sup.destacar(1);
        ser(TR.sup.prioridad(2, { x: 3, y: 1 }), 1, 'sobre la parte común gana el destacado');
        ser(TR.sup.prioridad(3, { x: 1.5, y: 1.3 }), 3, 'lejos del destacado no cambia');
        ser(TR.sup.prioridad(10, { x: 1, y: 1 }), 10, 'un equipo no se cambia por el cable');
        TR.sup.destacar(null); ser(TR.sup.prioridad(2, { x: 3, y: 1 }), 2, 'sin destacado, el de arriba');
      } finally { TR.sup.cerrar(true); }
    });
  });

  prueba('Fase 10A: aislar un cable muestra solo el cable, sus equipos y el fondo atenuado; no cambia S, el historial, los imanes ni el presupuesto; «Mostrar todo» deja #c idéntico', () => {
    conProyecto(proyecto(), () => {
      sel = 12; render();
      const c0 = $('#c').innerHTML, s0 = JSON.stringify(S), h0 = hist.length, p0 = JSON.stringify(TR.pres.calcular()), im0 = JSON.stringify(cercano({ x: 6.05, y: 4.05 }));
      try {
        afirmar(TR.acc.paraMenu([byId(1)]).flatMap(g => g.items).some(i => i.id == 'fil-aislar'), '«Aislar este cable» en el menú del cable');
        ser(TR.fil.aislar(1), true, 'aislar');
        const c = $('#c'), hay = id => !!c.querySelector(`[data-id="${id}"]`);
        afirmar(hay(1) && hay(10) && hay(11), 'se ven el cable y sus dos equipos');
        afirmar(!hay(2) && !hay(3) && !hay(12), 'no se ven los otros cables ni el otro equipo');
        afirmar(c.querySelector('g[opacity=".25"] [data-id="20"]'), 'la pared queda de fondo, atenuada');
        ser(sel, null, 'lo que quedó oculto se deselecciona'); afirmar(!$('#faviso').hidden, 'aviso «Mostrar todo» visible');
        ser(JSON.stringify(S), s0, 'S no cambia'); ser(hist.length, h0, 'sin pasos de historial');
        ser(JSON.stringify(TR.pres.calcular()), p0, 'presupuesto igual'); ser(JSON.stringify(cercano({ x: 6.05, y: 4.05 })), im0, 'imanes iguales');
      } finally { TR.fil.mostrarTodo(); }
      afirmar($('#faviso').hidden, 'aviso oculto'); sel = 12; render(); ser($('#c').innerHTML, c0, '#c idéntico sin el filtro');
      TR.fil.aislar(1); S.objs = S.objs.filter(o => o.id != 1); render(); afirmar(!TR.fil.activo(), 'sin el cable, el filtro se va solo');
    });
  });
  // ---------- F10B ----------
  const foto = () => ({ S: JSON.stringify(S), h: hist.length, p: JSON.stringify(TR.pres.calcular()), im: JSON.stringify(cercano({ x: 6.05, y: 4.05 })) });
  const hay = id => !!$('#c').querySelector(`[data-id="${id}"]`), tenue = id => !!$('#c').querySelector(`g[opacity=".25"]:not([pointer-events]) [data-id="${id}"]`);

  prueba('Fase 10B: ocultar, atenuar y aislar por dispositivo, tipo de equipo y tipo de cable; ocultar gana; S, historial, imanes y presupuesto no cambian; «Mostrar todo» deja #c idéntico', () => {
    conProyecto(proyecto(), () => {
      sel = 12; render(); const c0 = $('#c').innerHTML, f0 = foto();
      try {
        ser(TR.fil.agregar({ por: 'cable', valor: subDe(byId(1)), modo: 'ocultar', texto: 'UTP' }), true, 'regla de cable');
        afirmar(!hay(1) && !hay(2) && !hay(3) && hay(10) && hay(20), 'ocultar tipo de cable: sin cables, con equipos y pared');
        TR.fil.mostrarTodo(); TR.fil.agregar({ por: 'disp', valor: '12', modo: 'atenuar', texto: 'PC12' });
        afirmar(tenue(12) && tenue(3) && !tenue(1) && hay(1), 'atenuar un equipo atenúa también sus cables');
        ser(sel, 12, 'lo atenuado sigue seleccionado');
        lastDown.t = 0; const el = $('#c').querySelector('[data-id="12"] rect'), b = el.getBoundingClientRect();
        sel = null; TRP.util.sinCaptura(() => { TRP.util.ptr(el, 'pointerdown', b.left + b.width / 2, b.top + b.height / 2); TRP.util.ptr(svg, 'pointerup', b.left + b.width / 2, b.top + b.height / 2); });
        ser(sel, 12, 'y se selecciona con un clic');
        TR.fil.mostrarTodo(); TR.fil.agregar({ por: 'disp', valor: '10', modo: 'aislar', texto: 'PC10' });
        afirmar(hay(10) && hay(1) && hay(3) && hay(11) && hay(12) && !hay(2), 'aislar un equipo: sus cables y los equipos de la otra punta');
        afirmar($('#c').querySelector('g[opacity=".25"][pointer-events="none"] [data-id="20"]'), 'la pared queda de fondo');
        TR.fil.agregar({ por: 'disp', valor: '11', modo: 'ocultar', texto: 'PC11' }); afirmar(!hay(11) && hay(12), 'ocultar gana sobre aislar');
        TR.fil.mostrarTodo(); TR.fil.agregar({ por: 'cat', valor: '-', modo: 'ocultar', texto: 'Sin categoría' });
        afirmar(!hay(10) && !hay(11) && !hay(12) && hay(1), 'tipo de equipo: equipos sin modelo');
        ser($('#bfil').textContent, '🔍 Filtros (1)', 'el botón cuenta los filtros');
        const f1 = foto(); for (const k in f0) ser(f1[k], f0[k], 'con filtros no cambia ' + k);
      } finally { TR.fil.mostrarTodo(); }
      ser($('#bfil').textContent, '🔍 Filtros', 'botón sin filtros'); sel = 12; render(); ser($('#c').innerHTML, c0, '#c idéntico sin filtros');
    });
  });

  prueba('Fase 10B: el panel «Filtros» agrega y quita reglas; filtro por capa y por VLAN; abrir un archivo los quita', () => {
    const e = proyecto(); e.plantas[0].capas.push({ id: 'c2', nombre: 'Otra', visible: true, bloqueada: false }); e.cn = 2;
    e.objs.find(o => o.id == 12).cp = 'c2'; e.vlans = [{ id: 'r1', nombre: 'Datos', vlan: 10, color: '#2e86de' }];
    conProyecto(e, () => {
      try {
        TR.fil.abrir(); afirmar(!$('#fpanel').hidden, 'panel abierto');
        $('#fp-por').value = 'capa'; $('#fp-por').onchange(); afirmar($('#fp-val').textContent.includes('Planta 1 › Otra'), 'opciones de capa');
        $('#fp-val').value = 'c2'; $('#fp-modo').value = 'ocultar'; $('#fp-add').click();
        afirmar(!hay(12) && hay(10), 'ocultar la capa «Otra»'); afirmar($('#fp-lista').textContent.includes('Ocultar · Capa: Planta 1 › Otra'), 'regla listada');
        $('#fp-lista button').click(); afirmar(hay(12) && !TR.fil.activo(), 'quitar la regla');
        $('#fp-por').value = 'red'; $('#fp-por').onchange(); afirmar($('#fp-val').textContent.includes('VLAN 10 · Datos'), 'la VLAN aparece en Red / VLAN');
        TR.fil.agregar({ por: 'red', valor: 'v:r1', modo: 'aislar', texto: 'VLAN 10' });
        afirmar(!hay(10) && !hay(1), 'VLAN sin puertos: no queda ningún equipo ni cable');
      } finally { TR.fil.cerrar(); TR.fil.mostrarTodo(); }
      TR.fil.agregar({ por: 'disp', valor: '10', modo: 'ocultar', texto: 'x' }); const r = abrirTexto(ESQ.serializar(S).texto); afirmar(r.ok && !TR.fil.activo(), 'abrir un archivo quita los filtros');
    });
  });
  prueba('Fase 10 (revisión thermo): marcas y etiquetas siguen al filtro en el mismo render; la prioridad exige superposición; las reglas huérfanas se van; un rack aislado muestra los cables de sus equipos; un equipo montado sigue seleccionable', () => {
    conProyecto(proyecto(), () => {
      try {
        afirmar($('#g-inc circle'), 'sin filtro hay marcas rojas (cable 2 sin equipos)');
        TR.fil.agregar({ por: 'cable', valor: subDe(byId(2)), modo: 'ocultar', texto: 'x' });
        afirmar(!$('#g-inc circle'), 'las marcas se van en el mismo render que su cable');
        afirmar($('#faviso').textContent.includes('Hay filtros activos') && !$('#faviso').hidden, 'aviso con cualquier filtro');
        TR.fil.mostrarTodo();
        S.objs.push(cable(4, [{ x: 1, y: 1.06 }, { x: 6, y: 1.06 }])); render();
        TR.sup.destacar(1); ser(TR.sup.prioridad(4, { x: 3, y: 1.06 }), 4, 'un paralelo a 6 cm no cede el clic'); ser(TR.sup.prioridad(2, { x: 3, y: 1 }), 1, 'el superpuesto sí');
        TR.sup.cerrar(true);
        TR.fil.agregar({ por: 'disp', valor: '12', modo: 'aislar', texto: 'PC12' }); S.objs = S.objs.filter(o => o.id != 12); render();
        afirmar(!TR.fil.activo() && hay(1), 'la regla de un equipo borrado se quita sola');
      } finally { TR.sup.cerrar(true); TR.fil.mostrarTodo(); }
    });
    const e = proyecto(); e.objs.push(item(30, 'Rack', '🗄️', 4, 4, { tipo: 'rack', w: .8, h: 1, us: 4 }), item(31, 'PC', '💻', 4, 4, { tipo: 'dispositivo', sub: 'pc', w: .4, h: .3, parent: 30, ru: { u: 1, h: 1 } }), cable(5, [{ x: 1, y: 1, ref: 10 }, { x: 4, y: 4, ref: 31 }]));
    conProyecto(e, () => {
      try {
        TR.fil.agregar({ por: 'disp', valor: '30', modo: 'aislar', texto: 'Rack' });
        afirmar(hay(30) && hay(5) && hay(10) && !hay(2), 'aislar el rack: su cable y el equipo de la otra punta');
        TR.fil.mostrarTodo(); TR.fil.agregar({ por: 'disp', valor: '11', modo: 'aislar', texto: 'PC11' });
        sel = 31; multi = []; render(); ser(sel, 31, 'el equipo montado sigue seleccionado (vista del rack)');
      } finally { TR.fil.mostrarTodo(); }
    });
  });
})();
