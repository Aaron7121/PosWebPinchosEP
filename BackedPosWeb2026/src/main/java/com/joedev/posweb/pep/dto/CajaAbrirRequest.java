package com.joedev.posweb.pep.dto;

import java.math.BigDecimal;

public record CajaAbrirRequest(BigDecimal montoEsperado, String observaciones) {
}