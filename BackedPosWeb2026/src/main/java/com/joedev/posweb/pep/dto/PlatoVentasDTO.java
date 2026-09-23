package com.joedev.posweb.pep.dto;

import java.math.BigDecimal;

public record PlatoVentasDTO(
    Integer idPlato,
    String nombrePlato,
    Integer cantidadVendida,
    BigDecimal totalVentas,
    BigDecimal precioPromedio
) {}
