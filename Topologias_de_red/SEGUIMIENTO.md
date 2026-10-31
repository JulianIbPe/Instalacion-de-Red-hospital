# Seguimiento – Topologias_de_red

Para usarla: abrir `index.html` en el navegador (no requiere servidor).

> **Estado de este documento (27/10/2026).** Esta es la versión vigente (la de la carpeta `Topologias_de_red`). Existe una copia antigua en la raíz del proyecto de Claude (`/mnt/project/SEGUIMIENTO.md`) que no incluye `colocar.js` ni el detalle de las escaleras: no se actualiza y debe reemplazarse por esta o borrarse.
> La tabla de abajo describe **solo lo que existe hoy en el código** (comprobado por lectura estática en la auditoría inicial). Lo planificado figura en las secciones «Arquitectura objetivo» y «Plan de fases» y se marca como *(planificado)*. Cuando una fase se complete, sus archivos pasan a la tabla.

| Ruta | Qué contiene |
|---|---|
| `index.html` | Estructura: barra superior, menú izquierdo, área de trabajo con reglas, barra de estado |
| `css/base.css` | Reglas generales y botones |
| `css/barra.css` | Barra superior y barra de estado |
| `css/menu.css` | Menú izquierdo (pestañas, objetos, color y relleno) |
| `css/lienzo.css` | Área de trabajo y reglas |
| `css/plantas.css` | Panel de plantas y capas (abajo a la derecha), con botones ▲ ▼ y asa ⠿ para cambiar la jerarquía |
| `css/dialogo.css` | Aviso al empezar un archivo nuevo |
| `js/estado.js` | Estado global (objetos, vista, herramienta) y utilidades |
| `js/catalogo.js` | Catálogo de dispositivos, cables, formas, eléctrico, edificio (con Escalera, Escalera con descanso y Escalera espiral) y marcado; construcción del menú (al elegir cualquier escalera el color del menú pasa a gris pared). Las dos escaleras nuevas llevan `esc: 'descanso' \| 'espiral'` en el catálogo |
| `js/dibujo.js` | Dibujo de cada objeto en SVG (`draw`) y **renderizado en capas** (Fase 1): el SVG se crea una vez con `#vp` (vista: desplazar y zoom solo cambian su `transform`) que contiene `#g-grilla`, `#c` (objetos, contorno del edificio y reflejo de la planta de abajo; lo que exporta el PNG) y `#g-tmp` (objeto en curso, vista previa, guías, imanes, rectángulo de selección y asa ↻). Funciones: `renderFondo` (vista y grilla; la grilla solo se rehace si cambia el zoom o se activa/desactiva), `renderObjetos`, `renderTmp`, `renderPaneles` (botones, reglas y barra de estado), `render()` (todo, síncrono; lo usan casi todas las funciones y el PNG) y `repintarMovimiento()` (al mover el ratón solo redibuja lo que cambió). Las capas más altas se pintan encima de las inferiores. Barra de estado (con mensaje propio para la escalera espiral) |
| `js/eventos.js` | Contadores del renderizado (`TR.stats`) para las pruebas. Opcional: si faltara, el dibujo sigue funcionando |
| `js/tipos.js` | Identificador de tipo estable (Fase 2): `tipo` (pared, cable, dispositivo, rack, escalera, ascensor, ventana, puerta, forma, zona, texto, medida) y `sub` (p. ej. `router`, `utp6`, `circulo`); `derivarTipo` es el único lugar donde un nombre visible se traduce a tipo; `completarTipo`, `normalizarTipos`, predicados (`esPared`, `esCable`, `esEscalera`, `esAscensor`, `esCirculo`, `claveLinea`). Las escaleras mantienen su variante en `o.t`. **Los módulos aún no usan los predicados** (tramo 2B) |
| `js/recursos.js` | Almacén `R` fuera de `S` y del historial (Fase 2): `R.imgs` (id por hash del contenido; sin duplicados) y `R.modelos` (plantillas versionadas); validación de imágenes por los bytes (firma real de PNG, JPEG y WebP, tipo declarado, dimensiones); límites 5 MB por imagen, 50 MB por proyecto, 8 000 px por lado y 40 millones de píxeles; `agregarImagen`, `paraGuardar` (solo lo que el proyecto usa), `fusionar` (al abrir; renumera modelos en conflicto) y `remapEstado`. La interfaz para importar imágenes llega en la Fase 4 |
| `js/esquema.js` | Formato de proyecto v2 (Fase 2): `ESQ.leer` (valida, sanea con lista blanca y migra v1 → v2 sin tocar `S` ni `R`) y `ESQ.serializar` (escribe v2 y rechaza lo que luego no se podría abrir). Regla R9: todo campo nuevo de un objeto debe añadirse a `ESPEC` |
| `js/reglas.js` | Reglas superior e izquierda en metros |
| `js/rejilla.js` | Grilla activable (tecla G): se adapta al zoom y los objetos se ajustan a ella |
| `js/plantas.js` | Plantas y capas: modelo, panel inferior derecho, ocultar/bloquear/añadir/quitar, jerarquía (subir/bajar plantas y capas con ▲ ▼ o arrastrando el asa ⠿; el panel muestra arriba lo más alto), compatibilidad con archivos antiguos |
| `js/historial.js` | Deshacer, rehacer y borrar objetos. Fase 2: interfaz `Hist` con estrategia intercambiable (hoy `snapshots` de `S`, sin recursos), tope de 100 pasos y de 50 millones de caracteres, y sin duplicar un paso idéntico al anterior; `restaurar` también asigna tipos |
| `js/iman.js` | Imán al medir: el cursor se pega a puntas de paredes/cables, centros de dispositivos y esquinas; imán opcional al punto medio de líneas y lados (tecla M) |
| `js/nodos.js` | Nodos de líneas del mismo tipo: se marcan, el cursor se pega a ellos y la línea nueva queda unida; al colocar escaleras y formas se marcan los extremos de las paredes y las esquinas de las escaleras de la planta actual y el cursor se pega a ellos |
| `js/medidas.js` | Cotas estilo AutoCAD (líneas de extensión, flechas, distancia a la que se estira) y medida lateral de las paredes al dibujarlas |
| `js/escaleras.js` | Tres escaleras en planta, todas guardadas como `{k:'item', n:'Escalera'}` con el campo `t` (sin `t` = recta, `'descanso'`, `'espiral'`), con borde igual al de una pared, escalables con 8 asas y medidas, y color editable (gris pared por defecto): **Escalera** (recta: peldaños, nombre «Escalera» y flecha por el eje que sube; en el reflejo de abajo baja), **Escalera con descanso** (nombre «Escalera» en el descanso, que va arriba; dos tramos separados por dos líneas gruesas con una ranura chica entre ellas, abierta hasta abajo (el borde inferior se dibuja abierto en la ranura); flecha que sube por la izquierda, da la vuelta y baja por la derecha) y **Escalera espiral** (270°, empieza a la izquierda y gira a la derecha, peldaños en abanico desde el eje, flecha curva y nombre «Escalera» en el cuarto abierto, cuya letra se achica junto con la escalera). **Sin relleno** (solo borde y líneas; el interior es transparente pero se puede seleccionar). **Desvanecimiento progresivo del color: PENDIENTE, no implementado** (decisión D15): hoy el reflejo de la planta inferior se dibuja con una opacidad fija de .6 y los peldaños con `stroke-opacity` constante; la máscara por escalera y la constante `FIN` que describían versiones anteriores de este documento no existen en el código. Las escaleras de la planta inferior se ven también en la de arriba (reflejo, flecha ▼ azul). **Reglas con la planta de abajo** (`escaleraObstruida`): la recta no puede pisar ninguna; la de descanso/espiral no puede pisar una de otro tipo, si pisa una del mismo tipo solo se coloca exactamente encima (mismo lugar, tamaño y giro; `encajarAbajo` la ajusta si queda casi encima), y si no pisa ninguna se coloca libremente. Si la de descanso/espiral queda exactamente encima de una igual de abajo, lleva además una segunda flecha azul hacia abajo (`igualAbajo`). Aviso con `avisoEmergente`. **Cables en la escalera de otra planta** (`cablesFantasma`): los cables (todos menos la pared) que pasan por una escalera de la planta de abajo o de la de arriba se ven en la planta actual, semitransparentes, sin recibir clics y recortados a la forma de esa escalera; solo cuentan las capas visibles. **Cambio de planta**: cada flecha lleva una zona de clic invisible (`data-flecha`, también en el reflejo de abajo); con doble clic (ver `interaccion.js`) `irPlanta(d)` pasa a la planta de arriba (flecha negra, d = 1) o a la de abajo (flecha azul, d = -1) y avisa si no existe. `flechaEn(e)` detecta la flecha bajo el cursor midiendo la distancia (~10 px) al dibujo de la flecha, sin depender de qué elemento reciba el clic. `cableAOtraPlanta(d, p)`: con un cable a medio dibujar, tocar una flecha (un clic) termina ese cable en la flecha, cambia de planta y empieza un cable nuevo del mismo tipo y color en ese punto para seguir dibujándolo (hoy las dos mitades son objetos independientes, sin vínculo) |
| `js/formas.js` | Formas escalables (8 asas), sus medidas (ancho, alto y radio), tipos de línea y edición de lados (seleccionar, mover, modificar puntas y borrar) |
| `js/puertas.js` | Puertas solo sobre paredes: hueco en la pared, recorrido de apertura en el suelo, vista previa, hasta 2 hojas por división, estirar por los costados; teclas F (lado) y H (bisagra) |
| `js/rotacion.js` | Rotar la selección (asa ↻ o tecla R): giro de objetos sueltos o de varios a la vez |
| `js/seleccion.js` | Selección múltiple (Mayús+clic) y selección por rectángulo (Mayús + clic izquierdo y arrastrar) |
| `js/colocar.js` | Colocar las escaleras y las formas con dos puntos: escalera recta, escalera con descanso y formas = esquinas opuestas (peldaños a lo largo del lado más largo); círculo y escalera espiral = centro y radio (la espiral queda sin girar); vista previa y guía; los puntos se pegan a los extremos de las paredes y a los puntos medios (tecla M); al soltar una escalera se aplican las reglas de la planta inferior |
| `js/interaccion.js` | Ratón: colocar, mover, dibujar cables y zonas, medir, zoom y desplazamiento (al mover el ratón usa `repintarMovimiento`; la rueda solo actualiza vista, grilla, reglas y barra de estado; pulsar y soltar siguen haciendo `render()` completo). Doble clic (detectado a mano): en una flecha de escalera cambia de planta (negra sube, azul baja); en el **Ascensor** sube a la planta de arriba (o baja si ya está en la más alta); Alt + doble clic en el ascensor = ponerle etiqueta; en cualquier otro objeto = etiqueta. Con una herramienta de cable y un cable en curso, un clic sobre una flecha de escalera (se busca con `flechaEn`, porque el cable en curso tapa la flecha) llama a `cableAOtraPlanta`. El clic derecho cancela o termina la operación en curso y el menú del navegador está bloqueado |
| `js/controles.js` | Teclado (G grilla, F/H puertas, M imán medio, R rotar, Enter terminar línea, Esc soltar herramienta, Supr/Retroceso borrar —no actúan con un botón enfocado—, Ctrl+Z / Ctrl+Y), color, relleno, tipo de línea, grilla, imán medio, tamaño del edificio y unidad de medición |
| `js/archivos.js` | Guardar y abrir .json (formato **v2**: `ESQ.serializar`/`ESQ.leer`; `abrirTexto` no toca el proyecto si el archivo no es válido, guarda un paso de historial antes de reemplazar y, ante un fallo inesperado, restaura el proyecto anterior), exportar PNG (`construirSvgExport`: sin marcos ni asas de selección ni objeto en curso; la selección se restaura al terminar), botón Nuevo con su aviso |
| `js/main.js` | Arranque (se carga el último) |
| `js/pruebas.js` | Solo con `index.html?pruebas=1`: panel «Pruebas» con 25 pruebas (Fase 0: 5; Fase 1: 8; Fase 2: 12 — instalación, migración v1, ida y vuelta, abrir v1, archivos inválidos, fallo al abrir, imágenes, snapshots sin imágenes, fusión de recursos, límites al abrir, historial, tipos), 6 proyectos de prueba (+ uno de estrés), referencia de dibujo (huellas de `#c`) y medición de rendimiento. No toca el historial y restaura el proyecto abierto |
| `SEGUIMIENTO.md` | Este registro |

