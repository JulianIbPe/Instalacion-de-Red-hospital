# Seguimiento – Topologias_de_red

Editor web de topologías de red y planos de edificios (HTML + CSS + JavaScript + SVG, sin servidor). Para usarlo: abrir `index.html` en el navegador. Los scripts se cargan en el orden de `index.html` y comparten variables globales.

> **Última actualización: 31/10/2026.** Documento vigente: reemplaza a cualquier copia anterior (incluida `/mnt/project/SEGUIMIENTO.md`).
> **Regla de mantenimiento:** al terminar una fase, o al avanzar dentro de la fase en curso, se actualiza este documento (qué se hizo, resultados reales de las pruebas, qué falta y cuál es el siguiente paso), para poder retomar en otro chat.

## 1. Estado actual

| Fase | Estado |
|---|---|
| F0 Saneamiento y pruebas | Completada (28/10/2026) |
| F1 Renderizado en capas | Completada (28/10/2026) |
| F2 Núcleo de datos (tipos, formato v2, recursos, historial) | **Completada (31/10/2026)**: 31 pruebas aprobadas, 0 fallidas; dibujo idéntico a la referencia; uso manual correcto |
| F3 a F12 | No iniciadas (ver sección 5). Se empieza una fase solo cuando el usuario lo confirme |

Pendientes menores de verificación (no bloquean): abrir un `.json` dañado y comprobar que el proyecto no cambia; deshacer justo después de abrir un archivo; lista de uso manual de la F1 (seleccionar, mover, rotar, cables, paredes, puertas, escaleras, medir, deshacer/rehacer, guardar/abrir).

## 2. Archivos del proyecto

| Ruta | Contenido |
|---|---|
| `index.html` | Barra superior, menú izquierdo, área de trabajo con reglas, panel de plantas, barra de estado y aviso de «Nuevo». Carga condicional de `js/pruebas.js` con `?pruebas=1` |
| `css/` | `base`, `barra`, `menu`, `lienzo`, `plantas`, `dialogo` |
| `js/estado.js` | Estado global (`S`, `V`, `tool`, `sel`, `tmp`, `drag`…) y utilidades (`byId`, `pt`, `toW`, `fmt`, `T`) |
| `js/eventos.js` | Contadores del renderizado (`TR.stats`) para las pruebas. Opcional |
| `js/tipos.js` | Tipo estable por objeto: `tipo` (pared, cable, dispositivo, rack, escalera, ascensor, ventana, puerta, forma, zona, texto, medida) y `sub` (`router`, `utp6`, `circulo`…). `derivarTipo` es el único lugar donde un nombre visible se traduce a tipo. Predicados `esPared`, `esCable`, `esEscalera`, `esAscensor`, `esCirculo`, `claveLinea`. Las escaleras guardan su variante en `o.t` (sin `t` = recta, `descanso`, `espiral`). Ningún módulo decide comportamiento por `o.n` |
| `js/recursos.js` | Almacén `R` fuera de `S` y del historial: `R.imgs` (id por hash; PNG/JPEG/WebP validados por sus bytes; 5 MB por imagen, 50 MB por proyecto, 8 000 px por lado, 40 M de píxeles) y `R.modelos` (plantillas versionadas). Solo el almacén: la interfaz llega en la F4 |
| `js/esquema.js` | Formato v2: `ESQ.leer` (valida, sanea con lista blanca y migra v1 → v2 sin tocar `S` ni `R`) y `ESQ.serializar` (rechaza lo que luego no se podría abrir). **Regla R9:** todo campo nuevo de un objeto se registra en `ESPEC`; si no, se pierde al abrir |
| `js/catalogo.js` | Catálogo del menú izquierdo (`CAT`), `SH` (vértices de formas por subtipo), `menu()`, `setTool()` |
| `js/dibujo.js` | `draw()` por objeto y render en capas: `#vp` > `#g-grilla`, `#c` (objetos; lo que exporta el PNG), `#g-tmp` (lo temporal). `render()` (completo, síncrono), `repintarMovimiento()` (al mover el ratón solo se redibuja lo que cambió), `status()` |
| `js/historial.js` | Deshacer, rehacer, borrar. Interfaz `Hist` con estrategia intercambiable (hoy snapshots de `S`, tope de 100 pasos y 50 M de caracteres, sin duplicar pasos idénticos) |
| `js/archivos.js` | Guardar y abrir `.json` v2 (`abrirTexto` no toca nada si el archivo es inválido y restaura el proyecto ante un fallo inesperado), exportar PNG (`construirSvgExport`), «Nuevo» |
| `js/controles.js` | Teclado (G, F, H, M, R, Enter, Esc, Supr/Retroceso —no actúan con un botón enfocado—, Ctrl+Z/Y), color, relleno, tipo de línea, grilla, imán medio, tamaño del edificio, unidad |
| `js/interaccion.js` | Ratón: colocar, mover, dibujar, medir, zoom, desplazar; doble clic detectado a mano (flecha de escalera o ascensor cambia de planta; en otro objeto, etiqueta); clic derecho cancela o termina la operación en curso; `add()` asigna el tipo |
| `js/plantas.js` | Plantas y capas (ocultar, bloquear, jerarquía con ▲ ▼ o arrastrando ⠿), `esVisible`/`esEditable`, `normalizar()` |
| `js/colocar.js` | Escaleras y formas con dos puntos (esquinas opuestas; círculo y espiral = centro y radio) |
| `js/escaleras.js` | Escalera recta, con descanso y espiral; reflejo de la planta de abajo y reglas de colocación entre plantas; cables que cruzan escaleras de otras plantas; cambio de planta desde la flecha |
| `js/formas.js`, `js/puertas.js`, `js/rotacion.js`, `js/seleccion.js` | Formas (8 asas, lados, vértices, medidas), puertas sobre paredes, rotación (asa ↻ o R), selección múltiple y por rectángulo |
| `js/iman.js`, `js/nodos.js`, `js/medidas.js`, `js/reglas.js`, `js/rejilla.js` | Imanes (puntas, centros, puntos medios), nodos de líneas del mismo tipo, cotas, reglas en metros y grilla |
| `js/main.js` | Arranque (se carga el último) |
| `js/pruebas.js` | Con `?pruebas=1`: panel con 31 pruebas, 6 proyectos de prueba (+ uno de estrés), referencia de dibujo (se guarda en `localStorage` con la versión base; se compara con la nueva) y medición de rendimiento |

