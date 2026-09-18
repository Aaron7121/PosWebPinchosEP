package com.joedev.posweb.pep.dto;

import java.math.BigDecimal;

public record ResumenCierreCaja(
        BigDecimal montoInicial,
        BigDecimal totalEfectivo,
        BigDecimal totalTransferencia,
        BigDecimal efectivoEsperado,
        BigDecimal transferenciaEsperada,
        BigDecimal totalEsperado) {
}
