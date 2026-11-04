# Seguimiento – Topologias_de_red

Editor web de topologías de red y planos de edificios (HTML + CSS + JavaScript + SVG, sin servidor). Para usarlo: abrir `index.html` en el navegador. Los scripts se cargan en el orden de `index.html` y comparten variables globales.

> **Última actualización: 01/11/2026.** Documento vigente: reemplaza a cualquier copia anterior (incluida `/mnt/project/SEGUIMIENTO.md`).
> **Regla de mantenimiento:** al terminar una fase, o al avanzar dentro de la fase en curso, se actualiza este documento (qué se hizo, resultados reales de las pruebas, qué falta y cuál es el siguiente paso), para poder retomar en otro chat.

## 1. Estado actual

| Fase | Estado |
|---|---|
| F0 Saneamiento y pruebas | Completada (28/10/2026) |
| F1 Renderizado en capas | Completada (28/10/2026) |
| F2 Núcleo de datos (tipos, formato v2, recursos, historial) | **Completada (31/10/2026)**: 31 pruebas aprobadas, 0 fallidas; dibujo idéntico a la referencia; uso manual correcto |
| F3 Inspector y menú contextual (base) | **Completada (01/11/2026)**; ajuste posterior del menú contextual (cortar/copiar/pegar, menú del fondo) hecho el mismo día y **pendiente de verificación manual**. Segundo ajuste (01/11/2026): **cable único que atraviesa escaleras entre plantas** (D21), implementado y **pendiente de verificación manual** (ver sección 11). Antes de los ajustes: 46 pruebas aprobadas, 0 fallidas, dibujo idéntico a la referencia, rendimiento sin regresión; comprobaciones manuales del usuario correctas (ver sección 11) |
| F4 a F12 | No iniciadas (ver sección 5). Siguiente: **F4**. Se empieza una fase solo cuando el usuario lo confirme |

Pendientes menores de verificación (no bloquean): abrir un `.json` dañado y comprobar que el proyecto no cambia; deshacer justo después de abrir un archivo; lista de uso manual de la F1 (seleccionar, mover, rotar, cables, paredes, puertas, escaleras, medir, deshacer/rehacer, guardar/abrir).

## 2. Archivos del proyecto

