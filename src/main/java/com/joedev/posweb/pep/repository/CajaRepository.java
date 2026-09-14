package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.Caja;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class CajaRepository implements PanacheRepository<Caja> {

    public Optional<Caja> findAbierta() {
        return find("fechaCierre is null").firstResultOptional();
    }
}