## 3. Decisiones aprobadas

| N.º | Decisión |
|---|---|
| D1 | **Conexiones lógicas ligadas a la ruta física.** `S.conex`: cada conexión guarda origen y destino `{d: dispositivo, p: puerto}` y la lista ordenada `rutas` de líneas. La línea es solo geometría. La conexión conserva su `id` aunque cambie el recorrido. Todo cable dibujado tiene una conexión; las que tienen extremos sin definir se guardan como **incompletas** y no cuentan como completas. Los tramos entre plantas se unen a la conexión existente, sin duplicar |
| D2 | **Jerarquía.** Campo `parent`. Hijos con posición absoluta sincronizada (`x`, `y`, `rot`) más posición local (`lx`, `ly`, `lrot`) para mesas, o `ru:{u,h}` para racks. El hijo hereda `pl` y `cp` del padre |
| D3 | **Recursos fuera del historial.** Almacén `R` (imágenes por hash y modelos); se guarda con el proyecto; los recursos sin uso se descartan al guardar |
| D4 | **Historial.** Snapshots de `S` con tope en pasos y en bytes; estrategia intercambiable |
| D5 | **Vista de rack.** Modal con su propio SVG sobre el mismo `S` (usa `push()`, deshacer/rehacer y atajos globales) |
| D6 | **Formato v2** con validación por lista blanca y migración automática desde v1 (hecho) |
| D7 | **Renderizado** en capas independientes, sin framework (hecho) |
| D8 | **Inspector:** aside derecho con secciones contraíbles; `#plantas` se conserva |
| D9 | **Menú contextual:** clic derecho solo sin herramienta activa ni operación en curso. Cada fase registra sus propias entradas por tipo |
| D10 | **Filtros:** estado visual `F` fuera de `S` y del historial; ocultar / atenuar / aislar; no tocan `esVisible`, imanes, conexiones ni presupuesto; se aplican **sobre** lo ya visible por planta y capa y se quitan con «Mostrar todo». Las redes/VLAN son lógicas y no se mezclan con las capas del editor |
| D11 | **Longitud de cables:** ruta completa + tramos verticales por altura de plantas + holgura configurable. Se distingue la longitud medida de la estimación de instalación |
| D12 | **Presupuesto:** precios por modelo y por metro de cable, moneda, cantidades y holgura; CSV primero (separador `;`, BOM UTF-8, coma decimal) |
| D13 | **Zonas y rellenos:** zonas rectangulares por dos puntos con imán a esquinas y extremos de paredes; rellenos sólidos y patrones predefinidos. Detección de habitaciones cerradas: estudio (F12) |
| D14 | **Tipo estable** (`tipo`, `sub`) en cada objeto (hecho) |
| D15 | **Escaleras con color desvanecido:** NO implementado (el reflejo de abajo usa opacidad fija .6). Se hará solo al final |
| D16 | **Color del cable:** no se puede cambiar desde ningún lugar (panel de superposición, menú contextual ni selector de color del menú izquierdo). Cada cable usa siempre el color de su tipo. Los archivos antiguos conservan el color con que se guardaron. Las paredes siguen siendo coloreables |
| D17 | **Catálogo de dispositivos:** incluye todos los dispositivos de la última versión de Packet Tracer, definidos como datos (modelos con plantilla de puertos) y no como código. Los componentes IoT se incluyen todos: si el usuario aporta imágenes de Packet Tracer se usan; si no, se generan iconos SVG propios |
| D18 | **Mesas:** un solo tipo de mesa, con tamaño y cantidad de puestos editables y sin cambio de color (ver F6) |
| D20 | **Exportar el rack:** el interior de un rack se exporta a PNG solo desde dentro de su vista, con un botón propio. El PNG del plano no incluye el interior |
| D19 | **Rellenos:** solo patrones predefinidos. No se añade edición de grosor, espaciado, colores del patrón, orientación ni transparencia |

