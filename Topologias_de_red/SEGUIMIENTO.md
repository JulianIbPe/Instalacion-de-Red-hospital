# Seguimiento – Topologias_de_red

Editor web de topologías de red y planos de edificios (HTML + CSS + JavaScript + SVG, sin servidor ni framework). Se abre `index.html` en el navegador; `index.html?pruebas=1` abre además el panel de pruebas. Los scripts se cargan en el orden de `index.html` y comparten variables globales. Todas las coordenadas del modelo están en **metros**.

> **Última actualización: 11/11/2026** (cierre de la sesión: escaleras verificadas; F4 diseñada y esperando los iconos que el usuario rehace en otro chat; ver sección 0).
> **Regla de mantenimiento:** al terminar una fase, o al avanzar dentro de la fase en curso, se actualiza este documento (qué se hizo, resultados reales de las pruebas, qué falta y cuál es el siguiente paso).

## 0. Resumen para retomar (leer primero)

**Dónde estamos (11/11/2026, fin de la sesión):**
- F0 a F3 completadas y verificadas por el usuario, incluidos todos los ajustes posteriores de la F3 (sección 7: menú contextual, cable por escaleras, reglas de escaleras entre plantas y las correcciones de la revisión thermo del commit `cda924b`). Pruebas: 62/63 en el navegador integrado; la única que falla es «el dibujo es idéntico a la referencia», porque la referencia vive en el `localStorage` del navegador del usuario (en su navegador debería pasar).
- **Cambios sin commitear** (correcciones de la revisión thermo, verificadas por el usuario): `js/acciones.js`, `colocar.js`, `controles.js`, `escaleras.js`, `historial.js`, `interaccion.js`, `plantas.js`, `pruebas.js`, `rotacion.js`, `trazas.js` y este documento. El usuario commitea por su cuenta; preguntar antes de hacerlo.
- **F4 diseñada, sin código.** Plan en la sección 5 (F4A: catálogo, iconos y modelos propios con «Empty»; F4B: imágenes). La lista de modelos ya la dio el usuario (sección 5).
- **Iconos (11/11/2026): generados y aprobados por el usuario** (incluido el foco de `iot-luz.svg`). Para cambiar un dibujo se edita su SVG directamente (el script que los generó era temporal y no se guardó). Carpeta `iconos/`: 33 SVG de dibujo propio, fondo transparente, `viewBox` 96×96 (14 de red y finales, 17 IoT, `empty.svg`, `generico.svg`) y `vista-previa.png` con todos juntos. Todavía no los usa ningún código (eso es la F4A). Referencia de aspecto que dio el usuario: ilustración del aparato al estilo Packet Tracer (sin copiar el material de Cisco) y debajo dos líneas, modelo y nombre del equipo (sección 5, «Aspecto»).

**Qué hacer al retomar (en este orden):**
1. Los archivos están en la carpeta del proyecto; no hace falta pedir el `.zip`. No hay acceso al navegador del usuario: nada se da por probado si no lo ejecutó él o no se ejecutó realmente.
2. Leer las secciones 0, 1, 3, 4, 5 (F4), 6 y 8.
3. Los iconos ya están aprobados y guardados en `iconos/` (uno por modelo de la sección 5, más `empty.svg` y `generico.svg`); no hay que pedirlos. Falta la aprobación de la tabla de tamaños (sección 5).
4. Pedir respuesta a las **preguntas abiertas** de abajo.
5. Con todo eso, confirmar el diseño de la F4A y **esperar la orden de empezar** antes de escribir código.
6. Al terminar cada avance: actualizar este documento (qué se hizo, resultados reales separando pruebas simuladas y manuales, qué falta, siguiente paso).

