// ---------- Catálogo del menú izquierdo ----------
const I = (n, ic, w = .8, h = .8) => ({ k: 'item', n, ic, w, h });
const L = (n, c, w, d = '') => ({ k: 'line', n, c, w, d });
const circ = Array.from({ length: 20 }, (_, i) => [Math.cos(i * Math.PI / 10) / 2, Math.sin(i * Math.PI / 10) / 2]);
const SH = {
  'Rectángulo': [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]], 'Círculo': circ,
  'Triángulo': [[0, -.5], [.5, .5], [-.5, .5]], 'Rombo': [[0, -.5], [.5, 0], [0, .5], [-.5, 0]],
  'Hexágono': [[-.25, -.5], [.25, -.5], [.5, 0], [.25, .5], [-.25, .5], [-.5, 0]]
};
const CAT = {
  'Dispositivos': [I('Router', '📡'), I('Switch', '🔀'), I('Servidor', '🖥️'), I('PC', '💻'), I('Firewall', '🧱'), I('Punto de acceso', '📶'), I('Impresora', '🖨️'), I('Cámara IP', '📷'), I('Teléfono IP', '☎️'), I('Rack', '🗄️', .8, 1)],
  'Cables': [L('UTP Cat6', '#2e86de', .06), L('Fibra óptica', '#f39c12', .06), L('Coaxial', '#555555', .07), L('Serial', '#8e44ad', .06, '.2 .1'), L('Inalámbrico', '#16a085', .05, '.1 .15')],
  'Formas': Object.keys(SH).map(n => ({ k: 'shape', n })),
  'Eléctrico': [I('Lámpara', '💡', .5, .5), I('Enchufe', '🔌', .4, .4), I('Interruptor', '🎚️', .4, .4), I('UPS', '🔋'), I('Tablero', '⚡', .6, .8), L('Cable de energía', '#e74c3c', .05, '.3 .08')],
  'Edificio': [L('Pared', '#444444', .2), { k: 'puerta', n: 'Puerta' }, I('Ventana', '🪟', 1.2, .4), I('Escalera', '🪜', 1.2, 2.8), I('Ascensor', '🛗', 1.5, 1.5)],
  'Marcar': [{ k: 'zona', n: 'Zona rectangular', s: 'r' }, { k: 'zona', n: 'Zona elíptica', s: 'e' }, { k: 'texto', n: 'Texto libre' }]
};
let tab = 'Dispositivos';
const TI = { Dispositivos: '🖥️', Cables: '🔗', Formas: '🔷', 'Eléctrico': '⚡', Edificio: '🏢', Marcar: '🏷️' };
function preview(d) {   // icono o miniatura que se ve en cada botón del menú
  if (d.n == 'Escalera') return `<svg class="pv" viewBox="0 0 40 26"><rect x="13" y="1" width="14" height="24" fill="#fff" stroke="#34495e" stroke-width="1.5"/><path d="M13 6H27M13 11H27M13 16H27M13 21H27" stroke="#8aa0ab" stroke-width=".8"/><path d="M20 9L24 16H16Z" fill="#34495e"/></svg>`;
  if (d.ic) return `<i class="ic">${d.ic}</i>`;
  if (d.k == 'puerta') return `<svg class="pv" viewBox="0 0 40 26"><path d="M2 21H12M28 21H38" stroke="#444" stroke-width="4"/><path d="M12 21V5A16 16 0 0 1 28 21Z" fill="#2e86de33" stroke="#2e86de" stroke-width="1.5"/></svg>`;
  if (d.k == 'line') return `<svg class="pv" viewBox="0 0 40 12"><line x1="3" y1="6" x2="37" y2="6" stroke="${d.c}" stroke-width="${Math.max(3, d.w * 30)}" stroke-dasharray="${d.d ? '5 4' : ''}" stroke-linecap="round"/></svg>`;
  if (d.k == 'shape') return `<svg class="pv" viewBox="-0.6 -0.6 1.2 1.2"><polygon points="${SH[d.n].map(q => q.join(',')).join(' ')}" fill="#2e86de44" stroke="#2e86de" stroke-width=".07"/></svg>`;
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
function setTool(d) { tool = d; tmp = null; sel = null; multi = []; selEdge = null; avisoMsg = ''; snapPt = null; if (d && d.k == 'line') $('#col').value = d.c; menu(); render(); }
$('#bsel').onclick = () => setTool(null);
$('#bmed').onclick = () => setTool(tool && tool.k == 'medida' ? null : { k: 'medida' });   // igual: un segundo clic vuelve a Seleccionar
