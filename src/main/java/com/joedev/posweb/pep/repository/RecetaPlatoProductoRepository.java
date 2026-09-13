package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.RecetaPlatoProducto;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class RecetaPlatoProductoRepository implements PanacheRepositoryBase<RecetaPlatoProducto, Integer> {

    public List<RecetaPlatoProducto> listByPlatoId(Integer idPlato) {
        return find("idPlato.id", idPlato).list();
    }
}