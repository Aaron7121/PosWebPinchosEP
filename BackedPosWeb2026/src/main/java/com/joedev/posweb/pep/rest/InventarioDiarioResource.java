package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.dto.AjusteInventarioRequest;
import com.joedev.posweb.pep.dto.InventarioItemRequest;
import com.joedev.posweb.pep.entity.InventarioDiario;
import com.joedev.posweb.pep.exception.DatoInvalidoException;
import com.joedev.posweb.pep.services.InventarioDiarioService;
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
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@RolesAllowed({"ADMIN", "COLABORADOR"})
@Path("/api/inventarios-diario")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InventarioDiarioResource {

    @Inject
    InventarioDiarioService service;

    @GET
    public List<InventarioDiario> listar(@QueryParam("fecha") String fecha) {
        if (fecha == null || fecha.isBlank()) {
            return service.listarTodos();
        }
        return service.listarPorFecha(parseFecha(fecha));
    }

    @GET
    @Path("/ultimo")
    public List<InventarioDiario> ultimoPorProducto() {
        return service.ultimoPorProducto();
    }

    @GET
    @Path("/{id}")
    public InventarioDiario obtenerPorId(@PathParam("id") Integer id) {
        return service.obtenerPorId(id);
    }

    @Transactional
    @POST
    @Path("/lote")
    public Response registrarLote(@QueryParam("fecha") String fecha, List<InventarioItemRequest> items) {
        LocalDate fechaLote = fecha == null || fecha.isBlank() ? LocalDate.now() : parseFecha(fecha);
        List<InventarioDiario> creados = service.registrarLote(fechaLote, items);
        return Response.status(Response.Status.CREATED).entity(creados).build();
    }

    @Transactional
    @POST
    @Path("/entrada")
    public Response registrarEntrada(@QueryParam("fecha") String fecha, AjusteInventarioRequest request) {
        LocalDate fechaLote = fecha == null || fecha.isBlank() ? LocalDate.now() : parseFecha(fecha);
        InventarioDiario actualizado = service.registrarEntrada(fechaLote, request);
        return Response.ok(actualizado).build();
    }

    @Transactional
    @POST
    @Path("/entrada/lote")
    public Response registrarEntradaLote(@QueryParam("fecha") String fecha, List<AjusteInventarioRequest> items) {
        LocalDate fechaLote = fecha == null || fecha.isBlank() ? LocalDate.now() : parseFecha(fecha);
        List<InventarioDiario> actualizados = service.registrarEntradaLote(fechaLote, items);
        return Response.ok(actualizados).build();
    }

    @Transactional
    @POST
    @Path("/salida")
    public Response registrarSalida(@QueryParam("fecha") String fecha, AjusteInventarioRequest request) {
        LocalDate fechaLote = fecha == null || fecha.isBlank() ? LocalDate.now() : parseFecha(fecha);
        InventarioDiario actualizado = service.registrarSalida(fechaLote, request);
        return Response.ok(actualizado).build();
    }

    @Transactional
    @POST
    @Path("/salida/lote")
    public Response registrarSalidaLote(@QueryParam("fecha") String fecha, List<AjusteInventarioRequest> items) {
        LocalDate fechaLote = fecha == null || fecha.isBlank() ? LocalDate.now() : parseFecha(fecha);
        List<InventarioDiario> actualizados = service.registrarSalidaLote(fechaLote, items);
        return Response.ok(actualizados).build();
    }

    @Transactional
    @PUT
    @Path("/{id}")
    public InventarioDiario actualizar(@PathParam("id") Integer id, InventarioDiario inventarioDiario) {
        return service.actualizar(id, inventarioDiario);
    }

    @Transactional
    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Integer id) {
        service.eliminar(id);
        return Response.noContent().build();
    }

    private LocalDate parseFecha(String fecha) {
        try {
            return LocalDate.parse(fecha);
        } catch (DateTimeParseException e) {
            throw new DatoInvalidoException("Formato de fecha inválido, use YYYY-MM-DD");
        }
    }
}