package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.MovInventario;
import com.joedev.posweb.pep.repository.MovInventarioRepository;
import com.joedev.posweb.pep.stream.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class MovInventarioService {

    @Inject
    MovInventarioRepository repository;

    @Inject
    NotificationService notifier;

    public List<MovInventario> listarTodos() {
        return repository.listAll();
    }

    public MovInventario obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public MovInventario crear(MovInventario movInventario) {
        repository.persistAndFlush(movInventario);
        notifier.emitir("inventario:modificado", Map.of("id", movInventario.getId()));
        return movInventario;
    }

    public MovInventario actualizar(Integer id, MovInventario movInventario) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        movInventario.setId(id);
        MovInventario actualizado = repository.getEntityManager().merge(movInventario);
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