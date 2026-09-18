package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Producto;
import com.joedev.posweb.pep.exception.DatoInvalidoException;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
import com.joedev.posweb.pep.repository.ProductoRepository;
import com.joedev.posweb.pep.stream.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class ProductoService {

    @Inject
    ProductoRepository repository;

    @Inject
    NotificationService notifier;

    public List<Producto> listarTodos() {
        return repository.listAll();
    }

    public List<Producto> listarActivos() {
        return repository.listActivos();
    }

    public Producto obtenerPorId(Integer id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("El producto con id " + id + " no existe"));
    }

    public Producto crear(Producto producto) {
        if (producto.getActivo() == null) {
            producto.setActivo(true);
        }
        repository.persistAndFlush(producto);
        notifier.emitir("inventario:modificado", Map.of("id", producto.getId()));
        return producto;
    }

    public Producto actualizar(Integer id, Producto producto) {
        Producto existente = obtenerPorId(id);
        if (producto.getActivo() == null) {
            producto.setActivo(existente.getActivo());
        }
        producto.setId(id);
        Producto actualizado = repository.getEntityManager().merge(producto);
        notifier.emitir("inventario:modificado", Map.of("id", id));
        return actualizado;
    }

    public Producto cambiarEstado(Integer id, Boolean activo) {
        if (activo == null) {
            throw new DatoInvalidoException("El campo 'activo' es obligatorio");
        }
        Producto producto = obtenerPorId(id);
        producto.setActivo(activo);
        repository.persistAndFlush(producto);
        notifier.emitir("inventario:modificado", Map.of("id", id));
        return producto;
    }

    public void eliminar(Integer id) {
        Producto producto = obtenerPorId(id);
        producto.setActivo(false);
        repository.persistAndFlush(producto);
        notifier.emitir("inventario:modificado", Map.of("id", id));
    }
}