Los scripts se cargan en el orden de `index.html` y comparten variables globales.

---

## 1. Auditoría inicial (27/10/2026): errores conocidos pendientes

Hallazgos por lectura estática (la aplicación no se ejecutó en un navegador). Se corrigen en la Fase 0 salvo indicación.

- El PNG incluye los marcos ámbar de la selección múltiple (`#png` limpia `sel` y `tmp`, no `multi`) y no restaura la selección.
- `Abrir` reemplaza `S` antes de validar: un `.json` con estructura distinta puede dejar el estado corrupto.
- Campos como `o.c`, `o.ic`, `o.d` se insertan sin escapar en `svg.innerHTML` (riesgo con archivos manipulados).
- `render()` repinta todo el SVG, reconstruye `menu()` y las reglas en **cada** movimiento del ratón, incluso sin arrastrar.
- Retroceso/Supr borra objetos cuando hay un botón enfocado.
- `ORD[a.k]` no tiene valor por defecto: un `k` nuevo sin entrada rompe el orden de dibujo (NaN en `sort`).
- Las zonas guardan la esquina superior izquierda; formas e ítems, el centro. Las zonas solo tienen un asa.
- El comportamiento se decide por nombre visible (`o.n == 'Escalera'`, `'Ascensor'`, `'Pared'`, `'Círculo'`) en `dibujo`, `interaccion`, `nodos`, `puertas`, `escaleras`, `formas`, `seleccion`, `iman`, `colocar`, `catalogo`, `plantas` y `rotacion`.
- El formato guarda `version: 1` y nunca se incrementa; las migraciones están dispersas en `normalizar()`, que además corre en cada deshacer.
- El desvanecimiento de escaleras estaba documentado como hecho y no está implementado (corregido arriba).

## 2. Decisiones aprobadas (criterios iniciales)

| N.º | Decisión | Cómo se concreta |
|---|---|---|
| D1 | Conexiones lógicas ligadas a la ruta física | `S.conex`: cada conexión guarda origen y destino `{d: dispositivo, p: puerto}` y la lista ordenada `rutas` de líneas (ids). La línea sigue siendo solo geometría. La conexión conserva su `id` aunque cambie el recorrido. **Todo cable dibujado tiene una conexión** con id estable (los extremos pueden ser `null` mientras se dibuja). Una conexión con extremos sin definir se guarda marcada como **incompleta** y no cuenta como completa en listados ni presupuesto. Los tramos entre plantas se unen a la conexión existente, sin crear duplicadas |
| D2 | Jerarquía padre-hijo | Campo `parent` (id del contenedor). Hijos con **posición absoluta sincronizada** (`x`, `y`, `rot`) más posición local (`lx`, `ly`, `lrot`) para mesas, o `ru:{u,h}` para racks. Planta y capa: el hijo **siempre hereda** `pl` y `cp` del padre |
| D3 | Recursos fuera del historial | Almacén `R` (global, fuera de `S`): `imgs` (por hash del contenido) y `modelos` (plantillas). Se guarda y abre con el proyecto; los recursos sin uso se descartan al guardar |
| D4 | Historial | Se mantienen los snapshots de `S` (sin recursos) con tope de memoria en bytes además del tope de 100 pasos; interfaz `Hist` con estrategia intercambiable para pasar a parches |
| D5 | Vista de detalle de rack | Modal con su propio SVG; opera sobre el mismo `S` (usa `push()`, deshacer/rehacer y atajos globales) |
| D6 | Formato v2 | `version: 2` con validación y saneamiento por lista blanca, migración automática desde v1 y reemplazo del estado solo si todo es válido |
| D7 | Renderizado | Capas independientes y banderas de «sucio»; sin framework |
| D8 | Inspector | Aside derecho con secciones contraíbles y reordenables; `#plantas` se conserva y también será contraíble |
| D9 | Menú contextual | Clic derecho solo sin herramienta activa ni operación en curso |
| D10 | Filtros | Estado visual `F` fuera de `S` y del historial; ocultar / atenuar / aislar; no tocan `esVisible`, imanes ni conexiones |
| D11 | Longitud de cables | Ruta completa + tramos verticales por altura de plantas + holgura configurable; tramos entre plantas unidos por la conexión |
| D12 | Presupuesto | Precios editables por modelo y por metro de cable, moneda, cantidades y holgura; CSV primero |
| D13 | Zonas y rellenos | Etapa 1: rellenos sólidos y patrones, zonas rectangulares por dos puntos con imán a esquinas y extremos de paredes. Etapa 2 (estudio): detección de habitaciones cerradas |
| D14 | Tipo estable | `tipo` (y `sub`) en cada objeto; el comportamiento deja de depender de `n`; migración de objetos antiguos |
| D15 | Escaleras desvanecidas | Solo documentación corregida; sin implementar hasta que lo principal esté estable |

## 3. Arquitectura objetivo *(planificado)*

### 3.1 Capas de datos

- **`S`** (estado del proyecto, entra en el historial): `edificio` (+ `alturaPlanta`), `unidad`, `plantas` (+ `alt` opcional), `objs`, `conex`, `redes`, `presupuesto`, contadores. Es lo único que serializan los snapshots.
- **`R`** (recursos, no entra en el historial): `imgs {id:{mime,data,w,h,nombre}}` y `modelos {id:{nombre, marca, cat, tipo, sub, w, h, ic, img, uAlto, uTotal, puertos:[{g, n, tipo, vel, pref}]}}`. Los puertos predeterminados vienen de la plantilla del modelo (grupos); la instancia conserva sus propias etiquetas, conexiones y configuración, y solo guarda sobrescrituras (`po {puerto:{etq, red, nota}}`) e interfaces (`ifs`). Así un snapshot no multiplica cientos de puertos. **Las plantillas están versionadas**: editar una plantilla crea una versión nueva y las instancias ya colocadas siguen apuntando a la suya; actualizarlas es una acción explícita con confirmación que cambia el puntero de cada instancia en `S` (por eso se puede deshacer) y conserva las conexiones compatibles. Los ids de puerto son `grupo:índice` (p. ej. `g0:12`).
- **Estado de interfaz** (fuera de `S` y de `R`): `V` (vista), `sel`, `multi`, `tool`, `tmp`, `drag`, `F` (filtros), estado del inspector y del menú contextual.
- Namespace nuevo `TR` (en `eventos.js`) para el código nuevo: `TR.on/emit`, `TR.stats`. Los módulos nuevos no añaden globales sueltas.

### 3.2 Modelo de objetos (campos nuevos)

