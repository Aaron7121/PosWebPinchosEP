package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.entity.Cliente;
import com.joedev.posweb.pep.services.ClienteService;
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
@Path("/api/clientes")

@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ClienteResource {

    @Inject
    ClienteService service;

    @GET
    public List<Cliente> listarTodos() {
        return service.listarTodos();
    }

    @GET
    @Path("/{id}")
    public Cliente obtenerPorId(@PathParam("id") Integer id) {
        return service.obtenerPorId(id);
    }
    @Transactional
    @POST
    public Response crear(Cliente cliente) {
        Cliente creado = service.crear(cliente);
        return Response.status(Response.Status.CREATED).entity(creado).build();
    }
    @Transactional
    @PUT
    @Path("/{id}")
    public Cliente actualizar(@PathParam("id") Integer id, Cliente cliente) {
        return service.actualizar(id, cliente);
    }
    @Transactional
    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Integer id) {
        service.eliminar(id);
        return Response.noContent().build();
    }
}