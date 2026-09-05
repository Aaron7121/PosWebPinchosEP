package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Direccion;
import com.joedev.posweb.pep.repository.DireccionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class DireccionService {

    @Inject
    DireccionRepository repository;

    public List<Direccion> listarTodos() {
        return repository.listAll();
    }

    public Direccion obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public Direccion crear(Direccion direccion) {
        repository.persistAndFlush(direccion);
        return direccion;
    }

    public Direccion actualizar(Integer id, Direccion direccion) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        direccion.setId(id);
        return repository.getEntityManager().merge(direccion);
    }

    public boolean eliminar(Integer id) {
        return repository.deleteById(id);
    }
}