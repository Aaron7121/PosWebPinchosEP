package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.RecetaPlatoProducto;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class RecetaPlatoProductoRepository implements PanacheRepositoryBase<RecetaPlatoProducto, Integer> {
}