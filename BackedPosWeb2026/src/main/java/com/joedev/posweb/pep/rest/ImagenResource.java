package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.services.ImagenOptimizador;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.nio.file.Files;
import java.util.Set;

@Path("/uploads")
public class ImagenResource {

    // Solo anchos fijos para que nadie pueda llenar el disco pidiendo tamanos arbitrarios
    private static final Set<Integer> ANCHOS_PERMITIDOS = Set.of(160, 320, 640);

    @ConfigProperty(name = "pos.upload.dir")
    String uploadDir;

    @Inject
    ImagenOptimizador optimizador;

    @GET
    @Path("/{tipo}/{nombre}")
    public Response servir(@PathParam("tipo") String tipo, @PathParam("nombre") String nombre,
                           @QueryParam("w") Integer ancho) {
        java.nio.file.Path base = java.nio.file.Path.of(uploadDir).toAbsolutePath().normalize();
        java.nio.file.Path archivo = base.resolve(tipo).resolve(nombre).normalize();
        if (!archivo.startsWith(base) || !Files.exists(archivo) || Files.isDirectory(archivo)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        if (ancho != null && ANCHOS_PERMITIDOS.contains(ancho) && !tipo.startsWith("_")) {
            java.nio.file.Path miniatura = miniatura(base, archivo, tipo, nombre, ancho);
            if (miniatura != null) {
                return Response.ok(miniatura.toFile(), "image/webp").build();
            }
        }
        return Response.ok(archivo.toFile(), tipoDeContenido(nombre)).build();
    }

    // Se genera una vez y queda en disco; si falla se sirve el original
    private java.nio.file.Path miniatura(java.nio.file.Path base, java.nio.file.Path original,
                                         String tipo, String nombre, int ancho) {
        try {
            String sinExtension = nombre.contains(".") ? nombre.substring(0, nombre.lastIndexOf('.')) : nombre;
            java.nio.file.Path destino = base.resolve("_thumbs").resolve(String.valueOf(ancho))
                    .resolve(tipo).resolve(sinExtension + ".webp").normalize();
            if (!destino.startsWith(base)) {
                return null;
            }
            if (Files.exists(destino) && Files.getLastModifiedTime(destino).compareTo(Files.getLastModifiedTime(original)) >= 0) {
                return destino;
            }
            Files.createDirectories(destino.getParent());
            String lower = nombre.toLowerCase();
            String formato = lower.endsWith(".png") ? "png" : lower.endsWith(".webp") ? "webp" : "jpeg";
            return optimizador.aWebp(original, formato, destino, ancho) ? destino : null;
        } catch (Exception e) {
            return null;
        }
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
