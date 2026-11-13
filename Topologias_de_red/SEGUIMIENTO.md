# Seguimiento – Topologias_de_red

Editor web de topologías de red y planos de edificios (HTML + CSS + JavaScript + SVG, sin servidor ni framework). Se abre `index.html` en el navegador; `index.html?pruebas=1` abre además el panel de pruebas. Los scripts se cargan en el orden de `index.html` y comparten variables globales. Todas las coordenadas del modelo están en **metros**.

> **Última actualización: 13/11/2026** (F6 completada y verificada por el usuario; siguiente: F7, sin empezar; ver sección 0).
> **Regla de mantenimiento:** al terminar una fase, o al avanzar dentro de la fase en curso, se actualiza este documento (qué se hizo, resultados reales de las pruebas, qué falta y cuál es el siguiente paso).

## 0. Resumen para retomar (leer primero)

**Dónde estamos (13/11/2026):**
- F0 a F4 completadas y verificadas por el usuario (la F4B se verificó el 13/11/2026 y está commiteada en `5a085ca`, rama `branch_branch`).
- **F5 (rellenos y zonas): postergada por decisión del usuario (13/11/2026).** Su plan se conserva en la sección 5. Ninguna otra fase depende de ella.
- **F6 (jerarquía y mesas): completada y verificada por el usuario (13/11/2026), sin commitear.** Detalle en la sección 5.
- Pruebas: 84 de 85 en el navegador integrado. La única que falla es «el dibujo es idéntico a la referencia», porque la referencia vive en el `localStorage` del navegador del usuario (sección 8).

**Qué hacer al retomar (en este orden):**
1. Los archivos están en la carpeta del proyecto. No hay acceso al navegador del usuario: nada se da por probado si no lo ejecutó él o no se ejecutó realmente.
2. Leer las secciones 0, 1, 3, 4, 6 y 8, y de la 5 la fase que toque.
3. Preguntar al usuario si ya commiteó la F6 (lo hace él; preguntar antes de hacerlo).
4. **No empezar ninguna fase sin que el usuario diga cuál sigue.** La F5 está postergada; la siguiente en el plan es la F7 (puertos, conexiones y redes). Antes de escribir código: presentar el diseño y esperar la orden.
5. Al terminar cada avance: actualizar este documento (qué se hizo, resultados reales separando pruebas simuladas y manuales, qué falta, siguiente paso).

**Pendiente:**
- Commit de la F6 (lo hace el usuario). La regla de mesas superpuestas no pasó por la revisión thermo.
- Confirmar el tamaño del texto bajo los equipos (0,28 m fijo: queda grande al lado de un equipo de 0,30 m).
- Verificaciones menores que no bloquean: abrir un `.json` dañado y comprobar que el proyecto no cambia; deshacer justo después de abrir un archivo.

## 1. Estado de las fases

| Fase | Estado |
|---|---|
| F0 Saneamiento y pruebas | Completada (28/10/2026) |
| F1 Renderizado en capas | Completada (28/10/2026) |
| F2 Núcleo de datos (tipos, formato v2, recursos, historial) | Completada (31/10/2026) |
| F3 Inspector y menú contextual | Completada (01/11/2026); ajustes posteriores verificados el 11/11/2026 (sección 7) |
| F4 Catálogo, imágenes y modelos | Completada y verificada (F4A 12/11/2026, F4B 13/11/2026) |
| F5 Rellenos y zonas | **Postergada por el usuario (13/11/2026)** |
| F6 Jerarquía y mesas | Completada y verificada (13/11/2026) |
| F7 a F12 | No iniciadas (sección 5) |

## 2. Archivos del proyecto

