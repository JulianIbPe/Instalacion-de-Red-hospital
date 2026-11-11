# Seguimiento – Topologias_de_red

Editor web de topologías de red y planos de edificios (HTML + CSS + JavaScript + SVG, sin servidor ni framework). Se abre `index.html` en el navegador; `index.html?pruebas=1` abre además el panel de pruebas. Los scripts se cargan en el orden de `index.html` y comparten variables globales. Todas las coordenadas del modelo están en **metros**.

> **Última actualización: 11/11/2026** (limpieza del documento; sin cambios de código ni de estado de verificación).
> **Regla de mantenimiento:** al terminar una fase, o al avanzar dentro de la fase en curso, se actualiza este documento (qué se hizo, resultados reales de las pruebas, qué falta y cuál es el siguiente paso).

## 0. Resumen para retomar (leer primero)

**Dónde estamos (11/11/2026):**
- F0, F1, F2 y F3 completadas. La F3 se cerró el 01/11/2026 con la verificación manual del usuario.
- Dos ajustes posteriores a la F3 están implementados y probados solo en Chrome sin interfaz (60 pruebas aprobadas, 0 fallidas), **sin verificación manual del usuario**: (1) menú contextual con Cortar/Copiar/Pegar/Eliminar, menú del fondo y atajos Ctrl+C/X/V; (2) cable único que atraviesa escaleras entre plantas (D21), con tres correcciones. Comprobaciones pendientes en la sección 7.
- F4 a F12: no iniciadas. Siguiente: **F4**, solo cuando el usuario lo confirme.

**Qué hacer al retomar (en este orden):**
1. Si no están a mano, pedir al usuario la carpeta `Topologias_de_red` completa (`.zip`). No hay acceso a su navegador: nada se da por probado si no lo ejecutó él o no se ejecutó realmente.
2. Leer las secciones 0, 1, 3, 4, 5, 6, 7 y 8.
3. Preguntar al usuario cómo le fue con las comprobaciones de la sección 7. No asumir que pasaron. Si hay fallos, corregirlos con parches antes de la F4. Si confirma que están bien, marcarlas como verificadas en las secciones 1 y 7 y en el registro de cambios.
4. Para la F4: consultar en la web la última versión de Packet Tracer, presentar el diseño (archivos a tocar o crear, criterios de la sección 5, pruebas) y **esperar confirmación** antes de escribir código.
5. Al terminar cada avance: actualizar este documento (qué se hizo, resultados reales separando pruebas simuladas y manuales, qué falta, siguiente paso).

**Pendientes para la F4 (no resueltos):**
- El portapapeles interno copia `img` y `modelo` como referencias. Si «Nuevo» vacía `R`, un objeto pegado podría apuntar a un recurso inexistente (resolverlo vaciando el portapapeles en «Nuevo»).
- Versión exacta de Packet Tracer (consultar la web) y si el usuario aporta imágenes de sus dispositivos. Esas imágenes son material de Cisco: su uso queda bajo responsabilidad del usuario y no se incluyen en el proyecto entregado. Los iconos SVG generados son de diseño propio.

## 1. Estado de las fases

| Fase | Estado |
|---|---|
| F0 Saneamiento y pruebas | Completada (28/10/2026) |
| F1 Renderizado en capas | Completada (28/10/2026) |
| F2 Núcleo de datos (tipos, formato v2, recursos, historial) | Completada (31/10/2026): 31 pruebas aprobadas, dibujo idéntico a la referencia, uso manual correcto |
| F3 Inspector y menú contextual | Completada y cerrada (01/11/2026): 46 pruebas aprobadas, dibujo idéntico, verificación manual correcta. Ajustes posteriores (menú contextual; cable por escaleras) **pendientes de verificación manual** (sección 7) |
| F4 a F12 | No iniciadas (sección 5). Siguiente: **F4** |

Pendientes menores de verificación (no bloquean): abrir un `.json` dañado y comprobar que el proyecto no cambia; deshacer justo después de abrir un archivo; uso manual de la F1 (seleccionar, mover, rotar, cables, paredes, puertas, escaleras, medir, deshacer/rehacer, guardar/abrir).

## 2. Archivos del proyecto

