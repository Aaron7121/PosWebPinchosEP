package com.joedev.posweb.pep.exception;

import jakarta.persistence.PersistenceException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ErrorHandler implements ExceptionMapper<Exception> {

    @Override
    public Response toResponse(Exception exception) {
        if (exception instanceof CredencialesInvalidasException e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse(401, "Credenciales inválidas", e.getMessage()))
                    .build();
        }
        if (exception instanceof EntidadNoEncontradaException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse(404, "Entidad no encontrada", e.getMessage()))
                    .build();
        }
        if (exception instanceof DatoInvalidoException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(400, "Dato inválido", e.getMessage()))
                    .build();
        }
        if (exception instanceof ConflictoException e) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(new ErrorResponse(409, "Conflicto", e.getMessage()))
                    .build();
        }
        if (exception instanceof PersistenceException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(500, "Error de persistencia", e.getMessage()))
                    .build();
        }
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse(500, "Error interno", exception.getMessage()))
                .build();
    }
}