// ---------- Reglas superior e izquierda (siempre en metros) ----------
function rulers() {
  const w = $('#work'); [['#rt', 1], ['#rl', 0]].forEach(([s, hor]) => {
    const c = $(s); c.width = hor ? w.clientWidth - 24 : 24; c.height = hor ? 24 : w.clientHeight - 24;
    const x = c.getContext('2d'), len = hor ? c.width : c.height, off = hor ? V.ox : V.oy;
    x.fillStyle = '#e8edef'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#1d2a2f'; x.strokeStyle = '#6b7c83'; x.font = '10px Segoe UI,Arial';
    const sub = pasoGrilla(), n = [2, 5, 10].find(v => v * sub * V.z >= 50) || 10;   // una marca por línea de la grilla (así coinciden) y un número cada n marcas
    for (let i = Math.floor(-off / V.z / sub); ; i++) {
      const m = i * sub, p = m * V.z + off; if (p > len) break; if (p < 0) continue;
      const major = i % n == 0, tk = major ? 12 : 6; x.beginPath();
      if (hor) { x.moveTo(p + .5, 24); x.lineTo(p + .5, 24 - tk); } else { x.moveTo(24, p + .5); x.lineTo(24 - tk, p + .5); } x.stroke();
      if (major) { const t = +m.toFixed(2) + ''; if (hor) x.fillText(t, p + 3, 10); else { x.save(); x.translate(10, p - 3); x.rotate(-Math.PI / 2); x.fillText(t, 0, 0); x.restore(); } }
    }
  });
}
