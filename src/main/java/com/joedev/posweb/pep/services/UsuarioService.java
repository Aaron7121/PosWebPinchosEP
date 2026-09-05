package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Direccion;
import com.joedev.posweb.pep.entity.Usuario;
import com.joedev.posweb.pep.repository.UsuarioRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class UsuarioService {

    @Inject
    UsuarioRepository repository;

    public List<Usuario> listarTodos() {
        return repository.listAll();
    }

    public Usuario obtenerPorId(Integer id) {
        return repository.findByIdOptional(id).orElse(null);
    }

    public Usuario crear(Usuario usuario) {
        if (usuario.getDireccion() != null) {
            Direccion direccion = usuario.getDireccion();
            if (direccion.getId() != null) {
                Direccion persistida = repository.getEntityManager().find(Direccion.class, direccion.getId());
                if (persistida == null) {
                    throw new IllegalArgumentException("La dirección con id " + direccion.getId() + " no existe");
                }
                usuario.setDireccion(persistida);
            } else {
                repository.getEntityManager().persist(direccion);
            }
        }
        repository.persistAndFlush(usuario);
        return usuario;
    }

    public Usuario actualizar(Integer id, Usuario usuario) {
        if (repository.findByIdOptional(id).isEmpty()) {
            return null;
        }
        usuario.setId(id);
        if (usuario.getDireccion() != null) {
            Direccion direccion = usuario.getDireccion();
            if (direccion.getId() != null) {
                Direccion persistida = repository.getEntityManager().find(Direccion.class, direccion.getId());
                if (persistida == null) {
                    throw new IllegalArgumentException("La dirección con id " + direccion.getId() + " no existe");
                }
                usuario.setDireccion(persistida);
            }
        }
        return repository.getEntityManager().merge(usuario);
    }

    public boolean eliminar(Integer id) {
        return repository.deleteById(id);
    }
}