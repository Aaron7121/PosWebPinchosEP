package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.entity.MovInventario;
import com.joedev.posweb.pep.services.MovInventarioService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@RolesAllowed({"ADMIN", "COLABORADOR"})
@Path("/api/movs-inventario")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MovInventarioResource {

    @Inject
    MovInventarioService service;

    @GET
    public List<MovInventario> listar(@QueryParam("producto") Integer idProducto,
                                      @QueryParam("pedido") Integer idPedido) {
        return service.listar(idProducto, idPedido);
    }

    @GET
    @Path("/{id}")
    public MovInventario obtenerPorId(@PathParam("id") Integer id) {
        return service.obtenerPorId(id);
    }
}