## 4. Arquitectura

- **`S`** (proyecto; entra en el historial): `edificio`, `unidad`, `plantas`, `objs`, y desde las fases siguientes `conex`, `redes`, `presupuesto`.
- **`R`** (recursos; fuera del historial): `imgs` y `modelos`. Los puertos predeterminados vienen de la plantilla del modelo (grupos `{g, n, tipo, vel, pref}`); la instancia solo guarda sobrescrituras (`po`) e interfaces (`ifs`). Los ids de puerto son `grupo:índice` (p. ej. `g0:12`). Editar una plantilla crea una versión nueva; actualizar las instancias es explícito, confirmado y deshacible.
- **Estado de interfaz** (fuera de `S` y de `R`): `V`, `sel`, `multi`, `tool`, `tmp`, `drag`, filtros `F`, estado del inspector y del menú contextual.
- **Campos nuevos por objeto:** dispositivo `modelo`, `img`, `po`, `ifs`, `parent`, `lx`, `ly`, `lrot`, `ru`, fabricante, descripción, precio y moneda. Conexión `{id, a:{d,p}|null, b:{d,p}|null, rutas, sub, red, etqA, etqB, holgura}`; sin ruta = conexión lógica con longitud estimada.
- **Identidad:** un equipo es siempre el mismo objeto (en el plano, en una mesa o en un rack). El `ref` de un extremo de línea es solo anclaje geométrico y se sincroniza con funciones explícitas.

**Reglas de coherencia**

| Regla | Evita |
|---|---|
| R1. Todo cambio de `S` llama antes a `push()`. `R`, filtros, vista, selección e inspector nunca se mutan dentro de `S` | Deshacer que borra recursos o filtros |
| R2. Los snapshots solo serializan `S`; las imágenes se guardan por hash en `R` | Snapshots enormes |
| R3. Tras restaurar, abrir o «Nuevo»: `normalizar` → índices de conexiones → sincronización de hijos → paneles | Paneles o índices desactualizados |
| R4. `esVisible`/`esEditable` son la única puerta de planta y capa (también excluyen los hijos de racks). Los filtros no los usan | Filtros que alteran imanes o selección |
| R5. Los hijos heredan `pl`/`cp` del padre | Hijos huérfanos en otra capa |
| R6. Mover o rotar un contenedor sincroniza hijos; mover un hijo recalcula su posición local; soltarlo fuera lo desancla. En multiselección no se mueve un hijo cuyo padre ya está seleccionado | Doble movimiento |
| R7. Borrar un contenedor borra sus hijos y las conexiones que los referencian. Borrar un dispositivo conserva sus cables como líneas libres y deja el extremo de la conexión en `null` | Referencias colgantes |
| R8. Borrar una línea la quita de `rutas`; si era la última, la conexión queda «sin ruta» | Pérdida silenciosa de conexiones |
| R9. Todo campo nuevo se registra en `esquema.js`; la prueba de ida y vuelta falla si un campo se pierde | Datos descartados en silencio |
| R10. El modal del rack comparte `S` y el historial global; cerrarlo no toca `V`, `sel` ni `tool` | Estados divergentes |

