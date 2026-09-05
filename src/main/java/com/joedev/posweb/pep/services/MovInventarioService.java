package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.MovInventario;
import com.joedev.posweb.pep.repository.MovInventarioRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class MovInventarioService {

    @Inject
    MovInventarioRepository repository;

    public List<MovInventario> listarTodos() {
        return repository.listAll();
    }

    public MovInventario obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public MovInventario crear(MovInventario movInventario) {
        repository.persistAndFlush(movInventario);
        return movInventario;
    }

    public MovInventario actualizar(Integer id, MovInventario movInventario) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        movInventario.setId(id);
        return repository.getEntityManager().merge(movInventario);
    }

    public boolean eliminar(Integer id) {
        return repository.deleteById(id);
    }
}