| Ruta | Contenido |
|---|---|
| `index.html` | Barra superior, menú izquierdo, área de trabajo con reglas, panel de plantas, inspector, barra de estado y aviso de «Nuevo». Carga `js/pruebas.js` solo con `?pruebas=1` |
| `css/` | `base`, `barra`, `menu`, `lienzo`, `plantas`, `dialogo`, `inspector`, `contexto` |
| `js/estado.js` | Estado global (`S`, `V`, `tool`, `sel`, `tmp`, `drag`…) y utilidades (`byId`, `pt`, `toW`, `fmt`, `T`) |
| `js/eventos.js` | Namespace `TR`: `TR.stats` (contadores del render) y `TR.ui` (reconstrucciones del inspector, aperturas del menú). Obligatorio: aloja `TR.acc`, `TR.insp`, `TR.ctx` |
| `js/acciones.js` | `TR.acc`: registro único de **campos** (`registrarCampo`) y **acciones** (`registrar`) por tipo. `TR.acc.fijar(ids, campo, valor, gesto)` cambia un campo con un solo paso de historial y valida (rangos, objetos editables, escaleras contra la planta de abajo). También `rotar`, `copiar`, `cortar`, `pegar` (portapapeles interno), `eliminar`, `ejecutar`, `paraMenu`, `paraInspector`, `sinColor` (la mesa de la F6 se agrega ahí) y `sincronizarColor` |
| `js/inspector.js` | `TR.insp`: panel derecho `#insp` con secciones contraíbles (Objeto, Posición y tamaño, Apariencia, Acciones). Reconstruye su DOM solo si cambia la firma de la selección; si no, actualiza valores sin tocar el campo enfocado. Se refresca desde `renderPaneles()`, nunca al mover el ratón. Confirma con `change` o al pulsar fuera. Botón ⚙️ en la barra; en ≤760 px es un cajón |
| `js/trazas.js` | Cable único que atraviesa escaleras (D21): helpers de planta y capa por punto (`plantaDe`, `puntoEn`, `esMultiplanta`…), geometría (`trazaEscalera`: recta, con descanso o espiral), `escaleraEn`, `menuEscalera` / `cruzarEscalera`, `puedeCruzar`, `sincronizarTrazas`, `soltarTrazasHuerfanas`, `podarCables`, `segmentosEnPlanta`, `dibujarCableMP` |
| `js/contexto.js` | `TR.ctx`: menú contextual `#ctx`. Sobre un objeto editable: cortar, copiar, pegar, eliminar y las acciones de su tipo. En el fondo vacío o sobre algo no editable: volver atrás, adelante y pegar. Teclado: flechas, Home/End, Enter, Esc, Tab |
| `js/tipos.js` | Tipo estable por objeto: `tipo` (pared, cable, dispositivo, rack, escalera, ascensor, ventana, puerta, forma, zona, texto, medida) y `sub` (`router`, `utp6`, `circulo`…). `derivarTipo` es el único lugar donde un nombre visible se traduce a tipo. Predicados `esPared`, `esCable`, `esEscalera`, `esAscensor`, `esCirculo`, `claveLinea`. Escaleras: variante en `o.t` (sin `t` = recta, `descanso`, `espiral`) |
| `js/recursos.js` | Almacén `R` fuera de `S` y del historial: `R.imgs` (id por hash; PNG/JPEG/WebP validados por sus bytes; 5 MB por imagen, 50 MB por proyecto, 8 000 px por lado, 40 M de píxeles) y `R.modelos` (plantillas versionadas). Solo el almacén; la interfaz llega en la F4 |
| `js/esquema.js` | Formato v2: `ESQ.leer` (valida con lista blanca, sanea y migra v1 → v2 sin tocar `S` ni `R`) y `ESQ.serializar` (rechaza lo que luego no se podría abrir). Todo campo nuevo se registra en `ESPEC` (R9) |
| `js/catalogo.js` | Catálogo del menú izquierdo (`CAT`), `SH` (vértices de formas por subtipo), `menu()`, `setTool()` |
| `js/dibujo.js` | `draw()` por objeto y render en capas: `#vp` > `#g-grilla`, `#c` (objetos; lo que exporta el PNG), `#g-tmp` (lo temporal). `render()`, `repintarMovimiento()`, `status()` |
| `js/historial.js` | Deshacer, rehacer, borrar. Interfaz `Hist` con estrategia intercambiable (snapshots de `S`, tope de 100 pasos y 50 M de caracteres, sin duplicar pasos idénticos) |
| `js/archivos.js` | Guardar y abrir `.json` v2 (`abrirTexto` no toca nada si el archivo es inválido y restaura el proyecto ante un fallo), exportar PNG (`construirSvgExport`), «Nuevo» |
| `js/controles.js` | Teclado (ver sección 8), color / relleno / tipo de línea (usan `TR.acc.fijar`), grilla, imán medio, tamaño del edificio, unidad |
| `js/interaccion.js` | Ratón: colocar, mover, dibujar, medir, zoom, desplazar; doble clic detectado a mano; clic derecho (sección 8); `add()` asigna el tipo; un cable usa el color de su tipo |
| `js/plantas.js` | Plantas y capas (ocultar, bloquear, jerarquía con ▲ ▼ o arrastrando ⠿), `esVisible` / `esEditable`, `normalizar()` |
| `js/colocar.js` | Escaleras y formas con dos puntos (esquinas opuestas; círculo y espiral = centro y radio) |
| `js/escaleras.js` | Escalera recta, con descanso y espiral; reflejo de la planta de abajo; reglas de colocación entre plantas; cambio de planta desde la flecha |
| `js/formas.js`, `js/puertas.js`, `js/rotacion.js`, `js/seleccion.js` | Formas (8 asas, lados, vértices, medidas), puertas sobre paredes, rotación (asa ↻ o R), selección múltiple y por rectángulo |
| `js/iman.js`, `js/nodos.js`, `js/medidas.js`, `js/reglas.js`, `js/rejilla.js` | Imanes (puntas, centros, puntos medios), nodos de líneas del mismo tipo, cotas, reglas en metros y grilla |
| `js/main.js` | Arranque (se carga el último) |
| `js/pruebas.js` | Solo con `?pruebas=1`: panel de pruebas, proyectos de prueba, referencia de dibujo y medición de rendimiento (sección 8) |

