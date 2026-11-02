// ===== eventos.js: instrumentación del renderizado (Fase 1) =====
// Cuenta cuántas veces se redibuja cada capa. Sirve para comprobar (js/pruebas.js) que, por ejemplo, mover el ratón sin arrastrar
// no reconstruye los objetos. Desde la Fase 3 este archivo es OBLIGATORIO: aloja el namespace TR (TR.acc, TR.insp y TR.ctx se agregan desde acciones.js, inspector.js y contexto.js).
const TR = {
  stats: { fondo: 0, rejilla: 0, obj: 0, tmp: 0, paneles: 0, menu: 0 },   // fondo = vista; rejilla = líneas de la grilla; obj = #c; tmp = #g-tmp; paneles = botones, reglas y barra de estado; menu = menú izquierdo
  ui: { inspector: 0, enSitio: 0, menu: 0 },   // Fase 3 (aparte de stats, que no cambia): inspector = veces que se reconstruyó su DOM; enSitio = actualizaciones de valores sin reconstruir; menu = aperturas del menú contextual
  reiniciar() { for (const k in this.stats) this.stats[k] = 0; for (const k in this.ui) this.ui[k] = 0; }
};
