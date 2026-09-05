package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.DetallePedido;
import com.joedev.posweb.pep.repository.DetallePedidoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class DetallePedidoService {

    @Inject
    DetallePedidoRepository repository;

    public List<DetallePedido> listarTodos() {
        return repository.listAll();
    }

    public DetallePedido obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public DetallePedido crear(DetallePedido detallePedido) {
        repository.persistAndFlush(detallePedido);
        return detallePedido;
    }

    public DetallePedido actualizar(Integer id, DetallePedido detallePedido) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        detallePedido.setId(id);
        return repository.getEntityManager().merge(detallePedido);
    }

    public boolean eliminar(Integer id) {
        return repository.deleteById(id);
    }
}