| Ruta | Contenido |
|---|---|
| `index.html` | Barra superior, menú izquierdo, área de trabajo con reglas, panel de plantas, inspector, barra de estado y aviso de «Nuevo». Carga las pruebas solo con `?pruebas=1` |
| `css/` | `base`, `barra`, `menu`, `lienzo`, `plantas`, `dialogo`, `inspector`, `contexto`, `modelos` |
| `iconos/` | 34 SVG de dibujo propio (`viewBox` 96×96) y `vista-previa.png`. **Para cambiar un dibujo:** editar su SVG y correr `node iconos/generar.js` desde `Topologias_de_red` (regenera `js/iconos.js`) |
| `js/estado.js` | Estado global (`S`, `V`, `tool`, `sel`, `tmp`, `drag`…) y utilidades (`byId`, `pt`, `toW`, `fmt`, `T`, `itemAt`) |
| `js/eventos.js` | Namespace `TR`: `TR.stats` (contadores del render) y `TR.ui`. Obligatorio: aloja `TR.acc`, `TR.insp`, `TR.ctx`, `TR.mod`, `TR.img` |
| `js/tipos.js` | Tipo estable por objeto: `tipo` (pared, cable, dispositivo, rack, escalera, ascensor, ventana, puerta, forma, zona, texto, medida, imagen, mesa) y `sub`. `derivarTipo` es el único lugar donde un nombre visible se traduce a tipo. Predicados `esPared`, `esCable`, `esEscalera`, `esAscensor`, `esImagen`, `esMesa`, `esCirculo`. Escaleras: variante en `o.t` (sin `t` = recta, `descanso`, `espiral`) |
| `js/recursos.js` | Almacén `R` fuera de `S` y del historial: `R.imgs` (id por hash; PNG/JPEG/WebP validados por sus bytes; 5 MB por imagen, 50 MB por proyecto, 8 000 px por lado, 40 M de píxeles) y `R.modelos` (plantillas versionadas) |
| `js/esquema.js` | Formato v2: `ESQ.leer` (valida con lista blanca, sanea y migra v1 → v2 sin tocar `S` ni `R`) y `ESQ.serializar`. Todo campo nuevo se registra en `ESPEC` (R9). `ESQ.campoModelo`, `ESQ.CTRL` y `ESQ.LIM` son la única definición de qué es válido en un modelo |
| `js/iconos.js` | `ICONOS`: dibujos de los modelos. **Generado** por `iconos/generar.js`; no editar a mano |
| `js/catalogo-pt.js` | Solo datos: `CATS` (subsecciones de «Dispositivos») y `PT` (plantillas de los modelos: `orig`, `corto`, `pre`, tamaño, puertos) |
| `js/catalogo.js` | Catálogo del menú izquierdo (`CAT`), `SH` (vértices de formas), `menu()`, `setTool()`. Pestaña «Dispositivos»: buscador y subsecciones (`listaDisp`); `menuSiCambio()` rehace el menú si cambió `S.propios`. Una entrada con `accion` no es herramienta: se ejecuta al pulsarla («Imagen…») |
| `js/dibujo.js` | `draw()` por objeto y render en capas: `#vp` > `#g-grilla`, `#c` (objetos; lo que exporta el PNG), `#g-tmp` (lo temporal). `render()`, `repintarMovimiento()`, `status()`. `modeloDe`, `iconoDe`, `imagenDe`, `ordDe` |
| `js/historial.js` | Deshacer, rehacer, borrar. Interfaz `Hist` con estrategia intercambiable (snapshots de `S`, tope de 100 pasos y 50 M de caracteres, sin duplicar pasos idénticos). `descartarPaso()` |
| `js/plantas.js` | Plantas y capas (ocultar, bloquear, jerarquía con ▲ ▼ o arrastrando ⠿), `esVisible` / `esEditable`, `normalizar()` |
| `js/escaleras.js` | Escalera recta, con descanso y espiral; reflejo de la planta de abajo; reglas de colocación entre plantas; cambio de planta desde la flecha |
| `js/trazas.js` | Cable único que atraviesa escaleras (D21): planta y capa por punto (`plantaDe`, `puntoEn`, `esMultiplanta`…), geometría (`trazaEscalera`), `escaleraEn`, `menuEscalera` / `cruzarEscalera`, `sincronizarTrazas`, `cablesAfectados`, `podarCables`, `dibujarCableMP` |
| `js/formas.js`, `js/puertas.js`, `js/rotacion.js`, `js/seleccion.js` | Formas (8 asas, lados, vértices, medidas), puertas sobre paredes, rotación (asa ↻ o R) y redimensionado con giro (`redimensionarRot`, `redimProporcional`), selección múltiple y por rectángulo |
| `js/iman.js`, `js/nodos.js`, `js/medidas.js`, `js/reglas.js`, `js/rejilla.js` | Imanes (puntas, centros, puntos medios), nodos de líneas del mismo tipo, cotas, reglas en metros y grilla |
| `js/colocar.js` | Escaleras y formas con dos puntos (esquinas opuestas; círculo y espiral = centro y radio) |
| `js/interaccion.js` | Ratón: colocar, mover, dibujar, medir, zoom, desplazar; arrastres (`arrastrar`, `soltarArrastre`); doble clic detectado a mano; clic derecho; `add()` asigna el tipo |
| `js/controles.js` | Teclado (sección 8), color / relleno / tipo de línea (usan `TR.acc.fijar`), grilla, imán medio, tamaño del edificio, unidad |
| `js/acciones.js` | `TR.acc`: registro único de **campos** (`registrarCampo`) y **acciones** (`registrar`) por tipo. `fijar(ids, campo, valor, gesto)` cambia un campo con un solo paso de historial y valida. También `rotar`, `copiar`, `cortar`, `pegar` (portapapeles interno), `eliminar`, `ejecutar`, `paraMenu`, `paraInspector`, `sinColor` |
| `js/inspector.js` | `TR.insp`: panel derecho `#insp` con secciones contraíbles. Reconstruye su DOM solo si cambia la firma de la selección; se refresca desde `renderPaneles()`, nunca al mover el ratón. Botón ⚙️ en la barra; en ≤760 px es un cajón |
| `js/modelos.js` | `TR.mod`: `equipo()` (objeto nuevo con su modelo y nombre con contador), diálogo de modelos propios (`abrir`, `guardar`, `borrarModelo`), sección «Modelo» del inspector |
| `js/imagenes.js` | `TR.img`: selector de archivos (`elegir`, `cargar`), `ponerEquipo` / `quitarEquipo`, `ponerModelo`, `colocar` (imagen suelta), sección «Imagen» del inspector y entradas `img-poner` / `img-quitar` del menú contextual |
| `js/jerarquia.js` | `TR.jer` (F6): mesas y equipos anclados. `sincronizar` (lo llama `renderObjetos`), `problema` (reglas de tamaño y puestos), `mesaEn`, `anclar`, `alSoltar`, `alSoltarArrastre`, `sinHijos` (R6), `hijosDeIds` (R7), `dibujar`. Registra el campo «Puestos» y la mesa en `sinColor` |
| `js/contexto.js` | `TR.ctx`: menú contextual `#ctx`. Teclado: flechas, Home/End, Enter, Esc, Tab |
| `js/archivos.js` | Guardar y abrir `.json` v2 (`abrirTexto` no toca nada si el archivo es inválido), exportar PNG (`construirSvgExport`), «Nuevo» |
| `js/main.js` | Arranque (se carga el último) |
| `js/pruebas.js` | Solo con `?pruebas=1`: panel de pruebas, proyectos de prueba, referencia de dibujo, medición de rendimiento y pruebas de las fases 0 a 3. Expone sus utilidades en `TRP.util` |
| `js/pruebas-f4.js` | Solo con `?pruebas=1`, después de `pruebas.js`: pruebas de la Fase 4. Cada fase nueva lleva su propio archivo de pruebas |
| `js/pruebas-f6.js` | Solo con `?pruebas=1`, después de `pruebas-f4.js`: pruebas de la Fase 6 |

