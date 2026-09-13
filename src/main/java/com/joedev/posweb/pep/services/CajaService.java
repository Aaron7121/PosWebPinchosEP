package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Caja;
import com.joedev.posweb.pep.repository.CajaRepository;
import com.joedev.posweb.pep.stream.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class CajaService {

    @Inject
    CajaRepository repository;

    @Inject
    NotificationService notifier;

    public List<Caja> listarTodos() {
        return repository.listAll();
    }

    public Caja obtenerPorId(Long id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public Caja crear(Caja caja) {
        repository.persistAndFlush(caja);
        notifier.emitir("caja:modificado", Map.of("id", caja.getId()));
        return caja;
    }

    public Caja actualizar(Long id, Caja caja) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        caja.setId(id);
        Caja actualizada = repository.getEntityManager().merge(caja);
        notifier.emitir("caja:modificado", Map.of("id", id));
        return actualizada;
    }

    public boolean eliminar(Long id) {
        boolean eliminado = repository.deleteById(id);
        if (eliminado) {
            notifier.emitir("caja:modificado", Map.of("id", id));
        }
        return eliminado;
    }
}