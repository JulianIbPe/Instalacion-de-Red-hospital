// ===== rejilla.js: grilla opcional. Se adapta al zoom (más zoom = cuadros más chicos) y los objetos se ajustan a ella =====
let rejilla = true;                                  // true = grilla visible y ajuste a la grilla; false = posición libre (cada 0,1 m)
const PASOS = [.1, .25, .5, 1, 2, 5, 10, 20];        // separaciones posibles entre líneas, en metros
const pasoGrilla = () => PASOS.find(s => s * V.z >= 22) || 20;   // la más fina que se siga viendo clara (mín. ~22 px entre líneas)
const pasoActual = () => rejilla ? pasoGrilla() : .1;            // paso al que se ajusta todo lo que se coloca o se mueve
function rejillaSvg() {                              // líneas finas cada "paso" y líneas más marcadas cada metro (o cada 5 pasos)
  if (!rejilla) return { defs: '', rects: '' };
  const p = pasoGrilla(), M = p < 1 ? 1 : p * 5, w = 1 / V.z;   // w = 1 px: el grosor no cambia con el zoom
  const pat = (id, s, c, k) => `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><path d="M${s} 0H0V${s}" fill="none" stroke="${c}" stroke-width="${w * k}"/></pattern>`;
  const r = id => `<rect x="-100" y="-100" width="400" height="400" fill="url(#${id})"/>`;
  return { defs: pat('g', p, '#dde3e7', 1) + pat('gm', M, '#b6c2c9', 1.4), rects: r('g') + r('gm') };
}
