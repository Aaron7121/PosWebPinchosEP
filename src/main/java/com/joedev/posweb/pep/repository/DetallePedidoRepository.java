package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.DetallePedido;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class DetallePedidoRepository implements PanacheRepositoryBase<DetallePedido, Integer> {
}