**Decisiones del usuario para la F4 (11/11/2026):**
- Iconos de diseño propio (no emojis, sin material de Cisco); los trae el usuario desde otro chat.
- Modelos: solo los de la lista del usuario (sección 5), con sus puertos. No van notebook, monitor ni patch panel.
- Cada categoría de dispositivos de red tiene un «… Empty» para crear modelos propios (nombre y puertos), que se agregan como opción de esa categoría y se pueden modificar después.
- Precio: es **del modelo**, no de cada equipo.
- **Catálogo (decisión del 11/11/2026, anotada, sin implementar):** los equipos actuales del menú (Router, Switch, Servidor… con emoji) **se reemplazan** por los modelos nuevos; no quedan como «Genéricos» (esto cambia el punto 2 de la F4A). Dentro de «Dispositivos» hay subsecciones (Routers, Switches, etc.) y dentro de cada una se eligen los modelos y su «Empty», que se configura a gusto y se guarda como modelo nuevo. Por resolver en el diseño de la F4A: cómo se ven los equipos sin modelo de proyectos viejos, qué pasa con «Cámara IP» y «Rack» (no tienen modelo nuevo; el rack se necesita en la F8) y si las secciones de finales e IoT también llevan «Empty».
- Pendiente técnico de la F4A: «Nuevo» vacía el portapapeles interno (si no, lo pegado podría apuntar a imágenes o modelos que ya no existen).

**Preguntas abiertas para el usuario (sin responder):**
1. Modelos propios: propuesta = guardarlos **dentro del proyecto** (`.json`) aunque no haya equipos colocados de ese modelo. Alternativa: en el navegador, para todos los proyectos (se pierden al cambiar de computadora o borrar datos).
2. Tipos de puerto del diálogo «Empty»: propuesta = FastEthernet, GigabitEthernet, Serial, Fibra, Consola/RS-232, USB, Coaxial, Inalámbrico, Bluetooth, 3G/4G y «Nombre libre» (un puerto con el nombre que se quiera, como «Internet»). ¿Agregar o sacar alguno?
3. Tamaño predeterminado en el plano: el usuario pidió medidas reales promedio (11/11/2026). Falta que apruebe la tabla de la sección 5 y decida qué hacer con los equipos muy chicos.
4. Orden de empezar la F4A.

## 1. Estado de las fases

| Fase | Estado |
|---|---|
| F0 Saneamiento y pruebas | Completada (28/10/2026) |
| F1 Renderizado en capas | Completada (28/10/2026) |
| F2 Núcleo de datos (tipos, formato v2, recursos, historial) | Completada (31/10/2026): 31 pruebas aprobadas, dibujo idéntico a la referencia, uso manual correcto |
| F3 Inspector y menú contextual | Completada y cerrada (01/11/2026): 46 pruebas aprobadas, dibujo idéntico, verificación manual correcta. Ajustes 1 y 2 verificados por el usuario el 11/11/2026; ajuste 3 (reglas de escaleras entre plantas) verificado el 11/11/2026 |
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
| D17 | **Catálogo de dispositivos (redefinida el 11/11/2026):** los modelos los indica el usuario (solo los que quiere, con sus puertos), definidos como datos (modelos con plantilla de puertos), no como código. Iconos SVG de diseño propio por categoría; sin imágenes de Cisco salvo que el usuario las importe en su proyecto. El precio es del modelo |
| D18 | **Mesas:** un solo tipo de mesa, con tamaño y cantidad de puestos editables y sin cambio de color (F6) |
| D19 | **Rellenos:** solo patrones predefinidos. Sin edición de grosor, espaciado, colores del patrón, orientación ni transparencia |
| D20 | **Exportar el rack:** el interior de un rack se exporta a PNG solo desde dentro de su vista, con un botón propio. El PNG del plano no incluye el interior |
| D21 | **Cable único por escaleras (01/11/2026).** Un cable que cruza plantas es UN objeto `line`. Sus puntos llevan `pl`/`cp` (planta y capa) y, si están sobre una escalera, `es`/`ed` (escalera y sentido). Los calcula la escalera: se actualizan si se mueve, gira o cambia de tamaño; si la escalera se borra, el cable se borra completo (con aviso; corrección del 11/11/2026). **Subir** solo desde una escalera de la planta actual; **bajar** solo si justo debajo hay una escalera igual (mismo tipo, lugar, tamaño y giro). Con un cable en curso, un clic sobre una escalera (también su reflejo) ofrece «Planta superior / inferior» (la inexistente, desactivada; Esc cancela; no se puede poner un punto común sobre una escalera). Cada planta muestra su mitad en sólido y la otra translúcida (opacidad .35). Borrar una planta o capa que el cable atraviesa pide confirmación y borra el cable completo, en todas las plantas (11/11/2026). Copiar toma solo el tramo de la planta actual; cortar borra el cable completo. Campos en `ESPEC` (R9); `cableAOtraPlanta` desaparece |

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
| F4 | Catálogo, imágenes y modelos (F4A catálogo, iconos y modelos propios; F4B imágenes) | F2, F3 |
| F5 | Rellenos y zonas | F2 |
| F6 | Jerarquía y mesas | F2, F3, F4 |
| F7 | Puertos, conexiones y redes | F4, F6 |
| F8 | Racks | F6, F7 |
| F9 | Longitud de cables y presupuesto | F4, F7, F8 |
| F10 | Cables superpuestos, aislar cable y filtros | F7, F9 |
| F11 | Pruebas integrales y documentación | Todas |
| F12 | Estudios y ampliaciones futuras | F11 |

