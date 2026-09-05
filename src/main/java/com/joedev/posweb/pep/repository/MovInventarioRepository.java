package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.MovInventario;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class MovInventarioRepository implements PanacheRepositoryBase<MovInventario, Integer> {
}