- Todos: `tipo` (id estable: `pared`, `cable`, `escalera`, `escalera-descanso`, `escalera-espiral`, `ascensor`, `ventana`, `puerta`, `dispositivo`, `rack`, `mesa`, `forma`, `zona`, `texto`, `medida`) y `sub` (p. ej. `router`, `utp6`, `circulo`). `k` se conserva como clase de geometría/dibujo; `n` queda solo como nombre visible.
- Dispositivo: `modelo`, `img`, `po`, `ifs`, `parent`, `lx`, `ly`, `lrot`, `ru`.
- Conexión: `{id, a:{d,p}|null, b:{d,p}|null, rutas:[idLinea…], sub, red, etqA, etqB, holgura}`. Sin ruta = conexión lógica con longitud estimada (distancia recta + holgura, marcada «estimada»).
- Reglas de dirección: la identidad del dispositivo de un extremo es la de la conexión; el `ref` del primer/último punto de la línea es solo anclaje geométrico y se sincroniza por funciones explícitas (`sincronizarConexion` al editar la conexión; `reconciliarDesdeRuta` al soltar un extremo sobre otro dispositivo, que además limpia el puerto).
- Tabla `TIPOS` *(planificado, `tipos.js`)*: por tipo, su clase `k`, categoría, indicadores (`conectable`, `contenedor`, `alojable`), esquema de propiedades (para el inspector) y acciones (para el menú contextual).

### 3.3 Renderizado

```
<svg id="svg">
  <g id="vp" transform="…">      ← pan y zoom solo cambian este atributo
    <g id="g-grilla">            ← solo cambia con zoom, grilla o edificio
    <g id="c">                   ← objetos (como hoy; el PNG sigue usando #c)
    <g id="g-tmp">               ← caja, vista previa de puerta, guía, nodos, ↻, imán, objeto en curso
```

- `render()` se conserva (síncrono, marca todo sucio) para no tocar sus ~70 llamadas y para el PNG. `pedir(banderas)` agrupa repintados con `requestAnimationFrame` y lo usan los manejadores del ratón.
- Movimiento sin arrastre ni herramienta: solo se actualizan las coordenadas de la barra de estado (cero reconstrucciones).
- `menu()` solo se reconstruye al cambiar pestaña o herramienta; los botones activos se actualizan con `classList`.
- El inspector y los demás paneles **no** se reconstruyen en `pointermove`: se refrescan al terminar un gesto, al cambiar la selección y tras deshacer/abrir/nuevo, y nunca mientras un campo de texto tiene el foco.
- Filtros: cada objeto se envuelve según su estado de filtro (`''`, `dim`, `hide`); sin filtro activo la salida es idéntica a la actual.

### 3.4 Módulos nuevos y su relación con los existentes

| Módulo nuevo | Depende de | Lo usan |
|---|---|---|
| `js/tipos.js` — `TIPOS`, `derivarTipo`, predicados (`esCirculo`, `esEscalera`…) | `estado` | todos los que hoy comparan `o.n` |
| `js/eventos.js` — `TR`, `pedir`, banderas, instrumentación | — | `dibujo`, `interaccion`, `historial`, paneles |
| `js/esquema.js` — validar, sanear, migrar v1→v2 | `tipos` | `archivos`, `historial` |
| `js/recursos.js` — `R`, imágenes, modelos, descarte | `esquema` | `archivos`, `catalogo`, `dibujo`, `presupuesto` |
| `js/inspector.js` + `css/inspector.css` | `tipos`, `eventos` | `controles`, `interaccion` |
| `js/contexto.js` + `css/contexto.css` | `tipos`, `seleccion` | `interaccion`, `controles` |
| `js/filtros.js` | `tipos`, `conexiones` | `dibujo`, `inspector` |
| `js/zonas.js` — patrones y zonas por dos puntos | `colocar`, `nodos` | `dibujo`, `catalogo` |
| `js/jerarquia.js` — `parent`, sincronización, cascadas | `historial`, `rotacion` | `interaccion`, `historial`, `normalizar` |
| `js/conexiones.js` — `S.conex`, puertos, índices | `jerarquia`, `recursos` | `interaccion`, `historial`, `cables`, `rack` |
| `js/rack.js` (lógica de unidades) y `js/vistarack.js` + `css/rack.css` (modal) | `conexiones`, `jerarquia` | `interaccion`, `controles` |
| `js/cables.js` — longitud y superposición | `conexiones`, `plantas` | `inspector`, `presupuesto` |
| `js/presupuesto.js` — precios, totales, CSV | `cables`, `recursos` | `inspector`, `archivos` |
| `js/pruebas.js` — pruebas (se carga con `index.html?pruebas=1`) | todos | — |

### 3.5 Archivos existentes que se modificarán

| Archivo | Cambio | Fase |
|---|---|---|
| `index.html` | Nuevos `<script>`/`<link>`, aside del inspector, modal del rack, `#ctx`, carga condicional de pruebas | 1, 3, 7 |
| `estado.js` | Hooks de estado, `pt()` extendido a puertos y a hijos, helper de revisión | 1, 2, 7 |
| `dibujo.js` | Separación en `renderObjetos/renderTmp/renderGrilla/renderPaneles`; envoltorio de filtro; `ORD` con valor por defecto y orden padre-hijo; sustituir comparaciones por nombre | 1, 2, 3, 6 |
| `interaccion.js` | `pedir()` en `pointermove`; menú contextual; doble clic de rack; arrastre/anclaje de hijos; extremos de cable a puertos; zonas por dos puntos | 1, 3, 5, 6, 7 |
| `historial.js` | Interfaz `Hist`, tope de memoria, sin recursos en snapshots, ganchos tras `restaurar`; `borrar()` con cascada | 2, 6, 7 |
| `archivos.js` | Guardar/abrir v2 con validación, recursos y CSV; PNG sin `multi`; `Nuevo` reinicia `R`, `F` y paneles | 0, 2, 8 |
| `plantas.js` | `normalizar()` delega en `esquema`; `esVisible` excluye hijos de racks; altura de planta; panel contraíble | 2, 3, 7, 8 |
| `catalogo.js` | Entradas con `tipo/sub/modelo`; ampliación del catálogo; `menu()` solo ante cambios | 1, 2, 4 |
| `controles.js` | Modal abierto = atajos de plano desactivados salvo deshacer/rehacer y Esc; cierre del menú contextual | 3, 7 |
| `nodos.js`, `puertas.js`, `escaleras.js`, `formas.js`, `seleccion.js`, `iman.js`, `colocar.js`, `rotacion.js` | Sustituir `o.n == …` por predicados de tipo; `cableAOtraPlanta` vincula tramos; zonas en `usaDosPuntos` | 2, 5, 8 |
| `lienzo.css`, `base.css`, `barra.css` | Disposición con inspector a la derecha | 3 |

### 3.6 Coherencia entre historial, guardado, render, capas, selección, cables y contenedores

| Regla | Qué evita |
|---|---|
| **R1.** Todo cambio de `S` llama a `push()` antes (ya es la convención). `R`, `F`, `V`, selección e inspector nunca se mutan dentro de `S` | Deshacer que borra recursos o filtros |
| **R2.** Los snapshots serializan solo `S`; las imágenes viven en `R` por hash; el descarte de recursos sin uso ocurre solo al guardar | Snapshots enormes; deshacer que apunta a una imagen ya borrada |
| **R3.** Tras `restaurar`, abrir y nuevo se emite `estado`: `normalizar` → índices de conexiones → sincronización de hijos → inspector/modal | Índices o paneles desactualizados |
| **R4.** `esVisible/esEditable` siguen siendo la única puerta de planta y capa (ahora también excluyen hijos de racks). Los filtros **no** los usan | Filtros que alteran imanes, selección o conexiones |
| **R5.** Los hijos heredan `pl/cp` y se fuerzan en la sincronización; borrar una capa los remapea igual que al padre | Hijos huérfanos en otra capa o planta |
| **R6.** Mover/rotar un contenedor sincroniza hijos; mover un hijo solo recalcula su posición local (`reanclar`); si se suelta fuera del contenedor se desancla. En multiselección no se mueve el hijo cuyo padre ya está seleccionado | Doble movimiento y deriva |
| **R7.** Borrar contenedor borra sus hijos y las conexiones que los referencian; borrar un dispositivo conserva sus cables como líneas libres (comportamiento actual) y deja la conexión con ese extremo en `null` | Referencias colgantes |
| **R8.** Borrar una línea la quita de `rutas`; si era la última, la conexión queda «sin ruta» y se elimina desde el inspector | Pérdida silenciosa de conexiones |
| **R9.** Cada campo nuevo se registra en `esquema.js`; una prueba de ida y vuelta con un proyecto «maestro» falla si un campo se pierde al guardar y abrir | Datos descartados en silencio por la lista blanca |
| **R10.** El modal del rack y el plano comparten `S`; el modal usa `push()` y el historial global; cerrarlo no toca `V`, `sel` ni `tool` | Estados divergentes |

## 4. Plan de fases *(planificado)*

Cada fase deja la aplicación usable y no elimina funciones. Se verifica con `index.html?pruebas=1` (pruebas de lógica) y con la lista de comprobaciones manuales de cada fase. Antes de cerrar una fase se actualiza este documento.

**Fase 0 — Saneamiento y base de pruebas.** *Depende de:* nada. *Archivos:* `archivos.js`, `controles.js`, `index.html`, `SEGUIMIENTO.md`; nuevo `pruebas.js`. *Riesgo:* bajo.
Criterios de aceptación: (1) el PNG con selección múltiple no contiene marcos de selección y la selección se conserva; (2) Retroceso/Supr con un botón enfocado no borra; (3) `?pruebas=1` ejecuta la batería y muestra aprobadas/falladas; (4) quedan guardados 6 proyectos de referencia y su salida de `#c.innerHTML` (referencia «dorada») y una medición base de tiempos; (5) este documento ya no afirma el desvanecimiento.

