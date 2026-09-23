package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.DetallePedido;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
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
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("El detalle de pedido con id " + id + " no existe"));
    }

    public DetallePedido crear(DetallePedido detallePedido) {
        repository.persistAndFlush(detallePedido);
        return detallePedido;
    }

    public DetallePedido actualizar(Integer id, DetallePedido detallePedido) {
        if (repository.findByIdOptional(id).isEmpty()) {
            throw new EntidadNoEncontradaException("El detalle de pedido con id " + id + " no existe");
        }
        detallePedido.setId(id);
        return repository.getEntityManager().merge(detallePedido);
    }

    public void eliminar(Integer id) {
        if (!repository.deleteById(id)) {
            throw new EntidadNoEncontradaException("El detalle de pedido con id " + id + " no existe");
        }
    }
}