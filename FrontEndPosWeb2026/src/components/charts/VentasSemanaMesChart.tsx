import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { VentasSemanaMesDTO } from '../../types/estadisticas';

interface VentasSemanaMesChartProps {
  semanales: VentasSemanaMesDTO[];
  mensuales: VentasSemanaMesDTO[];
}

export function VentasSemanaMesChart({ semanales, mensuales }: VentasSemanaMesChartProps) {
  const chartDataSemanales = semanales.map(v => ({
    label: `Sem ${v.semana}/${v.año}`,
    ventas: Math.round(v.totalVentas * 100) / 100,
    pedidos: v.cantidadPedidos,
    ticket: Math.round(v.ticketPromedio * 100) / 100
  }));

  const chartDataMensuales = mensuales.map(v => ({
    label: `${v.mes}/${v.año}`,
    ventas: Math.round(v.totalVentas * 100) / 100,
    pedidos: v.cantidadPedidos,
    ticket: Math.round(v.ticketPromedio * 100) / 100
  }));

  return (
    <div className="space-y-6">
      {/* Ventas Semanales */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Ventas Semanales</h3>
        {semanales.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartDataSemanales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="left" label={{ value: 'Ventas ($)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Cantidad de Pedidos', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="ventas" stroke="#f97316" name="Ventas ($)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="pedidos" stroke="#3b82f6" name="Pedidos" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-orange-50 p-3 rounded">
                <p className="text-gray-600">Semanas</p>
                <p className="text-xl font-bold text-orange-600">{semanales.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-gray-600">Ticket Promedio</p>
                <p className="text-xl font-bold text-blue-600">
                  ${(semanales.reduce((sum, v) => sum + v.ticketPromedio, 0) / semanales.length).toFixed(2)}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500">No hay datos de ventas semanales</p>
        )}
      </div>

      {/* Ventas Mensuales */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Ventas Mensuales</h3>
        {mensuales.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartDataMensuales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="left" label={{ value: 'Ventas ($)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Cantidad de Pedidos', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                <Legend />
                <Bar yAxisId="left" dataKey="ventas" fill="#f97316" name="Ventas ($)" />
                <Bar yAxisId="right" dataKey="pedidos" fill="#3b82f6" name="Pedidos" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-orange-50 p-3 rounded">
                <p className="text-gray-600">Meses</p>
                <p className="text-xl font-bold text-orange-600">{mensuales.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-gray-600">Ticket Promedio Mensual</p>
                <p className="text-xl font-bold text-blue-600">
                  ${(mensuales.reduce((sum, v) => sum + v.ticketPromedio, 0) / mensuales.length).toFixed(2)}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500">No hay datos de ventas mensuales</p>
        )}
      </div>
    </div>
  );
}
