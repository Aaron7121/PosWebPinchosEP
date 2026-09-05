package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.Plato;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PlatoRepository implements PanacheRepositoryBase<Plato, Integer> {
}