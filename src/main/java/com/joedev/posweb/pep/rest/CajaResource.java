package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.entity.Caja;
import com.joedev.posweb.pep.services.CajaService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@RolesAllowed({"ADMIN", "COLABORADOR"})
@Path("/api/cajas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CajaResource {

    @Inject
    CajaService service;

    @GET
    public List<Caja> listarTodos() {
        return service.listarTodos();
    }

    @GET
    @Path("/{id}")
    public Response obtenerPorId(@PathParam("id") Long id) {
        Caja caja = service.obtenerPorId(id);
        if (caja == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(caja).build();
    }

    @Transactional
    @POST
    public Response crear(Caja caja) {
        Caja creada = service.crear(caja);
        return Response.status(Response.Status.CREATED).entity(creada).build();
    }

    @Transactional
    @PUT
    @Path("/{id}")
    public Response actualizar(@PathParam("id") Long id, Caja caja) {
        Caja actualizada = service.actualizar(id, caja);
        if (actualizada == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(actualizada).build();
    }

    @Transactional
    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Long id) {
        if (!service.eliminar(id)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.noContent().build();
    }
}