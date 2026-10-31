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
  'Dispositivos': [I('Router', '📡'), I('Switch', '🔀'), I('Servidor', '🖥️'), I('PC', '💻'), I('Firewall', '🧱'), I('Punto de acceso', '📶'), I('Impresora', '🖨️'), I('Cámara IP', '📷'), I('Teléfono IP', '☎️'), I('Rack', '🗄️', .8, 1)],
  'Cables': [L('UTP Cat6', '#2e86de', .06), L('Fibra óptica', '#f39c12', .06), L('Coaxial', '#555555', .07), L('Serial', '#8e44ad', .06, '.2 .1'), L('Inalámbrico', '#16a085', .05, '.1 .15')],
  'Formas': Object.keys(SH).map(sub => ({ k: 'shape', n: NOMBRE_FORMA[sub], tipo: 'forma', sub })),
  'Eléctrico': [I('Lámpara', '💡', .5, .5), I('Enchufe', '🔌', .4, .4), I('Interruptor', '🎚️', .4, .4), I('UPS', '🔋'), I('Tablero', '⚡', .6, .8), L('Cable de energía', '#e74c3c', .05, '.3 .08')],
  // Las escaleras nuevas llevan esc ('descanso' | 'espiral'): al colocarlas se guardan como {n:'Escalera', t: esc} (ver colocar.js)
  'Edificio': [L('Pared', '#444444', .2), { k: 'puerta', n: 'Puerta' }, I('Ventana', '🪟', 1.2, .4), I('Escalera', '🪜', 1.2, 2.8), { ...I('Escalera con descanso', '🪜', 1.6, 2.8), esc: 'descanso' }, { ...I('Escalera espiral', '🪜', 1.8, 1.8), esc: 'espiral' }, I('Ascensor', '🛗', 1.5, 1.5)],
  'Marcar': [{ k: 'zona', n: 'Zona rectangular', s: 'r' }, { k: 'zona', n: 'Zona elíptica', s: 'e' }, { k: 'texto', n: 'Texto libre' }]
};
let tab = 'Dispositivos';
const TI = { Dispositivos: '🖥️', Cables: '🔗', Formas: '🔷', 'Eléctrico': '⚡', Edificio: '🏢', Marcar: '🏷️' };
function preview(d) {   // icono o miniatura que se ve en cada botón del menú
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
function menu() {
  $('#tabs').innerHTML = Object.keys(CAT).map(t => `<button data-t="${t}" class="${t == tab ? 'on' : ''}"><i>${TI[t]}</i>${t}</button>`).join('');
  $('#items').innerHTML = CAT[tab].map((d, i) => `<button data-i="${i}" class="${tool == d ? 'on' : ''}">${preview(d)}<b>${d.n}</b></button>`).join('');
  $('#bsel').classList.toggle('on', !tool && !tmp); $('#bmed').classList.toggle('on', !!tool && tool.k == 'medida');
}
$('#tabs').onclick = e => { const t = e.target.closest('[data-t]'); if (t) { tab = t.dataset.t; menu(); } };
$('#items').onclick = e => {
  const b = e.target.closest('[data-i]'); if (!b) return;
  const d = CAT[tab][b.dataset.i];
  setTool(tool === d ? null : d);                 // volver a pulsar el objeto ya elegido lo suelta y activa Seleccionar
};
function setTool(d) { tool = d; tmp = null; sel = null; multi = []; selEdge = null; avisoMsg = ''; snapPt = null; if (d && d.k == 'line') $('#col').value = d.c; else if (d && esEscalera(d)) $('#col').value = '#444444'; menu(); render(); }   // cualquier escalera empieza con el gris de las paredes
$('#bsel').onclick = () => setTool(null);
$('#bmed').onclick = () => setTool(tool && tool.k == 'medida' ? null : { k: 'medida' });   // igual: un segundo clic vuelve a Seleccionar