## 3. Decisiones

| N.º | Decisión |
|---|---|
| D1 | **Conexiones lógicas ligadas a la ruta física.** `S.conex`: cada conexión guarda origen y destino `{d: dispositivo, p: puerto}` y la lista ordenada `rutas` de líneas. La línea es solo geometría; la conexión conserva su `id` aunque cambie el recorrido. Las que tienen extremos sin definir son **incompletas**. Los tramos entre plantas se unen a la conexión existente, sin duplicar |
| D2 | **Jerarquía.** Campo `parent`. Hijos con posición absoluta sincronizada (`x`, `y`, `rot`). Mesas: el hijo guarda `puesto` y `lrot`, **no** `lx`/`ly` (cambio del 13/11/2026: la posición sale del puesto, así se reparte sola al redimensionar o cambiar los puestos y nunca queda desactualizada). Racks: `ru:{u,h}`. El hijo hereda `pl` y `cp` del padre |
| D3 | **Recursos fuera del historial.** Almacén `R` (imágenes por hash y modelos); se guarda con el proyecto; los recursos sin uso se descartan al guardar (salvo los modelos propios, que se conservan) |
| D4 | **Historial.** Snapshots de `S` con tope en pasos y en bytes; estrategia intercambiable |
| D5 | **Vista de rack.** Modal con su propio SVG sobre el mismo `S` (usa `push()`, deshacer/rehacer y atajos globales) |
| D6 | **Formato v2** con validación por lista blanca y migración automática desde v1 (hecho) |
| D7 | **Renderizado** en capas independientes, sin framework (hecho) |
| D8 | **Inspector:** aside derecho con secciones contraíbles; `#plantas` se conserva (hecho) |
| D9 | **Menú contextual:** clic derecho solo sin herramienta activa ni operación en curso. Cada fase registra sus entradas por tipo. Sobre un objeto: cortar, copiar, pegar y eliminar (no hay «Duplicar»). En el fondo vacío: volver atrás, adelante y pegar (hecho) |
| D10 | **Filtros:** estado visual `F` fuera de `S` y del historial; ocultar / atenuar / aislar; no tocan `esVisible`, imanes, conexiones ni presupuesto; «Mostrar todo» los quita. Las redes/VLAN son lógicas y no se mezclan con las capas del editor |
| D11 | **Longitud de cables:** ruta completa + tramos verticales por altura de plantas + holgura configurable. Se distingue la longitud medida de la estimación de instalación |
| D12 | **Presupuesto:** precios por modelo y por metro de cable, moneda, cantidades y holgura; CSV primero (separador `;`, BOM UTF-8, coma decimal) |
| D13 | **Zonas y rellenos:** zonas rectangulares por dos puntos con imán a esquinas y extremos de paredes; rellenos sólidos y patrones predefinidos. Detección de habitaciones cerradas: F12 |
| D14 | **Tipo estable** (`tipo`, `sub`) en cada objeto (hecho) |
| D15 | **Escaleras con color desvanecido:** NO implementado (el reflejo de abajo usa opacidad fija .6). Se hará solo al final |
| D16 | **Color del cable:** no se puede cambiar desde ningún lugar. Cada cable usa siempre el color de su tipo. Los archivos antiguos conservan el color con que se guardaron. Las paredes siguen siendo coloreables |
| D17 | **Catálogo de dispositivos:** solo los modelos que indica el usuario, definidos como datos (`js/catalogo-pt.js`), no como código. Iconos SVG de diseño propio, sin material de Cisco. El precio es del modelo, no de cada equipo. No van notebook, monitor ni patch panel (hecho) |
| D18 | **Mesas:** un solo tipo de mesa, con tamaño y cantidad de puestos editables y sin cambio de color. Un equipo puede ser más grande que su puesto solo si entra en la mesa (largo y fondo) y la suma de los largos de sus equipos no supera el de la mesa. Borrar una mesa con equipos pide confirmación (F6, hecho) |
| D19 | **Rellenos:** solo patrones predefinidos. Sin edición de grosor, espaciado, colores del patrón, orientación ni transparencia |
| D20 | **Exportar el rack:** el interior de un rack se exporta a PNG solo desde dentro de su vista, con un botón propio. El PNG del plano no incluye el interior |
| D21 | **Cable único por escaleras.** Un cable que cruza plantas es UN objeto `line`. Sus puntos llevan `pl`/`cp` (planta y capa) y, si están sobre una escalera, `es`/`ed` (escalera y sentido). Los calcula la escalera: se actualizan si se mueve, gira o cambia de tamaño. **Subir** solo desde una escalera de la planta actual; **bajar** solo si justo debajo hay una escalera igual (mismo tipo, lugar, tamaño y giro). Borrar la escalera, la planta o la capa que el cable atraviesa pide confirmación y borra el cable completo, en todas las plantas. Copiar toma solo el tramo de la planta actual; cortar borra el cable completo (hecho; detalle en la sección 7) |