| Ruta | Contenido |
|---|---|
| `index.html` | Barra superior, menú izquierdo, área de trabajo con reglas, panel de plantas, barra de estado y aviso de «Nuevo». Carga condicional de `js/pruebas.js` con `?pruebas=1` |
| `css/` | `base`, `barra`, `menu`, `lienzo`, `plantas`, `dialogo`, `inspector` (F3), `contexto` (F3) |
| `js/estado.js` | Estado global (`S`, `V`, `tool`, `sel`, `tmp`, `drag`…) y utilidades (`byId`, `pt`, `toW`, `fmt`, `T`) |
| `js/eventos.js` | Namespace `TR`: contadores del renderizado (`TR.stats`, sin cambios) y `TR.ui` (F3: reconstrucciones y actualizaciones del inspector, aperturas del menú). **Obligatorio desde la F3** (aloja `TR.acc`, `TR.insp`, `TR.ctx`) |
| `js/acciones.js` (F3) | `TR.acc`: registro único de **campos** (`registrarCampo`) y **acciones** (`registrar`) por tipo, usado por el inspector y el menú. `TR.acc.fijar(ids, campo, valor, gesto)` cambia un campo con un solo paso de historial y valida (rangos, objetos editables, escaleras contra la planta de abajo). También `rotar`, `copiar`, `cortar`, `pegar` (portapapeles interno), `eliminar`, `ejecutar`, `paraMenu`, `paraInspector`, `sinColor` (la mesa de la F6 se agrega ahí, D18) y `sincronizarColor` (D16) |
| `js/inspector.js` (F3) | `TR.insp`: panel derecho `#insp` con secciones contraíbles (Objeto, Posición y tamaño, Apariencia, Acciones). Solo reconstruye su DOM si cambia la firma de la selección; si no, actualiza valores en sitio sin tocar el campo enfocado. Se refresca desde `renderPaneles()`, nunca al mover el ratón. Confirma con `change` o al pulsar fuera (antes de que el plano cambie la selección). Botón ⚙️ de la barra; en ≤760 px es un cajón |
| `js/trazas.js` (F3, ajuste 2) | Cable único que atraviesa escaleras: helpers de planta/capa por punto (`plantaDe`, `puntoEn`, `esMultiplanta`…), geometría del recorrido (`trazaEscalera`: recta, con descanso y espiral, dos mitades con el punto medio repetido), `escaleraEn` (clic por geometría), `menuEscalera` / `cruzarEscalera`, `sincronizarTrazas` (el recorrido sigue a la escalera), `soltarTrazasHuerfanas`, `podarCables` (borrar planta o capa), `segmentosEnPlanta` y `dibujarCableMP` (sólido en su planta, translúcido el otro medio) |
| `js/contexto.js` (F3) | `TR.ctx`: menú contextual `#ctx` (clic derecho, solo sin herramienta ni operación en curso ; sobre un objeto editable: cortar, copiar, pegar, eliminar y las acciones de su tipo; en el fondo vacío o sobre algo no editable: volver atrás, adelante y pegar). Teclado: flechas, Home/End, Enter, Esc, Tab |
| `js/tipos.js` | Tipo estable por objeto: `tipo` (pared, cable, dispositivo, rack, escalera, ascensor, ventana, puerta, forma, zona, texto, medida) y `sub` (`router`, `utp6`, `circulo`…). `derivarTipo` es el único lugar donde un nombre visible se traduce a tipo. Predicados `esPared`, `esCable`, `esEscalera`, `esAscensor`, `esCirculo`, `claveLinea`. Las escaleras guardan su variante en `o.t` (sin `t` = recta, `descanso`, `espiral`). Ningún módulo decide comportamiento por `o.n` |
| `js/recursos.js` | Almacén `R` fuera de `S` y del historial: `R.imgs` (id por hash; PNG/JPEG/WebP validados por sus bytes; 5 MB por imagen, 50 MB por proyecto, 8 000 px por lado, 40 M de píxeles) y `R.modelos` (plantillas versionadas). Solo el almacén: la interfaz llega en la F4 |
| `js/esquema.js` | Formato v2: `ESQ.leer` (valida, sanea con lista blanca y migra v1 → v2 sin tocar `S` ni `R`) y `ESQ.serializar` (rechaza lo que luego no se podría abrir). **Regla R9:** todo campo nuevo de un objeto se registra en `ESPEC`; si no, se pierde al abrir |
| `js/catalogo.js` | Catálogo del menú izquierdo (`CAT`), `SH` (vértices de formas por subtipo), `menu()`, `setTool()` |
| `js/dibujo.js` | `draw()` por objeto y render en capas: `#vp` > `#g-grilla`, `#c` (objetos; lo que exporta el PNG), `#g-tmp` (lo temporal). `render()` (completo, síncrono), `repintarMovimiento()` (al mover el ratón solo se redibuja lo que cambió), `status()` |
| `js/historial.js` | Deshacer, rehacer, borrar. Interfaz `Hist` con estrategia intercambiable (hoy snapshots de `S`, tope de 100 pasos y 50 M de caracteres, sin duplicar pasos idénticos) |
| `js/archivos.js` | Guardar y abrir `.json` v2 (`abrirTexto` no toca nada si el archivo es inválido y restaura el proyecto ante un fallo inesperado), exportar PNG (`construirSvgExport`), «Nuevo» |
| `js/controles.js` | Teclado (G, F, H, M, R, Ctrl+C/X/V, Enter, Esc, Supr/Retroceso —no actúan con botón, resumen, checkbox o color enfocados; se ignora TEXTAREA—, Ctrl+Z/Y; con el menú contextual abierto solo flechas, Enter, Esc y Tab), color / relleno / tipo de línea (usan `TR.acc.fijar`; el color no afecta a los cables), grilla, imán medio, tamaño del edificio, unidad |
| `js/interaccion.js` | Ratón: colocar, mover, dibujar, medir, zoom, desplazar; doble clic detectado a mano (flecha de escalera o ascensor cambia de planta; en otro objeto, etiqueta); clic derecho cancela o termina la operación en curso y, sin herramienta ni operación, abre el menú contextual (F3); `add()` asigna el tipo; un cable usa el color de su tipo (`tool.c`) |
| `js/plantas.js` | Plantas y capas (ocultar, bloquear, jerarquía con ▲ ▼ o arrastrando ⠿), `esVisible`/`esEditable`, `normalizar()` |
| `js/colocar.js` | Escaleras y formas con dos puntos (esquinas opuestas; círculo y espiral = centro y radio) |
| `js/escaleras.js` | Escalera recta, con descanso y espiral; reflejo de la planta de abajo y reglas de colocación entre plantas; cables que cruzan escaleras de otras plantas; cambio de planta desde la flecha |
| `js/formas.js`, `js/puertas.js`, `js/rotacion.js`, `js/seleccion.js` | Formas (8 asas, lados, vértices, medidas), puertas sobre paredes, rotación (asa ↻ o R), selección múltiple y por rectángulo |
| `js/iman.js`, `js/nodos.js`, `js/medidas.js`, `js/reglas.js`, `js/rejilla.js` | Imanes (puntas, centros, puntos medios), nodos de líneas del mismo tipo, cotas, reglas en metros y grilla |
| `js/main.js` | Arranque (se carga el último) |
| `js/pruebas.js` | Con `?pruebas=1`: panel con 61 pruebas (31 de F0 a F2B + 30 de la F3), 6 proyectos de prueba (+ uno de estrés), referencia de dibujo (se guarda en `localStorage` con la versión base; se compara con la nueva) y medición de rendimiento |

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
| D9 | **Menú contextual:** clic derecho solo sin herramienta activa ni operación en curso. Cada fase registra sus propias entradas por tipo. Sobre un objeto: cortar, copiar, pegar y eliminar (no hay «Duplicar»); en el fondo vacío: volver atrás, adelante y pegar (ajuste del 01/11/2026) |
| D10 | **Filtros:** estado visual `F` fuera de `S` y del historial; ocultar / atenuar / aislar; no tocan `esVisible`, imanes, conexiones ni presupuesto; se aplican **sobre** lo ya visible por planta y capa y se quitan con «Mostrar todo». Las redes/VLAN son lógicas y no se mezclan con las capas del editor |
| D11 | **Longitud de cables:** ruta completa + tramos verticales por altura de plantas + holgura configurable. Se distingue la longitud medida de la estimación de instalación |
| D12 | **Presupuesto:** precios por modelo y por metro de cable, moneda, cantidades y holgura; CSV primero (separador `;`, BOM UTF-8, coma decimal) |
| D13 | **Zonas y rellenos:** zonas rectangulares por dos puntos con imán a esquinas y extremos de paredes; rellenos sólidos y patrones predefinidos. Detección de habitaciones cerradas: estudio (F12) |
| D14 | **Tipo estable** (`tipo`, `sub`) en cada objeto (hecho) |
| D15 | **Escaleras con color desvanecido:** NO implementado (el reflejo de abajo usa opacidad fija .6). Se hará solo al final |
| D16 | **Color del cable:** no se puede cambiar desde ningún lugar (panel de superposición, menú contextual ni selector de color del menú izquierdo). Cada cable usa siempre el color de su tipo. Los archivos antiguos conservan el color con que se guardaron. Las paredes siguen siendo coloreables |
| D17 | **Catálogo de dispositivos:** incluye todos los dispositivos de la última versión de Packet Tracer, definidos como datos (modelos con plantilla de puertos) y no como código. Los componentes IoT se incluyen todos: si el usuario aporta imágenes de Packet Tracer se usan; si no, se generan iconos SVG propios |
| D18 | **Mesas:** un solo tipo de mesa, con tamaño y cantidad de puestos editables y sin cambio de color (ver F6) |
| D21 | **Cable único por escaleras (01/11/2026):** un cable que cruza plantas es UN objeto `line`. Sus puntos pueden llevar `pl`/`cp` (planta y capa; sin ellos, los del cable = donde se empezó) y `es`/`ed` (escalera y sentido del recorrido; los calcula la escalera, no se arrastran y la siguen si se mueve, gira o cambia de tamaño; si se borra la escalera quedan como puntos libres). Con un cable en curso, un clic sobre una escalera (también su reflejo) ofrece «Planta superior / inferior» (desactivada la que no existe; Esc cancela; no se puede poner un punto común sobre una escalera). Cada planta ve su mitad en sólido y la otra translúcida (opacidad .35); las zonas de clic del cable dentro de una escalera van por encima de ella. El tramo de la otra planta queda en la capa usada en esa planta. Borrar una planta o capa pide confirmación y quita solo los puntos de ahí (con menos de 2 puntos el cable se borra; el origen pasa a la planta que queda). Copiar toma solo el tramo de la planta actual y cortar borra el cable completo. Formato v2 con campos opcionales nuevos (R9); `cableAOtraPlanta` desaparece |
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
3. Acciones generales: color, dimensiones, relleno, contorno, nombre, etiqueta, rotación, **cortar, copiar, pegar** y eliminar, según el tipo (sin «Duplicar», ajuste del 01/11/2026). El menú de un cable no ofrece cambio de color y el de una mesa tampoco (D16, D18). El selector de color del menú izquierdo deja de afectar a los cables (también al dibujarlos: usan el color de su tipo).
4. Copiar guarda copias independientes en un portapapeles interno (fuera de `S` y del historial); Cortar copia y borra (un paso); Pegar crea objetos con id nuevo en la planta y capa **activas**, centrados en el punto del clic (sin punto, desplazados 0,5 m), sin uniones, sin conexiones, sin hijos y sin puertas; una escalera pegada que obstruye la de abajo se rechaza con aviso; si la capa activa está oculta o bloqueada no se pega.
5. El menú respeta las capas ocultas y bloqueadas (acciones deshabilitadas).
6. Cada acción es un solo paso de historial y no interfiere con la creación de cables, el arrastre, la selección múltiple ni el zoom; los atajos (Esc, G, F, H, M, R, Enter, Supr, Ctrl+Z/Y) funcionan igual.
7. Tabla de acciones por tipo, extensible por las fases siguientes.

