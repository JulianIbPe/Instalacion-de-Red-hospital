// ===== conexiones.js: puertos y conexiones (Fase 7A, D1) =====
// S.conex = [{id, a, b, rutas}]: una conexión por cada cable de red (el «Cable de energía» no lleva). a / b = null (la punta no está sobre un equipo)
//   o {d: id del equipo, p?: id del puerto}. rutas = ids de sus líneas (hoy siempre una; es lista para la F8/F9).
// Puertos: salen de la plantilla del modelo (grupos {g, n, tipo, pref}); su id es `grupo:índice` («g0:3»). El equipo solo guarda sobrescrituras en
//   o.po = {'g0:3': {off: true, desc: '…'}}. «Ocupado» no se guarda: se deduce de S.conex.
// sincronizar() es el ÚNICO lugar que mantiene S.conex al día con los cables (lo llama renderObjetos, como TR.jer.sincronizar): crea la conexión del
//   cable que no la tiene, quita la del cable borrado, toma el equipo de cada extremo de la unión `ref` de la punta y limpia el puerto si el equipo
//   cambió, si el puerto ya no existe, si no sirve para ese cable o si ya lo usa otra conexión. Es idempotente y no guarda historial: corre después
//   del push() de la acción que movió, borró o creó algo, así cada acción sigue siendo un solo paso.
// Una conexión está incompleta si a una punta le falta el equipo, o el puerto cuando el equipo tiene puertos (falta): se marca con un círculo rojo
//   en la capa #g-inc (fuera de #c: no sale en el PNG), que solo se rehace con los objetos.
TR.con = (() => {
  const MEDIO = { utp6: 'utp', fibra: 'fibra', coaxial: 'coaxial', serial: 'serial', inalambrico: 'inalambrico', consola: 'consola', usb: 'usb' };   // subtipo del cable -> medio del puerto
  const esRed = o => o.k == 'line' && esCable(o) && subDe(o) != 'energia';
  const nombre = o => o.label || o.n || 'Equipo';
  const grupos = o => { const m = o && modeloDe(o); return m && m.puertos || []; };
  const sirve = (p, cable) => { const m = MEDIO[subDe(cable)]; return !m || !p.tipo || p.tipo == m; };
  function puerto(o, id) {                 // {id, nombre, tipo, off?, desc?} o undefined si el equipo no tiene ese puerto
    const [g, i] = String(id).split(':'), G = grupos(o).find(x => x.g == g);
    const pref = G && G.pref || 'Puerto';   // un modelo leído de un archivo puede traer un grupo sin nombre
    return G && +i < G.n ? { id, nombre: G.n > 1 ? pref + ' ' + (+i + 1) : pref, tipo: G.tipo, ...(o.po || {})[id] } : undefined;
  }
  const falta = (c, k, get = byId) => { const e = c[k], d = e && get(e.d); return !d ? 'equipo' : !e.p && grupos(d).length ? 'puerto' : null; };   // qué le falta a un extremo para estar completo (null = nada)
  const puertosDe = o => grupos(o).flatMap(G => Array.from({ length: G.n }, (_, i) => puerto(o, G.g + ':' + i)));
  const conexDe = idLinea => (S.conex || []).find(c => c.rutas.includes(idLinea));
  const usos = o => (S.conex || []).flatMap(c => ['a', 'b'].filter(k => c[k] && c[k].d == o.id).map(k => ({ c, k })));   // extremos de conexión que llegan al equipo
  const otro = k => k == 'a' ? 'b' : 'a';

  let pend = null, htmlMarcas = '';        // pend = {o, p}: puerto elegido para la primera punta del cable que se está dibujando
  function sincronizar() {
    const cx = S.conex || [], cables = S.objs.filter(esRed); htmlMarcas = '';
    if (!cables.length && !cx.length) return;
    const porId = new Map(S.objs.map(o => [o.id, o])), con = new Set(), usados = new Set();
    const vivas = cx.filter(c => {          // R8 (decisión del 13/11/2026): al borrar el cable se borra su conexión
      c.rutas = c.rutas.filter(id => { const L = porId.get(id); if (!L || !esRed(L) || con.has(id)) return false; con.add(id); return true; });
      return c.rutas.length;
    });
    let n = vivas.reduce((m, c) => Math.max(m, c.id), 0);
    for (const o of cables) if (!con.has(o.id)) vivas.push({ id: ++n, a: pend && pend.o === o && pend.p ? { d: o.pts[0].ref, p: pend.p } : null, b: null, rutas: [o.id] });
    const punta = (c, k) => { const L = porId.get(c.rutas[k == 'a' ? 0 : c.rutas.length - 1]); return [L, L.pts[k == 'a' ? 0 : L.pts.length - 1]]; };
    for (const c of vivas) for (const k of ['a', 'b']) {
      const [L, q] = punta(c, k), dev = q.ref != null ? porId.get(q.ref) : null, e = c[k];
      if (drag && drag.m == 'h' && drag.o === L) continue;                // se está arrastrando una punta de este cable: sus extremos se resuelven al soltar (si vuelve a su equipo, conserva el puerto)
      if (!dev) c[k] = null;                                            // R7: sin equipo en la punta
      else if (!e || e.d != dev.id) c[k] = { d: dev.id };                // la punta pasó a otro equipo: el puerto se limpia
      else if (e.p) { const p = puerto(dev, e.p), u = dev.id + '/' + e.p; if (!p || !sirve(p, L) || usados.has(u)) delete e.p; else usados.add(u); }
      if (!falta(c, k, id => porId.get(id)) || !puntoVisible(L, q)) continue;
      const p = dev || pt(q); htmlMarcas += `<circle class="inc" cx="${p.x}" cy="${p.y}" r=".17" fill="none" stroke="#e74c3c" stroke-width=".05" stroke-dasharray=".1 .07" pointer-events="none"/>`;
    }
    if (vivas.length) S.conex = vivas; else delete S.conex;
  }
  function asignar(cid, k, p, sinPaso) {   // pone (o quita, con p vacío) el puerto de un extremo; si otro cable del mismo equipo lo usaba, lo pierde. Un paso de historial
    const c = (S.conex || []).find(x => x.id == cid), e = c && c[k]; if (!e || (e.p || null) == (p || null)) return false;
    if (!sinPaso) push();
    if (p) { S.conex.forEach(x => ['a', 'b'].forEach(j => { if (x[j] && x[j].d == e.d && x[j].p == p) delete x[j].p; })); e.p = p; } else delete e.p;
    render(); return true;
  }

  // ---------- Elegir puerto (menú contextual sencillo) ----------
  const en = p => { const r = svg.getBoundingClientRect(); return { clientX: r.left + V.ox + p.x * V.z, clientY: r.top + V.oy + p.y * V.z }; };   // punto del plano -> posición en pantalla
  function menuPuertos(dev, cable, actual, e, cb, espera) {   // cb(id del puerto, o '-' = sin puerto); espera: el menú ignora el segundo clic de un doble clic (contexto.js)
    const oc = new Set(usos(dev).map(x => x.c[x.k].p)), ps = puertosDe(dev).filter(p => sirve(p, cable));
    if (!ps.length) { avisoEmergente(`«${nombre(dev)}» no tiene puertos para un cable ${cable.n}`); return false; }
    return TR.ctx.abrirItems('Puerto de ' + nombre(dev), [...ps.map(p => ({ id: p.id, texto: p.nombre + (p.id == actual ? ' ✓' : oc.has(p.id) ? ' (ocupado)' : p.off ? ' (apagado)' : ''), habil: p.id == actual || !oc.has(p.id) })), { id: '-', texto: 'Sin puerto', habil: true }], e, cb, espera);
  }
  function elegir(idLinea, k, e, sinPaso) { // menú de puertos del extremo k del cable; sinPaso: el cable se acaba de crear (su puerto entra en el mismo paso)
    const c = conexDe(idLinea), dev = c && c[k] && byId(c[k].d); if (!dev) return false;
    return menuPuertos(dev, byId(idLinea), c[k].p, e || en(dev), p => asignar(c.id, k, p == '-' ? null : p, sinPaso), sinPaso);   // recién dibujado: quien termina con doble clic no debe cerrar el menú ni empezar otro cable
  }
  const conPuertos = (cable, it) => !!it && esRed(cable) && grupos(it).length > 0;   // con ese cable, un clic sobre el equipo pide el puerto
  function alEmpezar(it, e) {              // primera punta de un cable nuevo (tmp); it = equipo con puertos bajo el clic, si lo hay
    pend = null; if (!it) return;
    const P = pend = { o: tmp }; menuPuertos(it, tmp, null, e, p => { if (p != '-') P.p = p; });
  }

  // ---------- Diálogo «Interfaces» de un equipo ----------
  const dlgI = document.createElement('dialog'); dlgI.id = 'dlg-if'; dlgI.setAttribute('aria-labelledby', 'di-t');
  dlgI.innerHTML = '<h3 id="di-t"></h3><div class="di-h"><span>Puerto</span><span>Activo</span><span>Descripción</span><span>Cable conectado</span></div><div id="di-g"></div><div class="acc"><button type="button" id="di-x" class="prim">Cerrar</button></div>';
  document.body.appendChild(dlgI);
  const filasI = dlgI.querySelector('#di-g'); let devId = null;
  function remoto(x) { const r = x.c[otro(x.k)], d = r && byId(r.d), p = d && r.p && puerto(d, r.p); return 'Cable a ' + (d ? nombre(d) + (p ? ' · ' + p.nombre : '') : 'extremo libre'); }
  function pintar() {
    const o = byId(devId); if (!o) { cerrar(); return; }
    const us = usos(o); dlgI.querySelector('#di-t').textContent = 'Interfaces de ' + nombre(o);
    filasI.innerHTML = puertosDe(o).map(p => {
      const ed = x => esEditable(byId(x.c.rutas[0])), suyo = us.find(x => x.c[x.k].p == p.id);   // un cable de una capa bloqueada no se conecta ni se desconecta desde aquí
      const op = us.filter(x => sirve(p, byId(x.c.rutas[0]))).map(x => `<option value="${x.c.id}${x.k}"${x === suyo ? ' selected' : ''}${ed(x) ? '' : ' disabled'}>${esc(remoto(x))}</option>`).join('');
      return `<div class="di-r" data-p="${p.id}"><b title="${esc(p.tipo || '')}">${esc(p.nombre)}</b><input type="checkbox" aria-label="Puerto activo"${p.off ? '' : ' checked'}><input type="text" maxlength="100" autocomplete="off" aria-label="Descripción del puerto" value="${esc(p.desc || '')}">`
        + `<select aria-label="Cable conectado"${op && (!suyo || ed(suyo)) ? '' : ' disabled'}><option value="">${op ? '— libre —' : 'Sin cables'}</option>${op}</select></div>`;
    }).join('');
  }
  function abrir(id) { const o = byId(id); if (!o || !grupos(o).length) return false; devId = id; pintar(); dlgI.showModal(); return true; }
  function cerrar() { if (dlgI.open) dlgI.close(); }
  dlgI.querySelector('#di-x').onclick = cerrar;
  filasI.onchange = e => {
    const r = e.target.closest('[data-p]'), o = byId(devId), t = e.target; if (!r || !o) return; const pid = r.dataset.p;
    if (t.tagName == 'SELECT') {             // conectar a este puerto uno de los cables del equipo, o dejarlo libre
      const act = usos(o).find(x => x.c[x.k].p == pid);
      if (t.value) asignar(+t.value.slice(0, -1), t.value.slice(-1), pid); else if (act) asignar(act.c.id, act.k, null);
      pintar();                              // solo aquí cambian las otras filas; al editar estado o descripción no se repinta (se perdería el foco)
    } else {                                 // estado y descripción: sobrescrituras del equipo (o.po), un paso de historial
      const p = puerto(o, pid), off = t.type == 'checkbox' ? !t.checked : !!p.off, desc = t.type == 'text' ? t.value.replace(ESQ.CTRL, '').trim() : p.desc;
      const po = { ...o.po }, v = { ...(off && { off: true }), ...(desc && { desc }) };   // mismo orden de campos que deja esquema.js
      if (JSON.stringify(v) == JSON.stringify(po[pid] || {})) return;   // nada cambió (p. ej. solo espacios): sin paso de historial
      push(); if (Object.keys(v).length) po[pid] = v; else delete po[pid];
      if (Object.keys(po).length) o.po = po; else delete o.po; render();
    }
  };

  // ---------- Menú contextual e inspector ----------
  function txtExt(idLinea, k) {
    const c = conexDe(idLinea), e = c && c[k], d = e && byId(e.d); if (!d) return 'sin equipo';
    const p = e.p && puerto(d, e.p); return nombre(d) + ' · ' + (p ? p.nombre : grupos(d).length ? 'sin puerto' : 'no tiene puertos');
  }
  const firma = o => esRed(o) ? txtExt(o.id, 'a') + '|' + txtExt(o.id, 'b') : '';   // el inspector rehace sus botones cuando cambian los extremos
  TR.acc.registrar({ id: 'con-ifs', grupo: 'editar', donde: ['menu', 'insp'], texto: 'Interfaces…', aplica: os => os.length == 1 && os[0].k == 'item' && grupos(os[0]).length > 0, ejecutar: os => abrir(os[0].id) });
  for (const k of ['a', 'b']) TR.acc.registrar({
    id: 'con-' + k, grupo: 'editar', donde: ['menu', 'insp'], texto: os => `Extremo ${k.toUpperCase()}: ${txtExt(os[0].id, k)}`, aplica: os => os.length == 1 && esRed(os[0]),
    habilitada: os => { const c = conexDe(os[0].id), d = c && c[k] && byId(c[k].d); return !!d && grupos(d).length > 0; }, ejecutar: (os, extra) => elegir(os[0].id, k, extra && extra.punto && en(extra.punto))
  });
  CAT.Cables.forEach(t => {                // tipo de cable: cambia nombre, subtipo y trazo (D16: el color es el de su tipo); los puertos que no sirven para el tipo nuevo se limpian al sincronizar
    const s = subDe(t);
    TR.acc.registrar({ id: 'cab-' + s, grupo: 'cable', texto: t.n, aplica: os => os.length > 0 && os.every(esRed), marca: os => os.every(o => subDe(o) == s),
      ejecutar: os => { const ch = os.filter(o => subDe(o) != s); if (!ch.length) return false; push(); ch.forEach(o => Object.assign(o, { n: t.n, sub: s, c: t.c, w: t.w, d: t.d })); render(); } });
  });

  return { esRed, puerto, puertosDe, conexDe, falta, sincronizar, marcas: () => htmlMarcas, asignar, elegir, conPuertos, alEmpezar, abrir, cerrar, abierto: () => dlgI.open, firma };
})();