## 4. Arquitectura y reglas de coherencia

- **`S`** (proyecto; entra en el historial): `edificio`, `unidad`, `plantas`, `objs`, `propios` (ids de los modelos propios que ofrece el menú), y desde las fases siguientes `conex`, `redes`, `presupuesto`.
- **`R`** (recursos; fuera del historial): `imgs` y `modelos`. Los puertos predeterminados vienen de la plantilla del modelo (grupos `{g, n, tipo, vel, pref}`); la instancia solo guarda sobrescrituras (`po`) e interfaces (`ifs`). Los ids de puerto son `grupo:índice` (p. ej. `g0:12`). Editar nombre o puertos de una plantilla crea una versión nueva (`v + 1`, `base`) y pasa a ella los equipos colocados, en un paso deshacible.
- **Estado de interfaz** (fuera de `S` y de `R`): `V`, `sel`, `multi`, `tool`, `tmp`, `drag`, filtros `F`, estado del inspector y del menú contextual.
- **Campos por objeto de la jerarquía:** mesa `puestos`; equipo sobre una mesa `parent`, `puesto`, `lrot` (F6). Fases siguientes: dispositivo `po`, `ifs`, `ru`. Conexión `{id, a:{d,p}|null, b:{d,p}|null, rutas, sub, red, etqA, etqB, holgura}`; sin ruta = conexión lógica con longitud estimada.
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
| Media | Plantillas editadas después de usarse | Plantillas versionadas; actualizar es explícito y deshacible |
| Media | Doble dirección línea ↔ conexión | Funciones explícitas de sincronización y pruebas (F7) |

## 5. Plan de fases

Cada fase deja la aplicación usable y no elimina funciones. Cada fase que añada campos los registra en `ESPEC` (R9) y suma sus entradas al menú contextual. Antes de cada fase se informan archivos y pruebas; al cerrarla se actualiza este documento.

| Fase | Contenido | Depende de |
|---|---|---|
| F4 | Catálogo, imágenes y modelos (hecha) | F2, F3 |
| F5 | Rellenos y zonas (**postergada**) | F2 |
| F6 | Jerarquía y mesas (hecha) | F2, F3, F4 |
| F7 | Puertos, conexiones y redes | F4, F6 |
| F8 | Racks | F6, F7 |
| F9 | Longitud de cables y presupuesto | F4, F7, F8 |
| F10 | Cables superpuestos, aislar cable y filtros | F7, F9 |
| F11 | Pruebas integrales y documentación | Todas |
| F12 | Estudios y ampliaciones futuras | F11 |

Los filtros van en la F10 porque usan redes, cables y conexiones (existen desde la F7) y no deben alterar el presupuesto. Los racks van después de los puertos porque su modal permite elegir y conectar puertos. Las mesas van después del catálogo porque necesitan los equipos que se colocan encima.

### F4 — Catálogo, imágenes y modelos (implementada)

**F4A — catálogo, iconos y modelos propios (verificada por el usuario el 12/11/2026).**
- **Catálogo:** los modelos y sus puertos están en `js/catalogo-pt.js` (lista del usuario; referencia de aspecto: Packet Tracer, con dibujos propios). Subsecciones: Routers, Switches, Multilayer, Inalámbricos, Seguridad, Finales, IoT (plegada al empezar) y Otros (Rack). Se quitó «Cámara IP». Buscador que no distingue mayúsculas ni acentos.
- **Tamaños:** cada modelo nace con su tamaño real aproximado (en `PT`); ninguno con el lado mayor menor a 0,30 m. Editable por equipo.
- **Colocar:** la plantilla se copia una sola vez a `R.modelos` (`m1`, `m2`…) y el objeto guarda `modelo`, `tipo`, `sub` y su nombre automático («Router1», «Switch4») en `label`. La plantilla se busca solo entre los modelos que usa el proyecto.
- **Dibujo:** icono sin recuadro (`<symbol>` definido una vez dentro de `#c` + `<use>`; un rectángulo transparente recibe los clics) y debajo dos líneas: modelo (`corto`) y nombre. Los equipos sin modelo de proyectos viejos se dibujan como antes (emoji).
- **Modelos propios:** cada categoría de red tiene un «… Empty» que abre un diálogo (nombre y grupos de puertos). Se guardan en el proyecto (`S.propios`) aunque no tengan equipos colocados, usan el icono de su categoría y se modifican o borran con ✎. Finales e IoT no llevan «Empty».
- **Inspector:** sección «Modelo» (fabricante, descripción, precio, moneda ARS/USD/EUR).
- **Límites conocidos:** los datos de la sección «Modelo» se escriben directo en la plantilla y Ctrl+Z no los revierte; borrar un modelo propio lo quita del menú pero los equipos colocados lo conservan; pegar un equipo copia su nombre («Router1» repetido); si se borran todos los equipos de un modelo del catálogo, el siguiente nace de una copia nueva, sin el precio cargado antes.
- «Nuevo» vacía el portapapeles interno.

