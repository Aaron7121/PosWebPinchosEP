package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Pedido;
import com.joedev.posweb.pep.repository.PedidoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class PedidoService {

    @Inject
    PedidoRepository repository;

    public List<Pedido> listarTodos() {
        return repository.listAll();
    }

    public Pedido obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public Pedido crear(Pedido pedido) {
        repository.persistAndFlush(pedido);
        return pedido;
    }

    public Pedido actualizar(Integer id, Pedido pedido) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        pedido.setId(id);
        return repository.getEntityManager().merge(pedido);
    }

    public boolean eliminar(Integer id) {
        return repository.deleteById(id);
    }
}