Los filtros van en la F10 porque usan redes, cables y conexiones (existen desde la F7) y no deben alterar el presupuesto. Los racks van después de los puertos porque su modal permite elegir y conectar puertos. Las mesas van después del catálogo porque necesitan los equipos que se colocan encima.

### F4 — Catálogo, imágenes y modelos (plan del 11/11/2026, en dos partes)
Referencia: Packet Tracer 9.0. Decisiones del usuario en la sección 0. Antes de empezar: el usuario aprueba los iconos y entrega la lista de modelos con sus puertos.

**Lista de modelos del usuario (11/11/2026).** Puertos como grupos `{g, n, tipo, vel, pref}`: `tipo` = medio de conexión (utp, coaxial, inalámbrico, bluetooth, celular, serial, usb), `vel` = velocidad, `pref` = nombre que se ve.
- **Dispositivos de red** (cada categoría tiene además su «Empty», ver abajo):
  - Routers: Router 2911 (3 GigabitEthernet).
  - Switches: Switch 2960-24TT (24 FastEthernet + 2 GigabitEthernet).
  - Multilayer switches: Multilayer Switch 3560-24PS (24 FastEthernet + 2 GigabitEthernet).
  - Inalámbricos: Access Point-PT (1 puerto «Port0», UTP); Home Router-PT-AC (1 puerto «Internet», UTP, + 4 GigabitEthernet).
  - Seguridad: ISA-3000 (1 puerto «Management1/1», UTP, + 4 GigabitEthernet).
- **Dispositivos finales:** PC-PT (1 RS-232, 2 USB, 1 FastEthernet); Laptop (igual que la PC); Server-PT (1 FastEthernet); IP Phone (puertos «Switch» y «PC», UTP); Printer-PT (1 FastEthernet); TV-PT (1 puerto «Port0», coaxial); TabletPC-PT (Wireless0, 3G/4G Cell1, Bluetooth); SmartPhone-PT (igual que la tablet).
- **IoT** (todos con Wireless0 y Bluetooth): aire acondicionado, electrodoméstico (se dibuja como cafetera), humidificador, ventilador, caldera, termostato, luz, sirena, parlante Bluetooth, detector de CO₂, detector de CO, monitor de humedad, monitor de humedad y temperatura, monitor de temperatura, detector de humo, detector de movimiento, Smart TV. (El desagüe se quitó el 11/11/2026 a pedido del usuario.)
- No van: notebook, monitor, patch panel ni modelos que el usuario no indicó.
- **Aspecto (referencia del usuario, 11/11/2026):** cada equipo se dibuja como una ilustración del aparato (no un cuadrado con símbolo), al estilo de Packet Tracer pero con dibujos de diseño propio (sin copiar los de Cisco). **Los iconos los rehace el usuario en otro chat y los trae**; `js/iconos.js` contendrá esos dibujos. Debajo, dos líneas: el modelo (p. ej. «2911») y el nombre del equipo, que se asigna solo con un contador por tipo («Router1», «Switch4», «IoT21») y se puede editar. Tamaños predeterminados distintos por modelo (p. ej. el aire acondicionado más grande).

