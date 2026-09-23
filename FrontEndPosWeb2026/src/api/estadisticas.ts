import { useAuthStore } from '../store/auth';
import type {
  PlatoVentasDTO,
  VentasResponse,
  DiaConMasPedidosDTO,
  RendimientoMensualDTO,
  EstadisticasFilters
} from '../types/estadisticas';

const API_BASE = '/api/estadisticas';

/**
 * Obtiene los 10 platos más vendidos
 */
export async function getPlatosTop(filters: EstadisticasFilters): Promise<PlatoVentasDTO[]> {
  const token = useAuthStore.getState().token;
  const params = new URLSearchParams({
    desde: filters.desde,
    hasta: filters.hasta,
    ...(filters.tipoServicio && { tipoServicio: filters.tipoServicio })
  });

  const response = await fetch(`${API_BASE}/platos-top?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error(`Failed to fetch top platos: ${response.statusText}`);
  return response.json();
}

/**
 * Obtiene los 5 platos menos vendidos
 */
export async function getPlatosBottom(filters: EstadisticasFilters): Promise<PlatoVentasDTO[]> {
  const token = useAuthStore.getState().token;
  const params = new URLSearchParams({
    desde: filters.desde,
    hasta: filters.hasta,
    ...(filters.tipoServicio && { tipoServicio: filters.tipoServicio })
  });

  const response = await fetch(`${API_BASE}/platos-bottom?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error(`Failed to fetch bottom platos: ${response.statusText}`);
  return response.json();
}

/**
 * Obtiene ventas semanales y mensuales
 */
export async function getVentas(filters: EstadisticasFilters): Promise<VentasResponse> {
  const token = useAuthStore.getState().token;
  const params = new URLSearchParams({
    desde: filters.desde,
    hasta: filters.hasta,
    ...(filters.tipoServicio && { tipoServicio: filters.tipoServicio })
  });

  const response = await fetch(`${API_BASE}/ventas?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error(`Failed to fetch ventas: ${response.statusText}`);
  return response.json();
}

/**
 * Obtiene dashboard de días con más pedidos
 */
export async function getDashboardMensual(filters: EstadisticasFilters): Promise<DiaConMasPedidosDTO[]> {
  const token = useAuthStore.getState().token;
  const params = new URLSearchParams({
    desde: filters.desde,
    hasta: filters.hasta,
    ...(filters.tipoServicio && { tipoServicio: filters.tipoServicio })
  });

  const response = await fetch(`${API_BASE}/dashboard-mensual?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
  return response.json();
}

/**
 * Obtiene rendimiento mensual
 */
export async function getRendimiento(mes: number, año: number): Promise<RendimientoMensualDTO> {
  const token = useAuthStore.getState().token;
  const params = new URLSearchParams({ mes: mes.toString(), año: año.toString() });

  const response = await fetch(`${API_BASE}/rendimiento?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error(`Failed to fetch rendimiento: ${response.statusText}`);
  return response.json();
}
