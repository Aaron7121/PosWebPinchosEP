package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.entity.Producto;
import com.joedev.posweb.pep.services.ProductoService;
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
@Path("/api/productos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProductoResource {

    @Inject
    ProductoService service;

    @GET
    public List<Producto> listarTodos() {
        return service.listarTodos();
    }

    @GET
    @Path("/{id}")
    public Producto obtenerPorId(@PathParam("id") Integer id) {
        return service.obtenerPorId(id);
    }

    @Transactional
    @POST
    public Response crear(Producto producto) {
        Producto creado = service.crear(producto);
        return Response.status(Response.Status.CREATED).entity(creado).build();
    }

    @Transactional
    @PUT
    @Path("/{id}")
    public Producto actualizar(@PathParam("id") Integer id, Producto producto) {
        return service.actualizar(id, producto);
    }

    @Transactional
    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Integer id) {
        service.eliminar(id);
        return Response.noContent().build();
    }
}