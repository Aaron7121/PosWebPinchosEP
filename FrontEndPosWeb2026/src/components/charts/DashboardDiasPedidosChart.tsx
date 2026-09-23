import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DiaConMasPedidosDTO } from '../../types/estadisticas';

interface DashboardDiasPedidosChartProps {
  data: DiaConMasPedidosDTO[];
}

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function DashboardDiasPedidosChart({ data }: DashboardDiasPedidosChartProps) {
  if (!data || data.length === 0) {
    return <div className="p-6 bg-white rounded-lg shadow text-center text-gray-500">No hay datos disponibles</div>;
  }

  // Formatear datos para el gráfico
  const chartData = data.slice(0, 15).map(d => ({
    fecha: new Date(d.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    pedidos: d.cantidadPedidos,
    ganancia: Math.round(d.gananciaDelDia * 100) / 100,
    diaSemana: dayNames[d.diaSemana]
  }));

  const maxGanancia = Math.max(...data.map(d => d.gananciaDelDia));
  const maxPedidos = Math.max(...data.map(d => d.cantidadPedidos));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Días con Más Pedidos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="fecha" 
            label={{ value: 'Fecha', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            yAxisId="left" 
            label={{ value: 'Cantidad de Pedidos', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            label={{ value: 'Ganancia del Día ($)', angle: 90, position: 'insideRight' }}
          />
          <Tooltip 
            formatter={(value) => Number(value).toFixed(2)}
            labelFormatter={(label) => `${label}`}
            contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="pedidos" fill="#f97316" name="Cantidad de Pedidos" />
          <Bar yAxisId="right" dataKey="ganancia" fill="#10b981" name="Ganancia ($)" />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-orange-50 p-4 rounded">
          <p className="text-gray-600 text-sm">Día con Más Pedidos</p>
          <p className="text-2xl font-bold text-orange-600">{maxPedidos}</p>
          <p className="text-xs text-gray-500 mt-1">
            {data.find(d => d.cantidadPedidos === maxPedidos) && 
              dayNames[data.find(d => d.cantidadPedidos === maxPedidos)!.diaSemana]}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <p className="text-gray-600 text-sm">Mayor Ganancia del Día</p>
          <p className="text-2xl font-bold text-green-600">${maxGanancia.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {data.find(d => d.gananciaDelDia === maxGanancia)?.fecha}
          </p>
        </div>
      </div>

      <div className="mt-4 bg-gray-50 p-4 rounded">
        <p className="text-sm font-semibold text-gray-700 mb-2">Resumen de Actividad</p>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-gray-600">Total Días Registrados</p>
            <p className="text-lg font-bold text-gray-800">{data.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Promedio Pedidos/Día</p>
            <p className="text-lg font-bold text-gray-800">
              {(data.reduce((sum, d) => sum + d.cantidadPedidos, 0) / data.length).toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Ganancia Total</p>
            <p className="text-lg font-bold text-gray-800">
              ${data.reduce((sum, d) => sum + d.gananciaDelDia, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
