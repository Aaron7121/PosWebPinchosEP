# POS Web 2026 — Guía de Diseño (Design Guide)

> Documento vivo y fuente de verdad para implementar el frontend.
> Fusiona la base del proyecto con las guías detalladas de `ui-guidelines.md`.

---

## 1. Visión General del Sistema

Aplicación web responsive de **Punto de Venta (POS) gastronómico** — Pinchos el Parqueadero.
Optimizada para uso rápido e intuitivo en **pantallas táctiles (tablets)** y **monitores de escritorio**, minimizando los clics para tomar una orden y cobrar.

---

## 2. Stack Tecnológico Estricto

| Capa | Tecnología |
|------|------------|
| Framework | React 19 + TypeScript (Functional Components) |
| Routing | react-router-dom 7 |
| Estilos | Tailwind CSS v4 (solo clases utilitarias; cero CSS custom salvo `@theme`) |
| Iconos | lucide-react |
| Estado servidor | TanStack React Query 5 |
| Estado global | Zustand 5 |
| PWA | vite-plugin-pwa |

Estructura de carpetas: `src/api`, `src/components`, `src/store`, `src/pages`, `src/types`.

---

## 3. Paleta de Colores (Tema Naranja Gastronómico)

Diseño limpio, con mucho espacio en blanco y acentos naranja/rojizos que estimulan el apetito y guían la acción.

| Token | Clase Tailwind | Uso |
|-------|----------------|-----|
| Primario | `bg-orange-500` → `bg-orange-600` (hover) | Botones de acción, llamadas a la atención. Texto sobre primario **siempre blanco** |
| Fondo principal | `bg-white` o `bg-gray-50` | Fondo general de la app |
| Fondo secundario | `bg-orange-50` / `#FFF5F3` | Área de categorías, paneles diferenciados |
| Texto principal | `text-gray-900` | Títulos, nombres |
| Texto secundario | `text-gray-500` | Descripciones, modificadores |
| Éxito / Activo | `bg-green-500` | Confirmaciones, cobro exitoso |
| Peligro / Eliminar | `bg-red-500` | Anular, eliminar |

---

## 4. Estructura de Layout Principal (Grid de 3 Columnas)

El layout ocupa el **100% del alto** (`h-screen`) **sin scroll general**; el scroll es interno por sección.

```
+------------+--------------------------------+------------------------+
| Sidebar    |  Área Central (Productos)      |  Panel Derecho (Orden) |
| 5-8%       |  ~65%                          |  25-30%                |
+------------+--------------------------------+------------------------+
```

### 4.1 Barra Lateral Izquierda (Navegación)

- **Escritorio (`>= lg`)**: sidebar fijo `w-64` con **icono + texto** en cada opción
  (filas de `h-12`, esquinas `rounded-xl`), logo + nombre arriba, tarjeta de usuario
  (avatar, nombre, rol) y botón "Cerrar sesión" abajo. Fondo blanco, `border-r border-gray-100`.
- **Móvil (`< lg`)**: el mismo contenido se convierte en **menú deslizante (drawer)**:
  panel desde la izquierda (`w-72`), overlay oscuro, botón de cerrar; se abre con el
  botón hamburguesa del `MobileHeader` y se cierra al navegar o tocar el fondo.
- Ítems: **Nuevo pedido, Configuración, Inventario y caja, Estadísticas**.

### 4.2 Área Central (Menú de Productos — ~65%)

- **Header:** barra de búsqueda redondeada en la parte superior.
- **Filtros de categorías:** fila de botones "píldora" (`rounded-full`) con scroll horizontal. El botón activo con **texto naranja**.
- **Grid de productos:** CSS Grid responsiva (`grid-cols-2`, `md:grid-cols-3`, `lg:grid-cols-4`) con **scroll vertical independiente**.

### 4.3 Panel Derecho (Resumen de Orden / Carrito)

- Fondo blanco, sombra suave a la izquierda: `shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]`.
- Cabecera con **Número de Mesa** e **ID de Orden**.
- Lista con scroll vertical: cantidades, nombres, modificadores y precios.
- **Pie fijo** inferior con totales (Subtotal, Impuestos, Total) y botón grande prominente **"Cobrar" / "Enviar Orden"** en naranja primario.
- **Escritorio (`>= lg`)**: columna derecha (`w-80`).
- **Móvil (`< lg`)**: barra fija inferior "Ver pedido · Total $X" que abre el carrito
  como **hoja inferior (bottom sheet)** de `85vh` con botón de cerrar.

---

## 5. Diseño de Componentes Específicos

### 5.1 ProductCard (Tarjeta de Plato)

- **Contenedor:** blanco, esquinas muy redondeadas (`rounded-2xl`/`rounded-3xl`), borde sutil `border border-gray-100`.
- **Interacción:** `hover:shadow-md hover:-translate-y-1 transition-all`.
- **Imagen:** mitad superior de la tarjeta, esquinas superiores redondeadas, `object-cover`.
- **Cuerpo:** `p-4`; título `font-bold text-lg`; descripción `text-sm text-gray-500 line-clamp-2`.
- **Footer:** flexbox — precio `text-xl font-bold` (izquierda) + botón naranja **"+ Add"** (derecha).

### 5.2 Item del Carrito (Order Panel Row)

- Diseño horizontal limpio.
- Cantidad (`1x`) en color destacado + nombre del plato.
- Modificadores debajo (`Sin cebolla`) en `text-sm` gris.
- Precio alineado a la derecha, con botón de edición pequeño y discreto.

---

## 6. Módulos Funcionales

| Módulo | Estado |
|--------|--------|
| Nuevo pedido | Pantalla principal — en construcción |
| Configuración | Mi perfil + Usuarios (implementado) |
| Inventario y caja | Pendiente |
| Estadísticas | Pendiente |

---

## 7. Reglas de Accesibilidad y UI General

- **Border radius:** `rounded-full` para píldoras, `rounded-xl` para botones de acción.
- **Sombras:** suaves y modernas (`shadow-sm` por defecto); evitar sombras duras.
- **Espaciado:** consistente (`gap-4`, `p-6`); los elementos deben respirar.

---

## 8. Convenciones de Implementación

- Mobile-first: `sm`, `md`, `lg`, `xl`.
- Componentes reutilizables en `src/components`.
- Tipos compartidos en `src/types`.
- Llamadas a API centralizadas en `src/api` (React Query).
- Estado global (usuario, carrito, tema) en `src/store` (Zustand).

---

## 9. Pendiente / Próximos pasos

- [ ] Confirmar correspondencia entre iconos del sidebar y módulos funcionales.
- [ ] Definir datos y campos de ProductCard (imagen, precio, modificadores).
- [ ] Implementar pantalla "Nuevo pedido" (3 columnas + carrito + Cobrar).
