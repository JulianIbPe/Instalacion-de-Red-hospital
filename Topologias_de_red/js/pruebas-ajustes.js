// ===== pruebas-ajustes.js: pruebas de los ajustes de dibujo posteriores a la F8 (lote A: medidas, grilla, reglas y flechas; lote B: Mayús y formas huecas; lote C: formas como macro; lote D: copiar plantas y capas) =====
// Se carga después de pruebas-f8.js (solo con ?pruebas=1) y agrega sus casos a los de TRP usando sus utilidades (TRP.util).
(() => {
  const { prueba, afirmar, ser, igual, item, fVacio, conProyecto, ptr, sinCaptura, pant, enObj } = TRP.util;
  const pared = (id, pts) => ({ id, k: 'line', n: 'Pared', tipo: 'pared', c: '#444444', w: .2, d: '', label: '', pl: 'p1', cp: 'c1', pts });
  const con = (objs, fn) => conProyecto({ ...fVacio().estado, objs }, () => { const v = { ...V }, p = pasoFijo, r = rejilla; try { return fn(); } finally { Object.assign(V, v); pasoFijo = p; rejilla = r; tool = null; tmp = null; } });
  const tecla = (key, o = {}) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...o }));
  const ayudas = () => $('#g-tmp').innerHTML;

  prueba('Ajustes A: el paso de la grilla se elige (3,25 m entra con 25 cm y con 1 cm); en Auto lo decide el zoom; sin grilla el ajuste es de 1 cm', () => {
    con([], () => {
      V.z = 50; rejilla = true; pasoFijo = 0; ser(sn(3.25), 3.5, 'Auto a 50 px/m ajusta a 0,5 m');
      pasoFijo = .25; ser(sn(3.25), 3.25, 'paso de 25 cm'); ser(pasoGrilla(), .25, 'la grilla de 25 cm se dibuja (12 px)');
      pasoFijo = .01; ser(sn(3.257), 3.26, 'paso de 1 cm'); ser(pasoGrilla(), .5, 'la de 1 cm no se ve a 50 px/m: se dibuja la automática');
      V.z = 3000; ser(pasoGrilla(), .01, 'con zoom alcanza a verse la de 1 cm');
      rejilla = false; pasoFijo = 0; ser(sn(3.257), 3.26, 'sin grilla: 1 cm');
    });
  });

  prueba('Ajustes A: las flechas mueven lo seleccionado 1 cm (un paso de historial por pulsación, aunque la grilla sea más gruesa); con herramienta activa no actúan', () => {
    con([item(1, 'PC', '💻', 4, 4, { tipo: 'dispositivo', sub: 'pc', w: .4, h: .3 }), pared(2, [{ x: 1, y: 1 }, { x: 3, y: 1 }])], () => {
      sel = 1; multi = []; const h0 = hist.length; tecla('ArrowRight'); tecla('ArrowDown'); igual([byId(1).x, byId(1).y], [4.01, 4.01], 'equipo'); ser(hist.length, h0 + 2, 'pasos');
      tecla('ArrowLeft'); tecla('ArrowUp'); igual([byId(1).x, byId(1).y], [4, 4], 'vuelta');
      sel = 2; tecla('ArrowUp'); afirmar(Math.abs(byId(2).pts[0].y - .99) < 1e-9 && Math.abs(byId(2).pts[1].y - .99) < 1e-9, 'la pared se mueve entera');
      sel = 1; tool = { k: 'texto' }; const h1 = hist.length; tecla('ArrowRight'); tool = null; ser(byId(1).x, 4, 'con herramienta'); ser(hist.length, h1, 'sin paso');
      sel = null; tecla('ArrowRight'); ser(hist.length, h1, 'sin selección no guarda nada');
    });
  });

  prueba('Ajustes A: una línea seleccionada muestra la medida de cada tramo, con ↔ / ↕ si está recta y el ángulo si no; va en #g-tmp (no cambia #c) y su tamaño sigue al zoom', () => {
    con([pared(1, [{ x: 1, y: 1 }, { x: 4.25, y: 1 }, { x: 4.25, y: 3 }, { x: 6.25, y: 5 }])], () => {
      V.z = 50; sel = null; multi = []; render(); const c0 = $('#c').innerHTML; ser(ayudas().includes(' m'), false, 'sin selección no hay medidas');
      sel = 1; render(); const h = ayudas();
      afirmar(h.includes('↔ 3.25 m'), 'tramo horizontal'); afirmar(h.includes('↕ 2.00 m'), 'tramo vertical'); afirmar(h.includes('2.83 m · 45°'), 'tramo inclinado con su ángulo'); afirmar(h.includes('#1e8e3e'), 'la recta va en verde');
      sel = null; render(); ser($('#c').innerHTML, c0, '#c igual que antes de seleccionar');
      sel = 1; render(); const r = svg.getBoundingClientRect();
      sinCaptura(() => svg.dispatchEvent(new WheelEvent('wheel', { clientX: r.left + 100, clientY: r.top + 100, deltaY: -100, bubbles: true, cancelable: true })));
      afirmar(ayudas().includes(`scale(${50 / V.z})`), 'al hacer zoom la medida cambia de escala sin redibujar los objetos');
    });
  });

  prueba('Ajustes A: al dibujar una línea (pared o cable) la medida del tramo aparece también junto al cursor', () => {
    con([], () => {
      V.z = 50; rejilla = true; pasoFijo = .25; tool = { k: 'line', n: 'Pared', tipo: 'pared', w: .2, d: '' }; lastDown.t = 0;
      const a = pant(2, 2), b = pant(5.25, 2);
      sinCaptura(() => { ptr(svg, 'pointerdown', a.x, a.y); ptr(svg, 'pointerup', a.x, a.y); ptr(svg, 'pointermove', b.x, b.y); });
      ser((ayudas().match(/↔ 3\.25 m/g) || []).length, 2, 'la medida va en la cota del tramo y junto al cursor');
      afirmar(ayudas().includes(`translate(5.25 2) scale(1)`), 'la del cursor está en el cursor');
      tool = null; tmp = null; render();
    });
  });

  prueba('Ajustes A: las reglas marcan las mismas líneas que la grilla', () => {
    con([], () => {
      for (const z of [8, 30, 50, 100, 250, 3000]) { V.z = z; pasoFijo = 0; const sub = pasoGrilla(), n = [2, 5, 10].find(v => v * sub * z >= 50) || 10; afirmar(sub * z >= 8, 'marcas demasiado juntas a ' + z); afirmar(n * sub * z >= 50, 'números encimados a ' + z); }
      const r = svg.getBoundingClientRect(), rt = $('#rt').getBoundingClientRect(), rl = $('#rl').getBoundingClientRect();
      ser(Math.round(rt.left), Math.round(r.left), 'la regla de arriba empieza donde empieza el dibujo'); ser(Math.round(rl.top), Math.round(r.top), 'la regla izquierda empieza donde empieza el dibujo');
      rulers(); afirmar(Math.abs(rt.width - $('#rt').width) < 1, 'la regla de arriba está estirada: ' + rt.width + ' px para ' + $('#rt').width); afirmar(Math.abs(rl.height - $('#rl').height) < 1, 'la regla izquierda está estirada: ' + rl.height + ' px para ' + $('#rl').height);
    });
  });

  // ---------- Lote B: capas bloqueadas seleccionables y Mayús ----------
  const pc = (id, x, y, o = {}) => item(id, 'PC', '💻', x, y, { tipo: 'dispositivo', sub: 'pc', w: .4, h: .3, ...o });
  const clicEn = (id, o = {}) => sinCaptura(() => { const el = enObj(id), b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2; lastDown.t = 0; ptr(el, 'pointerdown', x, y, o); ptr(svg, 'pointerup', x, y, o); });

  prueba('Ajustes B: una forma sin relleno (también el círculo) no se selecciona con un clic adentro, solo por su borde; con relleno sí; lo de una capa bloqueada sigue sin poder seleccionarse', () => {
    const forma = (id, sub, x, f) => ({ id, k: 'shape', n: 'F', tipo: 'forma', sub, x, y: 4, w: 2, h: 2, c: '#444444', f, ls: 'con', label: '', pl: 'p1', cp: 'c1' });
    con([forma(1, 'rectangulo', 2, 'non'), forma(2, 'circulo', 5, 'non'), forma(3, 'rectangulo', 8, 'sol')], () => {
      V.z = 40; V.ox = 40; V.oy = 40; sel = null; multi = []; render();
      const bajo = (x, y) => { const p = pant(x, y), t = document.elementFromPoint(p.x, p.y), g = t && t.closest('[data-id]'); return g ? +g.dataset.id : null; };
      ser(bajo(2, 4), null, 'adentro del rectángulo hueco'); ser(bajo(1, 4), 1, 'borde del rectángulo hueco'); ser(bajo(1.1, 4), 1, 'la franja de clic es más ancha que el trazo');
      ser(bajo(5, 4), null, 'adentro del círculo hueco'); ser(bajo(4, 4), 2, 'borde del círculo'); ser(bajo(8, 4), 3, 'adentro de una forma con relleno');
      S.plantas[0].capas[0].bloqueada = true; render(); ser(bajo(1, 4), null, 'capa bloqueada: nada recibe clics'); ser(bajo(8, 4), null, 'ni lo relleno');
    });
  });

  prueba('Ajustes B: Mayús deja recto (horizontal, vertical o 45°) el tramo que se dibuja y la punta que se estira; Mayús sobre un asa no abre el rectángulo de selección', () => {
    igual(orto({ x: 1, y: 1 }, { x: 4, y: 1.5 }), { x: 4, y: 1 }, 'horizontal'); igual(orto({ x: 1, y: 1 }, { x: 1.3, y: -2 }), { x: 1, y: -2 }, 'vertical');
    con([pared(1, [{ x: 1, y: 1 }, { x: 3, y: 1.5 }])], () => {
      V.z = 50; rejilla = true; pasoFijo = .25; const d = orto({ x: 0, y: 0 }, { x: 2, y: -1.5 }); igual([d.x, d.y], [1.75, -1.75], 'diagonal de 45° ajustada a la grilla');
      tool = { k: 'line', n: 'Pared', tipo: 'pared', w: .2, d: '' }; const a = pant(2, 3), b = pant(5, 3.5), S1 = { shiftKey: true };
      sinCaptura(() => { lastDown.t = 0; ptr(svg, 'pointerdown', a.x, a.y); ptr(svg, 'pointerup', a.x, a.y); ptr(svg, 'pointermove', b.x, b.y, S1); });
      igual([tmp.cur.x, tmp.cur.y], [5, 3], 'vista previa recta'); afirmar($('#g-tmp').innerHTML.includes('↔ 3.00 m'), 'y lo indica');
      sinCaptura(() => { lastDown.t = 0; ptr(svg, 'pointerdown', b.x, b.y, S1); ptr(svg, 'pointerup', b.x, b.y, S1); }); igual([tmp.pts[1].x, tmp.pts[1].y], [5, 3], 'el punto queda recto'); tmp = null; tool = null;
      sel = 1; multi = []; render(); const h = document.querySelector('#c [data-h="1"]'), hb = h.getBoundingClientRect(), c = pant(3.5, 1.25);
      sinCaptura(() => { lastDown.t = 0; ptr(h, 'pointerdown', hb.left + hb.width / 2, hb.top + hb.height / 2, S1); ser(drag && drag.m, 'h', 'Mayús sobre el asa estira, no selecciona'); ptr(svg, 'pointermove', c.x, c.y, S1); ptr(svg, 'pointerup', c.x, c.y, S1); });
      igual([byId(1).pts[1].x, byId(1).pts[1].y], [3.5, 1], 'la punta estirada queda a la altura de su vecina');
    });
  });

  prueba('Ajustes B: Mayús al colocar una forma la deja con el mismo ancho y alto, y al estirar una esquina conserva la proporción', () => {
    con([{ id: 1, k: 'shape', n: 'Rectángulo', tipo: 'forma', sub: 'rectangulo', x: 4, y: 4, w: 2, h: 1, c: '#444444', f: 'non', ls: 'con', label: '', pl: 'p1', cp: 'c1' }], () => {
      const t = { k: 'shape', sub: 'rectangulo', tipo: 'forma', pa: { x: 1, y: 1 } }; ajustarColocacion(t, { x: 4, y: 2 }, true); igual([t.w, t.h, t.x, t.y], [3, 3, 2.5, 2.5], 'cuadrado');
      ajustarColocacion(t, { x: 4, y: 2 }); igual([t.w, t.h], [3, 1], 'sin Mayús, libre');
      V.z = 50; rejilla = true; pasoFijo = .25; sel = 1; multi = []; render(); const h = document.querySelector('#c [data-h="se"]'), hb = h.getBoundingClientRect(), c = pant(7, 5.25), S1 = { shiftKey: true };
      sinCaptura(() => { lastDown.t = 0; ptr(h, 'pointerdown', hb.left + hb.width / 2, hb.top + hb.height / 2, S1); ptr(svg, 'pointermove', c.x, c.y, S1); ptr(svg, 'pointerup', c.x, c.y, S1); });
      const o = byId(1); afirmar(o.w > 2 && Math.abs(o.w / o.h - 2) < .01, 'proporción 2:1 conservada: ' + o.w + ' × ' + o.h);
    });
  });

  // ---------- Lote C: las formas son un macro que tira un tramo por lado ----------
  const forma = sub => CAT.Formas.find(d => d.sub == sub);
  const dosClics = (x0, y0, x1, y1) => sinCaptura(() => { for (const [x, y] of [[x0, y0], [x1, y1]]) { const p = pant(x, y); lastDown.t = 0; ptr(svg, 'pointerdown', p.x, p.y); ptr(svg, 'pointerup', p.x, p.y); } });
  const conForma = fn => con([], () => { const l0 = $('#lstyle').value, c0 = $('#col').value; try { V.z = 50; V.ox = 40; V.oy = 40; rejilla = true; pasoFijo = .25; return fn(); } finally { $('#lstyle').value = l0; $('#col').value = c0; tool = null; menu(); } });

  prueba('Ajustes C: con «Gruesa (como pared)» una forma crea una pared por lado, unidas por las puntas, en un solo paso; no queda ningún objeto «forma»', () => {
    conForma(() => {
      $('#lstyle').value = 'par'; $('#col').value = '#444444'; tool = forma('rectangulo'); const h0 = hist.length; dosClics(2, 2, 5, 4);
      ser(S.objs.length, 4, 'cuatro lados'); afirmar(S.objs.every(o => o.k == 'line' && esPared(o) && o.w == .2 && o.pts.length == 2 && o.pl == 'p1' && o.cp == 'c1'), 'son paredes de dos puntos en la capa activa'); ser(hist.length, h0 + 1, 'un solo paso'); ser(tmp, null, 'sin vista previa');
      const P = S.objs.map(o => o.pts.map(q => pt(q)).map(q => [q.x, q.y])); igual(P, [[[2, 2], [5, 2]], [[5, 2], [5, 4]], [[5, 4], [2, 4]], [[2, 4], [2, 2]]], 'recorrido del rectángulo');
      S.objs[0].pts[1].x = 6; ser(pt(S.objs[1].pts[0]).x, 6, 'el lado siguiente sigue a la punta del anterior'); S.objs[0].pts[0].y = 1; ser(pt(S.objs[3].pts[1]).y, 1, 'el último lado cierra en el inicio del primero');
      sel = S.objs[1].id; multi = []; render(); tool = null; borrar(); ser(S.objs.length, 3, 'cada lado se borra solo'); afirmar(S.objs.every(o => o.pts.every(q => !q.rl || byId(q.rl))), 'sin uniones colgantes');
      deshacer(); deshacer(); ser(S.objs.length, 0, 'deshacer quita la forma entera');
    });
  });

  prueba('Ajustes C: con otro tipo de «Línea» los lados son líneas sueltas (ni pared ni cable: sin conexiones, con color libre) que se guardan y se abren; el círculo sigue siendo un objeto, sin relleno', () => {
    conForma(() => {
      $('#lstyle').value = 'dis'; $('#col').value = '#c0392b'; tool = forma('triangulo'); dosClics(2, 2, 5, 4); render();
      ser(S.objs.length, 3, 'tres lados'); afirmar(S.objs.every(o => o.k == 'line' && tipoDe(o) == 'linea' && o.sub == 'dis' && o.c == '#c0392b' && o.w == .06 && o.d == '.3 .15' && !esPared(o) && !esCable(o)), 'líneas discontinuas del color elegido'); ser((S.conex || []).length, 0, 'no llevan conexión');
      ser(TR.acc.fijar([S.objs[0].id], 'c', '#00ff00').ok, true, 'su color se puede cambiar');
      const g = ESQ.serializar(S, R); afirmar(g.ok, 'no se pudo guardar: ' + g.error); const r = ESQ.leer(g.texto); afirmar(r.ok && !r.avisos.length, 'no reabre limpio: ' + (r.avisos || r.errores || []).join(' | ')); const o2 = r.estado.objs[1]; igual([o2.tipo, o2.sub, o2.d], ['linea', 'dis', '.3 .15'], 'ida y vuelta de archivo');
      tool = forma('circulo'); dosClics(8, 6, 9, 6); const c = S.objs[3]; igual([c.k, c.f, c.w, c.h, c.ls], ['shape', 'non', 2, 2, 'dis'], 'el círculo es un objeto sin relleno con su tipo de línea');
    });
  });

  prueba('Ajustes C: Color, Relleno y Línea del menú solo aparecen cuando sirven (según la herramienta o lo seleccionado)', () => {
    const ve = () => ['col', 'fill', 'lstyle'].map(k => !$('#' + k).closest('label').hidden && getComputedStyle($('#' + k).closest('label')).display != 'none');
    con([pc(1, 4, 4), pared(2, [{ x: 1, y: 1 }, { x: 3, y: 1 }]), { id: 3, k: 'shape', n: 'Círculo', tipo: 'forma', sub: 'circulo', x: 8, y: 4, w: 2, h: 2, c: '#444444', f: 'non', ls: 'con', label: '', pl: 'p1', cp: 'c1' },
      { id: 4, k: 'line', n: 'UTP Cat6', c: '#2e86de', w: .06, d: '', label: '', pl: 'p1', cp: 'c1', pts: [{ x: 1, y: 6 }, { x: 3, y: 6 }] }], () => {
      const con1 = (t, s) => { tool = t; sel = s; multi = []; render(); return ve(); };
      igual(con1(null, null), [false, false, false], 'sin selección'); igual(con1(null, 1), [false, false, false], 'equipo'); igual(con1(null, 2), [true, false, false], 'pared: solo color');
      igual(con1(null, 4), [false, false, false], 'cable: nada (D16)'); igual(con1(null, 3), [true, true, true], 'círculo: todo');
      igual(con1(forma('rectangulo'), null), [true, false, true], 'herramienta forma: color y línea'); igual(con1(CAT.Edificio.find(d => d.n == 'Pared'), null), [true, false, false], 'herramienta pared');
      igual(con1(CAT.Cables[0], null), [false, false, false], 'herramienta cable'); igual(con1(CAT.Marcar[0], null), [true, true, true], 'herramienta zona'); igual(con1(CAT.Edificio.find(d => d.n == 'Escalera'), null), [true, false, false], 'herramienta escalera');
      tool = null; sel = null; render();
    });
  });

  // ---------- Lote D: copiar plantas y capas ----------
  const esc_ = (id, x, t) => item(id, 'Escalera', '🪜', x, 8, { tipo: 'escalera', w: 1.6, h: 2.8, c: '#444444', ...(t ? { t } : {}) });
  const cableRef = (id, a, b) => ({ id, k: 'line', n: 'UTP Cat6', c: '#2e86de', w: .06, d: '', label: '', pl: 'p1', cp: 'c1', pts: [{ x: 4, y: 4, ref: a }, { x: 8, y: 4, ref: b }] });
  const boton = a => { const b = document.querySelector(`#plantas [data-a="${a}"]`); afirmar(b, 'falta el botón ' + a); b.click(); };

  prueba('Ajustes D: copiar una capa crea otra encima con copias de sus objetos (unidas entre sí), en un paso; no copia escaleras ni mesas', () => {
    con([pc(1, 4, 4), pc(2, 8, 4), cableRef(3, 1, 2), pared(4, [{ x: 1, y: 1 }, { x: 3, y: 1 }]), esc_(5, 12), item(6, 'Mesa', '🪑', 4, 10, { tipo: 'mesa', w: 1.2, h: .7, puestos: 2 }), pc(7, 4, 10, { parent: 6, puesto: 0, lrot: 0 })], () => {
      render(); panel(); const h0 = hist.length; boton('cpc'); const p = plantaActual(), nueva = p.capas[1];
      igual(p.capas.map(c => c.nombre), ['Base', 'Base (copia)'], 'capas'); ser(S.capaAct, nueva.id, 'la copia queda activa'); ser(hist.length, h0 + 1, 'un paso');
      const cs = S.objs.filter(o => o.cp == nueva.id); igual(cs.map(o => tipoDe(o)).sort(), ['cable', 'dispositivo', 'dispositivo', 'pared'], 'se copian equipos, cable y pared; no la escalera ni la mesa con su equipo');
      const cab = cs.find(esCable), eq = cs.filter(o => o.k == 'item').map(o => o.id); afirmar(eq.includes(cab.pts[0].ref) && eq.includes(cab.pts[1].ref), 'el cable copiado va unido a los equipos copiados'); ser(new Set(S.objs.map(o => o.id)).size, S.objs.length, 'ids únicos');
      ser(S.conex.length, 2, 'cada cable con su conexión'); ser(S.objs.filter(o => o.cp == 'c1').length, 7, 'la capa original no cambia');
      deshacer(); ser(S.objs.length, 7, 'deshacer'); ser(plantaActual().capas.length, 1, 'deshacer quita la capa'); panel();
    });
  });

  prueba('Ajustes D: copiar una planta crea otra arriba con sus capas y objetos; una escalera recta no se copia (chocaría con la de abajo) y una con descanso alineada sí', () => {
    con([pc(1, 4, 4), pc(2, 8, 4), cableRef(3, 1, 2), esc_(5, 12)], () => {
      S.plantas[0].capas.push({ id: 'c2', nombre: 'Red', visible: true, bloqueada: false }); S.cn = 2; byId(3).cp = 'c2'; render(); panel(); const h0 = hist.length; boton('cpp');
      ser(S.plantas.length, 2, 'plantas'); const q = S.plantas[1]; ser(q.nombre, 'Planta 1 (copia)', 'nombre'); ser(S.plantaAct, q.id, 'queda activa'); igual(q.capas.map(c => c.nombre), ['Base', 'Red'], 'capas copiadas'); ser(hist.length, h0 + 1, 'un paso');
      const cs = S.objs.filter(o => o.pl == q.id); igual(cs.map(o => tipoDe(o)).sort(), ['cable', 'dispositivo', 'dispositivo'], 'sin la escalera recta'); ser(cs.find(esCable).cp, q.capas[1].id, 'cada objeto en la copia de su capa');
      afirmar(cs.find(esCable).pts.every(v => cs.some(o => o.id == v.ref)), 'cable unido a los equipos de la planta nueva'); ser(S.objs.filter(o => o.pl == 'p1').length, 4, 'la planta original no cambia');
      deshacer(); ser(S.plantas.length, 1, 'deshacer'); ser(S.objs.length, 4, 'deshacer quita las copias');
      byId(5).t = 'descanso'; S.plantaAct = 'p1'; S.capaAct = 'c1'; render(); panel(); boton('cpp'); ser(S.objs.filter(o => o.pl == S.plantaAct && esEscalera(o)).length, 1, 'la escalera con descanso alineada se copia');
      deshacer(); panel();
    });
  });

  prueba('Ajustes A: al estirar una punta o un vértice de una pared, las medidas de sus tramos aparecen también junto al cursor', () => {
    con([pared(1, [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 3 }])], () => {
      V.z = 50; rejilla = true; pasoFijo = .25; sel = 1; multi = []; render(); const h = document.querySelector('#c [data-h="1"]'), hb = h.getBoundingClientRect(), c = pant(4, 1);
      sinCaptura(() => { lastDown.t = 0; ptr(h, 'pointerdown', hb.left + hb.width / 2, hb.top + hb.height / 2); ptr(svg, 'pointermove', c.x, c.y);
        const g = $('#g-tmp').innerHTML; afirmar(g.includes('translate(4 1) scale(1)'), 'falta el grupo junto al cursor'); ser((g.match(/↔ 3\.00 m/g) || []).length, 2, 'el tramo horizontal: en la cota y junto al cursor'); afirmar((g.match(/2\.24 m · 63\.4°/g) || []).length == 2, 'el tramo vecino también');
        ptr(svg, 'pointerup', c.x, c.y); });
      afirmar(!$('#g-tmp').innerHTML.includes('translate(4 1) scale(1)'), 'al soltar ya no está junto al cursor');
    });
  });
  prueba('Empalme: un cable de energía sobre el tramo o un vértice de otro se une a él (vértice nuevo, mismo paso de historial); los índices de otras uniones se corren; un UTP no empalma', () => {
    const { clic } = TRP.util, E = CAT['Eléctrico'].find(c => c.n == 'Cable de energía'), U = CAT.Cables.find(c => c.n == 'UTP Cat6');
    con([], () => {
      V.z = 60; V.ox = 40; V.oy = 40; rejilla = false; render();
      setTool(E); clic(1, 2); clic(8, 2); finishLine(); clic(8, 6); clic(8.03, 2.02); finishLine();   // B termina en la punta de A (índice 1)
      const [A, B] = S.objs; igual([B.pts[1].rl, B.pts[1].ri], [A.id, 1], 'unido a la punta');
      const h0 = hist.length; clic(4.5, 5); clic(4.52, 2.05); finishLine(); const C = S.objs[2];
      ser(A.pts.length, 3, 'A tiene un vértice nuevo'); igual([C.pts[1].rl, C.pts[1].ri, A.pts[1].x, A.pts[1].y], [A.id, 1, 4.52, 2], 'C unido al vértice nuevo');
      ser(B.pts[1].ri, 2, 'la unión de B se corrió y sigue en la punta'); ser(hist.length, h0 + 1, 'un solo paso'); afirmar(!C.pts.some(q => 'emp' in q), 'sin campos transitorios');
      A.pts[1].x = 5; ser(pt(C.pts[1]).x, 5, 'el empalme sigue al vértice');
      deshacer(); ser(S.objs.length, 2); ser(byId(A.id).pts.length, 2, 'deshacer quita el cable y el vértice'); ser(byId(B.id).pts[1].ri, 1);
      setTool(U); clic(3, 5); clic(3, 2.03); finishLine(); setTool(null); const D = S.objs[2]; afirmar(!D.pts[1].rl, 'un UTP no se empalma a un cable de energía'); ser(byId(A.id).pts.length, 2);
    });
  });
  prueba('Canalización metálica: tipo propio (ni pared ni cable, sin conexión), se dibuja debajo de los cables y un cable se pega a su eje sin quedar unido', () => {
    const { clic } = TRP.util, K = CAT.Edificio.find(c => c.n == 'Canalización metálica'), U = CAT.Cables.find(c => c.n == 'UTP Cat6');
    con([], () => {
      V.z = 60; V.ox = 40; V.oy = 40; rejilla = false; render();
      setTool(K); clic(1, 2); clic(8, 2); finishLine(); setTool(U); clic(3, 5); clic(3.04, 2.12); clic(6, 2.1); finishLine(); setTool(null);
      const [C, A] = S.objs; igual([tipoDe(C), esCable(C), esPared(C)], ['canal', false, false], 'tipo');
      igual(A.pts.slice(1).map(q => [q.x, q.y, q.rl]), [[3.04, 2, undefined], [6, 2, undefined]], 'el cable sigue el eje sin unirse');
      const g = [...$('#c').querySelectorAll('[data-id]')].map(e => +e.dataset.id); afirmar(g.indexOf(C.id) < g.indexOf(A.id), 'la canalización debe dibujarse debajo del cable');
      const h0 = hist.length; setTool(K); clic(4.5, 6); clic(4.52, 2.05); finishLine(); clic(8, 6); clic(8.03, 2.02); finishLine(); setTool(null); const [, , D, F] = S.objs;
      ser(C.pts.length, 3, 'la canalización tiene un vértice nuevo'); igual([D.pts[1].rl, D.pts[1].ri, C.pts[1].x, C.pts[1].y], [C.id, 1, 4.52, 2], 'empalme sobre el tramo');
      igual([F.pts[1].rl, F.pts[1].ri], [C.id, 2], 'unión al nodo de la punta'); ser(hist.length, h0 + 2, 'un paso por canalización');
    });
  });
  prueba('Botón «Nombres»: oculta y vuelve a mostrar el modelo y el nombre de los equipos (no los de otros objetos) sin tocar el proyecto', () => {
    con([{ id: 1, k: 'item', n: 'PC', ic: '💻', x: 3, y: 3, w: .4, h: .3, label: 'PC-Guardia', tipo: 'dispositivo', sub: 'pc' }, { id: 2, k: 'item', n: 'Ventana', ic: '🪟', x: 6, y: 3, w: 1.2, h: .4, label: 'V-Norte', tipo: 'ventana' }], () => {
      const txt = () => $('#c').textContent, h0 = hist.length;
      afirmar(txt().includes('PC-Guardia'), 'se ve el nombre'); $('#bnom').click();
      afirmar(!txt().includes('PC-Guardia'), 'el nombre debe ocultarse'); afirmar(txt().includes('V-Norte'), 'la etiqueta de la ventana no se oculta'); ser($('#bnom').getAttribute('aria-pressed'), 'false');
      $('#bnom').click(); afirmar(txt().includes('PC-Guardia'), 'vuelve a verse'); ser(hist.length, h0, 'no guarda historial'); ser(byId(1).label, 'PC-Guardia');
    });
  });
  prueba('Capa en el inspector: mueve lo seleccionado a otra capa visible y desbloqueada de la planta (un paso); la puerta va con su pared; los equipos de una mesa no lo ofrecen', () => {
    con([{ id: 1, k: 'line', n: 'Pared', c: '#444444', w: .2, d: '', label: '', pts: [{ x: 1, y: 1 }, { x: 6, y: 1 }], tipo: 'pared' }, { id: 2, k: 'puerta', n: 'Puerta', pared: 1, si: 0, s: 2, w: .9, lado: 1, hojas: 1, bis: 'izq' }, { id: 3, k: 'item', n: 'Mesa', ic: '🪑', x: 3, y: 4, w: 1.2, h: .7, puestos: 2, tipo: 'mesa' }, { id: 4, k: 'item', n: 'PC', ic: '💻', x: 3, y: 4, w: .4, h: .3, tipo: 'dispositivo', sub: 'pc', parent: 3, puesto: 0 }], () => {
      const P = plantaActual(), c1 = P.capas[0].id; P.capas.push({ id: 'c8', nombre: 'Datos', visible: true, bloqueada: false }, { id: 'c9', nombre: 'Bloqueada', visible: true, bloqueada: true }); render();
      sel = 1; multi = []; render(); const opc = [...document.querySelectorAll('[data-campo="cp"] option')].map(o => o.value); igual(opc.sort(), [c1, 'c8'].sort(), 'solo capas visibles y desbloqueadas');
      const h0 = hist.length; afirmar(TR.acc.fijar([1], 'cp', 'c8').ok); igual([byId(1).cp, byId(2).cp], ['c8', 'c8'], 'la pared y su puerta'); ser(hist.length, h0 + 1, 'un paso');
      afirmar(!TR.acc.fijar([1], 'cp', 'c9').ok, 'acepta una capa bloqueada'); afirmar(TR.acc.fijar([3], 'cp', 'c8').ok); render(); ser(byId(4).cp, 'c8', 'el equipo sigue a su mesa');
      afirmar(!TR.acc.campo('cp').aplica(byId(4)), 'un equipo sobre una mesa no ofrece capa'); deshacer(); deshacer(); igual([byId(1).cp, byId(2).cp, byId(3).cp], [c1, c1, c1], 'deshacer');
    });
  });
  prueba('Nodo con doble clic: doble clic en el tramo de un cable agrega un vértice ahí, ya agarrado para plegarlo (un paso; deshacer lo quita); las uniones a vértices posteriores se corren', () => {
    const { clic } = TRP.util, U = CAT.Cables.find(c => c.n == 'UTP Cat6');
    con([], () => {
      V.z = 60; V.ox = 40; V.oy = 40; rejilla = false; render();
      setTool(U); clic(1, 2); clic(8, 2); finishLine(); clic(8, 6); clic(8.03, 2.02); finishLine(); setTool(null);   // B termina en la punta de A (índice 1)
      const [A, B] = S.objs, h0 = hist.length, a = pant(4, 2), b = pant(4, 4);
      sinCaptura(() => { lastDown.t = 0; for (let i = 0; i < 2; i++) { const el = document.elementFromPoint(a.x, a.y); ptr(el, 'pointerdown', a.x, a.y); if (!i) ptr(svg, 'pointerup', a.x, a.y); } ptr(svg, 'pointermove', b.x, b.y); ptr(svg, 'pointerup', b.x, b.y); });
      ser(A.pts.length, 3, 'A tiene un vértice nuevo'); igual([A.pts[1].x, A.pts[1].y], [4, 4], 'el vértice nuevo se arrastró y plegó el cable'); ser(B.pts[1].ri, 2, 'la unión de B se corrió');
      ser(hist.length, h0 + 1, 'un solo paso'); afirmar(!A.label, 'no pide etiqueta');
      deshacer(); ser(byId(A.id).pts.length, 2, 'deshacer quita el vértice'); ser(byId(B.id).pts[1].ri, 1);
    });
  });
})();