## 3. Decisiones

| N.º | Decisión |
|---|---|
| D1 | **Conexiones lógicas ligadas a la ruta física.** `S.conex`: cada conexión guarda origen y destino `{d: dispositivo, p: puerto}` y la lista ordenada `rutas` de líneas. La línea es solo geometría; la conexión conserva su `id` aunque cambie el recorrido. Las que tienen extremos sin definir son **incompletas** y no cuentan como completas. Los tramos entre plantas se unen a la conexión existente, sin duplicar |
| D2 | **Jerarquía.** Campo `parent`. Hijos con posición absoluta sincronizada (`x`, `y`, `rot`) más posición local (`lx`, `ly`, `lrot`) para mesas, o `ru:{u,h}` para racks. El hijo hereda `pl` y `cp` del padre |
| D3 | **Recursos fuera del historial.** Almacén `R` (imágenes por hash y modelos); se guarda con el proyecto; los recursos sin uso se descartan al guardar |
| D4 | **Historial.** Snapshots de `S` con tope en pasos y en bytes; estrategia intercambiable |
| D5 | **Vista de rack.** Modal con su propio SVG sobre el mismo `S` (usa `push()`, deshacer/rehacer y atajos globales) |
| D6 | **Formato v2** con validación por lista blanca y migración automática desde v1 (hecho) |
| D7 | **Renderizado** en capas independientes, sin framework (hecho) |
| D8 | **Inspector:** aside derecho con secciones contraíbles; `#plantas` se conserva |
| D9 | **Menú contextual:** clic derecho solo sin herramienta activa ni operación en curso. Cada fase registra sus entradas por tipo. Sobre un objeto: cortar, copiar, pegar y eliminar (no hay «Duplicar»). En el fondo vacío: volver atrás, adelante y pegar |
| D10 | **Filtros:** estado visual `F` fuera de `S` y del historial; ocultar / atenuar / aislar; no tocan `esVisible`, imanes, conexiones ni presupuesto; se aplican sobre lo visible por planta y capa; «Mostrar todo» los quita. Las redes/VLAN son lógicas y no se mezclan con las capas del editor |
| D11 | **Longitud de cables:** ruta completa + tramos verticales por altura de plantas + holgura configurable. Se distingue la longitud medida de la estimación de instalación |
| D12 | **Presupuesto:** precios por modelo y por metro de cable, moneda, cantidades y holgura; CSV primero (separador `;`, BOM UTF-8, coma decimal) |
| D13 | **Zonas y rellenos:** zonas rectangulares por dos puntos con imán a esquinas y extremos de paredes; rellenos sólidos y patrones predefinidos. Detección de habitaciones cerradas: F12 |
| D14 | **Tipo estable** (`tipo`, `sub`) en cada objeto (hecho) |
| D15 | **Escaleras con color desvanecido:** NO implementado (el reflejo de abajo usa opacidad fija .6). Se hará solo al final |
| D16 | **Color del cable:** no se puede cambiar desde ningún lugar (superposición, menú contextual ni selector del menú izquierdo). Cada cable usa siempre el color de su tipo. Los archivos antiguos conservan el color con que se guardaron. Las paredes siguen siendo coloreables |
| D17 | **Catálogo de dispositivos:** todos los dispositivos de la última versión de Packet Tracer, definidos como datos (modelos con plantilla de puertos), no como código. Los componentes IoT se incluyen: si el usuario aporta imágenes se usan; si no, iconos SVG propios |
| D18 | **Mesas:** un solo tipo de mesa, con tamaño y cantidad de puestos editables y sin cambio de color (F6) |
| D19 | **Rellenos:** solo patrones predefinidos. Sin edición de grosor, espaciado, colores del patrón, orientación ni transparencia |
| D20 | **Exportar el rack:** el interior de un rack se exporta a PNG solo desde dentro de su vista, con un botón propio. El PNG del plano no incluye el interior |
| D21 | **Cable único por escaleras (01/11/2026).** Un cable que cruza plantas es UN objeto `line`. Sus puntos llevan `pl`/`cp` (planta y capa) y, si están sobre una escalera, `es`/`ed` (escalera y sentido). Los calcula la escalera: se actualizan si se mueve, gira o cambia de tamaño; si la escalera se borra, quedan como puntos libres. **Subir** solo desde una escalera de la planta actual; **bajar** solo si justo debajo hay una escalera igual (mismo tipo, lugar, tamaño y giro). Con un cable en curso, un clic sobre una escalera (también su reflejo) ofrece «Planta superior / inferior» (la inexistente, desactivada; Esc cancela; no se puede poner un punto común sobre una escalera). Cada planta muestra su mitad en sólido y la otra translúcida (opacidad .35). Borrar una planta o capa pide confirmación y quita solo sus puntos (con menos de 2 puntos el cable se borra). Copiar toma solo el tramo de la planta actual; cortar borra el cable completo. Campos en `ESPEC` (R9); `cableAOtraPlanta` desaparece |

