// ===== plantas.js: varias plantas por edificio y varias capas por planta (ocultar / bloquear como en AutoCAD) =====
// S.plantas = [{ id, nombre, ca (última capa usada), capas: [{ id, nombre, visible, bloqueada }] }]
// S.plantaAct / S.capaAct = planta y capa en las que se está trabajando. Cada objeto guarda su planta (pl) y su capa (cp).
// JERARQUÍA: el orden de los arreglos es de abajo hacia arriba (el último = el más alto). El panel los muestra al revés
// (arriba del panel = más alto). Se reordenan con ▲ ▼ o agarrando el asa ⠿ y arrastrando. Lo que está en una capa más alta se dibuja por encima de lo que hay en las capas inferiores.
const plantaActual = () => S.plantas.find(p => p.id == S.plantaAct);
const capaActual = () => plantaActual().capas.find(c => c.id == S.capaAct);
function capaDe(o) { const p = S.plantas.find(p => p.id == o.pl); return p && p.capas.find(c => c.id == o.cp); }
function rangoCapa(o) {                  // posición de la capa del objeto dentro de su planta (mayor = más arriba); lo que no tiene capa (lo que se está dibujando) va arriba de todo
  const p = S.plantas.find(p => p.id == o.pl), i = p ? p.capas.findIndex(c => c.id == o.cp) : -1; return i < 0 ? 1e9 : i;
}
function esVisible(o) {
  if (o.pl === undefined) return true;
  if (o.ru) { const r = byId(o.parent); return !!r && TR.vr.rack() == r.id && esVisible(r); }   // F8: un equipo montado en un rack solo se ve (y se edita) con la vista de ese rack abierta
  if (esMultiplanta(o)) return o.pts.some(q => puntoVisible(o, q)); const c = capaDe(o); return o.pl == S.plantaAct && !!c && c.visible;   // un cable que atraviesa plantas se ve en cada planta donde tiene puntos en una capa visible (trazas.js)
}
function esEditable(o) { if (o.pl === undefined) return true; if (esMultiplanta(o)) return o.pts.some(q => puntoEditable(o, q)); return esVisible(o) && !capaDe(o).bloqueada; }
const capaEditable = () => { const c = capaActual(); return c.visible && !c.bloqueada; };

function normalizar() {                  // deja S coherente: sirve también para abrir archivos antiguos (sin plantas)
  if (!S.plantas || !S.plantas.length) { const b = estadoInicial(S.unidad); S.plantas = b.plantas; S.plantaAct = b.plantaAct; S.capaAct = b.capaAct; }
  S.plantas.forEach(p => { if (!p.capas || !p.capas.length) p.capas = [{ id: 'c' + (++S.cn || 1), nombre: 'Base', visible: true, bloqueada: false }]; });
  const num = s => +String(s).slice(1) || 0;
  S.pn = Math.max(S.pn || 0, ...S.plantas.map(p => num(p.id)));
  S.cn = Math.max(S.cn || 0, ...S.plantas.flatMap(p => p.capas.map(c => num(c.id))));
  if (!S.plantas.some(p => p.id == S.plantaAct)) S.plantaAct = S.plantas[0].id;
  const p = plantaActual(); if (!p.capas.some(c => c.id == S.capaAct)) S.capaAct = (p.capas.find(c => c.id == p.ca) || p.capas[0]).id;
  S.objs = S.objs.filter(o => o.k != 'puerta' || S.objs.some(w => w.id == o.pared));   // puertas sin pared: se quitan
  S.objs.forEach(o => { if (o.k == 'medida' && !o.u) o.u = S.unidad; });   // mediciones antiguas: se quedan en la unidad que tenía el archivo
  S.objs.forEach(o => { if (o.k == 'line') o.pts = o.pts.map(q => { const t = q.ref && byId(q.ref); return t && esEscalera(t) ? { x: t.x, y: t.y } : q; }); });   // paredes antiguas unidas a una escalera: se sueltan
  S.objs.forEach(o => { if (o.k == 'item' && esEscalera(o) && !o.c) o.c = '#444444'; });   // escaleras antiguas: reciben el color de pared
  S.objs.forEach(o => {                  // todo objeto debe pertenecer a una planta y una capa que existan
    const q = S.plantas.find(q => q.id == o.pl) || S.plantas[0]; o.pl = q.id;
    if (!q.capas.some(c => c.id == o.cp)) o.cp = q.capas[0].id;
    if (o.k == 'line') o.pts.forEach(p => { if (p.pl) { const pp = S.plantas.find(x => x.id == p.pl); if (!pp) { delete p.pl; delete p.cp; } else if (!pp.capas.some(c => c.id == p.cp)) p.cp = pp.capas[0].id; } });   // planta y capa de cada punto de un cable
  });
  soltarTrazasHuerfanas();
}

