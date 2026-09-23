import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPlatosTop, getPlatosBottom, getVentas, getDashboardMensual, getRendimiento } from '../api/estadisticas';
import type { EstadisticasFilters } from '../types/estadisticas';
import { PlatoVentasChart } from '../components/charts/PlatoVentasChart';
import { VentasSemanaMesChart } from '../components/charts/VentasSemanaMesChart';
import { DashboardDiasPedidosChart } from '../components/charts/DashboardDiasPedidosChart';
import { RendimientoMensualCard } from '../components/charts/RendimientoMensualCard';

export function StatisticsPage() {
  // Estado de filtros
  const [desde, setDesde] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return thirtyDaysAgo.toISOString().split('T')[0];
  });
  
  const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0]);
  const [tipoServicio, setTipoServicio] = useState<string>('');
  
  // Estado para rendimiento mensual
  const [mesRendimiento, setMesRendimiento] = useState(new Date().getMonth() + 1);
  const [añoRendimiento, setAñoRendimiento] = useState(new Date().getFullYear());

  // Mes/Año es la fuente de verdad: al cambiar, sobrescribe el rango desde/hasta
  // para que todas las tarjetas queden filtradas por el mismo período.
  const aplicarPeriodoMensual = (mes: number, año: number) => {
    const hoy = new Date();
    const esMesActual = mes === hoy.getMonth() + 1 && año === hoy.getFullYear();
    const primerDia = new Date(año, mes - 1, 1);
    const ultimoDia = esMesActual ? hoy : new Date(año, mes, 0);

    setMesRendimiento(mes);
    setAñoRendimiento(año);
    setDesde(primerDia.toISOString().split('T')[0]);
    setHasta(ultimoDia.toISOString().split('T')[0]);
  };

  const filters: EstadisticasFilters = { desde, hasta, tipoServicio: tipoServicio || undefined };

  // Queries
  const { data: platosTop, isLoading: loadingTop } = useQuery({
    queryKey: ['estadisticas-platos-top', filters],
    queryFn: () => getPlatosTop(filters),
    enabled: !!desde && !!hasta,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { data: platosBottom, isLoading: loadingBottom } = useQuery({
    queryKey: ['estadisticas-platos-bottom', filters],
    queryFn: () => getPlatosBottom(filters),
    enabled: !!desde && !!hasta,
    staleTime: 5 * 60 * 1000,
  });

  const { data: ventas, isLoading: loadingVentas } = useQuery({
    queryKey: ['estadisticas-ventas', filters],
    queryFn: () => getVentas(filters),
    enabled: !!desde && !!hasta,
    staleTime: 5 * 60 * 1000,
  });

  const { data: dashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: ['estadisticas-dashboard', filters],
    queryFn: () => getDashboardMensual(filters),
    enabled: !!desde && !!hasta,
    staleTime: 5 * 60 * 1000,
  });

  const { data: rendimiento, isLoading: loadingRendimiento } = useQuery({
    queryKey: ['estadisticas-rendimiento', mesRendimiento, añoRendimiento],
    queryFn: () => getRendimiento(mesRendimiento, añoRendimiento),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingTop || loadingBottom || loadingVentas || loadingDashboard || loadingRendimiento;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Estadísticas del Negocio</h1>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Tipo de Servicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Servicio</label>
              <select
                value={tipoServicio}
                onChange={(e) => setTipoServicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Todos</option>
                <option value="MESA">Mesa</option>
                <option value="PARA_LLEVAR">Para llevar</option>
                <option value="DOMICILIO">Domicilio</option>
              </select>
            </div>

            {/* Mes Rendimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mes (filtra todo)</label>
              <select
                value={mesRendimiento}
                onChange={(e) => aplicarPeriodoMensual(parseInt(e.target.value), añoRendimiento)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                  <option key={m} value={m}>
                    {new Date(2024, m - 1).toLocaleDateString('es-ES', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            {/* Año Rendimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año (filtra todo)</label>
              <select
                value={añoRendimiento}
                onChange={(e) => aplicarPeriodoMensual(mesRendimiento, parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {[0, 1, 2, 3, 4].map(offset => {
                  const y = new Date().getFullYear() - offset;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando datos...</p>
            </div>
          </div>
        )}

        {/* Contenido */}
        {!isLoading && (
          <>
            {/* Rendimiento Mensual */}
            <RendimientoMensualCard data={rendimiento || null} loading={loadingRendimiento} />

            {/* Platos Top y Bottom */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {platosTop && <PlatoVentasChart data={platosTop} title="Top 10 Platos Más Vendidos" isTop={true} />}
              {platosBottom && <PlatoVentasChart data={platosBottom} title="Bottom 5 Platos Menos Vendidos" isTop={false} />}
            </div>

            {/* Ventas Semanales y Mensuales */}
            {ventas && (
              <VentasSemanaMesChart 
                semanales={ventas.semanales} 
                mensuales={ventas.mensuales}
              />
            )}

            {/* Dashboard Días */}
            {dashboard && <DashboardDiasPedidosChart data={dashboard} />}
          </>
        )}
      </div>
    </div>
  );
}