## 4. Arquitectura y reglas de coherencia

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

**Riesgos a vigilar**

| Gravedad | Riesgo | Mitigación |
|---|---|---|
| Alta | Pérdida silenciosa de campos por la lista blanca de `esquema.js` | R9 y prueba de ida y vuelta |
| Alta | Catálogo con cientos de modelos: menú lento y proyectos pesados | Modelos como datos en `R`, búsqueda, snapshots sin recursos (F4) |
| Media | Plantillas editadas después de usarse | Plantillas versionadas; actualizar es explícito y deshacible (F4) |
| Media | Doble dirección línea ↔ conexión | Funciones explícitas de sincronización y pruebas (F7) |

## 5. Plan de fases pendientes

Cada fase deja la aplicación usable y no elimina funciones. Cada fase que añada campos los registra en `ESPEC` (R9) y suma sus entradas al menú contextual. Antes de cada fase se informan archivos y pruebas; al cerrarla se actualiza este documento.

| Fase | Contenido | Depende de |
|---|---|---|
| F4 | Catálogo (Packet Tracer), imágenes y modelos | F2, F3 |
| F5 | Rellenos y zonas | F2 |
| F6 | Jerarquía y mesas | F2, F3, F4 |
| F7 | Puertos, conexiones y redes | F4, F6 |
| F8 | Racks | F6, F7 |
| F9 | Longitud de cables y presupuesto | F4, F7, F8 |
| F10 | Cables superpuestos, aislar cable y filtros | F7, F9 |
| F11 | Pruebas integrales y documentación | Todas |
| F12 | Estudios y ampliaciones futuras | F11 |

Los filtros van en la F10 porque usan redes, cables y conexiones (existen desde la F7) y no deben alterar el presupuesto. Los racks van después de los puertos porque su modal permite elegir y conectar puertos. Las mesas van después del catálogo porque necesitan los equipos que se colocan encima.

### F4 — Catálogo (Packet Tracer), imágenes y modelos
Archivos: `catalogo.js`, `dibujo.js`, `archivos.js`, `recursos.js`, `inspector.js`.
1. Catálogo con todos los dispositivos de la última versión de Packet Tracer (routers, switches, hubs, inalámbricos, seguridad, PCs, laptops, servidores, impresoras, teléfonos, tablets, smartphones, nube/WAN, componentes, etc.), por categorías y subcategorías, con búsqueda. Además: notebook, monitor y patch panel si no vienen en esa lista. Incluye los componentes IoT. Imágenes de Packet Tracer solo si el usuario las aporta (se importan como imágenes del proyecto); lo demás usa un icono SVG propio.
2. Cada dispositivo es un modelo de `R` con plantilla (dimensiones, icono o imagen, grupos de puertos); el catálogo actual sigue funcionando.
3. Datos por dispositivo: fabricante, modelo, descripción, precio unitario, moneda y cantidad (se editan aquí; se calculan en la F9).
4. Importar PNG/JPEG/WebP (sin SVG), con tope de tamaño; un dispositivo usa imagen o icono; se pueden editar posición, tamaño, rotación, nombre y propiedades.
5. Alta, edición y baja de modelos con aviso de cuántas instancias se afectan; actualizar instancias es explícito, confirmado y deshacible.
6. El PNG exportado muestra las imágenes; guardar y abrir conserva imágenes y modelos; ningún snapshot contiene `data:image`.
7. El menú no se reconstruye al mover el ratón; con cientos de modelos sigue siendo ágil.

