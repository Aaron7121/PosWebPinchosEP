import type { Plato } from '../types/catalogo'

const TAMANO = 52

export function volarAlCarrito(origen: HTMLElement, plato: Pick<Plato, 'img' | 'nombre'>) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  // Hay un destino por layout (escritorio / móvil); solo uno es visible.
  const destino = Array.from(
    document.querySelectorAll<HTMLElement>('[data-cart-target]'),
  ).find((el) => el.getBoundingClientRect().width > 0)
  if (!destino) return

  const a = origen.getBoundingClientRect()
  const b = destino.getBoundingClientRect()
  const x0 = a.left + a.width / 2
  const y0 = a.top + a.height / 2
  const dx = b.left + b.width / 2 - x0
  const dy = b.top + b.height / 2 - y0

  const ficha = document.createElement('div')
  Object.assign(ficha.style, {
    position: 'fixed',
    left: `${x0 - TAMANO / 2}px`,
    top: `${y0 - TAMANO / 2}px`,
    width: `${TAMANO}px`,
    height: `${TAMANO}px`,
    borderRadius: '16px',
    background: plato.img ? `center / cover url("${plato.img}")` : '#fed7aa',
    color: '#fb923c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    zIndex: '60',
    pointerEvents: 'none',
    boxShadow: '0 6px 16px rgba(249, 115, 22, 0.3)',
  })
  if (!plato.img) ficha.textContent = plato.nombre.charAt(0).toUpperCase()
  document.body.appendChild(ficha)

  const duracion = 600
  const vuelo = ficha.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      {
        transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 36}px) scale(0.8)`,
        opacity: 0.95,
        offset: 0.5,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(0.25)`, opacity: 0.1 },
    ],
    { duration: duracion, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  )
  vuelo.onfinish = () => ficha.remove()
  vuelo.oncancel = () => ficha.remove()

  destino.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }],
    { duration: 260, delay: duracion - 80 },
  )
}
