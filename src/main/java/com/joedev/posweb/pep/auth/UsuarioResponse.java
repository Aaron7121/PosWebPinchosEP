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
        Integer idDireccion) {

    public static UsuarioResponse from(Usuario usuario) {
        Integer idDireccion = usuario.getDireccion() != null ? usuario.getDireccion().getId() : null;
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
                idDireccion
        );
    }
}