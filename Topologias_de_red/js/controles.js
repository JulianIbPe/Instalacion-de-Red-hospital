// ---------- Controles: teclado, color, relleno, edificio y unidad ----------
document.addEventListener('keydown', e => {
  if (!dlg.hidden) { if (e.key == 'Escape') cerrarDlg(); return; }   // con el aviso abierto, solo Esc (cancelar)
  if (e.target.tagName == 'SELECT' || (e.target.tagName == 'INPUT' && !['checkbox', 'color'].includes(e.target.type))) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && k == 'z' && !e.shiftKey) { e.preventDefault(); deshacer(); }
  else if (mod && (k == 'y' || (k == 'z' && e.shiftKey))) { e.preventDefault(); rehacer(); }
  else if (e.key == 'Escape') setTool(null);
  else if (k == 'g') alternarGrilla();
  else if (k == 'f' && !mod) voltearPuerta('lado');
  else if (k == 'h' && !mod) voltearPuerta('bis');
  else if (k == 'm' && !mod) alternarMedio();
  else if (e.key == 'Enter') finishLine();
  else if (k == 'r' && !mod) rotarSeleccion(e.shiftKey ? -90 : 90);
  else if (e.key == 'Delete' || e.key == 'Backspace') borrar();
});
let colPush = false;   // el selector de color dispara muchos eventos: se guarda un solo paso de historial por gesto
$('#col').oninput = () => { const os = seleccionados().filter(o => o.c); if (os.length) { if (!colPush) { push(); colPush = true; } os.forEach(o => o.c = col()); render(); } };
$('#col').onchange = () => { colPush = false; };
$('#fill').onchange = () => { const os = seleccionados().filter(o => o.f); if (os.length) { push(); os.forEach(o => o.f = fil()); render(); } };
function alternarMedio() { medioOn = !medioOn; $('#bmid').classList.toggle('on', medioOn); render(); }
$('#bmid').onclick = alternarMedio;
function alternarGrilla() { rejilla = !rejilla; $('#bgrid').classList.toggle('on', rejilla); render(); }
$('#bgrid').onclick = alternarGrilla;
$('#lstyle').onchange = () => { const os = seleccionados().filter(o => o.k == 'shape' || o.k == 'zona'); if (os.length) { push(); os.forEach(o => o.ls = lin()); render(); } };
let ultSel = null;                        // al seleccionar un objeto, color/relleno/línea del menú pasan a mostrar los suyos
function sincronizarOpciones() {
  if (sel === ultSel) return; ultSel = sel; const o = byId(sel); if (!o) return;
  if (o.c) $('#col').value = o.c; if (o.f) $('#fill').value = o.f; if (o.k == 'shape' || o.k == 'zona') $('#lstyle').value = o.ls || 'con';
}
$('#bundo').onclick = deshacer; $('#bredo').onclick = rehacer; $('#bdel').onclick = borrar;
$('#bset').onclick = () => { push(); S.edificio = { w: +$('#bw').value || 20, h: +$('#bh').value || 12 }; render(); };
$('#unit').onclick = () => { S.unidad = S.unidad == 'm' ? 'cm' : 'm'; $('#unit').textContent = 'Medir en: ' + S.unidad; render(); };
