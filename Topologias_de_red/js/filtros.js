// ===== filtros.js (F10): estado visual F, fuera de S y del historial (D10) =====
// · Reglas: {por, valor, modo, texto, cable?}. por = 'disp' (un equipo y sus cables; un rack, también los de sus equipos montados), 'cat' (tipo de equipo:
//   categoría de su modelo), 'cable' (tipo de cable), 'red' (red automática 'r:Red 1' o VLAN 'v:<id>': sus equipos y sus cables), 'capa' (todo lo de esa capa).
//   modo = 'ocultar', 'atenuar' o 'aislar'. «Aislar este cable» (F10A) es una regla 'disp' con el id del cable y cable: true (hay una sola a la vez).
// · Al aislar se ve lo elegido y su contexto (los equipos de cada cable y la mesa o el rack de cada equipo); lo demás de la red (cables, equipos, mesas,
//   racks) se oculta y el resto (paredes, puertas, escaleras, textos…) queda de fondo, atenuado y sin clics. Un aislar que no elige nada deja solo el fondo.
// · Precedencia: ocultar > aislar > atenuar. Lo atenuado se sigue pudiendo seleccionar; lo oculto y el fondo se deseleccionan (salvo los equipos montados:
//   no están en el plano y la vista del rack no usa filtros).
// · No toca S, esVisible, imanes, conexiones ni presupuesto: solo cambia qué arma renderObjetos en #c (y, con eso, el PNG).
//   El estado se calcula una vez por render (sincronizar). Sin reglas, estado() devuelve '' y envolver() no cambia nada: #c queda idéntico.
TR.fil = (() => {
  const RED = new Set(['cable', 'dispositivo', 'rack', 'mesa']), EQUIPO = new Set(['dispositivo', 'rack']);
  const POR = { disp: 'Dispositivo', cat: 'Tipo de equipo', cable: 'Tipo de cable', red: 'Red / VLAN', capa: 'Capa' }, MODO = { ocultar: 'Ocultar', atenuar: 'Atenuar', aislar: 'Aislar' };
  let reglas = [], est = new Map();          // est = id -> 'oculto' | 'fondo' | 'tenue', del último render

  const catDe = o => (modeloDe(o) || {}).cat || '-';   // '-' = sin categoría (sin modelo o modelo sin categoría)
  const capaExiste = id => S.plantas.some(p => p.capas.some(c => c.id == id));
  const vigente = (r, porId) => r.por == 'disp' ? porId.has(+r.valor) : r.por == 'capa' ? capaExiste(r.valor) : true;   // una regla sobre algo borrado se quita sola

  function calcular(porId) {
    if (!reglas.length) return new Map();
    const cables = S.objs.filter(o => o.k == 'line' && esCable(o)), cx = new Map();
    for (const c of S.conex || []) for (const r of c.rutas) cx.set(r, c);
    const eqDe = new Map(cables.map(L => [L.id, TR.con.equiposDe(L, cx.get(L.id))]));
    let redes; const auto = () => redes ||= TR.red.automaticas().redes;
    const vlan = (o, p) => !!o && (TR.con.puerto(o, p) || {}).vlan;
    function coincide(r) {                  // ids que elige la regla
      const ids = new Set(), v = r.valor;
      if (r.por == 'disp') { const d = new Set([+v]); for (const o of S.objs) if (o.parent == +v && o.ru) d.add(o.id); d.forEach(i => ids.add(i)); for (const L of cables) if (eqDe.get(L.id).some(i => d.has(i))) ids.add(L.id); }
      else if (r.por == 'cat') { for (const o of S.objs) if (EQUIPO.has(tipoDe(o)) && catDe(o) == v) ids.add(o.id); }
      else if (r.por == 'cable') { for (const L of cables) if (subDe(L) == v) ids.add(L.id); }
      else if (r.por == 'capa') { for (const o of S.objs) if (o.cp == v) ids.add(o.id); }
      else if (v.startsWith('r:')) {
        const red = auto().find(x => x.nombre == v.slice(2)); if (!red) return ids;
        const eq = new Set(red.equipos); eq.forEach(i => ids.add(i));
        for (const L of cables) { const e = eqDe.get(L.id); if (e.length && e.every(i => eq.has(i))) ids.add(L.id); }
      } else {
        const id = v.slice(2);
        for (const o of S.objs) if (Object.keys(o.po || {}).some(p => vlan(o, p) == id)) ids.add(o.id);
        for (const c of S.conex || []) if (['a', 'b'].some(k => c[k] && c[k].p && vlan(porId.get(c[k].d), c[k].p) == id)) c.rutas.forEach(i => ids.add(i));
      }
      return ids;
    }
    const de = modo => { const s = new Set(); for (const r of reglas) if (r.modo == modo) coincide(r).forEach(i => s.add(i)); return s; };
    const ocultos = de('ocultar'), tenues = de('atenuar'), ais = de('aislar'), aisla = reglas.some(r => r.modo == 'aislar');
    for (const id of [...ais]) {             // contexto: equipos de cada cable y contenedor de cada equipo
      const o = porId.get(id); if (!o) continue;
      for (const d of eqDe.has(id) ? eqDe.get(id).map(i => porId.get(i)).filter(Boolean) : [o]) { ais.add(d.id); if (d.parent != null) ais.add(d.parent); }   // mesa (F6) o rack (F8): el equipo montado no se dibuja en el plano, su rack sí
    }
    const m = new Map();
    for (const o of S.objs) {
      const e = ocultos.has(o.id) ? 'oculto' : aisla && !ais.has(o.id) ? (RED.has(tipoDe(o)) ? 'oculto' : 'fondo') : tenues.has(o.id) ? 'tenue' : '';
      if (e) m.set(o.id, e);
    }
    return m;
  }
  const estado = o => est.get(o.id) || '';
  const oculto = o => !!o && est.get(o.id) == 'oculto';
  function envolver(o, g) {                 // el dibujo de o según su filtro: '' si está oculto, atenuado (y sin clics si es fondo) o tal cual
    const e = est.get(o.id);
    return !e ? g : e == 'oculto' ? '' : e == 'fondo' ? `<g pointer-events="none" opacity=".25">${g}</g>` : `<g opacity=".25">${g}</g>`;
  }
  function sincronizar() {                  // lo llama renderObjetos, después de las demás sincronizaciones: quita las reglas huérfanas y recalcula el estado
    if (!reglas.length && !est.size) return;
    const porId = new Map(S.objs.map(o => [o.id, o])), antes = reglas.length;
    reglas = reglas.filter(r => vigente(r, porId)); if (reglas.length != antes) pintar();
    est = calcular(porId);
    const fuera = id => ['oculto', 'fondo'].includes(est.get(id)) && !(porId.get(id) || {}).ru;   // no queda seleccionado (ni se borra con Supr) algo que no se ve o que es solo fondo
    const ids = multi.length ? multi : sel != null ? [sel] : [];
    if (ids.some(fuera)) fijarSeleccion(ids.filter(i => !fuera(i)));
  }
  function refrescar() {                    // lo llama renderPaneles: botón de la barra y aviso sobre el plano
    const n = reglas.length, b = $('#bfil'), t = n ? `🔍 Filtros (${n})` : '🔍 Filtros', a = $('#faviso');
    if (b.textContent != t) { b.textContent = t; b.classList.toggle('on', !!n); }
    if (a.hidden != !n) a.hidden = !n;
    if (n) a.firstChild.textContent = n == 1 && reglas[0].cable ? 'Mostrando solo un cable y sus equipos ' : 'Hay filtros activos: parte del plano no se ve o está atenuada ';
  }
  function aislar(id) {
    const L = byId(id); if (!L || !esCable(L)) return false;
    reglas = reglas.filter(r => !r.cable); reglas.push({ por: 'disp', valor: String(id), modo: 'aislar', texto: TR.con.nombre(L), cable: true }); pintar(); render(); return true;
  }
  function agregar(r) { if (!POR[r.por] || !MODO[r.modo] || r.valor == null || r.valor === '') return false; reglas.push(r); pintar(); render(); return true; }
  function quitar(i) { reglas.splice(i, 1); pintar(); render(); }
  function vaciar() { reglas = []; est = new Map(); pintar(); }   // sin dibujar: al abrir un archivo o con «Nuevo» (las reglas apuntan a ids del proyecto anterior)
  function mostrarTodo() { vaciar(); render(); }

  // ---------- Panel «Filtros» (no modal: el plano se ve detrás) ----------
  const panel = $('#fpanel'), selPor = $('#fp-por'), selVal = $('#fp-val'), selModo = $('#fp-modo');
  function opciones(por) {                  // [[valor, texto]] de lo que hay en el proyecto
    if (por == 'disp') return S.objs.filter(o => EQUIPO.has(tipoDe(o))).map(o => [String(o.id), TR.con.nombre(o) + (o.ru ? ' (en rack)' : '')]).sort((a, b) => a[1].localeCompare(b[1]));
    if (por == 'cat') return [...new Set(S.objs.filter(o => EQUIPO.has(tipoDe(o))).map(catDe))].map(c => [c, c == '-' ? 'Sin categoría' : (CATS.find(k => k.id == c) || { t: c }).t]);
    if (por == 'cable') return CAT.Cables.map(t => [subDe(t), t.n]);
    if (por == 'red') return TR.red.automaticas().redes.map(r => ['r:' + r.nombre, r.nombre]).concat(TR.red.vlan.lista().map(v => ['v:' + v.id, TR.red.vlan.rotulo(v)]));
    return S.plantas.flatMap(p => p.capas.map(c => [c.id, p.nombre + ' › ' + c.nombre]));
  }
  function valores() { const o = opciones(selPor.value); selVal.innerHTML = o.length ? o.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('') : '<option value="">(no hay en el proyecto)</option>'; }
  function pintar() {
    $('#fp-lista').innerHTML = reglas.map((r, i) => `<div class="fp-r"><span>${MODO[r.modo]} · ${r.cable ? 'Cable' : POR[r.por]}: ${esc(r.texto)}</span><button data-i="${i}" title="Quitar">✕</button></div>`).join('') || '<p class="fp-nota">Sin filtros: se ve todo.</p>';
  }
  function abrir() { valores(); pintar(); panel.hidden = false; $('#bfil').setAttribute('aria-pressed', 'true'); }
  function cerrar() { panel.hidden = true; $('#bfil').setAttribute('aria-pressed', 'false'); }
  $('#bfil').onclick = () => panel.hidden ? abrir() : cerrar();
  $('#fp-x').onclick = cerrar;
  selPor.onchange = valores;
  $('#fp-add').onclick = () => agregar({ por: selPor.value, valor: selVal.value, modo: selModo.value, texto: (selVal.selectedOptions[0] || {}).textContent || '' });
  $('#fp-lista').onclick = e => { const b = e.target.closest('button'); if (b) quitar(+b.dataset.i); };
  $('#fp-todo').onclick = $('#faviso button').onclick = () => mostrarTodo();
  panel.addEventListener('keydown', e => { if (e.key == 'Escape') { e.stopPropagation(); cerrar(); } });

  TR.acc.registrar({ id: 'fil-aislar', grupo: 'editar', texto: 'Aislar este cable', aplica: os => os.length == 1 && os[0].k == 'line' && esCable(os[0]), ejecutar: os => aislar(os[0].id) });
  return { aislar, agregar, quitar, vaciar, mostrarTodo, estado, oculto, envolver, sincronizar, refrescar, abrir, cerrar, activo: () => reglas.length > 0, reglas: () => reglas.slice() };
})();
