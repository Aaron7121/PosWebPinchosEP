package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Cliente;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
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
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("El cliente con id " + id + " no existe"));
    }

    public Cliente crear(Cliente cliente) {
        repository.persistAndFlush(cliente);
        return cliente;
    }

    public Cliente actualizar(Integer id, Cliente cliente) {
        if (repository.findByIdOptional(id).isEmpty()) {
            throw new EntidadNoEncontradaException("El cliente con id " + id + " no existe");
        }
        cliente.setId(id);
        return repository.getEntityManager().merge(cliente);
    }

    public void eliminar(Integer id) {
        if (!repository.deleteById(id)) {
            throw new EntidadNoEncontradaException("El cliente con id " + id + " no existe");
        }
    }
}