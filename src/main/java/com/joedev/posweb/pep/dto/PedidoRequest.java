package com.joedev.posweb.pep.dto;

import java.util.List;

public record PedidoRequest(
        Integer idCliente,
        String tipoServicio,
        Integer numMesa,
        String comentario,
        String idempotencyKey,
        List<DetalleRequest> detalles) {
}