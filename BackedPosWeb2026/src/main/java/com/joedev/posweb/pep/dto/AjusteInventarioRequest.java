package com.joedev.posweb.pep.dto;

import java.math.BigDecimal;

public record AjusteInventarioRequest(Integer idProducto, BigDecimal cantidad) {
}
