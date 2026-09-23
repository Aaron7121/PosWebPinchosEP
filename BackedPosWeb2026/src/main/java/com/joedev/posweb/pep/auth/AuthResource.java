package com.joedev.posweb.pep.auth;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

    @Inject
    SecurityIdentity securityIdentity;

    @POST
    @Path("/login")
    @PermitAll
    public Response login(LoginRequest request) {
        return Response.ok(authService.login(request)).build();
    }

    @Transactional
    @POST
    @Path("/register")
    @RolesAllowed("ADMIN")
    public Response register(RegisterRequest request) {
        return Response.status(Response.Status.CREATED)
                .entity(authService.register(request))
                .build();
    }

    @GET
    @Path("/me")
    public UserResponse me() {
        return authService.me(securityIdentity.getPrincipal().getName());
    }
}