export interface CategoriaPlato {
  id: number
  nombre: string
  activo: boolean | null
  img: string | null
  categoriaPadre: CategoriaPlato | null
}

export interface Plato {
  id: number
  nombre: string
  descripcion: string | null
  precio: number | null
  img: string | null
  idCategoria: CategoriaPlato | null
}

export interface Producto {
  id: number
  nombre: string | null
  unidadMedida: string | null
  esContable: boolean | null
  stockMinimo: number | null
}

export interface RecetaPlatoProducto {
  id: number
  idPlato: Plato | null
  idProducto: Producto | null
  cantidad: number | null
}

export interface CategoriaRequest {
  nombre?: string
  activo?: boolean
  img?: string
  categoriaPadre?: { id: number } | null
}

export interface PlatoRequest {
  nombre?: string
  descripcion?: string
  precio?: number
  img?: string
  idCategoria?: { id: number } | null
}

export interface ProductoRequest {
  nombre?: string
  unidadMedida?: string
  esContable?: boolean
  stockMinimo?: number
}

export interface RecetaRequest {
  idPlato?: { id: number }
  idProducto?: { id: number }
  cantidad?: number
}
