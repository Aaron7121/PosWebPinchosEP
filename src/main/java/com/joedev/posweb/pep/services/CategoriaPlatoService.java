package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.CategoriaPlato;
import com.joedev.posweb.pep.repository.CategoriaPlatoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class CategoriaPlatoService {

    @Inject
    CategoriaPlatoRepository repository;

    public List<CategoriaPlato> listarTodos() {
        return repository.listAll();
    }

    public CategoriaPlato obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public CategoriaPlato crear(CategoriaPlato categoriaPlato) {
        repository.persistAndFlush(categoriaPlato);
        return categoriaPlato;
    }

    public CategoriaPlato actualizar(Integer id, CategoriaPlato categoriaPlato) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        categoriaPlato.setId(id);
        return repository.getEntityManager().merge(categoriaPlato);
    }

    public boolean eliminar(Integer id) {
        return repository.deleteById(id);
    }
}