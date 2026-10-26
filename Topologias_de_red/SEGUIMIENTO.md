# Seguimiento – Topologias_de_red

Para usarla: abrir `index.html` en el navegador (no requiere servidor).

| Ruta | Qué contiene |
|---|---|
| `index.html` | Estructura: barra superior, menú izquierdo, área de trabajo con reglas, barra de estado |
| `css/base.css` | Reglas generales y botones |
| `css/barra.css` | Barra superior y barra de estado |
| `css/menu.css` | Menú izquierdo (pestañas, objetos, color y relleno) |
| `css/lienzo.css` | Área de trabajo y reglas |
| `css/plantas.css` | Panel de plantas y capas (abajo a la derecha), con botones ▲ ▼ y asa ⠿ para cambiar la jerarquía |
| `css/dialogo.css` | Aviso al empezar un archivo nuevo y cartel de avisos (`.cartel`) sobre el área de trabajo |
| `js/estado.js` | Estado global (objetos, vista, herramienta) y utilidades |
| `js/catalogo.js` | Catálogo de dispositivos, cables, formas, eléctrico, edificio (con Escalera, Escalera con descanso y Escalera espiral) y marcado; construcción del menú (al elegir cualquier escalera el color del menú pasa a gris pared) |
| `js/dibujo.js` | Dibujo de cada objeto en SVG (incluida la guía de colocación; las capas más altas se pintan encima de las inferiores y, debajo de todo, va el reflejo de las escaleras de la planta de abajo) y barra de estado |
| `js/reglas.js` | Reglas superior e izquierda en metros |
| `js/rejilla.js` | Grilla activable (tecla G): se adapta al zoom y los objetos se ajustan a ella |
| `js/plantas.js` | Plantas y capas: modelo, panel inferior derecho, ocultar/bloquear/añadir/quitar, jerarquía (subir/bajar plantas y capas con ▲ ▼ o arrastrando el asa ⠿; el panel muestra arriba lo más alto), compatibilidad con archivos antiguos |
| `js/historial.js` | Deshacer, rehacer (hasta 100 pasos) y borrar objetos |
| `js/iman.js` | Imán al medir: el cursor se pega a puntas de paredes/cables, centros de dispositivos y esquinas; imán opcional al punto medio de líneas y lados (tecla M) |
| `js/nodos.js` | Nodos de líneas del mismo tipo: se marcan, el cursor se pega a ellos y la línea nueva queda unida; al colocar escaleras y formas se marcan los extremos de las paredes y el cursor se pega a ellos; con escalera con descanso o espiral el cursor se pega también a las esquinas de las escaleras de la planta de abajo |
| `js/medidas.js` | Cotas estilo AutoCAD (líneas de extensión, flechas, distancia a la que se estira) y medida lateral de las paredes al dibujarlas |
| `js/escaleras.js` | Tres escaleras en planta, todas con borde igual al de una pared, escalables con 8 asas y medidas, y color editable (gris pared por defecto): **Escalera** (recta, peldaños y ▲ Escalera), **Escalera con descanso** (como la recta pero con un descanso al otro extremo y una línea central que termina en él) y **Escalera espiral** (óvalo con peldaños desde el eje y flecha curva). Las escaleras de la planta inferior se ven también en la de arriba (mismo lugar, diseño, tamaño y color, con la flecha hacia abajo; solo como reflejo). Regla de las dos nuevas: si en la planta de abajo hay una escalera, solo se colocan justo encima de ella (mismo lugar y tamaño); si no, sale un cartel de aviso (`escaleraEncajaAbajo`, `cartel`) |
| `js/formas.js` | Formas escalables (8 asas), sus medidas (ancho, alto y radio), tipos de línea y edición de lados (seleccionar, mover, modificar puntas y borrar) |
| `js/puertas.js` | Puertas solo sobre paredes: hueco en la pared, recorrido de apertura en el suelo, vista previa, hasta 2 hojas por división, estirar por los costados |
| `js/rotacion.js` | Rotar la selección (asa ↻ o tecla R): giro de objetos sueltos o de varios a la vez |
| `js/seleccion.js` | Selección múltiple (Mayús+clic) y selección por rectángulo (Mayús + clic izquierdo y arrastrar) |
| `js/colocar.js` | Colocar las escaleras y las formas con dos puntos: escaleras y formas = esquinas opuestas (la escalera recta y la de descanso ponen los peldaños a lo largo del lado más largo; la espiral queda sin girar), círculo = centro y radio; vista previa y guía; los puntos se pegan a los extremos de las paredes y a los puntos medios (tecla M); al soltar una escalera con descanso o espiral se comprueba la regla de la planta inferior |
| `js/interaccion.js` | Ratón: colocar, mover, dibujar cables y zonas, medir, zoom y desplazamiento |
| `js/controles.js` | Teclado, color, relleno, tamaño del edificio y unidad de medición |
| `js/archivos.js` | Guardar y abrir .json, exportar PNG, botón Nuevo con su aviso |
| `js/main.js` | Arranque (se carga el último) |
| `SEGUIMIENTO.md` | Este registro |

Los scripts se cargan en el orden de `index.html` y comparten variables globales.
