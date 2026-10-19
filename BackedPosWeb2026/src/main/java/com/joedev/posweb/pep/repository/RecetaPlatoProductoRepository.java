package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.RecetaPlatoProducto;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class RecetaPlatoProductoRepository implements PanacheRepositoryBase<RecetaPlatoProducto, Integer> {

    // Una sola consulta con plato y producto cargados, evita N+1
    public List<RecetaPlatoProducto> listAllConDetalle() {
        return find("select r from RecetaPlatoProducto r left join fetch r.idPlato left join fetch r.idProducto").list();
    }

    public List<RecetaPlatoProducto> listByPlatoId(Integer idPlato) {
        return find("idPlato.id", idPlato).list();
    }
}