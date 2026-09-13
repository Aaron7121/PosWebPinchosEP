package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Producto;
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
        return repository.findByIdOptional(id).orElse(null);
    }

    public Producto crear(Producto producto) {
        repository.persistAndFlush(producto);
        notifier.emitir("inventario:modificado", Map.of("id", producto.getId()));
        return producto;
    }

    public Producto actualizar(Integer id, Producto producto) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        producto.setId(id);
        Producto actualizado = repository.getEntityManager().merge(producto);
        notifier.emitir("inventario:modificado", Map.of("id", id));
        return actualizado;
    }

    public boolean eliminar(Integer id) {
        boolean eliminado = repository.deleteById(id);
        if (eliminado) {
            notifier.emitir("inventario:modificado", Map.of("id", id));
        }
        return eliminado;
    }
}