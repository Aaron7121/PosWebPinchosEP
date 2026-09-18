package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.entity.CategoriaPlato;
import com.joedev.posweb.pep.services.CategoriaPlatoService;
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

@Path("/api/categorias-plato")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CategoriaPlatoResource {

    @Inject
    CategoriaPlatoService service;

    @GET
    @RolesAllowed({"ADMIN", "COLABORADOR"})
    public List<CategoriaPlato> listarTodos() {
        return service.listarTodos();
    }

    @GET
    @Path("/activos")
    @RolesAllowed({"ADMIN", "COLABORADOR"})
    public List<CategoriaPlato> listarActivas() {
        return service.listarActivas();
    }

    @GET
    @Path("/activas/raices")
    @RolesAllowed({"ADMIN", "COLABORADOR"})
    public List<CategoriaPlato> listarRaicesActivas() {
        return service.listarRaicesActivas();
    }

    @GET
    @Path("/activas/{idCategoriaPadre}/hijas")
    @RolesAllowed({"ADMIN", "COLABORADOR"})
    public List<CategoriaPlato> listarHijasActivas(@PathParam("idCategoriaPadre") Integer idCategoriaPadre) {
        return service.listarHijasActivas(idCategoriaPadre);
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "COLABORADOR"})
    public CategoriaPlato obtenerPorId(@PathParam("id") Integer id) {
        return service.obtenerPorId(id);
    }

    @Transactional
    @POST
    @RolesAllowed("ADMIN")
    public Response crear(CategoriaPlato categoriaPlato) {
        CategoriaPlato creada = service.crear(categoriaPlato);
        return Response.status(Response.Status.CREATED).entity(creada).build();
    }

    @Transactional
    @PUT
    @Path("/{id}")
    @RolesAllowed("ADMIN")
    public CategoriaPlato actualizar(@PathParam("id") Integer id, CategoriaPlato categoriaPlato) {
        return service.actualizar(id, categoriaPlato);
    }

    @Transactional
    @DELETE
    @Path("/{id}")
    @RolesAllowed("ADMIN")
    public Response eliminar(@PathParam("id") Integer id) {
        service.eliminar(id);
        return Response.noContent().build();
    }
}