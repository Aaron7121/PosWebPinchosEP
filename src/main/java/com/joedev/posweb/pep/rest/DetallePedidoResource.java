package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.entity.DetallePedido;
import com.joedev.posweb.pep.services.DetallePedidoService;
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
@Path("/api/detalles-pedido")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DetallePedidoResource {

    @Inject
    DetallePedidoService service;

    @GET
    public List<DetallePedido> listarTodos() {
        return service.listarTodos();
    }

    @GET
    @Path("/{id}")
    public DetallePedido obtenerPorId(@PathParam("id") Integer id) {
        return service.obtenerPorId(id);
    }

    @Transactional
    @POST
    public Response crear(DetallePedido detallePedido) {
        DetallePedido creado = service.crear(detallePedido);
        return Response.status(Response.Status.CREATED).entity(creado).build();
    }

    @Transactional
    @PUT
    @Path("/{id}")
    public DetallePedido actualizar(@PathParam("id") Integer id, DetallePedido detallePedido) {
        return service.actualizar(id, detallePedido);
    }

    @Transactional
    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Integer id) {
        service.eliminar(id);
        return Response.noContent().build();
    }
}