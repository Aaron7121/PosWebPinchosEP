import type { Plato, RecetaPlatoProducto } from '../types/catalogo'
import type { InventarioDiario } from '../types/pos'

export interface CartItem {
  plato: Plato
  cantidad: number
}

export interface InventoryIssue {
  productId: number
  productName: string
  required: number
  available: number
  missing: number
}

export function getInventoryCheck(
  cart: CartItem[],
  inventario: InventarioDiario[] = [],
  recetasPorPlato: Record<number, RecetaPlatoProducto[]> = {},
): { canContinue: boolean; issues: InventoryIssue[]; message: string } {
  const requiredByProduct = new Map<number, { name: string; required: number }>()

  for (const item of cart) {
    const recetas = recetasPorPlato[item.plato.id] ?? []
    for (const receta of recetas) {
      const producto = receta.idProducto
      if (!producto || producto.id == null) continue

      const cantidadNecesaria = (receta.cantidad ?? 0) * item.cantidad
      const actual = requiredByProduct.get(producto.id) ?? {
        name: producto.nombre ?? 'Producto',
        required: 0,
      }

      actual.required += cantidadNecesaria
      actual.name = producto.nombre ?? actual.name
      requiredByProduct.set(producto.id, actual)
    }
  }

  const issues: InventoryIssue[] = []

  for (const [productId, detalle] of requiredByProduct.entries()) {
    const disponible =
      inventario.find((registro) => registro.idProducto?.id === productId)
        ?.cantidadActual ?? 0

    const faltante = Math.max(0, detalle.required - disponible)
    if (faltante > 0) {
      issues.push({
        productId,
        productName: detalle.name,
        required: detalle.required,
        available: disponible,
        missing: faltante,
      })
    }
  }

  const sorted = [...issues].sort((a, b) => b.missing - a.missing)
  const message = getInventoryMessage(sorted)

  return {
    canContinue: sorted.length === 0,
    issues: sorted,
    message,
  }
}

function getInventoryMessage(issues: InventoryIssue[]): string {
  if (issues.length === 0) return ''

  const preview = issues.slice(0, 3).map((issue) => {
    const cantidadFaltante = formatAmount(issue.missing)
    return `${issue.productName} (${cantidadFaltante})`
  })

  const detalle = preview.join(', ')
  return `No se puede preparar: ${detalle}.`
}

function formatAmount(value: number): string {
  if (Number.isInteger(value)) {
    return `${value}`
  }
  return Number(value.toFixed(2)).toString()
}
