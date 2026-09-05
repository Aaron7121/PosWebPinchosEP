package com.joedev.posweb.pep.rest;




import com.joedev.posweb.pep.entity.Usuario;
import com.joedev.posweb.pep.services.TestConnectionService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/test")
@Produces(MediaType.APPLICATION_JSON)
public class TestConnectionResource {

    @Inject
    TestConnectionService service;

    @GET
    public List<Usuario> obtenerConexiones() {
        return service.obtenerTodos();
    }
}