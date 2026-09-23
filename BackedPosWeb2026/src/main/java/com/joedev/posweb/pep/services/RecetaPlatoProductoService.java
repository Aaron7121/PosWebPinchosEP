package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.RecetaPlatoProducto;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
import com.joedev.posweb.pep.repository.RecetaPlatoProductoRepository;
import com.joedev.posweb.pep.stream.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class RecetaPlatoProductoService {

    @Inject
    RecetaPlatoProductoRepository repository;

    @Inject
    NotificationService notifier;

    public List<RecetaPlatoProducto> listarTodos() {
        return repository.listAll();
    }

    public RecetaPlatoProducto obtenerPorId(Integer id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("La receta con id " + id + " no existe"));
    }

    public List<RecetaPlatoProducto> listarPorPlato(Integer idPlato) {
        return repository.listByPlatoId(idPlato);
    }

    public RecetaPlatoProducto crear(RecetaPlatoProducto recetaPlatoProducto) {
        repository.persistAndFlush(recetaPlatoProducto);
        notifier.emitir("catalogo:modificado", Map.of("id", recetaPlatoProducto.getId()));
        return recetaPlatoProducto;
    }

    public RecetaPlatoProducto actualizar(Integer id, RecetaPlatoProducto recetaPlatoProducto) {
        if (repository.findByIdOptional(id).isEmpty()) {
            throw new EntidadNoEncontradaException("La receta con id " + id + " no existe");
        }
        recetaPlatoProducto.setId(id);
        RecetaPlatoProducto actualizada = repository.getEntityManager().merge(recetaPlatoProducto);
        notifier.emitir("catalogo:modificado", Map.of("id", id));
        return actualizada;
    }

    public void eliminar(Integer id) {
        if (!repository.deleteById(id)) {
            throw new EntidadNoEncontradaException("La receta con id " + id + " no existe");
        }
        notifier.emitir("catalogo:modificado", Map.of("id", id));
    }
}