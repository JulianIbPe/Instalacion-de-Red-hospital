// ===== jerarquia.js: mesas y equipos anclados a sus puestos (Fase 6) =====
// Mesa: item de tipo 'mesa' con `puestos` en fila a lo largo de su ancho (eje x local). Equipo sobre una mesa: `parent` (id de la mesa), `puesto` (desde 0) y `lrot` (giro respecto de la mesa).
// Se aparta de D2 a propósito: no se guarda lx/ly. La posición sale del puesto en cada render (sincronizar), así mover, girar, redimensionar,
// cambiar los puestos, editar en el inspector y deshacer quedan cubiertos en un solo lugar y los equipos nunca se salen ni se enciman.
// Reglas (problema): largo >= puestos × 0,50 m; equipos <= puestos; cada equipo cabe en la mesa (largo y fondo); la suma de los largos de los equipos no supera el de la mesa.
// La asociación mesa-equipo es solo visual: no se dibuja ninguna línea entre ellos (no se confunde con una conexión de red).
TR.jer = (() => {
  const PUESTO = .5, EPS = 1e-6;
  const norm = a => r3(((a % 360) + 360) % 360);
  const hijosDe = (m, ver = x => x) => S.objs.map(ver).filter(o => o.parent == m.id).sort((a, b) => a.puesto - b.puesto);
  const ext = o => { const t = (o.lrot || 0) * Math.PI / 180, c = Math.abs(Math.cos(t)), s = Math.abs(Math.sin(t)); return { l: o.w * c + o.h * s, p: o.w * s + o.h * c }; };   // largo (a lo largo de la mesa) y fondo del equipo
  const centro = (m, i) => -m.w / 2 + (i + .5) * m.w / (m.puestos || 1);
  const soltar = o => { delete o.parent; delete o.puesto; delete o.lrot; };
  const ver = cand => { const mp = new Map(cand.map(c => [c.id, c])); return o => mp.get(o.id) || o; };   // estado final: las copias cambiadas reemplazan a sus originales
  const sinHijos = os => os.filter(o => o.parent == null || !os.some(x => x.id == o.parent));   // R6: un hijo cuya mesa también está seleccionada se mueve y gira con ella, no por su cuenta

  function ubicar(m, hs) {                 // x local de cada hijo: en el centro de su puesto, corrido lo justo para no salirse ni encimarse (cabe porque la suma no supera el largo)
    const e = hs.map(o => ext(o).l), xs = hs.map(o => centro(m, o.puesto));
    for (let i = 0; i < xs.length; i++) xs[i] = Math.max(xs[i], i ? xs[i - 1] + (e[i - 1] + e[i]) / 2 : (e[i] - m.w) / 2);
    for (let i = xs.length - 1; i >= 0; i--) xs[i] = Math.min(xs[i], i < xs.length - 1 ? xs[i + 1] - (e[i + 1] + e[i]) / 2 : (m.w - e[i]) / 2);
    return xs;
  }
  function sincronizar() {                 // lo llama renderObjetos: posición, giro, planta y capa de cada hijo salen de su mesa (R5)
    const mesas = new Map(S.objs.filter(esMesa).map(m => [m.id, m])), arr = drag && drag.m == 'mv' && drag.os || [];
    S.objs.forEach(o => { if (o.parent != null && (!mesas.has(o.parent) || tipoDe(o) != 'dispositivo')) soltar(o); });   // archivo dañado (mesa inexistente, o una mesa o escalera con padre): queda suelto
    for (const m of mesas.values()) {
      const hs = hijosDe(m); if (!hs.length) continue;
      if (hs.some((o, i) => !(o.puesto < (m.puestos || 1)) || (i && o.puesto == hs[i - 1].puesto))) hs.forEach((o, i) => { o.puesto = i; });   // puestos fuera de rango o repetidos (se bajaron los puestos): se reacomodan en orden
      const xs = ubicar(m, hs);
      hs.forEach((o, i) => {
        if (arr.includes(o) && !arr.includes(m)) return;   // se está arrastrando solo: sigue al cursor hasta soltarlo
        const q = rotP({ x: m.x + xs[i], y: m.y }, m, m.rot || 0);
        o.x = r3(q.x); o.y = r3(q.y); o.rot = norm((m.rot || 0) + (o.lrot || 0)); o.pl = m.pl; o.cp = m.cp;
      });
    }
  }
  function problemaMesa(m, v = x => x, extra = []) {   // extra: equipo nuevo que todavía no está en S
    const n = m.puestos || 1, hs = hijosDe(m, v).concat(extra), es = hs.map(ext), suma = es.reduce((a, e) => a + e.l, 0);
    if (m.w < n * PUESTO - EPS) return `Con ${n} puestos la mesa necesita al menos ${fmt(n * PUESTO, 'm')} de largo`;
    if (hs.length > n) return `La mesa tiene ${hs.length} equipos: no puede tener menos puestos`;
    const i = es.findIndex(e => e.l > m.w + EPS || e.p > m.h + EPS); if (i >= 0) return `«${hs[i].label || hs[i].n || 'El equipo'}» es más grande que la mesa`;
    if (suma > m.w + EPS) return `Los equipos no entran en la mesa: suman ${fmt(suma, 'm')} y la mesa mide ${fmt(m.w, 'm')}`;
    return null;
  }
  function problema(cand, v = ver(cand)) {   // primer aviso de las mesas que tocan los objetos cand (en el estado final v), o null
    const ids = new Set(); (cand || []).forEach(c => { if (esMesa(c)) ids.add(c.id); if (c.parent != null) ids.add(c.parent); });
    if ((cand || []).filter(esMesa).some(c => pisada(v(c), v))) return ENCIMA;
    for (const id of ids) { const o = byId(id), m = o && v(o); const msg = m && esMesa(m) && problemaMesa(m, v); if (msg) return msg; }
    return null;
  }
  // ---------- Mesas superpuestas: una mesa no puede ir encima de otra de la misma planta (tocarse por el borde sí) ----------
  const ENCIMA = 'Una mesa no puede ir encima de otra';
  const esquinas = m => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => rotP({ x: m.x + a * m.w / 2, y: m.y + b * m.h / 2 }, m, m.rot || 0));
  function seSolapan(a, b) {               // rectángulos girados: separados si en alguno de los 4 ejes de sus lados las proyecciones no se pisan (ejes separadores)
    const A = esquinas(a), B = esquinas(b);
    for (const P of [A, B]) for (let i = 0; i < 2; i++) {
      const nx = P[i].y - P[i + 1].y, ny = P[i + 1].x - P[i].x, tol = 1e-3 * Math.hypot(nx, ny), pr = Q => Q.map(q => q.x * nx + q.y * ny), pa = pr(A), pb = pr(B);
      if (Math.max(...pa) <= Math.min(...pb) + tol || Math.max(...pb) <= Math.min(...pa) + tol) return false;
    }
    return true;
  }
  const plDe = o => o.pl === undefined ? S.plantaAct : o.pl;
  const pisada = (m, v = x => x, extra = []) => S.objs.map(v).concat(extra).some(o => o !== m && (m.id == null || o.id !== m.id) && esMesa(o) && plDe(o) == plDe(m) && seSolapan(m, o));
  const mesasNuevas = nuevas => nuevas.some(m => esMesa(m) && pisada(m, x => x, nuevas.filter(x => x !== m))) ? ENCIMA : null;   // mesas que todavía no están en S (colocar o pegar)
  function mesaEn(p) {                     // mesa editable de la planta actual bajo el punto p (la que se ve arriba: capa más alta y, en la misma capa, la última)
    return S.objs.filter(m => esMesa(m) && esEditable(m)).reverse().sort((a, b) => rangoCapa(b) - rangoCapa(a)).find(m => { const l = rotP(p, m, -(m.rot || 0)); return Math.abs(l.x - m.x) <= m.w / 2 && Math.abs(l.y - m.y) <= m.h / 2; });
  }
  function anclar(o, m) {                  // o al puesto libre más cercano de m; devuelve el aviso si no se puede (o no cambia)
    const ocup = new Set(hijosDe(m).filter(h => h !== o).map(h => h.puesto)), lx = rotP(o, m, -(m.rot || 0)).x - m.x;
    const libres = [...Array(m.puestos || 1).keys()].filter(i => !ocup.has(i)); if (!libres.length) return 'La mesa no tiene puestos libres';
    const pu = libres.reduce((a, b) => Math.abs(centro(m, b) - lx) < Math.abs(centro(m, a) - lx) ? b : a);
    const c = { ...o, parent: m.id, puesto: pu, lrot: norm((o.rot || 0) - (m.rot || 0)) }, msg = problemaMesa(m, ver([c]), S.objs.includes(o) ? [] : [c]); if (msg) return msg;
    Object.assign(o, c); return null;
  }
  function alSoltar(o) {                   // equipo colocado o soltado: sobre una mesa se ancla y fuera de ella se desancla; devuelve el aviso si no entra en la mesa (o no cambia)
    if (tipoDe(o) != 'dispositivo') return null;
    const m = mesaEn(o); if (!m) { soltar(o); return null; }
    return anclar(o, m);
  }
  function puedeColocar(o) {               // equipo nuevo (todavía fuera de S): sobre una mesa sin lugar no se coloca
    const msg = mesasNuevas([o]) || alSoltar(o); if (msg) avisoEmergente(msg + (esMesa(o) ? ': la mesa' : ': el equipo') + ' no se colocó'); return !msg;
  }
  function alSoltarArrastre(d) {           // fin de un arrastre que cambió algo: al mover se anclan o desanclan los equipos; al girar se valida
    const os = d.os || [];
    if (d.m == 'mv' && problema(os.filter(esMesa), x => x)) { descartarPaso(d.fut); avisoEmergente(ENCIMA + ': la mesa vuelve a donde estaba'); return; }
    if (d.m == 'mv') { for (const o of sinHijos(os).sort((a, b) => !!mesaEn(a) - !!mesaEn(b))) {   // primero se desanclan los que quedan fuera de toda mesa, así liberan su puesto
      const msg = alSoltar(o); if (msg) { descartarPaso(d.fut); avisoEmergente(msg + ': el equipo vuelve a donde estaba'); return; } } }   // sin lugar en la mesa: se deshace todo el arrastre
    else { const msg = problema(os, x => x); if (msg) { descartarPaso(d.fut); avisoEmergente(msg); } }
  }
  const hijosDeIds = ids => S.objs.filter(o => o.parent != null && ids.includes(o.parent) && !ids.includes(o.id)).map(o => o.id);   // equipos de las mesas ids que no están ya en la lista

  function dibujar(o, id) {
    const n = o.puestos || 1, w = o.w, h = o.h, div = Array.from({ length: n - 1 }, (_, i) => `M${r3(-w / 2 + (i + 1) * w / n)} ${-h / 2}V${h / 2}`).join('');
    return `<g ${id} transform="translate(${o.x} ${o.y}) rotate(${o.rot || 0})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx=".04" fill="#efe4d0" stroke="#8a6d45" stroke-width=".04"/>${div ? `<path d="${div}" stroke="#8a6d45" stroke-width=".02" stroke-dasharray=".08 .06" pointer-events="none"/>` : ''}</g>`
      + (o.label ? T(o.x, bboxDe(o).y1 + .3, o.label) : '');
  }

  TR.acc.sinColor.push(esMesa);           // D18
  TR.acc.registrarCampo({ id: 'puestos', sec: 'geo', et: 'Puestos', t: 'num', aplica: esMesa, leer: o => o.puestos || 1, parse: v => { const n = Number(String(v).replace(',', '.')); return Number.isInteger(n) && n >= 1 && n <= 50 ? n : undefined; }, poner: (o, v) => { o.puestos = v; o.w = Math.max(o.w, r3(v * PUESTO)); } });   // al subir los puestos la mesa crece hasta su largo mínimo

  return { PUESTO, sincronizar, problema, ver, sinHijos, mesaEn, anclar, alSoltar, puedeColocar, mesasNuevas, alSoltarArrastre, hijosDeIds, dibujar, ext };
})();
