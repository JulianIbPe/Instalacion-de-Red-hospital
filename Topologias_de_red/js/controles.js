// ---------- Controles: teclado, color, relleno, edificio y unidad ----------
document.addEventListener('keydown', e => {
  if (!dlg.hidden) { if (e.key == 'Escape') cerrarDlg(); return; }   // con el aviso abierto, solo Esc (cancelar)
  if (document.querySelector('dialog[open]')) return;                  // con un diálogo abierto (modelo propio, interfaces) no actúa ningún atajo (Esc lo cierra el propio <dialog>)
  if (TR.ctx && TR.ctx.abierto()) { TR.ctx.tecla(e); return; }       // con el menú contextual abierto: solo flechas, Enter, Esc y Tab (ver contexto.js)
  if (['SELECT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable || (e.target.tagName == 'INPUT' && !['checkbox', 'color'].includes(e.target.type))) return;
  if (drag) return;                                                     // durante un arrastre no actúa ninguna tecla (R, Supr, Ctrl+Z… agregarían pasos en medio del arrastre)
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  const enBoton = ['BUTTON', 'SUMMARY', 'INPUT'].includes(e.target.tagName);   // con un botón, un resumen o un checkbox/color enfocado, Supr y Retroceso no borran objetos (se evita borrar sin querer)
  if (mod && k == 'z' && !e.shiftKey) { e.preventDefault(); deshacer(); }
  else if (mod && (k == 'y' || (k == 'z' && e.shiftKey))) { e.preventDefault(); rehacer(); }
  else if (mod && !e.shiftKey && !e.altKey && ['c', 'x', 'v'].includes(k)) {   // Ctrl+C / Ctrl+X / Ctrl+V (portapapeles interno, ver acciones.js): solo sin herramienta ni operación en curso; pegar centra en el cursor
    if (!tool && !tmp && !drag && TR.acc.ejecutar(k == 'c' ? 'copiar' : k == 'x' ? 'cortar' : 'pegar', { punto: curP })) e.preventDefault();
  }
  else if (e.key == 'Escape') setTool(null);
  else if (k == 'g') alternarGrilla();
  else if (k == 'f' && !mod) voltearPuerta('lado');
  else if (k == 'h' && !mod) voltearPuerta('bis');
  else if (k == 'm' && !mod) alternarMedio();
  else if (e.key == 'Enter') finishLine();
  else if (k == 'r' && !mod) TR.acc.rotar(e.shiftKey ? -90 : 90);   // valida las escaleras como el menú
  else if ((e.key == 'Delete' || e.key == 'Backspace') && !enBoton) borrar();
});
// Color, relleno y contorno del menú izquierdo usan la misma lógica que el inspector (acciones.js). D16: los cables NO cambian de color; las paredes sí.
const gestoCol = { p: false };   // el selector de color dispara muchos eventos: se guarda un solo paso de historial por gesto
const idsSel = () => seleccionados().map(o => o.id);
$('#col').oninput = () => { TR.acc.fijar(idsSel(), 'c', col(), gestoCol); };
$('#col').onchange = () => { gestoCol.p = false; };
$('#fill').onchange = () => { TR.acc.fijar(idsSel(), 'f', fil()); };
function alternarMedio() { medioOn = !medioOn; $('#bmid').classList.toggle('on', medioOn); render(); }
$('#bmid').onclick = alternarMedio;
function alternarGrilla() { rejilla = !rejilla; $('#bgrid').classList.toggle('on', rejilla); render(); }
$('#bgrid').onclick = alternarGrilla;
$('#lstyle').onchange = () => { TR.acc.fijar(idsSel(), 'ls', lin()); };
let ultSel = null;                        // al seleccionar un objeto, color/relleno/línea del menú pasan a mostrar los suyos
function sincronizarOpciones() {
  if (sel === ultSel) return; ultSel = sel; const o = byId(sel); if (!o) return;
  if (o.c && !esCable(o)) $('#col').value = o.c; if (o.f) $('#fill').value = o.f; if (o.k == 'shape' || o.k == 'zona') $('#lstyle').value = o.ls || 'con';
}
$('#bundo').onclick = deshacer; $('#bredo').onclick = rehacer; $('#bdel').onclick = borrar;
$('#bset').onclick = () => { push(); S.edificio = { w: +$('#bw').value || 20, h: +$('#bh').value || 12 }; render(); };
$('#unit').onclick = () => { S.unidad = S.unidad == 'm' ? 'cm' : 'm'; $('#unit').textContent = 'Medir en: ' + S.unidad; render(); };