## 5. Plan de fases (reordenado por dependencias)

Cada fase deja la aplicación usable y no elimina funciones. Cada fase nueva que añada campos los registra en `ESPEC` (R9) y suma sus entradas al menú contextual. Antes de cada fase se informan archivos y pruebas; al cerrarla se actualiza este documento.

| Fase | Contenido | Depende de |
|---|---|---|
| F3 | Inspector y menú contextual (base) | F2 |
| F4 | Catálogo (Packet Tracer), imágenes y modelos | F2, F3 |
| F5 | Rellenos y zonas | F2 |
| F6 | Jerarquía y mesas | F2, F3, F4 |
| F7 | Puertos, conexiones y redes | F4, F6 |
| F8 | Racks | F6, F7 |
| F9 | Longitud de cables y presupuesto | F4, F7, F8 |
| F10 | Cables superpuestos, aislar cable y filtros | F7, F9 |
| F11 | Pruebas integrales y documentación | Todas |
| F12 | Estudios y ampliaciones futuras | F11 |

**Qué cambió de orden y por qué:** los filtros pasan a la F10 porque filtran por red, cable y conexión (que existen desde la F7) y no deben alterar el presupuesto (F9); los racks pasan después de los puertos porque su modal permite elegir y conectar puertos; las mesas van después del catálogo porque necesitan los equipos que se colocan encima; el menú contextual arranca genérico en la F3 y cada fase le agrega sus entradas.

### F3 — Inspector y menú contextual (base)
Archivos: `index.html`, `interaccion.js`, `controles.js`, `plantas.js`, CSS; nuevos `inspector.js`, `contexto.js`, `inspector.css`, `contexto.css`.
1. El inspector no pierde el foco ni su texto durante 100 movimientos del ratón; secciones contraíbles; en pantalla estrecha pasa a cajón.
2. Clic derecho con herramienta de cable/pared/forma activa o con una operación en curso conserva el comportamiento actual (cancelar o terminar); con Seleccionar abre el menú adaptado al tipo (varios objetos: acciones comunes).
3. Acciones generales: color, dimensiones, relleno, contorno, nombre, etiqueta, rotación, **duplicar** y eliminar, según el tipo. El menú de un cable no ofrece cambio de color y el de una mesa tampoco (D16, D18). El selector de color del menú izquierdo deja de afectar a los cables (también al dibujarlos: usan el color de su tipo).
4. Duplicar crea una copia con id nuevo, en la misma planta y capa y levemente desplazada; no copia conexiones ni hijos.
5. El menú respeta las capas ocultas y bloqueadas (acciones deshabilitadas).
6. Cada acción es un solo paso de historial y no interfiere con la creación de cables, el arrastre, la selección múltiple ni el zoom; los atajos (Esc, G, F, H, M, R, Enter, Supr, Ctrl+Z/Y) funcionan igual.
7. Tabla de acciones por tipo, extensible por las fases siguientes.

### F4 — Catálogo (Packet Tracer), imágenes y modelos
Archivos: `catalogo.js`, `dibujo.js`, `archivos.js`, `recursos.js`, `inspector.js`.
1. El catálogo incluye todos los dispositivos de la última versión de Packet Tracer (routers, switches, hubs, dispositivos inalámbricos, seguridad, PCs, laptops, servidores, impresoras, teléfonos, tablets, smartphones, nube/WAN, componentes, etc.), organizados por categorías y subcategorías, con búsqueda. Además: notebook, monitor y patch panel si no vienen en esa lista. Incluye los componentes IoT. Las imágenes de Packet Tracer las aporta el usuario si quiere (se importan como imágenes del proyecto); todo dispositivo sin imagen aportada, IoT incluido, usa un icono SVG propio generado para el proyecto.
2. Cada dispositivo es un modelo de `R` con plantilla (dimensiones, icono o imagen, grupos de puertos); el catálogo actual sigue funcionando.
3. Datos por dispositivo: fabricante, modelo, descripción, precio unitario, moneda y cantidad (se editan aquí; se calculan en la F9).
4. Importar PNG/JPEG/WebP (sin SVG), con tope de tamaño; un dispositivo usa imagen o icono; se pueden editar su posición, tamaño, rotación, nombre y propiedades.
5. Alta, edición y baja de modelos con aviso de cuántas instancias se afectan; actualizar instancias es explícito, confirmado y deshacible.
6. El PNG exportado muestra las imágenes; guardar y abrir conserva imágenes y modelos; ningún snapshot contiene `data:image`.
7. El menú no se reconstruye al mover el ratón; con cientos de modelos sigue siendo ágil.

