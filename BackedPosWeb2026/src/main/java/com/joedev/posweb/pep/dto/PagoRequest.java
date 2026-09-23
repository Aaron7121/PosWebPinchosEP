package com.joedev.posweb.pep.dto;

import java.util.List;

public record PagoRequest(Integer idPedido, ClientePagoRequest cliente, List<PagoItemRequest> pagos) {
}
