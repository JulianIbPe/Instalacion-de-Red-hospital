// Regenera js/iconos.js a partir de los SVG de esta carpeta. Uso (desde Topologias_de_red): node iconos/generar.js
// El PNG exportado no puede cargar archivos externos: por eso los dibujos viajan dentro de js/iconos.js.
const fs = require('fs'), path = require('path');
const out = {};
for (const f of fs.readdirSync(__dirname).filter(f => f.endsWith('.svg')).sort()) {
  const m = /^<svg[^>]*viewBox="0 0 96 96"[^>]*>([\s\S]*)<\/svg>\s*$/.exec(fs.readFileSync(path.join(__dirname, f), 'utf8').trim());
  if (!m) throw new Error(f + ': se esperaba un <svg> con viewBox="0 0 96 96"');
  if (/<script|<style|href|\bid=|\bon\w+=/i.test(m[1])) throw new Error(f + ': no se admiten scripts, estilos, enlaces ni ids dentro del icono');
  out[f.slice(0, -4)] = m[1];
}
fs.writeFileSync(path.join(__dirname, '..', 'js', 'iconos.js'),
  '// ===== iconos.js: dibujos de los modelos (F4A). GENERADO por iconos/generar.js a partir de iconos/*.svg: no editar a mano. =====\n'
  + '// Cada valor es el interior de un <svg viewBox="0 0 96 96">. La clave es el nombre del archivo y coincide con `orig` del modelo (catalogo-pt.js).\n'
  + 'const ICONOS = ' + JSON.stringify(out, null, 1) + ';\n');
console.log(Object.keys(out).length + ' iconos escritos en js/iconos.js');