### F5 — Rellenos y zonas
Archivos: `dibujo.js`, `controles.js`, `index.html`, `colocar.js`, `interaccion.js`, `nodos.js`, `iman.js`; nuevo `zonas.js`.
1. Al menos 6 patrones predefinidos además del sólido y la diagonal, con definiciones compartidas por patrón y color. Sin edición de grosor, espaciado, colores del patrón, orientación ni transparencia (D19).
2. Herramienta de relleno con un clic sobre una forma o zona existente.
3. Los archivos con relleno `hat` se ven igual que antes.
4. Zonas rectangulares por dos puntos (clic-clic o arrastrar) con imán a esquinas y extremos de paredes; las zonas elípticas siguen funcionando; la edición de vértices, lados, rotación, selección múltiple e historial se conservan.
5. Ida y vuelta de archivo. El relleno automático de recintos cerrados por paredes queda en la F12.

### F6 — Jerarquía y mesas
Archivos: `interaccion.js`, `historial.js`, `rotacion.js`, `dibujo.js`, `plantas.js`, `catalogo.js`; nuevo `jerarquia.js`.
1. **Una sola mesa.** Tamaño y cantidad de puestos configurables, además de nombre y etiqueta. Su color no se puede cambiar.
2. Cada puesto mide como mínimo 0,50 m: el largo mínimo de la mesa es puestos × 0,50 m (con 2 puestos, 1,00 m). Al subir los puestos la mesa crece hasta ese mínimo y no se puede achicar por debajo.
3. Un equipo ocupa un puesto. Al redimensionar la mesa los puestos se redistribuyen en partes iguales y cada equipo sigue en su puesto. No se pueden reducir los puestos por debajo de los ocupados (se avisa).
4. Los equipos que están sobre una mesa se dibujan **por encima** de ella.
5. Mover y rotar una mesa mueve y rota sus equipos; soltar un equipo sobre una mesa lo ancla y fuera de ella lo desancla.
6. Los hijos heredan planta y capa; borrar la mesa borra sus equipos; un cable a un equipo se une al equipo, no a la mesa.
7. La asociación mesa-equipo es solo visual y se distingue de una conexión de red.
8. Deshacer y rehacer restituyen anclajes.

### F7 — Puertos, conexiones y redes
Archivos: `estado.js`, `interaccion.js`, `historial.js`, `plantas.js`, `catalogo.js`, `controles.js`, `esquema.js`; nuevos `conexiones.js`, `redes.js`.
1. `S.conex` según D1; cada puerto con id único, tipo, estado y propiedades; los cables incompletos se ven distintos de los terminados.
2. Conectar desde el plano pide el puerto cuando el dispositivo los tiene; clic derecho sobre un dispositivo muestra sus interfaces y permite modificar conexiones (entrada del menú contextual).
3. Mover un vértice o redibujar la ruta no cambia el `id` de la conexión; al mover un dispositivo (o su mesa) los cables conservan sus extremos y actualizan la geometría; mover un extremo a otro dispositivo limpia el puerto.
4. Gestión de **redes/VLAN/subredes** (alta, baja, nombre, color de la red), separada de las capas del editor.
5. Etiquetas físicas pequeñas junto a cada puerto de routers, switches y patch panels (destino, equipo remoto, planta, sala, VLAN), activables y exportables en el PNG.
6. Borrar un dispositivo o una conexión aplica R7 y R8.
7. Los archivos v1 migran con una conexión por cada cable; `cableAOtraPlanta` vincula los tramos de una misma conexión.
8. Menú contextual del cable: tipo y extremos (sin color; la longitud se añade en la F9).
9. Bloqueo del color de los cables en `controles.js` y en la creación de cables (D16).