**Decisiones de la F3 (confirmadas por el usuario el 01/11/2026):** (1) `js/acciones.js` como registro centralizado; (2) una escalera editada desde el inspector (posición, tamaño, giro, y también los botones de rotar y pegar) se valida con la planta de abajo como al colocarla: si obstruye se rechaza, se conservan los valores, se avisa y no hay paso de historial; (3) posición y tamaño solo en el inspector (el menú enfoca el campo) (el menú del fondo vacío se agregó después, ver sección 11); (4) `eventos.js` obligatorio. Detalles de implementación: el botón del panel es solo el icono ⚙️ para que la barra superior no pase a dos filas; los contadores nuevos están en `TR.ui` (no en `TR.stats`); pegar no usa `add()` (asigna id nuevo y la planta y capa actuales, suelta las uniones `ref`/`rl`, no copia puertas ni conexiones).

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
7. Los archivos v1 migran con una conexión por cada cable; un cable que atraviesa escaleras ya es una sola línea (D21) y su conexión tiene una sola ruta; los pares de cables sueltos antiguos se vinculan en la migración.
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
| Media | Los cables viejos que se partieron con la antigua flecha son dos objetos sin vínculo (los nuevos son un solo objeto, D21) | Se vinculan al migrar en la F7 |
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

Adjuntar la carpeta `Topologias_de_red` completa (`.zip`). Leer este documento (secciones 1, 3, 5 y 8). Estado: F0, F1, F2 y F3 completadas y verificadas en el navegador del usuario. **F3 completada y verificada por el usuario en su navegador (sección 11).** Siguiente: **F4**. Antes de escribir código, presentar el diseño detallado (archivos, criterios de la sección 5, pruebas; consultar en la web la última versión de Packet Tracer) y esperar confirmación. Al terminar, separar pruebas simuladas y manuales, trabajar con parches y actualizar este documento.

