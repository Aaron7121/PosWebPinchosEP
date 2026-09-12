package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.entity.CategoriaPlato;
import com.joedev.posweb.pep.services.CategoriaPlatoService;
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
@Path("/api/categorias-plato")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CategoriaPlatoResource {

    @Inject
    CategoriaPlatoService service;

    @GET
    public List<CategoriaPlato> listarTodos() {
        return service.listarTodos();
    }

    @GET
    @Path("/{id}")
    public Response obtenerPorId(@PathParam("id") Integer id) {
        CategoriaPlato categoriaPlato = service.obtenerPorId(id);
        if (categoriaPlato == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(categoriaPlato).build();
    }

    @Transactional
    @POST
    public Response crear(CategoriaPlato categoriaPlato) {
        CategoriaPlato creada = service.crear(categoriaPlato);
        return Response.status(Response.Status.CREATED).entity(creada).build();
    }

    @Transactional
    @PUT
    @Path("/{id}")
    public Response actualizar(@PathParam("id") Integer id, CategoriaPlato categoriaPlato) {
        CategoriaPlato actualizada = service.actualizar(id, categoriaPlato);
        if (actualizada == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(actualizada).build();
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