**Fase 1 — Renderizado en capas** *(implementada; falta verificar en el navegador del usuario; ver sección 6 bis).* *Depende de:* F0. *Archivos:* `dibujo.js`, `interaccion.js`, `catalogo.js`, `index.html`; nuevo `eventos.js`. *Riesgo:* medio-alto (toca el camino caliente).
Criterios: (1) para los 6 proyectos de referencia, `#c.innerHTML` es idéntico byte a byte al de la Fase 0 en estado estático; (2) mover el ratón sin herramienta ni arrastre: 0 reconstrucciones de `#c` y de `#items` (contadores `TR.stats`); (3) desplazar la vista no reconstruye `#c`; (4) un proyecto sintético de 2 000 objetos mejora al menos 5 veces el tiempo por movimiento frente a la medición base; (5) PNG, deshacer y todas las herramientas existentes siguen funcionando (lista manual).

**Fase 2 — Núcleo de datos: tipos, formato v2, recursos, historial** *(en curso: tramo 2A entregado y con sus 25 pruebas automáticas aprobadas por el usuario; tramo 2B revertido, pendiente; ver secciones 6 bis y 8).* *Depende de:* F1. *Archivos:* `estado.js`, `historial.js`, `archivos.js`, `plantas.js`, `catalogo.js` y los módulos con `o.n == …`; nuevos `tipos.js`, `esquema.js`, `recursos.js`. *Riesgo:* alto (formato y migración).
Criterios: (1) abrir los proyectos v1 de referencia produce la misma salida dorada; (2) guardar escribe `version: 2` y volver a abrirlo es idéntico (ida y vuelta); (3) un archivo inválido (`objs` no arreglo, color con `"><script>`, referencias colgantes irrecuperables) muestra el motivo, deja `S` idéntico y no añade pasos al historial; (4) un valor peligroso en un archivo se sanea y no llega a `innerHTML`; (5) una imagen repetida ocupa una sola entrada de `R` y ningún snapshot contiene `data:image`; (6) tras 300 `push` con un proyecto grande, el historial respeta el tope de pasos y de bytes; (7) `Hist` expone `registrar/deshacer/rehacer` con estrategia `snapshots`; (8) no queda en `js/` ninguna comparación de comportamiento por `o.n ==` fuera de `tipos.js` y de la migración; (9) abrir un archivo conserva la posibilidad de deshacer (las imágenes se unen por hash).

**Fase 3 — Inspector, menú contextual y filtros.** *Depende de:* F1, F2. *Archivos:* `index.html`, `interaccion.js`, `controles.js`, `plantas.js`, CSS; nuevos `inspector.js`, `contexto.js`, `filtros.js`, `inspector.css`, `contexto.css`. *Riesgo:* medio.
Criterios: (1) el inspector no pierde el foco ni su texto durante 100 movimientos del ratón; (2) secciones contraíbles y reordenables, con estado recordado; en pantalla estrecha el inspector pasa a cajón; (3) clic derecho con herramienta de cable/pared/forma activa o con una operación en curso conserva el comportamiento actual (cancelar/terminar); con Seleccionar abre el menú adaptado al tipo (varios objetos: acciones comunes); (4) Esc, G, F, H, M, R, Enter, Supr y Ctrl+Z/Y funcionan igual; (5) aplicar cualquier filtro deja `JSON.stringify(S)` idéntico, el historial intacto y los imanes igual de activos; (6) ocultar / atenuar / aislar por dispositivo, red, categoría y capa; (7) con filtro desactivado la salida de `#c` es idéntica a la de F1.

**Fase 4 — Catálogo, imágenes y modelos (req. A).** *Depende de:* F2, F3. *Archivos:* `catalogo.js`, `dibujo.js`, `archivos.js`, `recursos.js`, `inspector.js`. *Riesgo:* medio.
Criterios: (1) importar PNG/JPEG/WebP (sin SVG), reducidos a un tamaño máximo y con tope de tamaño total; (2) un dispositivo puede usar imagen o icono; (3) el PNG exportado muestra las imágenes; (4) alta/edición/baja de modelos con aviso del número de instancias afectadas; (5) catálogo ampliado por categorías (cantidad objetivo a acordar en el diseño detallado); (6) guardar y abrir conserva imágenes y modelos.

**Fase 5 — Rellenos y zonas (req. C, etapa 1).** *Depende de:* F2. *Archivos:* `dibujo.js`, `controles.js`, `index.html`, `colocar.js`, `interaccion.js`, `nodos.js`, `iman.js`; nuevo `zonas.js`. *Riesgo:* bajo-medio.
Criterios: (1) al menos 6 patrones además del sólido y la diagonal, con definiciones compartidas por patrón y color; (2) los archivos con relleno `hat` se ven igual; (3) las zonas rectangulares se crean con dos puntos (clic-clic o arrastrar) y se pegan a extremos de paredes y esquinas; (4) las zonas elípticas siguen funcionando; (5) ida y vuelta de archivo; (6) la detección automática de habitaciones queda como estudio documentado, sin implementar.

**Fase 6 — Jerarquía y mesas (req. D).** *Depende de:* F2, F3. *Archivos:* `interaccion.js`, `historial.js`, `rotacion.js`, `dibujo.js`, `plantas.js`, `catalogo.js`; nuevo `jerarquia.js`. *Riesgo:* medio.
Criterios: (1) mover y rotar una mesa mueve y rota sus equipos; (2) soltar un equipo sobre una mesa lo ancla y fuera de ella lo desancla; (3) hijos heredan planta y capa y siguen al padre al borrar capas; (4) borrar la mesa borra sus equipos; (5) un cable a un equipo de una mesa se une al equipo, no a la mesa; (6) los equipos se dibujan por encima de la mesa; (7) deshacer/rehacer restituyen anclajes.

**Fase 7 — Conexiones, puertos y racks (req. B).** *Depende de:* F4, F6. *Archivos:* `estado.js`, `interaccion.js`, `historial.js`, `plantas.js`, `catalogo.js`, `controles.js`, `index.html`; nuevos `conexiones.js`, `rack.js`, `vistarack.js`, `rack.css`. *Riesgo:* alto.
Criterios: (1) el rack admite equipos por unidades con rechazo de solapes y de excesos de altura; (2) doble clic en un rack abre el modal y se vuelve al plano con vista, selección y herramienta intactas; (3) se pueden seleccionar, editar y conectar puertos en el modal; (4) conectar desde el plano pide el puerto cuando el dispositivo los tiene; (5) mover un vértice o redibujar la ruta no cambia el `id` de la conexión; mover un extremo a otro dispositivo limpia el puerto; (6) Ctrl+Z / Ctrl+Y funcionan con el modal abierto; (7) borrar un dispositivo o un rack aplica la cascada R7; (8) etiquetas físicas junto a cada extremo, activables y exportables en el PNG; (9) los archivos v1 migrados tienen una conexión por cada cable.

**Fase 8 — Cables y presupuesto (req. E y F).** *Depende de:* F7. *Archivos:* `escaleras.js` (`cableAOtraPlanta`), `plantas.js`, `inspector.js`, `archivos.js`; nuevos `cables.js`, `presupuesto.js`. *Riesgo:* medio.
Criterios: (1) longitud = horizontal de todas las rutas + vertical por altura de las plantas atravesadas + holgura; prueba con cifras conocidas; (2) los tramos que continúan entre plantas se unen en una sola conexión y no se duplican; (3) la longitud se muestra por cable y en total; (4) la detección de superposición agrupa tramos colineales que comparten longitud (no cuenta cruces ni extremos que se tocan); el panel lista, selecciona, resalta y aísla; (5) cables sin ruta aparecen como «estimada»; (6) precios editables por modelo y por metro, moneda, cantidades y holgura; subtotales por modelo, costo de cableado y total; (7) el CSV (separador `;` y BOM UTF-8, a confirmar) se abre bien en Excel; (8) PDF y XLSX quedan como ampliación posterior.

**Fase 9 — Estudios y ampliaciones futuras.** Detección de habitaciones cerradas, historial por parches, exportaciones PDF/XLSX, desvanecimiento de escaleras (D15).

## 5. Riesgos pendientes

| Gravedad | Riesgo | Mitigación prevista |
|---|---|---|
| Alta | Pérdida silenciosa de campos por la lista blanca de `esquema.js` | Regla R9 y prueba de ida y vuelta |
| Alta | Regresiones visuales al partir `render()` | Referencia dorada de la F0 y comparación byte a byte |
| Media | Plantillas (`R`) editadas después de usarse | Resuelto en el diseño: plantillas versionadas; actualizar instancias es explícito, confirmado y deshacible (Fase 4) |
| Media | Doble dirección línea↔conexión (extremos) | Funciones explícitas de sincronización y pruebas |
| Media | Tamaño de snapshots con muchos objetos | Puertos por plantilla, tope en bytes, estrategia `Hist` reemplazable |
| Media | `cableAOtraPlanta` crea hoy dos objetos sin vínculo | Se vincula en la F8; los archivos v1 migran cada pieza como conexión propia (revisable a mano) |
| Media | El doble clic en un rack deja de poner etiqueta | La etiqueta pasa al menú contextual y al inspector |
| Baja | Atajos F, H, M, G, R ya ocupados | Los comandos nuevos van por menú contextual e inspector |
| Baja | Nombres globales de una letra (`I`, `L`, `T`, `S`, `V`) | El código nuevo usa el namespace `TR` |