## 10. Registro de cambios

- 27–28/10/2026: auditoría, decisiones D1–D15, fases F0 y F1 completadas; F2A entregada y verificada.
- 31/10/2026: F2B aplicada con parches y verificada (31 pruebas, 0 fallidas, dibujo idéntico); F2 completada.
- 31/10/2026: decisiones confirmadas por el usuario (sección 6): color de cable bloqueado en todas partes, mesa sin color, exportación del interior del rack desde su vista, Packet Tracer última versión con IoT incluido (iconos propios si faltan imágenes).
- 31/10/2026: documento simplificado. Plan de fases reordenado por dependencias (F3 a F12). Nuevos criterios: catálogo con todos los dispositivos de Packet Tracer; una sola mesa con puestos de 50 cm mínimo y equipos dibujados encima; rellenos sin edición de patrón; sin cambio de color del cable en las pantallas nuevas; duplicar, redes/VLAN, etiquetas por puerto, presupuesto con pendientes, monedas y doble conteo, panel de superposición, filtros combinados con plantas y capas, y fase final de pruebas integrales.
- 01/11/2026: F3 diseñada y aprobada; implementada (acciones.js, inspector.js, contexto.js, inspector.css, contexto.css y parches en index.html, interaccion.js, controles.js, catalogo.js, dibujo.js, eventos.js, pruebas.js). 46 pruebas automatizadas aprobadas.
- 01/11/2026: F3 verificada por el usuario en su navegador (46/46, dibujo idéntico a la referencia, uso manual correcto) y **cerrada**.

