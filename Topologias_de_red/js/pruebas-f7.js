// ===== pruebas-f7.js: pruebas de la Fase 7A (puertos y conexiones) =====
// Se carga después de pruebas-f6.js (solo con ?pruebas=1) y agrega sus casos a los de TRP usando sus utilidades (TRP.util).
(() => {
  const { prueba, afirmar, ser, igual, item, fVacio, conProyecto, conR, clic, ptr, sinCaptura, pant } = TRP.util;
  const f7 = fn => conR(() => conProyecto(fVacio().estado, () => { const e0 = TR.ctx.espera; TR.ctx.espera = 0; try { return fn(); } finally { TR.ctx.espera = e0; TR.ctx.cerrar(); TR.con.cerrar(); } }));   // sin la espera del menú de puertos (las pruebas eligen al instante)
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
  prueba('Fase 7A: una conexión incompleta (sin equipo o sin puerto) se marca fuera de #c; solo se ofrecen los puertos que sirven para el cable; el de energía no lleva conexión', () => {
    f7(() => {
      const r = poner('router-2911', 3, 3), pc = poner('pc-pt', 7, 3), c0 = $('#c').innerHTML.length;
      tool = CABLE('UTP Cat6'); render(); clic(3, 3); elegirP('-'); clic(5, 5); finishLine(); tool = null; render();
      igual([S.conex[0].a, S.conex[0].b], [{ d: r.id }, null], 'extremos'); ser(marcas(), 2, 'faltan las marcas de las dos puntas'); afirmar(!$('#c').innerHTML.includes('class="inc"'), 'las marcas no deben salir en el PNG');
      afirmar(!construirSvgExport().xml.includes('class="inc"'), 'las marcas no deben exportarse');
      tool = CABLE('Consola'); render(); clic(7, 3); igual([...document.querySelectorAll('#ctx [data-a^="g"]')].map(b => b.textContent), ['RS-232'], 'el cable de consola solo ofrece el puerto de consola'); TR.ctx.cerrar(); tmp = null;
      tool = CABLE('Coaxial'); render(); clic(7, 3); afirmar(!TR.ctx.abierto(), 'una PC no tiene puertos coaxiales'); tmp = null; tool = null; render();
      S.objs.push({ id: nid++, k: 'line', n: 'Cable de energía', c: '#e74c3c', w: .05, d: '', label: '', pl: 'p1', cp: 'c1', pts: [{ x: 1, y: 1 }, { x: 2, y: 1 }] }, { id: nid++, k: 'line', n: 'Pared', c: '#444444', w: .2, d: '', label: '', pl: 'p1', cp: 'c1', pts: [{ x: 1, y: 2 }, { x: 2, y: 2 }] });
      render(); ser(S.conex.length, 1, 'ni el cable de energía ni la pared llevan conexión'); afirmar(c0 > 0);
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
      sel = L.id; borrar(); ser(S.conex, undefined, 'la conexión se borra con su cable'); ser(TR.con.puertosDe(byId(r.id)).length, 3);
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
      ser(document.querySelectorAll('#dlg-if .di-r').length, 3, 'filas'); ser(fila('g0:1').querySelector('select').selectedOptions[0].textContent, 'Cable a Switch1 · GigabitEthernet 1', 'cable del puerto');
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
})();
