package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Producto;
import com.joedev.posweb.pep.repository.ProductoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class ProductoService {

    @Inject
    ProductoRepository repository;

    public List<Producto> listarTodos() {
        return repository.listAll();
    }

    public Producto obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public Producto crear(Producto producto) {
        repository.persistAndFlush(producto);
        return producto;
    }

    public Producto actualizar(Integer id, Producto producto) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        producto.setId(id);
        return repository.getEntityManager().merge(producto);
    }

    public boolean eliminar(Integer id) {
        return repository.deleteById(id);
    }
}