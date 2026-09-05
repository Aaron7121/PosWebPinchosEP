package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Plato;
import com.joedev.posweb.pep.repository.PlatoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class PlatoService {

    @Inject
    PlatoRepository repository;

    public List<Plato> listarTodos() {
        return repository.listAll();
    }

    public Plato obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public Plato crear(Plato plato) {
        repository.persistAndFlush(plato);
        return plato;
    }

    public Plato actualizar(Integer id, Plato plato) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        plato.setId(id);
        return repository.getEntityManager().merge(plato);
    }

    public boolean eliminar(Integer id) {
        return repository.deleteById(id);
    }
}