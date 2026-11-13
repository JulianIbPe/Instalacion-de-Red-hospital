// ===== pruebas-f6.js: pruebas de la Fase 6 (jerarquía y mesas) =====
// Se carga después de pruebas-f4.js (solo con ?pruebas=1) y agrega sus casos a los de TRP usando sus utilidades (TRP.util).
(() => {
  const { prueba, afirmar, ser, igual, item, fVacio, conProyecto, ptr, sinCaptura, conConfirm, enObj, pant, clic } = TRP.util;
  const mesa = (id, x, y, o = {}) => item(id, 'Mesa', '🪑', x, y, { tipo: 'mesa', w: 1.2, h: .7, puestos: 2, ...o });
  const pc = (id, x, y, o = {}) => item(id, 'PC', '💻', x, y, { tipo: 'dispositivo', sub: 'pc', w: .4, h: .3, ...o });
  const proyecto = objs => ({ ...fVacio().estado, objs });
  const con = (objs, fn) => conProyecto(proyecto(objs), () => { const cf = window.confirm; try { return fn(); } finally { window.confirm = cf; } });
  const arrastrarObj = (id, x, y) => sinCaptura(() => { const el = enObj(id).querySelector('rect') || enObj(id), b = el.getBoundingClientRect(), p = pant(x, y); ptr(el, 'pointerdown', b.left + b.width / 2, b.top + b.height / 2); ptr(svg, 'pointermove', p.x, p.y); ptr(svg, 'pointerup', p.x, p.y); render(); });
  const cerca = (a, b, m) => afirmar(Math.abs(a - b) < 1e-3, (m || 'valor') + ': esperado ' + b + ', obtenido ' + a);

  prueba('Fase 6: la mesa del catálogo nace con 2 puestos, se dibuja debajo de sus equipos y un equipo colocado encima se ancla a su puesto', () => {
    con([], () => {
      const t = CAT['Edificio'].find(d => d.n == 'Mesa'); afirmar(t, 'falta la mesa en «Edificio»');
      tool = t; render(); clic(4, 4); const m = S.objs[0]; igual([m.tipo, m.puestos, m.w, m.h], ['mesa', 2, 1.2, .7], 'mesa');
      afirmar(!TR.acc.colorable({ ...m, c: '#123456' }), 'D18: la mesa no se colorea');
      const h0 = hist.length; tool = { k: 'item', n: 'PC', ic: '💻', w: .4, h: .3 }; clic(4.3, 4); tool = null; render();
      const e = S.objs[1]; ser(hist.length, h0 + 1, 'colocar y anclar = un paso'); igual([e.parent, e.puesto], [m.id, 1], 'anclaje'); cerca(e.x, 4.3, 'centro del puesto 2'); cerca(e.y, 4, 'y');
      const orden = [...document.querySelectorAll('#c [data-id]')].map(g => +g.dataset.id); afirmar(orden.indexOf(m.id) < orden.indexOf(e.id), 'el equipo debe dibujarse encima de la mesa');
      ser(enObj(m.id).querySelectorAll('path').length, 1, 'falta la división entre puestos');
    });
  });
  prueba('Fase 6: mover y girar la mesa mueve y gira sus equipos y sus cables; un cable sobre la mesa se une al equipo, no a la mesa', () => {
    con([mesa(1, 4, 4), pc(2, 3.7, 4, { parent: 1, puesto: 0 }), pc(3, 9, 4)], () => {
      tool = CAT['Cables'][0]; render(); clic(3.7, 4); clic(4.3, 4.2); clic(9, 4); finishLine(); tool = null;
      const L = S.objs.find(o => o.k == 'line'); ser(L.pts[0].ref, 2, 'el cable se une al equipo'); afirmar(!L.pts[1].ref, 'el cable no debe unirse a la mesa');
      arrastrarObj(1, 6, 6); const e = byId(2); cerca(e.x, 5.7, 'x del equipo'); cerca(e.y, 6, 'y del equipo'); cerca(pt(L.pts[0]).x, 5.7, 'el cable sigue al equipo'); ser(e.parent, 1, 'sigue anclado');
      sel = 1; multi = []; afirmar(TR.acc.rotar(90), 'giro rechazado'); cerca(e.x, 6, 'x tras girar'); cerca(e.y, 5.7, 'y tras girar'); ser(e.rot, 90, 'el equipo gira con la mesa');
      fijarSeleccion([1, 2]); afirmar(TR.acc.rotar(90)); ser(byId(2).lrot || 0, 0, 'R6: el equipo no gira dos veces si su mesa también está seleccionada');
    });
  });
  prueba('Fase 6: soltar un equipo sobre una mesa lo ancla y fuera de ella lo desancla; mesa llena o equipo que no entra = vuelve a donde estaba, con aviso; colocar uno nuevo sin lugar no lo coloca', () => {
    con([mesa(1, 4, 4), pc(2, 3.7, 4, { parent: 1, puesto: 0 }), pc(3, 8, 4), pc(4, 8, 6), pc(5, 8, 2, { w: 1.3, h: .3 })], () => {
      arrastrarObj(3, 4.4, 4.1); igual([byId(3).parent, byId(3).puesto], [1, 1], 'anclado al puesto libre'); cerca(byId(3).y, 4, 'centrado en la mesa');
      const h0 = hist.length; arrastrarObj(4, 4.2, 4); ser(byId(4).parent, undefined, 'mesa llena'); igual([byId(4).x, byId(4).y], [8, 6], 'vuelve a donde estaba'); ser(hist.length, h0, 'el arrastre rechazado no deja historial');
      tool = { k: 'item', n: 'PC', ic: '💻', w: .4, h: .3 }; const n0 = S.objs.length; clic(4.3, 4); tool = null; ser(S.objs.length, n0, 'mesa llena: el equipo nuevo no se coloca'); ser(hist.length, h0, 'colocar rechazado no deja historial');
      arrastrarObj(2, 4, 8); ser(byId(2).parent, undefined, 'fuera de la mesa se desancla'); cerca(byId(2).y, 8, 'y');
      arrastrarObj(5, 3.7, 4); ser(byId(5).parent, undefined, 'un equipo más largo que la mesa no se ancla'); igual([byId(5).x, byId(5).y], [8, 2], 'y vuelve a donde estaba');
      byId(5).w = .9; render(); arrastrarObj(5, 3.7, 4); ser(byId(5).parent, undefined, 'la suma de los equipos (0,9 + 0,4) supera la mesa (1,2)'); ser(byId(5).x, 8, 'vuelve a donde estaba');
      byId(5).w = .7; render(); arrastrarObj(5, 3.7, 4); ser(byId(5).parent, 1, 'la suma 0,7 + 0,4 sí entra');
      const a = byId(5), b = byId(3); afirmar(a.x + .35 <= b.x - .2 + 1e-3 && a.x - .35 >= 3.4 - 1e-3, 'los equipos no deben encimarse ni salirse de la mesa');
    });
  });
  prueba('Fase 6: puestos y tamaño de la mesa: largo mínimo, crecer al subir puestos, no bajar por debajo de los equipos', () => {
    con([mesa(1, 4, 4, { puestos: 3, w: 1.5 }), pc(2, 4, 4, { parent: 1, puesto: 2 }), pc(3, 4, 4, { parent: 1, puesto: 1 })], () => {
      sel = 1; render(); const h0 = hist.length;
      afirmar(!TR.acc.fijar([1], 'w', '1.2').ok, 'acepta un largo menor a 3 × 0,50 m'); ser(hist.length, h0, 'un rechazo no guarda historial');
      afirmar(TR.acc.fijar([1], 'puestos', '4').ok); cerca(byId(1).w, 2, 'la mesa crece hasta 4 × 0,50 m');
      afirmar(!TR.acc.fijar([1], 'puestos', '1').ok, 'acepta menos puestos que equipos'); ser(byId(1).puestos, 4);
      afirmar(TR.acc.fijar([1], 'puestos', '2').ok); render(); igual([byId(3).puesto, byId(2).puesto], [0, 1], 'los equipos se reacomodan en orden');
      afirmar(!TR.acc.fijar([1], 'h', '.2').ok, 'acepta una mesa con menos fondo que sus equipos');
      afirmar(!TR.acc.fijar([2], 'w', '1.8').ok, 'acepta un equipo que no entra en la mesa');
      afirmar(!TR.acc.campo('x').aplica(byId(2)), 'la posición de un equipo anclado la fija su puesto');
    });
  });
  prueba('Fase 6: borrar una mesa pide confirmación y borra sus equipos; sus cables quedan sueltos; deshacer y rehacer restituyen los anclajes', () => {
    con([mesa(1, 4, 4), pc(2, 3.7, 4, { parent: 1, puesto: 0 }), pc(3, 8, 4), { id: 4, k: 'line', n: 'UTP Cat6', c: '#2e86de', w: .06, d: '', label: '', pl: 'p1', cp: 'c1', pts: [{ x: 3.7, y: 4, ref: 2 }, { x: 8, y: 4, ref: 3 }] }], () => {
      sel = 1; ser(conConfirm(false, () => afirmar(!borrar(), 'borró sin confirmar')), 1, 'debe preguntar'); ser(S.objs.length, 4);
      fijarSeleccion([1, 2]); ser(conConfirm(false, () => borrar()), 1, 'con la mesa y sus equipos seleccionados también pregunta'); ser(S.objs.length, 4);
      fijarSeleccion([1]); conConfirm(true, () => borrar()); igual(S.objs.map(o => o.id), [3, 4], 'la mesa y su equipo'); afirmar(!byId(4).pts[0].ref, 'el cable queda suelto');
      deshacer(); igual([byId(2).parent, byId(2).puesto], [1, 0], 'deshacer restituye el anclaje'); rehacer(); ser(byId(2), undefined);
      deshacer(); sel = 2; conConfirm(true, () => borrar()); afirmar(byId(1), 'borrar el equipo no borra la mesa');
    });
  });
  prueba('Fase 6: copiar una mesa copia sus equipos anclados; un equipo copiado solo se pega suelto', () => {
    con([mesa(1, 4, 4), pc(2, 3.7, 4, { parent: 1, puesto: 0 })], () => {
      sel = 1; afirmar(TR.acc.copiar()); afirmar(TR.acc.pegar({ punto: { x: 10, y: 4 } })); render();
      const m2 = S.objs.find(o => esMesa(o) && o.id != 1), e2 = S.objs.find(o => o.parent == m2.id); afirmar(e2 && e2.id != 2, 'el equipo debe copiarse con la mesa');
      cerca(e2.x, m2.x - .3, 'el equipo pegado queda en su puesto'); afirmar(S.objs.every(o => o._id === undefined), 'quedó el campo interno _id');
      fijarSeleccion([2]); TR.acc.copiar(); TR.acc.pegar({ punto: { x: 10, y: 7 } }); const e3 = S.objs[S.objs.length - 1]; igual([e3.parent, e3.puesto, e3.lrot], [undefined, undefined, undefined], 'suelto');
    });
  });
  prueba('Fase 6: una mesa no se puede poner encima de otra (colocar, arrastrar, inspector, girar, pegar); tocarse por el borde sí', () => {
    con([mesa(1, 4, 4), mesa(2, 5.2, 4), mesa(3, 9, 4), mesa(4, 4, 4.9)], () => {
      const h0 = hist.length, n0 = S.objs.length; tool = CAT['Edificio'].find(d => d.n == 'Mesa'); render(); clic(4, 4); tool = null;
      ser(S.objs.length, n0, 'se colocó encima de otra'); ser(hist.length, h0, 'colocar rechazado no deja historial');
      afirmar(TR.acc.fijar([2], 'h', '.8').ok, 'tocarse por el borde debe estar permitido');
      afirmar(!TR.acc.fijar([2], 'x', '5.1').ok, 'el inspector deja pisar otra mesa'); afirmar(!TR.acc.fijar([2], 'w', '1.4').ok, 'agrandarla deja pisar otra mesa');
      sel = 4; multi = []; afirmar(!TR.acc.rotar(90), 'girarla deja pisar otra mesa'); ser(byId(4).rot || 0, 0);
      const h1 = hist.length; arrastrarObj(3, 4.5, 4); igual([byId(3).x, byId(3).y], [9, 4], 'la mesa arrastrada encima vuelve a donde estaba'); ser(hist.length, h1, 'sin historial');
      sel = 1; TR.acc.copiar(); afirmar(!TR.acc.pegar({ punto: { x: 9.3, y: 4 } }), 'se pegó encima de otra'); afirmar(TR.acc.pegar({ punto: { x: 12, y: 4 } }), 'pegar en un lugar libre');
    });
  });
  prueba('Fase 6: ida y vuelta del archivo con mesa y equipos anclados (R9); un padre inexistente se suelta', () => {
    const e = proyecto([mesa(1, 4, 4, { rot: 90 }), pc(2, 4, 3.7, { parent: 1, puesto: 0, lrot: 90, rot: 180 })]), a = ESQ.serializar(e, R); afirmar(a.ok, a.error);
    const r = ESQ.leer(a.texto); afirmar(r.ok && !r.avisos.length, 'no reabre limpio: ' + (r.avisos || []).join(' | ')); igual(r.estado.objs, JSON.parse(a.texto).estado.objs, 'algún campo se perdió (R9)');
    con([pc(2, 4, 4, { parent: 9, puesto: 0 }), mesa(3, 8, 4, { parent: 3, puesto: 0, lrot: 90 })], () => { ser(byId(2).parent, undefined, 'un equipo cuya mesa no existe queda suelto'); ser(byId(3).parent, undefined, 'una mesa con padre (archivo dañado) queda suelta'); render(); igual([byId(3).x, byId(3).rot || 0], [8, 0], 'y no se mueve sola'); });
  });
})();
