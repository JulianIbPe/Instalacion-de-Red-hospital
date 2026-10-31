// ===== esquema.js: formato de proyecto versión 2, validación, saneamiento y migración desde la versión 1 (Fase 2) =====
// Archivo v2: { formato: 'topologias-de-red', version: 2, estado: {…S}, recursos: { imgs, modelos } }
// Archivo v1 (anterior): el propio estado, plano, con version: 1 (o sin version). Se migra automáticamente al leerlo.
// leer(texto) NUNCA toca S ni R: construye un estado NUEVO copiando solo los campos conocidos (lista blanca) con sus valores saneados.
//   · Errores (el archivo se rechaza y no se cambia nada): JSON inválido, versión desconocida, objetos sin id o de clase desconocida, ids repetidos,
//     coordenadas o medidas esenciales no numéricas, imágenes inválidas o que superan los límites.
//   · Avisos (el archivo se abre y se informa): colores, textos y números fuera de rango corregidos, campos desconocidos omitidos,
//     referencias a objetos inexistentes soltadas, puertas sin pared omitidas.
// REGLA R9: todo campo nuevo de un objeto debe añadirse aquí (ESPEC); si no, se omite al abrir. La prueba de ida y vuelta lo detecta.
const ESQ = (() => {
  const VERSION = 2, FORMATO = 'topologias-de-red';
  const LIM = { objetos: 100000, puntos: 10000, texto: 500, nombre: 100, coord: 1e5, plantas: 200, capas: 200, modelos: 500, grupos: 32 };
  const INV = Symbol('inválido');
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const RE_ID = /^[A-Za-z0-9_-]{1,32}$/, RE_COLOR = /^#[0-9a-fA-F]{3,8}$/, RE_DASH = /^[0-9. ]{0,40}$/, RE_ETQ = /^[a-z0-9-]{1,32}$/, RE_IMG = /^i_[0-9a-f]{8,14}$/, RE_MOD = /^m\d{1,9}$/;
  const CTRL = /[\u0000-\u001f\u007f]/g;
  const aviso = (c, m) => c.av.set(m, (c.av.get(m) || 0) + 1);
  const error = (c, m) => { c.fatal = true; if (c.er.length < 50) c.er.push(m); return null; };

  // ---- validadores: devuelven el valor saneado o INV ----
  const entero = (min, max) => v => Number.isInteger(v) && v >= min && v <= max ? v : INV;
  const numero = (min, max) => (v, c) => { if (typeof v != 'number' || !isFinite(v)) return INV; if (v < min || v > max) { aviso(c, 'valores numéricos fuera de rango corregidos'); return Math.min(max, Math.max(min, v)); } return v; };
  const texto = max => (v, c) => { if (typeof v != 'string') return INV; const s = v.replace(CTRL, ''); if (s.length != v.length || s.length > max) aviso(c, 'textos con caracteres de control o demasiado largos corregidos'); return s.slice(0, max); };
  const color = v => typeof v == 'string' && RE_COLOR.test(v) ? v : INV;
  const dash = v => typeof v == 'string' && RE_DASH.test(v) ? v : INV;
  const en = lista => v => lista.includes(v) ? v : INV;
  const patron = (re, max = 64) => v => typeof v == 'string' && v.length <= max && re.test(v) ? v : INV;
  const icono = v => typeof v == 'string' && v.length <= 16 && !/[<>&"'`\\\u0000-\u001f]/.test(v) ? v : INV;
  const coord = numero(-LIM.coord, LIM.coord), dim = numero(0, 1e5), ang = numero(-7200, 7200);
  const idNum = entero(1, Number.MAX_SAFE_INTEGER), idTxt = patron(RE_ID, 32), etq = patron(RE_ETQ, 32);
  const puntoSimple = (v, c) => { if (!v || typeof v != 'object') return INV; const x = coord(v.x, c), y = coord(v.y, c); return x === INV || y === INV ? INV : { x, y }; };
  const punto = (v, c) => {                // punto de un cable: {x, y} y, opcionalmente, unión a un objeto (ref) o al nodo de otra línea (rl, ri)
    const p = puntoSimple(v, c); if (p === INV) return INV;
    for (const k of Object.keys(v)) {
      if (k == 'x' || k == 'y') continue;
      const f = k == 'ref' || k == 'rl' ? idNum : k == 'ri' ? entero(0, LIM.puntos) : null; const val = f ? f(v[k]) : INV;
      if (val === INV) aviso(c, 'campos desconocidos omitidos'); else p[k] = val;
    }
    return p;
  };
  const lista = (f, min, max) => (v, c) => { if (!Array.isArray(v) || v.length < min || v.length > max) return INV; const r = v.map(q => f(q, c)); return r.includes(INV) ? INV : r; };
  const vertice = (v, c) => { if (!Array.isArray(v) || v.length != 2) return INV; const x = numero(-10, 10)(v[0], c), y = numero(-10, 10)(v[1], c); return x === INV || y === INV ? INV : [x, y]; };

  const COMUNES = { pl: idTxt, cp: idTxt, tipo: v => own(TIPOS, v) ? v : INV, sub: etq };
  const ESPEC = {
    item: { req: ['x', 'y', 'w', 'h'], f: { n: texto(LIM.nombre), ic: icono, x: coord, y: coord, w: dim, h: dim, rot: ang, label: texto(LIM.texto), c: color, t: en(['descanso', 'espiral']), img: patron(RE_IMG), modelo: patron(RE_MOD) } },
    line: { req: ['pts'], def: { c: '#444444', w: 0.06 }, f: { n: texto(LIM.nombre), c: color, w: numero(0.001, 50), d: dash, pts: lista(punto, 1, LIM.puntos), label: texto(LIM.texto) } },
    shape: { req: ['x', 'y', 'w', 'h'], f: { n: texto(LIM.nombre), x: coord, y: coord, w: dim, h: dim, rot: ang, c: color, f: patron(/^[a-z0-9-]{1,16}$/, 16), ls: en(['con', 'par', 'dis', 'pun', 'mix']), label: texto(LIM.texto), u: lista(vertice, 3, 1000), hid: lista(entero(0, 1000), 0, 1000) } },
    zona: { req: ['s', 'x', 'y', 'w', 'h'], f: { s: en(['r', 'e']), n: texto(LIM.nombre), x: coord, y: coord, w: dim, h: dim, rot: ang, c: color, f: patron(/^[a-z0-9-]{1,16}$/, 16), ls: en(['con', 'par', 'dis', 'pun', 'mix']), label: texto(LIM.texto) } },
    texto: { req: ['x', 'y', 'label'], f: { x: coord, y: coord, label: texto(LIM.texto), rot: ang } },
    medida: { req: ['a', 'b'], f: { a: puntoSimple, b: puntoSimple, off: numero(-1e4, 1e4), u: en(['m', 'cm']) } },
    puerta: { req: ['pared', 'si', 's', 'w', 'lado', 'hojas', 'bis'], f: { pared: idNum, si: entero(0, LIM.puntos), s: numero(0, 1e5), w: numero(0.01, 1e3), lado: en([1, -1]), hojas: en([1, 2]), bis: en(['izq', 'der']) } }
  };
  const MODELO = { nombre: texto(LIM.nombre), marca: texto(LIM.nombre), cat: etq, tipo: v => own(TIPOS, v) ? v : INV, sub: etq, w: numero(0.01, 100), h: numero(0.01, 100), ic: icono, img: patron(RE_IMG), uAlto: entero(1, 60), uTotal: entero(1, 60), v: entero(1, 1e6), base: patron(RE_MOD),
    puertos: lista((g, c) => { if (!g || typeof g != 'object') return INV; const r = {}; for (const [k, f] of [['g', patron(/^g\d{1,3}$/, 8)], ['n', entero(1, 512)], ['tipo', etq], ['vel', texto(10)], ['pref', texto(20)]]) { if (g[k] === undefined) continue; const v = f(g[k], c); if (v === INV) return INV; r[k] = v; } return r.g && r.n ? r : INV; }, 0, LIM.grupos) };

  function sanearObjeto(c, o, i) {
    if (!o || typeof o != 'object' || Array.isArray(o)) return error(c, `objeto ${i + 1}: no es un objeto`);
    if (!own(ESPEC, o.k)) return error(c, `objeto ${i + 1}: clase desconocida «${String(o.k).slice(0, 20)}»`);
    const esp = ESPEC[o.k], id = idNum(o.id); if (id === INV) return error(c, `objeto ${i + 1}: identificador inválido`);
    const r = { id, k: o.k };
    for (const clave of Object.keys(o)) {
      if (clave == 'id' || clave == 'k') continue;
      const fn = own(esp.f, clave) ? esp.f[clave] : own(COMUNES, clave) ? COMUNES[clave] : null;
      if (!fn) { aviso(c, 'campos desconocidos omitidos'); continue; }
      const v = fn(o[clave], c);
      if (v === INV) { if (esp.req.includes(clave)) return error(c, `objeto ${id}: «${clave}» no es válido`); aviso(c, 'valores inválidos omitidos'); continue; }
      r[clave] = v;
    }
    for (const q of esp.req) if (r[q] === undefined) return error(c, `objeto ${id}: falta «${q}»`);
    if (esp.def) for (const [q, dv] of Object.entries(esp.def)) if (r[q] === undefined) { r[q] = dv; aviso(c, 'valores ausentes o inválidos reemplazados por su valor predeterminado'); }   // color y grosor de un cable: se pueden reponer
    if (r.tipo && TIPOS[r.tipo].k != r.k) { aviso(c, 'tipos incoherentes con la clase del objeto corregidos'); delete r.tipo; delete r.sub; }
    return r;
  }
  function sanearPlantas(c, v) {
    if (!Array.isArray(v) || v.length > LIM.plantas) { error(c, 'La lista de plantas no es válida'); return null; }
    const ids = new Set(), out = [];
    for (const p of v) {
      if (!p || typeof p != 'object' || idTxt(p.id) === INV || ids.has(p.id)) { error(c, 'Hay una planta sin identificador válido o repetida'); return null; }
      ids.add(p.id);
      const cap = p.capas === undefined ? [] : p.capas;                // sin capas: normalizar() crea la capa «Base»
      if (!Array.isArray(cap) || cap.length > LIM.capas) { error(c, `Las capas de la planta «${String(p.id).slice(0, 20)}» no son válidas`); return null; }
      const cids = new Set(), capas = [];
      for (const k of cap) {
        if (!k || typeof k != 'object' || idTxt(k.id) === INV || cids.has(k.id)) { error(c, 'Hay una capa sin identificador válido o repetida'); return null; }
        cids.add(k.id); capas.push({ id: k.id, nombre: texto(LIM.nombre)(k.nombre, c) === INV ? 'Capa' : texto(LIM.nombre)(k.nombre, c), visible: k.visible !== false, bloqueada: k.bloqueada === true });
      }
      const nombre = texto(LIM.nombre)(p.nombre, c), r = { id: p.id, nombre: nombre === INV ? 'Planta' : nombre };   // mismo orden de campos que el estado original
      if (p.ca !== undefined && idTxt(p.ca) !== INV) r.ca = p.ca;
      r.capas = capas; out.push(r);
    }
    return out;
  }
  function sanearEstado(c, d) {
    if (!d || typeof d != 'object' || Array.isArray(d)) return error(c, 'El archivo no contiene un proyecto');
    for (const k of Object.keys(d)) if (!['version', 'formato', 'edificio', 'unidad', 'plantas', 'plantaAct', 'capaAct', 'pn', 'cn', 'objs'].includes(k)) aviso(c, 'campos desconocidos omitidos');
    if (!Array.isArray(d.objs)) return error(c, 'Falta la lista de objetos («objs»)');
    if (d.objs.length > LIM.objetos) return error(c, `El proyecto tiene ${d.objs.length} objetos; el máximo es ${LIM.objetos}`);
    const r = {};
    if (d.edificio !== undefined) { const w = numero(0.5, 1e4)(d.edificio && d.edificio.w, c), h = numero(0.5, 1e4)(d.edificio && d.edificio.h, c); if (w === INV || h === INV) return error(c, 'El tamaño del edificio no es válido'); r.edificio = { w, h }; }
    if (d.unidad !== undefined) { const u = en(['m', 'cm'])(d.unidad); if (u === INV) aviso(c, 'valores inválidos omitidos'); else r.unidad = u; }
    if (d.plantas !== undefined) { const p = sanearPlantas(c, d.plantas); if (!p) return null; r.plantas = p; }
    for (const k of ['plantaAct', 'capaAct']) if (d[k] !== undefined) { const v = idTxt(d[k]); if (v !== INV) r[k] = v; }
    for (const k of ['pn', 'cn']) if (d[k] !== undefined) { const v = entero(0, 1e6)(d[k]); if (v !== INV) r[k] = v; }
    const objs = d.objs.map((o, i) => sanearObjeto(c, o, i)); if (c.fatal) return null;
    const ids = new Set(); for (const o of objs) { if (ids.has(o.id)) return error(c, `El identificador ${o.id} está repetido`); ids.add(o.id); }
    const porId = new Map(objs.map(o => [o.id, o]));
    objs.forEach(o => { if (o.k != 'line') return; o.pts.forEach(q => {          // uniones a objetos o nodos que ya no existen: el punto queda libre donde estaba
      if (q.ref && !ids.has(q.ref)) { delete q.ref; aviso(c, 'uniones a objetos inexistentes soltadas'); }
      if (q.rl) { const L = porId.get(q.rl); if (!L || L.k != 'line' || q.ri === undefined || !L.pts[q.ri]) { delete q.rl; delete q.ri; aviso(c, 'uniones a objetos inexistentes soltadas'); } } else if (q.ri !== undefined) delete q.ri;
    }); });
    r.objs = objs.filter(o => { if (o.k != 'puerta') return true; const w = porId.get(o.pared); if (w && w.k == 'line') return true; aviso(c, 'puertas sin pared omitidas'); return false; });
    return r;
  }
  function sanearRecursos(c, rec) {
    const out = { imgs: {}, modelos: {} }; if (rec === undefined || rec === null) return out;
    if (typeof rec != 'object' || Array.isArray(rec) || (rec.imgs !== undefined && (typeof rec.imgs != 'object' || Array.isArray(rec.imgs))) || (rec.modelos !== undefined && (typeof rec.modelos != 'object' || Array.isArray(rec.modelos)))) { error(c, 'La sección de recursos no es válida'); return out; }
    for (const id of Object.keys(rec.imgs || {})) {
      const im = rec.imgs[id];
      if (!RE_IMG.test(id)) { error(c, `imagen «${id.slice(0, 20)}»: identificador no válido`); continue; }
      const v = validarImagen(im && im.data, R.limites); if (!v.ok) { error(c, `imagen ${id}: ${v.error}`); continue; }
      if (idImagen(im.data) !== id) { error(c, `imagen ${id}: el identificador no coincide con su contenido`); continue; }
      out.imgs[id] = { mime: v.mime, data: im.data, w: v.w, h: v.h, bytes: v.bytes, nombre: typeof im.nombre == 'string' ? im.nombre.replace(CTRL, '').slice(0, 100) : '' };
    }
    const total = totalBytesDe(out.imgs); if (total > R.limites.total) error(c, `Las imágenes del archivo suman ${(total / MB).toFixed(1)} MB y el máximo es ${+(R.limites.total / MB).toFixed(1)} MB`);
    const ids = Object.keys(rec.modelos || {}); if (ids.length > LIM.modelos) error(c, 'Hay demasiados modelos');
    for (const id of ids.slice(0, LIM.modelos)) {
      const m = rec.modelos[id]; if (!RE_MOD.test(id) || !m || typeof m != 'object') { error(c, `modelo «${id.slice(0, 20)}» no válido`); continue; }
      const r = {};
      for (const k of Object.keys(m)) { if (!own(MODELO, k)) { aviso(c, 'campos desconocidos omitidos'); continue; } const v = MODELO[k](m[k], c); if (v === INV) { if (k == 'nombre') { error(c, `modelo ${id}: nombre no válido`); } else aviso(c, 'valores inválidos omitidos'); } else r[k] = v; }
      if (r.nombre === undefined) { error(c, `modelo ${id}: falta el nombre`); continue; }
      if (r.img && !out.imgs[r.img]) { delete r.img; aviso(c, 'referencias a imágenes inexistentes omitidas'); }
      if (r.puertos && new Set(r.puertos.map(g => g.g)).size != r.puertos.length) { error(c, `modelo ${id}: grupos de puertos repetidos`); continue; }
      out.modelos[id] = r;
    }
    return out;
  }
  function migrarV1(d) { const e = { ...d }; delete e.version; return { estado: e, recursos: undefined }; }   // v1 es plano: el proyecto es el propio objeto; no tiene recursos

  function leer(txt) {
    const c = { er: [], av: new Map(), fatal: false }, fallo = m => ({ ok: false, errores: c.er.length ? c.er : [m] });
    let d; try { d = JSON.parse(txt); } catch { return fallo('El archivo no es JSON válido.'); }
    if (!d || typeof d != 'object' || Array.isArray(d)) return fallo('El archivo no parece un proyecto de Topologías de red.');
    let version, crudo;
    if (d.formato === FORMATO) {
      if (d.version !== VERSION) return fallo(typeof d.version == 'number' && d.version > VERSION ? `El archivo es de una versión más nueva (${d.version}); esta aplicación entiende hasta la ${VERSION}.` : 'La versión del archivo no es válida.');
      version = 2; crudo = { estado: d.estado, recursos: d.recursos };
    } else if ((d.version === undefined || d.version === 1) && 'objs' in d) { version = 1; crudo = migrarV1(d); }
    else return fallo('El archivo no parece un proyecto de Topologías de red.');
    const estado = sanearEstado(c, crudo.estado), recursos = sanearRecursos(c, crudo.recursos);
    if (c.fatal || !estado) return fallo('El archivo no es válido.');
    estado.objs.forEach(o => {            // referencias a recursos que el archivo no trae: se quitan
      if (o.img && !recursos.imgs[o.img]) { delete o.img; aviso(c, 'referencias a imágenes inexistentes omitidas'); }
      if (o.modelo && !recursos.modelos[o.modelo]) { delete o.modelo; aviso(c, 'referencias a modelos inexistentes omitidas'); }
      completarTipo(o);                   // migración v1 → v2: los objetos antiguos reciben su tipo estable
    });
    return { ok: true, version, estado, recursos, avisos: [...c.av].map(([m, n]) => n > 1 ? `${m} (${n})` : m) };
  }
  function serializar(estado, rec = R) {  // texto de un archivo v2; se rechaza lo que luego no se podría volver a abrir
    let copia; try { copia = JSON.parse(JSON.stringify(estado)); } catch { return { ok: false, error: 'El proyecto no se puede serializar.' }; }
    delete copia.version; (copia.objs || []).forEach(completarTipo);
    const r = rec.paraGuardar(copia); if (r.error) return { ok: false, error: r.error };
    const txt = JSON.stringify({ formato: FORMATO, version: VERSION, estado: copia, recursos: r }, null, 1), chk = leer(txt);
    if (!chk.ok) return { ok: false, error: 'El proyecto actual no se puede guardar porque no pasaría la validación al abrirlo:\n' + chk.errores.slice(0, 5).join('\n') };
    return { ok: true, texto: txt, avisos: chk.avisos };
  }
  return { VERSION, FORMATO, leer, serializar, sanearEstado, sanearRecursos, LIM };
})();
