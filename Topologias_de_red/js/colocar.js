// ===== colocar.js: la escalera y las formas se colocan con DOS puntos (clic-clic, o pulsar y arrastrar hasta soltar) =====
// Escalera y formas con lados: los dos puntos son esquinas (extremos) opuestas. La escalera pone sus peldaños a lo largo del lado más largo. Círculo: 1.er punto = centro; la distancia al 2.º punto es el radio.
// Ambos puntos se pegan a los extremos ○ de las paredes (nodos.js) y, con ◇ Medio (tecla M), a los puntos medios (iman.js).
// Mientras se elige el 2.º punto, la pieza se ve en vista previa (tmp, con pa = 1.er punto y pb = punto actual).
const usaDosPuntos = t => !!t && (t.k == 'shape' || (t.k == 'item' && t.n == 'Escalera'));
const COLOCAR_MIN = .15;                 // distancia mínima entre los dos puntos (m)
function ajustarColocacion(t, b) {       // recalcula la pieza en vista previa según el punto b
  const a = t.pa, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy); t.pb = { x: b.x, y: b.y };
  if (t.k == 'item') {                   // escalera: esquinas opuestas; el lado largo es el recorrido (rot 90 = tumbada, peldaños en vertical)
    const ax = Math.abs(dx), ay = Math.abs(dy), tumbada = ax > ay;
    t.x = r3((a.x + b.x) / 2); t.y = r3((a.y + b.y) / 2); t.w = r3(Math.max(tumbada ? ay : ax, .2)); t.h = r3(Math.max(tumbada ? ax : ay, .2)); t.rot = tumbada ? 90 : 0;
  } else if (t.n == 'Círculo') {         // desde el centro: cuanto más lejos el cursor, más grande
    t.x = a.x; t.y = a.y; t.w = t.h = r3(Math.max(d * 2, .2));
  } else {                               // esquinas opuestas
    t.x = r3((a.x + b.x) / 2); t.y = r3((a.y + b.y) / 2); t.w = r3(Math.max(Math.abs(dx), .2)); t.h = r3(Math.max(Math.abs(dy), .2));
  }
}
function terminarColocacion() {          // confirma la pieza en vista previa (si los puntos no están casi juntos)
  const t = tmp; if (!t || !t.pa || !t.pb || Math.hypot(t.pb.x - t.pa.x, t.pb.y - t.pa.y) < COLOCAR_MIN) return false;
  delete t.pa; delete t.pb; tmp = null; add(t); return true;
}
function clicDosPuntos(p, e) {           // clic con la herramienta Escalera o una forma
  if (!tmp) {
    const base = tool.k == 'item' ? { k: 'item', n: tool.n, ic: tool.ic, w: tool.w, h: .2, rot: 0, label: '', c: col() }
      : { k: 'shape', n: tool.n, w: .2, h: .2, c: col(), f: fil(), ls: lin(), label: '' };
    tmp = { ...base, id: -1, x: p.x, y: p.y, pa: { x: p.x, y: p.y } }; ajustarColocacion(tmp, p);   // id -1: vista previa (no cuenta como seleccionada)
    drag = { m: 'colocar', sx: e.clientX, sy: e.clientY };
  } else { ajustarColocacion(tmp, p); terminarColocacion(); }
}
function guiaColocar() {                 // línea guía entre los dos puntos y la medida actual
  const t = tmp; if (!t || !t.pa || !t.pb) return ''; const a = t.pa, b = t.pb, d = Math.hypot(b.x - a.x, b.y - a.y);
  const txt = t.n == 'Círculo' ? 'r ' + fmt(d) : fmt(t.w) + ' × ' + fmt(t.h);
  return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#2e86de" stroke-width=".03" stroke-dasharray=".1 .08" pointer-events="none"/><circle cx="${a.x}" cy="${a.y}" r=".08" fill="#2e86de" pointer-events="none"/>` + (d > .05 ? T(b.x, b.y - .3, txt, .3) : '');
}
