# Guías de Diseño UI y Arquitectura - Sistema POS (Punto de Venta) Pinchos el Parqueadero

## 1. Visión General del Sistema
Aplicación web responsive orientada a Punto de Venta (POS) gastronómico. El diseño debe estar optimizado para su uso rápido e intuitivo en pantallas táctiles (tablets) y monitores de escritorio, minimizando los clics necesarios para tomar una orden y cobrar. 

## 2. Stack Tecnológico Estricto
- **Framework:** React con TypeScript (Functional Components).
- **Estilos:** Tailwind CSS v4 (Uso exclusivo de clases utilitarias, cero CSS personalizado a menos que sea estrictamente necesario en `@theme`).
- **Iconos:** Lucide React (o heroicons).

## 3. Paleta de Colores (Tema Naranja Gastronómico)
Basado en la referencia visual principal, el diseño debe ser limpio, con mucho espacio en blanco y acentos en tonos naranja/rojizos para estimular el apetito y guiar la acción.

- **Color Primario (Botones de acción, llamadas a la atención):** Naranja vibrante. Usar clases de Tailwind como `bg-orange-500` a `bg-orange-600`. Texto sobre primario siempre blanco.
- **Fondo Principal de la App:** Blanco puro (`bg-white`) o un gris extremadamente claro (`bg-gray-50`).
- **Fondos Secundarios (Área superior de categorías o paneles):** Un tono naranja muy pálido (`bg-orange-50` o `#FFF5F3`) para diferenciar secciones sin ser agresivo.
- **Texto Principal:** Gris oscuro casi negro (`text-gray-900`) para legibilidad.
- **Texto Secundario (Descripciones de platos):** Gris medio (`text-gray-500`).
- **Estados:** 
  - Éxito/Activo: Verde (`bg-green-500`)
  - Peligro/Eliminar: Rojo (`bg-red-500`)

## 4. Estructura de Layout Principal (Grid de 3 Columnas)
El layout principal debe ocupar el 100% del alto de la pantalla (`h-screen`) sin scroll general, dividiendo el contenido internamente:

1. **Barra Lateral Izquierda (Navegación - 5% a 8% del ancho):**
   - Menú vertical, muy estrecho.
   - Contiene únicamente iconos centrados (Inicio, Órdenes, Historial, Configuración).
   - Fondo blanco con borde derecho suave (`border-r border-gray-100`).

2. **Área Central (Menú de Productos - ~65% del ancho):**
   - **Header:** Barra de búsqueda redondeada en la parte superior.
   - **Filtros de Categorías:** Fila de botones tipo "píldora" (pill) con desplazamiento horizontal. El botón activo debe tener texto naranja.
   - **Grid de Productos:** Una cuadrícula (CSS Grid) responsiva (`grid-cols-2`, `md:grid-cols-3`, `lg:grid-cols-4`) con scroll vertical independiente.

3. **Panel Derecho (Resumen de la Orden / Carrito - ~25% a 30% del ancho):**
   - Fondo blanco puro con una sombra suave a la izquierda (`shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]`).
   - Cabecera con Número de Mesa y ID de Orden.
   - Lista con scroll vertical de los productos seleccionados (cantidades, nombres, modificadores y precios).
   - Pie fijo en la parte inferior con los totales (Subtotal, Impuestos, Total) y un botón grande y prominente de "Cobrar" o "Enviar Orden" en color Naranja Primario.

## 5. Diseño de Componentes Específicos

### 5.1. ProductCard (Tarjeta de Plato)
- **Contenedor:** Fondo blanco, esquinas muy redondeadas (`rounded-2xl` o `rounded-3xl`), borde sutil (`border border-gray-100`).
- **Interacción:** Efecto hover sutil (`hover:shadow-md hover:-translate-y-1 transition-all`).
- **Imagen:** Ocupa la mitad superior de la tarjeta. Esquinas superiores redondeadas, la imagen debe cubrir el área (`object-cover`).
- **Cuerpo:** Padding interno (`p-4`). 
- **Tipografía:** Título del plato en negrita (`font-bold text-lg`), descripción breve en gris (`text-sm text-gray-500 line-clamp-2`).
- **Footer de la Tarjeta:** Flexbox separando el precio (`text-xl font-bold`) a la izquierda, y un botón naranja brillante a la derecha con el texto "+ Add".

### 5.2. Item del Carrito (Order Panel Row)
- Diseño horizontal limpio.
- Muestra cantidad (ej. "1x") en un color destacado, seguido del nombre del plato.
- Debajo del nombre, los modificadores (ej. "Sin cebolla") en texto pequeño y gris.
- Precio alineado a la derecha.
- Botón de edición pequeño y discreto al lado del precio.

## 6. Reglas de Accesibilidad y UI General
- **Border Radius:** Usar esquinas redondeadas en todos los elementos interactivos (`rounded-full` para píldoras, `rounded-xl` para botones de acción).
- **Sombras:** Mantenerlas suaves y modernas (`shadow-sm` por defecto). Evitar sombras duras u oscuras.
- **Espaciado:** Usar el sistema de espaciado de Tailwind de forma consistente (ej. `gap-4`, `p-6`). Los elementos deben respirar, no verse amontonados.