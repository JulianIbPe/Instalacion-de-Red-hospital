// ===== pruebas-f9.js: pruebas de la Fase 9 (9A: longitud de los cables; 9B: presupuesto y CSV) =====
// Se carga después de pruebas-ajustes.js (solo con ?pruebas=1) y agrega sus casos a los de TRP usando sus utilidades (TRP.util).
(() => {
  const { prueba, afirmar, ser, igual, item, fVacio, conProyecto, conR } = TRP.util;
  const P = { pl: 'p1', cp: 'c1' };
  const cable = (id, n, pts, o = {}) => ({ id, k: 'line', n, c: '#2e86de', w: .06, d: '', label: '', ...P, pts, ...o });
  const cerca = (a, b, m) => afirmar(a != null && Math.abs(a - b) < 1e-9, `${m}: se esperaba ${b} y dio ${a}`);
  const dosPlantas = (alto, objs) => ({ ...fVacio().estado, plantas: [{ id: 'p1', nombre: 'Planta 1', ca: 'c1', capas: [{ id: 'c1', nombre: 'Base', visible: true, bloqueada: false }], ...(alto ? { alto } : {}) }, { id: 'p2', nombre: 'Planta 2', ca: 'c2', capas: [{ id: 'c2', nombre: 'Base', visible: true, bloqueada: false }] }], pn: 2, cn: 2, objs });

  prueba('Fase 9A: la longitud de un cable es la suma de sus tramos; la de instalación suma la holgura (10 %); el inalámbrico no se mide; se ve en el inspector y en el menú', () => {
    conProyecto({ ...fVacio().estado, objs: [cable(1, 'UTP Cat6', [{ x: 0, y: 0 }, { x: 4, y: 0 }]), cable(2, 'UTP Cat6', [{ x: 0, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 5 }]), cable(3, 'Inalámbrico', [{ x: 0, y: 2 }, { x: 5, y: 2 }]), cable(4, 'Cable de energía', [{ x: 0, y: 3 }, { x: 2, y: 3 }])] }, () => {
      cerca(TR.cab.medida(byId(1)), 4, 'recta'); cerca(TR.cab.medida(byId(2)), 7, 'en L'); cerca(TR.cab.instalacion(7), 7.7, 'instalación con 10 %');
      ser(TR.cab.medida(byId(3)), null, 'inalámbrico'); cerca(TR.cab.medida(byId(4)), 2, 'energía');
      sel = 2; multi = []; render(); const o = $('#insp-cuerpo output[data-campo="largo"]');
      afirmar(o && o.value == '7.00 m (instalación 7.70 m)', 'inspector: ' + (o && o.value));
      const it = TR.acc.paraMenu([byId(2)]).flatMap(g => g.items).find(i => i.id == 'cab-largo');
      afirmar(it && it.texto == 'Longitud: 7.00 m (instalación 7.70 m)' && !it.habil, 'menú: ' + (it && it.texto));
      sel = 3; render(); afirmar(!$('#insp-cuerpo output[data-campo="largo"]'), 'el inalámbrico no muestra longitud'); sel = null;
    });
  });

  prueba('Fase 9A: un cable que cruza a otra planta suma el alto de la de abajo (3 m si no tiene); el alto se guarda y se abre con el archivo', () => {
    const pts = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 0, pl: 'p2', cp: 'c2' }, { x: 2, y: 3, pl: 'p2', cp: 'c2' }];
    conProyecto(dosPlantas(0, [cable(1, 'UTP Cat6', pts)]), () => { cerca(TR.cab.medida(byId(1)), 8, 'alto por omisión'); });
    conProyecto(dosPlantas(3.5, [cable(1, 'UTP Cat6', pts)]), () => {
      cerca(TR.cab.medida(byId(1)), 8.5, 'planta de 3,5 m'); cerca(TR.cab.medida({ ...byId(1), pts: [...pts].reverse() }), 8.5, 'bajando mide lo mismo');
      const r = ESQ.serializar(S); afirmar(r.ok, 'serializar'); const l = ESQ.leer(r.texto); ser(l.ok && l.estado.plantas[0].alto, 3.5, 'ida y vuelta del alto');
      afirmar($('#plantas').textContent.includes('↕ 3.50 m'), 'el panel muestra el alto de la planta activa');
    });
  });

  prueba('Fase 9A: un patch cord no tiene medida; su largo estimado es la distancia entre las unidades de sus equipos + 0,5 m', () => {
    const pc = (id, u) => item(id, 'PC', '💻', 4, 4, { tipo: 'dispositivo', sub: 'pc', w: .4, h: .3, parent: 1, ru: { u, h: 1 } });
    conProyecto({ ...fVacio().estado, objs: [item(1, 'Rack', '🗄️', 4, 4, { tipo: 'rack', w: .8, h: 1, us: 4 }), pc(2, 1), pc(3, 3)] }, () => {
      const c = { id: 9, a: { d: 2, p: 'x' }, b: { d: 3, p: 'y' }, rutas: [] };
      cerca(TR.cab.estimada(c), 2 * .04445 + .5, 'dos unidades de distancia'); ser(TR.cab.estimada({ ...c, rutas: [5] }), null, 'un cable con ruta no se estima');
    });
  });

  // ---------- F9B ----------
  const dispo = (id, x, o = {}) => item(id, 'Equipo', '💻', x, 1, { tipo: 'dispositivo', sub: 'pc', w: .4, h: .3, ...o });
  const conPres = fn => conR(() => {
    R.modelos = { m1: { nombre: 'Switch A', cat: 'switches', precio: 50, moneda: 'USD' }, m2: { nombre: 'Rack', cat: 'otros' }, m3: { nombre: 'AP', cat: 'inalambricos', precio: 10, moneda: 'EUR' } };
    return conProyecto({ ...fVacio().estado, objs: [item(1, 'Rack', '🗄️', 4, 4, { tipo: 'rack', w: .8, h: 1, us: 4, modelo: 'm2' }), dispo(2, 4, { modelo: 'm1', parent: 1, ru: { u: 1, h: 1 } }), dispo(3, 8, { modelo: 'm1' }), dispo(4, 10, { modelo: 'm3' }), dispo(5, 12), cable(6, 'UTP Cat6', [{ x: 0, y: 6 }, { x: 10, y: 6 }])] }, fn);
  });

  prueba('Fase 9B: presupuesto: un equipo montado en un rack se cuenta una vez; sin precio = pendiente (no suma); un total por moneda; los cables suman según la casilla', () => {
    conPres(() => {
      let r = TR.pres.calcular(); const sw = r.equipos.find(g => g.id == 'm1');
      ser(sw.cant, 2, 'el switch montado y el suelto'); ser(sw.sub_t, 100, 'subtotal del modelo'); ser(r.equipos.find(g => g.id == 'm2').sub_t, null, 'el rack sin precio queda pendiente');
      ser(r.equipos.find(g => !g.id).nombre, 'Equipo', 'el equipo sin modelo se agrupa por nombre'); ser(r.pend, 3, 'pendientes: rack, sin modelo y cable sin precio');
      igual([...r.general].sort(), [['EUR', 10], ['USD', 100]], 'USD y EUR no se suman'); igual([...r.cats.get('Switches')], [['USD', 100]], 'subtotal de la categoría');
      const h0 = hist.length; afirmar(TR.pres.fijarCable('utp6', 'precio', '2') && TR.pres.fijarCable('utp6', 'moneda', 'USD'), 'precio del cable'); ser(hist.length, h0 + 2, 'un paso por cambio');
      r = TR.pres.calcular(); cerca(r.cables[0].sub_t, 22, '10 m + 10 % a 2 USD'); cerca(r.general.get('USD'), 122, 'con cables');
      TR.pres.fijarConCables(false); ser(TR.pres.calcular().general.get('USD'), 100, 'sin cables'); deshacer(); cerca(TR.pres.calcular().general.get('USD'), 122, 'deshacer');
      ser(TR.pres.fijarCable('utp6', 'precio', '-1'), false, 'precio negativo rechazado'); ser(TR.pres.fijarHolgura(150), false, 'holgura fuera de rango');
      TR.pres.fijarHolgura(20); cerca(TR.cab.instalacion(10), 12, 'la holgura cambia la instalación'); cerca(TR.pres.calcular().cables[0].sub_t, 24, 'y el costo');
      TR.pres.abrir(); const t = $('#dlg-pres').textContent; TR.pres.cerrar(); afirmar(t.includes('Total general') && t.includes('pendiente de cotización') && t.includes('Switches'), 'el diálogo muestra totales, pendientes y categorías');
    });
  });

  prueba('Fase 9B: CSV con BOM, «;» y coma decimal; el presupuesto va y vuelve con el archivo (R9) y un valor dañado se omite', () => {
    conPres(() => {
      TR.pres.fijarCable('utp6', 'precio', '2.5'); TR.pres.fijarCable('utp6', 'moneda', 'USD'); TR.pres.fijarHolgura(15);
      const c = TR.pres.csv(), l = c.slice(1).split('\r\n');
      ser(c[0], '\ufeff', 'BOM'); ser(l[0], 'Sección;Categoría;Concepto;Cantidad;Unidad;Precio unitario;Moneda;Subtotal;Estado', 'encabezado');
      afirmar(l.includes('Cables;;UTP Cat6: 1 cable(s), medida 10,00 m;11,50;m;2,50;USD;28,75;'), 'renglón del cable: ' + l[1]);
      afirmar(l.includes('Equipos;Switches;Switch A;2;u;50,00;USD;100,00;') && l.some(x => x.startsWith('Equipos;Otros;Rack;1;u;;;;pendiente de cotización')), 'renglones de equipos');
      afirmar(l.includes('Total;;Total general;;;;USD;128,75;') && l.includes('Total;;Total general;;;;EUR;10,00;'), 'totales por moneda');
      const r = ESQ.serializar(S); afirmar(r.ok, 'serializar'); igual(ESQ.leer(r.texto).estado.presupuesto, S.presupuesto, 'ida y vuelta');
      const d = JSON.parse(r.texto); d.estado.presupuesto = { holgura: 'x', cables: { utp6: { precio: 3, moneda: 'dolar' }, nada: { precio: 1 } } };
      const l2 = ESQ.leer(JSON.stringify(d)); afirmar(l2.ok, 'abre igual'); igual(l2.estado.presupuesto, { cables: { utp6: { precio: 3 } } }, 'se omite lo dañado');
    });
  });

  prueba('Fase 9B (revisión thermo): el CSV no deja fórmulas; un tipo de cable desconocido no lleva precio; equipos sin nombre no rompen; un precio dañado avisa al abrir; copiar planta conserva el alto', () => {
    conR(() => conProyecto(dosPlantas(4.5, [dispo(1, 2, { n: '=CMD()' }), dispo(2, 4, { n: undefined }), dispo(3, 6, { n: undefined }), cable(4, 'Cable raro', [{ x: 0, y: 5 }, { x: 2, y: 5 }], { tipo: 'cable', sub: 'otro' })]), () => {
      const r = TR.pres.calcular(); ser(r.equipos.filter(g => g.nombre == 'Sin nombre').length, 1, 'equipos sin nombre agrupados');
      afirmar(TR.pres.csv().includes(";'=CMD();"), 'el nombre que empieza con = va con apóstrofo');
      const h0 = hist.length; ser(TR.pres.fijarCable('otro', 'precio', '1'), false, 'sin precio para un tipo desconocido'); ser(hist.length, h0, 'sin historial');
      TR.pres.abrir(); const t = $('#dlg-pres').textContent; TR.pres.cerrar(); afirmar(t.includes('tipo desconocido'), 'el diálogo lo dice');
      const d = JSON.parse(ESQ.serializar(S).texto); d.estado.presupuesto = { cables: { utp6: { precio: -5, moneda: 'dolar' } } };
      afirmar(ESQ.leer(JSON.stringify(d)).avisos.some(a => a.startsWith('valores')), 'aviso por el precio o la moneda dañados');
      copiarPlanta(S.plantas[0]); ser(S.plantas[S.plantas.length - 1].alto, 4.5, 'la copia conserva el alto');
    }));
  });
})();
