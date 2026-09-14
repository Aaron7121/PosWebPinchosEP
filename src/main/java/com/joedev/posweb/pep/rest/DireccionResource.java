package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.entity.Direccion;
import com.joedev.posweb.pep.services.DireccionService;
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

@RolesAllowed("ADMIN")
@Path("/api/direcciones")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DireccionResource {

    @Inject
    DireccionService service;


    @GET
    public List<Direccion> listarTodos() {
        return service.listarTodos();
    }

    @GET
    @Path("/{id}")
    public Direccion obtenerPorId(@PathParam("id") Integer id) {
        return service.obtenerPorId(id);
    }

    @Transactional
    @POST
    public Response crear(Direccion direccion) {
        Direccion creada = service.crear(direccion);
        return Response.status(Response.Status.CREATED).entity(creada).build();
    }

    @Transactional
    @PUT
    @Path("/{id}")
    public Direccion actualizar(@PathParam("id") Integer id, Direccion direccion) {
        return service.actualizar(id, direccion);
    }
    @Transactional
    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Integer id) {
        service.eliminar(id);
        return Response.noContent().build();
    }
}