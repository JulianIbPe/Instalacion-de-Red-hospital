// ===== cables.js (F9A): longitud de los cables =====
// · Medida = suma de los tramos del cable + el alto de las plantas que atraviesa por escaleras (D21: el cable es uno solo; cada punto sabe su planta).
//   El alto de una planta (p.alto, 3 m si falta) es la distancia de su piso al de la planta de arriba.
// · Instalación = medida + holgura (porcentaje del proyecto: S.presupuesto.holgura, que edita el diálogo «Presupuesto»; sin el campo = HOLGURA).
// · Un patch cord (conexión sin ruta, F8B) no tiene medida: su largo es una ESTIMACIÓN por la distancia entre las unidades de sus equipos + 0,5 m.
// · El cable inalámbrico no es un cable físico: no tiene longitud.
TR.cab = (() => {
  const ALTO = 3, HOLGURA = 10, U = .04445, EXTRA_PARCHE = .5;          // U = 1,75 pulgadas
  const altoDe = p => p.alto || ALTO;
  const holgura = () => (S.presupuesto && S.presupuesto.holgura != null) ? S.presupuesto.holgura : HOLGURA;
  const mide = o => esCable(o) && subDe(o) != 'inalambrico';
  function medida(o) {                                    // metros (o null si el objeto no es un cable que se mide)
    if (!mide(o) || !o.pts) return null;
    let m = 0;
    for (let i = 1; i < o.pts.length; i++) {
      const a = o.pts[i - 1], b = o.pts[i]; m += Math.hypot(b.x - a.x, b.y - a.y);
      const ia = S.plantas.findIndex(p => p.id == plantaDe(o, a)), ib = S.plantas.findIndex(p => p.id == plantaDe(o, b));
      if (ia >= 0 && ib >= 0) for (let k = Math.min(ia, ib); k < Math.max(ia, ib); k++) m += altoDe(S.plantas[k]);   // cruzó de planta: sube o baja el alto de las de abajo
    }
    return m;
  }
  const instalacion = m => m * (1 + holgura() / 100);
  function estimada(c) {                                  // largo estimado de un patch cord (null si no lo es o le falta un equipo montado)
    if (!c || !TR.con.esParche(c)) return null;
    const a = byId(c.a && c.a.d), b = byId(c.b && c.b.d); if (!a || !b || !a.ru || !b.ru) return null;
    return Math.abs((a.ru.u + a.ru.h / 2) - (b.ru.u + b.ru.h / 2)) * U + EXTRA_PARCHE;
  }
  const texto = o => { const m = medida(o); return m == null ? '' : `${fmt(m, 'm')} (instalación ${fmt(instalacion(m), 'm')})`; };

  TR.acc.registrarCampo({ id: 'largo', sec: 'objeto', et: 'Longitud', t: 'ro', aplica: o => medida(o) != null, leer: texto, parse: () => undefined, poner: () => {} });
  TR.acc.registrar({ id: 'cab-largo', grupo: 'editar', texto: os => 'Longitud: ' + texto(os[0]), aplica: os => os.length == 1 && medida(os[0]) != null, habilitada: () => false, ejecutar: () => false });   // solo informa
  return { ALTO, HOLGURA, altoDe, holgura, medida, instalacion, estimada };
})();