## 11. Estado de la F3: resultados reales (cerrada el 01/11/2026)

**Pruebas automatizadas (ejecutadas en Chrome 131 sin interfaz, abriendo `index.html?pruebas=1` y pulsando «Ejecutar pruebas»):**
- 46 aprobadas, 0 fallidas, sin errores de página. Incluye las 31 anteriores (F0 a F2B) y 15 nuevas «Fase 3».
- La prueba «el dibujo es idéntico a la referencia» se ejecutó contra una referencia generada con el código ORIGINAL de la F2 (copia de respaldo), y pasó. En el navegador del usuario sigue necesitando su referencia guardada de la F0.
- Prueba extremo a extremo con ratón y teclado reales (simulados con Playwright, **no sustituyen la comprobación manual**): colocar, seleccionar, escribir en un campo con Enter, escribir y hacer clic en otro objeto sin Enter (se aplica al original), Ctrl+Z, menú con clic derecho, Esc, sin menú en el fondo, duplicar, cable (color de su tipo, selector desactivado, clic derecho lo termina sin menú), guardar/abrir válido y 100 movimientos reales del ratón con **0 reconstrucciones** del inspector y `TR.stats` en 0. Cajón en 700 px de ancho.
- No se probó en Firefox, Safari ni en pantallas táctiles.

**Resultados en el navegador del usuario (01/11/2026):** 46 aprobadas, 0 falladas; «Idéntico a la referencia» del 28/10/2026; rendimiento con 3000 objetos: render 50,6 ms (base F0: 47,4 ms), mover sin arrastrar 0 ms (base 42,3 ms), arrastrar un objeto 40,8 ms, desplazar 0,1 ms, zoom 10,1 ms. El usuario informó que las comprobaciones manuales de abajo funcionan bien.

