// ===== pruebas-f8.js: pruebas de la Fase 8 (8A: racks, montaje por unidades y vista del rack; 8B: puertos y patch cords dentro del rack) =====
// Se carga después de pruebas-f7.js (solo con ?pruebas=1) y agrega sus casos a los de TRP usando sus utilidades (TRP.util).
(() => {
  const { prueba, afirmar, ser, igual, item, fVacio, conProyecto, conR, ptr, sinCaptura, conConfirm, enObj, pant, clic } = TRP.util;
  const rack = (id, x, y, o = {}) => item(id, 'Rack', '🗄️', x, y, { tipo: 'rack', w: .8, h: 1, us: 4, ...o });
  const pc = (id, x, y, o = {}) => item(id, 'PC', '💻', x, y, { tipo: 'dispositivo', sub: 'pc', w: .4, h: .3, ...o });
  const en = (id, u, o = {}) => pc(id, 4, 4, { parent: 1, ru: { u, h: 1 }, ...o });   // equipo montado en el rack 1
  const cable = (id, a, b) => ({ id, k: 'line', n: 'UTP Cat6', c: '#2e86de', w: .06, d: '', label: '', pl: 'p1', cp: 'c1', pts: [{ x: 4, y: 4, ref: a }, { x: 8, y: 4, ref: b }] });
  const con = (objs, fn) => conProyecto({ ...fVacio().estado, objs }, () => { try { return fn(); } finally { TR.ctx.cerrar(); TR.vr.cerrar(); } });
  const arrastrarObj = (id, x, y) => sinCaptura(() => { const el = enObj(id).querySelector('rect') || enObj(id), b = el.getBoundingClientRect(), p = pant(x, y); ptr(el, 'pointerdown', b.left + b.width / 2, b.top + b.height / 2); ptr(svg, 'pointermove', p.x, p.y); ptr(svg, 'pointerup', p.x, p.y); render(); });
  const clicObj = id => sinCaptura(() => { const b = enObj(id).querySelector('rect').getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2; ptr(enObj(id).querySelector('rect'), 'pointerdown', x, y); ptr(svg, 'pointerup', x, y); });   // clic real sobre el objeto (clic() apunta al fondo)
  const tecla = (key, o = {}) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...o }));
  const enVista = id => document.querySelector('#vr-c [data-id="' + id + '"]');
  const PC = { k: 'item', n: 'PC', ic: '💻', w: .4, h: .3 };

  prueba('Fase 8A: soltar un equipo sobre un rack lo monta en la primera unidad libre: deja de verse en el plano, sus cables terminan en el rack y es un solo paso; rack lleno = no se coloca o vuelve a donde estaba', () => {
    con([rack(1, 4, 4), pc(2, 8, 4), pc(3, 8, 6), cable(4, 2, 3)], () => {
      const h0 = hist.length; arrastrarObj(2, 4, 4.1); const e = byId(2);
      igual([e.parent, e.ru], [1, { u: 1, h: 1 }], 'montaje'); ser(hist.length, h0 + 1, 'arrastrar y montar = un paso'); afirmar(!enObj(2), 'el equipo montado no debe verse en el plano'); ser(sel, null, 'no queda seleccionado');
      igual([e.x, e.y], [4, 4], 'toma la posición del rack'); ser(pt(byId(4).pts[0]).x, 4, 'el cable termina en el rack'); ser(byId(4).pts[0].ref, 2, 'el cable sigue unido al mismo equipo');
      afirmar($('#c').textContent.includes('1/4 U'), 'el rack debe mostrar sus unidades ocupadas'); afirmar(!esEditable(e), 'R4: sin la vista abierta no es editable');
      tool = PC; for (let i = 0; i < 3; i++) { lastDown.t = 0; clic(4, 4); } const us = S.objs.filter(o => o.ru).map(o => o.ru.u); igual(us, [1, 2, 3, 4], 'los equipos nuevos se montan en las unidades libres, desde abajo');
      const n0 = S.objs.length, h1 = hist.length; lastDown.t = 0; clic(4, 4); tool = null; render(); ser(S.objs.length, n0, 'rack lleno: el equipo nuevo no se coloca'); ser(hist.length, h1, 'colocar rechazado no deja historial');
      arrastrarObj(3, 4, 4); ser(byId(3).parent, undefined, 'rack lleno'); igual([byId(3).x, byId(3).y], [8, 6], 'vuelve a donde estaba'); ser(hist.length, h1, 'el arrastre rechazado no deja historial');
      arrastrarObj(1, 6, 6); igual([byId(2).x, byId(2).y], [6, 6], 'R6: los equipos siguen al rack'); ser(pt(byId(4).pts[0]).x, 6, 'y sus cables también');
    });
  });
  prueba('Fase 8A: reglas del rack: dos equipos no comparten unidad, ninguno pasa la altura y el rack no se achica por debajo de lo ocupado; un rechazo no guarda historial', () => {
    con([rack(1, 4, 4), en(2, 1), en(3, 3)], () => {
      afirmar(TR.vr.abrir(1), 'no abrió la vista'); const h0 = hist.length, f = (id, c, v) => TR.acc.fijar([id], c, v).ok;
      afirmar(!f(2, 'ruu', '3'), 'acepta dos equipos en la misma unidad'); afirmar(!f(3, 'ruu', '5'), 'acepta un equipo por encima del rack'); afirmar(!f(2, 'ruh', '3'), 'acepta un alto que pisa a otro equipo');
      afirmar(!f(1, 'us', '2'), 'acepta menos unidades que las ocupadas'); afirmar(!f(2, 'ruu', '1.5'), 'acepta una unidad no entera'); ser(hist.length, h0, 'un rechazo no guarda historial');
      afirmar(f(2, 'ruu', '2')); afirmar(f(1, 'us', '10')); afirmar(f(3, 'ruh', '3')); igual([byId(2).ru, byId(3).ru, byId(1).us], [{ u: 2, h: 1 }, { u: 3, h: 3 }, 10], 'cambios válidos'); ser(hist.length, h0 + 3, 'un paso por cambio');
      sel = 3; afirmar(TR.acc.ejecutar('rack-subir')); ser(byId(3).ru.u, 4, 'subir'); sel = 2; afirmar(TR.acc.ejecutar('rack-bajar')); ser(byId(2).ru.u, 1, 'bajar'); afirmar(!TR.acc.ejecutar('rack-bajar'), 'baja por debajo de la U 1');
      for (const c of ['x', 'w', 'h', 'rot']) afirmar(!TR.acc.campo(c).aplica(byId(2)), 'un equipo montado no debe ofrecer «' + c + '»');
      TR.vr.cerrar(); afirmar(!esEditable(byId(2)), 'al cerrar la vista deja de ser editable');
    });
  });
  prueba('Fase 8A: doble clic abre la vista del rack; arrastrar cambia de unidad; Ctrl+Z / Ctrl+Y actúan con la vista abierta y R no; «Desmontar» devuelve el equipo al plano; al cerrar vuelven selección, vista y herramienta (R10)', () => {
    con([rack(1, 4, 4, { us: 6, label: 'R1' }), en(2, 1, { label: 'PC-A' }), pc(3, 8, 4)], () => {
      lastDown.t = 0; clicObj(1); clicObj(1); ser(TR.vr.rack(), 1, 'el doble clic no abrió la vista'); afirmar(!$('#vrack').hidden && $('#vr-t').textContent.includes('R1'), 'vista'); ser(sel, 1, 'el inspector muestra el rack'); TR.vr.cerrar();
      sel = 3; render(); const v0 = JSON.stringify(V); TR.vr.abrir(1); afirmar(enVista(2) && !enObj(2), 'el equipo se ve en la vista y no en el plano');
      const c = $('#vr-c'), sv = c.firstElementChild, b = sv.getBoundingClientRect(), px = 20 * Math.min(b.width / sv.viewBox.baseVal.width, b.height / sv.viewBox.baseVal.height), g = enVista(2).getBoundingClientRect(), x = g.left + g.width / 2, y = g.top + g.height / 2, h0 = hist.length;
      c.setPointerCapture = () => {}; try { ptr(enVista(2), 'pointerdown', x, y); ptr(c, 'pointermove', x, y - 2 * px); ptr(c, 'pointerup', x, y - 2 * px); } finally { delete c.setPointerCapture; }
      ser(byId(2).ru.u, 3, 'arrastrar dos unidades hacia arriba'); ser(hist.length, h0 + 1, 'un paso'); ser(sel, 2, 'el equipo queda seleccionado');
      tecla('z', { ctrlKey: true }); ser(byId(2).ru.u, 1, 'Ctrl+Z con la vista abierta'); ser(TR.vr.rack(), 1, 'la vista sigue abierta'); tecla('y', { ctrlKey: true }); ser(byId(2).ru.u, 3, 'Ctrl+Y');
      sel = 2; render(); tecla('r'); ser(byId(2).rot || 0, 0, 'R no debe girar un equipo montado'); TR.acc.portapapeles.length = 0; tecla('c', { ctrlKey: true }); ser(TR.acc.portapapeles.length, 0, 'Ctrl+C no actúa en la vista');
      const q = enVista(2).getBoundingClientRect(); ptr(enVista(2), 'pointerdown', q.left + 5, q.top + 5, { button: 2 }); afirmar(TR.ctx.abierto(), 'el clic derecho no abrió el menú');
      const bt = id => document.querySelector('#ctx [data-a="' + id + '"]'); afirmar(bt('rack-subir') && bt('rack-sacar') && bt('eliminar'), 'faltan las opciones de montaje'); afirmar(!bt('rotar-der') && !bt('cortar'), 'girar y cortar no van en un equipo montado');
      bt('rack-sacar').click(); const e = byId(2); igual([e.parent, e.ru], [undefined, undefined], 'desmontado'); afirmar(Math.abs(e.x - 4.8) < 1e-3 && e.y == 4, 'queda al lado del rack'); ser(sel, null);
      tecla('Escape'); ser(TR.vr.rack(), null, 'Esc cierra la vista'); afirmar($('#vrack').hidden, 'oculta'); ser(sel, 3, 'R10: vuelve la selección'); ser(JSON.stringify(V), v0, 'R10: la vista del plano no cambia'); ser(tool, null, 'R10: herramienta'); afirmar(enObj(2), 'el equipo desmontado se ve en el plano');
      const r = add(rack(undefined, 10, 8)); render(); TR.vr.abrir(r.id); deshacer(); ser(TR.vr.rack(), null, 'la vista se cierra sola si su rack deja de existir');
    });
  });
  prueba('Fase 8A: borrar un rack pide confirmación y borra sus equipos (sus cables quedan sueltos, R7); copiar el rack copia sus equipos montados; Supr en la vista borra solo el equipo', () => {
    con([rack(1, 4, 4), en(2, 1), pc(3, 8, 4), cable(4, 2, 3)], () => {
      sel = 1; ser(conConfirm(false, () => afirmar(!borrar(), 'borró sin confirmar')), 1, 'debe preguntar'); ser(S.objs.length, 4);
      afirmar(TR.acc.copiar() && TR.acc.pegar({ punto: { x: 10, y: 8 } }), 'copiar y pegar'); const nr = S.objs.find(o => o.id > 4 && TR.rack.esRack(o)), nh = S.objs.find(o => o.id > 4 && o.ru);
      afirmar(nr && nh, 'faltan las copias'); igual([nh.parent, nh.ru, nh.x, nh.y], [nr.id, { u: 1, h: 1 }, 10, 8], 'la copia del equipo queda montada en la copia del rack'); ser(sel, nr.id, 'solo queda seleccionado el rack pegado');
      TR.vr.abrir(1); sel = 2; render(); tecla('Delete'); afirmar(!byId(2) && byId(1), 'Supr en la vista borra el equipo y no el rack'); afirmar(!byId(4).pts[0].ref, 'el cable queda suelto'); ser(TR.vr.rack(), 1, 'la vista sigue abierta');
      sel = 1; tecla('Delete'); afirmar(byId(1), 'Supr con el rack seleccionado no lo borra desde su vista'); deshacer(); TR.vr.cerrar(); afirmar(byId(2).ru && byId(4).pts[0].ref == 2, 'deshacer restituye el montaje y el cable');
      sel = 1; multi = []; ser(conConfirm(true, () => borrar()), 1); afirmar(!byId(1) && !byId(2) && byId(3), 'el rack y su equipo'); afirmar(!byId(4).pts[0].ref, 'R7: el cable queda suelto');
    });
  });
  prueba('Fase 8A: ida y vuelta del archivo con rack y equipo montado (R9); un montaje dañado o un rack inexistente dejan el equipo suelto', () => {
    con([rack(1, 4, 4, { us: 12 }), en(2, 3, { ru: { u: 3, h: 2 } })], () => {
      const g = ESQ.serializar(S, R); afirmar(g.ok, g.error); const l = ESQ.leer(g.texto); afirmar(l.ok && !l.avisos.length, 'no reabre limpio: ' + (l.avisos || l.errores)); igual([l.estado.objs[0].us, l.estado.objs[1].parent, l.estado.objs[1].ru], [12, 1, { u: 3, h: 2 }], 'campos');
      ser(ESQ.serializar(l.estado, R).texto, g.texto, 'guardar → abrir → guardar debe dar el mismo archivo');
      const d = JSON.parse(g.texto); d.estado.objs[1].ru = { u: 0, h: 1 }; d.estado.objs[0].us = 99; const l2 = ESQ.leer(JSON.stringify(d)); afirmar(l2.ok && l2.avisos.length, 'un montaje no válido debe abrir con aviso'); igual([l2.estado.objs[1].ru, l2.estado.objs[0].us], [undefined, undefined], 'valores no válidos omitidos');
      byId(2).parent = 99; render(); igual([byId(2).parent, byId(2).ru], [undefined, undefined], 'rack inexistente: el equipo queda suelto'); afirmar(enObj(2), 'y vuelve a verse en el plano');
    });
  });
  prueba('Fase 8A: el PNG del rack sale de su vista y es autocontenido (D20); el PNG del plano no incluye el interior', () => {
    con([rack(1, 4, 4, { us: 6 }), en(2, 1, { label: 'PC-A' }), en(5, 3, { label: 'PC-B', ru: { u: 3, h: 2 } })], () => {
      TR.vr.abrir(1); sel = 2; render(); const s = TR.vr.svg(), doc = new DOMParser().parseFromString(s.xml, 'image/svg+xml');
      afirmar(!doc.querySelector('parsererror'), 'el SVG exportado no es válido'); ser(doc.querySelectorAll('[data-id]').length, 2, 'equipos'); afirmar(s.xml.includes('PC-A') && s.xml.includes('PC-B'), 'nombres'); afirmar(!s.xml.includes('#e0a030'), 'la selección no debe salir en el PNG');
      afirmar(s.w > 0 && s.h > 0 && !/href="(?!#vr-ic-)/.test(s.xml), 'no debe depender de nada externo'); afirmar(!construirSvgExport().xml.includes('PC-A'), 'el PNG del plano no lleva el interior del rack');
    });
  });
  // ---------- F8B ----------
  const f8 = fn => conR(() => conProyecto(fVacio().estado, () => { const e0 = TR.ctx.espera, v0 = TR.red.viendo(); TR.ctx.espera = 0; try { TR.red.verEtiquetas(false); return fn(); } finally { TR.ctx.espera = e0; TR.ctx.cerrar(); TR.con.cerrar(); TR.vr.cerrar(); TR.red.verEtiquetas(v0); } }));
  const poner = (orig, x, y) => { tool = CAT.Dispositivos.find(d => d.pt && d.pt.orig == orig); render(); lastDown.t = 0; clic(x, y); tool = null; return S.objs[S.objs.length - 1]; };
  const boton = id => document.querySelector('#ctx [data-a="' + id + '"]');
  const elegir = id => { const b = boton(id); afirmar(b && !b.disabled, 'el menú no ofrece «' + id + '»'); b.click(); };
  const puertoV = (o, p) => document.querySelector(`#vr-c [data-id="${o.id}"] [data-p="${p}"]`);
  const clicP = (o, p) => { const b = puertoV(o, p).getBoundingClientRect(); ptr(puertoV(o, p), 'pointerdown', b.left + 1, b.top + 1); };
  const parches = () => document.querySelectorAll('#vr-c path[stroke="#e67e22"]').length;

  prueba('Fase 8B: en la vista del rack, un clic en un puerto y otro en un puerto de otro equipo crean un patch cord (conexión sin ruta) en un paso; forma red, se quita desde su puerto o desde «Interfaces» y se va al desmontar el equipo', () => {
    f8(() => {
      const rk = poner('rack', 4, 4), ro = poner('router-2911', 4, 4), sw = poner('switch-2960-24tt', 4, 4), s2 = poner('switch-2960-24tt', 4, 4); igual([ro.ru.u, sw.ru.u, s2.ru.u], [1, 2, 3], 'montaje');
      TR.vr.abrir(rk.id); afirmar(puertoV(sw, 'g0:23') && puertoV(sw, 'g1:1'), 'la vista debe mostrar los 26 puertos del switch'); const h0 = hist.length;
      clicP(ro, 'g0:0'); igual(TR.vr.pendiente(), { d: ro.id, p: 'g0:0' }, 'primer puerto'); ser(hist.length, h0, 'elegir el primer puerto no guarda historial'); clicP(ro, 'g0:1'); ser(TR.vr.pendiente().p, 'g0:1', 'otro puerto del mismo equipo cambia el elegido'); clicP(ro, 'g0:0');
      clicP(sw, 'g1:0'); const pc = { id: 1, a: { d: ro.id, p: 'g0:0' }, b: { d: sw.id, p: 'g1:0' }, rutas: [] }; igual(S.conex, [pc], 'patch cord'); ser(hist.length, h0 + 1, 'un paso'); ser(TR.vr.pendiente(), null); ser(parches(), 1, 'falta el dibujo del patch cord');
      ser(puertoV(sw, 'g1:0').getAttribute('fill'), '#27ae60', 'el puerto ocupado va en verde'); ser(document.querySelectorAll('#g-inc circle').length, 0, 'un patch cord no lleva marca en el plano'); ser(TR.red.automaticas().redes.length, 1, 'router — switch por patch cord forman una red');
      afirmar(/ocupado/.test(TR.con.parche({ d: s2.id, p: 'g1:0' }, { d: sw.id, p: 'g1:0' })), 'acepta un puerto ocupado'); afirmar(TR.con.parche({ d: sw.id, p: 'g0:0' }, { d: sw.id, p: 'g0:1' }), 'acepta un patch cord de un equipo a sí mismo'); ser(hist.length, h0 + 1, 'un rechazo no guarda historial');
      const g = ESQ.serializar(S, R), l = ESQ.leer(g.texto); afirmar(l.ok && !l.avisos.length, 'no reabre limpio: ' + (l.avisos || l.errores)); igual(l.estado.conex, [pc], 'ida y vuelta (R9)');
      clicP(ro, 'g0:0'); afirmar(TR.ctx.abierto() && /Quitar: Patch a Switch1/.test(boton('q').textContent), 'el puerto ocupado debe ofrecer quitar el patch cord'); elegir('q'); ser(S.conex, undefined, 'quitado'); ser(parches(), 0); deshacer(); igual(S.conex, [pc], 'deshacer');
      TR.con.abrir(sw.id); const sl = document.querySelector('#dlg-if [data-p="g1:0"] [data-k="cable"]'); afirmar(/Patch a Router1/.test(sl.selectedOptions[0].textContent), '«Interfaces» debe mostrar el patch cord'); sl.value = ''; sl.dispatchEvent(new Event('change', { bubbles: true })); TR.con.cerrar(); ser(S.conex, undefined, '«— libre —» quita el patch cord');
      deshacer(); sel = sw.id; multi = []; afirmar(TR.acc.ejecutar('rack-sacar'), 'desmontar'); ser(S.conex, undefined, 'al desmontar un equipo se van sus patch cords'); deshacer(); igual(S.conex, [pc], 'deshacer restituye montaje y patch cord');
      const mal = JSON.parse(g.texto); mal.estado.conex[0].b = { d: sw.id }; const l2 = ESQ.leer(JSON.stringify(mal)); afirmar(l2.ok && l2.avisos.length && !l2.estado.conex, 'una conexión sin ruta y sin puerto se omite con aviso');
    });
  });
  prueba('Fase 8B: con la herramienta de cable, un clic sobre un rack con equipos pide el equipo y después el puerto; la punta queda unida al equipo; las etiquetas físicas se ven en la vista del rack', () => {
    f8(() => {
      const rk = poner('rack', 4, 4), sw = poner('switch-2960-24tt', 4, 4), pc = poner('pc-pt', 8, 4), utp = CAT.Cables.find(c => c.n == 'UTP Cat6'), h0 = hist.length;
      tool = utp; render(); lastDown.t = 0; clic(8, 4); document.querySelector('#ctx [data-a^="g"]:not(:disabled)').click();
      lastDown.t = 0; clic(4, 4); afirmar(!tmp, 'el cable debe terminar solo sobre el rack'); afirmar(TR.ctx.abierto() && boton(sw.id), 'el clic sobre el rack debe ofrecer sus equipos'); elegir(sw.id); elegir('g0:4'); tool = null; render();
      const L = S.objs.filter(o => o.k == 'line').pop(); ser(L.pts[1].ref, sw.id, 'la punta queda unida al equipo, no al rack'); igual(S.conex[0].b, { d: sw.id, p: 'g0:4' }, 'extremo'); ser(hist.length, h0 + 1, 'cable, equipo y puertos = un paso'); ser(document.querySelectorAll('#g-inc circle').length, 0, 'conexión completa');
      tool = utp; render(); lastDown.t = 0; clic(4, 4); elegir(sw.id); elegir('g0:5'); ser(tmp.pts[0].ref, sw.id, 'primera punta sobre el rack: al equipo elegido'); lastDown.t = 0; clic(4, 4); TR.ctx.cerrar(); ser(tmp.pts.length, 1, 'otro clic sobre el mismo rack no agrega nada');
      lastDown.t = 0; clic(6, 7); finishLine(); tool = null; render(); igual(S.conex[1].a, { d: sw.id, p: 'g0:5' }, 'puerto de la primera punta');
      sel = L.id; multi = []; L.pts[1] = { x: 4, y: 4, ref: rk.id }; render(); igual(S.conex[0].b, { d: rk.id }, 'punta soltada sobre el rack'); ser(document.querySelectorAll('#g-inc circle').length, 2, 'un extremo sobre un rack con equipos está incompleto');
      afirmar(TR.acc.ejecutar('con-b'), 'el menú del cable no ofrece el extremo B'); elegir(sw.id); elegir('g0:6'); igual(S.conex[0].b, { d: sw.id, p: 'g0:6' }, '«Extremo B» pide equipo y puerto'); ser(byId(L.id).pts[1].ref, sw.id);
      TR.red.verEtiquetas(true); TR.vr.abrir(rk.id); const ts = [...document.querySelectorAll('#vr-c text')].map(t => t.textContent); afirmar(ts.includes('Fa7') && ts.includes('Fa6'), 'faltan las etiquetas físicas en la vista: ' + ts.join());
      afirmar(/FastEthernet 7 — Cable a PC1/.test(puertoV(sw, 'g0:6').textContent), 'el puerto debe decir a qué está conectado'); TR.red.verEtiquetas(false); afirmar(![...document.querySelectorAll('#vr-c text')].some(t => t.textContent == 'Fa7'), 'apagadas no se ven');
    });
  });
  prueba('Fase 8 (revisión thermo): tocar la punta de un cable unido a un equipo montado no le quita el puerto; un montaje que no entra o pisa a otro queda suelto; un arrastre cancelado en la vista no mueve nada; copiar o cortar un rack lleva sus patch cords; abrir un archivo cierra la vista', () => {
    f8(() => {
      const rk = poner('rack', 4, 4), sw = poner('switch-2960-24tt', 4, 4), pc = poner('pc-pt', 8, 4), utp = CAT.Cables.find(c => c.n == 'UTP Cat6');
      tool = utp; render(); lastDown.t = 0; clic(8, 4); document.querySelector('#ctx [data-a^="g"]:not(:disabled)').click(); lastDown.t = 0; clic(4, 4); elegir(sw.id); elegir('g0:4'); tool = null;
      const L = S.objs.filter(o => o.k == 'line').pop(); sel = L.id; multi = []; render(); const h0 = hist.length, asa = document.querySelector('#c [data-h="1"]'), b = asa.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
      lastDown.t = 0; sinCaptura(() => { ptr(asa, 'pointerdown', x, y); ptr(svg, 'pointermove', x + 1, y); ptr(svg, 'pointerup', x + 1, y); });
      igual([byId(L.id).pts[1].ref, S.conex[0].b], [sw.id, { d: sw.id, p: 'g0:4' }], 'la punta debe seguir en su equipo, con su puerto'); ser(hist.length, h0, 'tocar el asa no guarda historial');
      const s2 = poner('switch-2960-24tt', 4, 4), s3 = poner('switch-2960-24tt', 4, 4); igual([s2.ru.u, s3.ru.u], [2, 3], 'montaje');
      byId(sw.id).ru.u = 50; byId(s3.id).ru.u = 2; render(); igual([byId(sw.id).ru, byId(s3.id).parent, byId(s2.id).ru], [undefined, undefined, { u: 2, h: 1 }], 'el que pasa la altura y el que pisa a otro quedan sueltos'); afirmar(TR.acc.fijar([rk.id], 'label', 'R').ok, 'el rack debe seguir editable');
      const m = add({ k: 'item', n: 'Mesa', ic: '', tipo: 'mesa', w: 1.2, h: .7, x: 12, y: 8, label: '', puestos: 2 }), e1 = add({ k: 'item', n: 'PC', ic: '', w: .4, h: .3, x: 12, y: 8, label: '', parent: m.id, puesto: 1 }), e2 = add({ k: 'item', n: 'PC', ic: '', w: .4, h: .3, x: 12, y: 8, label: '', parent: m.id, puesto: 0, ru: { u: 1, h: 1 } });
      render(); igual([e1.puesto, e2.parent, e2.puesto, e2.ru], [1, undefined, undefined, undefined], 'un montaje con padre mesa queda suelto sin tocar los puestos de la mesa');
      TR.vr.abrir(rk.id); const c = $('#vr-c'), sv = c.firstElementChild, q = sv.getBoundingClientRect(), px = 20 * Math.min(q.width / sv.viewBox.baseVal.width, q.height / sv.viewBox.baseVal.height), g = document.querySelector('#vr-c [data-id="' + s2.id + '"] rect').getBoundingClientRect(), h1 = hist.length;
      c.setPointerCapture = () => {}; try { ptr(document.querySelector('#vr-c [data-id="' + s2.id + '"] rect'), 'pointerdown', g.left + 20, g.top + 3); ptr(c, 'pointermove', g.left + 20, g.top + 3 - 3 * px); ptr(c, 'pointercancel', g.left + 20, g.top + 3 - 3 * px); } finally { delete c.setPointerCapture; }
      igual([byId(s2.id).ru.u, hist.length], [2, h1], 'un arrastre cancelado no mueve el equipo'); ser(TR.vr.rack(), rk.id, 'la vista sigue abierta');
      TR.vr.cerrar(); const s4 = poner('switch-2960-24tt', 4, 4); afirmar(!TR.con.parche({ d: s2.id, p: 'g1:0' }, { d: s4.id, p: 'g1:1' }), 'patch cord'); const nc = S.conex.length;
      sel = rk.id; multi = []; afirmar(TR.acc.copiar() && TR.acc.pegar({ punto: { x: 14, y: 3 } }), 'copiar y pegar el rack'); const cp = S.conex[S.conex.length - 1], A = byId(cp.a.d), B = byId(cp.b.d);
      ser(S.conex.length, nc + 1, 'copiar un rack lleva sus patch cords'); afirmar(TR.con.esParche(cp) && A.id != s2.id && A.parent == B.parent && A.parent != rk.id && cp.a.p == 'g1:0' && cp.b.p == 'g1:1', 'el patch cord copiado une las copias, en el rack copiado');
      sel = A.parent; multi = []; afirmar(TR.acc.cortar(), 'cortar'); ser(S.conex.length, nc, 'cortar el rack se lleva su patch cord'); afirmar(TR.acc.pegar({ punto: { x: 14, y: 8 } }), 'pegar'); ser(S.conex.length, nc + 1, 'cortar y pegar un rack conserva sus patch cords'); deshacer(); ser(S.conex.length, nc, 'deshacer el pegado');
      afirmar(abrirTexto(ESQ.serializar(S, R).texto).ok, 'no abrió'); ser(TR.vr.rack(), null, 'abrir un archivo cierra la vista del rack'); ser(byId(s2.id).ru.u, 2, 'el montaje sigue tras abrir');
    });
  });
})();
