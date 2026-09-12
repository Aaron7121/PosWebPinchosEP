package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.entity.RecetaPlatoProducto;
import com.joedev.posweb.pep.services.RecetaPlatoProductoService;
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
@Path("/api/recetas-plato-producto")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RecetaPlatoProductoResource {

    @Inject
    RecetaPlatoProductoService service;

    @GET
    public List<RecetaPlatoProducto> listarTodos() {
        return service.listarTodos();
    }

    @GET
    @Path("/{id}")
    public Response obtenerPorId(@PathParam("id") Integer id) {
        RecetaPlatoProducto recetaPlatoProducto = service.obtenerPorId(id);
        if (recetaPlatoProducto == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(recetaPlatoProducto).build();
    }

    @Transactional
    @POST
    public Response crear(RecetaPlatoProducto recetaPlatoProducto) {
        RecetaPlatoProducto creado = service.crear(recetaPlatoProducto);
        return Response.status(Response.Status.CREATED).entity(creado).build();
    }

    @Transactional
    @PUT
    @Path("/{id}")
    public Response actualizar(@PathParam("id") Integer id, RecetaPlatoProducto recetaPlatoProducto) {
        RecetaPlatoProducto actualizado = service.actualizar(id, recetaPlatoProducto);
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