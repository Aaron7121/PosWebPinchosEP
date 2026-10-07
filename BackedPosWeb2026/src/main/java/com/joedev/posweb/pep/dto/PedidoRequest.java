package com.joedev.posweb.pep.dto;

import java.math.BigDecimal;
import java.util.List;

public record PedidoRequest(
        Integer idCliente,
        String tipoServicio,
        Integer numMesa,
        String comentario,
        String idempotencyKey,
        BigDecimal costoEnvio,
        List<DetalleRequest> detalles) {
}