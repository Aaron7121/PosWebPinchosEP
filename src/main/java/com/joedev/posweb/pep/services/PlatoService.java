package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Plato;
import com.joedev.posweb.pep.exception.DatoInvalidoException;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
import com.joedev.posweb.pep.repository.PlatoRepository;
import com.joedev.posweb.pep.stream.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
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

    public List<Plato> listarActivos() {
        return repository.listActivas();
    }

    public Plato obtenerPorId(Integer id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("El plato con id " + id + " no existe"));
    }

    public List<Plato> listarPorCategoria(Integer idCategoria) {
        return repository.listByCategoriaId(idCategoria);
    }

    public Plato crear(Plato plato) {
        validar(plato);
        if (plato.getActivo() == null) {
            plato.setActivo(true);
        }
        repository.persistAndFlush(plato);
        notifier.emitir("catalogo:modificado", Map.of("id", plato.getId()));
        return plato;
    }

    public Plato actualizar(Integer id, Plato plato) {
        validar(plato);
        Plato existente = obtenerPorId(id);
        if (plato.getActivo() == null) {
            plato.setActivo(existente.getActivo());
        }
        plato.setId(id);
        Plato actualizado = repository.getEntityManager().merge(plato);
        repository.getEntityManager().flush();
        notifier.emitir("catalogo:modificado", Map.of("id", id));
        return actualizado;
    }

    private void validar(Plato plato) {
        if (plato == null) {
            throw new DatoInvalidoException("Los datos del plato son obligatorios");
        }
        if (plato.getNombre() == null || plato.getNombre().isBlank()) {
            throw new DatoInvalidoException("El nombre del plato es obligatorio");
        }
        if (plato.getNombre().length() > 100) {
            throw new DatoInvalidoException("El nombre del plato no puede superar los 100 caracteres");
        }
        BigDecimal precio = plato.getPrecio();
        if (precio == null) {
            throw new DatoInvalidoException("El precio del plato es obligatorio");
        }
        if (precio.signum() < 0) {
            throw new DatoInvalidoException("El precio del plato no puede ser negativo");
        }
    }

    public Plato cambiarEstado(Integer id, Boolean activo) {
        if (activo == null) {
            throw new DatoInvalidoException("El campo 'activo' es obligatorio");
        }
        Plato plato = obtenerPorId(id);
        plato.setActivo(activo);
        repository.persistAndFlush(plato);
        notifier.emitir("catalogo:modificado", Map.of("id", id));
        return plato;
    }

    public void eliminar(Integer id) {
        Plato plato = obtenerPorId(id);
        plato.setActivo(false);
        repository.persistAndFlush(plato);
        notifier.emitir("catalogo:modificado", Map.of("id", id));
    }
}