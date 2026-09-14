package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Direccion;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
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
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("La dirección con id " + id + " no existe"));
    }

    public Direccion crear(Direccion direccion) {
        repository.persistAndFlush(direccion);
        return direccion;
    }

    public Direccion actualizar(Integer id, Direccion direccion) {
        if (repository.findByIdOptional(id).isEmpty()) {
            throw new EntidadNoEncontradaException("La dirección con id " + id + " no existe");
        }
        direccion.setId(id);
        return repository.getEntityManager().merge(direccion);
    }

    public void eliminar(Integer id) {
        if (!repository.deleteById(id)) {
            throw new EntidadNoEncontradaException("La dirección con id " + id + " no existe");
        }
    }
}