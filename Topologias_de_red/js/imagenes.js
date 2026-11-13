// ===== imagenes.js: imágenes (F4B): imagen de un equipo, imagen de un modelo e imagen suelta en el plano =====
// · El almacén es R.imgs (recursos.js): valida PNG/JPEG/WebP por sus bytes y aplica los límites. Los objetos solo guardan el id (o.img, modelo.img).
// · Imagen del equipo: o.img, dentro de S (un paso de historial; Ctrl+Z la revierte). Le gana a la del modelo (imagenDe, dibujo.js).
// · Imagen del modelo: se escribe en la plantilla, igual que el precio.
//   shortcut: no es un paso del historial (Ctrl+Z no la deshace por sí sola; sí cambia si se deshace una edición del modelo propio, que vuelve a su versión anterior); si hiciera falta, versionarla como el nombre y los puertos (modelos.js).
// · Imagen suelta: un objeto 'item' de tipo 'imagen' (se mueve, gira, copia y cambia de tamaño como un equipo; no admite cables).
TR.img = (() => {
  const LADO = 2;                          // lado mayor (m) con que nace una imagen suelta
  const admite = o => o.k == 'item' && ['dispositivo', 'rack', 'imagen'].includes(tipoDe(o));
  const suelta = esImagen;
  const idsDe = os => os.map(o => o.id);

  // ---------- Elegir un archivo ----------
  const entrada = document.createElement('input'); entrada.type = 'file'; entrada.accept = MIME_IMG.join(); entrada.hidden = true; document.body.appendChild(entrada);
  let alElegir = null;                     // qué hacer con la imagen elegida: fn(id de imagen)
  function elegir(fn) { alElegir = fn; entrada.value = ''; entrada.click(); }
  function cargar(f, fn) {                 // lee el archivo, lo agrega a R.imgs (valida y aplica límites) y llama a fn(id); si no vale, avisa y no cambia nada
    if (f.size > R.limites.imagen) return alert(`No se pudo usar la imagen.\n\nPesa ${(f.size / MB).toFixed(1)} MB y el máximo por imagen es ${+(R.limites.imagen / MB).toFixed(1)} MB.`);   // sin leer un archivo enorme
    const fr = new FileReader();
    fr.onload = () => { const r = R.agregarImagen(fr.result, f.name); if (r.ok) fn(r.id); else alert('No se pudo usar la imagen.\n\n' + r.error); };
    fr.onerror = () => alert('No se pudo leer el archivo.');
    fr.readAsDataURL(f);
  }
  entrada.onchange = () => { const f = entrada.files[0], fn = alElegir; alElegir = null; if (f && fn) cargar(f, fn); };

  // ---------- Cambios ----------
  function ponerEquipo(ids, img) {         // un paso de historial
    const os = ids.map(byId).filter(o => o && esEditable(o) && admite(o) && o.img != img); if (!os.length || !R.imgs[img]) return false;
    const im = R.imgs[img]; push(); os.forEach(o => { o.img = img; if (suelta(o)) o.h = Math.max(.2, r3(o.w * im.h / im.w)); }); render(); return true;   // una imagen suelta llena su rectángulo: al cambiarla toma la proporción de la nueva (conserva el ancho)
  }
  function quitarEquipo(ids) {             // el equipo vuelve a la imagen de su modelo o a su icono; a una imagen suelta no se le quita (se borra el objeto)
    const os = ids.map(byId).filter(o => o && esEditable(o) && o.img && !suelta(o)); if (!os.length) return false;
    push(); os.forEach(o => { delete o.img; }); render(); return true;
  }
  function ponerModelo(mid, img) {         // img vacío = quitarla
    const m = R.modelos[mid]; if (!m || (img && !R.imgs[img])) return false;
    if (img) m.img = img; else delete m.img; render(); return true;
  }
  function colocar(img) {                  // imagen suelta: nace en el centro de la vista, seleccionada, con su proporción
    const im = R.imgs[img]; if (!im) return false;
    if (!capaEditable()) { avisoEmergente('La capa «' + capaActual().nombre + '» está oculta o bloqueada: elegí otra capa para colocar la imagen'); return false; }
    const k = LADO / Math.max(im.w, im.h), lado = v => Math.max(.2, r3(v * k));
    setTool(null);
    const o = add({ k: 'item', tipo: 'imagen', n: 'Imagen', w: lado(im.w), h: lado(im.h), x: r3((svg.clientWidth / 2 - V.ox) / V.z), y: r3((svg.clientHeight / 2 - V.oy) / V.z), label: '', img });
    fijarSeleccion([o.id]); render(); return true;
  }

  // ---------- Menú contextual e inspector ----------
  TR.acc.registrar({ id: 'img-poner', grupo: 'editar', texto: os => os.every(suelta) ? 'Cambiar imagen…' : 'Imagen del equipo…', aplica: os => os.length > 0 && os.every(admite), ejecutar: os => { const ids = idsDe(os); elegir(img => ponerEquipo(ids, img)); return true; } });
  TR.acc.registrar({ id: 'img-quitar', grupo: 'editar', texto: 'Quitar imagen del equipo', aplica: os => os.length > 0 && os.every(admite) && !os.every(suelta), habilitada: os => os.some(o => o.img && !suelta(o)), ejecutar: os => quitarEquipo(idsDe(os)) });
  function seccion(os) {                   // HTML de la sección «Imagen» del inspector (vacío si algo de lo seleccionado no lleva imagen)
    if (!os.every(admite)) return '';
    const ed = os.every(esEditable), b = (attr, t, on) => `<button ${attr}${on && ed ? '' : ' disabled'}>${t}</button>`, mid = os[0].modelo, m = mid && R.modelos[mid];
    let h = '<div class="botones">' + b('data-acc="img-poner"', os.every(suelta) ? 'Cambiar imagen…' : 'Imagen del equipo…', true)
      + (os.every(suelta) ? '' : b('data-acc="img-quitar"', 'Quitar la del equipo', os.some(o => o.img && !suelta(o)))) + '</div>';
    if (m && os.every(o => o.modelo == mid)) h += '<div class="botones">' + b(`data-img-mod="${mid}"`, 'Imagen del modelo…', true) + b(`data-img-mod-x="${mid}"`, 'Quitar la del modelo', !!m.img) + '</div>'
      + '<p class="nota">La imagen del modelo vale para todos sus equipos y no es un paso de Ctrl+Z. La del equipo tiene prioridad.</p>';
    return h;
  }
  $('#insp-cuerpo').addEventListener('click', e => {
    const b = e.target.closest('[data-img-mod],[data-img-mod-x]'); if (!b || b.disabled) return;
    const mid = b.dataset.imgMod; if (mid) elegir(img => ponerModelo(mid, img)); else ponerModelo(b.dataset.imgModX, '');
  });

  return { elegir, cargar, ponerEquipo, quitarEquipo, ponerModelo, colocar, seccion };
})();
