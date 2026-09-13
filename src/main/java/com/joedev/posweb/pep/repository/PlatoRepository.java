package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.Plato;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class PlatoRepository implements PanacheRepositoryBase<Plato, Integer> {

    public List<Plato> listByCategoriaId(Integer idCategoria) {
        return find("idCategoria.id", idCategoria).list();
    }
}