**Tamaño predeterminado de cada modelo (pedido del 11/11/2026; valores propuestos, pendientes de aprobación).** Medidas reales promedio en metros, `w × h` como los equipos actuales (hoy todos 0,8 × 0,8). Regla: lo que apoya en piso, mesa o rack usa su planta (ancho × fondo); lo que va en pared o techo usa la cara que se ve (ancho × alto). El icono se dibuja dentro de ese rectángulo sin deformarse. Editable por equipo.

| Modelo | w × h (m) | Modelo | w × h (m) |
|---|---|---|---|
| Router 2911 | 0,44 × 0,30 | Humidificador | 0,20 × 0,20 |
| Switch 2960-24TT | 0,45 × 0,24 | Ventilador (de techo) | 1,20 × 1,20 |
| Multilayer 3560-24PS | 0,45 × 0,30 | Caldera (radiador) | 0,80 × 0,60 |
| Access Point-PT | 0,22 × 0,22 | Termostato | 0,12 × 0,09 |
| Home Router-PT-AC | 0,23 × 0,16 | Luz (foco) | 0,06 × 0,11 |
| ISA-3000 | 0,11 × 0,13 | Sirena | 0,10 × 0,15 |
| PC-PT (con monitor) | 0,50 × 0,45 | Parlante Bluetooth | 0,10 × 0,18 |
| Laptop | 0,36 × 0,25 | Detector de CO₂ / CO / humo | 0,12 × 0,12 |
| Server-PT (torre) | 0,22 × 0,50 | Monitores de humedad / temperatura | 0,12 × 0,09 |
| Printer-PT | 0,42 × 0,38 | Detector de movimiento | 0,07 × 0,11 |
| IP Phone 7960 | 0,27 × 0,21 | TV-PT y Smart TV (50″) | 1,10 × 0,65 |
| TabletPC-PT | 0,25 × 0,17 | Aire acondicionado (de ventana) | 0,60 × 0,40 |
| SmartPhone-PT | 0,07 × 0,15 | Electrodoméstico (cafetera) | 0,20 × 0,25 |

«Empty»: 0,44 × 0,30 (equipo de rack). Rack (`iconos/rack.svg`, agregado y aprobado el 11/11/2026; no figura en `vista-previa.png`): hoy mide 0,8 × 1; la planta real de un rack de piso es 0,60 × 1,00. «Genérico»: sigue en 0,8 × 0,8 para que los proyectos viejos se vean igual. **Aviso:** a escala real los equipos chicos (teléfono, detectores, foco) miden menos de 15 cm y en un edificio entero casi no se ven sin acercar; las dos líneas de texto de abajo necesitan un tamaño mínimo propio (a decidir en el diseño de la F4A).

**«Empty» por categoría de red (pedido del 11/11/2026).** Cada categoría de dispositivos de red (routers, switches, multilayer, inalámbricos, seguridad) tiene siempre un «… Empty». Al pulsarlo se abre un diálogo para poner nombre y grupos de puertos (cantidad, tipo, nombre); al guardar, el modelo nuevo aparece como opción más en esa categoría y se puede modificar después. Si ya hay equipos colocados de ese modelo, guardar cambios los actualiza en un solo paso que se puede deshacer (por dentro: versión nueva del modelo y cambio de `o.modelo` en `S`).

