// ===== vistarack.js: vista del frente de un rack (Fase 8, D5) =====
// Panel que tapa el área de trabajo (no el inspector) con su propio SVG sobre el mismo S: usa push(), deshacer/rehacer y el inspector de siempre.
// Se abre con doble clic sobre un rack o «Abrir rack…». Mientras está abierta, los equipos de ESE rack son visibles y editables (esVisible, plantas.js)
// y el teclado solo admite Ctrl+Z / Ctrl+Y, Supr y Esc (controles.js). Al cerrarla vuelve la selección que había; la vista del plano y la herramienta no se tocan (R10).
// Se redibuja desde renderPaneles (nunca al mover el ratón) y se cierra sola si su rack deja de existir o de ser editable (deshacer, «Nuevo», abrir un archivo).
// F8B: cada equipo muestra sus puertos (verde = ocupado). Un clic en un puerto libre y otro en un puerto libre de otro equipo los une con un patch cord
// (TR.con.parche: una conexión sin ruta); un clic en un puerto ocupado dice a qué está conectado y, si es un patch cord, permite quitarlo.
// Con «Etiquetas» prendido, cada puerto conectado lleva su etiqueta física (la misma del plano).
TR.vr = (() => {
  const UH = 20, W = 520, MX = 34, MY = 14, K = 2;   // unidades del dibujo: alto de una U, ancho interior, margen de los números y margen vertical; K = px por unidad en el PNG
  const PX = 196, PS = 7, PP = 9, COLS = 34, NOM = 28;   // puertos: x del primero, lado, paso y cuántos entran por fila; NOM = largo máximo del nombre (lo que entra antes de los puertos)
  const F = 'font-family="Segoe UI,Arial,sans-serif"';
  const el = document.createElement('div'); el.id = 'vrack'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-labelledby', 'vr-t');
  el.innerHTML = '<div class="vr-h"><b id="vr-t"></b><span id="vr-n"></span><button id="vr-menos" title="Alejar (Ctrl + rueda)">−</button><button id="vr-mas" title="Acercar (Ctrl + rueda)">+</button><button id="vr-png" title="Exportar el interior del rack como imagen PNG">🖼️ PNG</button><button id="vr-x" title="Volver al plano (Esc)">✕ Cerrar</button></div><div id="vr-c"></div>';
  $('#work').appendChild(el);
  const cuerpo = el.querySelector('#vr-c');
  let id = null, antes = null, mv = null, pend = null, z = 1;   // z = zoom de la vista (1 = entra a lo ancho)   // id del rack abierto; selección que había al abrir; mv = equipo que se arrastra a otra unidad; pend = {d, p}: primer puerto de un patch cord
  const yDe = (n, u, h) => MY + (n - u - h + 1) * UH;   // borde de arriba de un equipo de alto h cuya unidad de abajo es u (la U 1 está abajo)
  const nombre = o => o.label || o.n || 'Equipo';

  function svgDe(r, marcar) {              // el frente del rack, autocontenido (también es lo que exporta el PNG); marcar: resalta el equipo seleccionado y el puerto pendiente
    const n = TR.rack.usDe(r), hs = TR.rack.hijosDe(r), H = n * UH, etq = TR.red.viendo(), centro = new Map(); let cables = '';
    const ics = [...new Set(hs.map(modeloDe).filter(Boolean).map(iconoDe))].map(k => `<symbol id="vr-ic-${k}" viewBox="0 0 96 96">${ICONOS[k]}</symbol>`).join('');
    let h = `<rect width="${MX + W + 14}" height="${H + 2 * MY}" fill="#f2f4f5"/><rect x="${MX - 6}" y="${MY - 6}" width="${W + 12}" height="${H + 12}" rx="4" fill="#2b3338"/><rect x="${MX}" y="${MY}" width="${W}" height="${H}" fill="#11181c"/>`;
    for (let u = 1; u <= n; u++) h += `<text x="${MX - 10}" y="${yDe(n, u, 1) + UH / 2}" font-size="9" text-anchor="end" dominant-baseline="central" fill="#5d7078" ${F}>${u}</text><line x1="${MX}" x2="${MX + W}" y1="${yDe(n, u, 1)}" y2="${yDe(n, u, 1)}" stroke="#2b3338"/>`;
    for (const o of hs) {
      const m = modeloDe(o), a = o.ru.h * UH, on = marcar && o.id == sel, y0 = yDe(n, o.ru.u, o.ru.h), ps = TR.con.puertosDe(o), us = TR.con.usos(o), filas = Math.ceil(ps.length / COLS), t = nombre(o) + (m ? ' · ' + (m.corto || m.nombre) : '');
      h += `<g data-id="${o.id}" transform="translate(${MX} ${y0})"><rect x="1" y="1" width="${W - 2}" height="${a - 2}" rx="2" fill="#dfe6e9" stroke="${on ? '#e0a030' : '#7f8c8d'}" stroke-width="${on ? 2.5 : 1}"/>`
        + (m ? `<use href="#vr-ic-${iconoDe(m)}" x="5" y="${a / 2 - 8}" width="16" height="16"/>` : `<text x="13" y="${a / 2}" font-size="12" text-anchor="middle" dominant-baseline="central">${esc(o.ic || '')}</text>`)
        + `<text x="27" y="${a / 2}" font-size="11" dominant-baseline="central" fill="#1d2a2f" ${F}>${esc(t.length > NOM ? t.slice(0, NOM - 1) + '…' : t)}</text>`;
      ps.forEach((p, i) => {               // una fila de puertos va abajo (deja lugar a las etiquetas); con más de COLS puertos, dos filas
        const x = PX + (i % COLS) * PP, y = filas == 1 ? a - 3 - PS : 2 + Math.floor(i / COLS) * PP, u = us.find(q => q.c[q.k].p == p.id), esPend = marcar && pend && pend.d == o.id && pend.p == p.id;
        centro.set(o.id + '/' + p.id, { x: MX + x + PS / 2, y: y0 + y + PS / 2 });
        h += `<rect data-p="${p.id}" x="${x}" y="${y}" width="${PS}" height="${PS}" rx="1" fill="${esPend ? '#e0a030' : u ? '#27ae60' : p.off ? '#b2bec3' : '#fff'}" stroke="#2d3436" stroke-width=".6"><title>${esc(p.nombre + (u ? ' — ' + TR.con.remoto(u) : p.off ? ' (apagado)' : ''))}</title></rect>`;
        const e = etq && u && filas == 1 && TR.red.textoEtq(u.c, u.k), v = e && TR.red.vlan.de(p.vlan);
        if (e) h += `<text x="${x + PS / 2}" y="${y - 1.5}" font-size="5" text-anchor="middle" fill="${v ? v.color : '#1d2a2f'}" ${F} pointer-events="none">${esc(e)}</text>`;
      });
      h += '</g>';
    }
    for (const c of S.conex || []) {       // patch cords del rack: una curva entre sus dos puertos
      const A = TR.con.esParche(c) && centro.get(c.a.d + '/' + c.a.p), B = A && centro.get(c.b.d + '/' + c.b.p); if (!B) continue;
      cables += `<path d="M${A.x} ${A.y}Q${(A.x + B.x) / 2 + 16} ${(A.y + B.y) / 2} ${B.x} ${B.y}" fill="none" stroke="#e67e22" stroke-width="1.6" stroke-linecap="round" opacity=".85" pointer-events="none"/>`;
    }
    const w = MX + W + 14, alto = H + 2 * MY;
    return { xml: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${alto}" width="${w * K}" height="${alto * K}"><defs>${ics}</defs>${h}${cables}</svg>`, w: w * K, h: alto * K };
  }
  function refrescar() {                   // lo llama renderPaneles
    if (id == null) return; const r = byId(id);
    if (!r || !TR.rack.esRack(r) || !esEditable(r)) { cerrar(); return; }
    const oc = TR.rack.ocupadas(r);
    el.querySelector('#vr-t').textContent = 'Rack' + (r.label ? ' · ' + r.label : '');
    el.querySelector('#vr-n').textContent = `${oc}/${TR.rack.usDe(r)} U ocupadas · ` + (pend ? 'elegí el puerto del otro equipo para unirlos con un patch cord' : oc ? 'arrastrá un equipo para cambiarlo de unidad · clic en un puerto y después en otro: patch cord · clic derecho: opciones' : 'para montar un equipo, cerrá esta vista y soltalo sobre el rack en el plano');
    const s = svgDe(r, true); cuerpo.innerHTML = s.xml; aplicarZoom(s.h);
  }
  function aplicarZoom(h = cuerpo.firstElementChild.height.baseVal.value) {   // h = alto del PNG; nunca más chico que 20 px por unidad: en una ventana baja la vista se desplaza en lugar de achicarse
    const sv = cuerpo.firstElementChild; if (!sv) return;
    Object.assign(sv.style, { minHeight: h / K * z + 'px', width: 100 * z + '%', maxWidth: 1100 * z + 'px', height: z > 1 ? 'auto' : '' });
  }
  function zoom(f, cx = cuerpo.clientWidth / 2, cy = cuerpo.clientHeight / 2) {   // cambia el zoom dejando quieto el punto (cx, cy) del panel
    const nz = Math.min(4, Math.max(1, Math.round(z * f * 100) / 100)); if (nz == z) return;
    const fx = (cuerpo.scrollLeft + cx) / cuerpo.scrollWidth, fy = (cuerpo.scrollTop + cy) / cuerpo.scrollHeight;
    z = nz; aplicarZoom(); cuerpo.scrollLeft = fx * cuerpo.scrollWidth - cx; cuerpo.scrollTop = fy * cuerpo.scrollHeight - cy;
  }
  function abrir(rid) {
    const r = byId(rid); if (id != null || !r || !TR.rack.esRack(r) || !esEditable(r)) return false;
    TR.ctx.cerrar(); antes = { sel, multi }; id = rid; z = 1; sel = rid; multi = []; selEdge = null; pend = null; el.hidden = false; render(); cuerpo.scrollTop = cuerpo.scrollHeight; return true;   // el rack queda seleccionado: el inspector muestra su etiqueta y sus unidades; se empieza por abajo, donde está la U 1
  }
  function cerrar() {
    if (id == null) return; id = null; mv = null; pend = null; el.hidden = true;
    sel = byId(antes.sel) ? antes.sel : null; multi = antes.multi.filter(byId); render();
  }
  function png() { const r = byId(id); if (!r) return; const s = svgDe(r, false); exportarPng(s.xml, s.w, s.h, 'rack' + (r.label ? '-' + r.label.replace(/[^\w-]+/g, '_') : '') + '.png'); }   // D20
  function clicPuerto(o, pid, e) {         // F8B: ocupado = a qué está conectado (y quitar el patch cord); libre = primer o segundo extremo de un patch cord
    const u = TR.con.usos(o).find(x => x.c[x.k].p == pid), sinRuta = u && TR.con.esParche(u.c); sel = o.id; multi = [];
    if (u) { pend = null; render(); TR.ctx.abrirItems(TR.con.puerto(o, pid).nombre + ' de ' + nombre(o), [{ id: 'q', texto: (sinRuta ? 'Quitar: ' : '') + TR.con.remoto(u), habil: sinRuta }], e, () => TR.con.quitar(u.c.id)); return; }
    if (pend && pend.d != o.id) { const msg = TR.con.parche(pend, { d: o.id, p: pid }); pend = null; if (msg) avisoEmergente(msg); render(); return; }
    pend = pend && pend.p == pid ? null : { d: o.id, p: pid }; render();   // otro clic en el mismo puerto lo suelta; en otro del mismo equipo, cambia de puerto
  }

  cuerpo.addEventListener('pointerdown', e => {
    if (e.button == 2) { pend = null; TR.ctx.abrir(e); return; }   // sobre un equipo: sus acciones (subir, bajar, desmontar, interfaces, eliminar)
    const g = e.target.closest('[data-id]'), o = g && byId(g.dataset.id), p = o && e.target.closest('[data-p]');
    if (p && e.button == 0) { clicPuerto(o, p.dataset.p, e); return; }
    pend = null; sel = o ? o.id : id; multi = []; selEdge = null;
    if (o && e.button == 0) { cuerpo.setPointerCapture(e.pointerId); mv = { o, y: e.clientY, u: o.ru.u }; }
    render();
  });
  cuerpo.addEventListener('pointermove', e => {   // el equipo sigue al cursor de unidad en unidad, sin salirse del rack; S no cambia hasta soltar
    const sv = cuerpo.firstElementChild, r = byId(id); if (!mv || !sv || !r) return;
    const b = sv.getBoundingClientRect(), vb = sv.viewBox.baseVal, px = UH * Math.min(b.width / vb.width, b.height / vb.height), n = TR.rack.usDe(r), o = mv.o;
    if (!(px > 0)) return;   // vista sin tamaño (panel oculto)
    mv.u = Math.max(1, Math.min(n - o.ru.h + 1, o.ru.u + Math.round((mv.y - e.clientY) / px)));
    const g = sv.querySelector(`[data-id="${o.id}"]`); if (g) g.setAttribute('transform', `translate(${MX} ${yDe(n, mv.u, o.ru.h)})`);
  });
  const soltar = () => { if (!mv) return; const { o, u } = mv; mv = null; if (byId(o.id) && o.ru && u != o.ru.u) TR.acc.fijar([o.id], 'ruu', u); refrescar(); };   // fijar valida (unidad ocupada = aviso) y guarda un paso; si se rechaza, el dibujo vuelve
  cuerpo.addEventListener('pointerup', soltar); cuerpo.addEventListener('pointercancel', () => { mv = null; refrescar(); });   // arrastre cancelado: no se mueve nada
  el.addEventListener('contextmenu', e => e.preventDefault());
  cuerpo.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); const b = cuerpo.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX - b.left, e.clientY - b.top); }, { passive: false });   // Ctrl + rueda (o pellizco): la rueda sola sigue desplazando
  el.querySelector('#vr-mas').onclick = () => zoom(1.5); el.querySelector('#vr-menos').onclick = () => zoom(1 / 1.5);
  el.querySelector('#vr-x').onclick = cerrar; el.querySelector('#vr-png').onclick = png;

  return { abrir, cerrar, refrescar, rack: () => id, svg: () => svgDe(byId(id), false), pendiente: () => pend, zoom: () => z };
})();
