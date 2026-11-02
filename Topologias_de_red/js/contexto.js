// ===== contexto.js: menú contextual (Fase 3, D9) =====
// Se abre con clic derecho SOLO sin herramienta activa ni operación en curso (ver el botón 2 de interaccion.js).
// Sobre un objeto editable: sus acciones (cortar, copiar, pegar, eliminar...). En el fondo vacío (o sobre algo no editable): volver atrás, adelante y pegar.
// Las entradas salen de TR.acc.paraMenu (acciones.js), según el tipo de lo seleccionado.
// Posición y tamaño no se editan aquí: el menú lleva al campo del inspector. Se cierra con Esc, clic fuera, rueda, cambio de ventana o al ejecutar una acción.
TR.ctx = (() => {
  const m = $('#ctx'); let abierto = false, puntoClic = { x: 0, y: 0 };   // puntoClic: dónde se pega
  const tipoNom = { pared: 'Pared', cable: 'Cable', dispositivo: 'Dispositivo', rack: 'Rack', escalera: 'Escalera', ascensor: 'Ascensor', ventana: 'Ventana', puerta: 'Puerta', forma: 'Forma', zona: 'Zona', texto: 'Texto', medida: 'Medida' };
  const botones = () => [...m.querySelectorAll('button:not(:disabled)')];
  function cerrar() { if (!abierto) return; abierto = false; m.hidden = true; m.innerHTML = ''; }
  function abrir(e) {
    const t = e.target.closest && e.target.closest('[data-id]'), o = t && byId(t.dataset.id);
    puntoClic = toW(e);
    if (o && esEditable(o)) { if (!multi.includes(o.id)) { sel = o.id; multi = []; } } else { sel = null; multi = []; }   // el objeto bajo el cursor queda seleccionado (o se mantiene la selección múltiple); en el fondo se suelta la selección
    selEdge = null; render();
    const os = seleccionados(), grupos = TR.acc.paraMenu(os); if (!grupos.length) return false;
    TR.ui.menu++;
    const tit = !os.length ? 'Área de trabajo' : os.length > 1 ? os.length + ' objetos' : (tipoNom[tipoDe(os[0])] || tipoDe(os[0])) + (os[0].label ? ' · ' + os[0].label : '');
    m.innerHTML = `<div class="ch">${esc(tit)}</div>` + grupos.map(g => `<div class="cg">${g.titulo ? `<div class="ct">${g.titulo}</div>` : ''}${g.items.map(i =>
      `<button role="${g.titulo ? 'menuitemradio' : 'menuitem'}"${g.titulo ? ` aria-checked="${i.marca}"` : ''} data-a="${i.id}"${i.habil ? '' : ' disabled'}><i>${i.marca ? '✓' : ''}</i>${esc(i.texto)}</button>`).join('')}</div>`).join('');
    m.hidden = false; abierto = true;
    const w = m.offsetWidth, h = m.offsetHeight;                                      // dentro de la ventana
    m.style.left = Math.max(4, Math.min(e.clientX, innerWidth - w - 4)) + 'px'; m.style.top = Math.max(4, Math.min(e.clientY, innerHeight - h - 4)) + 'px';
    const b = botones()[0]; if (b) b.focus();
    return true;
  }
  function tecla(e) {                                                                 // lo llama controles.js mientras el menú está abierto
    const bs = botones(), i = bs.indexOf(document.activeElement), n = bs.length;
    if (e.key == 'Escape') { e.preventDefault(); cerrar(); }
    else if (e.key == 'Tab') cerrar();
    else if (n && e.key == 'ArrowDown') { e.preventDefault(); bs[(i + 1) % n].focus(); }
    else if (n && e.key == 'ArrowUp') { e.preventDefault(); bs[(i - 1 + n) % n].focus(); }
    else if (n && e.key == 'Home') { e.preventDefault(); bs[0].focus(); }
    else if (n && e.key == 'End') { e.preventDefault(); bs[n - 1].focus(); }
  }
  m.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; cerrar(); TR.acc.ejecutar(b.dataset.a, { punto: puntoClic }); });
  m.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('pointerdown', e => { if (abierto && !m.contains(e.target)) cerrar(); }, true);   // en captura: corre antes que la apertura de un menú nuevo
  document.addEventListener('wheel', () => cerrar(), { capture: true, passive: true });
  window.addEventListener('blur', cerrar); window.addEventListener('resize', cerrar);
  return { abrir, cerrar, tecla, abierto: () => abierto };
})();
