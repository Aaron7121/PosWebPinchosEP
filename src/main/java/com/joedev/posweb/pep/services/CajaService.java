package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Caja;
import com.joedev.posweb.pep.repository.CajaRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class CajaService {

    @Inject
    CajaRepository repository;

    public List<Caja> listarTodos() {
        return repository.listAll();
    }

    public Caja obtenerPorId(Long id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public Caja crear(Caja caja) {
        repository.persistAndFlush(caja);
        return caja;
    }

    public Caja actualizar(Long id, Caja caja) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        caja.setId(id);
        return repository.getEntityManager().merge(caja);
    }

    public boolean eliminar(Long id) {
        return repository.deleteById(id);
    }
}