package com.joedev.posweb.pep.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DiaConMasPedidosDTO(
    LocalDate fecha,
    Integer cantidadPedidos,
    BigDecimal gananciaDelDia,
    Integer diaSemana
) {}
