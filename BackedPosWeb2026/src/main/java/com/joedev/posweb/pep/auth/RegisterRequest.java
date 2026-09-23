package com.joedev.posweb.pep.auth;

public record RegisterRequest(String nombre, String correo, String usuario, String password, String rol) {
}