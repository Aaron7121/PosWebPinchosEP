package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.entity.InventarioDiario;
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
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@RolesAllowed("ADMIN")
@Path("/api/inventarios-diario")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InventarioDiarioResource {

    @Inject
    InventarioDiarioService service;

    @GET
    public List<InventarioDiario> listarTodos() {
        return service.listarTodos();
    }

    @GET
    @Path("/{id}")
    public Response obtenerPorId(@PathParam("id") Integer id) {
        InventarioDiario inventarioDiario = service.obtenerPorId(id);
        if (inventarioDiario == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(inventarioDiario).build();
    }

    @Transactional
    @POST
    public Response crear(InventarioDiario inventarioDiario) {
        InventarioDiario creado = service.crear(inventarioDiario);
        return Response.status(Response.Status.CREATED).entity(creado).build();
    }

    @Transactional
    @PUT
    @Path("/{id}")
    public Response actualizar(@PathParam("id") Integer id, InventarioDiario inventarioDiario) {
        InventarioDiario actualizado = service.actualizar(id, inventarioDiario);
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