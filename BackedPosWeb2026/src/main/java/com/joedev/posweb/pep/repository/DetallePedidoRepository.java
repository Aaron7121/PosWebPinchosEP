package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.DetallePedido;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class DetallePedidoRepository implements PanacheRepositoryBase<DetallePedido, Integer> {

    public List<DetallePedido> listByPedidoId(Integer idPedido) {
        return find("idPedido.id", idPedido).list();
    }
}