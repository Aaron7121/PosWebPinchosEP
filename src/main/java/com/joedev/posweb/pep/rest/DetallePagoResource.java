package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.dto.PagoRequest;
import com.joedev.posweb.pep.dto.ResumenPagoResponse;
import com.joedev.posweb.pep.entity.DetallePago;
import com.joedev.posweb.pep.services.DetallePagoService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDate;
import java.util.List;

@RolesAllowed({"ADMIN", "COLABORADOR"})
@Path("/api/pagos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DetallePagoResource {

    @Inject
    DetallePagoService service;

    @GET
    @Path("/pedido/{idPedido}")
    public List<DetallePago> listarPorPedido(@PathParam("idPedido") Integer idPedido) {
        return service.listarPorPedido(idPedido);
    }

    @GET
    @Path("/resumen")
    public List<ResumenPagoResponse> resumenDelDia(@QueryParam("fecha") LocalDate fecha) {
        LocalDate dia = fecha == null ? LocalDate.now() : fecha;
        return service.resumenDelDia(dia);
    }

    @Transactional
    @POST
    public Response registrar(PagoRequest request) {
        List<DetallePago> creados = service.registrar(request);
        return Response.status(Response.Status.CREATED).entity(creados).build();
    }

    @Transactional
    @DELETE
    @Path("/{id}")
    public Response anular(@PathParam("id") Integer id) {
        service.anular(id);
        return Response.noContent().build();
    }
}
