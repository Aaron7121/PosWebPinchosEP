package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.entity.Cliente;
import com.joedev.posweb.pep.services.ClienteService;
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
    public Response obtenerPorId(@PathParam("id") Integer id) {
        Cliente cliente = service.obtenerPorId(id);
        if (cliente == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(cliente).build();
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
    public Response actualizar(@PathParam("id") Integer id, Cliente cliente) {
        Cliente actualizado = service.actualizar(id, cliente);
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