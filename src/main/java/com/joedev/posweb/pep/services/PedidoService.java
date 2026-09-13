package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Pedido;
import com.joedev.posweb.pep.repository.PedidoRepository;
import com.joedev.posweb.pep.stream.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class PedidoService {

    @Inject
    PedidoRepository repository;

    @Inject
    NotificationService notifier;

    public List<Pedido> listarTodos() {
        return repository.listAll();
    }

    public Pedido obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public Pedido crear(Pedido pedido) {
        repository.persistAndFlush(pedido);
        notifier.emitir("pedido:nuevo", Map.of("id", pedido.getId()));
        return pedido;
    }

    public Pedido actualizar(Integer id, Pedido pedido) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        pedido.setId(id);
        Pedido actualizado = repository.getEntityManager().merge(pedido);
        notifier.emitir("pedido:actualizado", Map.of("id", id));
        return actualizado;
    }

    public boolean eliminar(Integer id) {
        boolean eliminado = repository.deleteById(id);
        if (eliminado) {
            notifier.emitir("pedido:eliminado", Map.of("id", id));
        }
        return eliminado;
    }
}