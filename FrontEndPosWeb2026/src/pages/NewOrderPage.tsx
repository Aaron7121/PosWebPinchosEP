import { useState } from 'react'
import { Plus, Search } from 'lucide-react'

const categories = ['Todo', 'Pinchos', 'Bebidas', 'Extras', 'Postres']

const products = [
  { id: 1, name: 'Pincho de pollo', price: 2.5 },
  { id: 2, name: 'Pincho de res', price: 3.0 },
  { id: 3, name: 'Pincho mixto', price: 3.5 },
  { id: 4, name: 'Papas fritas', price: 1.5 },
  { id: 5, name: 'Cola personal', price: 1.0 },
  { id: 6, name: 'Limonada', price: 1.5 },
]

export function NewOrderPage() {
  const [category, setCategory] = useState('Todo')

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {/* Área central: productos */}
      <section className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-gray-100 bg-white px-6">
          <h1 className="text-lg font-bold text-gray-900">Nuevo pedido</h1>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              className="w-full rounded-full border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </header>

        <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-100 bg-white px-6 py-3">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === c
                  ? 'bg-orange-50 text-orange-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid flex-1 auto-rows-min grid-cols-2 gap-4 overflow-y-auto p-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-3xl border border-gray-100 bg-white transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="h-28 rounded-t-3xl bg-orange-100" />
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  Descripción breve del producto
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">
                    ${p.price.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Panel derecho: resumen de orden */}
      <aside className="flex w-80 shrink-0 flex-col border-l border-gray-100 bg-white shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-sm text-gray-500">Mesa</p>
            <p className="text-lg font-bold text-gray-900">#12</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Orden</p>
            <p className="text-lg font-bold text-gray-900">#0042</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-center text-sm text-gray-400">
            Agrega productos para comenzar el pedido
          </p>
        </div>

        <footer className="border-t border-gray-100 px-6 py-4">
          <div className="mb-4 flex flex-col gap-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Impuestos</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>$0.00</span>
            </div>
          </div>
          <button
            type="button"
            className="w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Cobrar
          </button>
        </footer>
      </aside>
    </div>
  )
}
