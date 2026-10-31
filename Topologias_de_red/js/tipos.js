// ===== tipos.js: identificador de tipo estable de cada objeto (Fase 2) =====
// k    = clase de dibujo y geometría (item, line, shape, zona, texto, medida, puerta). No cambia.
// n    = nombre visible (solo para mostrar; el usuario puede verlo en el catálogo).
// tipo = identificador estable que decide el comportamiento: pared, cable, dispositivo, rack, escalera, ascensor, ventana, puerta, forma, zona, texto, medida.
// sub  = variante estable (p. ej. 'router', 'utp6', 'circulo'). Las escaleras mantienen su variante en o.t (sin t = recta, 'descanso', 'espiral').
// derivarTipo() es el ÚNICO lugar donde los nombres visibles se traducen a tipos (objetos de proyectos antiguos y piezas aún sin tipo).
const TIPOS = {
  pared: { k: 'line' }, cable: { k: 'line' }, dispositivo: { k: 'item' }, rack: { k: 'item' }, escalera: { k: 'item' }, ascensor: { k: 'item' }, ventana: { k: 'item' },
  puerta: { k: 'puerta' }, forma: { k: 'shape' }, zona: { k: 'zona' }, texto: { k: 'texto' }, medida: { k: 'medida' }
};
const SUB_CABLE = { 'UTP Cat6': 'utp6', 'Fibra óptica': 'fibra', 'Coaxial': 'coaxial', 'Serial': 'serial', 'Inalámbrico': 'inalambrico', 'Cable de energía': 'energia' };
const SUB_FORMA = { 'Rectángulo': 'rectangulo', 'Círculo': 'circulo', 'Triángulo': 'triangulo', 'Rombo': 'rombo', 'Hexágono': 'hexagono' };
const SUB_DISPOSITIVO = {
  'Router': 'router', 'Switch': 'switch', 'Servidor': 'servidor', 'PC': 'pc', 'Firewall': 'firewall', 'Punto de acceso': 'punto-acceso', 'Impresora': 'impresora',
  'Cámara IP': 'camara-ip', 'Teléfono IP': 'telefono-ip', 'Lámpara': 'lampara', 'Enchufe': 'enchufe', 'Interruptor': 'interruptor', 'UPS': 'ups', 'Tablero': 'tablero'
};
function derivarTipo(o) {                // {tipo, sub?} a partir de la clase k y, solo para objetos sin tipo, del nombre visible
  switch (o.k) {
    case 'line': return o.n == 'Pared' ? { tipo: 'pared' } : { tipo: 'cable', sub: SUB_CABLE[o.n] || 'otro' };
    case 'shape': return { tipo: 'forma', sub: SUB_FORMA[o.n] || 'otro' };
    case 'zona': return { tipo: 'zona', sub: o.s == 'e' ? 'e' : 'r' };
    case 'texto': return { tipo: 'texto' };
    case 'medida': return { tipo: 'medida' };
    case 'puerta': return { tipo: 'puerta' };
    case 'item':
      if (o.n == 'Escalera' || o.esc) return { tipo: 'escalera' };       // o.esc: entradas del catálogo (escalera con descanso / espiral)
      if (o.n == 'Ascensor') return { tipo: 'ascensor' };
      if (o.n == 'Ventana') return { tipo: 'ventana' };
      if (o.n == 'Rack') return { tipo: 'rack' };
      return { tipo: 'dispositivo', sub: SUB_DISPOSITIVO[o.n] || 'otro' };
  }
  return { tipo: 'dispositivo', sub: 'otro' };
}
function completarTipo(o) { if (!o.tipo) { const d = derivarTipo(o); o.tipo = d.tipo; if (d.sub) o.sub = d.sub; } return o; }   // deja el tipo escrito en el objeto (si ya lo tiene, no cambia nada)
const tipoDe = o => o.tipo || derivarTipo(o).tipo;
const subDe = o => o.sub || derivarTipo(o).sub;
const esPared = o => tipoDe(o) == 'pared';
const esCable = o => tipoDe(o) == 'cable';
const esEscalera = o => tipoDe(o) == 'escalera';
const esAscensor = o => tipoDe(o) == 'ascensor';
const esCirculo = o => o.k == 'shape' && subDe(o) == 'circulo';
const claveLinea = o => esPared(o) ? 'pared' : subDe(o);   // las líneas del mismo tipo comparten nodos (ver nodos.js)
function normalizarTipos() { S.objs.forEach(completarTipo); }
