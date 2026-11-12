// ===== catalogo-pt.js: modelos del catálogo de dispositivos (F4A). SOLO DATOS: la lista la define el usuario (D17). =====
// CATS: subsecciones de la pestaña «Dispositivos». `uno` = nombre en singular: solo las categorías de red lo tienen, y con él su «… Empty»
//       (modelos propios, ver modelos.js); también es el prefijo del nombre de los equipos de un modelo propio. `sub` = subtipo estable de esos equipos; `ic` = icono con que se dibujan.
// PT:   plantillas. `orig` = clave del modelo (igual al nombre de su icono en iconos/); `corto` = línea que se ve bajo el equipo; `pre` = prefijo del
//       nombre automático («Router1»); puertos = grupos {g, n, tipo (medio), vel, pref (nombre visible)}. Al colocar un equipo, su plantilla se copia
//       una sola vez a R.modelos (modelos.js): el proyecto queda completo aunque esta lista cambie.
// Tamaños: medidas reales promedio en metros (SEGUIMIENTO.md, sección 5); ningún equipo nace con su lado mayor menor a 0,30 m (se agranda en proporción).
const CATS = [
  { id: 'routers', t: 'Routers', uno: 'Router', sub: 'router', ic: 'router-2911' }, { id: 'switches', t: 'Switches', uno: 'Switch', sub: 'switch', ic: 'switch-2960-24tt' },
  { id: 'multilayer', t: 'Multilayer switches', uno: 'Multilayer', sub: 'multilayer', ic: 'multilayer-switch-3560-24ps' }, { id: 'inalambricos', t: 'Inalámbricos', uno: 'Inalámbrico', sub: 'inalambrico', ic: 'access-point-pt' },
  { id: 'seguridad', t: 'Seguridad', uno: 'Seguridad', sub: 'firewall', ic: 'isa-3000' }, { id: 'finales', t: 'Dispositivos finales' }, { id: 'iot', t: 'IoT' }, { id: 'otros', t: 'Otros' }
];
const PT = (() => {
  const P = (n, pref, tipo = 'utp', vel) => ({ n, tipo, ...(vel ? { vel } : {}), pref });   // mismo orden de campos que deja esquema.js al abrir un archivo
  const FE = n => P(n, 'FastEthernet', 'utp', '100M'), GE = n => P(n, 'GigabitEthernet', 'utp', '1G');
  const r2 = v => +v.toFixed(2), MIN = .3;
  const M = (orig, cat, nombre, corto, pre, sub, w, h, puertos) => { const k = Math.max(1, MIN / Math.max(w, h)); return { orig, cat, nombre, corto, pre, tipo: 'dispositivo', sub, w: r2(w * k), h: r2(h * k), puertos: puertos.map((p, i) => ({ g: 'g' + i, ...p })), v: 1 }; };
  const pc = () => [P(1, 'RS-232', 'consola'), P(2, 'USB', 'usb'), FE(1)], movil = () => [P(1, 'Wireless0', 'inalambrico'), P(1, '3G/4G Cell1', 'celular'), P(1, 'Bluetooth', 'bluetooth')];
  const iot = (orig, nombre, w, h, corto = nombre) => M('iot-' + orig, 'iot', nombre, corto, 'IoT', 'iot', w, h, [P(1, 'Wireless0', 'inalambrico'), P(1, 'Bluetooth', 'bluetooth')]);
  return [
    M('router-2911', 'routers', 'Router 2911', '2911', 'Router', 'router', .44, .30, [GE(3)]),
    M('switch-2960-24tt', 'switches', 'Switch 2960-24TT', '2960-24TT', 'Switch', 'switch', .45, .24, [FE(24), GE(2)]),
    M('multilayer-switch-3560-24ps', 'multilayer', 'Multilayer Switch 3560-24PS', '3560-24PS', 'Multilayer', 'multilayer', .45, .30, [FE(24), GE(2)]),
    M('access-point-pt', 'inalambricos', 'Access Point-PT', 'AccessPoint-PT', 'AP', 'punto-acceso', .22, .22, [P(1, 'Port0')]),
    M('home-router-pt-ac', 'inalambricos', 'Home Router-PT-AC', 'HomeRouter-PT-AC', 'HomeRouter', 'router-hogar', .23, .16, [P(1, 'Internet'), GE(4)]),
    M('isa-3000', 'seguridad', 'ISA-3000', 'ISA-3000', 'Firewall', 'firewall', .11, .13, [P(1, 'Management1/1'), GE(4)]),
    M('pc-pt', 'finales', 'PC-PT', 'PC-PT', 'PC', 'pc', .50, .45, pc()),
    M('laptop-pt', 'finales', 'Laptop-PT', 'Laptop-PT', 'Laptop', 'laptop', .36, .25, pc()),
    M('server-pt', 'finales', 'Server-PT', 'Server-PT', 'Server', 'servidor', .22, .50, [FE(1)]),
    M('ip-phone-7960', 'finales', 'IP Phone 7960', '7960', 'IPPhone', 'telefono-ip', .27, .21, [P(1, 'Switch'), P(1, 'PC')]),
    M('printer-pt', 'finales', 'Printer-PT', 'Printer-PT', 'Printer', 'impresora', .42, .38, [FE(1)]),
    M('tv-pt', 'finales', 'TV-PT', 'TV-PT', 'TV', 'tv', 1.10, .65, [P(1, 'Port0', 'coaxial')]),
    M('tablet-pt', 'finales', 'TabletPC-PT', 'TabletPC-PT', 'Tablet', 'tablet', .25, .17, movil()),
    M('smartphone-pt', 'finales', 'SmartPhone-PT', 'SmartPhone-PT', 'Smartphone', 'smartphone', .07, .15, movil()),
    iot('aire-acondicionado', 'Aire acondicionado', .60, .40), iot('electrodomestico', 'Electrodoméstico', .20, .25), iot('humidificador', 'Humidificador', .20, .20),
    iot('ventilador', 'Ventilador', 1.20, 1.20), iot('caldera', 'Caldera', .80, .60), iot('termostato', 'Termostato', .12, .09), iot('luz', 'Luz', .06, .11),
    iot('sirena', 'Sirena', .10, .15), iot('parlante-bluetooth', 'Parlante Bluetooth', .10, .18), iot('detector-co2', 'Detector de CO₂', .12, .12),
    iot('detector-co', 'Detector de CO', .12, .12), iot('monitor-humedad', 'Monitor de humedad', .12, .09),
    iot('monitor-humedad-temperatura', 'Monitor de humedad y temperatura', .12, .09, 'Humedad y temp.'), iot('monitor-temperatura', 'Monitor de temperatura', .12, .09, 'Monitor de temp.'),
    iot('detector-humo', 'Detector de humo', .12, .12), iot('detector-movimiento', 'Detector de movimiento', .07, .11, 'Detector de mov.'), iot('smart-tv', 'Smart TV', 1.10, .65),
    (({ sub, ...m }) => ({ ...m, tipo: 'rack' }))(M('rack', 'otros', 'Rack', 'Rack', 'Rack', '', .8, 1, []))   // tipo estable 'rack' (sin sub), mismo tamaño que el rack anterior; su interior llega en la F8
  ];
})();
