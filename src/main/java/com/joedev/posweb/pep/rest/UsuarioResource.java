package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.auth.EstadoRequest;
import com.joedev.posweb.pep.auth.PasswordRequest;
import com.joedev.posweb.pep.auth.UsuarioRequest;
import com.joedev.posweb.pep.auth.UsuarioResponse;
import com.joedev.posweb.pep.services.UsuarioService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@RolesAllowed("ADMIN")
@Path("/api/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UsuarioResource {

    @Inject
    UsuarioService service;

    @GET
    public List<UsuarioResponse> listarTodos() {
        return service.listarTodos();
    }

    @GET
    @Path("/{id}")
    public UsuarioResponse obtenerPorId(@PathParam("id") Integer id) {
        return service.obtenerPorId(id);
    }

    @Transactional
    @POST
    public Response crear(UsuarioRequest request) {
        UsuarioResponse creado = service.crear(request);
        return Response.status(Response.Status.CREATED).entity(creado).build();
    }

    @Transactional
    @PUT
    @Path("/{id}")
    public UsuarioResponse actualizar(@PathParam("id") Integer id, UsuarioRequest request) {
        return service.actualizar(id, request);
    }

    @Transactional
    @PATCH
    @Path("/{id}/estado")
    public UsuarioResponse cambiarEstado(@PathParam("id") Integer id, EstadoRequest request) {
        return service.cambiarEstado(id, request.activo());
    }

    @Transactional
    @PATCH
    @Path("/{id}/password")
    public Response restablecerPassword(@PathParam("id") Integer id, PasswordRequest request) {
        service.restablecerPassword(id, request.password());
        return Response.noContent().build();
    }

    @Transactional
    @DELETE
    @Path("/{id}")
    public Response eliminar(@PathParam("id") Integer id) {
        service.eliminar(id);
        return Response.noContent().build();
    }
}