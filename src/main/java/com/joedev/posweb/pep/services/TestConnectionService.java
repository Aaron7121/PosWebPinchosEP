package com.joedev.posweb.pep.services;


import com.joedev.posweb.pep.entity.Usuario;
import com.joedev.posweb.pep.repository.UsuarioRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;

@ApplicationScoped
public class TestConnectionService {

    @Inject
    UsuarioRepository repository;

    public List<Usuario> obtenerTodos() {
        return repository.listAll();
    }
}