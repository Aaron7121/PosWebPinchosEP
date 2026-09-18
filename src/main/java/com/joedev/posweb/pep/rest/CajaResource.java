package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.dto.CajaAbrirRequest;
import com.joedev.posweb.pep.dto.CajaCerrarRequest;
import com.joedev.posweb.pep.dto.ResumenCierreCaja;
import com.joedev.posweb.pep.entity.Caja;
import com.joedev.posweb.pep.services.CajaService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@RolesAllowed({"ADMIN", "COLABORADOR"})
@Path("/api/cajas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CajaResource {

    @Inject
    CajaService service;

    @GET
    public List<Caja> listarTodos() {
        return service.listarTodos();
    }

    @GET
    @Path("/abierta")
    public Response obtenerAbierta() {
        Caja caja = service.obtenerAbierta();
        if (caja == null) {
            return Response.status(Response.Status.NO_CONTENT).build();
        }
        return Response.ok(caja).build();
    }

    @GET
    @Path("/{id}")
    public Caja obtenerPorId(@PathParam("id") Long id) {
        return service.obtenerPorId(id);
    }

    @GET
    @Path("/{id}/resumen-cierre")
    public ResumenCierreCaja resumenCierre(@PathParam("id") Long id) {
        return service.resumenCierre(id);
    }

    @Transactional
    @POST
    @Path("/abrir")
    public Response abrir(CajaAbrirRequest request) {
        Caja caja = service.abrir(request.montoEsperado(), request.observaciones());
        return Response.status(Response.Status.CREATED).entity(caja).build();
    }

    @Transactional
    @POST
    @Path("/{id}/cerrar")
    public Response cerrar(@PathParam("id") Long id, CajaCerrarRequest request) {
        Caja caja = service.cerrar(id, request.montoReal());
        return Response.ok(caja).build();
    }
}