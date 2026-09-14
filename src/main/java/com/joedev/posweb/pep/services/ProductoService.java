package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Producto;
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

    public Producto obtenerPorId(Integer id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("El producto con id " + id + " no existe"));
    }

    public Producto crear(Producto producto) {
        repository.persistAndFlush(producto);
        notifier.emitir("inventario:modificado", Map.of("id", producto.getId()));
        return producto;
    }

    public Producto actualizar(Integer id, Producto producto) {
        if (repository.findByIdOptional(id).isEmpty()) {
            throw new EntidadNoEncontradaException("El producto con id " + id + " no existe");
        }
        producto.setId(id);
        Producto actualizado = repository.getEntityManager().merge(producto);
        notifier.emitir("inventario:modificado", Map.of("id", id));
        return actualizado;
    }

    public void eliminar(Integer id) {
        if (!repository.deleteById(id)) {
            throw new EntidadNoEncontradaException("El producto con id " + id + " no existe");
        }
        notifier.emitir("inventario:modificado", Map.of("id", id));
    }
}