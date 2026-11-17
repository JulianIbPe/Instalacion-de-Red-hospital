// ===== redes.js: redes automáticas, VLAN y etiquetas físicas (Fase 7B) =====
// Dos cosas distintas, con nombres distintos:
// · REDES (automáticas, decisión del usuario del 15/11/2026): NO se guardan, se calculan de las conexiones (automaticas). Como en Packet Tracer, cada
//   puerto ENRUTADO conectado crea una red, que abarca todo lo que se alcanza desde él a través de equipos que solo conmutan, hasta el próximo puerto
//   enrutado (un enlace router–router es una sola red con sus dos puertos). Qué puertos enrutan (clase, por el `sub` del equipo y el grupo del puerto):
//     · router y firewall: todos sus puertos;
//     · router hogareño: solo su primer grupo de puertos (g0, «Internet»); los de LAN conmutan entre sí;
//     · switch multicapa: conmuta, salvo los puertos marcados «enrutado» en «Interfaces» (o.po[puerto].l3, el `no switchport` de Cisco);
//     · switch, punto de acceso y demás inalámbricos: conmutan (unen todos sus puertos en la misma red);
//     · el resto (PC, servidor, impresora…) son equipos finales: ni enrutan ni unen sus puertos.
//   Solo cuentan las conexiones completas por cables que llevan red (cuenta). Las VLAN no parten las redes. Una isla sin ningún puerto enrutado no es una red.
// · VLAN (manuales): S.vlans = [{id: 'r1', nombre, vlan?, subred?, color}] (entran en el historial y en el archivo). Se asignan al PUERTO:
//   o.po['g0:3'].vlan = 'r1', desde el diálogo «Interfaces» (conexiones.js). No tienen que ver con las capas del editor (D10).
//   sincronizar() (lo llama renderObjetos) suelta de los puertos las VLAN que ya no existen: así borrar una VLAN, pegar un equipo copiado antes de
//   borrarla o deshacer nunca dejan un puerto apuntando a una VLAN ajena.
// Etiquetas físicas: junto a cada extremo de cable que tiene puerto, el nombre corto de ese puerto («Gi2»), o el texto propio del extremo
//   (conex.etqA / etqB), con el color de la VLAN del puerto. Se activan con el botón «Etiquetas» (estado de la vista: fuera de S, empieza apagado)
//   y se dibujan dentro de #c, así salen en el PNG; apagadas, #c queda idéntico. El cable conserva el color de su tipo (D16).
TR.red = (() => {
  const COLORES = ['#2e86de', '#27ae60', '#e67e22', '#8e44ad', '#c0392b', '#16a085', '#7f8c8d', '#d35400'], MAX = 500, MAX_ID = 999999;   // MAX_ID: el esquema admite ids hasta r999999
  const nombre = o => o.label || o.n || 'Equipo';
  const corto = p => p.nombre.replace(/^GigabitEthernet ?/, 'Gi').replace(/^FastEthernet ?/, 'Fa');

  // ---------- Redes automáticas ----------
  const ENRUTAN = ['router', 'firewall'], CONMUTAN = ['switch', 'punto-acceso', 'inalambrico'];
  function clase(o, pid) {                 // 'l3' = puerto enrutado (crea una red) · 'l2' = conmuta (une los puertos del equipo) · 'fin' = equipo final
    const s = subDe(o);
    if (ENRUTAN.includes(s)) return 'l3';
    if (s == 'multilayer') return pid && (TR.con.puerto(o, pid) || {}).l3 ? 'l3' : 'l2';
    if (s == 'router-hogar') return pid && String(pid).startsWith('g0:') ? 'l3' : 'l2';   // por el grupo del puerto, no por su nombre visible
    return CONMUTAN.includes(s) ? 'l2' : 'fin';
  }
  const cuenta = (c, get = byId) => !TR.con.falta(c, 'a', get) && !TR.con.falta(c, 'b', get) && !['consola', 'usb'].includes(TR.con.esParche(c) ? (TR.con.puerto(get(c.a.d), c.a.p) || {}).tipo : subDe(get(c.rutas[0])));   // la conexión forma red: completa y por un cable que no es de consola ni USB
  function automaticas() {                 // {redes: [{nombre, puertos: [{d, p}], equipos: [ids], texto}], redDe(o, pid) -> nombre de la red de ese puerto}
    const porId = new Map(S.objs.map(o => [o.id, o])), get = id => porId.get(id), padre = new Map(), l3 = new Map(), enlaces = [];
    const raiz = k => { while (padre.get(k) !== k) k = padre.get(k); return k; };
    const clave = (o, pid, cid) => clase(o, pid) == 'l2' ? 'd' + o.id : 'd' + o.id + '/' + (pid || 'c' + cid);   // un equipo que conmuta es un solo nodo; en los demás, cada puerto es el suyo
    for (const c of S.conex || []) {
      if (!cuenta(c, get)) continue;
      const ks = ['a', 'b'].map(k => {
        const o = get(c[k].d), key = clave(o, c[k].p, c.id); if (!padre.has(key)) padre.set(key, key);
        if (clase(o, c[k].p) == 'l3' && !l3.has(key)) l3.set(key, { d: o.id, p: c[k].p });
        return key;
      });
      padre.set(raiz(ks[0]), raiz(ks[1])); enlaces.push([ks[0], c]);
    }
    const grupos = new Map();              // raíz -> red; se numeran por el orden en que se cableó su primer puerto enrutado
    for (const [key, x] of l3) { const r = raiz(key); if (!grupos.has(r)) grupos.set(r, { puertos: [], equipos: new Set() }); grupos.get(r).puertos.push(x); }
    for (const [k, c] of enlaces) { const g = grupos.get(raiz(k)); if (g) g.equipos.add(c.a.d).add(c.b.d); }
    const redes = [...grupos.entries()].map(([r, g], i) => ({
      raiz: r, nombre: 'Red ' + (i + 1), puertos: g.puertos, equipos: [...g.equipos],
      texto: g.puertos.map(x => { const o = get(x.d), p = x.p && TR.con.puerto(o, x.p); return nombre(o) + (p ? ' ' + corto(p) : ''); }).join(' — ')
    }));
    const redDe = (o, pid) => { const k = clave(o, pid); return padre.has(k) ? (redes.find(r => r.raiz == raiz(k)) || {}).nombre : undefined; };
    return { redes, redDe };
  }

  // ---------- VLAN ----------
  const lista = () => S.vlans || [], de = id => lista().find(v => v.id == id);
  const rotulo = v => v.vlan ? `VLAN ${v.vlan} · ${v.nombre}` : v.nombre;
  const orden = v => ({ id: v.id, nombre: v.nombre, ...(v.vlan && { vlan: v.vlan }), ...(v.subred && { subred: v.subred }), color: v.color });   // mismo orden de campos que deja esquema.js
  const usan = id => S.objs.reduce((n, o) => n + Object.values(o.po || {}).filter(p => p.vlan == id).length, 0);   // puertos que tienen esa VLAN
  function sincronizar() {                 // lo llama renderObjetos: ningún puerto queda apuntando a una VLAN que no existe (idempotente; corre después del push() de la acción)
    const ids = new Set(lista().map(v => v.id));
    S.objs.forEach(o => { for (const pid of Object.keys(o.po || {})) { const v = (o.po[pid] || {}).vlan; if (v && !ids.has(v)) TR.con.fijarPuerto(o, pid, { vlan: undefined }); } });
  }
  function crear() {                       // VLAN nueva con número, nombre y color automáticos; devuelve su id. Un paso de historial
    const n = lista().reduce((m, v) => Math.max(m, +v.id.slice(1)), 0) + 1, usados = new Set(lista().map(v => v.vlan));
    if (lista().length >= MAX || n > MAX_ID) { avisoEmergente(`Un proyecto admite hasta ${MAX} VLAN`); return null; }
    let num = 10; while (usados.has(num) && num <= 4090) num += 10;   // 10, 20, 30…: el primero libre
    push(); S.vlans = [...lista(), orden({ id: 'r' + n, nombre: 'VLAN' + String(num).padStart(4, '0'), vlan: num <= 4094 ? num : undefined, color: COLORES[(n - 1) % COLORES.length] })]; render(); return 'r' + n;
  }
  function fijar(id, k, crudo) {           // cambia nombre, vlan, subred o color; false = valor no válido (no cambia nada ni guarda historial)
    const r = de(id); if (!r) return false; let v = String(crudo).replace(ESQ.CTRL, '').trim();
    if (k == 'nombre') { v = v.slice(0, ESQ.LIM.nombre); if (!v) return false; }
    else if (k == 'vlan') { if (v) { if (!/^\d{1,4}$/.test(v) || +v < 1 || +v > 4094) return false; v = +v; } }
    else if (k == 'subred') v = v.slice(0, 50);
    else if (k == 'color') { v = v.toLowerCase(); if (!/^#[0-9a-f]{6}$/.test(v)) return false; }
    else return false;
    if ((r[k] === undefined ? '' : r[k]) === v) return true;
    push(); S.vlans = lista().map(x => x === r ? orden({ ...r, [k]: v }) : x); render(); return true;
  }
  function borrar(id) {                    // quita la VLAN (con confirmación si está en uso); sus puertos quedan sin VLAN en el mismo paso (sincronizar)
    const r = de(id); if (!r) return false; const n = usan(id);
    if (n && !confirm(`${n} puerto(s) usan la VLAN «${r.nombre}» y van a quedar sin VLAN. ¿Borrarla?`)) return false;
    push(); S.vlans = lista().filter(x => x !== r); if (!S.vlans.length) delete S.vlans;
    render(); return true;
  }

  // ---------- Diálogo «Redes y VLAN» ----------
  const dlgR = document.createElement('dialog'); dlgR.id = 'dlg-red'; dlgR.setAttribute('aria-labelledby', 'dr-t');
  dlgR.innerHTML = '<h3 id="dr-t">Redes y VLAN</h3><h4>Redes</h4><p class="dr-n">Se crean solas: cada puerto enrutado conectado (router, firewall, puerto «Internet» de un router hogareño o puerto «enrutado» de un switch multicapa) forma una red.</p><div id="dr-a"></div>'
    + '<h4>VLAN</h4><p class="dr-n">Las creás vos y las asignás a los puertos desde el menú «Interfaces…» de cada equipo.</p>'
    + '<div class="dr-h"><span>Nombre</span><span>VLAN</span><span>Subred</span><span>Color</span><span></span></div><div id="dr-g"></div>'
    + '<div class="acc"><button type="button" id="dr-add">＋ Agregar VLAN</button><button type="button" id="dr-x" class="prim">Cerrar</button></div>';
  document.body.appendChild(dlgR);
  const filasR = dlgR.querySelector('#dr-g');
  function pintar() {
    dlgR.querySelector('#dr-a').innerHTML = automaticas().redes.map(r => `<div class="dr-au"><b>${r.nombre}</b><span>${esc(r.texto)}</span><i>${r.equipos.length} equipos</i></div>`).join('') || '<p class="vacio">Todavía no hay redes.</p>';
    filasR.innerHTML = lista().map(v => `<div class="dr-r" data-r="${v.id}"><input type="text" data-k="nombre" maxlength="${ESQ.LIM.nombre}" autocomplete="off" aria-label="Nombre de la VLAN" value="${esc(v.nombre)}">`
      + `<input type="number" data-k="vlan" min="1" max="4094" step="1" aria-label="Número de VLAN" value="${v.vlan || ''}"><input type="text" data-k="subred" maxlength="50" autocomplete="off" placeholder="192.168.10.0/24" aria-label="Subred" value="${esc(v.subred || '')}">`
      + `<input type="color" data-k="color" aria-label="Color de la VLAN" value="${v.color}"><button type="button" data-q title="Borrar esta VLAN" aria-label="Borrar la VLAN ${esc(v.nombre)}">✕</button></div>`).join('')
      || '<p class="vacio">Todavía no hay VLAN.</p>';
  }
  function abrir() { pintar(); dlgR.showModal(); }
  function cerrar() { if (dlgR.open) dlgR.close(); }
  dlgR.querySelector('#dr-x').onclick = cerrar;
  dlgR.querySelector('#dr-add').onclick = () => { if (crear()) { pintar(); const f = filasR.lastElementChild.querySelector('input'); f.focus(); f.select(); } };
  filasR.onchange = e => {                 // un valor no válido vuelve al anterior (un número mal escrito llega vacío: no debe borrar el número)
    const f = e.target.closest('[data-r]'), k = e.target.dataset.k; if (!f || !k) return;
    if ((e.target.validity && e.target.validity.badInput) || !fijar(f.dataset.r, k, e.target.value)) pintar();
  };
  filasR.onclick = e => { const b = e.target.closest('[data-q]'); if (b && borrar(b.closest('[data-r]').dataset.r)) pintar(); };
  $('#bredes').onclick = abrir;

  // ---------- Etiquetas físicas ----------
  let ver = false;
  function verEtiquetas(v) { ver = !!v; const b = $('#betq'); b.classList.toggle('on', ver); b.setAttribute('aria-pressed', ver); render(); }
  $('#betq').onclick = () => verEtiquetas(!ver);
  function textoEtq(c, k, get = byId) {    // texto de la etiqueta del extremo k de la conexión ('' si ese extremo no tiene puerto): el propio o, si no hay, el puerto («Gi2»)
    const e = c[k], d = e && get(e.d), p = d && e.p && TR.con.puerto(d, e.p);
    return p ? c['etq' + k.toUpperCase()] || corto(p) : '';
  }
  function etiquetas() {                   // SVG de las etiquetas (lo agrega renderObjetos dentro de #c); apagadas = ''
    if (!ver || !S.conex) return '';
    const porId = new Map(S.objs.map(o => [o.id, o])), get = id => porId.get(id), pos = q => (q.ref != null && get(q.ref)) || pt(q); let h = '';
    for (const c of S.conex) for (const k of ['a', 'b']) {
      const t = !TR.con.esParche(c) && textoEtq(c, k, get); if (!t) continue;   // un patch cord (sin ruta) no tiene cable en el plano: sus etiquetas van en la vista del rack
      const L = get(c.rutas[k == 'a' ? 0 : c.rutas.length - 1]), n = L.pts.length, q = L.pts[k == 'a' ? 0 : n - 1]; if (n < 2 || !puntoVisible(L, q)) continue;   // un cable de un solo punto (archivo dañado) no tiene hacia dónde poner la etiqueta
      const a = pos(q), b = pos(L.pts[k == 'a' ? 1 : n - 2]), len = Math.hypot(b.x - a.x, b.y - a.y) || 1, d = Math.min(.8, len * .4), v = de(TR.con.puerto(get(c[k].d), c[k].p).vlan);   // sobre el cable, a 0,8 m del equipo (o al 40 % de un tramo corto)
      h += TR.fil.envolver(L, `<text class="etq" x="${r3(a.x + (b.x - a.x) * d / len)}" y="${r3(a.y + (b.y - a.y) * d / len - .12)}" font-size=".2" text-anchor="middle" fill="${v ? v.color : '#1d2a2f'}" stroke="#fff" stroke-width=".06" paint-order="stroke" font-family="Segoe UI,Arial,sans-serif" pointer-events="none">${esc(t)}</text>`);   // F10: la etiqueta sigue al filtro de su cable
    }
    return h;
  }
  for (const k of ['a', 'b']) {            // texto propio de la etiqueta de un extremo (vacío = la automática)
    const K = 'etq' + k.toUpperCase();
    TR.acc.registrar({
      id: 'etq-' + k, grupo: 'editar', donde: ['menu', 'insp'], texto: `Etiqueta del extremo ${k.toUpperCase()}…`, aplica: os => os.length == 1 && TR.con.esRed(os[0]),
      habilitada: os => { const c = TR.con.conexDe(os[0].id); return !!c && !!textoEtq(c, k); },
      ejecutar: os => {
        const c = TR.con.conexDe(os[0].id), act = c[K] || '', v = prompt('Texto de la etiqueta (vacío = la automática):', textoEtq(c, k)); if (v === null) return false;
        const auto = textoEtq({ ...c, [K]: undefined }, k), t = v.replace(ESQ.CTRL, '').trim().slice(0, 100), nuevo = t == auto ? '' : t; if (nuevo == act) return false;
        push(); if (nuevo) c[K] = nuevo; else delete c[K];
        const { etqA, etqB } = c; delete c.etqA; delete c.etqB; if (etqA) c.etqA = etqA; if (etqB) c.etqB = etqB;   // mismo orden de campos que deja esquema.js
        verEtiquetas(true);                // se prenden para que el cambio se vea
      }
    });
  }

  return { vlan: { lista, de, rotulo, crear, fijar, borrar }, clase, cuenta, automaticas, sincronizar, abrir, cerrar, etiquetas, textoEtq, verEtiquetas, viendo: () => ver };
})();