## 6. Decisiones confirmadas (27/10/2026)

1. **Puertos por plantilla:** aceptado con condiciones. Puertos predeterminados en la plantilla; cada dispositivo conserva sus etiquetas, conexiones y configuración. Modificar una plantilla no altera en silencio las instancias: la actualización es una acción explícita, con confirmación y deshacible. Las conexiones compatibles se conservan.
2. **Conexión lógica en todos los cables:** aceptado con condiciones. Identificador estable; varios tramos visuales (también entre plantas); las conexiones incompletas se guardan identificadas y no cuentan como completas; sin duplicados al unir tramos entre plantas.
3. **Filtros y PNG:** aceptado. Los filtros no modifican el modelo ni afectan conexiones, imanes o selección lógica y no se guardan en el proyecto. El PNG muestra lo visible según los filtros activos, sin menús, paneles, controles de selección ni guías temporales (salvo petición expresa).
4. **CSV:** aceptado. Separador `;`, BOM UTF-8 y coma decimal; verificar la apertura en Excel en español; números como datos (no texto); cuidar nombres, precios, cantidades y longitudes.
5. **Imágenes:** aceptado con límites iniciales. PNG, JPEG y WebP; máximo 5 MB por imagen y 50 MB de imágenes por proyecto; validar el formato real (firma del archivo) y las dimensiones, no la extensión; informar claramente si se supera un límite sin perder el trabajo; conservar imágenes al guardar, cerrar y abrir; no duplicar una imagen reutilizada; aplicar el límite al importar, pegar, guardar y abrir.
6. **Imán de zonas:** aceptado. Línea central de las paredes (comportamiento actual); cualquier otra modalidad será opcional y no cambiará el comportamiento de los proyectos existentes.

**Reglas de trabajo acordadas:** una fase por vez; antes de cada fase se indican archivos y pruebas; al terminar se informa lo implementado y los resultados **reales** de las pruebas (sin afirmar las que no se ejecutaron); no se avanza a una fase que dependa de otra sin verificar; no se borra `/mnt/project` ni archivos antiguos sin comprobar una copia de seguridad válida; si el entorno no permite editar la carpeta, se entregan archivos completos y se indica cuáles reemplazar.

## 6 bis. Avances reales

### Fase 0 — Saneamiento y base de pruebas: COMPLETADA (28/10/2026)

Criterios de aceptación y su verificación:

| Criterio | Verificación |
|---|---|
| 1. El PNG con selección múltiple no trae marcos y la selección se conserva | Confirmado por el usuario en su navegador tras reemplazar `archivos.js`; además 8 comprobaciones en Node (simulado) |
| 2. Retroceso/Supr con un botón enfocado no borra | Prueba «Teclado» aprobada en el navegador del usuario; 6 comprobaciones en Node |
| 3. `?pruebas=1` ejecuta la batería | Ejecutada por el usuario |
| 4. Referencia de dibujo de 6 proyectos y medición base | Guardadas por el usuario; comparación «Idéntica». Base con 3 000 objetos (2 000 dispositivos + 1 000 cables): render 49,9 y 45,2 ms; mover sin arrastrar 43,9 y 42,3 ms (dos mediciones) |
| 5. Este documento no afirma el desvanecimiento de escaleras | Cumplido |

Incidencia resuelta: la prueba PNG falló con `construirSvgExport is not defined` porque el navegador usaba un `archivos.js` sin esa función (el entregado la define; verificado). Se añadió la prueba «Instalación».

### Fase 1 — Renderizado en capas: COMPLETADA, con una salvedad (28/10/2026)
Archivos a reemplazar en `Topologias_de_red/` (conservar copia de los originales): `index.html`, `js/dibujo.js`, `js/interaccion.js`, `js/pruebas.js`, `SEGUIMIENTO.md`; **archivo nuevo** `js/eventos.js`. Sin cambios: el resto de los módulos (incluidos `archivos.js` y `controles.js` de la Fase 0).

Cambios: (1) el SVG se divide en `#vp` > `#g-grilla` / `#c` / `#g-tmp` (ver tabla de archivos); (2) mover el ratón sin herramienta ni arrastre solo actualiza la barra de estado: no reconstruye `#c`, la capa temporal, la vista, los botones, las reglas ni el menú; (3) con una herramienta activa solo se redibuja `#g-tmp`; (4) al desplazar la vista solo cambia el `transform` de `#vp` (y las reglas); (5) el zoom con la rueda solo rehace vista, grilla y reglas; (6) al arrastrar objetos se redibuja `#c` y `#g-tmp`; (7) `render()` sigue siendo síncrono y completo (PNG y los ~70 llamadores sin cambios).

Diferencias respecto a lo diseñado (decididas por riesgo y verificabilidad): (a) **no se implementó `pedir()` con `requestAnimationFrame`**: los repintados son síncronos para que las mediciones reflejen el trabajo real; se retomará si la medición de arrastre lo justifica; (b) **`render()` ya no reconstruye el menú izquierdo**: `setTool` y el clic de pestañas ya lo hacían, por lo que la llamada era redundante (el menú solo cambia con la pestaña o la herramienta); (c) **el objeto en curso se dibuja en `#g-tmp`**, por encima de las asas de otros objetos (antes quedaba dentro de `#c`, debajo de ellas); solo afecta a lo que se ve mientras se dibuja; (d) el contador `TR` es opcional.

**Pruebas ejecutadas por Claude (Node, navegador simulado, con los `dibujo.js`, `interaccion.js`, `eventos.js` y `pruebas.js` entregados): 31 aprobadas, 0 falladas** (más 22 de la Fase 0, sin regresiones). Qué demuestran y qué no:
- `#c` idéntico byte a byte entre la implementación anterior (reconstruida a partir del original) y la nueva en 32 combinaciones (6 proyectos + estrés, todas sus plantas, 4 estados de selección). Los dibujantes de cada tipo (`dibujarForma`, escaleras, cotas…) fueron **sustituidos por marcadores**: se comprueba la composición del dibujo, no el SVG real de cada tipo.
- Grilla y transformación de la vista idénticas a las anteriores; objeto en curso en `#g-tmp` sin alterar `#c` (también con relleno diagonal).
- Contadores: 25 movimientos sin arrastrar → 0 reconstrucciones de nada; cable en curso → solo `#g-tmp`; desplazar → solo vista; zoom → vista y grilla; arrastrar → `#c` en cada movimiento con un único paso de historial; salir el cursor → solo la capa temporal.
- Contraste: la implementación anterior hacía 25 `render()` completos y 25 reconstrucciones del menú en 25 movimientos.
- Robustez: si el SVG se vacía desde fuera, las capas se recrean; sin `eventos.js` todo sigue funcionando.
- Las 8 pruebas de Fase 1 de `pruebas.js` se ejecutaron contra el simulador (comprueba que están bien escritas) y la medición devuelve sus 6 cifras. **Los tiempos de esas ejecuciones simuladas no valen como rendimiento.**

**Verificación en el navegador del usuario (28/10/2026):**

| Criterio de aceptación | Resultado |
|---|---|
| 1. Dibujo idéntico a la referencia de la Fase 0 | **Cumplido**: «Comparar con la referencia» → idéntico |
| 2. 0 reconstrucciones al mover el ratón sin arrastrar | **Cumplido**: 0 reconstrucciones (prueba automática aprobada) |
| 3. Desplazar la vista no reconstruye `#c` | **Cumplido**: 0,1 ms por movimiento; prueba aprobada |
| 4. Mejora ≥ 5 veces frente a la base (mover sin arrastrar, 3 000 objetos) | **Cumplido**: base 43,9 / 42,3 ms → no se reconstruye nada (el ≈0 ms es «no hay trabajo», no una medición de tiempo de procesamiento nulo) |
| 5. PNG, deshacer y herramientas siguen funcionando | **Parcial**: PNG cubierto por la prueba automática aprobada; el usuario no informó la lista de uso manual (seleccionar, mover, rotar, cables, paredes, puertas, escaleras, medir, deshacer/rehacer, guardar/abrir). Se seguirá comprobando durante la Fase 2 |

Pruebas automáticas en el navegador del usuario: **13 aprobadas, 0 falladas**.

Mediciones del usuario con 3 000 objetos (medianas): renderizado completo 46,6 ms; mover sin arrastrar ≈ 0 ms; desplazar la vista 0,1 ms; zoom 10,6 ms; arrastrar un objeto 44,4 ms (≈ un `render()`: `#c` se sigue reconstruyendo entero en cada movimiento al arrastrar; no es una regresión). El zoom (10,6 ms) incluye regenerar la grilla y las reglas.

Problemas pendientes (no resueltos en esta fase, por diseño): abrir un archivo sin validar, valores sin escapar en `innerHTML`, `ORD` sin valor por defecto, zonas con origen en la esquina, comportamiento por nombre visible y versión de formato fija (Fase 2). Al arrastrar o dibujar con muchos objetos, `#c` se sigue reconstruyendo entero en cada movimiento (≈ lo que cuesta un `render()`); se evaluará la agrupación por fotograma tras medirlo.

### Fase 2 — Núcleo de datos: EN CURSO (28/10/2026) — tramo 2A entregado y aprobado por las pruebas automáticas del usuario (faltan las comprobaciones manuales de 8.5); tramo 2B revertido

La Fase 2 se hace de forma incremental en dos tramos para poder verificar cada uno: **2A** (formato v2, validación, recursos, historial y tipos asignados) y **2B** (sustituir en los módulos las comparaciones por nombre visible por los predicados de `tipos.js`). El criterio 8 (ninguna comparación `o.n == …` fuera de `tipos.js`) pertenece al 2B.

