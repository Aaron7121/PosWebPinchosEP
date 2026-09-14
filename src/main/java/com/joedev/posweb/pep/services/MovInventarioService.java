package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.MovInventario;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
import com.joedev.posweb.pep.repository.MovInventarioRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class MovInventarioService {

    @Inject
    MovInventarioRepository repository;

    public List<MovInventario> listar(Integer idProducto, Integer idPedido) {
        if (idProducto != null) {
            return repository.listByProducto(idProducto);
        }
        if (idPedido != null) {
            return repository.listByPedido(idPedido);
        }
        return repository.list("order by fecha desc");
    }

    public MovInventario obtenerPorId(Integer id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("El movimiento de inventario con id " + id + " no existe"));
    }
}
