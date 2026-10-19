// Pide la miniatura al backend (se genera la primera vez y queda en disco).
// Solo aplica a imagenes propias en /uploads; otras URLs se dejan tal cual.
export function miniatura(url: string | null | undefined, ancho: 160 | 320 | 640 = 320) {
  if (!url) return ''
  if (!url.startsWith('/uploads/')) return url
  return `${url}?w=${ancho}`
}
