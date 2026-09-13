package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.CategoriaPlato;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class CategoriaPlatoRepository implements PanacheRepositoryBase<CategoriaPlato, Integer> {

    public List<CategoriaPlato> listActivas() {
        return find("activo", true).list();
    }
}