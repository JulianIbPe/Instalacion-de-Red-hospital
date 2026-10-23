// ===== plantas.js: varias plantas por edificio y varias capas por planta (ocultar / bloquear como en AutoCAD) =====
// S.plantas = [{ id, nombre, ca (última capa usada), capas: [{ id, nombre, visible, bloqueada }] }]
// S.plantaAct / S.capaAct = planta y capa en las que se está trabajando. Cada objeto guarda su planta (pl) y su capa (cp).
const plantaActual = () => S.plantas.find(p => p.id == S.plantaAct);
const capaActual = () => plantaActual().capas.find(c => c.id == S.capaAct);
function capaDe(o) { const p = S.plantas.find(p => p.id == o.pl); return p && p.capas.find(c => c.id == o.cp); }
function esVisible(o) { if (o.pl === undefined) return true; const c = capaDe(o); return o.pl == S.plantaAct && !!c && c.visible; }
function esEditable(o) { if (o.pl === undefined) return true; return esVisible(o) && !capaDe(o).bloqueada; }
const capaEditable = () => { const c = capaActual(); return c.visible && !c.bloqueada; };

function normalizar() {                  // deja S coherente: sirve también para abrir archivos antiguos (sin plantas)
  if (!S.plantas || !S.plantas.length) { const b = estadoInicial(S.unidad); S.plantas = b.plantas; S.plantaAct = b.plantaAct; S.capaAct = b.capaAct; }
  S.plantas.forEach(p => { if (!p.capas || !p.capas.length) p.capas = [{ id: 'c' + (++S.cn || 1), nombre: 'Base', visible: true, bloqueada: false }]; });
  const num = s => +String(s).slice(1) || 0;
  S.pn = Math.max(S.pn || 0, ...S.plantas.map(p => num(p.id)));
  S.cn = Math.max(S.cn || 0, ...S.plantas.flatMap(p => p.capas.map(c => num(c.id))));
  if (!S.plantas.some(p => p.id == S.plantaAct)) S.plantaAct = S.plantas[0].id;
  const p = plantaActual(); if (!p.capas.some(c => c.id == S.capaAct)) S.capaAct = (p.capas.find(c => c.id == p.ca) || p.capas[0]).id;
  S.objs.forEach(o => { if (o.k == 'medida' && !o.u) o.u = S.unidad; });   // mediciones antiguas: se quedan en la unidad que tenía el archivo
  S.objs.forEach(o => {                  // todo objeto debe pertenecer a una planta y una capa que existan
    const q = S.plantas.find(q => q.id == o.pl) || S.plantas[0]; o.pl = q.id;
    if (!q.capas.some(c => c.id == o.cp)) o.cp = q.capas[0].id;
  });
}

function panel() {                       // dibuja el panel de abajo a la derecha (solo se rehace cuando cambian plantas o capas)
  $('#plantas').innerHTML = `<div class="ph"><b>Plantas</b><button data-a="np" title="Añadir una planta">＋ Planta</button></div>` + S.plantas.map(p => {
    const on = p.id == S.plantaAct;
    let h = `<div class="pl ${on ? 'on' : ''}"><button class="pn" data-a="sp" data-p="${p.id}">${esc(p.nombre)}</button>` + (on ? `<button data-a="rp" title="Renombrar planta">✎</button><button data-a="dp" title="Borrar planta">🗑️</button>` : '') + `</div>`;
    if (on) h += `<div class="capas">` + p.capas.map(c => `<div class="cp ${c.id == S.capaAct ? 'on' : ''}"><button data-a="vc" data-c="${c.id}" title="${c.visible ? 'Ocultar' : 'Mostrar'} capa">${c.visible ? '👁️' : '🚫'}</button><button data-a="bc" data-c="${c.id}" title="${c.bloqueada ? 'Desbloquear' : 'Bloquear'} capa">${c.bloqueada ? '🔒' : '🔓'}</button><button class="cn ${c.visible ? '' : 'off'}" data-a="sc" data-c="${c.id}" title="Trabajar en esta capa">${esc(c.nombre)}</button><button data-a="rc" data-c="${c.id}" title="Renombrar capa">✎</button><button data-a="dc" data-c="${c.id}" title="Quitar capa">✕</button></div>`).join('') + `<button class="addc" data-a="nc">＋ Capa</button></div>`;
    return h;
  }).join('');
}

const limpiarSel = () => { sel = null; multi = []; tmp = null; drag = null; };
$('#plantas').onclick = e => {
  const b = e.target.closest('[data-a]'); if (!b) return;
  const a = b.dataset.a, p = plantaActual(), idc = b.dataset.c, cap = id => p.capas.find(x => x.id == id);
  const nObjs = f => S.objs.filter(f).length;
  if (a == 'np') { push(); const id = 'p' + (++S.pn), cid = 'c' + (++S.cn); S.plantas.push({ id, nombre: 'Planta ' + (S.plantas.length + 1), ca: cid, capas: [{ id: cid, nombre: 'Base', visible: true, bloqueada: false }] }); S.plantaAct = id; S.capaAct = cid; limpiarSel(); }
  else if (a == 'sp') { const q = S.plantas.find(x => x.id == b.dataset.p); S.plantaAct = q.id; S.capaAct = (q.capas.find(x => x.id == q.ca) || q.capas[0]).id; limpiarSel(); }
  else if (a == 'rp') { const n = prompt('Nombre de la planta:', p.nombre); if (n && n.trim() && n.trim() != p.nombre) { push(); p.nombre = n.trim(); } }
  else if (a == 'dp') {
    if (S.plantas.length < 2) { alert('El edificio debe tener al menos una planta.'); return; }
    const k = nObjs(o => o.pl == p.id); if (!confirm(`¿Borrar «${p.nombre}»${k ? ' y sus ' + k + ' objetos' : ''}?`)) return;
    push(); S.objs = S.objs.filter(o => o.pl != p.id); S.plantas = S.plantas.filter(x => x.id != p.id); normalizar(); limpiarSel();
  }
  else if (a == 'sc') { p.ca = idc; S.capaAct = idc; tmp = null; }
  else if (a == 'vc') { push(); const c = cap(idc); c.visible = !c.visible; limpiarSel(); }
  else if (a == 'bc') { push(); const c = cap(idc); c.bloqueada = !c.bloqueada; limpiarSel(); }
  else if (a == 'rc') { const c = cap(idc), n = prompt('Nombre de la capa:', c.nombre); if (n && n.trim() && n.trim() != c.nombre) { push(); c.nombre = n.trim(); } }
  else if (a == 'dc') {
    if (p.capas.length < 2) { alert('Cada planta debe tener al menos una capa.'); return; }
    const c = cap(idc), k = nObjs(o => o.pl == p.id && o.cp == c.id); if (k && !confirm(`La capa «${c.nombre}» tiene ${k} objetos y se borrarán. ¿Continuar?`)) return;
    push(); S.objs = S.objs.filter(o => !(o.pl == p.id && o.cp == c.id)); p.capas = p.capas.filter(x => x.id != c.id); normalizar(); limpiarSel();
  }
  else if (a == 'nc') { push(); const id = 'c' + (++S.cn); p.capas.push({ id, nombre: 'Capa ' + (p.capas.length + 1), visible: true, bloqueada: false }); p.ca = id; S.capaAct = id; }
  panel(); render();
};
