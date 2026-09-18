package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.Cliente;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class ClienteRepository implements PanacheRepositoryBase<Cliente, Integer> {

    public Optional<Cliente> findByCedula(String cedula) {
        return find("cedula", cedula).firstResultOptional();
    }
}