**F4B — imágenes (verificada por el usuario el 13/11/2026).**
- **Qué se dibuja** (`imagenDe`): imagen del equipo → imagen de su modelo → icono → emoji. La imagen entra en el rectángulo del equipo sin deformarse.
- **Imagen del equipo:** `o.img`, un paso de historial. Vale para dispositivos y racks, también los viejos sin modelo.
- **Imagen del modelo:** vale para todos los equipos del modelo y se escribe en la plantilla: no es un paso de Ctrl+Z (deshacer una edición de un modelo propio sí la cambia, porque vuelve a la versión anterior).
- **Imagen suelta:** pestaña «Marcar» → «Imagen…». Es un `item` de `tipo: 'imagen'`: nace en el centro de la vista, seleccionada, con su proporción (lado mayor 2 m); se mueve, gira, copia y pega; no admite cables; **se dibuja debajo de todo lo de su capa** (`ordDe`), así sirve de fondo. Llena siempre su rectángulo. Tiene **8 asas**: las de los costados la estiran (deforman) y las de las esquinas conservan la proporción del inicio del arrastre (`redimProporcional`). «Cambiar imagen…» ajusta el alto a la proporción de la nueva. Los equipos con imagen no llevan asas.
- **Interfaz:** sección «Imagen» del inspector y entradas «Imagen del equipo…» / «Quitar imagen del equipo» del menú contextual. Formatos PNG, JPEG y WebP (sin SVG), con los límites de `R`; un archivo rechazado muestra el motivo y no cambia nada.
- **Rendimiento:** cada imagen usada se define una sola vez (`<symbol id="im-…">`) en un `<defs>` que se conserva entre redibujos. Va dentro de `#c`, así el PNG exportado las incluye; sin imágenes, `#c` queda idéntico a antes. Exportar PNG avisa si falla.
- **Límites conocidos:** el menú izquierdo no muestra miniaturas; no hay recorte ni edición; las imágenes sin uso siguen en memoria y cuentan para el tope de 50 MB hasta «Nuevo» o recargar (al guardar se descartan); cambiar ancho o alto de una imagen suelta en el inspector la deforma.
**Hallazgos de las revisiones thermo NO aplicados (decisión del usuario):** sacar `dibujarEquipo` de `draw()` (el SVG debe quedar byte a byte igual); mover `modeloDe`/`iconoDe` fuera de `dibujo.js`; registrar como acciones los manejadores de las secciones «Modelo» e «Imagen» en lugar de sus listeners propios sobre `#insp-cuerpo`; predicado `admiteCable` para `itemAt`; descartar imágenes sin uso al llegar al tope de 50 MB; pruebas menos dependientes de ids fijos y del orden de `PT`; foco del teclado al cerrar el diálogo de modelos; conservar el `g` de cada grupo de puertos al editar un modelo (importa en la F7).

Fuera de la F4: los tipos de conexión de Packet Tracer (consola, cruzado, serial DCE/DTE, USB…) van con los cables en la F7; los puertos se definen en los modelos pero se conectan en la F7.

### F5 — Rellenos y zonas (postergada por el usuario el 13/11/2026)
Archivos: `dibujo.js`, `controles.js`, `index.html`, `colocar.js`, `interaccion.js`, `nodos.js`, `iman.js`; nuevo `zonas.js`.
1. Al menos 6 patrones predefinidos además del sólido y la diagonal, con definiciones compartidas por patrón y color (D19).
2. Herramienta de relleno con un clic sobre una forma o zona existente.
3. Los archivos con relleno `hat` se ven igual que antes.
4. Zonas rectangulares por dos puntos (clic-clic o arrastrar) con imán a esquinas y extremos de paredes; las zonas elípticas siguen funcionando; vértices, lados, rotación, selección múltiple e historial se conservan.
5. Ida y vuelta de archivo. El relleno automático de recintos cerrados queda en la F12.

