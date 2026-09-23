package com.joedev.posweb.pep.auth;

public record DireccionRequest(
        String callePrincipal,
        String calleSecundaria,
        String ciudad,
        String sector) {
}