### F8 — Racks
Archivos: `interaccion.js`, `controles.js`, `index.html`; nuevos `rack.js`, `vistarack.js`, `rack.css`.
1. El rack admite equipos por unidades, rechaza solapes y excesos de altura.
2. Se puede arrastrar un equipo del plano hacia el rack para instalarlo; sigue siendo el mismo objeto (conserva identidad, puertos y conexiones) y deja de verse suelto en el plano.
3. Doble clic en un rack abre el modal y se vuelve al plano con vista, selección y herramienta intactas (R10).
4. En el modal se pueden seleccionar, editar y conectar puertos, ver las etiquetas físicas y editar propiedades de los equipos instalados.
5. Ctrl+Z / Ctrl+Y funcionan con el modal abierto; borrar un rack o un equipo aplica R7.
6. Menú contextual del rack con opciones de montaje; la etiqueta de un rack se edita desde el menú o el inspector (el doble clic abre el modal).
7. Dentro de la vista del rack hay un botón «PNG» que exporta su interior (equipos, puertos y etiquetas). El PNG del plano no incluye el interior (D20).

### F9 — Longitud de cables y presupuesto
Archivos: `escaleras.js`, `plantas.js`, `inspector.js`, `archivos.js`; nuevos `cables.js`, `presupuesto.js`.
1. Longitud = horizontal de todas las rutas + vertical por altura de las plantas atravesadas + holgura; prueba con cifras conocidas; se muestra por cable (también en su menú contextual) y en total.
2. Se distingue la longitud medida de la estimación de instalación; los cables sin ruta aparecen como «estimada».
3. Precio por metro de cada tipo de cable; opción de incluir el costo de cable en el presupuesto general o mostrar solo metros y costo.
4. Subtotales por modelo y por categoría, total de dispositivos y total general.
5. Los objetos sin precio se marcan «pendiente de cotización» y no cuentan como gratuitos.
6. Monedas distintas no se suman sin conversión explícita.
7. No se cuenta dos veces un equipo instalado en un rack, puesto sobre una mesa o agrupado visualmente.
8. Exportar CSV (`;`, BOM UTF-8, coma decimal, números como datos); verificar la apertura en Excel en español. PDF y XLSX quedan para la F12.

### F10 — Cables superpuestos, aislar cable y filtros
Archivos: `dibujo.js`, `interaccion.js`, `inspector.js`; nuevos `superposicion.js`, `filtros.js`.
1. Al mantener el cursor unos instantes sobre cables superpuestos aparece un panel flotante con los cables detectados; el panel sigue abierto cuando el cursor pasa de los cables al panel y no bloquea otras herramientas.
2. Desde el panel: seleccionar un cable, consultar sus extremos y destacar su recorrido. **No** permite cambiar el color (D16).
3. Detección: agrupa tramos colineales que comparten longitud (no cuenta cruces ni extremos que se tocan).
4. Mostrar solo un cable seleccionado junto con los equipos necesarios para entender su conexión.
5. Filtros por dispositivo, tipo de equipo, cable, red y capa: ocultar, atenuar o aislar, sin borrar datos ni romper conexiones.
6. Los filtros se aplican sobre lo visible por planta y capa; «Mostrar todo» recupera la vista completa.
7. Aplicar cualquier filtro deja `JSON.stringify(S)`, el historial, los imanes y el presupuesto idénticos.
8. Con el filtro desactivado, la salida de `#c` es idéntica a la anterior.

### F11 — Pruebas integrales y documentación
1. Regresión de todas las fases (`?pruebas=1`) y prueba de ida y vuelta con un proyecto «maestro» que use todos los campos (R9).
2. Comprobación manual de todas las herramientas y de los archivos antiguos v1.
3. Nueva medición de rendimiento con el proyecto de estrés.
4. Limitaciones reales documentadas, este documento actualizado y entrega de la versión completa.

### F12 — Estudios y ampliaciones futuras
Detección de habitaciones cerradas y relleno de recintos con un clic, historial por parches, exportación a PDF y XLSX, y desvanecimiento de las escaleras (D15).

## 6. Decisiones confirmadas (31/10/2026) y pendientes