### F6 — Jerarquía y mesas (verificada por el usuario el 13/11/2026)
Archivos: nuevo `jerarquia.js` (`TR.jer`); cambios chicos en `tipos.js`, `estado.js` (`itemAt` ignora la mesa), `catalogo.js`, `dibujo.js`, `interaccion.js`, `rotacion.js`, `historial.js`, `acciones.js`, `esquema.js` e `index.html` (carga `jerarquia.js` después de `acciones.js`).
- **Mesa:** pestaña «Edificio» → «Mesa». `tipo: 'mesa'`, nace de 1,20 × 0,70 m con 2 puestos en fila a lo largo del ancho (líneas punteadas entre puestos). Sin cambio de color. Tamaño y puestos se editan en el inspector (sin asas en el plano). Se dibuja debajo de cables y equipos de su capa.
- **Reglas** (`TR.jer.problema`; si no se cumplen, aviso y no cambia nada ni guarda historial): largo ≥ puestos × 0,50 m (subir los puestos agranda la mesa); no menos puestos que equipos (al bajarlos, los equipos se reacomodan en orden); cada equipo entra en la mesa (largo y fondo, según su giro); la suma de los largos de los equipos no supera el de la mesa. Se validan al anclar, al editar en el inspector (mesa o equipo), al girar con R / menú y al soltar el asa ↻ (si no entra, el giro se descarta).
- **Posición:** un equipo anclado guarda `parent`, `puesto` y `lrot`. Su `x`, `y`, `rot`, `pl` y `cp` salen de la mesa en cada render (`sincronizar`): en el centro de su puesto, corrido lo justo para no salirse ni encimarse cuando es más grande que el puesto. En el inspector no muestra posición; su giro se edita y queda relativo a la mesa.
- **Anclar:** colocar un equipo con un clic sobre una mesa, o soltarlo arrastrado con su centro encima, lo pone en el puesto libre más cercano. Soltarlo fuera lo desancla. Si la mesa está llena o el equipo no entra: un equipo nuevo **no se coloca** y uno arrastrado **vuelve a donde estaba** (se descarta todo el arrastre, sin paso de historial), siempre con aviso. Solo los `dispositivo` se anclan (no racks ni imágenes).
- **Mesas superpuestas:** una mesa no puede pisar a otra de la misma planta (aunque estén en capas distintas); tocarse por el borde sí. Se valida al colocar (no se coloca), al arrastrar (vuelve a donde estaba), al editar posición, tamaño, giro o puestos en el inspector, al girar con R / ↻ y al pegar; siempre con aviso y sin paso de historial.
- **Mover / girar la mesa:** sus equipos la siguen, y sus cables también. Con la mesa y sus equipos seleccionados, los equipos no se mueven ni giran dos veces (R6, `sinHijos`).
- **Borrar la mesa** pide confirmación (también si sus equipos están seleccionados) y borra sus equipos; sus cables quedan sueltos (R7). **Cortar** no pregunta: quedan en el portapapeles. Borrar un equipo no toca la mesa.
- **Copiar la mesa** copia también sus equipos, anclados a la copia. Un equipo copiado solo se pega suelto.
- **Cables:** `itemAt` ignora la mesa: el cable se une al equipo. No se dibuja nada entre mesa y equipo (no se confunde con una conexión).
- **Archivo:** `puestos`, `parent`, `puesto`, `lrot` en `ESPEC` (R9). Un equipo cuyo `parent` no existe queda suelto al abrir.
- **Revisión thermo (13/11/2026):** aplicados los arreglos rápidos: archivo dañado con `parent` en una mesa o escalera (se suelta); confirmación con selección por rectángulo; arrastre conjunto donde uno sale y otro entra a una mesa llena (primero se desanclan los que salen); aviso al cortar; `mesaEn` elige según el orden de capas; «Mesa» en el inspector; «Posición y tamaño…» en equipos anclados (va al ancho). **No aplicados (decisión del usuario):** sacar de `sincronizar` las escrituras a `S` y la lectura de `drag`; lista de validadores en `TR.acc` en lugar de llamar a `TR.jer` desde `fijar`/`rotar`/`soltarArrastre`; agrupar hijos por mesa en una pasada (rendimiento, no medido); `norm360` única, `puestos` asegurado en un lugar y tope 50 como constante; recortar exportaciones de `TR.jer` y renombrar `puedeColocar`; partir líneas largas y la prueba que encadena 7 escenarios.
- **Límites conocidos:** la etiqueta de la mesa y las de sus equipos pueden quedar encimadas debajo de la mesa; los racks como padre llegan en la F8.
- **Pruebas automatizadas (navegador integrado): 84 de 85** (8 nuevas en `pruebas-f6.js`; falla solo la de la referencia, ausente en ese navegador). Las pruebas que hacen clic necesitan el panel del navegador visible: con el panel oculto (0 px) falla la del cable. No se probó: Firefox ni Safari, arrastres reales con el ratón (las pruebas simulan los eventos).

### F7 — Puertos, conexiones y redes
Archivos: `estado.js`, `interaccion.js`, `historial.js`, `plantas.js`, `catalogo.js`, `controles.js`, `esquema.js`; nuevos `conexiones.js`, `redes.js`.
1. `S.conex` según D1; cada puerto con id único, tipo, estado y propiedades; los cables incompletos se ven distintos de los terminados.
2. Conectar desde el plano pide el puerto cuando el dispositivo los tiene; clic derecho sobre un dispositivo muestra sus interfaces y permite modificar conexiones.
3. Mover un vértice o redibujar la ruta no cambia el `id` de la conexión; al mover un dispositivo (o su mesa) los cables conservan sus extremos y actualizan la geometría; mover un extremo a otro dispositivo limpia el puerto.
4. Gestión de **redes/VLAN/subredes** (alta, baja, nombre, color de la red), separada de las capas del editor.
5. Etiquetas físicas junto a cada puerto de routers, switches y patch panels (destino, equipo remoto, planta, sala, VLAN), activables y exportables en el PNG.
6. Borrar un dispositivo o una conexión aplica R7 y R8.
7. Los archivos v1 migran con una conexión por cada cable. Un cable que atraviesa escaleras ya es una sola línea (D21) con una sola ruta. Los pares de cables sueltos antiguos (partidos con la antigua flecha) se vinculan en la migración.
8. Menú contextual del cable: tipo y extremos (sin color; la longitud se añade en la F9).
9. Bloqueo del color de los cables en `controles.js` y en la creación de cables (D16).

### F8 — Racks
Archivos: `interaccion.js`, `controles.js`, `index.html`; nuevos `rack.js`, `vistarack.js`, `rack.css`.
1. El rack admite equipos por unidades, rechaza solapes y excesos de altura.
2. Se puede arrastrar un equipo del plano hacia el rack para instalarlo; sigue siendo el mismo objeto (conserva identidad, puertos y conexiones) y deja de verse suelto en el plano.
3. Doble clic en un rack abre el modal y se vuelve al plano con vista, selección y herramienta intactas (R10). La etiqueta del rack se edita desde el menú o el inspector.
4. En el modal se pueden seleccionar, editar y conectar puertos, ver las etiquetas físicas y editar propiedades de los equipos instalados.
5. Ctrl+Z / Ctrl+Y funcionan con el modal abierto; borrar un rack o un equipo aplica R7.
6. Menú contextual del rack con opciones de montaje.
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

