package com.joedev.posweb.pep.auth;

public record UsuarioRequest(
        String nombre,
        String cedula,
        String telefono,
        String correo,
        String cargo,
        String usuario,
        String password,
        String rol,
        Boolean activo,
        DireccionRequest direccion) {
}