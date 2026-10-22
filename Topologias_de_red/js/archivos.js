// ---------- Guardar, abrir y exportar ----------
function download(url, name) { const a = document.createElement('a'); a.href = url; a.download = name; a.click(); }
function guardarJson() { download(URL.createObjectURL(new Blob([JSON.stringify({ version: 1, ...S }, null, 1)], { type: 'application/json' })), 'topologia.json'); }
$('#save').onclick = guardarJson;

// ---------- Archivo nuevo ----------
function nuevoArchivo() {                       // vacía todo y deja la página como al abrirla (la unidad de medición se conserva)
  hist.length = 0; fut.length = 0;
  S = { edificio: { w: 20, h: 12 }, unidad: S.unidad, objs: [] }; nid = 1; V = { ox: 40, oy: 40, z: 50 };
  $('#bw').value = 20; $('#bh').value = 12; setTool(null);   // setTool también limpia la selección y vuelve a dibujar
}
const dlg = $('#dlg'), cerrarDlg = () => { dlg.hidden = true; };
$('#bnew').onclick = () => { if (!S.objs.length) return nuevoArchivo(); dlg.hidden = false; $('#dcancel').focus(); };   // si no hay nada dibujado, no pregunta
$('#dsave').onclick = () => { guardarJson(); cerrarDlg(); nuevoArchivo(); };
$('#ddisc').onclick = () => { cerrarDlg(); nuevoArchivo(); };
$('#dcancel').onclick = cerrarDlg;
dlg.onclick = e => { if (e.target == dlg) cerrarDlg(); };
$('#load').onclick = () => $('#file').click();
$('#file').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t => {
    try { const d = JSON.parse(t); push(); S = { edificio: d.edificio, unidad: d.unidad || 'm', objs: d.objs }; nid = Math.max(0, ...S.objs.map(o => o.id)) + 1; }
    catch { alert('El archivo no es una topología válida.'); return; }
    $('#bw').value = S.edificio.w; $('#bh').value = S.edificio.h; $('#unit').textContent = 'Medir en: ' + S.unidad; sel = tmp = null; multi = []; render();
  }); e.target.value = '';
};
$('#png').onclick = () => {
  sel = null; tmp = null; render(); const c = $('#c'), b = c.getBBox(), m = .6, k = 60;
  const x = b.x - m, y = b.y - m, w = b.width + 2 * m, h = b.height + 2 * m;
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w * k}" height="${h * k}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>${c.innerHTML}</svg>`;
  const img = new Image(); img.onload = () => {
    const cv = document.createElement('canvas'); cv.width = w * k; cv.height = h * k; cv.getContext('2d').drawImage(img, 0, 0);
    cv.toBlob(bl => download(URL.createObjectURL(bl), 'topologia.png'));
  }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
};
