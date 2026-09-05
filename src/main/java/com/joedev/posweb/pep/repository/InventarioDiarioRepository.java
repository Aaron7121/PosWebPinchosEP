package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.InventarioDiario;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class InventarioDiarioRepository implements PanacheRepositoryBase<InventarioDiario, Integer> {
}