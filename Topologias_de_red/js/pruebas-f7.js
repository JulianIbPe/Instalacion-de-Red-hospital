// ===== pruebas-f7.js: pruebas de la Fase 7 (7A: puertos y conexiones; 7B: redes y etiquetas físicas) =====
// Se carga después de pruebas-f6.js (solo con ?pruebas=1) y agrega sus casos a los de TRP usando sus utilidades (TRP.util).
(() => {
  const { prueba, afirmar, ser, igual, item, fVacio, conProyecto, conR, clic, ptr, sinCaptura, pant, conConfirm } = TRP.util;
  const f7 = fn => conR(() => conProyecto(fVacio().estado, () => { const e0 = TR.ctx.espera, v0 = TR.red.viendo(); TR.ctx.espera = 0; try { TR.red.verEtiquetas(false); return fn(); } finally { TR.ctx.espera = e0; TR.ctx.cerrar(); TR.con.cerrar(); TR.red.cerrar(); TR.red.verEtiquetas(v0); } }));   // sin la espera del menú de puertos (las pruebas eligen al instante)
  const poner = (orig, x, y) => { tool = CAT.Dispositivos.find(d => d.pt.orig == orig); render(); clic(x, y); tool = null; return S.objs[S.objs.length - 1]; };
  const boton = id => document.querySelector('#ctx [data-a="' + id + '"]');
  const elegirP = id => { const b = boton(id); afirmar(b && !b.disabled, 'el menú no ofrece el puerto ' + id); b.click(); };
  const CABLE = n => CAT.Cables.find(c => c.n == n);
  const cablear = (a, b, pa, pb, t = CABLE('UTP Cat6')) => { tool = t; render(); clic(a.x, a.y); if (pa) elegirP(pa); clic(b.x, b.y); if (pb) elegirP(pb); TR.ctx.cerrar(); tool = null; render(); return S.objs.filter(o => o.k == 'line').pop(); };
  const marcas = () => document.querySelectorAll('#g-inc circle').length;
  const red = () => { const r = poner('router-2911', 3, 3), s = poner('switch-2960-24tt', 7, 3); return { r, s, L: cablear(r, s, 'g0:1', 'g1:0') }; };   // Router1 (Gi 2) — Switch1 (Gi 1)

  prueba('Fase 7A: dibujar un cable entre dos equipos pide el puerto en cada uno, termina solo en el segundo y crea UNA conexión, en un solo paso', () => {
    f7(() => {
      const r = poner('router-2911', 3, 3), s = poner('switch-2960-24tt', 7, 3), h0 = hist.length;
      tool = CABLE('UTP Cat6'); render(); clic(3, 3); afirmar(TR.ctx.abierto(), 'el clic sobre el equipo no abrió el menú de puertos'); ser(document.querySelectorAll('#ctx [data-a^="g"]').length, 3, 'puertos del router');
      elegirP('g0:1'); afirmar(tmp && tmp.k == 'line', 'el cable debe seguir en curso'); lastDown.t = 0; clic(3, 3); ser(tmp.pts.length, 1, 'otro clic sobre el mismo equipo no agrega nada');
      clic(7, 3); afirmar(!tmp, 'el cable debe terminar solo en el segundo equipo'); ser(document.querySelectorAll('#ctx [data-a^="g"]').length, 26, 'puertos del switch'); elegirP('g1:0'); tool = null; render();
      const L = S.objs[2]; ser(hist.length, h0 + 1, 'cable y puertos = un paso'); igual(S.conex, [{ id: 1, a: { d: r.id, p: 'g0:1' }, b: { d: s.id, p: 'g1:0' }, rutas: [L.id] }], 'conexión'); ser(marcas(), 0, 'una conexión completa no lleva marca');
      tool = CABLE('UTP Cat6'); render(); clic(3, 3); afirmar(boton('g0:1').disabled && /ocupado/.test(boton('g0:1').textContent), 'un puerto ocupado no se puede elegir'); TR.ctx.cerrar(); tool = null; tmp = null; render();
      deshacer(); ser(S.conex, undefined, 'deshacer quita el cable y su conexión'); rehacer(); ser(S.conex[0].b.p, 'g1:0', 'rehacer');
    });
  });
  prueba('Fase 7A: una conexión incompleta (sin equipo o sin puerto) se marca fuera de #c; solo se ofrecen los puertos que sirven para el cable; el de energía va al puerto «Energía»', () => {
    f7(() => {
      const r = poner('router-2911', 3, 3), pc = poner('pc-pt', 7, 3), c0 = $('#c').innerHTML.length;
      tool = CABLE('UTP Cat6'); render(); clic(3, 3); elegirP('-'); clic(5, 5); finishLine(); tool = null; render();
      igual([S.conex[0].a, S.conex[0].b], [{ d: r.id }, null], 'extremos'); ser(marcas(), 2, 'faltan las marcas de las dos puntas'); afirmar(!$('#c').innerHTML.includes('class="inc"'), 'las marcas no deben salir en el PNG');
      afirmar(!construirSvgExport().xml.includes('class="inc"'), 'las marcas no deben exportarse');
      tool = CABLE('Consola'); render(); clic(7, 3); igual([...document.querySelectorAll('#ctx [data-a^="g"]')].map(b => b.textContent), ['RS-232'], 'el cable de consola solo ofrece el puerto de consola'); TR.ctx.cerrar(); tmp = null;
      const utp = () => [...document.querySelectorAll('#ctx [data-a^="g"]')].map(b => b.textContent);
      tool = CABLE('UTP Cat6'); render(); clic(7, 3); const p6 = utp(); TR.ctx.cerrar(); tmp = null; afirmar(p6.length > 0, 'el UTP Cat6 ofrece puertos');
      for (const n of ['UTP Cat5', 'STP Cat6A (blindado)']) { tool = CABLE(n); render(); clic(7, 3); igual(utp(), p6, n + ' ofrece los mismos puertos que el UTP Cat6'); TR.ctx.cerrar(); tmp = null; }
      tool = CAT['Eléctrico'].find(c => c.n == 'Cable de energía'); render(); clic(7, 3); igual([...document.querySelectorAll('#ctx [data-a^="g"]')].map(b => b.textContent), ['Energía'], 'el cable de energía solo ofrece el puerto de energía'); TR.ctx.cerrar(); tmp = null;
      tool = CABLE('Coaxial'); render(); clic(7, 3); afirmar(!TR.ctx.abierto(), 'una PC no tiene puertos coaxiales'); tmp = null; tool = null; render();
      const mE = marcas(); S.objs.push({ id: nid++, k: 'line', n: 'Cable de energía', c: '#e74c3c', w: .05, d: '', label: '', pl: 'p1', cp: 'c1', pts: [{ x: 1, y: 1 }, { x: 2, y: 1 }] }, { id: nid++, k: 'line', n: 'Pared', c: '#444444', w: .2, d: '', label: '', pl: 'p1', cp: 'c1', pts: [{ x: 1, y: 2 }, { x: 2, y: 2 }] });
      render(); ser(S.conex.length, 2, 'el cable de energía lleva conexión; la pared no'); ser(marcas(), mE, 'el cable de energía suelto no lleva marcas rojas'); const ce = S.objs.find(o => o.k == 'line' && subDe(o) == 'energia'); afirmar(!TR.red.cuenta({ a: { d: pc.id, p: 'g3:0' }, b: { d: r.id, p: 'g1:0' }, rutas: [ce.id] }), 'una conexión de energía completa no forma red'); afirmar(c0 > 0);
      const viejo = item(nid++, 'PC', '💻', 9, 6); S.objs.push(viejo, { id: nid++, k: 'line', n: 'UTP Cat6', c: '#2e86de', w: .06, d: '', label: '', pl: 'p1', cp: 'c1', pts: [{ x: 9, y: 6, ref: viejo.id }, { x: 3, y: 3, ref: r.id }] });
      const m0 = marcas(); render(); ser(marcas(), m0 + 1, 'un equipo sin puertos (proyecto viejo) no pide puerto: solo falta el del router');
    });
  });
  prueba('Fase 7A: mover un vértice, el equipo o su mesa no cambia la conexión; sincronizar dos veces no cambia nada; pasar un extremo a otro equipo limpia el puerto', () => {
    f7(() => {
      const { r, s, L } = red(), antes = JSON.stringify(S.conex);
      L.pts.splice(1, 0, { x: 5, y: 5 }); render(); L.pts[1].x = 6; r.x = 2; r.y = 5; render(); ser(JSON.stringify(S.conex), antes, 'la conexión cambió al mover');
      S.objs.push(item(nid++, 'Mesa', '🪑', 3, 6, { tipo: 'mesa', w: 1.2, h: .7, puestos: 2 })); const m = S.objs[S.objs.length - 1]; Object.assign(r, { parent: m.id, puesto: 0 }); render(); m.x = 4; render();
      ser(JSON.stringify(S.conex), antes, 'la conexión cambió al mover la mesa'); ser(pt(L.pts[0]).x, r.x, 'el cable sigue al equipo de la mesa');
      const t = JSON.stringify(S); TR.con.sincronizar(); TR.con.sincronizar(); ser(JSON.stringify(S), t, 'sincronizar no es idempotente');
      const s2 = poner('switch-2960-24tt', 7, 6); L.pts[L.pts.length - 1] = { x: s2.x, y: s2.y, ref: s2.id }; render();
      igual([S.conex[0].id, S.conex[0].a, S.conex[0].b], [1, { d: r.id, p: 'g0:1' }, { d: s2.id }], 'el extremo pasó a otro equipo: mismo id, puerto limpio');
      L.pts[L.pts.length - 1] = { x: 9, y: 9 }; render(); ser(S.conex[0].b, null, 'punta suelta'); afirmar(s.id != s2.id);
    });
  });
  prueba('Fase 7A: borrar un equipo deja el extremo libre y conserva el cable (R7); borrar el cable borra su conexión (R8); deshacer restituye los puertos', () => {
    f7(() => {
      const { r, s, L } = red();
      sel = s.id; multi = []; borrar(); afirmar(byId(L.id), 'el cable debe conservarse'); igual([S.conex[0].a, S.conex[0].b], [{ d: r.id, p: 'g0:1' }, null], 'extremo del equipo borrado');
      deshacer(); igual(S.conex[0].b, { d: s.id, p: 'g1:0' }, 'deshacer restituye el puerto');
      sel = L.id; borrar(); ser(S.conex, undefined, 'la conexión se borra con su cable'); ser(TR.con.puertosDe(byId(r.id)).length, 4);
      deshacer(); ser(S.conex.length, 1); sel = L.id; multi = []; TR.acc.copiar(); TR.acc.pegar({ punto: { x: 5, y: 6 } }); render();
      ser(S.conex.length, 2, 'el cable pegado tiene su propia conexión'); igual([S.conex[1].a, S.conex[1].b], [null, null], 'y queda incompleta');
    });
  });
  prueba('Fase 7A: menú del cable: extremos con su puerto y cambio de tipo (los puertos que no sirven se limpian); el color del cable no se cambia (D16)', () => {
    f7(() => {
      const { r, L } = red(); sel = L.id; multi = []; render();
      const it = TR.acc.paraMenu([L]).flatMap(g => g.items), tx = id => (it.find(i => i.id == id) || {}).texto;
      igual([tx('con-a'), tx('con-b')], ['Extremo A: Router1 · GigabitEthernet 2', 'Extremo B: Switch1 · GigabitEthernet 1'], 'extremos'); afirmar(it.find(i => i.id == 'cab-utp6').marca && !it.find(i => i.id == 'enf-c'), 'tipo marcado y sin «Color…»');
      afirmar(!TR.acc.colorable(L) && !TR.acc.fijar([L.id], 'c', '#ff0000').ok, 'D16: el color de un cable no se cambia');
      const h0 = hist.length; afirmar(TR.acc.ejecutar('con-a')); elegirP('g0:2'); ser(S.conex[0].a.p, 'g0:2', 'cambiar de puerto'); ser(hist.length, h0 + 1, 'un paso');
      afirmar(TR.acc.ejecutar('con-a')); elegirP('-'); igual(S.conex[0].a, { d: r.id }, 'sin puerto'); TR.con.asignar(1, 'a', 'g0:0');
      afirmar(TR.acc.ejecutar('cab-coaxial')); const c = byId(L.id); igual([c.n, c.sub, c.c, S.conex[0].id, S.conex[0].a, S.conex[0].b.p], ['Coaxial', 'coaxial', '#555555', 1, { d: r.id }, undefined], 'cable coaxial: los puertos UTP se limpian');
      deshacer(); igual([byId(L.id).sub, S.conex[0].a.p], ['utp6', 'g0:0'], 'deshacer el cambio de tipo');
      afirmar(!TR.acc.paraMenu([]).some(g => g.items.some(i => /^(cab|con)-/.test(i.id))), 'el menú del fondo no lleva entradas de cable');
    });
  });
  prueba('Fase 7A: diálogo «Interfaces»: lista los puertos, conecta y desconecta cables, y guarda estado y descripción en el equipo', () => {
    f7(() => {
      const { r } = red(); sel = r.id; multi = []; render(); afirmar(TR.acc.ejecutar('con-ifs') && TR.con.abierto(), 'no abrió el diálogo');
      const fila = p => document.querySelector('#dlg-if [data-p="' + p + '"]'), cambiar = (el, v) => { if (el.type == 'checkbox') el.checked = v; else el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
      ser(document.querySelectorAll('#dlg-if .di-r').length, 4, 'filas (3 GigabitEthernet y Energía)'); ser(fila('g0:1').querySelector('select').selectedOptions[0].textContent, 'Cable a Switch1 · GigabitEthernet 1', 'cable del puerto');
      const hv = hist.length; cambiar(fila('g0:0').querySelector('[type=text]'), '   '); ser(hist.length, hv, 'una descripción que no cambia nada no guarda historial');
      const h0 = hist.length; cambiar(fila('g0:0').querySelector('select'), '1a'); ser(S.conex[0].a.p, 'g0:0', 'pasar el cable a otro puerto'); ser(fila('g0:1').querySelector('select').value, '', 'el puerto anterior queda libre'); ser(hist.length, h0 + 1);
      cambiar(fila('g0:0').querySelector('select'), ''); igual(S.conex[0].a, { d: r.id }, 'desconectar');
      cambiar(fila('g0:2').querySelector('[type=text]'), '  Enlace al ISP '); cambiar(fila('g0:2').querySelector('[type=checkbox]'), false); igual(byId(r.id).po, { 'g0:2': { off: true, desc: 'Enlace al ISP' } }, 'po');
      cambiar(fila('g0:2').querySelector('[type=checkbox]'), true); cambiar(fila('g0:2').querySelector('[type=text]'), ''); ser(byId(r.id).po, undefined, 'sin sobrescrituras no queda po');
      TR.con.cerrar(); afirmar(!TR.acc.paraMenu([item(99, 'PC', '💻', 1, 1)]).some(g => g.items.some(i => i.id == 'con-ifs')), 'un equipo sin puertos no ofrece «Interfaces…»');
    });
  });
  prueba('Fase 7A: ida y vuelta del archivo con conexiones y puertos (R9); una conexión dañada se omite con aviso; un archivo v1 recibe una conexión por cable', () => {
    f7(() => {
      const { r, s } = red(); byId(r.id).po = { 'g0:2': { off: true, desc: 'x' } }; render();
      const a = ESQ.serializar(S, R); afirmar(a.ok, a.error); const e = JSON.parse(a.texto).estado, l = ESQ.leer(a.texto);
      afirmar(l.ok && !l.avisos.length, 'no reabre limpio: ' + (l.avisos || []).join(' | ')); igual(l.estado.conex, e.conex, 'conex (R9)'); igual(l.estado.objs.map(o => o.po), e.objs.map(o => o.po), 'po (R9)'); afirmar(e.conex[0].a.p == 'g0:1' && e.objs[0].po, 'el archivo no lleva los puertos');
      const mal = JSON.parse(a.texto); mal.estado.conex.push({ id: 1, a: null, b: null, rutas: [3] }, { id: 7, a: { d: 1, p: 'x' }, b: null, rutas: [3] }, { id: 8, a: null, b: null, rutas: [] });
      const m = ESQ.leer(JSON.stringify(mal)); afirmar(m.ok && m.estado.conex.length == 1 && m.avisos.some(t => /conexiones/.test(t)), 'conexiones dañadas');
      const v1 = { version: 1, objs: [item(1, 'PC', '💻', 2, 2), item(2, 'Switch', '🔀', 6, 2), { id: 3, k: 'line', n: 'UTP Cat6', c: '#2e86de', w: .06, d: '', label: '', pts: [{ x: 2, y: 2, ref: 1 }, { x: 6, y: 2, ref: 2 }] }] };
      afirmar(abrirTexto(JSON.stringify(v1)).ok, 'no abrió el v1'); igual(S.conex, [{ id: 1, a: { d: 1 }, b: { d: 2 }, rutas: [3] }], 'migración'); ser(marcas(), 0, 'equipos sin puertos: completa'); afirmar(s);
    });
  });
  prueba('Fase 7A: arrastrar la punta de un cable fuera de su equipo y volver conserva el puerto; soltarla en el vacío deja el extremo libre; unirse a un equipo por el nodo de otro cable también pide el puerto', () => {
    f7(() => {
      const { r, s, L } = red();
      const arrastrarPunta = (i, puntos) => sinCaptura(() => { sel = L.id; multi = []; render(); lastDown.t = 0; const a = document.querySelector(`#c circle[data-id="${L.id}"][data-h="${i}"]`), b = a.getBoundingClientRect(); let p; ptr(a, 'pointerdown', b.left + b.width / 2, b.top + b.height / 2); for (const [x, y] of puntos) { p = pant(x, y); ptr(svg, 'pointermove', p.x, p.y); } ptr(svg, 'pointerup', p.x, p.y); });
      arrastrarPunta(1, [[5, 5], [7, 3]]); igual(S.conex[0].b, { d: s.id, p: 'g1:0' }, 'la punta volvió a su equipo');
      const s2 = poner('switch-2960-24tt', 7, 6); sel = null; tool = CABLE('UTP Cat6'); render(); lastDown.t = 0; clic(7, 6); elegirP('g0:5'); clic(3, 3.27);   // 0,12 m debajo del icono del router: el imán une el punto al nodo del primer cable
      afirmar(!tmp && TR.ctx.abierto() && /Router1/.test($('#ctx .ch').textContent), 'unido al router por el nodo de otro cable: debe terminar y pedir el puerto'); elegirP('g0:0'); tool = null; render();
      igual([S.conex[1].a, S.conex[1].b], [{ d: s2.id, p: 'g0:5' }, { d: r.id, p: 'g0:0' }], 'segundo cable');
      arrastrarPunta(1, [[5, 5]]); ser(S.conex[0].b, null, 'punta soltada en el vacío');
    });
  });
  prueba('Fase 7A: el segundo clic de un doble clic sobre el segundo equipo no cierra el menú de puertos, no elige nada y no empieza otro cable', () => {
    f7(() => {
      const r = poner('router-2911', 3, 3), s = poner('switch-2960-24tt', 7, 3); tool = CABLE('UTP Cat6'); render(); clic(3, 3); elegirP('g0:0');
      TR.ctx.espera = 350; clic(7, 3); clic(7, 3); afirmar(!tmp && TR.ctx.abierto(), 'el segundo clic llegó al plano'); ser(S.objs.filter(o => o.k == 'line').length, 1, 'cables');
      boton('g1:0').click(); igual(S.conex[0].b, { d: s.id }, 'un clic dentro de la espera no elige puerto'); afirmar(TR.ctx.abierto() && r, 'el menú sigue abierto');
    });
  });
  // ---------- Fase 7B: redes automáticas, VLAN y etiquetas físicas ----------
  const VL = TR.red.vlan;
  const cambiar = (el, v) => { if (el.type == 'checkbox') el.checked = v; else el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
  const enlazar = (a, pa, b, pb, n = 'UTP Cat6') => { const t = CABLE(n); S.objs.push({ id: nid++, k: 'line', n: t.n, c: t.c, w: t.w, d: t.d, label: '', pl: 'p1', cp: 'c1', pts: [{ x: a.x, y: a.y, ref: a.id }, { x: b.x, y: b.y, ref: b.id }] }); render(); const c = S.conex[S.conex.length - 1]; TR.con.asignar(c.id, 'a', pa, true); TR.con.asignar(c.id, 'b', pb, true); return c; };   // cable ya conectado entre dos puertos, sin pasar por el ratón
  const redes = () => TR.red.automaticas().redes.map(r => [r.nombre, r.texto, r.equipos.length]);
  const enIf = (p, sel) => document.querySelector('#dlg-if [data-p="' + p + '"] ' + sel);
  prueba('Fase 7B: VLAN: alta, edición y baja son un paso cada una y se deshacen; los valores no válidos se rechazan sin historial', () => {
    f7(() => {
      const h0 = hist.length; ser(VL.crear(), 'r1'); ser(VL.crear(), 'r2'); ser(hist.length, h0 + 2); igual(S.vlans.map(v => [v.id, v.nombre, v.vlan]), [['r1', 'VLAN0010', 10], ['r2', 'VLAN0020', 20]], 'número y nombre automáticos');
      afirmar(VL.fijar('r1', 'nombre', ' Administración ') && VL.fijar('r1', 'vlan', '30') && VL.fijar('r1', 'subred', '192.168.10.0/24') && VL.fijar('r1', 'color', '#FF0000'));
      igual(S.vlans[0], { id: 'r1', nombre: 'Administración', vlan: 30, subred: '192.168.10.0/24', color: '#ff0000' }, 'VLAN editada'); ser(hist.length, h0 + 6, 'un paso por cambio');
      const h1 = hist.length; afirmar(!VL.fijar('r1', 'vlan', '5000') && !VL.fijar('r1', 'vlan', '1.5') && !VL.fijar('r1', 'vlan', '1e1') && !VL.fijar('r1', 'nombre', '  ') && !VL.fijar('r1', 'color', 'rojo') && !VL.fijar('r9', 'nombre', 'x'), 'aceptó un valor no válido');
      afirmar(VL.fijar('r1', 'vlan', '30'), 'sin cambio'); ser(hist.length, h1, 'rechazos y sin cambio no guardan historial');
      afirmar(VL.fijar('r1', 'vlan', '')); ser(S.vlans[0].vlan, undefined, 'VLAN vacía'); deshacer(); ser(S.vlans[0].vlan, 30, 'deshacer');
      afirmar(VL.borrar('r2')); ser(S.vlans.length, 1); afirmar(VL.borrar('r1')); ser(S.vlans, undefined, 'sin VLAN no queda S.vlans'); deshacer(); ser(S.vlans.length, 1); ser(VL.crear(), 'r2', 'el id sigue al mayor existente');
      $('#bredes').click(); ser(document.querySelectorAll('#dlg-red .dr-r').length, 2, 'filas del diálogo'); cambiar(document.querySelector('#dlg-red [data-r="r1"] [data-k="vlan"]'), '9999');
      ser(document.querySelector('#dlg-red [data-r="r1"] [data-k="vlan"]').value, '30', 'un valor no válido vuelve al anterior'); cambiar(document.querySelector('#dlg-red [data-r="r2"] [data-k="nombre"]'), 'Invitados'); ser(S.vlans[1].nombre, 'Invitados', 'editar desde el diálogo');
    });
  });
  prueba('Fase 7B: la VLAN se asigna al puerto desde «Interfaces»; borrar una VLAN en uso pide confirmación y deja sus puertos sin VLAN, en un paso', () => {
    f7(() => {
      const { s } = red(); VL.crear(); TR.con.abrir(s.id); const sv = p => enIf(p, '[data-k="vlan"]');
      ser(sv('g1:0').options[1].textContent, 'VLAN 10 · VLAN0010', 'opción'); const h0 = hist.length; cambiar(sv('g1:0'), 'r1'); cambiar(sv('g0:3'), 'r1'); igual(byId(s.id).po, { 'g1:0': { vlan: 'r1' }, 'g0:3': { vlan: 'r1' } }, 'po'); ser(hist.length, h0 + 2);
      ser(S.conex[0].b.p, 'g1:0', 'asignar la VLAN no toca la conexión'); cambiar(sv('g0:3'), ''); ser(byId(s.id).po['g0:3'], undefined, 'quitar la VLAN'); cambiar(sv('g0:3'), 'r1'); TR.con.cerrar();
      ser(conConfirm(false, () => afirmar(!VL.borrar('r1'), 'borró sin confirmar')), 1, 'debe preguntar'); afirmar(S.vlans, 'la VLAN sigue');
      const h1 = hist.length; conConfirm(true, () => VL.borrar('r1')); igual([S.vlans, byId(s.id).po], [undefined, undefined], 'VLAN y puertos'); ser(hist.length, h1 + 1, 'un paso'); deshacer(); igual(byId(s.id).po['g0:3'], { vlan: 'r1' }, 'deshacer');
    });
  });
  prueba('Fase 7B: ningún puerto queda apuntando a una VLAN que no existe: ni al pegar un equipo copiado antes de borrarla, ni al abrir un archivo', () => {
    f7(() => {
      const { s } = red(); VL.crear(); byId(s.id).po = { 'g0:3': { vlan: 'r1' } }; render(); sel = s.id; multi = []; afirmar(TR.acc.copiar(), 'copiar');
      conConfirm(true, () => VL.borrar('r1')); afirmar(TR.acc.pegar({ punto: { x: 7, y: 6 } }), 'pegar'); const p = S.objs[S.objs.length - 1]; afirmar(p.id != s.id && p.modelo == s.modelo, 'equipo pegado'); ser(p.po, undefined, 'el equipo pegado no conserva la VLAN borrada');
      ser(VL.crear(), 'r1', 'el id se reutiliza'); ser(byId(p.id).po, undefined, 'y la VLAN nueva no aparece asignada sola');
      const d = JSON.parse(ESQ.serializar(S, R).texto); d.estado.objs[1].po = { 'g0:1': { vlan: 'r77', desc: 'x' }, 'g0:2': { vlan: 'r77' } };
      const l = ESQ.leer(JSON.stringify(d)); afirmar(l.ok && l.avisos.some(t => /VLAN inexistentes/.test(t)), 'debe avisar'); igual(l.estado.objs[1].po, { 'g0:1': { desc: 'x' } }, 'la referencia colgante se suelta');
    });
  });
  prueba('Fase 7B: etiquetas físicas: apagadas no cambian #c; prendidas muestran solo el puerto, con el color de su VLAN, salen en el PNG y admiten texto propio', () => {
    f7(() => {
      const { r, s, L } = red(); VL.crear(); VL.fijar('r1', 'color', '#ff0000'); byId(s.id).po = { 'g1:0': { vlan: 'r1' } }; render();
      const c0 = $('#c').innerHTML; afirmar(!c0.includes('class="etq"'), 'apagadas no deben dibujarse'); TR.red.verEtiquetas(true); TR.red.verEtiquetas(false); ser($('#c').innerHTML, c0, 'apagar las etiquetas debe dejar #c idéntico');
      $('#betq').click(); afirmar(TR.red.viendo() && $('#betq').classList.contains('on'), 'botón');
      const tx = () => [...document.querySelectorAll('#c text.etq')].map(t => t.textContent); igual(tx(), ['Gi2', 'Gi1'], 'la etiqueta automática es solo el puerto');
      ser(document.querySelectorAll('#c text.etq')[1].getAttribute('fill'), '#ff0000', 'color de la VLAN'); afirmar(construirSvgExport().xml.includes('class="etq"'), 'el PNG no incluiría las etiquetas');
      const pr = window.prompt; try {
        sel = L.id; multi = []; render(); const h0 = hist.length; window.prompt = () => ' Uplink a core '; afirmar(TR.acc.ejecutar('etq-a')); ser(S.conex[0].etqA, 'Uplink a core'); ser(tx()[0], 'Uplink a core', 'texto propio'); ser(hist.length, h0 + 1);
        window.prompt = () => null; afirmar(!TR.acc.ejecutar('etq-a'), 'cancelar no cambia nada'); window.prompt = () => ''; afirmar(TR.acc.ejecutar('etq-a')); ser(S.conex[0].etqA, undefined, 'vacío = automática');
      } finally { window.prompt = pr; }
      TR.con.asignar(1, 'a', null); igual(tx(), ['Gi1'], 'un extremo sin puerto no lleva etiqueta'); TR.con.asignar(1, 'a', 'g0:1');
      S.conex[0].etqB = 'PC-Juan'; render(); ser(tx()[1], 'PC-Juan'); TR.con.asignar(1, 'b', 'g1:1'); ser(S.conex[0].etqB, 'PC-Juan', 'cambiar de puerto en el mismo equipo conserva el texto propio');
      const s2 = poner('switch-2960-24tt', 7, 6), c = byId(L.id); c.pts[1] = { x: s2.x, y: s2.y, ref: s2.id }; render(); ser(S.conex[0].etqB, undefined, 'el texto propio no pasa a otro equipo');
      c.pts = [c.pts[0]]; render(); igual([S.conex[0].a, tx().length], [{ d: r.id, p: 'g0:1' }, 0], 'un cable de un solo punto no rompe el dibujo de las etiquetas');
    });
  });
  prueba('Fase 7B: el tipo de cable es un campo (inspector y menú) y el puerto de la primera punta no deja rastro en el cable', () => {
    f7(() => {
      const { L } = red(); afirmar(TR.acc.campo('cable').aplica(L) && TR.acc.campo('cable').leer(L) == 'utp6', 'campo'); afirmar(S.objs.every(o => o.p0 === undefined), 'quedó el campo transitorio p0'); ser(S.conex[0].a.p, 'g0:1', 'puerto de la primera punta');
      const h0 = hist.length; afirmar(TR.acc.fijar([L.id], 'cable', 'fibra').ok); igual([byId(L.id).n, byId(L.id).sub], ['Fibra óptica', 'fibra']); ser(hist.length, h0 + 1); afirmar(!TR.acc.fijar([L.id], 'cable', 'energia').ok, 'tipo no válido');
    });
  });
  prueba('Fase 7B: ida y vuelta del archivo con VLAN, VLAN por puerto, puerto enrutado y etiquetas propias (R9); las VLAN dañadas se omiten con aviso', () => {
    f7(() => {
      const { s } = red(); VL.crear(); VL.fijar('r1', 'vlan', '20'); VL.fijar('r1', 'subred', '10.0.0.0/8'); VL.crear(); TR.con.fijarPuerto(byId(s.id), 'g1:0', { l3: true, vlan: 'r1', desc: 'x', off: true }); S.conex[0].etqB = 'Patch 12'; render();
      igual(byId(s.id).po, { 'g1:0': { off: true, desc: 'x', vlan: 'r1', l3: true } }, 'fijarPuerto deja los campos en el orden del esquema');
      const a = ESQ.serializar(S, R); afirmar(a.ok, a.error); const e = JSON.parse(a.texto).estado, l = ESQ.leer(a.texto); afirmar(l.ok && !l.avisos.length, 'no reabre limpio: ' + (l.avisos || []).join(' | '));
      igual(l.estado.vlans, e.vlans, 'vlans (R9)'); igual(l.estado.conex, e.conex, 'conex (R9)'); igual(l.estado.objs.map(o => o.po), e.objs.map(o => o.po), 'po (R9)');
      afirmar(e.vlans.length == 2 && e.redes === undefined && e.conex[0].etqB == 'Patch 12' && e.objs[1].po['g1:0'].vlan == 'r1' && e.objs[1].po['g1:0'].l3, 'el archivo no lleva los datos');
      const mal = JSON.parse(a.texto); mal.estado.vlans.push({ id: 'r1', nombre: 'repetida', color: '#000000' }, { id: 'x', nombre: 'a', color: '#000000' }, { id: 'r7', nombre: ' ', color: '#000000' }, { id: 'r8', nombre: 'sin color' }, { id: 'r6', nombre: 'color corto', color: '#abc' }, { id: 'r9', nombre: 'vlan mala', vlan: 9999, color: '#000000' });
      const m = ESQ.leer(JSON.stringify(mal)); afirmar(m.ok && m.avisos.some(t => /VLAN no válidas/.test(t)), 'aviso'); igual(m.estado.vlans.map(v => [v.id, v.vlan]), [['r1', 20], ['r2', 10], ['r9', undefined]], 'VLAN dañadas');
    });
  });
  prueba('Fase 7B: redes automáticas: una por cada puerto enrutado conectado; el switch la extiende; una isla sin router, un cable de consola o una conexión incompleta no cuentan', () => {
    f7(() => {
      const r1 = poner('router-2911', 2, 2), r2 = poner('router-2911', 5, 2), sw = poner('switch-2960-24tt', 2, 4), pc1 = poner('pc-pt', 1, 6), pc2 = poner('pc-pt', 3, 6), sw2 = poner('switch-2960-24tt', 6, 4), pc3 = poner('pc-pt', 6, 6);
      igual(redes(), [], 'sin cables no hay redes'); enlazar(sw2, 'g0:0', pc3, 'g2:0'); igual(redes(), [], 'una isla sin router no es una red');
      enlazar(r1, 'g0:0', r2, 'g0:0'); igual(redes(), [['Red 1', 'Router1 Gi1 — Router2 Gi1', 2]], 'enlace router–router = una red con sus dos puertos');
      enlazar(r1, 'g0:1', sw, 'g0:0'); enlazar(sw, 'g0:1', pc1, 'g2:0'); enlazar(sw, 'g0:2', pc2, 'g2:0'); igual(redes(), [['Red 1', 'Router1 Gi1 — Router2 Gi1', 2], ['Red 2', 'Router1 Gi2', 4]], 'el switch extiende la red del puerto del router');
      const A = TR.red.automaticas(); igual([A.redDe(r1, 'g0:0'), A.redDe(r1, 'g0:1'), A.redDe(sw, 'g0:2'), A.redDe(pc2, 'g2:0'), A.redDe(sw2, 'g0:0'), A.redDe(r2, 'g0:2')], ['Red 1', 'Red 2', 'Red 2', 'Red 2', undefined, undefined], 'red de cada puerto');
      enlazar(pc1, 'g0:0', r2, 'g0:1', 'Consola'); ser(redes().length, 2, 'un cable de consola no forma red');
      const c = enlazar(r2, 'g0:2', sw2, 'g0:5'); igual(redes()[2], ['Red 3', 'Router2 Gi3', 3], 'al conectarla a un router, la isla pasa a ser una red y no renumera las anteriores'); TR.con.asignar(c.id, 'a', null, true); ser(redes().length, 2, 'una conexión sin puerto no cuenta');
    });
  });
  prueba('Fase 7B: qué equipos enrutan: el multicapa solo en los puertos marcados «enrutado», el router hogareño solo en su primer grupo («Internet»), el firewall en todos', () => {
    f7(() => {
      const r = poner('router-2911', 2, 2), ml = poner('multilayer-switch-3560-24ps', 5, 2), pc = poner('pc-pt', 5, 5), hr = poner('home-router-pt-ac', 8, 2), fw = poner('isa-3000', 10, 2), pc2 = poner('pc-pt', 8, 5);
      enlazar(r, 'g0:0', ml, 'g0:0'); enlazar(ml, 'g0:1', pc, 'g2:0'); igual(redes(), [['Red 1', 'Router1 Gi1', 3]], 'un multicapa sin puertos enrutados solo conmuta');
      TR.con.abrir(ml.id); const h0 = hist.length; afirmar(enIf('g0:1', '[data-k="l3"]'), 'un multicapa ofrece la casilla «enrutado»'); cambiar(enIf('g0:1', '[data-k="l3"]'), true);
      igual(byId(ml.id).po, { 'g0:1': { l3: true } }, 'po'); ser(hist.length, h0 + 1, 'un paso'); igual(redes(), [['Red 1', 'Router1 Gi1', 2], ['Red 2', ml.label + ' Fa2', 2]], 'el puerto enrutado del multicapa crea su red'); ser(enIf('g0:1', '.di-red').textContent, 'Red 2', 'el diálogo muestra la red del puerto'); TR.con.cerrar();
      enlazar(hr, 'g1:0', pc2, 'g2:0'); ser(redes().length, 2, 'los puertos LAN del router hogareño solo conmutan'); enlazar(hr, 'g0:0', fw, 'g1:0'); igual(redes()[2], ['Red 3', hr.label + ' Internet — ' + fw.label + ' Gi1', 2], 'el puerto «Internet» y el firewall enrutan');
      R.modelos[hr.modelo].puertos[0].pref = 'WAN'; ser(redes()[2][1], hr.label + ' WAN — ' + fw.label + ' Gi1', 'el puerto enrutado se decide por su grupo, no por su nombre visible');
      TR.con.abrir(r.id); afirmar(!document.querySelector('#dlg-if [data-k="l3"]'), 'un router no ofrece «enrutado»: ya enruta en todos sus puertos');
    });
  });
  prueba('Fase 7B: dónde se ven las redes: columna «Red» de «Interfaces» (solo en los puertos cuya conexión forma red) y lista del diálogo «Redes y VLAN»; no se guardan en el archivo', () => {
    f7(() => {
      const { s } = red(), pc = poner('pc-pt', 7, 6), c = enlazar(s, 'g0:3', pc, 'g2:0'), celda = p => enIf(p, '.di-red').textContent;
      TR.con.abrir(s.id); igual([celda('g1:0'), celda('g0:3'), celda('g0:9')], ['Red 1', 'Red 1', '—'], 'red de cada puerto del switch'); afirmar(!document.querySelector('#dlg-if [data-k="l3"]'), 'un switch común no ofrece «enrutado»');
      TR.con.cerrar(); TR.con.asignar(c.id, 'b', null, true); TR.con.abrir(s.id); ser(celda('g0:3'), '—', 'un puerto con una conexión incompleta no muestra red'); TR.con.cerrar();
      $('#bredes').click(); ser(document.querySelectorAll('#dlg-red .dr-au').length, 1, 'el diálogo lista las redes automáticas');
      const l = ESQ.leer(ESQ.serializar(S, R).texto); afirmar(l.ok && !l.avisos.length && l.estado.vlans === undefined && l.estado.redes === undefined, 'las redes automáticas no se guardan');
    });
  });
})();
