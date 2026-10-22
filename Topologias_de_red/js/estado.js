// ===== estado.js: estado global y utilidades. Topologías de red: editor sobre SVG. Todas las coordenadas del modelo están en METROS. =====
const $ = s => document.querySelector(s), svg = $('#svg');
let S = { edificio: { w: 20, h: 12 }, unidad: 'm', objs: [] };   // S = todo lo que se guarda
let V = { ox: 40, oy: 40, z: 50 };                               // V = vista (desplazamiento y px por metro)
let multi = [], cajaSel = null;                                  // selección múltiple y rectángulo de selección
let tool = null, sel = null, tmp = null, drag = null, nid = 1, curP = { x: 0, y: 0 }, lastDown = { t: 0, x: 0, y: 0 };

// ---------- Utilidades ----------
const sn = v => Math.round(v * 10) / 10, byId = id => S.objs.find(o => o.id == id);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pt = q => { const o = q.ref && byId(q.ref); return o ? { x: o.x, y: o.y } : q; };
const fmt = d => S.unidad == 'm' ? d.toFixed(2) + ' m' : Math.round(d * 100) + ' cm';
function toW(e) { const r = svg.getBoundingClientRect(); return { x: sn((e.clientX - r.left - V.ox) / V.z), y: sn((e.clientY - r.top - V.oy) / V.z) }; }
function itemAt(e) { for (const el of document.elementsFromPoint(e.clientX, e.clientY)) { const t = el.closest && el.closest('[data-id]'), o = t && byId(t.dataset.id); if (o && o.k == 'item') return o; } }
const T = (x, y, t, sz = .28) => `<text x="${x}" y="${y}" font-size="${sz}" text-anchor="middle" fill="#1d2a2f" stroke="#fff" stroke-width=".07" paint-order="stroke" font-family="Segoe UI,Arial,sans-serif">${esc(t)}</text>`;
const fillOf = o => o.f == 'sol' ? o.c : o.f == 'hat' ? `url(#h${o.id})` : 'none';
