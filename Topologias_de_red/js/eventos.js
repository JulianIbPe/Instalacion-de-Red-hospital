// ===== eventos.js: instrumentación del renderizado (Fase 1) =====
// Cuenta cuántas veces se redibuja cada capa. Sirve para comprobar (js/pruebas.js) que, por ejemplo, mover el ratón sin arrastrar
// no reconstruye los objetos. No cambia el funcionamiento de la página: si este archivo faltara, dibujo.js sigue funcionando.
const TR = {
  stats: { fondo: 0, rejilla: 0, obj: 0, tmp: 0, paneles: 0, menu: 0 },   // fondo = vista; rejilla = líneas de la grilla; obj = #c; tmp = #g-tmp; paneles = botones, reglas y barra de estado; menu = menú izquierdo
  reiniciar() { for (const k in this.stats) this.stats[k] = 0; }
};