Confirmadas: Packet Tracer en su última versión con IoT incluido (iconos SVG propios si no hay imágenes aportadas); mesa con ancho mínimo 0,50 m, puestos como en la F6 y sin cambio de color; color de cable bloqueado también en el menú izquierdo; duplicar sin conexiones ni hijos; exportar el interior del rack solo desde su vista.

Pendiente (se resuelve al diseñar la F4): número exacto de la última versión de Packet Tracer (se consultará en la web) y si el usuario aporta imágenes de sus dispositivos. Esas imágenes son material de Cisco: su uso queda bajo responsabilidad del usuario y no se incluyen en el proyecto entregado; los iconos generados son de diseño propio.

## 7. Riesgos

| Gravedad | Riesgo | Mitigación |
|---|---|---|
| Alta | Pérdida silenciosa de campos por la lista blanca de `esquema.js` | R9 y prueba de ida y vuelta |
| Alta | Catálogo con cientos de modelos: menú lento y proyectos pesados | Modelos como datos en `R`, búsqueda, snapshots sin recursos |
| Media | Plantillas editadas después de usarse | Plantillas versionadas; actualizar es explícito y deshacible |
| Media | Doble dirección línea ↔ conexión | Funciones explícitas de sincronización y pruebas |
| Media | `cableAOtraPlanta` crea hoy dos objetos sin vínculo | Se vincula en la F7 |
| Media | El doble clic en un rack deja de poner etiqueta | La etiqueta pasa al menú contextual y al inspector |
| Baja | Atajos F, H, M, G, R ya ocupados | Los comandos nuevos van por menú contextual e inspector |
| Baja | Nombres globales de una letra (`I`, `L`, `T`, `S`, `V`) | El código nuevo usa el namespace `TR` |

## 8. Reglas de trabajo

- Responder en español (Argentina, voseo), claro y breve, con tablas y listas cuando ayuden.
- Una fase por vez. Antes: indicar archivos y pruebas. Al terminar: informar lo implementado y los resultados **reales** de las pruebas, separando las simuladas (Node) de las que hace el usuario en su navegador, e indicar qué debe hacer él. Nunca afirmar que una prueba pasó si no se ejecutó.
- No avanzar a una fase que dependa de otra sin verificar la anterior.
- Entregar archivos completos con su ruta exacta; preferir **parches de texto** sobre los archivos reales a reescribir módulos. Indicar qué reemplazar y qué respaldo conservar.
- No reescribir la aplicación, no cambiar de tecnología sin justificación, conservar las funciones existentes, no duplicar lógica ni manejadores de eventos, no cambiar el orden de carga sin necesidad. Si hay una incompatibilidad real, explicarla antes.
- Mantener compatibilidad con proyectos antiguos, historial y archivos; actualizar este documento en cada avance.
- Si una función requiere una decisión de diseño importante, presentar alternativas y consecuencias antes de elegir.

## 9. Cómo retomar en otro chat

Adjuntar la carpeta `Topologias_de_red` completa (`.zip`). Leer este documento (secciones 1, 3, 5 y 8). Estado: F0, F1 y F2 completadas y verificadas en el navegador del usuario. Siguiente: **F3**. Antes de escribir código, presentar el diseño detallado (archivos a modificar o crear, criterios de la sección 5, pruebas) y esperar confirmación. Al terminar, separar pruebas simuladas y manuales, trabajar con parches y actualizar este documento.

## 10. Registro de cambios

- 27–28/10/2026: auditoría, decisiones D1–D15, fases F0 y F1 completadas; F2A entregada y verificada.
- 31/10/2026: F2B aplicada con parches y verificada (31 pruebas, 0 fallidas, dibujo idéntico); F2 completada.
- 31/10/2026: decisiones confirmadas por el usuario (sección 6): color de cable bloqueado en todas partes, mesa sin color, exportación del interior del rack desde su vista, Packet Tracer última versión con IoT incluido (iconos propios si faltan imágenes).
- 31/10/2026: documento simplificado. Plan de fases reordenado por dependencias (F3 a F12). Nuevos criterios: catálogo con todos los dispositivos de Packet Tracer; una sola mesa con puestos de 50 cm mínimo y equipos dibujados encima; rellenos sin edición de patrón; sin cambio de color del cable en las pantallas nuevas; duplicar, redes/VLAN, etiquetas por puerto, presupuesto con pendientes, monedas y doble conteo, panel de superposición, filtros combinados con plantas y capas, y fase final de pruebas integrales.
