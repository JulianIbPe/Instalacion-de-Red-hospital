// ===== recursos.js: almacén de recursos pesados (imágenes y plantillas de modelo), separado del estado S y del historial (Fase 2) =====
// R.imgs    { id: {mime, data (data URI), w, h, bytes, nombre} }. El id sale del CONTENIDO (hash): la misma imagen nunca se guarda dos veces y,
//           al abrir otro proyecto, las imágenes se unen sin renumerar (por eso deshacer sigue funcionando tras abrir).
// R.modelos { id: {nombre, marca, cat, tipo, sub, w, h, ic, img, uAlto, uTotal, puertos:[{g, n, tipo, vel, pref}], v, base} }. Las plantillas están versionadas:
//           editar una crea una versión nueva (nunca se altera en silencio lo ya colocado). Aquí solo está el almacén; la edición llega en la Fase 4.
// Los objetos de S solo guardan referencias (o.img = id de imagen, o.modelo = id de modelo): los snapshots del historial nunca contienen imágenes.
// Límites iniciales (ajustables en R.limites): 5 MB por imagen, 50 MB de imágenes por proyecto, 8000 px por lado, 40 millones de píxeles.
// Los límites se aplican igual al importar, pegar, guardar y abrir.
const MB = 1024 * 1024;
const MIME_IMG = ['image/png', 'image/jpeg', 'image/webp'];
function bytesDeDataUri(uri) {            // {mime, bytes: Uint8Array} o null si no es un data URI base64 de PNG, JPEG o WebP
  const m = typeof uri == 'string' && /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]*={0,2})$/.exec(uri); if (!m) return null;
  try { const bin = atob(m[2]), b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return { mime: m[1], bytes: b }; } catch { return null; }
}
function detectarImagen(b) {              // {mime, w, h} según los BYTES (firma real del formato), o null
  const u16 = i => (b[i] << 8) | b[i + 1], u32 = i => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  if (b.length > 24 && b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47 && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A && b[12] == 0x49 && b[13] == 0x48 && b[14] == 0x44 && b[15] == 0x52)
    return { mime: 'image/png', w: u32(16), h: u32(20) };
  if (b.length > 4 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF) {                          // JPEG: se busca el marcador SOF con las dimensiones
    let p = 2;
    while (p + 9 < b.length) {
      if (b[p] != 0xFF) return null; while (b[p + 1] == 0xFF) p++;
      const mk = b[p + 1];
      if (mk == 0xD8 || mk == 0x01 || (mk >= 0xD0 && mk <= 0xD7)) { p += 2; continue; }
      if (mk == 0xD9) return null;
      if (mk >= 0xC0 && mk <= 0xCF && mk != 0xC4 && mk != 0xC8 && mk != 0xCC) return { mime: 'image/jpeg', w: u16(p + 7), h: u16(p + 5) };
      p += 2 + u16(p + 2);
    }
    return null;
  }
  if (b.length > 30 && b[0] == 0x52 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x46 && b[8] == 0x57 && b[9] == 0x45 && b[10] == 0x42 && b[11] == 0x50) {   // WebP: VP8, VP8L o VP8X
    const t = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (t == 'VP8X') return { mime: 'image/webp', w: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), h: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
    if (t == 'VP8L' && b[20] == 0x2F) return { mime: 'image/webp', w: 1 + (b[21] | ((b[22] & 0x3F) << 8)), h: 1 + ((b[22] >> 6) | (b[23] << 2) | ((b[24] & 0x0F) << 10)) };
    if (t == 'VP8 ' && b[23] == 0x9D && b[24] == 0x01 && b[25] == 0x2A) return { mime: 'image/webp', w: (b[26] | (b[27] << 8)) & 0x3FFF, h: (b[28] | (b[29] << 8)) & 0x3FFF };
  }
  return null;
}
function validarImagen(uri, lim = R.limites) {    // {ok, error} o {ok, mime, w, h, bytes}
  const d = bytesDeDataUri(uri); if (!d) return { ok: false, error: 'No es una imagen PNG, JPEG o WebP válida (data URI).' };
  if (d.bytes.length > lim.imagen) return { ok: false, error: `La imagen pesa ${(d.bytes.length / MB).toFixed(1)} MB y el máximo por imagen es ${+(lim.imagen / MB).toFixed(1)} MB.` };
  const f = detectarImagen(d.bytes); if (!f) return { ok: false, error: 'El contenido no es un PNG, JPEG o WebP real (se comprueba la firma del archivo, no la extensión).' };
  if (f.mime != d.mime) return { ok: false, error: `El archivo declara ser ${d.mime} pero su contenido es ${f.mime}.` };
  if (!(f.w >= 1 && f.h >= 1)) return { ok: false, error: 'Las dimensiones de la imagen no son válidas.' };
  if (f.w > lim.lado || f.h > lim.lado || f.w * f.h > lim.pixeles) return { ok: false, error: `La imagen mide ${f.w}×${f.h} px y el máximo es ${lim.lado} px por lado (${lim.pixeles / 1e6} millones de píxeles).` };
  return { ok: true, mime: f.mime, w: f.w, h: f.h, bytes: d.bytes.length };
}
function hash53(str) {                    // hash de 53 bits (cyrb53) del contenido
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
const idImagen = uri => 'i_' + hash53(uri).toString(16).padStart(14, '0');
const totalBytesDe = imgs => Object.values(imgs).reduce((n, i) => n + i.bytes, 0);

const R = {
  imgs: {}, modelos: {}, nm: 0,
  limites: { imagen: 5 * MB, total: 50 * MB, lado: 8000, pixeles: 40e6 },
  totalBytes() { return totalBytesDe(this.imgs); },
  vaciar() { this.imgs = {}; this.modelos = {}; this.nm = 0; },
  agregarImagen(uri, nombre = '') {       // importar o pegar: valida formato real, dimensiones y límites; no duplica una imagen repetida
    const v = validarImagen(uri, this.limites); if (!v.ok) return v;
    const id = idImagen(uri), ya = this.imgs[id];
    if (ya) return ya.data === uri ? { ok: true, id, repetida: true } : { ok: false, error: 'Conflicto de identificador de imagen (dos imágenes distintas con el mismo hash).' };
    if (this.totalBytes() + v.bytes > this.limites.total) return { ok: false, error: `Con esta imagen se superaría el máximo de ${+(this.limites.total / MB).toFixed(1)} MB de imágenes por proyecto (hoy hay ${(this.totalBytes() / MB).toFixed(1)} MB).` };
    this.imgs[id] = { mime: v.mime, data: uri, w: v.w, h: v.h, bytes: v.bytes, nombre: String(nombre).slice(0, 100) };
    return { ok: true, id };
  },
  referenciadas(estado) {                 // ids de imágenes y de modelos que usa el proyecto (los modelos usados también aportan su imagen)
    const mod = new Set(), img = new Set();
    (estado.objs || []).forEach(o => { if (o.modelo) mod.add(o.modelo); if (o.img) img.add(o.img); });
    mod.forEach(m => { const x = this.modelos[m]; if (x && x.img) img.add(x.img); });
    return { img, mod };
  },
  paraGuardar(estado) {                   // recursos que se escriben en el archivo: solo los que el proyecto usa (se descartan los demás)
    const u = this.referenciadas(estado), imgs = {}, modelos = {};
    u.img.forEach(i => { if (this.imgs[i]) imgs[i] = this.imgs[i]; }); u.mod.forEach(m => { if (this.modelos[m]) modelos[m] = this.modelos[m]; });
    const t = totalBytesDe(imgs); if (t > this.limites.total) return { error: `Las imágenes del proyecto suman ${(t / MB).toFixed(1)} MB y el máximo es ${+(this.limites.total / MB).toFixed(1)} MB.` };
    return { imgs, modelos };
  },
  fusionar(rec, opc = {}) {               // al abrir: une los recursos del archivo con los actuales. Con {simular:true} solo comprueba, sin cambiar nada
    const nuevos = Object.entries(rec.imgs || {}).filter(([id]) => !this.imgs[id]);
    for (const [id, im] of nuevos) { const v = validarImagen(im.data, this.limites); if (!v.ok) return { ok: false, error: 'Imagen ' + id + ': ' + v.error }; }
    const sumaNuevos = nuevos.reduce((n, [, im]) => n + im.bytes, 0);
    if (this.totalBytes() + sumaNuevos > this.limites.total) return { ok: false, error: `Las imágenes del archivo (${(sumaNuevos / MB).toFixed(1)} MB) superarían el máximo de ${+(this.limites.total / MB).toFixed(1)} MB junto con las ya cargadas (${(this.totalBytes() / MB).toFixed(1)} MB). Empezá un archivo nuevo o abrilo sin otros proyectos cargados.` };
    const mapa = {}; let nm = this.nm; const modelos = {};
    for (const [id, m] of Object.entries(rec.modelos || {})) {
      const ex = this.modelos[id];
      if (!ex || JSON.stringify(ex) === JSON.stringify(m)) { modelos[id] = m; mapa[id] = id; }      // nuevo o idéntico
      else { let nid2; do { nid2 = 'm' + (++nm); } while (this.modelos[nid2] || (rec.modelos || {})[nid2] || modelos[nid2]); modelos[nid2] = m; mapa[id] = nid2; }   // mismo id con otro contenido: se renumera
    }
    for (const m of Object.values(modelos)) if (m.base && mapa[m.base]) m.base = mapa[m.base];
    if (!opc.simular) { nuevos.forEach(([id, im]) => { this.imgs[id] = { ...im }; }); Object.assign(this.modelos, modelos); this.nm = Math.max(nm, this.nm, ...Object.keys(this.modelos).map(k => +k.slice(1) || 0)); }
    return { ok: true, mapa };
  },
  remapEstado(estado, mapa) { (estado.objs || []).forEach(o => { if (o.modelo && mapa[o.modelo]) o.modelo = mapa[o.modelo]; }); }
};
