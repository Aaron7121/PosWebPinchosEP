package com.joedev.posweb.pep.dto;

import java.math.BigDecimal;

public record InventarioItemRequest(Integer idProducto, BigDecimal cantidadInicial) {
}