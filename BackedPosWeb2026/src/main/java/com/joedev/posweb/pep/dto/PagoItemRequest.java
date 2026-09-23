package com.joedev.posweb.pep.dto;

import java.math.BigDecimal;

public record PagoItemRequest(String tipo, BigDecimal monto) {
}