### F5 — Rellenos y zonas
Archivos: `dibujo.js`, `controles.js`, `index.html`, `colocar.js`, `interaccion.js`, `nodos.js`, `iman.js`; nuevo `zonas.js`.
1. Al menos 6 patrones predefinidos además del sólido y la diagonal, con definiciones compartidas por patrón y color (D19).
2. Herramienta de relleno con un clic sobre una forma o zona existente.
3. Los archivos con relleno `hat` se ven igual que antes.
4. Zonas rectangulares por dos puntos (clic-clic o arrastrar) con imán a esquinas y extremos de paredes; las zonas elípticas siguen funcionando; vértices, lados, rotación, selección múltiple e historial se conservan.
5. Ida y vuelta de archivo. El relleno automático de recintos cerrados queda en la F12.

### F6 — Jerarquía y mesas
Archivos: `interaccion.js`, `historial.js`, `rotacion.js`, `dibujo.js`, `plantas.js`, `catalogo.js`; nuevo `jerarquia.js`.
1. **Una sola mesa.** Tamaño y cantidad de puestos configurables, además de nombre y etiqueta. Su color no se puede cambiar (D18).
2. Cada puesto mide como mínimo 0,50 m: el largo mínimo de la mesa es puestos × 0,50 m. Al subir los puestos la mesa crece hasta ese mínimo y no se puede achicar por debajo.
3. Un equipo ocupa un puesto. Al redimensionar la mesa los puestos se redistribuyen en partes iguales y cada equipo sigue en su puesto. No se pueden reducir los puestos por debajo de los ocupados (se avisa).
4. Los equipos sobre una mesa se dibujan **por encima** de ella.
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
5. Etiquetas físicas junto a cada puerto de routers, switches y patch panels (destino, equipo remoto, planta, sala, VLAN), activables y exportables en el PNG.
6. Borrar un dispositivo o una conexión aplica R7 y R8.
7. Los archivos v1 migran con una conexión por cada cable. Un cable que atraviesa escaleras ya es una sola línea (D21) con una sola ruta. Los pares de cables sueltos antiguos se vinculan en la migración.
8. Menú contextual del cable: tipo y extremos (sin color; la longitud se añade en la F9).
9. Bloqueo del color de los cables en `controles.js` y en la creación de cables (D16).

### F8 — Racks
Archivos: `interaccion.js`, `controles.js`, `index.html`; nuevos `rack.js`, `vistarack.js`, `rack.css`.
1. El rack admite equipos por unidades, rechaza solapes y excesos de altura.
2. Se puede arrastrar un equipo del plano hacia el rack para instalarlo; sigue siendo el mismo objeto (conserva identidad, puertos y conexiones) y deja de verse suelto en el plano.
3. Doble clic en un rack abre el modal y se vuelve al plano con vista, selección y herramienta intactas (R10).
4. En el modal se pueden seleccionar, editar y conectar puertos, ver las etiquetas físicas y editar propiedades de los equipos instalados.
5. Ctrl+Z / Ctrl+Y funcionan con el modal abierto; borrar un rack o un equipo aplica R7.
6. Menú contextual del rack con opciones de montaje. La etiqueta se edita desde el menú o el inspector (el doble clic abre el modal).
7. Dentro de la vista del rack, botón «PNG» que exporta su interior (D20).

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
1. Al mantener el cursor sobre cables superpuestos aparece un panel flotante con los cables detectados; sigue abierto al pasar el cursor al panel y no bloquea otras herramientas.
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

## 6. Reglas de trabajo