**Comprobaciones manuales realizadas por el usuario:**
1. Abrir `index.html?pruebas=1` y ejecutar las pruebas (esperado: 46 aprobadas; si la referencia de la F0 no está guardada, la comparación de dibujo fallará por eso).
2. Clic derecho sobre cada tipo (dispositivo, pared, cable, forma, zona, texto, medida, puerta, escaleras, ascensor): el menú muestra lo que corresponde; cable sin «Color…»; puerta sin «Duplicar».
3. Con una herramienta de cable/pared/forma activa o un cable a medio dibujar: el clic derecho sigue terminando/cancelando y no abre menú. En el fondo vacío no hay menú ni menú del navegador.
4. Editar nombre, etiqueta, posición, tamaño y rotación en el inspector; Enter; Esc descarta; escribir y hacer clic en otro objeto sin Enter; deshacer y rehacer cada cambio (un paso por cambio).
5. Color: un cable no cambia (selector desactivado); una pared sí; selección mixta cambia solo la pared; el selector de color del menú izquierdo sigue funcionando con formas, zonas, paredes y escaleras.
6. Escaleras en una planta superior sobre una de la inferior: editar x/y/ancho/alto/rotación, rotar y duplicar deben rechazarse con el aviso y sin paso de historial.
7. Duplicar uno y varios objetos, en una capa distinta de la activa, con cables unidos y con una pared con puerta.
8. Capa bloqueada u oculta, Supr/Retroceso con el foco en el inspector, panel ⚙️ en pantalla estrecha, mover el ratón con el inspector abierto y escribiendo en un campo (no debe perder foco ni texto).
9. Guardar, abrir, exportar PNG (sin menú ni inspector en la imagen) y «Nuevo» con el inspector abierto.
- 01/11/2026: ajuste pedido por el usuario sobre la F3 ya cerrada: el menú del clic derecho ahora lleva Cortar, Copiar, Pegar y Eliminar (sin «Duplicar», tampoco en el inspector) y en el fondo vacío muestra Volver atrás, Adelante y Pegar. 48 pruebas automatizadas aprobadas (con los atajos Ctrl+C/X/V); **falta la verificación manual del ajuste**.

### Ajuste del menú contextual (01/11/2026): pendiente de verificación manual
**Cambio respecto a lo aprobado:** antes no había menú en el fondo vacío y existía «Duplicar»; ahora:
- Sobre un objeto editable: acciones de su tipo, **Cortar, Copiar, Pegar** y **Eliminar**.
- En el fondo vacío (o sobre algo bloqueado): **Volver atrás**, **Adelante** y **Pegar** (se desactivan si no hay historial o portapapeles); el clic derecho en el fondo suelta la selección.
- Portapapeles interno: no es el del sistema, no entra en `S` ni en el historial y se conserva al abrir otros archivos. Copiar no guarda historial; Cortar y Pegar guardan un paso cada uno y se pueden deshacer y rehacer.
- Pegar: planta y capa activas, centrado en el punto del clic (desde el menú) y con la misma validación de escaleras de la planta de abajo; no copia puertas ni uniones.
- Atajos **Ctrl+C / Ctrl+X / Ctrl+V** (Cmd en Mac), agregados el mismo día a pedido del usuario: copian, cortan y pegan con el portapapeles interno. Solo actúan sin herramienta activa ni operación en curso y fuera de campos de texto (dentro de un campo siguen siendo el copiar/pegar del navegador); sin selección Ctrl+C no bloquea al navegador; Ctrl+V pega centrado en el último punto del cursor sobre el plano; Ctrl+Mayús+V no hace nada. Cada Cortar y cada Pegar es un paso de historial.
- Para la F4: el portapapeles copia `img` y `modelo` como referencias; si «Nuevo» vacía `R`, un objeto pegado podría apuntar a un recurso inexistente (resolverlo al diseñar el catálogo, por ejemplo vaciando el portapapeles en «Nuevo»).

**Resultados reales (Chrome 131 sin interfaz):** 48 pruebas aprobadas, 0 fallidas (las 31 anteriores y 17 de la F3, incluidas las del portapapeles, el menú del fondo y los atajos), dibujo idéntico a la referencia del código original, y prueba con ratón real simulado correcta (menú del objeto, menú del fondo, pegar en el punto del clic, volver atrás, adelante, cortar y pegar lo cortado). **No sustituye la verificación manual.**

