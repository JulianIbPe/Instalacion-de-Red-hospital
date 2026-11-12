// ===== modelos.js: modelos de dispositivos (F4A): colocar equipos con modelo, modelos propios («… Empty») y sección «Modelo» del inspector =====
// · Las plantillas viven en R.modelos (recursos.js, fuera del historial). Su estructura (nombre y puertos) NO se modifica nunca: editar un modelo propio
//   crea una plantilla nueva (v + 1, base = la anterior) y pasa a ella los equipos colocados. Así deshacer solo tiene que restaurar S.
// · S.propios = ids de los modelos propios que ofrece el menú. Está dentro del proyecto: se guarda con él (aunque no haya equipos colocados) y entra
//   en el historial, por eso crear, modificar y borrar un modelo es UN paso que se puede deshacer.
// · Fabricante, descripción, precio y moneda son del MODELO y se editan en el inspector directamente sobre la plantilla.
//   shortcut: esos cuatro datos no pasan por el historial (Ctrl+Z no los revierte); si hiciera falta, versionarlos como el nombre y los puertos.
TR.mod = (() => {
  const CTRL = ESQ.CTRL, CORTO = ESQ.LIM.corto, MAX_PUERTOS = 96, MAX_PROPIOS = 200, MONEDAS = ['ARS', 'USD', 'EUR'];   // los valores los valida esquema.js (ESQ.campoModelo); aquí solo hay límites de interfaz, más estrictos
  // Tipos de puerto del diálogo (lista aprobada el 11/11/2026): [clave, nombre visible, medio, velocidad]
  const TP = [['fe', 'FastEthernet', 'utp', '100M'], ['ge', 'GigabitEthernet', 'utp', '1G'], ['serial', 'Serial', 'serial'], ['fibra', 'Fibra', 'fibra'], ['consola', 'Consola/RS-232', 'consola'],
    ['usb', 'USB', 'usb'], ['coaxial', 'Coaxial', 'coaxial'], ['wifi', 'Inalámbrico', 'inalambrico'], ['bt', 'Bluetooth', 'bluetooth'], ['cel', '3G/4G', 'celular'], ['libre', 'Nombre libre', 'utp']];
  const tpDe = p => TP.find(t => t[2] == p.tipo && (t[3] || '') == (p.vel || '')) || TP[TP.length - 1];
  const catDe = id => CATS.find(c => c.id == id);
  const usan = id => S.objs.filter(o => o.modelo == id);
  const esPropio = id => (S.propios || []).includes(id);
  const resumen = m => (m.puertos || []).map(p => p.n + ' ' + p.pref).join(' + ') || 'Sin puertos';

  // ---------- Colocar ----------
  // La plantilla del catálogo se copia al proyecto una sola vez. Se busca solo entre los modelos que USA este proyecto: R también guarda los de otros archivos abiertos antes
  const idCatalogo = pt => [...R.referenciadas(S).mod].find(id => R.modelos[id] && R.modelos[id].orig == pt.orig) || R.agregarModelo(copiar(pt));
  function siguienteNombre(pre) {          // «Router1», «Router2»…: el número siguiente al mayor que ya exista con ese prefijo
    const re = new RegExp('^' + pre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$'); let n = 0;
    S.objs.forEach(o => { const x = re.exec(o.label || ''); if (x) n = Math.max(n, +x[1]); });
    return pre + (n + 1);
  }
  function equipo(tool, p) {               // objeto nuevo para add(): tool = entrada del catálogo ({pt}) o modelo propio ({mid})
    const id = tool.mid || idCatalogo(tool.pt), m = R.modelos[id];
    // una plantilla leída de un archivo puede venir sin tamaño o con otro tipo: se usan valores seguros (solo hay equipos y racks)
    return { k: 'item', n: m.nombre, w: m.w || .44, h: m.h || .3, x: p.x, y: p.y, label: siguienteNombre(m.pre || 'Equipo'), tipo: m.tipo == 'rack' ? 'rack' : 'dispositivo', ...(m.sub ? { sub: m.sub } : {}), modelo: id };
  }

  // ---------- Diálogo de modelo propio ----------
  const dlgM = document.createElement('dialog'); dlgM.id = 'dlg-mod'; dlgM.setAttribute('aria-labelledby', 'dm-t');
  dlgM.innerHTML = '<form method="dialog" novalidate><h3 id="dm-t"></h3>'
    + '<label class="dm-f">Nombre del modelo <input id="dm-n" type="text" maxlength="' + ESQ.LIM.nombre + '" autocomplete="off"></label>'
    + '<div class="dm-h"><span>Cantidad</span><span>Tipo de puerto</span><span>Nombre del puerto</span><span></span></div><div id="dm-g"></div>'
    + '<button type="button" id="dm-add">＋ Agregar puertos</button><p id="dm-uso"></p><p id="dm-err" role="alert"></p>'
    + '<div class="acc"><button type="button" id="dm-del" class="peligro">Borrar modelo</button><button type="button" id="dm-x">Cancelar</button><button type="submit" class="prim">Guardar modelo</button></div></form>';
  document.body.appendChild(dlgM);
  const q = s => dlgM.querySelector(s), filas = q('#dm-g');
  let ed = null;                           // {cat, id}: categoría y, si se modifica uno existente, su id
  function agregarFila(p) {
    const t = tpDe(p), d = document.createElement('div'); d.className = 'dm-r';
    d.innerHTML = `<input type="number" min="1" max="${MAX_PUERTOS}" step="1" aria-label="Cantidad de puertos"><select aria-label="Tipo de puerto">${TP.map(x => `<option value="${x[0]}">${x[1]}</option>`).join('')}</select><input type="text" maxlength="${CORTO}" aria-label="Nombre del puerto" autocomplete="off"><button type="button" data-q title="Quitar estos puertos" aria-label="Quitar estos puertos">✕</button>`;
    const [n, s, nom] = d.children; n.value = p.n; s.value = t[0]; nom.value = p.pref; filas.appendChild(d); return d;
  }
  function abrir(cat, id) {                // cat = categoría de un modelo nuevo («… Empty»); id = modelo propio a modificar
    const m = id ? R.modelos[id] : null; if (id ? !m || !esPropio(id) : !catDe(cat)) return;   // un modelo que ya no es del proyecto (borrado o deshecho) no se edita
    ed = { cat: m ? m.cat : cat, id: id || null };
    q('#dm-t').textContent = m ? 'Modificar modelo' : 'Nuevo modelo: ' + catDe(ed.cat).uno;
    q('#dm-n').value = m ? m.nombre : ''; filas.innerHTML = ''; (m ? m.puertos || [] : [{ n: 4, tipo: 'utp', vel: '1G', pref: 'GigabitEthernet' }]).forEach(agregarFila);
    q('#dm-del').hidden = !m; q('#dm-err').textContent = '';
    const n = m ? usan(id).length : 0; q('#dm-uso').textContent = n ? `${n} equipo(s) colocados usan este modelo: al guardar se actualizan todos, en un solo paso que se puede deshacer.` : '';
    dlgM.showModal(); q('#dm-n').focus();
  }
  const cerrar = () => { if (dlgM.open) dlgM.close(); };
  function leerFilas() {                   // grupos de puertos del diálogo, o un texto con el motivo por el que no valen
    const rs = [...filas.children], out = [];
    if (!rs.length) return 'Agregá al menos un grupo de puertos.';
    if (rs.length > ESQ.LIM.grupos) return `Un modelo admite hasta ${ESQ.LIM.grupos} grupos de puertos.`;
    for (const [i, r] of rs.entries()) {
      const n = Number(r.children[0].value), t = TP.find(x => x[0] == r.children[1].value), pref = r.children[2].value.replace(CTRL, '').trim();
      if (!Number.isInteger(n) || n < 1 || n > MAX_PUERTOS) return `La cantidad de puertos debe ser un número entero entre 1 y ${MAX_PUERTOS}.`;
      if (!pref) return 'Cada grupo de puertos necesita un nombre.';
      out.push({ g: 'g' + i, n, tipo: t[2], ...(t[3] ? { vel: t[3] } : {}), pref });   // mismo orden de campos que deja esquema.js
    }
    return out;
  }
  function guardar(datos, e = ed) {        // datos = {nombre, puertos}; e = {cat, id}. Crea el modelo o una versión nueva; devuelve '' o el motivo del rechazo. Un solo paso de historial
    const nombre = String(datos.nombre).replace(CTRL, '').trim().slice(0, ESQ.LIM.nombre), puertos = datos.puertos;
    if (!nombre) return 'Poné un nombre al modelo.';
    if (!puertos.length || ESQ.campoModelo('puertos', puertos) === undefined) return 'Los puertos del modelo no son válidos.';   // misma regla que al abrir un archivo: lo que se guarda aquí siempre se puede volver a abrir
    if (e.id && !esPropio(e.id)) return 'Ese modelo ya no está en el proyecto.';
    const prev = e.id ? R.modelos[e.id] : null, c = catDe(e.cat);
    if (!prev && (S.propios || []).length >= MAX_PROPIOS) return `Un proyecto admite hasta ${MAX_PROPIOS} modelos propios.`;
    if (prev && prev.nombre == nombre && JSON.stringify(prev.puertos) == JSON.stringify(puertos)) return '';   // sin cambios: no se guarda nada
    const nuevo = prev ? { ...copiar(prev), nombre, corto: nombre.slice(0, CORTO), puertos, v: (prev.v || 1) + 1, base: e.id }
      : { orig: 'propio', cat: c.id, nombre, corto: nombre.slice(0, CORTO), pre: c.uno, tipo: 'dispositivo', sub: c.sub, w: .44, h: .3, puertos, v: 1 };
    push(); const id = R.agregarModelo(nuevo);
    S.propios = prev ? S.propios.map(x => x == e.id ? id : x) : [...(S.propios || []), id];
    if (prev) S.objs.forEach(o => { if (o.modelo == e.id) { o.modelo = id; if (o.n == prev.nombre) o.n = nombre; } });
    if (tool && tool.mid == e.id) tool = { k: 'item', mid: id };
    return '';
  }
  function borrarModelo(id = ed.id) {      // lo quita del menú; los equipos colocados conservan su modelo
    if (!esPropio(id)) return false;
    const n = usan(id).length, nom = R.modelos[id].nombre;
    if (!confirm(n ? `${n} equipo(s) colocados usan el modelo «${nom}». Van a seguir en el plano con ese modelo, pero ya no se va a ofrecer en el menú. ¿Borrarlo?` : `¿Borrar el modelo «${nom}»?`)) return false;
    push(); S.propios = S.propios.filter(x => x != id); if (!S.propios.length) delete S.propios;
    if (tool && tool.mid == id) tool = null;
    return true;
  }
  q('form').onsubmit = e => {
    e.preventDefault(); const p = leerFilas(), err = typeof p == 'string' ? p : guardar({ nombre: q('#dm-n').value, puertos: p });
    if (err) { q('#dm-err').textContent = err; return; }
    cerrar(); render();                    // render → renderPaneles → el menú se rehace porque cambió S.propios
  };
  q('#dm-x').onclick = cerrar;
  q('#dm-del').onclick = () => { if (borrarModelo()) { cerrar(); render(); } };
  q('#dm-add').onclick = () => { if (filas.children.length < ESQ.LIM.grupos) agregarFila({ n: 1, tipo: 'utp', vel: '100M', pref: 'FastEthernet' }).children[0].focus(); };
  filas.onclick = e => { if (e.target.closest('[data-q]')) e.target.closest('.dm-r').remove(); };
  filas.onchange = e => {                  // al elegir un tipo, el nombre pasa al de ese tipo («Nombre libre» lo deja para escribir)
    if (e.target.tagName != 'SELECT') return; const nom = e.target.nextElementSibling, t = TP.find(x => x[0] == e.target.value);
    nom.value = t[0] == 'libre' ? '' : t[1]; if (t[0] == 'libre') nom.focus();
  };

  // ---------- Sección «Modelo» del inspector ----------
  function seccion(os) {                   // HTML de la sección (vacío si la selección no comparte un mismo modelo)
    const id = os[0].modelo, m = id && R.modelos[id]; if (!m || os.some(o => o.modelo != id)) return '';
    const a = `data-mid="${id}" autocomplete="off"`, v = k => esc(m[k] === undefined ? '' : m[k]);
    return `<div class="fila"><span>Modelo</span><b>${esc(m.nombre)}</b></div><div class="fila"><span>Puertos</span><b>${esc(resumen(m))}</b></div>`
      + `<label class="fila"><span>Fabricante</span><input type="text" data-mod="marca" ${a} maxlength="${ESQ.LIM.nombre}" value="${v('marca')}"></label>`
      + `<label class="fila"><span>Descripción</span><input type="text" data-mod="desc" ${a} maxlength="${ESQ.LIM.texto}" value="${v('desc')}"></label>`
      + `<label class="fila"><span>Precio unitario</span><input type="number" data-mod="precio" ${a} min="0" step="0.01" value="${v('precio')}"></label>`
      + `<label class="fila"><span>Moneda</span><select data-mod="moneda" ${a}><option value="">—</option>${MONEDAS.map(x => `<option${m.moneda == x ? ' selected' : ''}>${x}</option>`).join('')}</select></label>`
      + '<p class="nota">Estos datos son del modelo: valen para todos sus equipos. Ctrl+Z no los revierte.</p>'
      + (esPropio(id) ? `<div class="botones"><button data-mod-ed="${id}">Editar modelo…</button></div>` : '');
  }
  function fijarDato(id, k, crudo) {       // fabricante (marca), desc, precio o moneda de un modelo; un valor vacío o inválido borra el dato
    const m = R.modelos[id]; if (!m || !['marca', 'desc', 'precio', 'moneda'].includes(k)) return;
    const v = k == 'precio' ? parseFloat(String(crudo).replace(',', '.')) : String(crudo), s = ESQ.campoModelo(k, v);   // la validez la decide esquema.js (lo que se acepta aquí se puede guardar y abrir)
    if (s === undefined || (typeof s == 'string' && !s.trim()) || (k == 'precio' && s !== v)) delete m[k]; else m[k] = s;                         // un precio fuera de rango no se recorta: se borra
  }
  const cuerpo = $('#insp-cuerpo');
  cuerpo.addEventListener('input', e => { const el = e.target.closest('[data-mod]'); if (el) fijarDato(el.dataset.mid, el.dataset.mod, el.value); });   // con 'input' no se pierde lo escrito si el plano cambia la selección antes de salir del campo
  cuerpo.addEventListener('click', e => { const b = e.target.closest('[data-mod-ed]'); if (b) abrir(null, b.dataset.modEd); });

  return { equipo, abrir, cerrar, abierto: () => dlgM.open, guardar, borrarModelo, seccion, fijarDato, esPropio };
})();
