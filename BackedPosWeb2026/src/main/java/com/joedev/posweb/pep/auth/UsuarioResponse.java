package com.joedev.posweb.pep.auth;

import com.joedev.posweb.pep.entity.Usuario;

public record UsuarioResponse(
        Integer id,
        String nombre,
        String cedula,
        String telefono,
        String correo,
        String cargo,
        String usuario,
        String rol,
        Boolean activo,
        DireccionResponse direccion) {

    public static UsuarioResponse from(Usuario usuario) {
        DireccionResponse direccion = usuario.getDireccion() != null
                ? DireccionResponse.from(usuario.getDireccion())
                : null;
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getCedula(),
                usuario.getTelefono(),
                usuario.getCorreo(),
                usuario.getCargo(),
                usuario.getUsuario(),
                usuario.getRol(),
                usuario.getActivo(),
                direccion
        );
    }
}