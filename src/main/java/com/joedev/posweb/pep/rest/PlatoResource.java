package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.entity.Plato;
import com.joedev.posweb.pep.services.PlatoService;
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
    @Path("/categoria/{idCategoria}")
    public List<Plato> listarPorCategoria(@PathParam("idCategoria") Integer idCategoria) {
        return service.listarPorCategoria(idCategoria);
    }

    @GET
    @Path("/{id}")
    public Plato obtenerPorId(@PathParam("id") Integer id) {
        return service.obtenerPorId(id);
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
    public Plato actualizar(@PathParam("id") Integer id, Plato plato) {
        return service.actualizar(id, plato);
    }

    @Transactional
    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Integer id) {
        service.eliminar(id);
        return Response.noContent().build();
    }
}