**Comprobaciones manuales pendientes del usuario:**
1. Clic derecho sobre un objeto: aparecen Cortar, Copiar, Pegar y Eliminar; no aparece «Duplicar» (tampoco en el inspector).
2. Copiar un objeto, clic derecho en un lugar vacío, Pegar: aparece centrado en ese punto, en la capa activa; Cortar y pegar mueve el objeto; varios objetos a la vez; pared con puerta (la puerta no se copia) y cable unido (se pega suelto).
3. Clic derecho en el fondo: Volver atrás, Adelante y Pegar; se desactivan cuando no corresponden; Volver atrás/Adelante equivalen a Ctrl+Z / Ctrl+Y.
4. Cada Cortar y cada Pegar es un solo paso de historial; Copiar no guarda ninguno.
5. Pegar con la capa activa oculta o bloqueada y pegar una escalera sobre la de la planta de abajo: se rechaza con aviso y sin paso de historial.
6. Con una herramienta activa o un cable a medio dibujar, el clic derecho sigue terminando o cancelando, sin menú.
7. Atajos: Ctrl+C / Ctrl+X / Ctrl+V con un objeto seleccionado y el cursor sobre el plano (pega centrado en el cursor); no actúan con una herramienta activa; dentro de un campo del inspector siguen siendo los del navegador; Ctrl+Z / Ctrl+Y deshacen y rehacen cada corte y pegado.
- 01/11/2026: segundo ajuste de la F3 a pedido del usuario: cable único que atraviesa escaleras entre plantas (D21; `js/trazas.js` nuevo y parches en `plantas`, `dibujo`, `interaccion`, `nodos`, `iman`, `seleccion`, `rotacion`, `historial`, `esquema`, `escaleras`, `contexto`, `acciones`, `index.html`, `pruebas`). 57 pruebas automatizadas aprobadas; **falta la verificación manual**.