**F4A — Catálogo, iconos, modelos propios.** Archivos nuevos `js/catalogo-pt.js` (solo datos: la lista de arriba), `js/iconos.js` (los iconos que trae el usuario) y `js/modelos.js` + `css/modelos.css` (diálogo de los «Empty»). Se tocan `catalogo.js`, `dibujo.js`, `inspector.js`, `recursos.js`, `esquema.js`, `archivos.js`, `index.html`, `pruebas.js`.
1. Al colocar un equipo del catálogo, su plantilla se copia una sola vez a `R.modelos` (`m1`, `m2`…) y el objeto guarda `modelo`: el proyecto queda completo aunque el catálogo cambie.
2. Pestaña «Dispositivos» con buscador (con retardo), categorías desplegables y lista; se reconstruye solo al buscar, cambiar de categoría o crear un modelo, nunca al mover el ratón. ~~Los equipos actuales quedan como «Genéricos»~~ → el usuario decidió reemplazarlos por los modelos nuevos (sección 0); falta definir cómo se ven los proyectos viejos.
3. Dibujo: un equipo con modelo usa el icono de su modelo con su nombre corto; sin modelo, como hasta ahora.
4. «Empty» y modelos propios según lo de arriba (alta y edición; la baja avisa cuántos equipos lo usan).
5. Datos del **modelo**: fabricante, descripción, precio unitario y moneda; se ven y editan en la sección «Modelo» del inspector. La cantidad la cuenta la F9.
6. Campos nuevos en `ESPEC` (R9): en el modelo `desc`, `precio`, `moneda`, `orig` (clave en el catálogo o «propio»).
7. «Nuevo» vacía el portapapeles interno.
8. Pruebas: cada modelo del catálogo pasa `ESQ.leer`; colocar copia el modelo una sola vez y ningún snapshot contiene `data:image`; crear, editar y borrar un modelo propio (con equipos colocados: un paso deshacible); ida y vuelta de archivo; un proyecto viejo se dibuja idéntico; el menú no se reconstruye al mover el ratón.

**F4B — Imágenes.** Se tocan `inspector.js`, `dibujo.js`, `recursos.js`, `archivos.js`, `modelos.js`, `pruebas.js`.
1. Importar PNG/JPEG/WebP (sin SVG) con los límites de `R`; se asigna a un modelo o a un equipo. Cada equipo muestra su imagen o, si no tiene, su icono.
2. El PNG exportado muestra las imágenes; guardar y abrir conserva imágenes y modelos; ningún snapshot contiene `data:image`.
3. Pruebas de imágenes en archivo y PNG.

Fuera de la F4: los tipos de conexión de Packet Tracer (consola, cruzado, serial DCE/DTE, USB…) van con los cables en la F7; los puertos se definen aquí pero se conectan en la F7.

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

## 7. Ajustes posteriores a la F3 (verificados por el usuario el 11/11/2026)

**Resultados automatizados (Chrome 131 sin interfaz, `index.html?pruebas=1` → «Ejecutar pruebas»):** 60 aprobadas, 0 fallidas, sin errores de página; dibujo idéntico a la referencia del código original; sin regresión de rendimiento (3000 objetos). Las pruebas con ratón y teclado simulados **no sustituyen** la comprobación manual. No se probó en Firefox, Safari ni pantallas táctiles.

**Ajuste 1 — menú contextual (01/11/2026): verificado (11/11/2026).** Cambio respecto a lo aprobado: antes no había menú en el fondo vacío y existía «Duplicar»; ahora:
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

**Ajuste 2 — cable único por escaleras (01/11/2026): verificado (11/11/2026), tras la corrección (d).** Con la herramienta de cable y un cable en curso, un clic sobre una escalera (recta, con descanso o espiral; también su reflejo) abre «Planta superior / Planta inferior». Al elegir, el cable recorre la escalera (recto: sube por un lado, da la vuelta por el descanso y baja por el otro; o en espiral), la vista pasa a esa planta y se sigue dibujando desde la salida. Es **un solo objeto**: un paso de historial al terminarlo; borrarlo borra todo el recorrido; deshacer lo restituye. Decisiones del usuario: el menú muestra siempre las dos opciones; el recorrido sigue a la escalera si se mueve, gira o cambia de tamaño, y si se borra la escalera se borra el cable completo, con aviso previo (cambiado el 11/11/2026); copiar toma solo el tramo de la planta actual y cortar borra el cable completo.

