package com.joedev.posweb.pep.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

@ApplicationScoped
public class TestConnectionService {

    @Inject
    EntityManager entityManager;

    public TestConnectionResponse verificar() {
        Integer uno = (Integer) entityManager
                .createNativeQuery("SELECT 1")
                .getSingleResult();
        return new TestConnectionResponse("Conexión a PostgreSQL y Flyway exitosa", uno == 1);
    }
}