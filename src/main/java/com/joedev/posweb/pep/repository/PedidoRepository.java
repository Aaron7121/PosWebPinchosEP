package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.Pedido;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.OffsetDateTime;

@ApplicationScoped
public class PedidoRepository implements PanacheRepositoryBase<Pedido, Integer> {

    public long countNoCompletadosDesde(OffsetDateTime desde) {
        return count("fecha >= ?1 and estadoPedido <> 'CANCELADO' "
                + "and (estadoPedido <> 'ENTREGADO' or estadoPago <> 'PAGADO')", desde);
    }
}