Correcciones aplicadas tras probarlo: (a) regla de bajar (D21); (b) el recorrido va a un costado de la flecha (0,13 m) y el que baja usa otro carril que el que sube; (c) en la espiral, el cable entra y sale por el cuarto abierto, en línea recta, sin atravesar la pared curva; sube por dentro del anillo de la flecha y baja por fuera. Un «ajuste 3» de las flechas del descanso se pidió y luego se **deshizo**: se conserva el comportamiento anterior. (d) **11/11/2026**, tras la prueba manual del usuario: al borrar una escalera los puntos libres conservaban la planta de arriba y ese tramo se veía translúcido. A pedido del usuario: borrar una escalera que cruzan cables pide confirmación y, si se acepta, borra esos cables completos (un solo paso de historial; cancelar no cambia nada). Borrar una planta o capa que un cable atraviesa también lo borra completo, en todas las plantas. Archivos: `historial.js` (`borrar`), `trazas.js` (`podarCables`, `cruzaEn`), `plantas.js` (textos del aviso), `pruebas.js` (2 pruebas actualizadas).

Comprobaciones manuales pendientes:
1. Dibujar un cable, hacer clic sobre cada tipo de escalera y elegir subir; repetir bajando (con 3 plantas). En cada planta, su mitad se ve en sólido y la otra translúcida.
2. El cable sigue en la planta nueva desde la salida de la escalera. Esc cancela el clic sin cambiar nada.
3. Agarrar el cable dentro de la escalera; Supr lo borra completo (en ambas plantas); Ctrl+Z lo restituye.
4. Mover, girar y cambiar el tamaño de la escalera (asas e inspector): el recorrido la sigue. **Falló el 11/11/2026 y se corrigió (d):** borrar una escalera con cables pide confirmación; Cancelar no cambia nada; Aceptar borra la escalera y los cables completos; Ctrl+Z restituye todo.
5. Capas ocultas o bloqueadas en cada planta; guardar, abrir y exportar PNG con un cable así; deshacer y rehacer.
6. Borrar una planta o capa que contenga una parte del cable: aviso de confirmación y el cable se borra completo, también en las otras plantas. Copiar y cortar un cable que atraviesa plantas.
7. Cables normales, paredes, imanes y nodos siguen igual.
8. Regla de bajar (solo con una escalera igual justo debajo; si no, la opción aparece desactivada con el motivo), carriles junto a las flechas y espiral por el cuarto abierto.

**Ajuste 3 — escaleras compatibles entre plantas (11/11/2026): verificado por el usuario (11/11/2026).** Pedido del usuario antes de la F4.
- `escaleraObstruida` (`escaleras.js`) mira la planta de abajo, la misma planta y la de arriba (no se compara consigo misma). Misma planta: dos escaleras no pueden pisarse (tocarse por el borde sí). Planta vecina: si se pisan y alguna es recta, no; si son de distinto tipo, no; con descanso o espiral del mismo tipo, solo exactamente alineadas (mismo lugar, tamaño y giro).
- Se valida al colocar, pegar, girar (menú y tecla R, que ahora usa `TR.acc.rotar`), editar en el inspector y **al soltar** un arrastre (mover, asas o asa ↻): si queda mal, todo vuelve a como estaba, con aviso y sin paso de historial (`revisarEscalerasMovidas`).
- Decisión del usuario: una escalera apilada se puede mover sola (no se bloquea ni arrastra a las otras); solo se rechaza si queda pisando a otra sin cumplir la regla. Los cables que la cruzan la siguen.
- Con la herramienta de escalera activa, o mientras se arrastra una, se ven en `#g-tmp` (no sale en el PNG) los contornos punteados de las escaleras de la planta de abajo (azul, «↓») y de arriba (naranja, «↑»), con el nombre de la planta. El imán `encajarAbajo` también encaja con una igual de la planta de arriba.
- Archivos: `escaleras.js`, `interaccion.js` (al soltar), `dibujo.js` (`renderTmp`), `controles.js` (tecla R), `acciones.js` (pegar no se compara con el original), `colocar.js` (comentario), `pruebas.js` (1 prueba nueva; la de colocar con dos puntos separa las piezas porque ya no pueden pisarse).
- Un proyecto guardado con escaleras que ya no cumplen se abre igual; esas escaleras no se pueden mover a otro lugar inválido.
- **Corrección (11/11/2026, tras la prueba del usuario):** un cable que baja usando la escalera de ARRIBA (con una igual justo debajo) guarda su recorrido en la escalera de arriba; al mover la de abajo, el tramo inferior quedaba dibujado donde ya no había escalera. Ahora `cablesSinApoyo` (`trazas.js`) detecta esos cables: mover o girar la escalera de arriba o la de abajo de forma que abajo ya no quede una igual se rechaza con el aviso «un cable baja por esta escalera y abajo no quedaría una escalera igual para recibirlo» (lo usa `escaleraObstruida`, así que vale al arrastrar, girar y editar en el inspector). Borrar la escalera de abajo pide confirmación y borra esos cables completos, como al borrar la de arriba.
- ~~No cubierto: reordenar plantas~~ → resuelto en las correcciones de la revisión (abajo).

