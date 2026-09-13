package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.services.UploadService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.util.Map;

@RolesAllowed({"ADMIN", "COLABORADOR"})
@Path("/api/uploads")
@Produces(MediaType.APPLICATION_JSON)
public class UploadResource {

    @Inject
    UploadService service;

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response subir(@RestForm("file") FileUpload file, @RestForm("tipo") String tipo) {
        String ruta = service.guardarImagen(file, tipo);
        return Response.ok(Map.of("path", ruta)).build();
    }
}