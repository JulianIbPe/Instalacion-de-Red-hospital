// ===== pruebas-f10.js: pruebas de la Fase 10 (10A: cables superpuestos y aislar un cable) =====
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
})();
