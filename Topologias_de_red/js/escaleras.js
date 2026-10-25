// ===== escaleras.js: la escalera se dibuja como en planta (rectángulo con peldaños y la flecha ▲ Escalera), se escala con 8 asas y muestra sus medidas =====
const PELDANO = .28;                      // separación entre peldaños (m): al alargar la escalera aparecen más
function dibujarEscalera(o, id, on, hd) {
  const w = o.w, h = o.h, n = Math.max(2, Math.round(h / PELDANO)), paso = h / n, fs = Math.max(.1, Math.min(.3, w / 6.5));
  let g = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#fff" stroke="#34495e" stroke-width=".06"/>`;
  for (let i = 1; i < n; i++) g += `<line x1="${-w / 2}" y1="${-h / 2 + i * paso}" x2="${w / 2}" y2="${-h / 2 + i * paso}" stroke="#8aa0ab" stroke-width=".025" pointer-events="none"/>`;
  g += `<text x="0" y="0" font-size="${fs}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#1d2a2f" stroke="#fff" stroke-width="${fs * .3}" paint-order="stroke" font-family="Segoe UI,Arial,sans-serif" pointer-events="none">▲ Escalera</text>`;
  let r = `<g ${id} transform="translate(${o.x} ${o.y}) rotate(${o.rot || 0})">${g}</g>`;
  if (o.label) r += T(o.x, bboxDe(o).y1 + .3, o.label);
  if (!on) return r;
  const rot = o.rot ? ` transform="rotate(${o.rot} ${o.x} ${o.y})"` : '';
  r += `<g${rot} pointer-events="none"><rect x="${o.x - w / 2 - .1}" y="${o.y - h / 2 - .1}" width="${w + .2}" height="${h + .2}" fill="none" stroke="#e0a030" stroke-dasharray=".15 .1" stroke-width=".04"/>${cotasForma(o)}</g>`;   // marco y medidas (ancho y alto)
  return r + manijasForma(o, hd);
}
