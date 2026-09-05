package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.Pedido;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PedidoRepository implements PanacheRepositoryBase<Pedido, Integer> {
}