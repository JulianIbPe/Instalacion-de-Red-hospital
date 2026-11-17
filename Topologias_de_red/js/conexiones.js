// ===== conexiones.js: puertos y conexiones (Fase 7A, D1) =====
// S.conex = [{id, a, b, rutas}]: una conexión por cada cable de red (el «Cable de energía» no lleva). a / b = null (la punta no está sobre un equipo)
//   o {d: id del equipo, p?: id del puerto}. rutas = ids de sus líneas (hoy una; es lista para la F9).
// F8B: una conexión SIN ruta (rutas = []) es un patch cord entre dos equipos montados en el mismo rack (parche / quitar): no tiene línea en el plano,
//   se ve en la vista del rack y vive mientras sus dos equipos sigan en ese rack con esos puertos. Un extremo de cable sobre un rack con equipos pide
//   primero el equipo y después el puerto (menuEquipos): la punta queda unida al equipo, que está donde está su rack.
// Puertos: salen de la plantilla del modelo (grupos {g, n, tipo, pref}); su id es `grupo:índice` («g0:3»). El equipo solo guarda sobrescrituras en
//   o.po = {'g0:3': {off: true, desc: '…', vlan: 'r1', l3: true}} (vlan = su VLAN, l3 = puerto enrutado de un switch multicapa; ver redes.js). Solo se escribe con fijarPuerto, que le da la forma que valida esquema.js (ESQ.puertoPo). «Ocupado» no se guarda: se deduce de S.conex.
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
  const esParche = c => !c.rutas.length;   // F8B: patch cord = conexión sin ruta
  const enRack = r => r && TR.rack.esRack(r) ? TR.rack.hijosDe(r).filter(o => grupos(o).length) : [];   // F8B: equipos con puertos montados en el rack r
  const pidePuerto = d => grupos(d).length > 0 || enRack(d).length > 0;   // el equipo tiene puertos, o es un rack con equipos que los tienen
  const falta = (c, k, get = byId) => { const e = c[k], d = e && get(e.d); return !d ? 'equipo' : !e.p && pidePuerto(d) ? 'puerto' : null; };   // qué le falta a un extremo para estar completo (null = nada)
  const puertosDe = o => grupos(o).flatMap(G => Array.from({ length: G.n }, (_, i) => puerto(o, G.g + ':' + i)));
  function poCon(o, pid, cambios) {        // o.po con esos cambios en el puerto pid, con la forma de esquema.js; null si no cambiaría nada
    const po = { ...o.po }, v = ESQ.puertoPo({ ...po[pid], ...cambios });
    if (JSON.stringify(v || {}) == JSON.stringify(po[pid] || {})) return null;
    if (v) po[pid] = v; else delete po[pid]; return po;
  }
  function fijarPuerto(o, pid, cambios) {  // ÚNICO lugar que escribe o.po (sin push ni render: los pone quien llama); devuelve si cambió algo
    const po = poCon(o, pid, cambios); if (!po) return false;
    if (Object.keys(po).length) o.po = po; else delete o.po; return true;
  }
  const conexDe = idLinea => (S.conex || []).find(c => c.rutas.includes(idLinea));
  const usos = o => (S.conex || []).flatMap(c => ['a', 'b'].filter(k => c[k] && c[k].d == o.id).map(k => ({ c, k })));   // extremos de conexión que llegan al equipo
  const otro = k => k == 'a' ? 'b' : 'a';

  let htmlMarcas = '';
  function sincronizar() {
    const cx = S.conex || [], cables = S.objs.filter(esRed); htmlMarcas = '';
    if (!cables.length && !cx.length) return;
    const porId = new Map(S.objs.map(o => [o.id, o])), con = new Set(), usados = new Set();
    const vivas = cx.filter(c => {          // R8 (decisión del 13/11/2026): al borrar el cable se borra su conexión
      if (esParche(c)) return true;         // F8B: nació sin ruta (se valida más abajo)
      c.rutas = c.rutas.filter(id => { const L = porId.get(id); if (!L || !esRed(L) || con.has(id)) return false; con.add(id); return true; });
      return c.rutas.length;
    });
    let n = vivas.reduce((m, c) => Math.max(m, c.id), 0);
    for (const o of cables) if (!con.has(o.id)) { vivas.push({ id: ++n, a: o.p0 ? { d: o.pts[0].ref, p: o.p0 } : null, b: null, rutas: [o.id] }); delete o.p0; }   // o.p0: puerto elegido para la primera punta mientras se dibujaba (campo transitorio, como tmp.cur)
    const punta = (c, k) => { const L = porId.get(c.rutas[k == 'a' ? 0 : c.rutas.length - 1]); return [L, L.pts[k == 'a' ? 0 : L.pts.length - 1]]; };
    const parcheOk = c => {                // F8B: sus dos equipos siguen montados en el mismo rack, con esos puertos y sin que otra conexión los use
      const A = c.a && porId.get(c.a.d), B = c.b && porId.get(c.b.d), ua = A && A.id + '/' + c.a.p, ub = B && B.id + '/' + c.b.p;
      if (!A || !B || A === B || !A.ru || !B.ru || A.parent != B.parent || !c.a.p || !c.b.p || !puerto(A, c.a.p) || !puerto(B, c.b.p) || usados.has(ua) || usados.has(ub)) return false;
      usados.add(ua); usados.add(ub); return true;
    };
    const rotas = new Set();
    for (const c of vivas) { if (esParche(c)) { if (!parcheOk(c)) rotas.add(c); continue; } for (const k of ['a', 'b']) {
      const [L, q] = punta(c, k), dev = q.ref != null ? porId.get(q.ref) : null, e = c[k];
      if (drag && drag.m == 'h' && drag.o === L) continue;                // se está arrastrando una punta de este cable: sus extremos se resuelven al soltar (si vuelve a su equipo, conserva el puerto)
      if (!dev) { c[k] = null; delete c['etq' + k.toUpperCase()]; }      // R7: sin equipo en la punta (su etiqueta propia tampoco queda)
      else if (!e || e.d != dev.id) { c[k] = { d: dev.id }; delete c['etq' + k.toUpperCase()]; }   // la punta pasó a otro equipo: el puerto y la etiqueta propia se limpian
      else if (e.p) { const p = puerto(dev, e.p), u = dev.id + '/' + e.p; if (!p || !sirve(p, L) || usados.has(u)) delete e.p; else usados.add(u); }
      if (!falta(c, k, id => porId.get(id)) || !puntoVisible(L, q) || TR.fil.oculto(L)) continue;   // F10: un cable oculto por un filtro no muestra su marca
      const p = dev || pt(q); htmlMarcas += `<circle class="inc" cx="${p.x}" cy="${p.y}" r=".17" fill="none" stroke="#e74c3c" stroke-width=".05" stroke-dasharray=".1 .07" pointer-events="none"/>`;
    } }
    const fin = vivas.filter(c => !rotas.has(c)); if (fin.length) S.conex = fin; else delete S.conex;
  }
  function asignar(cid, k, p, sinPaso) {   // pone (o quita, con p vacío) el puerto de un extremo; si otro cable del mismo equipo lo usaba, lo pierde. Un paso de historial
    const c = (S.conex || []).find(x => x.id == cid), e = c && c[k]; if (!e || (e.p || null) == (p || null)) return false;
    if (!sinPaso) push();
    if (p) { S.conex.forEach(x => ['a', 'b'].forEach(j => { if (x[j] && x[j].d == e.d && x[j].p == p) delete x[j].p; })); e.p = p; } else delete e.p;
    render(); return true;
  }

  // ---------- Patch cords (F8B): conexiones sin ruta entre equipos del mismo rack ----------
  function parche(a, b) {                  // a, b = {d, p}; devuelve el aviso si no se puede (y no cambia nada). Un paso de historial
    const A = byId(a.d), B = byId(b.d), pa = A && puerto(A, a.p), pb = B && puerto(B, b.p);
    if (!pa || !pb || A === B || !A.ru || !B.ru || A.parent != B.parent) return 'Un patch cord une dos equipos distintos del mismo rack';
    if ((pa.tipo || '') != (pb.tipo || '')) return `«${pa.nombre}» y «${pb.nombre}» no son puertos del mismo tipo`;
    if ([[A, a.p], [B, b.p]].some(([o, p]) => usos(o).some(x => x.c[x.k].p == p))) return 'Ese puerto ya está ocupado';
    push(); S.conex = [...(S.conex || []), { id: (S.conex || []).reduce((m, c) => Math.max(m, c.id), 0) + 1, a: { d: A.id, p: a.p }, b: { d: B.id, p: b.p }, rutas: [] }]; render(); return null;
  }
  function quitar(cid) {                   // borra un patch cord (una conexión con cable se borra borrando el cable, R8)
    const c = (S.conex || []).find(x => x.id == cid); if (!c || !esParche(c)) return false;
    push(); S.conex = S.conex.filter(x => x !== c); if (!S.conex.length) delete S.conex; render(); return true;
  }

  // ---------- Elegir puerto (menú contextual sencillo) ----------
  const en = p => { const r = svg.getBoundingClientRect(); return { clientX: r.left + V.ox + p.x * V.z, clientY: r.top + V.oy + p.y * V.z }; };   // punto del plano -> posición en pantalla
  function menuPuertos(dev, cable, actual, e, cb, espera) {   // cb(id del puerto, o '-' = sin puerto); espera: el menú ignora el segundo clic de un doble clic (contexto.js)
    const oc = new Set(usos(dev).map(x => x.c[x.k].p)), ps = puertosDe(dev).filter(p => sirve(p, cable));
    if (!ps.length) { avisoEmergente(`«${nombre(dev)}» no tiene puertos para un cable ${cable.n}`); return false; }
    return TR.ctx.abrirItems('Puerto de ' + nombre(dev), [...ps.map(p => ({ id: p.id, texto: p.nombre + (p.id == actual ? ' ✓' : oc.has(p.id) ? ' (ocupado)' : p.off ? ' (apagado)' : ''), habil: p.id == actual || !oc.has(p.id) })), { id: '-', texto: 'Sin puerto', habil: true }], e, cb, espera);
  }
  function menuEquipos(r, e, cb, espera) { // F8B: equipos con puertos del rack r; cb(equipo elegido)
    return TR.ctx.abrirItems('Equipo de ' + nombre(r), enRack(r).map(o => ({ id: o.id, texto: `${nombre(o)} (U ${o.ru.u})`, habil: true })), e, id => { const o = byId(id); if (o) cb(o); }, espera);
  }
  function elegir(idLinea, k, e, sinPaso) { // menú de puertos del extremo k del cable; sinPaso: el cable se acaba de crear (su puerto entra en el mismo paso)
    const c = conexDe(idLinea), dev = c && c[k] && byId(c[k].d); if (!dev) return false;
    if (enRack(dev).length) return menuEquipos(dev, e || en(dev), o => {   // la punta está sobre un rack: pasa al equipo elegido (mismo lugar) y después se pide su puerto, todo en un paso
      const L = byId(idLinea); if (!sinPaso) push();
      L.pts[k == 'a' ? 0 : L.pts.length - 1].ref = o.id; c[k] = { d: o.id }; render();
      menuPuertos(o, L, null, e || en(o), p => asignar(c.id, k, p == '-' ? null : p, true));
    }, sinPaso);
    return menuPuertos(dev, byId(idLinea), c[k].p, e || en(dev), p => asignar(c.id, k, p == '-' ? null : p, sinPaso), sinPaso);   // recién dibujado: quien termina con doble clic no debe cerrar el menú ni empezar otro cable
  }
  const conPuertos = (cable, it) => !!it && esRed(cable) && pidePuerto(it);   // con ese cable, un clic sobre el equipo pide el puerto
  function alEmpezar(it, e) {              // primera punta de un cable nuevo (tmp); it = equipo con puertos bajo el clic, si lo hay
    const t = tmp, pedir = o => menuPuertos(o, t, null, e, p => { if (p != '-') t.p0 = p; else delete t.p0; });
    if (it && enRack(it).length) menuEquipos(it, e, o => { t.pts[0].ref = o.id; pedir(o); });   // F8B: sobre un rack, primero el equipo
    else if (it) pedir(it);   // queda en el propio cable en curso; sincronizar lo pasa a su conexión al crearla
  }

  // ---------- Diálogo «Interfaces» de un equipo ----------
  const dlgI = document.createElement('dialog'); dlgI.id = 'dlg-if'; dlgI.setAttribute('aria-labelledby', 'di-t');
  dlgI.innerHTML = '<h3 id="di-t"></h3><div class="di-h"><span>Puerto</span><span>Activo</span><span>Descripción</span><span>Cable conectado</span><span>VLAN</span><span>Red</span></div><div id="di-g"></div><div class="acc"><button type="button" id="di-x" class="prim">Cerrar</button></div>';
  document.body.appendChild(dlgI);
  const filasI = dlgI.querySelector('#di-g'); let devId = null;
  function remoto(x) { const r = x.c[otro(x.k)], d = r && byId(r.d), p = d && r.p && puerto(d, r.p); return (esParche(x.c) ? 'Patch a ' : 'Cable a ') + (d ? nombre(d) + (p ? ' · ' + p.nombre : '') : 'extremo libre'); }
  function pintar() {
    const o = byId(devId); if (!o) { cerrar(); return; }
    const us = usos(o), vls = TR.red.vlan.lista(), auto = TR.red.automaticas(), ml = subDe(o) == 'multilayer'; dlgI.querySelector('#di-t').textContent = 'Interfaces de ' + nombre(o);
    filasI.innerHTML = puertosDe(o).map(p => {
      const ed = x => esParche(x.c) || esEditable(byId(x.c.rutas[0])), suyo = us.find(x => x.c[x.k].p == p.id);   // un cable de una capa bloqueada no se conecta ni se desconecta desde aquí
      const op = us.filter(x => esParche(x.c) ? x === suyo : sirve(p, byId(x.c.rutas[0]))).map(x => `<option value="${x.c.id}${x.k}"${x === suyo ? ' selected' : ''}${ed(x) ? '' : ' disabled'}>${esc(remoto(x))}</option>`).join('');
      return `<div class="di-r" data-p="${p.id}"><b title="${esc(p.tipo || '')}">${esc(p.nombre)}</b><input type="checkbox" data-k="off" aria-label="Puerto activo"${p.off ? '' : ' checked'}><input type="text" data-k="desc" maxlength="100" autocomplete="off" aria-label="Descripción del puerto" value="${esc(p.desc || '')}">`
        + `<select data-k="cable" aria-label="Cable conectado"${op && (!suyo || ed(suyo)) ? '' : ' disabled'}><option value="">${op ? '— libre —' : 'Sin cables'}</option>${op}</select>`
        + `<select data-k="vlan" aria-label="VLAN del puerto"${vls.length ? '' : ' disabled'}><option value="">${vls.length ? '—' : 'Sin VLAN'}</option>${vls.map(v => `<option value="${v.id}"${p.vlan == v.id ? ' selected' : ''}>${esc(TR.red.vlan.rotulo(v))}</option>`).join('')}</select>`   // F7B: la VLAN se asigna al puerto
        + `<span class="di-red">${ml ? `<input type="checkbox" data-k="l3" title="Puerto enrutado (no switchport): crea una red nueva" aria-label="Puerto enrutado"${p.l3 ? ' checked' : ''}>` : ''}${esc((suyo && TR.red.cuenta(suyo.c) && auto.redDe(o, p.id)) || '—')}</span></div>`;   // red automática del puerto, solo si su conexión forma red (redes.js); en un switch multicapa, la casilla lo marca como enrutado
    }).join('');
  }
  function abrir(id) { const o = byId(id); if (!o || !grupos(o).length) return false; devId = id; pintar(); dlgI.showModal(); return true; }
  function cerrar() { if (dlgI.open) dlgI.close(); }
  dlgI.querySelector('#di-x').onclick = cerrar;
  filasI.onchange = e => {                 // cada control lleva en data-k qué cambia: cable | off | desc | vlan | l3
    const r = e.target.closest('[data-p]'), o = byId(devId), t = e.target, k = t.dataset.k; if (!r || !o || !k) return; const pid = r.dataset.p;
    if (k == 'cable') {                      // conectar a este puerto uno de los cables del equipo, o dejarlo libre
      const act = usos(o).find(x => x.c[x.k].p == pid);
      if (t.value) asignar(+t.value.slice(0, -1), t.value.slice(-1), pid); else if (act) asignar(act.c.id, act.k, null);
    } else {                                 // sobrescrituras del equipo (o.po): un paso de historial, y solo si algo cambia (p. ej. una descripción de solo espacios no cambia nada)
      const cambios = { [k]: k == 'off' ? !t.checked : k == 'l3' ? t.checked : k == 'desc' ? t.value.replace(ESQ.CTRL, '').trim() : t.value };
      if (!poCon(o, pid, cambios)) return;
      push(); fijarPuerto(o, pid, cambios); render();
    }
    if (k == 'cable' || k == 'l3') pintar(); // solo entonces cambian las otras filas; al editar lo demás no se repinta (se perdería el foco)
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
    habilitada: os => { const c = conexDe(os[0].id), d = c && c[k] && byId(c[k].d); return !!d && pidePuerto(d); }, ejecutar: (os, extra) => elegir(os[0].id, k, extra && extra.punto && en(extra.punto))
  });
  // Tipo de cable: un campo como los demás (inspector y menú); cambia nombre, subtipo y trazo (D16: el color es el de su tipo). Los puertos que no sirven para el tipo nuevo se limpian al sincronizar
  const cableDe = s => CAT.Cables.find(t => subDe(t) == s);
  TR.acc.registrarCampo({ id: 'cable', sec: 'apar', et: 'Tipo de cable', t: 'sel', multi: true, opc: CAT.Cables.map(t => [subDe(t), t.n]), aplica: esRed, leer: subDe, parse: v => cableDe(v) ? v : undefined, poner: (o, v) => { const t = cableDe(v); Object.assign(o, { n: t.n, sub: v, c: t.c, w: t.w, d: t.d }); } });
  for (const [s, n] of TR.acc.campo('cable').opc) TR.acc.registrar({ id: 'cab-' + s, grupo: 'cable', texto: n, aplica: os => os.length > 0 && os.every(esRed), marca: os => os.every(o => subDe(o) == s), ejecutar: os => TR.acc.fijar(os.map(o => o.id), 'cable', s).ok });

  return { esRed, esParche, puerto, puertosDe, fijarPuerto, conexDe, usos, remoto, parche, quitar, falta, sincronizar, marcas: () => htmlMarcas, asignar, elegir, conPuertos, alEmpezar, abrir, cerrar, abierto: () => dlgI.open, firma, txtExt };
})();
