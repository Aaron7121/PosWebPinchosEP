package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Cliente;
import com.joedev.posweb.pep.repository.ClienteRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class ClienteService {

    @Inject
    ClienteRepository repository;

    public List<Cliente> listarTodos() {
        return repository.listAll();
    }

    public Cliente obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public Cliente crear(Cliente cliente) {
        repository.persistAndFlush(cliente);
        return cliente;
    }

    public Cliente actualizar(Integer id, Cliente cliente) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        cliente.setId(id);
        return repository.getEntityManager().merge(cliente);
    }

    public boolean eliminar(Integer id) {
        return repository.deleteById(id);
    }
}