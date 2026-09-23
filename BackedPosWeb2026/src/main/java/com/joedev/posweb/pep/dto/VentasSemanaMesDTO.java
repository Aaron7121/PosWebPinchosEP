package com.joedev.posweb.pep.dto;

import java.math.BigDecimal;

public record VentasSemanaMesDTO(
    Integer semana,
    Integer mes,
    Integer año,
    BigDecimal totalVentas,
    Integer cantidadPedidos,
    BigDecimal ticketPromedio,
    Integer cantidadPlatos
) {}
