package com.joedev.posweb.pep.dto;

import java.math.BigDecimal;

public record ResumenPagoResponse(String tipo, BigDecimal total) {
}
