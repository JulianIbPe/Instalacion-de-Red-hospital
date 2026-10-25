// ---------- Dibujo ----------
function draw(o) {
  const id = `data-id="${o.id}"`, on = o.id == sel, hd = (x, y, h, c = '#e0a030') => { asasOut.push(`<circle ${id} data-h="${h}" cx="${x}" cy="${y}" r=".13" fill="${c}" stroke="#fff" stroke-width=".03"/>`); return ''; };   // las asas se dibujan al final para quedar siempre por encima
  let h = '';
  if (o.k == 'zona') {
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    const g = o.s == 'r' ? `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}"` : `<ellipse cx="${cx}" cy="${cy}" rx="${o.w / 2}" ry="${o.h / 2}"`;
    let z = `${g} ${id} fill="${fillOf(o)}" fill-opacity="${o.f == 'sol' ? .3 : 1}" ${trazo(o)} pointer-events="all"/>`;
    if (o.label) z += T(cx, cy, o.label, .35);
    if (on) z += `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="none" stroke="#e0a030" stroke-dasharray=".15 .1" stroke-width=".04" pointer-events="none"/>`;
    h = o.rot ? `<g transform="rotate(${o.rot} ${cx} ${cy})">${z}</g>` : z;
    if (on) { const q = rotP({ x: o.x + o.w, y: o.y + o.h }, { x: cx, y: cy }, o.rot || 0); h += hd(q.x, q.y, 'r'); }
  } else if (o.k == 'shape') {
    h = dibujarForma(o, id, on, hd);
  } else if (o.k == 'item') {
    if (o.n == 'Escalera') h = dibujarEscalera(o, id, on, hd); else {
    h = `<g ${id} transform="translate(${o.x} ${o.y}) rotate(${o.rot || 0})"><rect x="${-o.w / 2}" y="${-o.h / 2}" width="${o.w}" height="${o.h}" rx=".08" fill="#fff" stroke="#34495e" stroke-width=".04"/><text font-size="${Math.min(o.w, o.h) * .65}" text-anchor="middle" dominant-baseline="central">${o.ic}</text></g>`;
    if (o.label) h += T(o.x, bboxDe(o).y1 + .3, o.label);
    if (on) h += `<rect x="${o.x - o.w / 2 - .1}" y="${o.y - o.h / 2 - .1}" width="${o.w + .2}" height="${o.h + .2}" fill="none" stroke="#e0a030" stroke-dasharray=".15 .1" stroke-width=".04" transform="rotate(${o.rot || 0} ${o.x} ${o.y})" pointer-events="none"/>`;
    }
  } else if (o.k == 'line') {
    const P = o.pts.map(pt); if (o.cur) P.push(o.cur);
    const s = P.map(q => `${q.x},${q.y}`).join(' ');
    h = `<polyline points="${s}" fill="none" stroke="${o.c}" stroke-width="${o.w}" stroke-dasharray="${o.d}" stroke-linecap="round" stroke-linejoin="round"/><polyline ${id} points="${s}" fill="none" stroke="transparent" stroke-width="${Math.max(.3, o.w)}" pointer-events="stroke"/>`;
    const runs = o.n == 'Pared' ? tramosPared(o) : null; if (runs) h = paredConHuecos(o, runs, id);   // paredes con puertas: se dibujan con huecos
    if (o.label) { const m = P[P.length >> 1]; h += T(m.x, m.y - .2, o.label); }
    if (o.cur && o.n == 'Pared') h += medidaLado(P[P.length - 2], P[P.length - 1]);   // longitud del tramo que se está dibujando
    if (on) h += P.map((q, i) => hd(q.x, q.y, i)).join('');
  } else if (o.k == 'texto') {
    h = `<text ${id} x="${o.x}" y="${o.y}" transform="rotate(${o.rot || 0} ${o.x} ${o.y})" font-size=".45" font-weight="600" fill="${on ? '#e0a030' : '#1d2a2f'}" font-family="Segoe UI,Arial,sans-serif">${esc(o.label)}</text>`;
  } else if (o.k == 'medida') {
    h = cota(o, id, on, hd);
  } else if (o.k == 'puerta') {
    h = dibujarPuerta(o, id, on, hd);
  }
  return h;
}
const ORD = { zona: 0, shape: 1, line: 2, puerta: 2.5, item: 3, texto: 4, medida: 5 };
let asasOut = [];                         // asas de edición de lo seleccionado (se agregan después de todos los objetos)
function render() {
  asasOut = [];
  const gr = rejillaSvg();
  const E = S.edificio, all = [...S.objs].filter(esVisible).sort((a, b) => ORD[a.k] - ORD[b.k]); if (tmp) all.push(tmp);
  const pats = all.filter(o => o.f == 'hat').map(o => `<pattern id="h${o.id}" width=".25" height=".25" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2=".25" stroke="${o.c}" stroke-width=".07"/></pattern>`).join('');
  const edif = `<rect x="0" y="0" width="${E.w}" height="${E.h}" fill="none" stroke="#17262c" stroke-width=".08" stroke-dasharray=".4 .2"/>` + T(E.w / 2, -.25, E.w + ' m', .4) + `<text x="-.3" y="${E.h / 2}" font-size=".4" text-anchor="middle" transform="rotate(-90 -.3 ${E.h / 2})" fill="#17262c" font-family="Segoe UI,Arial,sans-serif">${E.h} m</text>`;
  svg.innerHTML = `<defs>${gr.defs}</defs>
  <g transform="translate(${V.ox} ${V.oy}) scale(${V.z})">${gr.rects}<g id="c"><defs>${pats}</defs>${edif}${all.map(o => { const g = draw(o) + resaltar(o); return esEditable(o) ? g : `<g pointer-events="none" opacity=".55">${g}</g>`; }).join('')}${asasOut.join('')}</g>${cajaHtml()}${puertaPrevia()}${nodosHtml()}${rotHtml()}${rombo()}${snapPt ? `<circle cx="${snapPt.x}" cy="${snapPt.y}" r=".17" fill="#e0a03044" stroke="#e0a030" stroke-width=".05" pointer-events="none"/>` : ''}</g>`;
  $('#bundo').disabled = !hist.length; $('#bredo').disabled = !fut.length; $('#bdel').disabled = !seleccionados().length;
  sincronizarOpciones();
  rulers(); status(); if (tab) menu();
}
function status(msg) {
  const h = !tool ? 'Clic: seleccionar · Mayús+clic: varios · Mayús+arrastrar: rectángulo · ↻ o tecla R: rotar · arrastrar: mover · fondo vacío: desplazar · rueda: zoom' : tool.k == 'line' ? 'Clic para añadir puntos (sobre un dispositivo o un nodo ○ del mismo tipo para unirlo) · doble clic o Enter para terminar · Esc cancela' : tool.k == 'zona' ? 'Arrastra para marcar la zona' : tool.k == 'puerta' ? 'Pasa sobre una pared para ver cómo queda · clic para colocar la puerta · clic sobre una puerta puesta añade la 2.ª hoja · Esc cancela' : tool.k == 'medida' ? 'Clic en el punto inicial, luego en el final y por último clic donde quieras colocar la cota (clic derecho cancela)' : 'Clic en el área de trabajo para colocar · Esc para salir';
  $('#status').textContent = `x ${curP.x.toFixed(1)} m · y ${curP.y.toFixed(1)} m · escala ${V.z.toFixed(0)} px/m · grilla ${rejilla ? +pasoGrilla().toFixed(2) + ' m' : 'off'} · ${plantaActual().nombre} › ${capaActual().nombre}  |  ${msg || avisoMsg || (ladoSel() !== null ? 'Lado seleccionado: arrastra el lado o sus puntas para modificarlo · Supr lo borra · clic fuera para soltarlo' : h)}`;
}