**Archivos del tramo 2A, con su ruta dentro de `Topologias_de_red/`:** nuevos `js/tipos.js`, `js/recursos.js`, `js/esquema.js`; reemplazar `index.html`, `js/historial.js`, `js/archivos.js`, `js/pruebas.js`, `SEGUIMIENTO.md`. El resto de los módulos no cambia. Copias de respaldo de lo que cambió entre la Fase 1 y la 2 (entregadas junto con esta fase): carpeta `respaldo_originales_fase2/` (`SEGUIMIENTO.md`, `archivos.js`, `index.html`, `pruebas.js`). El `historial.js` anterior es el que ya tenés en tu carpeta: conservalo antes de reemplazar.

**Formato de proyecto v2:** `{ formato: 'topologias-de-red', version: 2, estado: {…S, cada objeto con tipo y sub}, recursos: { imgs, modelos } }`. Los archivos v1 (planos, con `version: 1` o sin `version`) se migran solos al abrirlos: se validan, se sanean y cada objeto recibe su `tipo`/`sub`; guardar escribe v2.

**Política de validación al abrir (`ESQ.leer`):** nunca modifica `S`, `R` ni el historial; construye un estado nuevo copiando solo campos conocidos. *Se rechaza el archivo* (y se explica el motivo) si: no es JSON; no parece un proyecto; la versión es más nueva; faltan los objetos; un objeto no tiene id válido o es de clase desconocida; hay ids repetidos; faltan coordenadas o medidas esenciales o no son números; hay una planta o capa repetida; una imagen no es un PNG, JPEG o WebP real, está dañada, su identificador no coincide con su contenido o supera los límites; las imágenes del archivo, sumadas a las ya cargadas, superan los 50 MB. *Se abre con aviso* si: colores, iconos o trazos son inválidos (se omiten; un cable recupera color y grosor), textos o números están fuera de rango (se corrigen), hay campos desconocidos (se omiten), hay uniones a objetos inexistentes (el punto queda libre donde estaba), hay puertas sin pared (se omiten) o referencias a imágenes o modelos que el archivo no trae (se quitan). Si algo falla de forma inesperada durante la apertura, se restaura el proyecto anterior.

**Política al guardar:** el archivo solo lleva las imágenes y modelos que el proyecto usa; si las imágenes superan los límites, o el proyecto no pasaría la validación al volver a abrirlo, no se descarga nada y se explica el motivo (y «Guardar y empezar nuevo» no borra nada).

**Decisiones del tramo 2A (y diferencias con lo diseñado):** (a) el `tipo` se escribe en los objetos al abrir, al deshacer/rehacer y al guardar; los objetos creados en la sesión lo reciben en la siguiente de esas operaciones (`add()` no cambió); mientras tanto `tipoDe(o)` lo deriva. El 2B hará que `add()` lo asigne. (b) La opacidad y demás comportamientos no cambian. (c) `abrirTexto` guarda un paso de historial antes de reemplazar (como antes), por lo que se puede deshacer la apertura; las imágenes del proyecto anterior siguen en `R` (se unen por hash), así que deshacer las recupera. (d) Un paso idéntico al anterior ya no se duplica en el historial. (e) Dimensiones máximas de imagen iniciales (8 000 px por lado y 40 millones de píxeles) elegidas por mí; no estaban en tus límites y son ajustables en `R.limites`. (f) Los modelos solo tienen almacén, validación y fusión; su edición con versiones llega en la Fase 4.

**Pruebas ejecutadas por Claude (Node; sin navegador real):**
- Lógica pura con los módulos **reales** (`tipos.js`, `recursos.js`, `esquema.js`, `historial.js`), imágenes PNG/JPEG/WebP **reales** generadas con PIL: **53 aprobadas, 0 falladas**. Cubren: 20 nombres antiguos → tipo; migración v1 → v2 de los 6 proyectos de prueba y uno de estrés sin perder ni cambiar datos y sin avisos; guardar → abrir → guardar da el mismo texto; 17 archivos inválidos rechazados con motivo; saneamiento (scripts en colores, iconos y trazos; números y textos; uniones colgantes; `__proto__`); imágenes (dimensiones leídas de los bytes en PNG, JPEG, WebP VP8, VP8L y VP8X; formato declarado falso; SVG, HTML y URL; 9 000 px; 5 MB reales; duplicados; límite total); guardar solo lo usado; fusión con renumeración de modelos; límites al abrir y al guardar; historial (tope de pasos y de memoria, sin duplicados, deshacer/rehacer, otra estrategia).
- Las 12 pruebas «Fase 2» de `pruebas.js` y las anteriores, contra el navegador **simulado** con `historial.js`, `archivos.js`, `esquema.js`, `dibujo.js` e `interaccion.js` reales: **23 aprobadas, 0 falladas**.
- Regresión: Fase 1 (simulado) **31 aprobadas, 0 falladas**; Fase 0 (simulado) **22 aprobadas, 0 falladas**.
- Límites de estas pruebas: no hay navegador real (no se probaron el selector de archivos, `alert`, la descarga ni el dibujo real de cada tipo), y la migración se comprobó con los proyectos de prueba, no con tus archivos reales.

**Pendiente en el navegador del usuario (tramo 2A):** (1) reemplazar archivos, abrir `index.html?pruebas=1`, Ctrl+F5, «Ejecutar pruebas»: deben pasar las 25; (2) «Comparar con la referencia»: «Idéntico»; (3) **abrir uno o más de tus archivos `.json` reales guardados antes** (v1): deben abrir, verse igual y, si hay avisos, anotarlos; (4) guardar, cerrar y volver a abrir ese archivo (ahora v2) y comprobar que se ve igual; (5) abrir un `.json` inválido (por ejemplo, uno cortado a mitad) y comprobar el mensaje y que tu proyecto no cambia; (6) deshacer inmediatamente después de abrir un archivo; (7) la lista de uso manual de la Fase 1 que sigue sin confirmarse.

**Tramo 2B — REVERTIDO el 28/10/2026 a pedido del usuario (ver sección 8.4): su trabajo quedó archivado, sin verificar y sin instalar. Alcance previsto:** sustituir `o.n == …` por los predicados en `dibujo.js`, `interaccion.js`, `estado.js`, `catalogo.js`, `colocar.js`, `nodos.js`, `puertas.js`, `escaleras.js`, `formas.js`, `seleccion.js`, `iman.js`, `rotacion.js` y `plantas.js`; hacer que `add()` asigne el tipo; catálogo con `tipo`/`sub`. No empieza hasta verificar el 2A. Fase 3 no empieza hasta cerrar la Fase 2 completa. **Resultado informado por el usuario sobre el tramo 2A (28/10/2026): 25 pruebas aprobadas, 0 fallidas, y dibujo idéntico a la referencia.**

## 7. Registro de cambios de este documento

- 27/10/2026: corrección del desvanecimiento de escaleras (pendiente); añadidas la auditoría, las decisiones aprobadas D1–D15, la arquitectura objetivo, el plan de fases F0–F9, los riesgos y las decisiones por confirmar. No se modificó código.
- 27/10/2026 (2): decisiones confirmadas (sección 6), refinamiento de D1/D2 (plantillas versionadas, conexiones incompletas) y avance de la Fase 0 (sección 6 bis). Código modificado: `archivos.js`, `controles.js`, `index.html`; nuevo `pruebas.js`.
- 28/10/2026: registrados los resultados del usuario en la Fase 0 (PNG fallido: `construirSvgExport is not defined`; base de rendimiento), diagnóstico del fallo y prueba de instalación en `pruebas.js`. La Fase 0 sigue abierta; no se inició la Fase 1.
- 28/10/2026 (2): Fase 0 completada (sección 6 bis). Fase 1 implementada (`dibujo.js`, `interaccion.js`, `eventos.js` nuevo, `index.html`, `pruebas.js`), pendiente de verificación en el navegador. No se inició la Fase 2.
- 28/10/2026 (3): resultados verificados de la Fase 1 en el navegador del usuario (13 pruebas, referencia idéntica, mediciones). Fase 1 completada con una salvedad: la lista de uso manual no fue informada.
- 28/10/2026 (4): Fase 2, tramo 2A entregado (`tipos.js`, `recursos.js`, `esquema.js`, `historial.js`, `archivos.js`, `index.html`, `pruebas.js`); pendiente de verificación en el navegador. Tramo 2B pendiente.
- 28/10/2026 (5): tramo 2B escrito y luego **revertido** a pedido del usuario (los archivos instalables vuelven a ser los de la Fase 2A; el trabajo de la 2B quedó en `NO_INSTALAR_fase2b_pendiente/`). Añadida la sección 8 con todo lo necesario para continuar en otro chat.

---

## 8. Guía para continuar en otro chat (escrita el 28/10/2026)

Esta sección resume todo lo necesario para retomar el trabajo sin el historial de la conversación. Léela entera antes de tocar nada.

### 8.1 Estado en una mirada

| Fase | Estado | Qué confirmó el usuario | Pendiente |
|---|---|---|---|
| 0 Saneamiento y pruebas | **Completada** | PNG correcto, teclado, referencia de dibujo y medición base | — |
| 1 Renderizado en capas | **Completada con una salvedad** | 13 pruebas aprobadas, referencia idéntica, 0 reconstrucciones al mover sin arrastrar, mediciones (8.7) | La lista de uso manual (seleccionar, mover, rotar, cables, paredes, puertas, escaleras, medir, deshacer/rehacer, guardar/abrir) nunca se informó |
| 2A Formato v2, recursos, historial, tipos asignados | **Entregada y aprobada por las pruebas automáticas del usuario** | «25 pruebas aprobadas, 0 fallidas» y dibujo idéntico a la referencia | Comprobaciones manuales de 8.5 (abrir `.json` reales, guardar/abrir v2, archivo dañado, deshacer tras abrir) |
| 2B Predicados de tipo en los módulos | **REVERTIDA** a pedido del usuario; trabajo archivado | — | Rehacer y verificar (8.4) |
| 3 Inspector, menú contextual y filtros | No iniciada | — | Depende de cerrar la 2 |
| 4 a 9 | No iniciadas | — | Ver sección 4 |

