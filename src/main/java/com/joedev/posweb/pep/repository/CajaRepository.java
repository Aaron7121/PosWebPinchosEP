package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.Caja;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class CajaRepository implements PanacheRepository<Caja> {
}