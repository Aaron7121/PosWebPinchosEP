package com.joedev.posweb.pep.auth;

import com.joedev.posweb.pep.entity.Direccion;

public record DireccionResponse(
        Integer id,
        String callePrincipal,
        String calleSecundaria,
        String ciudad,
        String sector) {

    public static DireccionResponse from(Direccion direccion) {
        return new DireccionResponse(
                direccion.getId(),
                direccion.getCallePrincipal(),
                direccion.getCalleSecundaria(),
                direccion.getCiudad(),
                direccion.getSector()
        );
    }
}