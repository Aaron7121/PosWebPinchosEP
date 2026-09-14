export function formatCurrency(valor: number | null | undefined): string {
  if (valor == null) return '—'
  return `$${valor.toFixed(2)}`
}

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFechaCorta(iso: string | null | undefined): string {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleDateString('es-EC')
}

export function todayISO(): string {
  const hoy = new Date()
  const local = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}