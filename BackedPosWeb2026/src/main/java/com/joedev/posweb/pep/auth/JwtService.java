package com.joedev.posweb.pep.auth;

import com.joedev.posweb.pep.entity.Usuario;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class JwtService {

    public String generarToken(Usuario usuario) {
        return Jwt.subject(String.valueOf(usuario.getId()))
                .upn(usuario.getCorreo())
                .groups(usuario.getRol())
                .claim("nombre", usuario.getNombre())
                .sign();
    }
}