// ===== estado.js: estado global y utilidades. Topologías de red: editor sobre SVG. Todas las coordenadas del modelo están en METROS. =====
const $ = s => document.querySelector(s), svg = $('#svg');
function estadoInicial(unidad = 'm') {    // estado de un archivo nuevo: edificio vacío con 1 planta y 1 capa "Base"
  return { edificio: { w: 20, h: 12 }, unidad, plantas: [{ id: 'p1', nombre: 'Planta 1', ca: 'c1', capas: [{ id: 'c1', nombre: 'Base', visible: true, bloqueada: false }] }], plantaAct: 'p1', capaAct: 'c1', pn: 1, cn: 1, objs: [] };
}
let S = estadoInicial();   // S = todo lo que se guarda
let V = { ox: 40, oy: 40, z: 50 };                               // V = vista (desplazamiento y px por metro)
let multi = [], cajaSel = null, avisoMsg = '', selEdge = null;   // selEdge = {id, i}: lado seleccionado de una forma                                  // selección múltiple y rectángulo de selección
let tool = null, sel = null, tmp = null, drag = null, nid = 1, curP = { x: 0, y: 0 }, lastDown = { t: 0, x: 0, y: 0 };

// ---------- Utilidades ----------
const sn = v => { const p = pasoActual(); return +(Math.round(v / p) * p).toFixed(3); }, byId = id => S.objs.find(o => o.id == id);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function pt(q, n = 0) {                  // posición real de un punto de línea: puede estar unido a un dispositivo (ref) o al nodo de otra línea (rl/ri)
  if (q.ref) { const o = byId(q.ref); if (o) return { x: o.x, y: o.y }; }
  if (q.rl && n < 10) { const L = byId(q.rl); if (L && L.pts[q.ri]) return pt(L.pts[q.ri], n + 1); }
  return q;
}
const fmt = (d, u = S.unidad) => u == 'm' ? d.toFixed(2) + ' m' : Math.round(d * 100) + ' cm';   // u = unidad: cada medición guarda la suya
function toW(e) { const r = svg.getBoundingClientRect(); return { x: sn((e.clientX - r.left - V.ox) / V.z), y: sn((e.clientY - r.top - V.oy) / V.z) }; }
function itemAt(e) { for (const el of document.elementsFromPoint(e.clientX, e.clientY)) { const t = el.closest && el.closest('[data-id]'), o = t && byId(t.dataset.id); if (o && o.k == 'item' && !esEscalera(o)) return o; } }   // las escaleras no sirven como punto de unión: se usan sus esquinas (nodos.js)
const T = (x, y, t, sz = .28) => `<text x="${x}" y="${y}" font-size="${sz}" text-anchor="middle" fill="#1d2a2f" stroke="#fff" stroke-width=".07" paint-order="stroke" font-family="Segoe UI,Arial,sans-serif">${esc(t)}</text>`;
const fillOf = o => o.f == 'sol' ? o.c : o.f == 'hat' ? `url(#h${o.id})` : 'none';
