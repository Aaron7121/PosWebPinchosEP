package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.services.TestConnectionResponse;
import com.joedev.posweb.pep.services.TestConnectionService;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@PermitAll
@Path("/api/test")
@Produces(MediaType.APPLICATION_JSON)
public class TestConnectionResource {

    @Inject
    TestConnectionService service;

    @GET
    public TestConnectionResponse verificar() {
        return service.verificar();
    }
}