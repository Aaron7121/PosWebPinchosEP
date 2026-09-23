import type { RendimientoMensualDTO } from '../../types/estadisticas';

interface RendimientoMensualCardProps {
  data: RendimientoMensualDTO | null;
  loading?: boolean;
}

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function RendimientoMensualCard({ data, loading }: RendimientoMensualCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 bg-white rounded-lg shadow text-center text-gray-500">No hay datos de rendimiento disponibles</div>;
  }

  const monthName = monthNames[data.mes - 1];

  return (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">
        Rendimiento: {monthName} {data.año}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card: Total Ingresos */}
        <div className="bg-white rounded-lg p-4 shadow hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Ingresos</p>
              <p className="text-2xl font-bold text-green-600">${data.totalIngresos.toFixed(2)}</p>
            </div>
            <div className="text-3xl text-green-300">💰</div>
          </div>
        </div>

        {/* Card: Total Pedidos */}
        <div className="bg-white rounded-lg p-4 shadow hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Pedidos</p>
              <p className="text-2xl font-bold text-blue-600">{data.totalPedidos}</p>
            </div>
            <div className="text-3xl text-blue-300">📋</div>
          </div>
        </div>

        {/* Card: Ticket Promedio */}
        <div className="bg-white rounded-lg p-4 shadow hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ticket Promedio</p>
              <p className="text-2xl font-bold text-orange-600">${data.ticketPromedio.toFixed(2)}</p>
            </div>
            <div className="text-3xl text-orange-300">🧮</div>
          </div>
        </div>

        {/* Card: Promedio Ingresos por Día */}
        <div className="bg-white rounded-lg p-4 shadow hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ingresos Promedio/Día</p>
              <p className="text-2xl font-bold text-purple-600">${data.promedioIngresosPorDia.toFixed(2)}</p>
            </div>
            <div className="text-3xl text-purple-300">📊</div>
          </div>
        </div>

        {/* Card: Promedio Ventas por Pedido */}
        <div className="bg-white rounded-lg p-4 shadow hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Venta Promedio/Pedido</p>
              <p className="text-2xl font-bold text-pink-600">${data.promedioVentasPorPedido.toFixed(2)}</p>
            </div>
            <div className="text-3xl text-pink-300">💳</div>
          </div>
        </div>

        {/* Card: Días con Actividad */}
        <div className="bg-white rounded-lg p-4 shadow hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Días con Actividad</p>
              <p className="text-2xl font-bold text-indigo-600">{data.diasConActividad}</p>
            </div>
            <div className="text-3xl text-indigo-300">📅</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 bg-white rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Indicadores Clave</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Eficiencia de Días</span>
            <span className="font-semibold text-gray-800">
              {((data.diasConActividad / 30) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Productividad Promedio</span>
            <span className="font-semibold text-gray-800">
              {(data.totalPedidos / data.diasConActividad).toFixed(1)} pedidos/día
            </span>
          </div>
          <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
            <span className="text-gray-700">Margen de Ganancia Diaria</span>
            <span className="text-green-600">
              ${data.promedioIngresosPorDia.toFixed(2)}/día
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