- Responder en español (Argentina, voseo), claro y breve, con tablas y listas cuando ayuden.
- Una fase por vez. Antes: presentar el diseño, los archivos y las pruebas, y esperar la orden. Al terminar: informar lo implementado y los resultados **reales** de las pruebas, separando las simuladas de las que hace el usuario en su navegador, e indicar qué debe probar él.
- Nunca afirmar que una prueba pasó si no se ejecutó. No avanzar a una fase que dependa de otra sin verificar la anterior.
- No reescribir la aplicación ni cambiar de tecnología; conservar las funciones existentes; no duplicar lógica ni manejadores de eventos; no cambiar el orden de carga sin necesidad. Si hay una incompatibilidad real, explicarla antes.
- Mantener compatibilidad con proyectos antiguos, historial y archivos.
- Si una función requiere una decisión de diseño importante, presentar alternativas y consecuencias antes de elegir.
- El usuario commitea por su cuenta; preguntar antes de hacerlo.

## 7. Ajustes posteriores a la F3 (todos verificados por el usuario el 11/11/2026)

**Menú contextual y portapapeles.**
- Sobre un objeto: acciones de su tipo, Cortar, Copiar, Pegar y Eliminar (sin «Duplicar»). En el fondo vacío o sobre algo bloqueado: Volver atrás, Adelante y Pegar.
- Portapapeles interno: no es el del sistema, no entra en `S` ni en el historial y se conserva al abrir otros archivos («Nuevo» lo vacía). Copiar no guarda historial; Cortar y Pegar guardan un paso cada uno. Cortar con la confirmación cancelada no toca el portapapeles.
- Pegar: planta y capa activas, centrado en el punto del clic (o en el último punto del cursor con Ctrl+V), con la validación de escaleras; no copia puertas ni uniones (el cable se pega suelto).
- Ctrl+C / X / V (Cmd en Mac): solo sin herramienta activa ni operación en curso y fuera de campos de texto.

**Cable único por escaleras (D21).**
- Con un cable en curso, un clic sobre una escalera (también su reflejo) abre «Planta superior / Planta inferior» (la que no corresponde aparece desactivada con el motivo; Esc cancela). El cable recorre la escalera, la vista pasa a esa planta y se sigue dibujando desde la salida. Es un solo objeto y un solo paso de historial.
- Cada planta muestra su mitad en sólido y la otra translúcida (opacidad .35). El recorrido va a un costado de la flecha (0,13 m), con un carril para subir y otro para bajar; en la espiral entra y sale por el cuarto abierto.
- Una sola regla de qué cables se borran enteros: `cablesAfectados` (`trazas.js`), usada al borrar objetos, plantas y capas.

**Escaleras compatibles entre plantas.**
- `escaleraObstruida` (`escaleras.js`) mira la planta de abajo, la misma y la de arriba, y valida el estado final. Misma planta: dos escaleras no pueden pisarse (tocarse por el borde sí). Planta vecina: si se pisan y alguna es recta, no; si son de distinto tipo, no; con descanso o espiral del mismo tipo, solo exactamente alineadas.
- Se valida al colocar, pegar, girar, editar en el inspector y al soltar o cancelar un arrastre: si queda mal, todo vuelve a como estaba, con aviso y sin paso de historial (`revisarEscalerasMovidas`, `descartarPaso`). Límite conocido: con el historial lleno (100 pasos), el paso más viejo descartado al empezar el arrastre no se recupera.
- Una escalera apilada se puede mover sola, salvo que un cable baje por ella: mover o girar la de arriba o la de abajo de modo que abajo no quede una igual se rechaza (`cablesSinApoyo`); hay que borrar antes el cable. Los cables que ya estaban sin apoyo (archivos viejos) no bloquean.
- Reordenar plantas o borrar una del medio se valida (`cambioDePlantas`): si deja juntas escaleras incompatibles o un cable sin apoyo, se rechaza con aviso. Las capas se reordenan sin validar.
- Con la herramienta de escalera activa, o al arrastrar una, se ven en `#g-tmp` los contornos punteados de las escaleras de la planta de abajo (azul, «↓») y de arriba (naranja, «↑»). El imán `encajarVecina` encaja con una igual de la planta vecina.
- Un proyecto guardado con escaleras que ya no cumplen se abre igual.
- Durante un arrastre no actúa ninguna tecla.

## 8. Mapa técnico para retomar

**Orden de carga de scripts (`index.html`; comparten variables globales, no cambiarlo sin necesidad):** `estado` → `eventos` (define `TR`) → `tipos` → `recursos` → `esquema` → `iconos` → `catalogo-pt` → `catalogo` → `dibujo` → `reglas` → `rejilla` → `plantas` → `historial` → `iman` → `nodos` → `medidas` → `escaleras` → `trazas` → `formas` → `puertas` → `rotacion` → `seleccion` → `colocar` → `interaccion` → `controles` → `acciones` → `jerarquia` → `inspector` → `modelos` → `imagenes` → `contexto` → `archivos` → `main` (siempre el último). Con `?pruebas=1` se cargan además `pruebas` → `pruebas-f4` → `pruebas-f6`.

**Estado global (`estado.js`):** `S` (proyecto; entra al historial), `V` (vista: `ox`, `oy`, `z` px/m), `sel`, `multi`, `selEdge`, `tool`, `tmp`, `drag`, `nid`, `curP`. `R` (recursos, `recursos.js`) está fuera de `S`. Namespace `TR` (`eventos.js`). El código nuevo usa `TR`: las letras `I`, `L`, `T`, `S`, `V` ya están ocupadas.

