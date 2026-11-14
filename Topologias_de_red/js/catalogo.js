// ---------- Catálogo del menú izquierdo ----------
const I = (n, ic, w = .8, h = .8) => ({ k: 'item', n, ic, w, h });
const L = (n, c, w, d = '') => ({ k: 'line', n, c, w, d });
const circ = Array.from({ length: 20 }, (_, i) => [Math.cos(i * Math.PI / 10) / 2, Math.sin(i * Math.PI / 10) / 2]);
const SH = {   // vértices por defecto de cada forma, por subtipo estable (no por nombre visible)
  rectangulo: [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]], circulo: circ,
  triangulo: [[0, -.5], [.5, .5], [-.5, .5]], rombo: [[0, -.5], [.5, 0], [0, .5], [-.5, 0]],
  hexagono: [[-.25, -.5], [.25, -.5], [.5, 0], [.25, .5], [-.25, .5], [-.5, 0]]
};
const NOMBRE_FORMA = { rectangulo: 'Rectángulo', circulo: 'Círculo', triangulo: 'Triángulo', rombo: 'Rombo', hexagono: 'Hexágono' };
const CAT = {
  'Dispositivos': PT.map(m => ({ k: 'item', n: m.nombre, w: m.w, h: m.h, cat: m.cat, pt: m })),   // F4A: modelos de catalogo-pt.js (pt = plantilla); los equipos sin modelo de proyectos viejos se siguen dibujando con su emoji
  'Cables': [L('UTP Cat6', '#2e86de', .06), L('Fibra óptica', '#f39c12', .06), L('Coaxial', '#555555', .07), L('Serial', '#8e44ad', .06, '.2 .1'), L('Inalámbrico', '#16a085', .05, '.1 .15'), L('Consola', '#5dade2', .05), L('USB', '#34495e', .05)],   // F7A: Consola y USB (los puertos RS-232 y USB de las PC)
  'Formas': Object.keys(SH).map(sub => ({ k: 'shape', n: NOMBRE_FORMA[sub], tipo: 'forma', sub })),
  'Eléctrico': [I('Lámpara', '💡', .5, .5), I('Enchufe', '🔌', .4, .4), I('Interruptor', '🎚️', .4, .4), I('UPS', '🔋'), I('Tablero', '⚡', .6, .8), L('Cable de energía', '#e74c3c', .05, '.3 .08')],
  // Las escaleras nuevas llevan esc ('descanso' | 'espiral'): al colocarlas se guardan como {n:'Escalera', t: esc} (ver colocar.js)
  'Edificio': [L('Pared', '#444444', .2), { k: 'puerta', n: 'Puerta' }, I('Ventana', '🪟', 1.2, .4), I('Escalera', '🪜', 1.2, 2.8), { ...I('Escalera con descanso', '🪜', 1.6, 2.8), esc: 'descanso' }, { ...I('Escalera espiral', '🪜', 1.8, 1.8), esc: 'espiral' }, I('Ascensor', '🛗', 1.5, 1.5), { ...I('Mesa', '🪑', 1.2, .7), puestos: 2 }],
  'Marcar': [{ k: 'zona', n: 'Zona rectangular', s: 'r' }, { k: 'zona', n: 'Zona elíptica', s: 'e' }, { k: 'texto', n: 'Texto libre' }, { n: 'Imagen…', ic: '🖼️', accion: () => TR.img.elegir(TR.img.colocar) }]   // una entrada con `accion` no es una herramienta: al pulsarla se ejecuta («Imagen…» abre el selector de archivos y coloca la imagen, imagenes.js)
};
let tab = 'Dispositivos';
const TI = { Dispositivos: '🖥️', Cables: '🔗', Formas: '🔷', 'Eléctrico': '⚡', Edificio: '🏢', Marcar: '🏷️' };
const svgIcono = k => `<svg class="pv pvi" viewBox="0 0 96 96">${Object.hasOwn(ICONOS, k) ? ICONOS[k] : ICONOS.generico}</svg>`;
function preview(d) {   // icono o miniatura que se ve en cada botón del menú
  if (d.pt) return svgIcono(d.pt.orig);
  if (esEscalera(d) && !d.esc) return `<svg class="pv" viewBox="0 0 40 26"><rect x="13" y="1" width="14" height="24" fill="#fff" stroke="#34495e" stroke-width="1.5"/><path d="M13 6H27M13 11H27M13 16H27M13 21H27" stroke="#8aa0ab" stroke-width=".8"/><path d="M20 9L24 16H16Z" fill="#34495e"/></svg>`;
  if (d.esc == 'descanso') return `<svg class="pv" viewBox="0 0 40 26"><rect x="9" y="1" width="22" height="24" fill="#fff" stroke="#34495e" stroke-width="1.5"/><path d="M9 9H31M9 13H19M9 17H19M9 21H19M21 13H31M21 17H31M21 21H31" stroke="#8aa0ab" stroke-width=".8"/><path d="M19.2 9V25M20.8 9V25" stroke="#34495e" stroke-width="1"/><path d="M14.5 22V5H25.5V18" fill="none" stroke="#2e86de" stroke-width="1"/><path d="M25.5 22L23.7 18H27.3Z" fill="#2e86de"/></svg>`;
  if (d.esc == 'espiral') { const r = i => { const a = (180 + i * 22.5) * Math.PI / 180; return `M20 13L${(20 + 11 * Math.cos(a)).toFixed(1)} ${(13 + 11 * Math.sin(a)).toFixed(1)}`; };
    return `<svg class="pv" viewBox="0 0 40 26"><path d="M20 13L9 13A11 11 0 1 1 20 24Z" fill="#fff" stroke="#34495e" stroke-width="1.5" stroke-linejoin="round"/><path d="${Array.from({ length: 11 }, (_, i) => r(i + 1)).join('')}" stroke="#8aa0ab" stroke-width=".8"/><circle cx="20" cy="13" r="1.4" fill="#34495e"/></svg>`; }
  if (d.ic) return `<i class="ic">${d.ic}</i>`;
  if (d.k == 'puerta') return `<svg class="pv" viewBox="0 0 40 26"><path d="M2 21H12M28 21H38" stroke="#444" stroke-width="4"/><path d="M12 21V5A16 16 0 0 1 28 21Z" fill="#2e86de33" stroke="#2e86de" stroke-width="1.5"/></svg>`;
  if (d.k == 'line') return `<svg class="pv" viewBox="0 0 40 12"><line x1="3" y1="6" x2="37" y2="6" stroke="${d.c}" stroke-width="${Math.max(3, d.w * 30)}" stroke-dasharray="${d.d ? '5 4' : ''}" stroke-linecap="round"/></svg>`;
  if (d.k == 'shape') return `<svg class="pv" viewBox="-0.6 -0.6 1.2 1.2"><polygon points="${SH[d.sub].map(q => q.join(',')).join(' ')}" fill="#2e86de44" stroke="#2e86de" stroke-width=".07"/></svg>`;
  return `<i class="ic">${d.k == 'zona' ? '▨' : 'T'}</i>`;
}
// ---------- Pestaña «Dispositivos» (F4A): buscador y subsecciones desplegables (CATS), con los modelos del catálogo, los modelos propios del proyecto (S.propios) y su «… Empty» ----------
let busca = '', firmaMenu = '';
const catAbierta = { iot: false };       // subsecciones plegadas (estado de interfaz); las demás empiezan abiertas
const firmaPropios = () => (S.propios || []).join();
function listaDisp() {
  const llano = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), q = llano(busca.trim()), ve = n => !q || llano(n).includes(q);   // la búsqueda no distingue mayúsculas ni acentos
  return CATS.map(c => {
    let h = CAT.Dispositivos.map((d, i) => d.cat == c.id && ve(d.n) ? `<button data-i="${i}" class="${tool == d ? 'on' : ''}">${preview(d)}<b>${esc(d.n)}</b></button>` : '').join('');
    h += (S.propios || []).map(id => { const m = R.modelos[id]; return m && m.cat == c.id && ve(m.nombre) ? `<div class="propio"><button data-m="${id}" class="${tool && tool.mid == id ? 'on' : ''}">${svgIcono(iconoDe(m))}<b>${esc(m.nombre)}</b></button><button class="ed" data-ed="${id}" title="Modificar o borrar este modelo" aria-label="Modificar o borrar el modelo ${esc(m.nombre)}">✎</button></div>` : ''; }).join('');
    if (c.uno && !q) h += `<button data-empty="${c.id}" title="Crear un modelo propio: nombre y puertos">${svgIcono('empty')}<b>${c.uno} Empty</b></button>`;
    return h ? `<details data-cat="${c.id}"${q || catAbierta[c.id] !== false ? ' open' : ''}><summary>${c.t}</summary><div class="g">${h}</div></details>` : '';
  }).join('') || '<p class="vacio">Ningún dispositivo coincide con la búsqueda.</p>';
}
function menu() {
  firmaMenu = firmaPropios();
  $('#tabs').innerHTML = Object.keys(CAT).map(t => `<button data-t="${t}" class="${t == tab ? 'on' : ''}"><i>${TI[t]}</i>${t}</button>`).join('');
  $('#items').innerHTML = tab == 'Dispositivos' ? `<input id="busca" type="search" placeholder="Buscar dispositivo…" aria-label="Buscar dispositivo" value="${esc(busca)}"><div id="lista-disp">${listaDisp()}</div>`
    : CAT[tab].map((d, i) => `<button data-i="${i}" class="${tool == d ? 'on' : ''}">${preview(d)}<b>${d.n}</b></button>`).join('');
  $('#bsel').classList.toggle('on', !tool && !tmp); $('#bmed').classList.toggle('on', !!tool && tool.k == 'medida');
}
function menuSiCambio() {
  if (tool && tool.mid && !(S.propios || []).includes(tool.mid)) { tool = null; firmaMenu = null; }   // la herramienta era un modelo propio que ya no está en el proyecto (se deshizo, se borró o se abrió otro archivo): se suelta
  if (firmaPropios() !== firmaMenu) menu();
}   // deshacer, rehacer, abrir o «Nuevo» pueden cambiar los modelos propios (lo llama renderPaneles; nunca al mover el ratón)
$('#tabs').onclick = e => { const t = e.target.closest('[data-t]'); if (t) { tab = t.dataset.t; menu(); } };
$('#items').onclick = e => {
  const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
  if (d.empty) TR.mod.abrir(d.empty);                                   // «… Empty»: diálogo de modelo propio (modelos.js)
  else if (d.ed) TR.mod.abrir(null, d.ed);
  else if (d.m) setTool(tool && tool.mid == d.m ? null : { k: 'item', mid: d.m });   // modelo propio: nombre y tamaño se leen del modelo al colocar
  else if (d.i) { const t = CAT[tab][d.i]; if (t.accion) return t.accion(); setTool(tool === t ? null : t); }           // volver a pulsar el objeto ya elegido lo suelta y activa Seleccionar
};
$('#items').addEventListener('input', e => { if (e.target.id == 'busca') { busca = e.target.value; $('#lista-disp').innerHTML = listaDisp(); } });   // buscar rehace solo la lista (el campo conserva el foco)
$('#items').addEventListener('toggle', e => { const c = e.target.dataset && e.target.dataset.cat; if (c && !busca.trim()) catAbierta[c] = e.target.open; }, true);
function setTool(d) { tool = d; tmp = null; sel = null; multi = []; selEdge = null; avisoMsg = ''; snapPt = null; if (d && d.k == 'line' && !esCable(d)) $('#col').value = d.c; else if (d && esEscalera(d)) $('#col').value = '#444444'; menu(); render(); }   // cualquier escalera empieza con el gris de las paredes
$('#bsel').onclick = () => setTool(null);
$('#bmed').onclick = () => setTool(tool && tool.k == 'medida' ? null : { k: 'medida' });   // igual: un segundo clic vuelve a Seleccionar
