import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PlatoVentasDTO } from '../../types/estadisticas';

interface PlatoVentasChartProps {
  data: PlatoVentasDTO[];
  title: string;
  isTop: boolean;
}

export function PlatoVentasChart({ data, title }: PlatoVentasChartProps) {
  if (!data || data.length === 0) {
    return <div className="p-6 bg-white rounded-lg shadow text-center text-gray-500">No hay datos disponibles</div>;
  }

  // Formatear datos para el gráfico
  const chartData = data.map(p => ({
    nombre: p.nombrePlato,
    cantidad: p.cantidadVendida,
    ventas: Math.round(p.totalVentas * 100) / 100,
    precio: Math.round(p.precioPromedio * 100) / 100
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
          <YAxis yAxisId="left" label={{ value: 'Cantidad Vendida', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Monto ($)', angle: 90, position: 'insideRight' }} />
          <Tooltip 
            formatter={(value) => Number(value).toFixed(2)}
            contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="cantidad" fill="#f97316" name="Cantidad Vendida" />
          <Bar yAxisId="right" dataKey="ventas" fill="#fbbf24" name="Monto Total ($)" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-orange-50 p-3 rounded">
          <p className="text-gray-600">Total Platos</p>
          <p className="text-xl font-bold text-orange-600">{data.length}</p>
        </div>
        <div className="bg-orange-50 p-3 rounded">
          <p className="text-gray-600">Cantidad Total</p>
          <p className="text-xl font-bold text-orange-600">{data.reduce((sum, p) => sum + p.cantidadVendida, 0)}</p>
        </div>
        <div className="bg-orange-50 p-3 rounded">
          <p className="text-gray-600">Ventas Totales</p>
          <p className="text-xl font-bold text-orange-600">
            ${data.reduce((sum, p) => sum + p.totalVentas, 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
