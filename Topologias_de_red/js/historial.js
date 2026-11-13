// ===== historial.js: deshacer, rehacer y borrar. Guarda "fotos" del estado (S) antes de cada cambio. =====
// Fase 2: el historial se maneja a través de Hist, con una "estrategia" intercambiable (hoy, instantáneas completas de S; más adelante, parches).
// Las instantáneas contienen SOLO el estado S: las imágenes y los modelos viven aparte en R (recursos.js) y nunca entran aquí.
// Límites: hasta Hist.limites.pasos pasos y Hist.limites.caracteres caracteres entre deshacer y rehacer (se descartan los pasos más antiguos).
const hist = [], fut = [];             // pasos para deshacer / rehacer (se mantienen como listas: dibujo.js y las pruebas leen su largo)
const Hist = {
  limites: { pasos: 100, caracteres: 50000000 },
  estrategia: {                        // capturar(): paso nuevo con el estado actual · aplicar(paso): vuelve a ese estado · igual(a, b): ¿no cambió nada? · peso(paso): tamaño aproximado
    nombre: 'snapshots', capturar: () => JSON.stringify(S), aplicar: paso => restaurar(paso), igual: (a, b) => a === b, peso: paso => paso.length
  },
  tamano() { let n = 0; for (const e of hist) n += this.estrategia.peso(e); for (const e of fut) n += this.estrategia.peso(e); return n; },
  recortar() {                         // descarta lo más antiguo si se pasan los límites (siempre queda al menos el último paso)
    const L = this.limites;
    while (hist.length > L.pasos || (hist.length > 1 && this.tamano() > L.caracteres)) hist.shift();
    while (fut.length > L.pasos || (fut.length > 1 && this.tamano() > L.caracteres)) fut.shift();
  }
};
function push() {                      // llamar ANTES de modificar S
  const e = Hist.estrategia.capturar();
  if (hist.length && Hist.estrategia.igual(hist[hist.length - 1], e)) { fut.length = 0; return; }   // no cambió nada desde el paso anterior: no se duplica
  hist.push(e); fut.length = 0; Hist.recortar();
}
function restaurar(json) {
  const u = S.unidad, pa = S.plantaAct, ca = S.capaAct; S = JSON.parse(json); S.unidad = u; S.plantaAct = pa; S.capaAct = ca;   // la unidad y la planta/capa en uso no se deshacen
  normalizar(); normalizarTipos(); panel();
  sel = tmp = drag = null; multi = []; selEdge = null; $('#bw').value = S.edificio.w; $('#bh').value = S.edificio.h; render();
}
function deshacer() { if (!hist.length) return; fut.push(Hist.estrategia.capturar()); Hist.estrategia.aplicar(hist.pop()); Hist.recortar(); }
function rehacer() { if (!fut.length) return; hist.push(Hist.estrategia.capturar()); Hist.estrategia.aplicar(fut.pop()); Hist.recortar(); }
function borrar(cortando) {             // borra todo lo seleccionado (uno o varios objetos) o, si hay un lado de forma seleccionado, solo ese lado; cortando = los objetos quedan en el portapapeles
  if (ladoSel() !== null) { borrarLado(); return true; }
  const ids = seleccionados().map(o => o.id); if (!ids.length) return false;
  const cr = cablesAfectados(o => ids.includes(o.id));   // cables que pasan por una escalera que se borra (o bajan a ella): se borran completos, en todas las plantas (trazas.js)
  if (cr.length && !confirm(`${cr.length} cable(s) atraviesan la escalera que vas a borrar y se borrarán completos, en todas las plantas. ¿Continuar?`)) return false;
  const hs = TR.jer.hijosDeIds(ids), nh = S.objs.filter(o => o.parent != null && ids.includes(o.parent)).length;   // R7: los equipos de una mesa se borran con ella (sus cables quedan sueltos); se pregunta aunque también estén seleccionados
  if (nh && !cortando && !confirm(`${nh} equipo(s) sobre la(s) mesa(s) se borrarán también. ¿Continuar?`)) return false;   // al cortar no se pregunta: quedan en el portapapeles y Ctrl+Z los recupera
  push(); cr.forEach(o => ids.push(o.id)); ids.push(...hs);
  S.objs.forEach(o => { if (o.k == 'puerta' && ids.includes(o.pared) && !ids.includes(o.id)) ids.push(o.id); });   // las puertas se van con su pared
  S.objs.forEach(o => o.pts && (o.pts = o.pts.map(q => ids.includes(q.ref) || ids.includes(q.rl) ? soltarPunto(q) : q)));  // los cables conectados se sueltan donde estaba el dispositivo
  S.objs = S.objs.filter(o => !ids.includes(o.id));
  sel = null; multi = []; render(); return true;
}
function descartarPaso(futGuardado) {  // cambio rechazado: vuelve al estado del último push() sin dejarlo para rehacer; conserva la selección y, si se pasa, el rehacer de antes
  const s = sel, m = multi; Hist.estrategia.aplicar(hist.pop()); sel = s; multi = m; if (futGuardado) fut.splice(0, fut.length, ...futGuardado);
}