function panel() {                       // dibuja el panel de abajo a la derecha (solo se rehace cuando cambian plantas o capas)
  const nP = S.plantas.length;
  $('#plantas').innerHTML = `<div class="ph"><b>Plantas</b><button data-a="np" title="Añadir una planta">＋ Planta</button></div><div class="hint">Arriba = más alto. Arrastra ⠿ o usa ▲ ▼ para cambiar el orden.</div>` + [...S.plantas].reverse().map(p => {
    const on = p.id == S.plantaAct, ip = S.plantas.indexOf(p);
    let h = `<div class="pl ${on ? 'on' : ''}" data-row="p" data-id="${p.id}"><span class="gr" data-g="1" title="Arrastra para mover la planta">⠿</span><button class="pn" data-a="sp" data-p="${p.id}">${esc(p.nombre)}</button>` + (on ? `<button data-a="mp" data-d="1" ${ip >= nP - 1 ? 'disabled' : ''} title="Subir planta">▲</button><button data-a="mp" data-d="-1" ${ip <= 0 ? 'disabled' : ''} title="Bajar planta">▼</button><button data-a="cpp" title="Copiar planta (con sus capas y objetos)">⧉</button><button data-a="rp" title="Renombrar planta">✎</button><button data-a="dp" title="Borrar planta">🗑️</button>` : '') + `</div>`;
    const nC = p.capas.length;
    if (on) h += `<div class="capas">` + [...p.capas].reverse().map(c => {
      const ic = p.capas.indexOf(c);
      return `<div class="cp ${c.id == S.capaAct ? 'on' : ''}" data-row="c" data-id="${c.id}"><span class="gr" data-g="1" title="Arrastra para mover la capa">⠿</span><button data-a="vc" data-c="${c.id}" title="${c.visible ? 'Ocultar' : 'Mostrar'} capa">${c.visible ? '👁️' : '🚫'}</button><button data-a="bc" data-c="${c.id}" title="${c.bloqueada ? 'Desbloquear' : 'Bloquear'} capa">${c.bloqueada ? '🔒' : '🔓'}</button><button class="cn ${c.visible ? '' : 'off'}" data-a="sc" data-c="${c.id}" title="Trabajar en esta capa">${esc(c.nombre)}</button><button data-a="mc" data-c="${c.id}" data-d="1" ${ic >= nC - 1 ? 'disabled' : ''} title="Subir capa (más jerarquía)">▲</button><button data-a="mc" data-c="${c.id}" data-d="-1" ${ic <= 0 ? 'disabled' : ''} title="Bajar capa (menos jerarquía)">▼</button><button data-a="cpc" data-c="${c.id}" title="Copiar capa (con sus objetos)">⧉</button><button data-a="rc" data-c="${c.id}" title="Renombrar capa">✎</button><button data-a="dc" data-c="${c.id}" title="Quitar capa">✕</button></div>`;
    }).join('') + `<button class="addc" data-a="nc">＋ Capa</button></div>`;
    return h;
  }).join('');
}

