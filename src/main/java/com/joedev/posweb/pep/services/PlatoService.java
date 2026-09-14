package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Plato;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
import com.joedev.posweb.pep.repository.PlatoRepository;
import com.joedev.posweb.pep.stream.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class PlatoService {

    @Inject
    PlatoRepository repository;

    @Inject
    NotificationService notifier;

    public List<Plato> listarTodos() {
        return repository.listAll();
    }

    public Plato obtenerPorId(Integer id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("El plato con id " + id + " no existe"));
    }

    public List<Plato> listarPorCategoria(Integer idCategoria) {
        return repository.listByCategoriaId(idCategoria);
    }

    public Plato crear(Plato plato) {
        repository.persistAndFlush(plato);
        notifier.emitir("catalogo:modificado", Map.of("id", plato.getId()));
        return plato;
    }

    public Plato actualizar(Integer id, Plato plato) {
        if (repository.findByIdOptional(id).isEmpty()) {
            throw new EntidadNoEncontradaException("El plato con id " + id + " no existe");
        }
        plato.setId(id);
        Plato actualizado = repository.getEntityManager().merge(plato);
        notifier.emitir("catalogo:modificado", Map.of("id", id));
        return actualizado;
    }

    public void eliminar(Integer id) {
        if (!repository.deleteById(id)) {
            throw new EntidadNoEncontradaException("El plato con id " + id + " no existe");
        }
        notifier.emitir("catalogo:modificado", Map.of("id", id));
    }
}