**Correcciones de la revisión thermo del commit `cda924b` (11/11/2026): verificadas por el usuario (11/11/2026).**
- Durante un arrastre no actúa ninguna tecla (antes R o Supr agregaban pasos en medio y el «volver atrás» restauraba un estado equivocado).
- Una sola regla de qué cables se borran enteros: `cablesAfectados` (`trazas.js`), usada al borrar objetos, plantas y capas. Cubre el caso de borrar una capa que tiene la escalera de abajo mientras los puntos del cable están en otra capa.
- Los cables que ya estaban sin escalera abajo (archivos viejos) ya no bloquean mover otras escaleras: solo cuenta lo que el cambio rompe (`pierdenApoyo`).
- `escaleraObstruida(t, ver, verAntes)` valida el estado FINAL: girar o editar varias escaleras juntas las compara ya cambiadas (antes, R rechazaba giros válidos). Separada en `superpuesta` y `apoyoPerdido`.
- Arrastres: `arrastrar()` guarda qué objetos cambian, copia previa de sus escaleras y el rehacer; `soltarArrastre()` revisa al soltar **y al cancelar el puntero**; `descartarPaso()` (`historial.js`) vuelve atrás sin perder el rehacer. Límite conocido: si el historial está lleno (100 pasos), el paso más viejo descartado al empezar el arrastre no se recupera.
- Cortar con la confirmación cancelada no toca el portapapeles; `borrar()` devuelve si borró.
- **Reordenar plantas (▲ ▼ o ⠿) o borrar una del medio** se valida (`cambioDePlantas`): si deja juntas escaleras incompatibles o un cable que baja sin escalera igual abajo, se rechaza con aviso y sin paso de historial. Las capas se reordenan sin validar (no cambian vecinas).
- Menores: `encajarAbajo` → `encajarVecina`; helper `puntosPoly`; pegar ya no usa `id: -1`; pruebas con `conConfirm` y `arrastreSim` (simula el arrastre real).
- Decisión del usuario: una escalera apilada con un cable que baja no se puede mover sin borrar antes el cable (un cable no puede bajar si no tiene por dónde).
- Pruebas: 63 casos, 62 aprobados (falla solo el dibujo de referencia, ausente en ese navegador). Además, un arrastre real con eventos de puntero: inválido → vuelve con aviso; a un lugar libre → se mueve con un paso de historial.

Comprobaciones manuales pendientes:
1. Arrastrar una escalera y, sin soltar, apretar R, Supr o Ctrl+Z: no hacen nada.
2. Girar con R dos escaleras rectas una al lado de la otra: se giran juntas.
3. Borrar una capa que solo tiene la escalera de abajo de un cable que baja: aviso y el cable se borra entero.
4. Cortar una escalera con cables y cancelar: no se borra y el portapapeles sigue con lo de antes.
5. Hacer Ctrl+Z, después un arrastre inválido: Ctrl+Y sigue rehaciendo.
6. Reordenar plantas o borrar una del medio de modo que queden juntas escaleras incompatibles: aviso y no cambia nada. Sin conflicto: se reordena normal.

