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
    if (esEscalera(o)) h = dibujarEscalera(o, id, on, hd); else {   // las tres escaleras (recta, con descanso, espiral) son 'Escalera' con distinto o.t
    h = `<g ${id} transform="translate(${o.x} ${o.y}) rotate(${o.rot || 0})"><rect x="${-o.w / 2}" y="${-o.h / 2}" width="${o.w}" height="${o.h}" rx=".08" fill="#fff" stroke="#34495e" stroke-width=".04"/><text font-size="${Math.min(o.w, o.h) * .65}" text-anchor="middle" dominant-baseline="central">${o.ic}</text></g>`;
    if (o.label) h += T(o.x, bboxDe(o).y1 + .3, o.label);
    if (on) h += `<rect x="${o.x - o.w / 2 - .1}" y="${o.y - o.h / 2 - .1}" width="${o.w + .2}" height="${o.h + .2}" fill="none" stroke="#e0a030" stroke-dasharray=".15 .1" stroke-width=".04" transform="rotate(${o.rot || 0} ${o.x} ${o.y})" pointer-events="none"/>`;
    }
  } else if (o.k == 'line') {
    const P = o.pts.map(pt); if (o.cur) P.push(o.cur);
    const s = P.map(q => `${q.x},${q.y}`).join(' ');
    h = `<polyline points="${s}" fill="none" stroke="${o.c}" stroke-width="${o.w}" stroke-dasharray="${o.d}" stroke-linecap="round" stroke-linejoin="round"/><polyline ${id} points="${s}" fill="none" stroke="transparent" stroke-width="${Math.max(.3, o.w)}" pointer-events="stroke"/>`;
    const runs = esPared(o) ? tramosPared(o) : null; if (runs) h = paredConHuecos(o, runs, id);   // paredes con puertas: se dibujan con huecos
    if (o.label) { const m = P[P.length >> 1]; h += T(m.x, m.y - .2, o.label); }
    if (o.cur && esPared(o)) h += medidaLado(P[P.length - 2], P[P.length - 1]);   // longitud del tramo que se está dibujando
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

// ---------- Renderizado en capas (Fase 1) ----------
// El SVG tiene una estructura fija que se crea una sola vez (iniciarCapas):
//   <defs id="defs-fondo">   patrones de la grilla
//   <g id="vp" transform>    la vista (desplazamiento y zoom): desplazar o hacer zoom solo cambia este atributo
//     <g id="g-grilla">      líneas de la grilla (solo se rehacen si cambia el zoom o se activa o desactiva la grilla)
//     <g id="c">             los objetos del proyecto, el contorno del edificio y el reflejo de la planta de abajo
//     <g id="g-tmp">         lo temporal: objeto en curso, vista previa, guías, imanes, rectángulo de selección y asa de rotación
// Los objetos NO dependen de la vista (sus medidas están en metros), por eso mover la vista no los reconstruye.
// render() sigue existiendo y lo redibuja todo de forma síncrona (lo usan casi todas las funciones y la exportación PNG).
// Los manejadores del ratón usan las funciones sueltas para redibujar solo lo que cambió (ver repintarMovimiento).
const contar = k => { if (typeof TR !== 'undefined') TR.stats[k]++; };   // contadores de eventos.js (opcional)
let capas = null, ultGrilla = '';
function iniciarCapas() {
  svg.innerHTML = '<defs id="defs-fondo"></defs><g id="vp"><g id="g-grilla"></g><g id="c"></g><g id="g-tmp"></g></g>';
  capas = { defs: svg.querySelector('#defs-fondo'), vp: svg.querySelector('#vp'), grilla: svg.querySelector('#g-grilla'), c: svg.querySelector('#c'), tmp: svg.querySelector('#g-tmp') };
  ultGrilla = '';
}
const capasOk = () => !!capas && svg.contains(capas.c) && svg.contains(capas.tmp);
const patronHat = o => `<pattern id="h${o.id}" width=".25" height=".25" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2=".25" stroke="${o.c}" stroke-width=".07"/></pattern>`;

function renderFondo() {                  // vista (desplazamiento y zoom) y grilla
  contar('fondo'); if (!capasOk()) iniciarCapas();
  capas.vp.setAttribute('transform', `translate(${V.ox} ${V.oy}) scale(${V.z})`);
  const clave = rejilla + '|' + V.z;      // la grilla solo cambia con el zoom o al activarla o desactivarla
  if (clave !== ultGrilla) { const gr = rejillaSvg(); capas.defs.innerHTML = gr.defs; capas.grilla.innerHTML = gr.rects; ultGrilla = clave; contar('rejilla'); }
}
function renderObjetos() {                // objetos del proyecto (lo que se exporta en el PNG)
  contar('obj'); if (!capasOk()) iniciarCapas();
  asasOut = [];
  // Orden de dibujo: primero por jerarquía de capa (las capas altas se pintan encima) y, dentro de una misma capa, por tipo de objeto (ORD)
  const E = S.edificio, all = [...S.objs].filter(esVisible).sort((a, b) => rangoCapa(a) - rangoCapa(b) || ORD[a.k] - ORD[b.k]);
  const pats = all.filter(o => o.f == 'hat').map(patronHat).join('');
  const edif = `<rect x="0" y="0" width="${E.w}" height="${E.h}" fill="none" stroke="#17262c" stroke-width=".08" stroke-dasharray=".4 .2"/>` + T(E.w / 2, -.25, E.w + ' m', .4) + `<text x="-.3" y="${E.h / 2}" font-size=".4" text-anchor="middle" transform="rotate(-90 -.3 ${E.h / 2})" fill="#17262c" font-family="Segoe UI,Arial,sans-serif">${E.h} m</text>`;
  capas.c.innerHTML = `<defs>${pats}</defs>${edif}${escalerasFantasma()}${all.map(o => { const g = draw(o) + resaltar(o); return esEditable(o) ? g : `<g pointer-events="none" opacity=".55">${g}</g>`; }).join('')}${asasOut.join('')}`;
}
function renderTmp() {                    // lo temporal de la interacción (no forma parte del proyecto ni del PNG)
  contar('tmp'); if (!capasOk()) iniciarCapas();
  asasOut = [];
  const enCurso = tmp ? (tmp.f == 'hat' ? `<defs>${patronHat(tmp)}</defs>` : '') + draw(tmp) + asasOut.join('') : '';   // la pieza o el cable que se está dibujando, con sus asas
  capas.tmp.innerHTML = enCurso + `${cajaHtml()}${puertaPrevia()}${guiaColocar()}${nodosHtml()}${rotHtml()}${rombo()}${snapPt ? `<circle cx="${snapPt.x}" cy="${snapPt.y}" r=".17" fill="#e0a03044" stroke="#e0a030" stroke-width=".05" pointer-events="none"/>` : ''}`;
}
function renderPaneles() {                // botones, opciones, reglas y barra de estado (el menú izquierdo se rehace solo al cambiar de pestaña o herramienta: ver catalogo.js)
  contar('paneles');
  $('#bundo').disabled = !hist.length; $('#bredo').disabled = !fut.length; $('#bdel').disabled = !seleccionados().length;
  sincronizarOpciones();
  rulers(); status();
}
function render() { renderFondo(); renderObjetos(); renderTmp(); renderPaneles(); }   // todo, de forma síncrona
function repintarMovimiento() {           // al mover el ratón: solo lo que puede haber cambiado
  const m = drag && drag.m;
  if (m == 'mv' || m == 'h' || m == 'rot' || m == 'lado') renderObjetos();   // se está modificando algún objeto
  if (m == 'pan') { renderFondo(); rulers(); }                              // solo cambia la vista
  if (tool || tmp || (drag && m != 'pan')) renderTmp();                     // vista previa, imanes, guías, rectángulo de selección, asa de rotación (al desplazar la vista no cambian)
  status();                                                                 // coordenadas del cursor (único cambio si no se hace nada más)
}
function status(msg) {
  const h = !tool ? 'Clic: seleccionar · Mayús+clic: varios · Mayús+arrastrar: rectángulo · ↻ o tecla R: rotar · arrastrar: mover · fondo vacío: desplazar · rueda: zoom' : tool.k == 'line' ? 'Clic para añadir puntos (sobre un dispositivo o un nodo ○ del mismo tipo para unirlo) · doble clic o Enter para terminar · Esc cancela' : tool.k == 'zona' ? 'Arrastra para marcar la zona' : tool.k == 'puerta' ? 'Pasa sobre una pared para ver cómo queda · clic para colocar la puerta · clic sobre una puerta puesta añade la 2.ª hoja · Esc cancela' : tool.k == 'medida' ? 'Clic en el punto inicial, luego en el final y por último clic donde quieras colocar la cota (clic derecho cancela)' : usaDosPuntos(tool) ? (tmp && tmp.pa ? 'Clic en el segundo punto para terminar (clic derecho o Esc cancela)' : esCirculo(tool) || tool.esc == 'espiral' ? 'Clic en el centro y luego aléjate: cuanto más lejos, más grande el radio' : esEscalera(tool) ? 'Clic en una esquina de la escalera y luego en la esquina opuesta (se pega a los extremos ○ de las paredes)' : 'Clic en una esquina y luego en la esquina opuesta (se pega a los extremos ○ de las paredes)') : 'Clic en el área de trabajo para colocar · Esc para salir';
  $('#status').textContent = `x ${curP.x.toFixed(1)} m · y ${curP.y.toFixed(1)} m · escala ${V.z.toFixed(0)} px/m · grilla ${rejilla ? +pasoGrilla().toFixed(2) + ' m' : 'off'} · ${plantaActual().nombre} › ${capaActual().nombre}  |  ${msg || avisoMsg || (ladoSel() !== null ? 'Lado seleccionado: arrastra el lado o sus puntas para modificarlo · Supr lo borra · clic fuera para soltarlo' : h)}`;
}
