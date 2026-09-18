package com.joedev.posweb.pep.exception;

import jakarta.persistence.PersistenceException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.util.HashSet;
import java.util.Set;

@Provider
public class ErrorHandler implements ExceptionMapper<Exception> {

    private static final Logger LOG = Logger.getLogger(ErrorHandler.class);

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
        if (containsPersistenceException(exception)) {
            LOG.error("Error de persistencia al procesar la solicitud", exception);
            return Response.status(Response.Status.CONFLICT)
                    .entity(new ErrorResponse(409, "Conflicto de datos",
                            "No se pudo guardar la información con los datos proporcionados"))
                    .build();
        }
        LOG.error("Error interno al procesar la solicitud", exception);
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse(500, "Error interno",
                        "Ocurrió un error interno. Intenta nuevamente más tarde"))
                .build();
    }

    private boolean containsPersistenceException(Throwable exception) {
        Set<Throwable> visited = new HashSet<>();
        Throwable current = exception;
        while (current != null && visited.add(current)) {
            if (current instanceof PersistenceException) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}