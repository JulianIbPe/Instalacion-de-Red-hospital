// ===== rejilla.js: grilla opcional. Se adapta al zoom (más zoom = cuadros más chicos) y los objetos se ajustan a ella =====
let rejilla = true;                                  // true = grilla visible y ajuste a la grilla; false = posición libre (cada 1 cm)
let pasoFijo = 0;                                    // paso elegido en el desplegable #gpaso, en metros; 0 = automático según el zoom. Es estado de la vista: no se guarda
const PASOS = [.1, .25, .5, 1, 2, 5, 10, 20];        // separaciones posibles entre líneas, en metros
const pasoAuto = () => PASOS.find(s => s * V.z >= 22) || 20;     // la más fina que se siga viendo clara (mín. ~22 px entre líneas)
const pasoGrilla = () => pasoFijo && pasoFijo * V.z >= 8 ? pasoFijo : pasoAuto();   // paso que se DIBUJA (y que marcan las reglas): el elegido si se alcanza a ver (≥ 8 px); si no, el automático
const pasoActual = () => rejilla ? pasoFijo || pasoAuto() : .01; // paso al que se AJUSTA todo lo que se coloca o se mueve (aunque la grilla dibujada sea más gruesa)
function rejillaSvg() {                              // líneas finas cada "paso" y líneas más marcadas cada metro (o cada 5 pasos)
  if (!rejilla) return { defs: '', rects: '' };
  const p = pasoGrilla(), M = p < 1 ? 1 : p * 5, w = 1 / V.z;   // w = 1 px: el grosor no cambia con el zoom
  const pat = (id, s, c, k) => `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><path d="M${s} 0H0V${s}" fill="none" stroke="${c}" stroke-width="${w * k}"/></pattern>`;
  const r = id => `<rect x="-100" y="-100" width="400" height="400" fill="url(#${id})"/>`;
  return { defs: pat('g', p, '#dde3e7', 1) + pat('gm', M, '#b6c2c9', 1.4), rects: r('g') + r('gm') };
}
