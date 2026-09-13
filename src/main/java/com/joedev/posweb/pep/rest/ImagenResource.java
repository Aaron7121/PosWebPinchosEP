package com.joedev.posweb.pep.rest;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.nio.file.Files;

@Path("/uploads")
public class ImagenResource {

    @ConfigProperty(name = "pos.upload.dir")
    String uploadDir;

    @GET
    @Path("/{tipo}/{nombre}")
    public Response servir(@PathParam("tipo") String tipo, @PathParam("nombre") String nombre) {
        java.nio.file.Path base = java.nio.file.Path.of(uploadDir).toAbsolutePath().normalize();
        java.nio.file.Path archivo = base.resolve(tipo).resolve(nombre).normalize();
        if (!archivo.startsWith(base) || !Files.exists(archivo) || Files.isDirectory(archivo)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(archivo.toFile(), tipoDeContenido(nombre)).build();
    }

    private String tipoDeContenido(String nombre) {
        String lower = nombre.toLowerCase();
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }
}