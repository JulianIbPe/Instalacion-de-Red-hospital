// ---------- Guardar, abrir y exportar ----------
function download(url, name) { const a = document.createElement('a'); a.href = url; a.download = name; a.click(); }
// Guardar: archivo de proyecto versión 2 (estado + recursos que el proyecto usa). Si el proyecto no pasaría la validación al volver a abrirlo
// (o las imágenes superan los límites), NO se descarga nada y se explica el motivo; el trabajo en pantalla no se toca.
function guardarJson() {
  const r = ESQ.serializar(S, R);
  if (!r.ok) { alert('No se pudo guardar el proyecto.\n\n' + r.error); return false; }
  if (r.avisos.length) console.warn('Al guardar se omitirían campos o valores no válidos:', r.avisos);
  download(URL.createObjectURL(new Blob([r.texto], { type: 'application/json' })), 'topologia.json'); return true;
}
$('#save').onclick = guardarJson;

// ---------- Archivo nuevo ----------
function nuevoArchivo() {                       // vacía todo y deja la página como al abrirla (la unidad de medición se conserva)
  hist.length = 0; fut.length = 0; R.vaciar();
  S = estadoInicial(S.unidad); nid = 1; panel(); V = { ox: 40, oy: 40, z: 50 };
  $('#bw').value = 20; $('#bh').value = 12; setTool(null);   // setTool también limpia la selección y vuelve a dibujar
}
const dlg = $('#dlg'), cerrarDlg = () => { dlg.hidden = true; };
$('#bnew').onclick = () => { if (!S.objs.length) return nuevoArchivo(); dlg.hidden = false; $('#dcancel').focus(); };   // si no hay nada dibujado, no pregunta
$('#dsave').onclick = () => { if (!guardarJson()) return; cerrarDlg(); nuevoArchivo(); };   // si no se pudo guardar, no se borra nada
$('#ddisc').onclick = () => { cerrarDlg(); nuevoArchivo(); };
$('#dcancel').onclick = cerrarDlg;
dlg.onclick = e => { if (e.target == dlg) cerrarDlg(); };
$('#load').onclick = () => $('#file').click();

// ---------- Abrir ----------
// Lee, valida y sanea el archivo SIN tocar el proyecto actual (esquema.js). Solo si todo es válido y los recursos caben en los límites,
// se guarda un paso en el historial (se puede deshacer la apertura), se unen los recursos y se reemplaza el estado.
function abrirTexto(t) {                        // devuelve {ok, avisos} o {ok:false, errores}
  const r = ESQ.leer(t); if (!r.ok) return r;
  const sim = R.fusionar(r.recursos, { simular: true }); if (!sim.ok) return { ok: false, errores: [sim.error] };
  const previo = S, nidPrevio = nid, h0 = hist.length;
  try {
    push();
    const f = R.fusionar(r.recursos); R.remapEstado(r.estado, f.mapa);
    S = { ...estadoInicial(r.estado.unidad || 'm'), ...r.estado, unidad: r.estado.unidad || 'm' }; normalizar(); normalizarTipos(); panel();
    nid = 1; for (const o of S.objs) if (o.id >= nid) nid = o.id + 1;
    $('#bw').value = S.edificio.w; $('#bh').value = S.edificio.h; $('#unit').textContent = 'Medir en: ' + S.unidad; sel = tmp = drag = null; multi = []; selEdge = null; render();
  } catch (e) {                                  // un fallo inesperado no deja el proyecto a medias: se vuelve al anterior
    S = previo; nid = nidPrevio; while (hist.length > h0) hist.pop();
    try { panel(); $('#bw').value = S.edificio.w; $('#bh').value = S.edificio.h; render(); } catch {}
    return { ok: false, errores: ['Error inesperado al abrir el archivo (' + e.message + '). Se conservó tu proyecto anterior.'] };
  }
  return { ok: true, avisos: r.avisos, version: r.version };
}
$('#file').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t => {
    const r = abrirTexto(t);
    if (!r.ok) alert('No se pudo abrir el archivo. Tu proyecto actual no se modificó.\n\n' + r.errores.slice(0, 8).join('\n'));
    else if (r.avisos.length) alert('El archivo se abrió, pero se corrigieron algunos valores:\n\n' + r.avisos.slice(0, 8).join('\n'));
  }).catch(() => alert('No se pudo leer el archivo. Tu proyecto actual no se modificó.'));
  e.target.value = '';
};

// ---------- Exportar PNG ----------
// Arma el SVG de la exportación. Mientras se dibuja se quitan la selección (simple, múltiple y de lado) y el objeto en curso,
// para que no salgan marcos ni asas; al terminar se restauran tal como estaban (incluso si algo falla) y se vuelve a dibujar.
function construirSvgExport() {
  const g = { sel, multi, selEdge, tmp };
  sel = null; multi = []; selEdge = null; tmp = null;
  try {
    render(); const c = $('#c'), b = c.getBBox(), m = .6, k = 60;
    const x = b.x - m, y = b.y - m, w = b.width + 2 * m, h = b.height + 2 * m;
    const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w * k}" height="${h * k}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>${c.innerHTML}</svg>`;
    return { xml, w, h, k };
  } finally { sel = g.sel; multi = g.multi; selEdge = g.selEdge; tmp = g.tmp; render(); }
}
$('#png').onclick = () => {
  const { xml, w, h, k } = construirSvgExport();
  const img = new Image(); img.onload = () => {
    const cv = document.createElement('canvas'); cv.width = w * k; cv.height = h * k; cv.getContext('2d').drawImage(img, 0, 0);
    cv.toBlob(bl => download(URL.createObjectURL(bl), 'topologia.png'));
  }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
};