Comprobaciones manuales pendientes:
1. Con la herramienta de escalera en una planta del medio: se ven los contornos de arriba (naranja) y de abajo (azul).
2. Colocar una escalera que pisa otra de la misma planta: aviso y no se coloca.
3. Colocar en la planta de abajo una escalera debajo de una recta de arriba, o de otro tipo, o desalineada: aviso y no se coloca. Alineada con una igual (descanso o espiral): sí.
4. Arrastrar, redimensionar con asas o girar (↻ y tecla R) una escalera apilada hasta pisar mal: al soltar vuelve a su lugar, con aviso, sin paso de historial. Llevarla a un lugar libre: queda ahí y sus cables la siguen.
5. Pegar una escalera encima de la original: se rechaza. Exportar PNG con la herramienta activa: no salen los contornos.
6. Mandar un cable hacia abajo por una escalera con descanso (o espiral) apilada; mover, girar o redimensionar la de abajo o la de arriba: aviso y vuelve a su lugar. Borrar la de abajo: aviso y el cable se borra completo; Ctrl+Z lo restituye.

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

**Pruebas (`js/pruebas.js`, `?pruebas=1`, botón «Ejecutar pruebas»):** 63 casos (31 de F0 a F2B, 17 de la F3, 13 del cable por escaleras, 1 de escaleras entre plantas y 1 de la revisión del 11/11/2026). Usan proyectos de prueba (`fVacio`, `fDispositivos`, `fParedes`, `fFormas`, `fEscaleras`, `fCapas`, `fCruce`, `fDup`, estrés) con `conProyecto(...)`, que restaura el estado de la página al terminar. Para pruebas nuevas, seguir ese patrón y no dejar pasos en el historial del usuario.
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
- 11/11/2026: icono del rack agregado (`iconos/rack.svg`) y aprobado por el usuario.
- 11/11/2026: el usuario aprobó los iconos de `iconos/` (commit `5e5599d`). Decisión anotada: los equipos actuales del menú se reemplazan por los modelos nuevos, con subsecciones y «Empty» (sección 0).
- 11/11/2026: `iot-luz.svg` redibujado como foco; tabla de tamaños reales por modelo agregada a la sección 5 (propuesta, sin código).
- 11/11/2026: iconos generados en `iconos/` (33 SVG + vista previa) a partir de una captura de referencia del usuario; revisados solo en una captura de Edge sin interfaz. Pendiente: aprobación del usuario. Sin cambios de código.
- 11/11/2026 (cierre de sesión): el usuario rehará los iconos en otro chat; los diseños mostrados en esta sesión no se guardan. Sección 0 reescrita para continuar en otro chat.
- 11/11/2026: el usuario entregó la lista de modelos y pidió un «Empty» por categoría de red; plan de la F4 ajustado (el editor de modelos pasa a la F4A) e iconos nuevos presentados.
- 11/11/2026: revisión thermo del commit `cda924b` y sus correcciones (más validar reordenar y borrar plantas). 62/63 pruebas; verificadas por el usuario el mismo día.
- 11/11/2026: el usuario verificó el ajuste 3 y su corrección. Decisiones de la F4 (iconos propios, lista de modelos del usuario, precio por modelo) y plan F4A/F4B escritos; diseños de iconos presentados.
- 11/11/2026: corrección del ajuste 3: un cable que baja impide mover las escaleras que lo sostienen; borrar la de abajo borra el cable con aviso. 61/62 pruebas en el navegador integrado; pendiente de verificación manual.
- 11/11/2026: ajuste 3 de escaleras (reglas con plantas vecinas y misma planta, validación al soltar, contornos). 60/61 pruebas en el navegador integrado; pendiente de verificación manual.
- 11/11/2026: el usuario verificó la sección 7 completa (ajustes 1 y 2 y corrección (d)).
- 11/11/2026: corrección 4 del ajuste 2 (borrar escalera, planta o capa borra completos los cables que la atraviesan, con aviso). 59/60 pruebas en el navegador integrado; pendiente de verificación manual.
- 11/11/2026: documento limpiado: se quitaron repeticiones, historial de pruebas intermedias y detalles de implementación ya resueltos. No se modificó código ni el estado de verificación de ninguna comprobación.