**Cómo trabaja el usuario:** español de Argentina (voseo); respuestas claras y breves, con tablas y listas cuando ayuden; una fase por vez; **parches de texto** sobre los archivos reales (indicando qué reemplazar y qué respaldo conservar) en lugar de reescribir módulos; archivos completos con su ruta exacta cuando se entregan; no cambiar tecnología ni el orden de carga sin justificación; conservar funciones y compatibilidad con proyectos antiguos; nunca afirmar que una prueba pasó si no se ejecutó; ante una decisión de diseño importante, presentar alternativas y consecuencias.

- Responder en español (Argentina, voseo), claro y breve, con tablas y listas cuando ayuden.
- Una fase por vez. Antes: indicar archivos y pruebas. Al terminar: informar lo implementado y los resultados **reales** de las pruebas, separando las simuladas (Node / Chrome sin interfaz / Playwright) de las que hace el usuario en su navegador, e indicar qué debe hacer él.
- No avanzar a una fase que dependa de otra sin verificar la anterior.
- Entregar archivos completos con su ruta exacta; preferir **parches de texto** sobre los archivos reales a reescribir módulos. Indicar qué reemplazar y qué respaldo conservar.
- No reescribir la aplicación, no cambiar de tecnología sin justificación, conservar las funciones existentes, no duplicar lógica ni manejadores de eventos, no cambiar el orden de carga sin necesidad. Si hay una incompatibilidad real, explicarla antes.
- Mantener compatibilidad con proyectos antiguos, historial y archivos.
- Si una función requiere una decisión de diseño importante, presentar alternativas y consecuencias antes de elegir.
- Las decisiones confirmadas el 31/10/2026 (Packet Tracer última versión con IoT, mesa sin color, color de cable bloqueado también en el menú izquierdo, exportación del rack desde su vista) están en D16 a D20 y en las fases.

## 7. Verificación pendiente (ajustes posteriores a la F3)

**Resultados automatizados (Chrome 131 sin interfaz, `index.html?pruebas=1` → «Ejecutar pruebas»):** 60 aprobadas, 0 fallidas, sin errores de página; dibujo idéntico a la referencia del código original; sin regresión de rendimiento (3000 objetos). Las pruebas con ratón y teclado simulados **no sustituyen** la comprobación manual. No se probó en Firefox, Safari ni pantallas táctiles.

**Ajuste 1 — menú contextual (01/11/2026): pendiente de verificación manual.** Cambio respecto a lo aprobado: antes no había menú en el fondo vacío y existía «Duplicar»; ahora:
- Sobre un objeto: acciones de su tipo, Cortar, Copiar, Pegar y Eliminar. Sin «Duplicar», tampoco en el inspector.
- En el fondo vacío (o sobre algo bloqueado): Volver atrás, Adelante y Pegar (se desactivan si no hay historial o portapapeles). Volver atrás / Adelante equivalen a Ctrl+Z / Ctrl+Y.
- Portapapeles interno: no es el del sistema, no entra en `S` ni en el historial, y se conserva al abrir otros archivos. Copiar no guarda historial; Cortar y Pegar guardan un paso cada uno.
- Pegar: planta y capa activas, centrado en el punto del clic, con la validación de escaleras de la planta de abajo; no copia puertas ni uniones (el cable se pega suelto).
- Atajos Ctrl+C / Ctrl+X / Ctrl+V (Cmd en Mac): solo sin herramienta activa ni operación en curso y fuera de campos de texto (dentro de un campo siguen siendo los del navegador). Sin selección, Ctrl+C no bloquea al navegador. Ctrl+V pega centrado en el último punto del cursor sobre el plano. Ctrl+Mayús+V no hace nada.

Comprobaciones manuales pendientes:
1. Clic derecho sobre un objeto: aparecen Cortar, Copiar, Pegar y Eliminar; no aparece «Duplicar».
2. Copiar un objeto, clic derecho en un lugar vacío, Pegar: aparece centrado en ese punto, en la capa activa. Cortar y pegar mueve el objeto. Probar varios objetos a la vez, una pared con puerta (la puerta no se copia) y un cable unido (se pega suelto).
3. Clic derecho en el fondo: Volver atrás, Adelante y Pegar; se desactivan cuando no corresponden.
4. Cada Cortar y cada Pegar es un solo paso de historial; Copiar no guarda ninguno.
5. Pegar con la capa activa oculta o bloqueada, y pegar una escalera sobre la de la planta de abajo: se rechaza con aviso y sin paso de historial.
6. Con una herramienta activa o un cable a medio dibujar, el clic derecho sigue terminando o cancelando, sin menú.
7. Atajos: Ctrl+C / X / V con un objeto seleccionado y el cursor sobre el plano; no actúan con una herramienta activa; dentro de un campo del inspector siguen siendo los del navegador; Ctrl+Z / Ctrl+Y deshacen y rehacen cada corte y pegado.

