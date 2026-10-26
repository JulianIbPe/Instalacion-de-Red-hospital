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
| `js/catalogo.js` | Catálogo de dispositivos, cables, formas, eléctrico, edificio (con Escalera, Escalera con descanso y Escalera espiral) y marcado; construcción del menú (al elegir cualquier escalera el color del menú pasa a gris pared). Las dos escaleras nuevas llevan `esc: 'descanso' \| 'espiral'` en el catálogo |
| `js/dibujo.js` | Dibujo de cada objeto en SVG (incluida la guía de colocación; las capas más altas se pintan encima de las inferiores y, debajo de todo, va el reflejo de las escaleras de la planta de abajo) y barra de estado (con mensaje propio para la escalera espiral: centro y radio) |
| `js/reglas.js` | Reglas superior e izquierda en metros |
| `js/rejilla.js` | Grilla activable (tecla G): se adapta al zoom y los objetos se ajustan a ella |
| `js/plantas.js` | Plantas y capas: modelo, panel inferior derecho, ocultar/bloquear/añadir/quitar, jerarquía (subir/bajar plantas y capas con ▲ ▼ o arrastrando el asa ⠿; el panel muestra arriba lo más alto), compatibilidad con archivos antiguos |
| `js/historial.js` | Deshacer, rehacer (hasta 100 pasos) y borrar objetos |
| `js/iman.js` | Imán al medir: el cursor se pega a puntas de paredes/cables, centros de dispositivos y esquinas; imán opcional al punto medio de líneas y lados (tecla M) |
| `js/nodos.js` | Nodos de líneas del mismo tipo: se marcan, el cursor se pega a ellos y la línea nueva queda unida; al colocar escaleras y formas se marcan los extremos de las paredes y las esquinas de las escaleras de la planta actual y el cursor se pega a ellos |
| `js/medidas.js` | Cotas estilo AutoCAD (líneas de extensión, flechas, distancia a la que se estira) y medida lateral de las paredes al dibujarlas |
| `js/escaleras.js` | Tres escaleras en planta, todas guardadas como `{k:'item', n:'Escalera'}` con el campo `t` (sin `t` = recta, `'descanso'`, `'espiral'`), con borde igual al de una pared, escalables con 8 asas y medidas, y color editable (gris pared por defecto): **Escalera** (recta: peldaños, nombre «Escalera» y flecha por el eje que sube; en el reflejo de abajo baja), **Escalera con descanso** (nombre «Escalera» en el descanso, que va arriba; dos tramos separados por dos líneas gruesas con una ranura chica entre ellas, abierta hasta abajo (el borde inferior se dibuja abierto en la ranura); flecha que sube por la izquierda, da la vuelta y baja por la derecha) y **Escalera espiral** (270°, empieza a la izquierda y gira a la derecha, peldaños en abanico desde el eje, flecha curva y nombre «Escalera» en el cuarto abierto, cuya letra se achica junto con la escalera). **Sin relleno** (solo borde y líneas; el interior es transparente pero se puede seleccionar) y **desvanecimiento**: en las tres, el color pasa de opaco al inicio de la subida a la opacidad del reflejo de la planta de abajo (`FIN` = .6) al final, con una máscara por escalera: la recta de abajo hacia arriba, la de descanso siguiendo el camino (tramo izquierdo, descanso, tramo derecho) y la espiral por escalones siguiendo el giro; las flechas y el nombre no se desvanecen. Las escaleras de la planta inferior se ven también en la de arriba (reflejo, flecha ▼ azul). **Reglas con la planta de abajo** (`escaleraObstruida`): la recta no puede pisar ninguna; la de descanso/espiral no puede pisar una de otro tipo, si pisa una del mismo tipo solo se coloca exactamente encima (mismo lugar, tamaño y giro; `encajarAbajo` la ajusta si queda casi encima), y si no pisa ninguna se coloca libremente. Si la de descanso/espiral queda exactamente encima de una igual de abajo, lleva además una segunda flecha azul hacia abajo (`igualAbajo`). Aviso con `avisoEmergente` |
| `js/formas.js` | Formas escalables (8 asas), sus medidas (ancho, alto y radio), tipos de línea y edición de lados (seleccionar, mover, modificar puntas y borrar) |
| `js/puertas.js` | Puertas solo sobre paredes: hueco en la pared, recorrido de apertura en el suelo, vista previa, hasta 2 hojas por división, estirar por los costados |
| `js/rotacion.js` | Rotar la selección (asa ↻ o tecla R): giro de objetos sueltos o de varios a la vez |
| `js/seleccion.js` | Selección múltiple (Mayús+clic) y selección por rectángulo (Mayús + clic izquierdo y arrastrar) |
| `js/colocar.js` | Colocar las escaleras y las formas con dos puntos: escalera recta, escalera con descanso y formas = esquinas opuestas (peldaños a lo largo del lado más largo); círculo y escalera espiral = centro y radio (la espiral queda sin girar); vista previa y guía; los puntos se pegan a los extremos de las paredes y a los puntos medios (tecla M); al soltar una escalera se aplican las reglas de la planta inferior |
| `js/interaccion.js` | Ratón: colocar, mover, dibujar cables y zonas, medir, zoom y desplazamiento |
| `js/controles.js` | Teclado, color, relleno, tamaño del edificio y unidad de medición |
| `js/archivos.js` | Guardar y abrir .json, exportar PNG, botón Nuevo con su aviso |
| `js/main.js` | Arranque (se carga el último) |
| `SEGUIMIENTO.md` | Este registro |

Los scripts se cargan en el orden de `index.html` y comparten variables globales.