const limpiarSel = () => { sel = null; multi = []; tmp = null; drag = null; };
// ---------- Copiar plantas y capas (lote D) ----------
// Agrega a S copias de los objetos `os` con ids nuevos; destino(o) = {pl, cp} de cada copia. Lo copiado sigue unido entre sí (cables a sus equipos y nodos, puertas a su pared, equipos a su mesa o rack,
// patch cords); una unión a algo que no se copia se suelta. No se copian los cables que cruzan plantas (D21) ni las puertas cuya pared no se copia. Los cables nacen sin puerto elegido, como al pegar.
function duplicarObjs(os, destino) {
  os = os.filter(o => !esMultiplanta(o)); os = os.filter(o => o.k != 'puerta' || os.some(w => w.id == o.pared));
  const ids = new Map(os.map(o => [o.id, nid++]));
  os.forEach(o => {
    const c = copiar(o); c.id = ids.get(o.id); Object.assign(c, destino(o));
    if (c.pts) c.pts = o.pts.map(q => q.ref != null ? (ids.has(q.ref) ? { ...q, ref: ids.get(q.ref) } : soltarPunto(q)) : q.rl != null ? (ids.has(q.rl) ? { ...q, rl: ids.get(q.rl) } : soltarPunto(q)) : { ...q });
    if (c.pared != null) c.pared = ids.get(c.pared);
    if (c.parent != null) { if (ids.has(c.parent)) c.parent = ids.get(c.parent); else { delete c.parent; delete c.puesto; delete c.lrot; delete c.ru; } }
    S.objs.push(c);
  });
  let n = (S.conex || []).reduce((m, c) => Math.max(m, c.id), 0);   // F8B: los patch cords entre equipos copiados viajan con ellos
  (S.conex || []).filter(c => TR.con.esParche(c) && ids.has(c.a.d) && ids.has(c.b.d)).forEach(c => S.conex.push({ ...copiar(c), id: ++n, a: { ...c.a, d: ids.get(c.a.d) }, b: { ...c.b, d: ids.get(c.b.d) } }));
  return ids.size;
}
function copiarCapa(p, c) {               // la copia queda justo encima de la original y pasa a ser la capa activa. No lleva escaleras ni mesas (con sus equipos): quedarían encimadas con las originales, y eso no está permitido en una misma planta
  const de = S.objs.filter(o => o.pl == p.id && o.cp == c.id), mesas = de.filter(esMesa).map(o => o.id), fuera = o => esEsc(o) || esMesa(o) || mesas.includes(o.parent);
  push(); const id = 'c' + (++S.cn); p.capas.splice(p.capas.indexOf(c) + 1, 0, { id, nombre: c.nombre + ' (copia)', visible: true, bloqueada: false }); p.ca = id; S.capaAct = id;
  const n = duplicarObjs(de.filter(o => !fuera(o)), () => ({ cp: id })), no = de.length - n;
  if (no) avisoEmergente(`${no} objeto(s) no se copiaron: escaleras y mesas (no pueden quedar encimadas), cables que cruzan plantas o puertas sin su pared`);
}
function copiarPlanta(p) {                // la copia queda arriba de todas y pasa a ser la planta activa. Si sus escaleras no son compatibles con las de la planta que le queda debajo, se copia sin escaleras
  const antes = conflictosEscaleras(), de = S.objs.filter(o => o.pl == p.id); push();
  const id = 'p' + (++S.pn), cap = new Map(p.capas.map(c => [c.id, 'c' + (++S.cn)]));
  S.plantas.push({ id, nombre: p.nombre + ' (copia)', ca: cap.get(p.ca) || cap.get(p.capas[0].id), capas: p.capas.map(c => ({ ...c, id: cap.get(c.id) })) });
  let n = duplicarObjs(de, o => ({ pl: id, cp: cap.get(o.cp) })), sinEsc = false;
  if ([...conflictosEscaleras().keys()].some(k => !antes.has(k))) { const m = S.objs.length; S.objs = S.objs.filter(o => !(o.pl == id && esEsc(o))); n -= m - S.objs.length; sinEsc = true; }
  S.plantaAct = id; S.capaAct = S.plantas[S.plantas.length - 1].ca; limpiarSel();
  if (n < de.length) avisoEmergente(`${de.length - n} objeto(s) no se copiaron` + (sinEsc ? ': las escaleras no son compatibles con las de la planta de abajo' : ': cables que cruzan plantas'));
}
function intercambiar(arr, i, j) { [arr[i], arr[j]] = [arr[j], arr[i]]; }
$('#plantas').onclick = e => {
  const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a, p = plantaActual(), idc = b.dataset.c, cap = id => p.capas.find(x => x.id == id), d = +b.dataset.d;
  const nObjs = f => S.objs.filter(f).length;
  if (a == 'np') { push(); const id = 'p' + (++S.pn), cid = 'c' + (++S.cn); S.plantas.push({ id, nombre: 'Planta ' + (S.plantas.length + 1), ca: cid, capas: [{ id: cid, nombre: 'Base', visible: true, bloqueada: false }] }); S.plantaAct = id; S.capaAct = cid; limpiarSel(); }
  else if (a == 'sp') { const q = S.plantas.find(x => x.id == b.dataset.p); S.plantaAct = q.id; S.capaAct = (q.capas.find(x => x.id == q.ca) || q.capas[0]).id; limpiarSel(); }
  else if (a == 'mp') { const i = S.plantas.indexOf(p), j = i + d; if (j >= 0 && j < S.plantas.length) cambioDePlantas(() => intercambiar(S.plantas, i, j)); }   // subir / bajar la planta en la jerarquía (se valida: escaleras.js)
  else if (a == 'cpp') copiarPlanta(p);
  else if (a == 'cpc') copiarCapa(p, cap(idc));
  else if (a == 'rp') { const n = prompt('Nombre de la planta:', p.nombre); if (n && n.trim() && n.trim() != p.nombre) { push(); p.nombre = n.trim(); } }
  else if (a == 'dp') {
    if (S.plantas.length < 2) { alert('El edificio debe tener al menos una planta.'); return; }
    const k = cuentaEn(p.id), cr = cablesQueCruzan(p.id); if (!confirm(`¿Borrar «${p.nombre}»${k ? ' y sus ' + k + ' objetos' : ''}?` + (cr ? `\n${cr} cable(s) atraviesan esta planta y se borrarán completos, en todas las plantas.` : ''))) return;
    cambioDePlantas(() => { podarCables(p.id); S.objs = S.objs.filter(o => o.pl != p.id); S.plantas = S.plantas.filter(x => x.id != p.id); normalizar(); limpiarSel(); });   // las plantas de arriba y abajo quedan juntas: se valida
  }
  else if (a == 'sc') { p.ca = idc; S.capaAct = idc; tmp = null; }
  else if (a == 'mc') { const i = p.capas.findIndex(x => x.id == idc), j = i + d; if (j >= 0 && j < p.capas.length) { push(); intercambiar(p.capas, i, j); } }   // subir / bajar la capa: cambia qué se dibuja encima
  else if (a == 'vc') { push(); const c = cap(idc); c.visible = !c.visible; limpiarSel(); }
  else if (a == 'bc') { push(); const c = cap(idc); c.bloqueada = !c.bloqueada; limpiarSel(); }
  else if (a == 'rc') { const c = cap(idc), n = prompt('Nombre de la capa:', c.nombre); if (n && n.trim() && n.trim() != c.nombre) { push(); c.nombre = n.trim(); } }
  else if (a == 'dc') {
    if (p.capas.length < 2) { alert('Cada planta debe tener al menos una capa.'); return; }
    const c = cap(idc), k = cuentaEn(p.id, c.id), cr = cablesQueCruzan(p.id, c.id); if (k && !confirm(`La capa «${c.nombre}» tiene ${k} objetos y se borrarán. ¿Continuar?` + (cr ? `\n${cr} cable(s) atraviesan esta capa y se borrarán completos, en todas las plantas.` : ''))) return;
    push(); podarCables(p.id, c.id); S.objs = S.objs.filter(o => !(o.pl == p.id && o.cp == c.id)); p.capas = p.capas.filter(x => x.id != c.id); normalizar(); limpiarSel();
  }
  else if (a == 'nc') { push(); const id = 'c' + (++S.cn); p.capas.push({ id, nombre: 'Capa ' + (p.capas.length + 1), visible: true, bloqueada: false }); p.ca = id; S.capaAct = id; }   // la capa nueva queda arriba de todas
  panel(); render();
};

