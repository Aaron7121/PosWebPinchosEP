package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Usuario;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
import com.joedev.posweb.pep.repository.UsuarioRepository;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class UsuarioActualService {

    @Inject
    SecurityIdentity securityIdentity;

    @Inject
    UsuarioRepository usuarioRepository;

    public Usuario getUsuario() {
        String nombrePrincipal = securityIdentity.getPrincipal().getName();
        Usuario usuario = usuarioRepository.find("correo = ?1 OR usuario = ?1", nombrePrincipal)
                .firstResultOptional()
                .orElseThrow(() -> new EntidadNoEncontradaException("No se encontró el usuario autenticado"));
        if (Boolean.FALSE.equals(usuario.getActivo())) {
            throw new EntidadNoEncontradaException("La cuenta está inactiva");
        }
        return usuario;
    }
}