package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.MovInventario;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class MovInventarioRepository implements PanacheRepositoryBase<MovInventario, Integer> {

    public List<MovInventario> listByProducto(Integer idProducto) {
        return find("idProducto.id", idProducto).list();
    }

    public List<MovInventario> listByPedido(Integer idPedido) {
        return find("idPedido.id", idPedido).list();
    }
}