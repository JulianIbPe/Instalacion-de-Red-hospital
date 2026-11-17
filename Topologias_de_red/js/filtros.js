// ===== filtros.js (F10A): estado visual F, fuera de S y del historial (D10) =====
// · Aislar un cable: se ven solo el cable, sus equipos y la mesa o el rack donde están; lo de la red (otros cables, equipos, mesas, racks) se oculta
//   y lo demás (paredes, puertas, escaleras, textos…) queda de fondo, atenuado y sin recibir clics.
// · No toca S, esVisible, imanes, conexiones ni presupuesto: solo cambia qué arma renderObjetos en #c (y, con eso, el PNG).
// · Sin filtros, estado() devuelve '' para todo y #c queda idéntico al de antes.
TR.fil = (() => {
  const RED = new Set(['cable', 'dispositivo', 'rack', 'mesa']);
  let aislado = null;                       // {id del cable, ids que se ven}
  function contexto(id) {                   // el cable, sus equipos (por la unión y por la conexión) y el contenedor de cada uno
    const L = byId(id), c = TR.con.conexDe(id), ids = new Set([id]);
    const eqs = [...L.pts.map(q => q.ref), c && c.a && c.a.d, c && c.b && c.b.d].map(byId).filter(Boolean);
    for (const d of eqs) { ids.add(d.id); if (d.parent != null) ids.add(d.parent); }   // mesa (F6) o rack (F8): el equipo montado no se dibuja en el plano, su rack sí
    return ids;
  }
  function aislar(id) { const L = byId(id); if (!L || !esCable(L)) return false; aislado = { id, ids: contexto(id) }; render(); return true; }
  function mostrarTodo(sinDibujar) { if (!aislado) return; aislado = null; if (!sinDibujar) render(); }
  function estado(o) {                      // '' = normal · 'oculto' = no se dibuja · 'fondo' = atenuado y sin clics
    if (!aislado || aislado.ids.has(o.id)) return '';
    return RED.has(tipoDe(o)) ? 'oculto' : 'fondo';
  }
  const oculto = o => !!o && estado(o) == 'oculto';
  function sincronizar() {                  // lo llama renderObjetos: el contexto sigue al cable (otro equipo en la punta); sin el cable, el filtro se va solo
    if (aislado) { if (byId(aislado.id)) aislado.ids = contexto(aislado.id); else aislado = null; }
    if (aislado) { if (sel != null && estado(byId(sel) || {})) sel = null; multi = multi.filter(i => !estado(byId(i) || {})); }   // no queda seleccionado (ni se borra con Supr) algo que no se ve
    const a = $('#faviso'); if (a.hidden == !aislado) return;
    a.hidden = !aislado;
  }
  $('#faviso button').onclick = () => mostrarTodo();
  TR.acc.registrar({ id: 'fil-aislar', grupo: 'editar', texto: 'Aislar este cable', aplica: os => os.length == 1 && os[0].k == 'line' && esCable(os[0]), ejecutar: os => aislar(os[0].id) });
  return { aislar, mostrarTodo, estado, oculto, sincronizar, activo: () => !!aislado };
})();
