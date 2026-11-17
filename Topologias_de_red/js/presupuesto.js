// ===== presupuesto.js (F9B): presupuesto del proyecto (equipos y cables) y exportación a CSV =====
// · S.presupuesto = {holgura?, conCables?, cables?: {sub: {precio?, moneda?}}}: entra en el historial (cada cambio es un paso). 'parche' = patch cords.
// · Los precios de los equipos son de su MODELO (R.modelos, como en el inspector): no son pasos de historial.
// · Cada objeto de S.objs se cuenta una vez: un equipo en un rack o una mesa es el mismo objeto (D2). Se cuenta todo el proyecto, sin mirar plantas ni capas ocultas (D10).
// · Sin precio = «pendiente de cotización» (no suma como 0). Las monedas nunca se suman entre sí: hay un total por moneda.
TR.pres = (() => {
  const SIN = 'sin moneda', PARCHE = 'parche';
  const pres = () => S.presupuesto || {};
  const conPrecio = s => s == PARCHE || Object.values(SUB_CABLE).includes(s);   // los mismos que acepta esquema.js: un tipo desconocido (archivo viejo) no lleva precio, porque no se podría guardar
  const nombreCable = s => s == PARCHE ? 'Patch cord (estimada)' : (Object.entries(SUB_CABLE).find(([, v]) => v == s) || [s])[0];
  const nombreCat = id => (CATS.find(k => k.id == id) || { t: 'Sin categoría' }).t;
  const sumar = (tot, mon, v) => tot.set(mon, (tot.get(mon) || 0) + v);

  function calcular() {
    const cab = new Map(), eq = new Map();
    const cable = s => cab.get(s) || cab.set(s, { sub: s, nombre: nombreCable(s), cant: 0, medida: 0, inst: 0 }).get(s);
    for (const o of S.objs) {
      const m = TR.cab.medida(o);
      if (m != null) { const g = cable(subDe(o)); g.cant++; g.medida += m; g.inst += TR.cab.instalacion(m); continue; }
      if (!['dispositivo', 'rack'].includes(tipoDe(o))) continue;
      const md = o.modelo && R.modelos[o.modelo], k = md ? o.modelo : 'n:' + (o.n || '');
      const g = eq.get(k) || eq.set(k, { id: md ? o.modelo : null, nombre: md ? md.nombre : o.n || 'Sin nombre', cat: nombreCat(md && md.cat), cant: 0, precio: md && md.precio, moneda: md && md.moneda }).get(k);
      g.cant++;
    }
    for (const c of S.conex || []) { const e = TR.cab.estimada(c); if (e != null) { const g = cable(PARCHE); g.cant++; g.medida += e; g.inst += e; } }   // ya es una estimación de instalación: sin holgura
    const tot = { eq: new Map(), cab: new Map() }; let pend = 0;
    const cables = [...cab.values()].map(g => { const p = (pres().cables || {})[g.sub] || {}; return { ...g, precio: p.precio, moneda: p.moneda }; });
    for (const g of cables) { g.sub_t = g.precio != null ? g.inst * g.precio : null; if (g.sub_t == null) pend++; else sumar(tot.cab, g.moneda || SIN, g.sub_t); }
    const equipos = [...eq.values()].sort((a, b) => a.cat.localeCompare(b.cat) || a.nombre.localeCompare(b.nombre));
    for (const g of equipos) { g.sub_t = g.precio != null ? g.cant * g.precio : null; if (g.sub_t == null) pend++; else sumar(tot.eq, g.moneda || SIN, g.sub_t); }
    const cats = new Map(); for (const g of equipos) { const t = cats.get(g.cat) || cats.set(g.cat, new Map()).get(g.cat); if (g.sub_t != null) sumar(t, g.moneda || SIN, g.sub_t); }
    const general = new Map(tot.eq); if (pres().conCables !== false) for (const [m, v] of tot.cab) sumar(general, m, v);
    return { cables, equipos, cats, tot, general, pend };
  }

  // ---------- Cambios (cada uno un paso de historial) ----------
  function fijar(fn) {                      // el resultado queda con el orden de campos de esquema.js (holgura, conCables, cables): así guardar → abrir → guardar da el mismo archivo
    const q = JSON.parse(JSON.stringify(pres())); fn(q); const p = {}; for (const k of ['holgura', 'conCables', 'cables']) if (q[k] !== undefined) p[k] = q[k]; if (JSON.stringify(p) == JSON.stringify(pres())) return false; push(); if (Object.keys(p).length) S.presupuesto = p; else delete S.presupuesto; render(); return true; }
  const fijarHolgura = v => v >= 0 && v <= 100 && fijar(p => { if (v == TR.cab.HOLGURA) delete p.holgura; else p.holgura = v; });
  const fijarConCables = v => fijar(p => { if (v) delete p.conCables; else p.conCables = false; });
  function fijarCable(sub, k, v) {         // k = 'precio' (número >= 0; vacío lo borra) o 'moneda' ('' la borra)
    if (!conPrecio(sub) || (k == 'precio' && v !== '' && !(+v >= 0 && +v <= 1e12))) return false;
    return fijar(p => {
      const cs = p.cables || (p.cables = {}), e = cs[sub] || (cs[sub] = {});
      if (v === '') delete e[k]; else e[k] = k == 'precio' ? +v : v;
      cs[sub] = {}; for (const x of ['precio', 'moneda']) if (e[x] !== undefined) cs[sub][x] = e[x];   // mismo orden que esquema.js
      if (!Object.keys(cs[sub]).length) delete cs[sub]; if (!Object.keys(cs).length) delete p.cables;
    });
  }

  // ---------- CSV (separador ;, BOM UTF-8, coma decimal, números sin comillas) ----------
  const num = v => v == null ? '' : v.toFixed(2).replace('.', ',');
  const texto = v => /^[=+\-@\t\r]/.test(v) ? "'" + v : v;   // un nombre que empieza con = + - @ no debe ejecutarse como fórmula en Excel (los .json se comparten)
  const campo = v => /[;"\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  function csv(r = calcular()) {
    const filas = [['Sección', 'Categoría', 'Concepto', 'Cantidad', 'Unidad', 'Precio unitario', 'Moneda', 'Subtotal', 'Estado']];
    const totales = (sec, et, t) => { for (const [m, v] of t) filas.push([sec, '', et, '', '', '', m, num(v), '']); };
    for (const g of r.cables) filas.push(['Cables', '', texto(`${g.nombre}: ${g.cant} cable(s), medida ${num(g.medida)} m`), num(g.inst), 'm', num(g.precio), g.moneda || '', num(g.sub_t), g.sub_t == null ? 'pendiente de cotización' : '']);
    totales('Cables', 'Total cables', r.tot.cab);
    for (const g of r.equipos) filas.push(['Equipos', g.cat, texto(g.nombre), String(g.cant), 'u', num(g.precio), g.moneda || '', num(g.sub_t), g.sub_t == null ? 'pendiente de cotización' : '']);
    for (const [c, t] of r.cats) totales('Equipos', 'Subtotal ' + c, t);
    totales('Equipos', 'Total equipos', r.tot.eq);
    totales('Total', pres().conCables === false ? 'Total general (sin cables)' : 'Total general', r.general);
    return '﻿' + filas.map(f => f.map(campo).join(';')).join('\r\n') + '\r\n';
  }

  // ---------- Diálogo ----------
  const dlg = document.createElement('dialog'); dlg.id = 'dlg-pres'; dlg.setAttribute('aria-labelledby', 'dp-t');
  dlg.innerHTML = '<h3 id="dp-t">Presupuesto</h3><div id="dp-c"></div><div class="acc"><button type="button" id="dp-csv">Exportar CSV</button><button type="button" id="dp-x" class="prim">Cerrar</button></div>';
  document.body.appendChild(dlg);
  const cuerpo = dlg.querySelector('#dp-c');
  const dinero = v => v == null ? '<i class="pend">pendiente de cotización</i>' : v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const metros = v => v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' m';
  const selMon = (k, v, et) => `<select data-k="${k}" aria-label="${et}"><option value="">—</option>${TR.mod.MONEDAS.map(x => `<option${v == x ? ' selected' : ''}>${x}</option>`).join('')}</select>`;
  const totalesHtml = t => t.size ? [...t].map(([m, v]) => `<b>${dinero(v)} ${m}</b>`).join(' · ') : '—';
  function pintar() {
    const r = calcular(), p = pres();
    let h = `<div class="dp-op"><label>Holgura de instalación <input type="number" id="dp-hol" min="0" max="100" step="1" value="${TR.cab.holgura()}"> %</label>`
      + `<label><input type="checkbox" id="dp-con"${p.conCables === false ? '' : ' checked'}> Incluir los cables en el total general</label></div>`;
    h += '<h4>Cables</h4>' + (r.cables.length ? '<table><tr><th>Tipo</th><th>Cant.</th><th>Medida</th><th>Instalación</th><th>Precio por m</th><th>Moneda</th><th>Subtotal</th></tr>'
      + r.cables.map(g => `<tr data-cab="${g.sub}"><td>${esc(g.nombre)}</td><td>${g.cant}</td><td>${metros(g.medida)}</td><td>${metros(g.inst)}</td>${conPrecio(g.sub) ? `<td><input type="number" data-k="precio" min="0" step="0.01" aria-label="Precio por metro" value="${g.precio ?? ''}"></td><td>${selMon('moneda', g.moneda, 'Moneda')}</td>` : '<td colspan="2" class="dp-n">tipo desconocido</td>'}<td>${dinero(g.sub_t)}</td></tr>`).join('')
      + `</table><p class="dp-t">Total cables: ${totalesHtml(r.tot.cab)}</p>` : '<p class="vacio">No hay cables.</p>');
    h += '<h4>Equipos</h4>' + (r.equipos.length ? '<table><tr><th>Modelo</th><th>Cant.</th><th>Precio unitario</th><th>Moneda</th><th>Subtotal</th></tr>'
      + [...r.cats.keys()].map(c => `<tr class="dp-cat"><td colspan="4">${esc(c)}</td><td>${totalesHtml(r.cats.get(c))}</td></tr>` + r.equipos.filter(g => g.cat == c).map(g => `<tr${g.id ? ` data-mod="${g.id}"` : ''}><td>${esc(g.nombre)}</td><td>${g.cant}</td>`
        + (g.id ? `<td><input type="number" data-k="precio" min="0" step="0.01" aria-label="Precio unitario" value="${g.precio ?? ''}"></td><td>${selMon('moneda', g.moneda, 'Moneda')}</td>` : '<td colspan="2" class="dp-n">sin modelo</td>') + `<td>${dinero(g.sub_t)}</td></tr>`).join('')).join('')
      + `</table><p class="dp-t">Total equipos: ${totalesHtml(r.tot.eq)}</p>` : '<p class="vacio">No hay equipos.</p>');
    h += `<p class="dp-g">Total general${p.conCables === false ? ' (sin cables)' : ''}: ${totalesHtml(r.general)}</p>` + (r.pend ? `<p class="dp-n">${r.pend} renglón(es) pendiente(s) de cotización: no suman.</p>` : '');
    cuerpo.innerHTML = h;
  }
  cuerpo.onchange = e => {
    const t = e.target, k = t.dataset.k, f = t.closest('tr');
    if (t.id == 'dp-hol') { if (!fijarHolgura(t.value === '' ? NaN : +t.value)) t.value = TR.cab.holgura(); }
    else if (t.id == 'dp-con') fijarConCables(t.checked);
    else if (f && f.dataset.cab) fijarCable(f.dataset.cab, k, t.value);
    else if (f && f.dataset.mod) { TR.mod.fijarDato(f.dataset.mod, k, t.value); TR.insp.reconstruir(); }   // dato del modelo, como en el inspector (no es un paso de historial)
    pintar();
  };
  function abrir() { pintar(); dlg.showModal(); }
  function cerrar() { if (dlg.open) dlg.close(); }
  dlg.querySelector('#dp-x').onclick = cerrar;
  dlg.querySelector('#dp-csv').onclick = () => download(URL.createObjectURL(new Blob([csv()], { type: 'text/csv;charset=utf-8' })), 'presupuesto.csv');
  $('#bpres').onclick = abrir;
  return { calcular, csv, fijarHolgura, fijarConCables, fijarCable, abrir, cerrar, pintar };
})();
