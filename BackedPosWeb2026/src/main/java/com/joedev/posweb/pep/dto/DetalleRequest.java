package com.joedev.posweb.pep.dto;

public record DetalleRequest(
        Integer idPlato,
        Integer cantidad,
        Boolean paraLlevar
) {
    public DetalleRequest {
        if (paraLlevar == null) {
            paraLlevar = Boolean.FALSE;
        }
    }

    public DetalleRequest(Integer idPlato, Integer cantidad) {
        this(idPlato, cantidad, Boolean.FALSE);
    }
}