**Convenciones que no hay que romper:**
- Todo cambio de `S` llama antes a `push()` (un paso de historial por acción; no duplica pasos idénticos). Los snapshots serializan solo `S`.
- El comportamiento lo decide el `tipo`/`sub` estable (`tipoDe`, `subDe`, `esPared`, `esCable`, `esEscalera`, `esImagen`…), nunca el nombre visible `o.n`. `add()` asigna el tipo (`completarTipo`).
- Planta y capa: `esVisible`/`esEditable` son la única puerta; cada objeto lleva `pl` y `cp`; los puntos de un cable pueden llevar `pl`/`cp` y `es`/`ed` (D21).
- R9: todo campo nuevo se registra en `ESPEC` de `esquema.js` y se cubre con la prueba de ida y vuelta.
- Render en capas: `render()` (completo, síncrono), `renderObjetos()` (`#c`, lo que exporta el PNG), `renderTmp()` (`#g-tmp`), `repintarMovimiento()` al mover el ratón. Mover el ratón sin arrastrar no debe reconstruir nada (ni el inspector ni el menú).
- Campos y acciones por tipo se registran con `TR.acc.registrarCampo` / `TR.acc.registrar` (`acciones.js`).
- Pegar no usa `add()`: asigna id nuevo y la planta y capa actuales, suelta las uniones `ref`/`rl`, no copia puertas ni conexiones.
- Teclado (`controles.js`): G, F, H, M, R, Enter, Esc, Supr/Retroceso, Ctrl+Z/Y, Ctrl+C/X/V. No actúan con botón, resumen, checkbox o color enfocados, ni dentro de TEXTAREA. Esas letras ya están ocupadas: los comandos nuevos van por menú contextual e inspector.
- Clic derecho (`interaccion.js`): con herramienta u operación en curso cancela o termina; sin ellas abre el menú contextual.
- El doble clic se detecta a mano (la página se redibuja en cada clic y el `dblclick` nativo se pierde).

**Pruebas (`?pruebas=1`, botón «Ejecutar pruebas»):** 85 casos (63 de F0 a F3 y sus ajustes en `js/pruebas.js`; 8 de la F4A y 6 de la F4B en `js/pruebas-f4.js`; 8 de la F6 en `js/pruebas-f6.js`, con sus proyectos `mesa`/`pc` y `arrastrarObj`). Usan proyectos de prueba (`fVacio`, `fDispositivos`, `fParedes`, `fFormas`, `fEscaleras`, `fCapas`, `fCruce`, `fDup`, estrés) con `conProyecto(...)`, que restaura el estado de la página al terminar; las de la F4 usan `f4(fn)` (recursos vacíos, proyecto vacío y menú en «Dispositivos»). Para pruebas nuevas: archivo propio por fase, las utilidades de `TRP.util`, y no dejar pasos en el historial del usuario.
- **Aviso importante:** la prueba «el dibujo es idéntico a la referencia» usa una referencia guardada en el `localStorage` del navegador (clave `topologias_ref_f0`). En otro navegador, otra cuenta o tras limpiar datos no existe y esa prueba falla por eso, no por un error del código. Se genera con «Guardar referencia de dibujo» usando una versión del código cuyo dibujo se considere correcto. No sobrescribir la del usuario sin avisarle.
- «Medir rendimiento» compara contra una base de la F0 (render ~50 ms, mover sin arrastrar ~44 ms con 3000 objetos). Última medición del usuario (01/11/2026): render 50,6 ms y mover sin arrastrar 0 ms.

## 9. Registro de cambios

- 27–28/10/2026: auditoría, decisiones D1–D15, F0 y F1 completadas.
- 31/10/2026: F2 completada. Decisiones D16 a D20 confirmadas.
- 01/11/2026: F3 implementada, verificada y cerrada. Ajustes: menú contextual con portapapeles y cable único por escaleras (D21).
- 11/11/2026: ajuste de escaleras entre plantas y correcciones de la revisión thermo del commit `cda924b`; todo verificado por el usuario. Iconos aprobados. F4A implementada.
- 12/11/2026: revisión thermo de la F4A y correcciones; el usuario confirmó la F4A. F4B implementada, con imagen suelta y sus asas; revisión thermo de la F4B y correcciones recomendadas aplicadas. Pendiente la verificación manual de la F4B.
- 13/11/2026: el usuario postergó la F5. Documento limpiado: se quitaron las listas de comprobaciones ya verificadas, la lista de modelos y la tabla de tamaños (están en `js/catalogo-pt.js`), preguntas ya respondidas, repeticiones y el detalle del registro de cambios. No se modificó código.
- 13/11/2026: el usuario verificó la F4B. F6 (jerarquía y mesas) implementada con sus reglas de tamaño y la confirmación al borrar; D2 cambiada (puesto en lugar de `lx`/`ly`). Pendiente la verificación manual de la F6.
- 13/11/2026: a pedido del usuario, sin lugar en la mesa un equipo nuevo no se coloca y uno arrastrado vuelve a su posición (con aviso).
- 13/11/2026: revisión thermo de la F6; aplicados solo los arreglos rápidos (B1–B6).
- 13/11/2026: a pedido del usuario, una mesa no puede ir encima de otra.
- 13/11/2026: el usuario verificó la F6 (las 10 comprobaciones manuales). Se quitaron del documento.
