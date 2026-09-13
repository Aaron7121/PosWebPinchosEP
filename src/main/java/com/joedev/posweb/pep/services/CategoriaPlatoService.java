package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.CategoriaPlato;
import com.joedev.posweb.pep.repository.CategoriaPlatoRepository;
import com.joedev.posweb.pep.stream.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class CategoriaPlatoService {

    @Inject
    CategoriaPlatoRepository repository;

    @Inject
    NotificationService notifier;

    public List<CategoriaPlato> listarTodos() {
        return repository.listAll();
    }

    public CategoriaPlato obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public List<CategoriaPlato> listarActivas() {
        return repository.listActivas();
    }

    public CategoriaPlato crear(CategoriaPlato categoriaPlato) {
        repository.persistAndFlush(categoriaPlato);
        notifier.emitir("catalogo:modificado", Map.of("id", categoriaPlato.getId()));
        return categoriaPlato;
    }

    public CategoriaPlato actualizar(Integer id, CategoriaPlato categoriaPlato) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        categoriaPlato.setId(id);
        CategoriaPlato actualizada = repository.getEntityManager().merge(categoriaPlato);
        notifier.emitir("catalogo:modificado", Map.of("id", id));
        return actualizada;
    }

    public boolean eliminar(Integer id) {
        boolean eliminado = repository.deleteById(id);
        if (eliminado) {
            notifier.emitir("catalogo:modificado", Map.of("id", id));
        }
        return eliminado;
    }
}