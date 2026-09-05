package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.RecetaPlatoProducto;
import com.joedev.posweb.pep.repository.RecetaPlatoProductoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class RecetaPlatoProductoService {

    @Inject
    RecetaPlatoProductoRepository repository;

    public List<RecetaPlatoProducto> listarTodos() {
        return repository.listAll();
    }

    public RecetaPlatoProducto obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public RecetaPlatoProducto crear(RecetaPlatoProducto recetaPlatoProducto) {
        repository.persistAndFlush(recetaPlatoProducto);
        return recetaPlatoProducto;
    }

    public RecetaPlatoProducto actualizar(Integer id, RecetaPlatoProducto recetaPlatoProducto) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        recetaPlatoProducto.setId(id);
        return repository.getEntityManager().merge(recetaPlatoProducto);
    }

    public boolean eliminar(Integer id) {
        return repository.deleteById(id);
    }
}