### 8.2 Qué hay instalado (después de la reversión)

Carpeta `Topologias_de_red/` (versión de la Fase 2A):
- `index.html` (carga, en este orden: `estado`, `eventos`, `tipos`, `recursos`, `esquema`, `catalogo`, `dibujo`, `reglas`, `rejilla`, `plantas`, `historial`, `iman`, `nodos`, `medidas`, `escaleras`, `formas`, `puertas`, `rotacion`, `seleccion`, `colocar`, `interaccion`, `controles`, `archivos`, `main`; y `pruebas.js` solo con `?pruebas=1`).
- Archivos entregados y reemplazados por Claude durante las fases (los que están en este chat): `js/archivos.js`, `js/controles.js`, `js/dibujo.js`, `js/interaccion.js`, `js/historial.js`, `js/pruebas.js`, y los nuevos `js/eventos.js`, `js/tipos.js`, `js/recursos.js`, `js/esquema.js`, además de `index.html` y este `SEGUIMIENTO.md`.
- **Archivos que Claude nunca reemplazó y solo existen en la carpeta del usuario** (los originales de la auditoría): `js/estado.js`, `js/catalogo.js`, `js/reglas.js`, `js/rejilla.js`, `js/plantas.js`, `js/iman.js`, `js/nodos.js`, `js/medidas.js`, `js/escaleras.js`, `js/formas.js`, `js/puertas.js`, `js/rotacion.js`, `js/seleccion.js`, `js/colocar.js`, `js/main.js` y todo `css/`. **El próximo chat no los tendrá a menos que el usuario adjunte la carpeta completa.**

Otras carpetas entregadas (fuera de `Topologias_de_red/`):
- `respaldo_originales_fase2/`: `SEGUIMIENTO.md`, `archivos.js`, `index.html` y `pruebas.js` tal como estaban al cerrar la Fase 1.
- `respaldo_originales_fase2b/`: `dibujo.js`, `interaccion.js`, `pruebas.js` y `SEGUIMIENTO.md` tal como estaban al cerrar la Fase 2A (son los que se restauraron).
- `NO_INSTALAR_fase2b_pendiente/`: el trabajo de la 2B (ver 8.4). **No copiar a la carpeta del proyecto.**
- `herramientas_pruebas_node/`: arnés de pruebas en Node (ver su `LEEME.txt`).
- `Auditoria_Topologias_de_red.pdf`: auditoría inicial.
- Si el usuario llegó a copiar a su carpeta algún archivo de la 2B (`estado`, `catalogo`, `colocar`, `nodos`, `puertas`, `escaleras`, `formas`, `seleccion`, `iman`, `rotacion`, `plantas`), debe volver a poner el original que tenía antes: Claude no entregó copias de esos 11 originales (no existían en el disco del entorno). Para `dibujo.js`, `interaccion.js` y `pruebas.js` valen los archivos instalables actuales.

### 8.3 Reglas de trabajo del usuario (se mantienen)

- Responder en español (Argentina: voseo), con tablas y listas cuando ayuden. Ser claro y breve en los informes.
- Una fase por vez. **Antes de cada fase**, decir qué archivos se modificarán y qué pruebas se harán. **Al terminar**, informar qué se implementó, qué pruebas se ejecutaron y sus resultados **reales**; diferenciar siempre las pruebas automáticas **simuladas** (Node) de las que requieren el navegador del usuario, e indicar exactamente qué debe hacer él y qué resultado debe enviar. **Nunca afirmar que una prueba pasó si no se ejecutó.**
- No avanzar a una fase que dependa de cambios sin verificar. Verificar la fase anterior antes de cambios estructurales.
- Entregar **archivos completos** (no fragmentos) con su **ruta exacta**, indicar qué reemplazar y qué respaldo conservar. No borrar `/mnt/project` ni archivos antiguos sin copia de seguridad válida. No tocar `/mnt/project/SEGUIMIENTO.md` (copia antigua).
- No reescribir toda la aplicación, no cambiar de tecnología sin justificación, conservar las funciones existentes, no duplicar lógica. Si hay una incompatibilidad real, explicarla **antes** de cambiar.
- Mantener compatibilidad con proyectos antiguos y con el historial, los archivos y la documentación. Actualizar este documento con decisiones, avances reales y problemas pendientes.
- Decisiones confirmadas: sección 2 y sección 6 (puertos por plantilla con plantillas versionadas, conexiones lógicas, filtros, CSV con `;`/BOM/coma decimal, imágenes 5 MB / 50 MB, imán de zonas a la línea central de la pared).
- Entorno del chat anterior: la carpeta del proyecto **no estaba en el disco** (los archivos llegaron como adjuntos de la conversación), por eso Claude entregó archivos completos reescritos a mano a partir del contenido adjunto. Si en el nuevo chat la carpeta está en el disco (`/mnt/user-data/uploads`), conviene **editar los archivos reales con parches** (ver 8.4). En ese chat la memoria estuvo bloqueada para escribir: **este documento es la única fuente de continuidad**.

### 8.4 Cómo retomar la Fase 2B

**Objetivo.** Sustituir en los módulos las comparaciones por nombre visible (`o.n == 'Escalera'`, `'Pared'`, `'Círculo'`, `'Ascensor'`) por los predicados de `tipos.js`, para que cambiar el nombre visible de un objeto no altere su comportamiento ni su identificación interna (criterio 8 de la Fase 2: ninguna comparación de comportamiento por `o.n ==` fuera de `tipos.js` y de la migración). Compatibilidad total con proyectos antiguos (los objetos sin `tipo` siguen funcionando porque `tipoDe`/`subDe` los derivan del nombre solo en `derivarTipo`).

**Recomendación.** Con la carpeta real a mano, aplicar las ediciones de la tabla como **parches de texto** (una sustitución exacta por línea, comprobando que cada texto antiguo aparece una sola vez) en lugar de reescribir 11 archivos. La reescritura a mano (hecha en el chat anterior) es lenta y arriesga errores de transcripción.

**Ediciones exactas (antiguo → nuevo).** Los predicados (`esPared`, `esCable`, `esEscalera`, `esAscensor`, `esCirculo`, `claveLinea`, `tipoDe`, `subDe`, `completarTipo`) ya existen en `js/tipos.js`.

| Archivo | Edición |
|---|---|
| `estado.js` | `itemAt`: `o.n != 'Escalera'` → `!esEscalera(o)` |
| `catalogo.js` | `SH` pasa a usar subtipos como claves (`rectangulo`, `circulo`, `triangulo`, `rombo`, `hexagono`, en ese orden); nueva constante `NOMBRE_FORMA = {rectangulo:'Rectángulo', circulo:'Círculo', triangulo:'Triángulo', rombo:'Rombo', hexagono:'Hexágono'}`; categoría «Formas»: `Object.keys(SH).map(sub => ({ k: 'shape', n: NOMBRE_FORMA[sub], tipo: 'forma', sub }))`; `preview`: `d.n == 'Escalera'` → `esEscalera(d) && !d.esc` y `SH[d.n]` → `SH[d.sub]`; `setTool`: `(d.n == 'Escalera' || d.esc)` → `esEscalera(d)` |
| `colocar.js` | `usaDosPuntos`: `t.n == 'Escalera' \|\| !!t.esc` → `esEscalera(t)`; `ajustarColocacion`: `t.n == 'Círculo'` → `esCirculo(t)`; `clicDosPuntos`: la escalera base lleva `tipo: 'escalera'` y la forma base `tipo: 'forma', sub: subDe(tool)`; `guiaColocar`: `t.n == 'Círculo'` → `esCirculo(t)` |
| `nodos.js` | `nodosDeTipo`: `o.n != tipo` → `claveLinea(o) != tipo`; `tipo != 'Pared'` / `tipo == 'Pared'` → `'pared'`; `tmp.n == tipo` → `claveLinea(tmp) == tipo`; `o.n == 'Escalera'` → `esEscalera(o)`; `tipoActivo`: `tool.n` → `claveLinea(tool)`, `'Pared'` → `'pared'`, `drag.o.n` → `claveLinea(drag.o)` |
| `puertas.js` | `segmentoCercano`: `o.n != 'Pared'` → `!esPared(o)` |
| `escaleras.js` | `esEsc`: `o.n == 'Escalera'` → `esEscalera(o)`; `cablesFantasma`: `o.n != 'Pared'` → `!esPared(o)` |
| `formas.js` | `manijasForma`, `cotasForma` y `dibujarForma`: `o.n == 'Círculo'` → `esCirculo(o)`; `uDe`: `o.u \|\| SH[o.n]` → `o.u \|\| SH[subDe(o)] \|\| SH.rectangulo` |
| `seleccion.js` | `bboxDe`: `o.n == 'Círculo' && o.rot` → `esCirculo(o) && o.rot` |
| `iman.js` | `puntosMedios`: `o.n != 'Círculo'` → `!esCirculo(o)` |
| `rotacion.js` | `rotarDesde`: `o.n != 'Círculo'` → `!esCirculo(o)` |
| `plantas.js` | `normalizar`: `t.n == 'Escalera'` → `esEscalera(t)` y `o.n == 'Escalera' && !o.c` → `esEscalera(o)` |
| `dibujo.js` | `draw`: `o.n == 'Escalera'` → `esEscalera(o)`; `o.n == 'Pared'` (dos veces) → `esPared(o)`; `status`: `tool.n == 'Círculo'` → `esCirculo(tool)` y `tool.n == 'Escalera' \|\| tool.esc` → `esEscalera(tool)` |
| `interaccion.js` | `add`: añadir `completarTipo(o)` después de asignar `pl`/`cp` y antes de `S.objs.push(o)`; `o.n == 'Ascensor'` → `esAscensor(o)`; `o.k == 'item' && o.n == 'Escalera'` → `o.k == 'item' && esEscalera(o)` |
| Sin cambios | `controles.js`, `archivos.js`, `historial.js`, `eventos.js`, `esquema.js`, `recursos.js`, `medidas.js`, `reglas.js`, `rejilla.js`, `main.js` (revisados: no comparan por nombre) |

