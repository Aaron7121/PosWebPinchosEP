package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.entity.Plato;
import com.joedev.posweb.pep.services.PlatoService;
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

@Path("/api/platos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlatoResource {

    @Inject
    PlatoService service;

    @GET
    public List<Plato> listarTodos() {
        return service.listarTodos();
    }

    @GET
    @Path("/{id}")
    public Response obtenerPorId(@PathParam("id") Integer id) {
        Plato plato = service.obtenerPorId(id);
        if (plato == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(plato).build();
    }
    @Transactional
    @POST
    public Response crear(Plato plato) {
        Plato creado = service.crear(plato);
        return Response.status(Response.Status.CREATED).entity(creado).build();
    }


    @Transactional
    @PUT
    @Path("/{id}")
    public Response actualizar(@PathParam("id") Integer id, Plato plato) {
        Plato actualizado = service.actualizar(id, plato);
        if (actualizado == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(actualizado).build();
    }

    @Transactional
    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Integer id) {
        if (!service.eliminar(id)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.noContent().build();
    }
}