**Ajuste 2 — cable único por escaleras (01/11/2026): pendiente de verificación manual.** Con la herramienta de cable y un cable en curso, un clic sobre una escalera (recta, con descanso o espiral; también su reflejo) abre «Planta superior / Planta inferior». Al elegir, el cable recorre la escalera (recto: sube por un lado, da la vuelta por el descanso y baja por el otro; o en espiral), la vista pasa a esa planta y se sigue dibujando desde la salida. Es **un solo objeto**: un paso de historial al terminarlo; borrarlo borra todo el recorrido; deshacer lo restituye. Decisiones del usuario: el menú muestra siempre las dos opciones; el recorrido sigue a la escalera si se mueve, gira o cambia de tamaño, y si se borra la escalera el cable conserva ese tramo como puntos libres; copiar toma solo el tramo de la planta actual y cortar borra el cable completo.

Correcciones aplicadas tras probarlo: (a) regla de bajar (D21); (b) el recorrido va a un costado de la flecha (0,13 m) y el que baja usa otro carril que el que sube; (c) en la espiral, el cable entra y sale por el cuarto abierto, en línea recta, sin atravesar la pared curva; sube por dentro del anillo de la flecha y baja por fuera. Un «ajuste 3» de las flechas del descanso se pidió y luego se **deshizo**: se conserva el comportamiento anterior.

Comprobaciones manuales pendientes:
1. Dibujar un cable, hacer clic sobre cada tipo de escalera y elegir subir; repetir bajando (con 3 plantas). En cada planta, su mitad se ve en sólido y la otra translúcida.
2. El cable sigue en la planta nueva desde la salida de la escalera. Esc cancela el clic sin cambiar nada.
3. Agarrar el cable dentro de la escalera; Supr lo borra completo (en ambas plantas); Ctrl+Z lo restituye.
4. Mover, girar y cambiar el tamaño de la escalera (asas e inspector): el recorrido la sigue. Borrar la escalera: el cable queda con sus puntos.
5. Capas ocultas o bloqueadas en cada planta; guardar, abrir y exportar PNG con un cable así; deshacer y rehacer.
6. Borrar una planta o capa que contenga una parte del cable: aviso de confirmación y el resto se conserva. Copiar y cortar un cable que atraviesa plantas.
7. Cables normales, paredes, imanes y nodos siguen igual.
8. Regla de bajar (solo con una escalera igual justo debajo; si no, la opción aparece desactivada con el motivo), carriles junto a las flechas y espiral por el cuarto abierto.

## 8. Mapa técnico para retomar

**Orden de carga de scripts (`index.html`; comparten variables globales, no cambiarlo sin necesidad):** `estado` → `eventos` (define `TR`) → `tipos` → `recursos` → `esquema` → `catalogo` → `dibujo` → `reglas` → `rejilla` → `plantas` → `historial` → `iman` → `nodos` → `medidas` → `escaleras` → `trazas` → `formas` → `puertas` → `rotacion` → `seleccion` → `colocar` → `interaccion` → `controles` → `acciones` → `inspector` → `contexto` → `archivos` → `main` (siempre el último). `pruebas.js` se carga solo con `?pruebas=1`. CSS: `base`, `barra`, `menu`, `lienzo`, `plantas`, `dialogo`, `inspector`, `contexto`.

**Estado global (`estado.js`):** `S` (proyecto; entra al historial), `V` (vista: `ox`, `oy`, `z` px/m), `sel`, `multi`, `selEdge`, `tool`, `tmp`, `drag`, `nid`, `curP`. `R` (recursos, `recursos.js`) está fuera de `S`. Namespace `TR` (`eventos.js`): `TR.stats`, `TR.ui`, `TR.acc`, `TR.insp`, `TR.ctx`. El código nuevo usa `TR`: las letras `I`, `L`, `T`, `S`, `V` ya están ocupadas.