### Ajuste 2 (01/11/2026): cable único por escaleras, pendiente de verificación manual
**Qué hace:** con la herramienta de cable y un cable en curso, un clic sobre una escalera (recta, con descanso o espiral; también su reflejo de la planta de abajo) abre «Planta superior / Planta inferior». Al elegir, el cable recorre la escalera (recto; sube por un lado, da la vuelta por el descanso y baja por el otro; o en espiral), la vista pasa a esa planta y se sigue dibujando desde la salida. Es **un solo objeto** (un solo paso de historial al terminarlo): borrarlo borra todo el recorrido, se puede agarrar también dentro de la escalera y deshacer lo restituye. Cada planta muestra su mitad del recorrido en sólido y la otra translúcida (referencia: la imagen del usuario).
**Decisiones del usuario:** el menú aparece siempre con las dos opciones (la planta inexistente, desactivada); el recorrido sigue a la escalera si se mueve, gira o cambia de tamaño y, si se borra la escalera, el cable conserva ese tramo como puntos libres; se hace ahora y en la F7 se enlaza con las conexiones; no se puede poner un punto común sobre una escalera con un cable en curso (Esc cancela el clic); al borrar una planta o capa se quitan solo sus puntos del cable (con menos de 2 puntos se borra) y siempre hay confirmación si contiene algo (también tramos de cables); copiar toma solo el tramo de la planta actual y cortar borra el cable completo.
**Resultados reales (Chrome 131 sin interfaz):** 57 pruebas aprobadas, 0 fallidas (las 48 anteriores y 9 nuevas), dibujo idéntico a la referencia del código original y sin regresión de rendimiento (3000 objetos: render 104 a 125 ms en esta máquina, igual que el código anterior). Prueba con ratón real simulado: menú con las dos opciones, la vista pasa a la planta elegida, un solo cable, agarrar el cable dentro de la escalera, Supr y Ctrl+Z; capturas de las dos plantas revisadas contra la imagen de referencia. **No sustituye la verificación manual.**
**Comprobaciones manuales pendientes del usuario:**
1. Dibujar un cable, hacer clic sobre cada tipo de escalera y elegir subir; repetir bajando (con 3 plantas). Revisar que en cada planta se vea su mitad en sólido y la otra translúcida, como en la imagen.
2. Que el cable siga en la planta nueva desde la salida de la escalera, y que Esc cancele el clic sin cambiar nada.
3. Agarrar el cable dentro de la escalera; Supr lo borra completo (en ambas plantas); Ctrl+Z lo restituye.
4. Mover, girar y cambiar el tamaño de la escalera (asas e inspector): el recorrido la sigue. Borrar la escalera: el cable queda con sus puntos.
5. Capas ocultas o bloqueadas en cada planta; guardar, abrir y exportar PNG con un cable así; deshacer y rehacer.
6. Borrar una planta o capa que contenga una parte del cable: aviso de confirmación y el resto del cable se conserva. Copiar y cortar un cable que atraviesa plantas.
7. Cables normales, paredes, imanes y nodos siguen igual.
9. Ajuste 3 (escalera con descanso con dos flechas, p. ej. una escalera sobre otra igual): las dos flechas van de izquierda a derecha, la que sube por fuera y un poco más arriba en el descanso, la que baja por dentro y un poco más abajo; los cables que suben por el exterior y los que bajan por el interior (recta, descanso y espiral), el cable nunca tapado por las flechas; la mitad sólida del cable en la planta de salida va hasta la mitad del descanso. La comparación con la referencia debe mostrar «cambio intencional» solo para «escaleras y plantas / p2».
8. Correcciones del 01/11/2026: bajar solo se puede si justo debajo hay una escalera igual (si no, la opción aparece desactivada con el motivo); el reflejo de la escalera de abajo solo deja bajar; el cable va junto a las flechas (no debajo) y el que baja usa otro carril que el que sube; en la espiral entra y sale en línea recta por el cuarto abierto, sin atravesar la pared curva.
- 01/11/2026: correcciones al ajuste 2 pedidas por el usuario tras probarlo: (a) **regla de bajar**: solo si justo debajo hay una escalera igual (mismo tipo, lugar, tamaño y giro); subir solo desde una escalera de la planta actual; el reflejo de la escalera de abajo solo permite bajar (`puedeCruzar` en `trazas.js`); (b) el recorrido va **a un costado de la flecha** (0,13 m) y el que baja usa otro carril que el que sube (siempre a la derecha del sentido de marcha); (c) espiral: ver la línea siguiente.
- 01/11/2026: la escalera en espiral ya no deja entrar ni salir el cable por la pared curva: **entra y sale por el cuarto abierto, en línea recta** (decisión del usuario): al subir entra en vertical cruzando el borde recto horizontal y sale en horizontal cruzando el borde recto vertical; al bajar, al revés; los dos carriles (sube por dentro del anillo de la flecha, baja por fuera) no se cortan a sí mismos. 60 pruebas automatizadas aprobadas (capturas de un cable que sube y otro que baja revisadas); **falta la verificación manual de las tres correcciones** (regla de bajar, carriles junto a las flechas y espiral).
- 01/11/2026: ajuste 3 de la escalera (pedido del usuario): (a) **subir y bajar recorren el mismo camino**, de izquierda a derecha (en la escalera con descanso empiezan por el tramo izquierdo y terminan por el derecho; la flecha de bajar y el reflejo de la escalera de abajo ya no van al revés); la mitad sólida en la planta desde donde se manda el cable es la que va hasta la mitad del descanso; (b) los cables que **suben** van por el **exterior** (cerca del borde, con un poco de espacio) y los que **bajan** por el **interior**, junto a las flechas y no debajo de ellas: recta = los dos por el lado izquierdo de la flecha, con descanso = en cada tramo exterior / interior y en el descanso el que sube por encima y el que baja por debajo, espiral = anillo exterior / interior; (c) en la escalera con descanso con las dos flechas, la que sube va por fuera y un poco más arriba en el descanso y la que baja por dentro y un poco más abajo (puntas más chicas). 61 pruebas automatizadas aprobadas; **falta la verificación manual**.
  - **Cambio de dibujo intencional:** la escalera con descanso con dos flechas se dibuja distinto, así que la comparación con la referencia de la Fase 0 reporta «escaleras y plantas / p2». Esa diferencia está declarada en `CAMBIOS_INTENCIONALES` de `js/pruebas.js` y se omite al comparar (cualquier otra diferencia sigue fallando). Si se quiere una referencia nueva, usar «Guardar referencia de dibujo» tras verificarlo.