// ---------- Arrastrar plantas y capas con el asa ⠿ para cambiar su jerarquía ----------
let dragP = null;                        // {tipo 'p'|'c', id, y0, mov, ins}: ins = posición (contando de arriba, sin la fila arrastrada) donde caería
$('#plantas').addEventListener('pointerdown', e => {
  const g = e.target.closest('[data-g]'); if (!g || e.button) return;
  const f = g.closest('[data-row]'); dragP = { tipo: f.dataset.row, id: f.dataset.id, y0: e.clientY, mov: false, ins: 0 };
  $('#plantas').setPointerCapture(e.pointerId); e.preventDefault();
});
$('#plantas').addEventListener('pointermove', e => {
  const d = dragP; if (!d || (!d.mov && Math.abs(e.clientY - d.y0) < 4)) return; d.mov = true;
  const filas = [...document.querySelectorAll(`#plantas [data-row="${d.tipo}"]`)];
  filas.forEach(f => f.classList.remove('ins-antes', 'ins-despues', 'arrastrando'));
  const mia = filas.find(f => f.dataset.id == d.id); if (mia) mia.classList.add('arrastrando');
  const otras = filas.filter(f => f !== mia); if (!otras.length) return;
  d.ins = otras.filter(f => { const r = f.getBoundingClientRect(); return e.clientY > r.top + r.height / 2; }).length;   // cuántas filas quedan por encima del cursor
  otras[Math.min(d.ins, otras.length - 1)].classList.add(d.ins < otras.length ? 'ins-antes' : 'ins-despues');   // raya que muestra dónde se soltará
});
function finArrastre() {
  const d = dragP; dragP = null; if (!d || !d.mov) return;
  const arr = d.tipo == 'p' ? S.plantas : plantaActual().capas, vis = [...arr].reverse(), yo = vis.find(x => x.id == d.id);
  if (yo) {
    const otros = vis.filter(x => x !== yo); otros.splice(d.ins, 0, yo); const nuevo = otros.reverse();
    if (nuevo.some((x, i) => x !== arr[i])) { const cambiar = () => arr.splice(0, arr.length, ...nuevo); if (d.tipo == 'p') cambioDePlantas(cambiar); else { push(); cambiar(); } }   // reordenar plantas se valida (escaleras.js); las capas no cambian vecinas
  }
  panel(); render();
}
$('#plantas').addEventListener('pointerup', finArrastre);
$('#plantas').addEventListener('pointercancel', finArrastre);
