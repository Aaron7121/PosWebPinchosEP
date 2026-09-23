package com.joedev.posweb.pep.dto;

import java.math.BigDecimal;

public record RendimientoMensualDTO(
    Integer mes,
    Integer año,
    BigDecimal totalIngresos,
    Integer totalPedidos,
    BigDecimal promedioIngresosPorDia,
    BigDecimal promedioVentasPorPedido,
    Integer diasConActividad,
    BigDecimal ticketPromedio
) {}
