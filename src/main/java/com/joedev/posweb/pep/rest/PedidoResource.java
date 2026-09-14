package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.dto.EstadoPagoRequest;
import com.joedev.posweb.pep.dto.EstadoPedidoRequest;
import com.joedev.posweb.pep.dto.PedidoRequest;
import com.joedev.posweb.pep.entity.DetallePedido;
import com.joedev.posweb.pep.entity.Pedido;
import com.joedev.posweb.pep.services.PedidoService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@RolesAllowed({"ADMIN", "COLABORADOR"})
@Path("/api/pedidos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PedidoResource {

    @Inject
    PedidoService service;

    @GET
    public List<Pedido> listarTodos() {
        return service.listarTodos();
    }

    @GET
    @Path("/{id}")
    public Pedido obtenerPorId(@PathParam("id") Integer id) {
        return service.obtenerPorId(id);
    }

    @GET
    @Path("/{id}/detalles")
    public List<DetallePedido> listarDetalles(@PathParam("id") Integer id) {
        return service.listarDetalles(id);
    }

    @Transactional
    @POST
    public Response crear(PedidoRequest request) {
        Pedido creado = service.crear(request);
        return Response.status(Response.Status.CREATED).entity(creado).build();
    }

    @Transactional
    @PATCH
    @Path("/{id}/estado")
    public Response cambiarEstado(@PathParam("id") Integer id, EstadoPedidoRequest request) {
        return Response.ok(service.cambiarEstado(id, request.estadoPedido())).build();
    }

    @Transactional
    @PATCH
    @Path("/{id}/pago")
    public Response cambiarEstadoPago(@PathParam("id") Integer id, EstadoPagoRequest request) {
        return Response.ok(service.cambiarEstadoPago(id, request.estadoPago())).build();
    }

    @Transactional
    @PATCH
    @Path("/{id}/cancelar")
    public Response cancelar(@PathParam("id") Integer id) {
        return Response.ok(service.cancelar(id)).build();
    }
}