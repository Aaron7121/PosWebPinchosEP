package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.Direccion;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class DireccionRepository implements PanacheRepositoryBase<Direccion, Integer> {
}