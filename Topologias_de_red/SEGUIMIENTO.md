# Seguimiento – Topologias_de_red

Para usarla: abrir `index.html` en el navegador (no requiere servidor).

| Ruta | Qué contiene |
|---|---|
| `index.html` | Estructura: barra superior, menú izquierdo, área de trabajo con reglas, barra de estado |
| `css/base.css` | Reglas generales y botones |
| `css/barra.css` | Barra superior y barra de estado |
| `css/menu.css` | Menú izquierdo (pestañas, objetos, color y relleno) |
| `css/lienzo.css` | Área de trabajo y reglas |
| `css/plantas.css` | Panel de plantas y capas (abajo a la derecha) |
| `css/dialogo.css` | Aviso al empezar un archivo nuevo |
| `js/estado.js` | Estado global (objetos, vista, herramienta) y utilidades |
| `js/catalogo.js` | Catálogo de dispositivos, cables, formas, eléctrico, edificio y marcado; construcción del menú |
| `js/dibujo.js` | Dibujo de cada objeto en SVG y barra de estado |
| `js/reglas.js` | Reglas superior e izquierda en metros |
| `js/plantas.js` | Plantas y capas: modelo, panel inferior derecho, ocultar/bloquear/añadir/quitar, compatibilidad con archivos antiguos |
| `js/historial.js` | Deshacer, rehacer (hasta 100 pasos) y borrar objetos |
| `js/iman.js` | Imán al medir: el cursor se pega a puntas de paredes/cables, centros de dispositivos y esquinas |
| `js/medidas.js` | Cotas estilo AutoCAD: dibujo de la medición con líneas de extensión y flechas, y cálculo de la distancia a la que se estira |
| `js/seleccion.js` | Selección múltiple (Mayús+clic) y selección por rectángulo (Mayús + clic izquierdo y arrastrar) |
| `js/interaccion.js` | Ratón: colocar, mover, dibujar cables y zonas, medir, zoom y desplazamiento |
| `js/controles.js` | Teclado, color, relleno, tamaño del edificio y unidad de medición |
| `js/archivos.js` | Guardar y abrir .json, exportar PNG, botón Nuevo con su aviso |
| `js/main.js` | Arranque (se carga el último) |
| `SEGUIMIENTO.md` | Este registro |

Los scripts se cargan en el orden de `index.html` y comparten variables globales.
