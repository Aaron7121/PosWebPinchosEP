package com.joedev.posweb.pep.auth;

import com.joedev.posweb.pep.entity.Usuario;

public record UserResponse(Integer id, String name, String email, String role) {

    public static UserResponse from(Usuario usuario) {
        return new UserResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getCorreo(),
                usuario.getRol()
        );
    }
}