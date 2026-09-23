package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.Producto;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class ProductoRepository implements PanacheRepositoryBase<Producto, Integer> {

    public List<Producto> listActivos() {
        return find("activo", true).list();
    }
}