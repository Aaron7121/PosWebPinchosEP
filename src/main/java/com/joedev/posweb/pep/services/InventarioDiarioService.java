package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.InventarioDiario;
import com.joedev.posweb.pep.repository.InventarioDiarioRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class InventarioDiarioService {

    @Inject
    InventarioDiarioRepository repository;

    public List<InventarioDiario> listarTodos() {
        return repository.listAll();
    }

    public InventarioDiario obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public InventarioDiario crear(InventarioDiario inventarioDiario) {
        repository.persistAndFlush(inventarioDiario);
        return inventarioDiario;
    }

    public InventarioDiario actualizar(Integer id, InventarioDiario inventarioDiario) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        inventarioDiario.setId(id);
        return repository.getEntityManager().merge(inventarioDiario);
    }

    public boolean eliminar(Integer id) {
        return repository.deleteById(id);
    }
}