**Decisiones de diseño de la 2B (y por qué).**
- El tipo de los objetos nuevos lo completa `add()` con `completarTipo` (que usa `derivarTipo`, el único lugar donde un nombre visible se traduce a tipo). Las piezas en vista previa y los cables en curso no tienen tipo todavía: los predicados lo derivan al vuelo, por eso siguen funcionando.
- Las formas necesitaban un **subtipo** porque `SH[o.n]` (vértices por defecto) dependía del nombre: sin cambiarlo, renombrar una forma rompía su dibujo. Por eso `SH` pasa a usar subtipos y se añade el respaldo `|| SH.rectangulo`.
- `claveLinea` agrupa los nodos por `'pared'` o por el subtipo del cable (`utp6`, `fibra`, `coaxial`, `serial`, `inalambrico`, `energia`); los cables con nombre desconocido caen en `'otro'` y se agrupan entre sí (cambio de comportamiento mínimo, solo para nombres fuera del catálogo).
- Las escaleras conservan su variante en `o.t` (sin `t` = recta, `descanso`, `espiral`): **no** se duplicó en `sub`.
- No se añadió ningún contador ni otro cambio no relacionado (un intento de contar en `menu()` se quitó para mantener la fase acotada).

**Trabajo archivado (`NO_INSTALAR_fase2b_pendiente/`).** Contiene las versiones de la 2B de los 13 archivos de la tabla (`js/*.js`), más `bloque_pruebas_2B.js.txt` (el bloque de pruebas a insertar en `pruebas.js`, antes de la sección «Panel»). **Estado real: escrito pero NO verificado.** Solo se comprobó que los 13 archivos pasan el análisis de sintaxis de Node y que una búsqueda de `.n ==` / `n ==` en los módulos entregados no deja comparaciones por nombre fuera de `tipos.js` y `pruebas.js`. **No se ejecutó** ninguna prueba de la 2B, ni siquiera en el simulador, y los 11 módulos reescritos fueron transcritos a mano desde los adjuntos: pueden contener errores de transcripción. Si se reutilizan, comparar contra los originales.

**Pruebas de la 2B (bloque archivado, 6 pruebas nuevas → 31 en total).** Instalación (catálogo con subtipos, predicados, `add()` asigna tipo); cambiar el nombre visible no cambia el dibujo (huella de `#c`) ni el tipo, en los 6 proyectos de prueba; cambiar el nombre no cambia el comportamiento (función «sonda»: `bboxDe`, `puntosMedios`, `nodosDeTipo`, `segmentoCercano`, `tipoActivo`, giro de formas, reglas de escaleras entre plantas); el tipo decide y no el nombre (caso inverso: un objeto llamado «Escalera» pero de tipo dispositivo no se trata como escalera, una línea llamada «Pared» de tipo cable no es pared, etc.); los objetos nuevos y los colocados en dos puntos reciben su tipo; guardar y abrir conserva el tipo aunque el nombre cambie. **Los valores esperados dentro del bloque no fueron ejecutados y pueden necesitar ajuste.**

**Plan de verificación en Node (pendiente).** Construir un simulador con **todos** los módulos reales (orden de `index.html`, sin `main.js`; usar `herramientas_pruebas_node/stubs/` para `medidas`, `rejilla` y `reglas` solo si no se dispone de los reales) y comprobar: (a) equivalencia de predicados con los nombres antiguos en todo el catálogo y los proyectos de prueba (`esEscalera(d) === (d.n == 'Escalera' || !!d.esc)`, `esPared`, `esCirculo`, `esAscensor`, y que `claveLinea` agrupe igual que el nombre); (b) el dibujo de todos los proyectos sin excepciones y con el mismo `#c` en crudo, con tipo escrito y con nombre cambiado; (c) las pruebas «Fase 2B» del bloque; (d) la búsqueda de comparaciones por nombre sobre **todos** los archivos reales (incluidos los que no se hayan tocado); (e) regresión de las pruebas de las fases anteriores.

**Verificación en el navegador (pendiente, la hace el usuario).** Reemplazar los archivos de la 2B → `index.html?pruebas=1` → Ctrl+F5 → «Ejecutar pruebas» (esperadas 31, todas aprobadas) → «Comparar con la referencia» (debe decir «Idéntico») → uso manual de lo que toca la 2B: colocar y mover escaleras (las tres), círculos y formas con lados, cables de distinto tipo (nodos), paredes con puertas, ascensor (doble clic), imán al punto medio, rotar formas, cambio de planta y reflejo de escaleras, abrir un `.json` antiguo. Conservar copia de los 14 archivos que se reemplazan.

**Riesgos conocidos de la 2B.** Errores de transcripción si se reescriben los módulos; cables con nombre desconocido agrupados como `'otro'`; colisión de nombres de las constantes nuevas (`NOMBRE_FORMA`) con código no revisado; el orden de carga (`tipos.js` debe cargarse antes que `catalogo.js`, ya garantizado en `index.html`).

### 8.5 Verificación pendiente de la Fase 2A en el navegador

El usuario informó que las 25 pruebas automáticas pasaron y que el dibujo coincide con la referencia. No informó: (1) abrir uno o más `.json` reales guardados antes (v1) y ver que se abren y se ven igual (anotar los avisos); (2) guardar ese proyecto, abrir el nuevo archivo (v2) y comprobar que se ve igual; (3) abrir un `.json` dañado (por ejemplo, cortado a mitad): debe aparecer un mensaje y el proyecto no debe cambiar; (4) deshacer justo después de abrir un archivo; (5) la lista de uso manual de la Fase 1.

### 8.6 Cómo seguir después de la 2B

Orden previsto en la sección 4: **Fase 3** (inspector lateral derecho con secciones contraíbles, menú contextual con clic derecho solo sin herramienta activa, filtros ocultar/atenuar/aislar fuera de `S` y sin tocar `esVisible`), **4** (catálogo, imágenes y modelos con plantillas versionadas), **5** (rellenos y zonas por dos puntos), **6** (jerarquía y mesas), **7** (conexiones, puertos y racks con vista de detalle modal), **8** (longitud de cables, superposición y presupuesto con CSV), **9** (estudios: habitaciones automáticas, historial por parches, PDF/XLSX, escaleras desvanecidas). La Fase 3 usa los tipos estables (esquemas de propiedades y acciones por tipo), por lo que conviene cerrar antes la 2B. Cada fase nueva que añada campos a los objetos debe registrarlos en `ESPEC` de `esquema.js` (regla R9) y actualizar la prueba de ida y vuelta.

### 8.7 Resultados reales informados por el usuario

| Prueba | Resultado |
|---|---|
| Fase 0: proyectos, dibujo, teclado, referencia | Aprobadas; PNG falló una vez por usar un `archivos.js` antiguo y luego funcionó |
| Base de rendimiento (3 000 objetos: 2 000 dispositivos + 1 000 cables) | Render completo 49,9 y 45,2 ms; mover sin arrastrar 43,9 y 42,3 ms |
| Fase 1: pruebas automáticas | 13 aprobadas, 0 fallidas; referencia idéntica |
| Fase 1: mediciones | Render completo 46,6 ms; mover sin arrastrar ≈ 0 ms (no se reconstruye nada); desplazar la vista 0,1 ms; zoom 10,6 ms; arrastrar un objeto 44,4 ms |
| Fase 2A: pruebas automáticas | 25 aprobadas, 0 fallidas; dibujo idéntico a la referencia |

Pruebas ejecutadas por Claude en Node (navegador simulado, sobre el árbol instalado actual, tras la reversión): lógica pura de la Fase 2A **53** aprobadas, 0 falladas; pruebas «Fase 2» de `pruebas.js` en el simulador **23** aprobadas; regresión de la Fase 1 **31** aprobadas; de la Fase 0 **22** aprobadas.

### 8.8 Texto sugerido para iniciar el próximo chat

> Continuamos el proyecto «Topologías de red». Adjunto la carpeta completa `Topologias_de_red` (con `index.html`, `css/`, `js/` y `SEGUIMIENTO.md`). Lee primero `SEGUIMIENTO.md`, sobre todo la sección 8, y respeta las reglas de trabajo de 8.3. Estado: Fases 0, 1 y 2A completadas; la 2B está revertida. Quiero retomar la Fase 2B aplicando **parches sobre los archivos reales** (sin reescribir los módulos). Antes de empezar, dime qué archivos vas a modificar y qué pruebas vas a hacer; al terminar, separa las pruebas automáticas simuladas de las que debo hacer en mi navegador. No avances a la Fase 3.
