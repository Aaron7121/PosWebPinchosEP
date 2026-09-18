import { request } from './client'
import type {
  CategoriaPlato,
  CategoriaRequest,
  Plato,
  PlatoRequest,
  Producto,
  ProductoRequest,
  RecetaPlatoProducto,
  RecetaRequest,
} from '../types/catalogo'

// Categorías de plato
export function getCategorias() {
  return request<CategoriaPlato[]>('/categorias-plato')
}

export function getCategoriasActivas() {
  return request<CategoriaPlato[]>('/categorias-plato/activos')
}

export function getCategoriasRaizActivas() {
  return request<CategoriaPlato[]>('/categorias-plato/activas/raices')
}

export function getCategoriasHijasActivas(idCategoriaPadre: number) {
  return request<CategoriaPlato[]>(
    `/categorias-plato/activas/${idCategoriaPadre}/hijas`,
  )
}

export function createCategoria(payload: CategoriaRequest) {
  return request<CategoriaPlato>('/categorias-plato', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCategoria(id: number, payload: CategoriaRequest) {
  return request<CategoriaPlato>(`/categorias-plato/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteCategoria(id: number) {
  return request<void>(`/categorias-plato/${id}`, { method: 'DELETE' })
}

// Platos
export function getPlatos() {
  return request<Plato[]>('/platos')
}

export function getPlatosActivos() {
  return request<Plato[]>('/platos/activos')
}

export function getPlato(id: number) {
  return request<Plato>(`/platos/${id}`)
}

export function getPlatosByCategoria(idCategoria: number) {
  return request<Plato[]>(`/platos/categoria/${idCategoria}`)
}

export function createPlato(payload: PlatoRequest) {
  return request<Plato>('/platos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePlato(id: number, payload: PlatoRequest) {
  return request<Plato>(`/platos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deletePlato(id: number) {
  return request<void>(`/platos/${id}`, { method: 'DELETE' })
}

// Productos
export function getProductos() {
  return request<Producto[]>('/productos')
}

export function getProducto(id: number) {
  return request<Producto>(`/productos/${id}`)
}

export function createProducto(payload: ProductoRequest) {
  return request<Producto>('/productos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProducto(id: number, payload: ProductoRequest) {
  return request<Producto>(`/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteProducto(id: number) {
  return request<void>(`/productos/${id}`, { method: 'DELETE' })
}

// Recetas (plato <-> producto)
export function getRecetasByPlato(idPlato: number) {
  return request<RecetaPlatoProducto[]>(`/recetas-plato-producto/plato/${idPlato}`)
}

export function createReceta(payload: RecetaRequest) {
  return request<RecetaPlatoProducto>('/recetas-plato-producto', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateReceta(id: number, payload: RecetaRequest) {
  return request<RecetaPlatoProducto>(`/recetas-plato-producto/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteReceta(id: number) {
  return request<void>(`/recetas-plato-producto/${id}`, { method: 'DELETE' })
}
