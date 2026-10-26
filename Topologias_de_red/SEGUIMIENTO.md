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
| `css/dialogo.css` | Aviso al empezar un archivo nuevo |
| `js/estado.js` | Estado global (objetos, vista, herramienta) y utilidades |
| `js/catalogo.js` | Catálogo de dispositivos, cables, formas, eléctrico, edificio y marcado; construcción del menú (al elegir Escalera el color del menú pasa a gris pared) |
| `js/dibujo.js` | Dibujo de cada objeto en SVG (incluida la guía de colocación; las capas más altas se pintan encima de las inferiores y, debajo de todo, va el reflejo de las escaleras de la planta de abajo) y barra de estado |
| `js/reglas.js` | Reglas superior e izquierda en metros |
| `js/rejilla.js` | Grilla activable (tecla G): se adapta al zoom y los objetos se ajustan a ella |
| `js/plantas.js` | Plantas y capas: modelo, panel inferior derecho, ocultar/bloquear/añadir/quitar, jerarquía (subir/bajar plantas y capas con ▲ ▼ o arrastrando el asa ⠿; el panel muestra arriba lo más alto), compatibilidad con archivos antiguos |
| `js/historial.js` | Deshacer, rehacer (hasta 100 pasos) y borrar objetos |
| `js/iman.js` | Imán al medir: el cursor se pega a puntas de paredes/cables, centros de dispositivos y esquinas; imán opcional al punto medio de líneas y lados (tecla M) |
| `js/nodos.js` | Nodos de líneas del mismo tipo: se marcan, el cursor se pega a ellos y la línea nueva queda unida; al colocar escaleras y formas se marcan los extremos de las paredes y el cursor se pega a ellos |
| `js/medidas.js` | Cotas estilo AutoCAD (líneas de extensión, flechas, distancia a la que se estira) y medida lateral de las paredes al dibujarlas |
| `js/escaleras.js` | Escalera en planta: borde igual al de una pared, peldaños separados del borde y ▲ Escalera; escalable con medidas y con color editable (gris pared por defecto; las escaleras de archivos antiguos se normalizan en `plantas.js`); las escaleras de la planta inferior se ven también en la planta de arriba (mismo lugar, diseño, tamaño y color, con la flecha ▼ hacia abajo; solo como reflejo) |
| `js/formas.js` | Formas escalables (8 asas), sus medidas (ancho, alto y radio), tipos de línea y edición de lados (seleccionar, mover, modificar puntas y borrar) |
| `js/puertas.js` | Puertas solo sobre paredes: hueco en la pared, recorrido de apertura en el suelo, vista previa, hasta 2 hojas por división, estirar por los costados |
| `js/rotacion.js` | Rotar la selección (asa ↻ o tecla R): giro de objetos sueltos o de varios a la vez |
| `js/seleccion.js` | Selección múltiple (Mayús+clic) y selección por rectángulo (Mayús + clic izquierdo y arrastrar) |
| `js/colocar.js` | Colocar la escalera y las formas con dos puntos: escalera y formas = esquinas opuestas (la escalera pone los peldaños a lo largo del lado más largo), círculo = centro y radio; vista previa y guía; los puntos se pegan a los extremos de las paredes y a los puntos medios (tecla M) |
| `js/interaccion.js` | Ratón: colocar, mover, dibujar cables y zonas, medir, zoom y desplazamiento |
| `js/controles.js` | Teclado, color, relleno, tamaño del edificio y unidad de medición |
| `js/archivos.js` | Guardar y abrir .json, exportar PNG, botón Nuevo con su aviso |
| `js/main.js` | Arranque (se carga el último) |
| `SEGUIMIENTO.md` | Este registro |

Los scripts se cargan en el orden de `index.html` y comparten variables globales.
