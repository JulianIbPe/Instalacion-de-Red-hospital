// ===== rack.js: racks y equipos montados por unidades (Fase 8A) =====
// Rack: item de tipo 'rack' con `us` unidades (sin `us` = las de su modelo o 42). Equipo montado: `parent` (id del rack) y `ru: {u, h}` (D2): u = unidad de abajo (desde 1), h = alto en U.
// El equipo montado es el mismo objeto (conserva identidad, puertos y conexiones). En el plano no se ve (esVisible, plantas.js) y su posición, planta y capa
// son las del rack (sincronizar, R5): por eso sus cables terminan en el rack. Solo es visible y editable con la vista de su rack abierta (vistarack.js).
// Reglas (problema): cada equipo entra en la altura del rack y dos equipos no comparten unidad. Si no se cumplen, no cambia nada ni se guarda historial.
TR.rack = (() => {
  const US = 42, MAX = 60;
  const esRack = o => tipoDe(o) == 'rack';
  const usDe = r => r.us || (modeloDe(r) || {}).uTotal || US;
  const hijosDe = (r, v = x => x, extra = []) => S.objs.map(v).concat(extra).filter(o => o.ru && o.parent == r.id).sort((a, b) => a.ru.u - b.ru.u);
  const nom = o => o.label || o.n || 'El equipo';
  const soltar = o => { if (o.ru) o.uh = o.ru.h; delete o.parent; delete o.ru; delete o.puesto; delete o.lrot; };   // al desmontarse conserva su alto en U (uh)
  const altoDe = o => o.ru ? o.ru.h : o.uh || (modeloDe(o) || {}).uAlto || 1;   // alto en U: el montado el suyo; el suelto el elegido (uh) o el de su modelo
  const ocupadas = r => hijosDe(r).reduce((a, o) => a + o.ru.h, 0);

  function sincronizar() {                 // lo llama renderObjetos: posición, planta y capa de cada equipo montado salen de su rack (R5)
    const racks = new Map(S.objs.filter(esRack).map(r => [r.id, r])), hijos = new Map();
    S.objs.forEach(o => {
      if (!o.ru) return; const r = racks.get(o.parent);
      if (!r || tipoDe(o) != 'dispositivo') return soltar(o);   // archivo dañado o rack inexistente: queda suelto
      o.x = r.x; o.y = r.y; o.pl = r.pl; o.cp = r.cp;
      if (!hijos.has(r)) hijos.set(r, []); hijos.get(r).push(o);
    });
    for (const [r, hs] of hijos) {         // archivo dañado: el equipo que pasa la altura del rack o pisa al de abajo queda suelto (si no, el rack rechazaría todo cambio)
      let tope = 0; hs.sort((a, b) => a.ru.u - b.ru.u).forEach(o => { if (o.ru.u <= tope || o.ru.u + o.ru.h - 1 > usDe(r)) soltar(o); else tope = o.ru.u + o.ru.h - 1; });
    }
  }
  function problemaRack(r, v = x => x, extra = []) {
    const n = usDe(r), hs = hijosDe(r, v, extra);
    for (const [i, o] of hs.entries()) {
      if (o.ru.u + o.ru.h - 1 > n) return `«${nom(o)}» no entra en el rack: llegaría a la U ${o.ru.u + o.ru.h - 1} y el rack tiene ${n}`;
      if (i && hs[i - 1].ru.u + hs[i - 1].ru.h > o.ru.u) return `«${nom(o)}» y «${nom(hs[i - 1])}» no pueden ocupar la misma unidad del rack`;
    }
    return null;
  }
  function problema(cand, v = TR.jer.ver(cand)) {   // primer aviso de los racks que tocan los objetos cand (en el estado final v), o null
    const ids = new Set(); (cand || []).forEach(c => { if (esRack(c)) ids.add(c.id); if (c.ru) ids.add(c.parent); });
    for (const id of ids) { const o = byId(id), r = o && v(o), msg = r && esRack(r) && problemaRack(r, v); if (msg) return msg; }
    return null;
  }
  const en = p => TR.jer.contEn(p, esRack);   // rack editable de la planta actual bajo el punto p
  function montar(o, r) {                  // o a la primera unidad libre de r, desde abajo; devuelve el aviso si no hay lugar (y no cambia nada)
    const h = altoDe(o), n = usDe(r);
    for (let u = 1; u + h - 1 <= n; u++) {
      const c = { ...o, parent: r.id, ru: { u, h } };
      if (problemaRack(r, x => x, [c])) continue;
      Object.assign(o, c); delete o.puesto; delete o.lrot; delete o.uh;
      if (o.id != null && (sel == o.id || multi.includes(o.id))) fijarSeleccion(multi.filter(i => i != o.id));   // deja de verse en el plano: no queda seleccionado
      return null;
    }
    return `El rack no tiene ${h} U libre${h > 1 ? 's seguidas' : ''}`;
  }
  function desmontar(o) {                  // el equipo vuelve al plano, al lado de su rack (un paso de historial)
    const r = byId(o.parent); if (!o.ru || !r) return false;
    push(); soltar(o); o.x = r3(r.x + r.w / 2 + o.w / 2 + .2); o.y = r.y; sel = null; multi = []; render(); return true;
  }
  function rotulo(o) {                     // en el plano, debajo del rack: cuántas unidades tiene ocupadas (nada si está vacío: el dibujo de un rack vacío no cambia)
    const n = esRack(o) ? ocupadas(o) : 0; if (!n) return '';
    return T(o.x, bboxDe(o).y1 + .3 + (conNombre(o) ? (modeloDe(o) ? .32 : 0) + (o.label ? .32 : 0) : 0), `${n}/${usDe(o)} U`);
  }

  const entero = v => { const n = Number(String(v).replace(',', '.')); return Number.isInteger(n) && n >= 1 && n <= MAX ? n : undefined; };
  const uno = f => os => os.length == 1 && !!f(os[0]), mover = d => os => TR.acc.fijar([os[0].id], 'ruu', os[0].ru.u + d).ok;
  TR.acc.registrarCampo({ id: 'us', sec: 'geo', et: 'Unidades (U)', t: 'num', aplica: esRack, leer: usDe, parse: entero, poner: (o, v) => { o.us = v; } });
  TR.acc.registrarCampo({ id: 'ruu', sec: 'geo', et: 'Unidad (U)', t: 'num', aplica: o => !!o.ru, leer: o => o.ru.u, parse: entero, poner: (o, v) => { o.ru.u = v; } });
  TR.acc.registrarCampo({ id: 'ruh', sec: 'geo', et: 'Alto en rack (U)', t: 'num', aplica: o => tipoDe(o) == 'dispositivo', leer: altoDe, parse: entero, poner: (o, v) => { if (o.ru) o.ru.h = v; else o.uh = v; } });   // también en un equipo suelto: el alto con que se montará
  TR.acc.registrar({ id: 'rack-abrir', grupo: 'editar', donde: ['menu', 'insp'], texto: 'Abrir rack…', aplica: os => uno(esRack)(os) && TR.vr.rack() == null, ejecutar: os => TR.vr.abrir(os[0].id) });
  TR.acc.registrar({ id: 'rack-subir', grupo: 'transformar', donde: ['menu', 'insp'], texto: '▲ Subir 1 U', aplica: uno(o => o.ru), ejecutar: mover(1) });
  TR.acc.registrar({ id: 'rack-bajar', grupo: 'transformar', donde: ['menu', 'insp'], texto: '▼ Bajar 1 U', aplica: uno(o => o.ru), ejecutar: mover(-1) });
  TR.acc.registrar({ id: 'rack-sacar', grupo: 'transformar', donde: ['menu', 'insp'], texto: 'Desmontar del rack', aplica: uno(o => o.ru), ejecutar: os => desmontar(os[0]) });

  return { esRack, usDe, hijosDe, ocupadas, sincronizar, problema, en, montar, desmontar, rotulo };
})();
