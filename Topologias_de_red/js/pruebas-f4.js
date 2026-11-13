// ===== pruebas-f4.js: pruebas de la Fase 4 (F4A: catálogo, iconos y modelos propios; F4B: imágenes) =====
// Se carga después de pruebas.js (solo con ?pruebas=1) y agrega sus casos a los de TRP usando sus utilidades (TRP.util).
(() => {
  const { prueba, afirmar, ser, igual, item, fVacio, fDispositivos, conProyecto, conR, pngUri, mover, conMenuContado, ptr, sinCaptura, conConfirm, enObj, pant, clic } = TRP.util;
  // ---------- Pruebas de la Fase 4A (catálogo, iconos y modelos propios) ----------
  const GE8 = () => [{ g: 'g0', n: 8, tipo: 'utp', vel: '1G', pref: 'GigabitEthernet' }];
  const enDispositivos = fn => { const t0 = tab, b0 = busca; tab = 'Dispositivos'; busca = ''; try { menu(); return fn(); } finally { tab = t0; busca = b0; menu(); } };   // el menú izquierdo en la pestaña «Dispositivos»; al terminar vuelve a como estaba
  const f4 = fn => conR(() => conProyecto(fVacio().estado, () => enDispositivos(fn)));
  prueba('Fase 4A: cada modelo del catálogo pasa la validación del formato, tiene su icono y respeta el tamaño mínimo', () => {
    afirmar(typeof PT !== 'undefined' && typeof ICONOS !== 'undefined' && TR.mod, 'faltan js/catalogo-pt.js, js/iconos.js o js/modelos.js (o index.html no los carga)');
    PT.forEach(m => { afirmar(ICONOS[m.orig], m.orig + ': sin icono'); afirmar(Math.max(m.w, m.h) >= .3, m.orig + ': lado mayor menor a 0,30 m'); afirmar(CATS.some(c => c.id == m.cat), m.orig + ': categoría'); });
    ser(new Set(PT.map(m => m.orig)).size, PT.length, 'claves repetidas'); afirmar(!CAT.Dispositivos.some(d => /C[áa]mara/.test(d.n)), 'la Cámara IP ya no va en el menú');
    const rec = { modelos: Object.fromEntries(PT.map((m, i) => ['m' + (i + 1), m])) }, r = ESQ.leer(JSON.stringify({ formato: 'topologias-de-red', version: 2, estado: fVacio().estado, recursos: rec }));
    afirmar(r.ok, (r.errores || []).join(' | ')); ser(r.avisos.length, 0, 'avisos: ' + r.avisos.join(' | ')); igual(r.recursos.modelos, rec.modelos, 'algún campo de un modelo se perdió o cambió al leerlo (R9)');
  });
  prueba('Fase 4A: colocar un equipo copia su modelo una sola vez, lo nombra con contador y lo dibuja con su icono, sin recuadro', () => {
    f4(() => {
      const h0 = hist.length; tool = CAT.Dispositivos[0]; render(); clic(3, 3); clic(6, 3);
      ser(S.objs.length, 2, 'equipos colocados'); ser(hist.length, h0 + 2, 'un paso por equipo'); ser(Object.keys(R.modelos).length, 1, 'el modelo debe copiarse una sola vez');
      const [a, b] = S.objs; ser(a.modelo, b.modelo, 'mismo modelo'); igual([a.label, b.label], ['Router1', 'Router2'], 'nombres'); igual([a.tipo, a.sub, a.w, a.h, a.n], ['dispositivo', 'router', .44, .3, 'Router 2911'], 'datos del equipo');
      afirmar(R.modelos[a.modelo] !== CAT.Dispositivos[0].pt, 'el proyecto debe tener su propia copia de la plantilla');
      const g = enObj(a.id); afirmar(g.querySelector('use[href="#ic-router-2911"]'), 'no usa su icono'); ser(document.querySelectorAll('#c symbol').length, 1, 'cada icono se define una sola vez');
      ser(g.querySelector('rect').getAttribute('fill'), 'transparent', 'el rectángulo solo recibe clics'); afirmar(!g.querySelector('rect[stroke]'), 'no debe dibujarse el recuadro');
      const tx = [...document.querySelectorAll('#c text')].map(t => t.textContent); afirmar(tx.includes('2911') && tx.includes('Router1') && tx.includes('Router2'), 'faltan las dos líneas (modelo y nombre): ' + tx.join(', '));
      afirmar(hist.slice(h0).every(p => !p.includes('data:image') && !p.includes('puertos')), 'los pasos del historial no deben contener recursos');
      afirmar(construirSvgExport().xml.includes('<symbol id="ic-router-2911"'), 'el PNG exportado no incluiría el icono');
      tool = CAT.Dispositivos.find(d => d.pt.orig == 'rack'); clic(9, 3); const r = S.objs[2]; igual([r.tipo, r.sub, r.label, r.w, r.h], ['rack', undefined, 'Rack1', .8, 1], 'rack');
      S.objs.splice(0, 1); tool = CAT.Dispositivos[0]; clic(3, 6); ser(S.objs[2].label, 'Router3', 'el contador sigue al mayor número existente');
      delete S.objs[2].modelo; render(); afirmar(enObj(S.objs[2].id).querySelector('rect[stroke]') && !/undefined/.test(enObj(S.objs[2].id).textContent), 'un equipo sin modelo ni emoji se dibuja con su recuadro');
    });
  });
  prueba('Fase 4A: modelo propio: crear, modificar (con equipos colocados) y borrar son un solo paso cada uno y se deshacen', () => {
    f4(() => {
      const h0 = hist.length, E = { cat: 'routers', id: null };
      afirmar(TR.mod.guardar({ nombre: '  ', puertos: GE8() }, E), 'aceptó un nombre vacío'); ser(hist.length, h0, 'un rechazo no guarda historial'); ser(S.propios, undefined);
      ser(TR.mod.guardar({ nombre: 'Mi router', puertos: GE8() }, E), ''); ser(hist.length, h0 + 1, 'crear = un paso'); igual(S.propios, ['m1']); igual([R.modelos.m1.orig, R.modelos.m1.cat, R.modelos.m1.sub, R.modelos.m1.v], ['propio', 'routers', 'router', 1]);
      render(); afirmar($('#items details[data-cat="routers"] [data-m="m1"]') && $('#items [data-ed="m1"]'), 'el modelo nuevo no aparece en su categoría del menú');
      $('#items [data-m="m1"]').click(); igual(tool, { k: 'item', mid: 'm1' }, 'herramienta'); clic(3, 3); clic(6, 3); tool = null; igual(S.objs.map(o => [o.label, o.modelo, o.sub]), [['Router1', 'm1', 'router'], ['Router2', 'm1', 'router']]);
      afirmar(enObj(S.objs[0].id).querySelector('use[href="#ic-router-2911"]') && $('#items [data-m="m1"] svg').innerHTML == $('#items [data-i="0"] svg').innerHTML, 'un modelo propio usa el icono de su categoría (plano y menú)');
      afirmar(CATS.every(c => !c.uno || ICONOS[c.ic]), 'cada categoría con «Empty» necesita su icono');
      const h1 = hist.length, E1 = { cat: 'routers', id: 'm1' };
      ser(TR.mod.guardar({ nombre: 'Mi router', puertos: GE8() }, E1), ''); ser(hist.length, h1, 'guardar sin cambios no debe crear un paso'); igual(S.propios, ['m1']);
      ser(TR.mod.guardar({ nombre: 'Mi router 2', puertos: [...GE8(), { g: 'g1', n: 2, tipo: 'serial', pref: 'Serial' }] }, E1), ''); ser(hist.length, h1 + 1, 'modificar = un paso'); igual(S.propios, ['m2']);
      afirmar(S.objs.every(o => o.modelo == 'm2' && o.n == 'Mi router 2'), 'los equipos colocados deben pasar a la versión nueva'); igual([R.modelos.m2.v, R.modelos.m2.base, R.modelos.m1.nombre, R.modelos.m1.puertos.length], [2, 'm1', 'Mi router', 1], 'la plantilla anterior no se altera');
      deshacer(); igual(S.propios, ['m1']); afirmar(S.objs.every(o => o.modelo == 'm1' && o.n == 'Mi router'), 'deshacer devuelve los equipos a la versión anterior'); afirmar($('#items [data-m="m1"]') && !$('#items [data-m="m2"]'), 'el menú debe seguir a deshacer');
      rehacer(); igual(S.propios, ['m2']); afirmar($('#items [data-m="m2"]'), 'el menú debe seguir a rehacer');
      const h2 = hist.length; ser(conConfirm(false, () => ser(TR.mod.borrarModelo('m2'), false)), 1, 'borrar debe avisar de los equipos que lo usan'); ser(hist.length, h2, 'cancelar no guarda historial'); igual(S.propios, ['m2']);
      conConfirm(true, () => TR.mod.borrarModelo('m2')); render(); ser(hist.length, h2 + 1, 'borrar = un paso'); ser(S.propios, undefined); afirmar(S.objs.every(o => o.modelo == 'm2'), 'los equipos colocados conservan su modelo'); afirmar(!$('#items [data-m]'), 'sigue en el menú');
      deshacer(); igual(S.propios, ['m2']); afirmar($('#items [data-m="m2"]'), 'deshacer el borrado lo devuelve al menú');
    });
  });
  prueba('Fase 4A: diálogo de modelo propio (alta desde «Empty», validación, edición) y atajos bloqueados mientras está abierto', () => {
    f4(() => {
      const d = $('#dlg-mod'), q = s => d.querySelector(s), h0 = hist.length;
      try {
        $('#items [data-empty="switches"]').click(); afirmar(d.open, 'no abrió el diálogo'); ser(q('#dm-g').children.length, 1, 'grupo inicial'); afirmar(q('#dm-del').hidden, 'un modelo nuevo no se puede borrar');
        const g0 = rejilla; document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true })); ser(rejilla, g0, 'un atajo actuó con el diálogo abierto');
        q('form').requestSubmit(); afirmar(d.open && q('#dm-err').textContent, 'aceptó un modelo sin nombre'); ser(hist.length, h0);
        q('#dm-n').value = 'Switch de piso'; q('#dm-add').click(); const f = q('#dm-g').children[1], s = f.children[1]; s.value = 'libre'; s.dispatchEvent(new Event('change', { bubbles: true })); ser(f.children[2].value, '', '«Nombre libre» deja el nombre para escribir');
        q('form').requestSubmit(); afirmar(d.open && /nombre/.test(q('#dm-err').textContent), 'aceptó un puerto sin nombre'); f.children[2].value = 'Uplink'; f.children[0].value = 2;
        q('form').requestSubmit(); afirmar(!d.open, 'no cerró al guardar'); ser(hist.length, h0 + 1); igual(S.propios, ['m1']);
        igual(R.modelos.m1.puertos, [{ g: 'g0', n: 4, tipo: 'utp', vel: '1G', pref: 'GigabitEthernet' }, { g: 'g1', n: 2, tipo: 'utp', pref: 'Uplink' }], 'puertos guardados'); igual([R.modelos.m1.cat, R.modelos.m1.pre], ['switches', 'Switch']);
        $('#items [data-ed="m1"]').click(); afirmar(d.open && !q('#dm-del').hidden, 'edición'); ser(q('#dm-n').value, 'Switch de piso'); igual([...q('#dm-g').children].map(r => r.children[1].value), ['ge', 'libre'], 'tipos al reabrir');
        q('#dm-g [data-q]').click(); ser(q('#dm-g').children.length, 1, 'quitar un grupo'); q('#dm-x').click(); afirmar(!d.open, 'Cancelar'); ser(hist.length, h0 + 1, 'cancelar no guarda nada'); ser(R.modelos.m1.puertos.length, 2);
      } finally { TR.mod.cerrar(); }
    });
  });
  prueba('Fase 4A: sección «Modelo» del inspector: los datos son del modelo y editarlos no toca el proyecto ni el historial', () => {
    f4(() => {
      tool = CAT.Dispositivos[0]; clic(3, 3); clic(6, 3); tool = null; sel = S.objs[0].id; render(); const id = S.objs[0].modelo, h0 = hist.length, j0 = JSON.stringify(S), c = $('#insp-cuerpo');
      const poner = (k, v) => { const el = c.querySelector(`[data-mod="${k}"]`); afirmar(el, 'falta el campo ' + k); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
      afirmar(/Router 2911/.test(c.textContent) && /3 GigabitEthernet/.test(c.textContent), 'modelo y puertos'); afirmar(!c.querySelector('[data-mod-ed]'), 'un modelo del catálogo no se edita');
      poner('marca', 'Cisco'); poner('desc', 'Router de borde'); poner('precio', '1500.5'); poner('moneda', 'USD');
      igual([R.modelos[id].marca, R.modelos[id].desc, R.modelos[id].precio, R.modelos[id].moneda], ['Cisco', 'Router de borde', 1500.5, 'USD']); ser(hist.length, h0, 'historial'); ser(JSON.stringify(S), j0, 'cambió el proyecto');
      sel = S.objs[1].id; render(); ser(c.querySelector('[data-mod="precio"]').value, '1500.5', 'el precio es del modelo: vale para sus otros equipos');
      poner('precio', '-3'); ser(R.modelos[id].precio, undefined, 'un precio inválido borra el dato');
      TR.mod.guardar({ nombre: 'Propio', puertos: GE8() }, { cat: 'seguridad', id: null }); tool = { k: 'item', mid: 'm2' }; clic(9, 3); tool = null; sel = S.objs[2].id; render();
      afirmar(c.querySelector('[data-mod-ed="m2"]'), 'un modelo propio ofrece «Editar modelo…»'); ser(S.objs[2].label, 'Seguridad1');
    });
  });
  prueba('Fase 4A: guardar y abrir conserva modelos y datos; un modelo propio sin equipos se guarda; reabrir no duplica modelos', () => {
    f4(() => {
      TR.mod.guardar({ nombre: 'Sin uso', puertos: GE8() }, { cat: 'switches', id: null }); tool = CAT.Dispositivos[1]; clic(3, 3); tool = CAT.Dispositivos[6]; clic(6, 3); tool = null;
      TR.mod.fijarDato('m2', 'precio', '250'); TR.mod.fijarDato('m2', 'moneda', 'ARS'); TR.mod.fijarDato('m2', 'marca', 'Cisco'); TR.mod.fijarDato('m2', 'desc', 'Switch de acceso');
      R.agregarModelo({ nombre: 'Huérfano', orig: 'propio' });                               // sin equipos y fuera de S.propios: no se guarda
      const a = ESQ.serializar(S, R); afirmar(a.ok, a.error); const d = JSON.parse(a.texto);
      igual(Object.keys(d.recursos.modelos).sort(), ['m1', 'm2', 'm3'], 'modelos guardados'); igual(d.estado.propios, ['m1']); igual([d.recursos.modelos.m2.precio, d.recursos.modelos.m2.moneda, d.recursos.modelos.m2.orig], [250, 'ARS', 'switch-2960-24tt']);
      const r = ESQ.leer(a.texto); afirmar(r.ok, (r.errores || []).join(' | ')); ser(r.avisos.length, 0, 'avisos: ' + r.avisos.join(' | '));
      delete R.modelos.m4; const ab = abrirTexto(a.texto); afirmar(ab.ok, (ab.errores || []).join(' | ')); ser(Object.keys(R.modelos).length, 3, 'reabrir el mismo archivo no debe duplicar modelos');
      const orden = t => JSON.stringify(JSON.parse(t), (k, v) => v && typeof v == 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v), b = ESQ.serializar(S, R).texto;   // al abrir, cada objeto queda con id y k primero: se compara sin mirar el orden de los campos
      ser(orden(b), orden(a.texto), 'la ida y vuelta perdió o cambió algún campo'); ser(ESQ.serializar(ESQ.leer(b).estado, R).texto, b, 'guardar → abrir → guardar debe dar el mismo archivo'); afirmar($('#items [data-m="m1"]'), 'el modelo propio debe volver al menú al abrir');
      R.vaciar(); const ab2 = abrirTexto(a.texto); afirmar(ab2.ok); igual([R.modelos.m2.precio, R.modelos.m2.puertos.length, R.modelos.m1.nombre], [250, 2, 'Sin uso'], 'abrir en limpio');
      d.estado.propios = ['m1', 'm9', 'x']; afirmar(!ESQ.leer(JSON.stringify(d)).estado.propios, 'una lista de modelos propios inválida se omite'); d.estado.propios = ['m1', 'm9'];
      const r2 = ESQ.leer(JSON.stringify(d)); afirmar(r2.ok && r2.avisos.length == 1, 'debe avisar'); igual(r2.estado.propios, ['m1'], 'modelo propio inexistente');
    });
  });
  prueba('Fase 4A (revisión thermo): plantillas que quedaron de otro proyecto, herramienta de un modelo que ya no está, «Editar modelo…» obsoleto, archivos con modelos incompletos y búsqueda sin acentos', () => {
    f4(() => {
      R.agregarModelo({ ...copiar(PT[0]), precio: 999 });                                     // m1: quedó en memoria de otro archivo abierto antes
      tool = CAT.Dispositivos[0]; clic(3, 3); tool = null; ser(S.objs[0].modelo, 'm2', 'un equipo nuevo no debe usar la plantilla de otro proyecto'); ser(R.modelos.m2.precio, undefined, 'precio heredado de otro proyecto');
      const E = { cat: 'routers', id: null }; TR.mod.guardar({ nombre: 'A', puertos: GE8() }, E); render(); $('#items [data-m="m3"]').click(); deshacer();
      ser(tool, null, 'deshacer la creación del modelo debe soltar su herramienta'); afirmar(!$('#items [data-m]'), 'menú tras deshacer');
      rehacer(); tool = { k: 'item', mid: 'm3' }; clic(6, 3); tool = null; sel = S.objs[1].id; render(); afirmar($('#insp-cuerpo [data-mod-ed="m3"]'), 'falta «Editar modelo…»');
      conConfirm(true, () => TR.mod.borrarModelo('m3')); render(); afirmar(!$('#insp-cuerpo [data-mod-ed]'), 'el inspector debe quitar «Editar modelo…» al borrar el modelo');
      TR.mod.abrir(null, 'm3'); afirmar(!$('#dlg-mod').open, 'abrió el diálogo de un modelo que ya no es del proyecto');
      const h = hist.length; afirmar(TR.mod.guardar({ nombre: 'B', puertos: GE8() }, { cat: 'routers', id: 'm3' }), 'modificó un modelo borrado'); ser(TR.mod.borrarModelo('m3'), false, 'borró dos veces');
      afirmar(TR.mod.guardar({ nombre: 'C', puertos: [{ g: 'g0', n: 0, tipo: 'utp', pref: 'x' }] }, E), 'aceptó puertos inválidos'); afirmar(TR.mod.guardar({ nombre: 'C', puertos: [] }, E), 'aceptó un modelo sin puertos'); ser(hist.length, h, 'los rechazos no guardan historial');
      const rec = { modelos: { m1: { nombre: 'Raro', orig: 'constructor', cat: 'routers', tipo: 'escalera' }, m2: { nombre: 'Sin categoría', orig: 'propio', cat: 'zzz' } } };
      const txt = JSON.stringify({ formato: 'topologias-de-red', version: 2, estado: { ...fVacio().estado, propios: ['m1', 'm2'] }, recursos: rec }), r = ESQ.leer(txt);
      afirmar(r.ok, (r.errores || []).join(' | ')); igual(r.estado.propios, ['m1'], 'un modelo propio de una categoría inexistente no se ofrece');
      R.vaciar(); afirmar(abrirTexto(txt).ok, 'no abrió'); $('#items [data-m="m1"]').click(); clic(3, 3); tool = null; const o = S.objs[S.objs.length - 1];
      igual([o.tipo, o.w, o.h], ['dispositivo', .44, .3], 'una plantilla incompleta o con otro tipo debe dar un equipo normal'); afirmar(enObj(o.id).querySelector('use[href="#ic-generico"]'), 'un icono desconocido usa el genérico');
      TR.mod.abrir(null, 'm1'); afirmar($('#dlg-mod').open, 'un modelo sin puertos debe poder editarse'); TR.mod.cerrar();
      const b = $('#busca'); b.value = 'ELECTRODOMESTICO'; b.dispatchEvent(new Event('input', { bubbles: true })); igual([...document.querySelectorAll('#lista-disp b')].map(x => x.textContent), ['Electrodoméstico'], 'la búsqueda no debe distinguir acentos ni mayúsculas');
    });
  });
  prueba('Fase 4A: los equipos sin modelo se dibujan como antes; el menú no se rehace al mover el ratón ni al redibujar; buscar rehace solo la lista; «Nuevo» vacía el portapapeles', () => {
    conProyecto(fDispositivos().estado, () => enDispositivos(() => conMenuContado(() => {
      const g = enObj(1); afirmar(g.querySelector('rect[stroke="#34495e"]') && g.querySelector('text').textContent == '📡' && !g.querySelector('use'), 'un equipo sin modelo cambió de aspecto'); ser($('#c defs').innerHTML, '', 'sin modelos no se define ningún icono');
      TR.reiniciar(); for (let i = 0; i < 25; i++) mover(i); render(); render(); ser(TR.stats.menu, 0, 'el menú se rehízo');
      const b = $('#busca'); b.value = 'swi'; b.dispatchEvent(new Event('input', { bubbles: true })); ser($('#busca'), b, 'buscar no debe rehacer el campo'); ser(TR.stats.menu, 0, 'buscar rehízo el menú entero');
      igual([...document.querySelectorAll('#lista-disp b')].map(x => x.textContent), ['Switch 2960-24TT', 'Multilayer Switch 3560-24PS'], 'resultado de la búsqueda'); afirmar(!$('#lista-disp [data-empty]'), 'los «Empty» no van en una búsqueda');
      b.value = 'zzz'; b.dispatchEvent(new Event('input', { bubbles: true })); afirmar(/Ningún/.test($('#lista-disp').textContent), 'búsqueda sin resultados');
    })));
    const P = TR.acc.portapapeles, g = [...P];
    try { conR(() => conProyecto(fDispositivos().estado, () => { sel = 1; multi = []; render(); TR.acc.ejecutar('copiar'); ser(P.length, 1, 'no copió'); nuevoArchivo(); ser(P.length, 0, '«Nuevo» debe vaciar el portapapeles'); })); }
    finally { P.splice(0, P.length, ...g); $('#bw').value = S.edificio.w; $('#bh').value = S.edificio.h; }
  });
  // ---------- Pruebas de la Fase 4B (imágenes de equipo, de modelo y sueltas) ----------
  const usaImg = (id, img) => !!enObj(id).querySelector(`use[href="#im-${img}"]`), simbolosImg = () => document.querySelectorAll('#c symbol[id^="im-"]').length;
  const dosRouters = () => { tool = CAT.Dispositivos[0]; clic(3, 3); clic(6, 3); tool = null; render(); return S.objs.slice(-2); };
  prueba('Fase 4B: la imagen de un equipo reemplaza a su icono, es un paso que se deshace y no entra en el historial', () => {
    afirmar(TR.img, 'falta js/imagenes.js (o index.html no lo carga)');
    f4(() => {
      const [a, b] = dosRouters(), A = R.agregarImagen(pngUri(40, 20)).id, h0 = hist.length;
      afirmar(TR.img.ponerEquipo([a.id], A), 'no asignó la imagen'); ser(hist.length, h0 + 1, 'un paso'); ser(a.img, A);
      afirmar(usaImg(a.id, A) && !enObj(a.id).querySelector('use[href^="#ic-"]'), 'el equipo debe dibujar su imagen en lugar del icono'); afirmar(enObj(b.id).querySelector('use[href="#ic-router-2911"]'), 'el otro equipo sigue con su icono');
      const s = $('#c symbol#im-' + A); afirmar(s && s.getAttribute('viewBox') == '0 0 40 20' && s.querySelector('image').getAttribute('href').startsWith('data:image/png'), 'definición de la imagen'); ser(simbolosImg(), 1, 'cada imagen se define una sola vez');
      const tx = [...document.querySelectorAll('#c text')].map(t => t.textContent); afirmar(tx.includes('2911') && tx.includes('Router1'), 'las dos líneas de texto siguen debajo');
      const nodo = s.querySelector('image'); render(); afirmar($('#c symbol#im-' + A + ' image') === nodo, 'la imagen no debe volver a procesarse en cada redibujo');
      ser(TR.img.ponerEquipo([a.id], A), false, 'repetir la misma imagen no es un cambio'); ser(TR.img.ponerEquipo([a.id], 'i_00000000'), false, 'imagen inexistente'); ser(hist.length, h0 + 1, 'los rechazos no guardan historial');
      afirmar(hist.every(p => !p.includes('data:image')), 'un paso del historial contiene una imagen');
      deshacer(); ser(a.id && byId(a.id).img, undefined, 'deshacer quita la imagen'); ser(simbolosImg(), 0); ser(document.querySelectorAll('#c defs').length, 1, 'sin imágenes, #c queda como antes');
      rehacer(); afirmar(usaImg(a.id, A), 'rehacer'); afirmar(TR.img.quitarEquipo([a.id]), 'no quitó'); ser(hist.length, h0 + 2); afirmar(enObj(a.id).querySelector('use[href="#ic-router-2911"]'), 'al quitarla vuelve el icono'); ser(TR.img.quitarEquipo([a.id]), false, 'quitar dos veces');
      S.objs.push(item(50, 'PC', '💻', 2, 2), { id: 51, k: 'line', n: 'Pared', c: '#444444', w: .2, d: '', pts: [{ x: 0, y: 0 }, { x: 2, y: 0 }], pl: a.pl, cp: a.cp });
      afirmar(TR.img.ponerEquipo([50, 51], A), 'un equipo viejo sin modelo admite imagen'); afirmar(usaImg(50, A) && !enObj(50).querySelector('rect[stroke]'), 'equipo sin modelo con imagen: sin recuadro ni emoji'); ser(byId(51).img, undefined, 'una pared no lleva imagen');
    });
  });
  prueba('Fase 4B: la imagen del modelo vale para todos sus equipos, la del equipo le gana, y no toca el proyecto ni el historial', () => {
    f4(() => {
      const [a, b] = dosRouters(), A = R.agregarImagen(pngUri(40, 20)).id, B = R.agregarImagen(pngUri(30, 30)).id, mid = a.modelo, h0 = hist.length, j0 = JSON.stringify(S), c = $('#insp-cuerpo');
      afirmar(TR.img.ponerModelo(mid, B), 'no asignó'); afirmar(usaImg(a.id, B) && usaImg(b.id, B), 'todos los equipos del modelo'); ser(hist.length, h0, 'historial'); ser(JSON.stringify(S), j0, 'cambió el proyecto'); ser(TR.img.ponerModelo(mid, 'i_00000000'), false, 'imagen inexistente');
      TR.img.ponerEquipo([a.id], A); afirmar(usaImg(a.id, A) && usaImg(b.id, B), 'la imagen del equipo tiene prioridad'); ser(simbolosImg(), 2);
      sel = a.id; multi = []; render(); const q = s => c.querySelector(s);
      afirmar(q('[data-acc="img-poner"]') && q(`[data-img-mod="${mid}"]`), 'faltan los botones de la sección «Imagen»'); afirmar(!q('[data-acc="img-quitar"]').disabled && !q('[data-img-mod-x]').disabled, 'los «Quitar» deben estar activos');
      q('[data-acc="img-quitar"]').click(); ser(byId(a.id).img, undefined, 'botón «Quitar la del equipo»'); afirmar(usaImg(a.id, B), 'vuelve a la imagen del modelo'); afirmar(q('[data-acc="img-quitar"]').disabled, 'sin imagen propia, «Quitar» se desactiva');
      q('[data-img-mod-x]').click(); ser(R.modelos[mid].img, undefined, 'botón «Quitar la del modelo»'); afirmar(enObj(b.id).querySelector('use[href="#ic-router-2911"]'), 'sin imágenes vuelve el icono'); afirmar(q('[data-img-mod-x]').disabled, '«Quitar la del modelo» se desactiva');
      const ids = os => TR.acc.paraMenu(os).flatMap(g => g.items.map(i => i.id));
      afirmar(ids([byId(a.id)]).includes('img-poner') && ids([byId(a.id)]).includes('img-quitar'), 'faltan las entradas del menú contextual'); S.objs.push({ id: 60, k: 'texto', x: 1, y: 1, label: 'x', pl: a.pl, cp: a.cp }); afirmar(!ids([byId(60)]).includes('img-poner'), 'un texto no lleva imagen');
    });
  });
  prueba('Fase 4B: solo PNG, JPEG y WebP dentro de los límites; un archivo rechazado avisa y no cambia nada', () => {
    f4(() => {
      const al = window.alert; let avisos = 0, llamadas = 0; window.alert = () => { avisos++; };
      try { TR.img.cargar({ size: R.limites.imagen + 1, name: 'grande.png' }, () => { llamadas++; }); } finally { window.alert = al; }
      ser(avisos, 1, 'un archivo de más de 5 MB debe avisar'); ser(llamadas, 0, 'no debe usarse'); ser(Object.keys(R.imgs).length, 0, 'cambiaron los recursos');
      afirmar(!R.agregarImagen('data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg"/>')).ok, 'un SVG debe rechazarse');
      const e = [...document.querySelectorAll('input[type=file]')].find(x => /image\/png/.test(x.accept)); afirmar(e && !/svg/.test(e.accept), 'el selector de archivos no debe ofrecer SVG');
    });
  });
  prueba('Fase 4B: imagen suelta en el plano: nace con su proporción y seleccionada, se copia y pega, y respeta la capa bloqueada', () => {
    const P = TR.acc.portapapeles, g = [...P];
    try { f4(() => {
      afirmar(CAT.Marcar.some(d => d.accion), 'falta «Imagen…» en la pestaña Marcar');
      const C = R.agregarImagen(pngUri(400, 100)).id, h0 = hist.length; tool = CAT.Dispositivos[0];
      afirmar(TR.img.colocar(C), 'no colocó'); ser(S.objs.length, 1); ser(hist.length, h0 + 1, 'un paso'); const o = S.objs[0];
      igual([o.k, o.tipo, o.w, o.h, o.img, o.modelo], ['item', 'imagen', 2, .5, C, undefined], 'objeto'); ser(sel, o.id, 'queda seleccionada'); ser(tool, null, 'suelta la herramienta'); afirmar(usaImg(o.id, C) && !enObj(o.id).querySelector('rect[stroke]'), 'se dibuja la imagen, sin recuadro');
      const ids = TR.acc.paraMenu([o]).flatMap(x => x.items.map(i => i.id)); afirmar(ids.includes('img-poner') && !ids.includes('img-quitar'), 'una imagen suelta se cambia, no se «quita»'); ser(TR.img.quitarEquipo([o.id]), false);
      afirmar(/Imagen/.test($('#insp-cuerpo').textContent) && $('#insp-cuerpo [data-acc="img-poner"]') && !$('#insp-cuerpo [data-img-mod]'), 'inspector de una imagen suelta');
      TR.acc.ejecutar('copiar'); afirmar(TR.acc.pegar(), 'no pegó'); igual([S.objs.length, S.objs[1].img, S.objs[1].tipo], [2, C, 'imagen'], 'la copia conserva la imagen');
      const r = ESQ.leer(ESQ.serializar(S, R).texto); afirmar(r.ok && !r.avisos.length, 'ida y vuelta: ' + JSON.stringify(r.errores || r.avisos)); igual([r.estado.objs[0].tipo, r.estado.objs[0].img], ['imagen', C], 'el tipo «imagen» se conserva');
      capaActual().bloqueada = true; ser(TR.img.colocar(C), false, 'con la capa bloqueada no se coloca'); ser(S.objs.length, 2); capaActual().bloqueada = false;
      ser(TR.img.colocar('i_00000000'), false, 'imagen inexistente');
    }); } finally { P.splice(0, P.length, ...g); }
  });
  prueba('Fase 4B: la imagen suelta se estira con sus asas: los costados la deforman, las esquinas conservan la proporción y cada arrastre se deshace', () => {
    f4(() => {
      const C = R.agregarImagen(pngUri(400, 100)).id; TR.img.colocar(C); const o = S.objs[0], h0 = hist.length, cerca = (a, b, m) => afirmar(Math.abs(a - b) < .002, m + ': ' + a + ' en lugar de ' + b); o.x = 5; o.y = 5; render();
      ser(document.querySelectorAll('#c [data-h]').length, 8, 'una imagen suelta seleccionada muestra 8 asas');
      const tirar = (h, x, y) => sinCaptura(() => { const a = document.querySelector(`#c [data-h="${h}"]`), b = a.getBoundingClientRect(), p = pant(x, y); ptr(a, 'pointerdown', b.left + b.width / 2, b.top + b.height / 2); ptr(svg, 'pointermove', p.x, p.y); ptr(svg, 'pointerup', p.x, p.y); });
      tirar('e', 8, 5); afirmar(o.w > 2, 'el asa del costado derecho no estiró'); ser(o.h, .5, 'un costado no cambia el alto'); cerca(o.x - o.w / 2, 4, 'el lado opuesto queda fijo'); ser(hist.length, h0 + 1, 'un paso');
      afirmar(enObj(o.id).querySelector('use').getAttribute('transform').includes(`scale(${o.w / 400} ${o.h / 100})`), 'la imagen debe llenar su rectángulo');
      const prop = o.w / o.h; tirar('se', 10, 6); afirmar(o.w > 4 && o.h > .5, 'el asa de la esquina no agrandó'); cerca(o.w / o.h / prop, 1, 'la esquina conserva la proporción'); cerca(o.x - o.w / 2, 4, 'esquina opuesta (x)'); cerca(o.y - o.h / 2, 4.75, 'esquina opuesta (y)');
      tirar('nw', 50, 50); afirmar(o.w >= .2 && o.h >= .2, 'tamaño mínimo'); cerca(o.w / o.h / prop, 1, 'proporción en el mínimo');
      deshacer(); deshacer(); deshacer(); igual([byId(o.id).w, byId(o.id).h], [2, .5], 'deshacer vuelve al tamaño original');
      const g = byId(o.id); g.rot = 90; const fija = () => rotP({ x: g.x - g.w / 2, y: g.y - g.h / 2 }, g, 90), f0 = fija(); redimProporcional(g, 'se', { x: 2, y: 9 }); const f1 = fija();
      cerca(g.w / g.h, 4, 'girada: proporción'); cerca(f1.x, f0.x, 'girada: esquina opuesta (x)'); cerca(f1.y, f0.y, 'girada: esquina opuesta (y)');
      const D = R.agregarImagen(pngUri(100, 100)).id; g.rot = 0; g.w = 2; g.h = .5; afirmar(TR.img.ponerEquipo([g.id], D), 'no cambió la imagen'); igual([g.w, g.h], [2, 2], 'al cambiar la imagen toma la proporción de la nueva');
      g.h = 0; redimProporcional(g, 'se', { x: 9, y: 9 }); afirmar(isFinite(g.w) && isFinite(g.h) && g.h >= .2, 'un alto 0 (archivo manipulado) no debe dar NaN'); g.h = 2;
      S.objs.push({ id: 70, k: 'line', n: 'Pared', c: '#444444', w: .2, d: '', pts: [{ x: 0, y: 0 }, { x: 2, y: 0 }], pl: g.pl, cp: g.cp }); render(); afirmar(enObj(g.id).compareDocumentPosition(enObj(70)) & Node.DOCUMENT_POSITION_FOLLOWING, 'la imagen suelta se dibuja debajo de las paredes de su capa');
      const [a] = dosRouters(); TR.img.ponerEquipo([a.id], C); sel = a.id; multi = []; render(); ser(document.querySelectorAll('#c [data-h]').length, 0, 'un equipo con imagen no lleva asas');
    });
  });
  prueba('Fase 4B: guardar y abrir conserva las imágenes usadas (equipo, modelo y sueltas), descarta las demás, y el PNG exportado las incluye', () => {
    f4(() => {
      const [a] = dosRouters(), [A, B, C, D] = [[40, 20], [30, 30], [400, 100], [5, 5]].map(([w, h]) => R.agregarImagen(pngUri(w, h)).id);
      TR.img.ponerEquipo([a.id], A); TR.img.ponerModelo(a.modelo, B); TR.img.colocar(C);
      const g = ESQ.serializar(S, R); afirmar(g.ok, g.error); const d = JSON.parse(g.texto);
      igual(Object.keys(d.recursos.imgs).sort(), [A, B, C].sort(), 'solo las imágenes usadas'); afirmar(!d.recursos.imgs[D], 'una imagen sin uso no se guarda');
      const l = ESQ.leer(g.texto); afirmar(l.ok, (l.errores || []).join(' | ')); ser(l.avisos.length, 0, 'avisos: ' + l.avisos.join(' | '));
      R.vaciar(); const ab = abrirTexto(g.texto); afirmar(ab.ok, (ab.errores || []).join(' | '));
      const [r1, r2, im] = S.objs; igual([r1.img, R.modelos[r1.modelo].img, im.img, im.tipo], [A, B, C, 'imagen'], 'referencias tras abrir'); afirmar(usaImg(r1.id, A) && usaImg(r2.id, B) && usaImg(im.id, C), 'dibujo tras abrir');
      ser(Object.keys(JSON.parse(ESQ.serializar(S, R).texto).recursos.imgs).length, 3, 'guardar → abrir → guardar');
      afirmar(hist.every(p => !p.includes('data:image')), 'un paso del historial contiene una imagen');
      const x = construirSvgExport().xml; afirmar([A, B, C].every(i => x.includes(`<symbol id="im-${i}"`)) && x.includes('href="data:image/png;base64,'), 'el PNG exportado no incluiría las imágenes'); afirmar(usaImg(r1.id, A), 'exportar no debe quitar las imágenes del plano');
      delete d.recursos.imgs[A]; const l2 = ESQ.leer(JSON.stringify(d)); afirmar(l2.ok && l2.avisos.length == 1 && l2.estado.objs[0].img === undefined, 'una referencia a una imagen que el archivo no trae se omite con aviso');
    });
  });
})();
