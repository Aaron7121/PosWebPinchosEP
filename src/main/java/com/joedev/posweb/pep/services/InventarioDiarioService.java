package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.InventarioDiario;
import com.joedev.posweb.pep.repository.InventarioDiarioRepository;
import com.joedev.posweb.pep.stream.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class InventarioDiarioService {

    @Inject
    InventarioDiarioRepository repository;

    @Inject
    NotificationService notifier;

    public List<InventarioDiario> listarTodos() {
        return repository.listAll();
    }

    public InventarioDiario obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public InventarioDiario crear(InventarioDiario inventarioDiario) {
        repository.persistAndFlush(inventarioDiario);
        notifier.emitir("inventario:modificado", Map.of("id", inventarioDiario.getId()));
        return inventarioDiario;
    }

    public InventarioDiario actualizar(Integer id, InventarioDiario inventarioDiario) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        inventarioDiario.setId(id);
        InventarioDiario actualizado = repository.getEntityManager().merge(inventarioDiario);
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