**Convenciones que no hay que romper:**
- Todo cambio de `S` llama antes a `push()` (un paso de historial por acción; no duplica pasos idénticos). Los snapshots serializan solo `S`.
- El comportamiento lo decide el `tipo`/`sub` estable (`tipoDe`, `subDe`, `esPared`, `esCable`, `esEscalera`…), nunca el nombre visible `o.n`. `add()` asigna el tipo (`completarTipo`).
- Planta y capa: `esVisible`/`esEditable` son la única puerta; cada objeto lleva `pl` y `cp`; los puntos de un cable pueden llevar `pl`/`cp` y `es`/`ed` (D21).
- R9: todo campo nuevo se registra en `ESPEC` de `esquema.js` y se cubre con la prueba de ida y vuelta. Formato v2 (`ESQ.leer` / `ESQ.serializar`).
- Render en capas: `render()` (completo, síncrono), `renderObjetos()` (`#c`, lo que exporta el PNG), `renderTmp()` (`#g-tmp`), `repintarMovimiento()` al mover el ratón. Mover el ratón sin arrastrar no debe reconstruir nada (ni el inspector).
- Campos y acciones por tipo se registran con `TR.acc.registrarCampo` / `TR.acc.registrar` (`acciones.js`); las fases siguientes agregan ahí sus entradas y a `TR.acc.sinColor` (mesa de la F6). El color del cable no se puede cambiar (D16).
- Pegar no usa `add()`: asigna id nuevo y la planta y capa actuales, suelta las uniones `ref`/`rl`, no copia puertas ni conexiones.
- Teclado (`controles.js`): G, F, H, M, R, Enter, Esc, Supr/Retroceso, Ctrl+Z/Y, Ctrl+C/X/V. No actúan con botón, resumen, checkbox o color enfocados, ni dentro de TEXTAREA. Con el menú contextual abierto solo flechas, Enter, Esc y Tab. Los atajos F, H, M, G y R ya estaban ocupados: los comandos nuevos van por menú contextual e inspector.
- Clic derecho (`interaccion.js`): con herramienta u operación en curso cancela o termina; sin ellas abre el menú contextual.

**Pruebas (`js/pruebas.js`, `?pruebas=1`, botón «Ejecutar pruebas»):** 60 casos (31 de F0 a F2B, 17 de la F3 y 12 del cable por escaleras). Usan proyectos de prueba (`fVacio`, `fDispositivos`, `fParedes`, `fFormas`, `fEscaleras`, `fCapas`, `fCruce`, `fDup`, estrés) con `conProyecto(...)`, que restaura el estado de la página al terminar. Para pruebas nuevas, seguir ese patrón y no dejar pasos en el historial del usuario.
- **Aviso importante:** la prueba «el dibujo es idéntico a la referencia» usa una referencia guardada en el `localStorage` del navegador (clave `topologias_ref_f0`). En otro navegador, otra cuenta o tras limpiar datos no existe y esa prueba fallará por eso, no por un error del código. Se genera con «Guardar referencia de dibujo» usando una versión del código cuyo dibujo se considere correcto. No sobrescribir la del usuario sin avisarle.
- «Medir rendimiento» compara contra una base de la F0 (render ~50 ms, mover sin arrastrar ~44 ms con 3000 objetos). En la última medición del usuario (01/11/2026) el render dio 50,6 ms y mover sin arrastrar 0 ms.

**Limitaciones y detalles a recordar:**
- D15 (escaleras con color desvanecido) NO está implementado; el reflejo de la planta de abajo usa opacidad fija .6. La otra mitad de un cable que atraviesa plantas usa opacidad .35.
- Bajar por una escalera exige otra igual justo debajo (D21).
- Los cables viejos partidos con la antigua flecha son dos objetos sin vínculo; se vinculan al migrar en la F7.
- El doble clic se detecta a mano (la página se redibuja en cada clic y el `dblclick` nativo se pierde).
- El doble clic en un rack abre el modal y ya no pone etiqueta; la etiqueta se edita desde el menú o el inspector.

## 9. Registro de cambios

- 27–28/10/2026: auditoría, decisiones D1–D15, fases F0 y F1 completadas; F2A entregada y verificada.
- 31/10/2026: F2B aplicada y verificada (31 pruebas, dibujo idéntico); F2 completada. Decisiones confirmadas por el usuario (ver sección 6).
- 01/11/2026: F3 diseñada, implementada y verificada por el usuario (46/46, dibujo idéntico, uso manual correcto); **cerrada**.
- 01/11/2026: ajuste 1 de la F3 (menú contextual con Cortar/Copiar/Pegar/Eliminar, menú del fondo, atajos Ctrl+C/X/V). Pendiente de verificación manual.
- 01/11/2026: ajuste 2 de la F3 (cable único por escaleras, D21), con correcciones del mismo día. Pendiente de verificación manual. Un ajuste 3 de las flechas se deshizo.
- 10/11/2026: documento reorganizado para continuar en otra cuenta.
- 11/11/2026: documento limpiado: se quitaron repeticiones, historial de pruebas intermedias y detalles de implementación ya resueltos. No se modificó código ni el estado de verificación de ninguna comprobación.
