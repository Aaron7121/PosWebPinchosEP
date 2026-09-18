package com.joedev.posweb.pep.auth;

import com.joedev.posweb.pep.entity.Usuario;
import com.joedev.posweb.pep.exception.ErrorResponse;
import com.joedev.posweb.pep.repository.UsuarioRepository;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHORIZATION)
public class ActiveUserFilter implements ContainerRequestFilter {

    @Inject
    SecurityIdentity securityIdentity;

    @Inject
    UsuarioRepository usuarioRepository;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        if (securityIdentity.isAnonymous()) {
            return;
        }

        String principal = securityIdentity.getPrincipal().getName();
        Usuario usuario = usuarioRepository.find("correo = ?1 OR usuario = ?1", principal)
                .firstResult();
        if (usuario == null || !Boolean.TRUE.equals(usuario.getActivo())) {
            requestContext.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse(401, "Credenciales inválidas", "La cuenta está inactiva"))
                    .build());
        }
    }
}