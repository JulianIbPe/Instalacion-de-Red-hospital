// ---------- Controles: teclado, color, relleno, edificio y unidad ----------
document.addEventListener('keydown', e => {
  if (!dlg.hidden) { if (e.key == 'Escape') cerrarDlg(); return; }   // con el aviso abierto, solo Esc (cancelar)
  if (/INPUT|SELECT/.test(e.target.tagName)) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && k == 'z' && !e.shiftKey) { e.preventDefault(); deshacer(); }
  else if (mod && (k == 'y' || (k == 'z' && e.shiftKey))) { e.preventDefault(); rehacer(); }
  else if (e.key == 'Escape') setTool(null);
  else if (e.key == 'Enter') finishLine();
  else if (e.key == 'Delete' || e.key == 'Backspace') borrar();
});
let colPush = false;   // el selector de color dispara muchos eventos: se guarda un solo paso de historial por gesto
$('#col').oninput = () => { const os = seleccionados().filter(o => o.c); if (os.length) { if (!colPush) { push(); colPush = true; } os.forEach(o => o.c = col()); render(); } };
$('#col').onchange = () => { colPush = false; };
$('#fill').onchange = () => { const os = seleccionados().filter(o => o.f); if (os.length) { push(); os.forEach(o => o.f = fil()); render(); } };
$('#bundo').onclick = deshacer; $('#bredo').onclick = rehacer; $('#bdel').onclick = borrar;
$('#bset').onclick = () => { push(); S.edificio = { w: +$('#bw').value || 20, h: +$('#bh').value || 12 }; render(); };
$('#unit').onclick = () => { S.unidad = S.unidad == 'm' ? 'cm' : 'm'; $('#unit').textContent = 'Medir en: ' + S.unidad; render(); };
