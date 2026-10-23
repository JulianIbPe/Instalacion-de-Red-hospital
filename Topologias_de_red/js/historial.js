// ===== historial.js: deshacer, rehacer y borrar. Guarda "fotos" del estado (S) antes de cada cambio. =====
const hist = [], fut = [];
function push() {                       // llamar ANTES de modificar S
  hist.push(JSON.stringify(S)); if (hist.length > 100) hist.shift(); fut.length = 0;
}
function restaurar(json) {
  const u = S.unidad, pa = S.plantaAct, ca = S.capaAct; S = JSON.parse(json); S.unidad = u; S.plantaAct = pa; S.capaAct = ca;   // la unidad y la planta/capa en uso no se deshacen
  normalizar(); panel();
  sel = tmp = drag = null; multi = []; selEdge = null; $('#bw').value = S.edificio.w; $('#bh').value = S.edificio.h; render();
}
function deshacer() { if (!hist.length) return; fut.push(JSON.stringify(S)); restaurar(hist.pop()); }
function rehacer() { if (!fut.length) return; hist.push(JSON.stringify(S)); restaurar(fut.pop()); }
function borrar() {                     // borra todo lo seleccionado (uno o varios objetos) o, si hay un lado de forma seleccionado, solo ese lado
  if (ladoSel() !== null) { borrarLado(); return; }
  const ids = seleccionados().map(o => o.id); if (!ids.length) return; push();
  S.objs.forEach(o => o.pts && (o.pts = o.pts.map(q => ids.includes(q.ref) ? { ...pt(q) } : q)));  // los cables conectados se sueltan donde estaba el dispositivo
  S.objs = S.objs.filter(o => !ids.includes(o.id));
  sel = null; multi = []; render();
}
