export interface PlatoVentasDTO {
  idPlato: number;
  nombrePlato: string;
  cantidadVendida: number;
  totalVentas: number;
  precioPromedio: number;
}

export interface VentasSemanaMesDTO {
  semana?: number;
  mes?: number;
  año: number;
  totalVentas: number;
  cantidadPedidos: number;
  ticketPromedio: number;
  cantidadPlatos: number;
}

export interface DiaConMasPedidosDTO {
  fecha: string;
  cantidadPedidos: number;
  gananciaDelDia: number;
  diaSemana: number;
}

export interface RendimientoMensualDTO {
  mes: number;
  año: number;
  totalIngresos: number;
  totalPedidos: number;
  promedioIngresosPorDia: number;
  promedioVentasPorPedido: number;
  diasConActividad: number;
  ticketPromedio: number;
}

export interface VentasResponse {
  semanales: VentasSemanaMesDTO[];
  mensuales: VentasSemanaMesDTO[];
}

export interface EstadisticasFilters {
  desde: string;
  hasta: string;
  tipoServicio?: string;
}
