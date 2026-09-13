package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.exception.DatoInvalidoException;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class UploadService {

    private static final long MAX_SIZE = 5L * 1024 * 1024;
    private static final Set<String> CONTENT_TYPES_PERMITIDOS = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Map<String, String> EXTENSIONES = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp"
    );
    private static final Set<String> CARPETAS_PERMITIDAS = Set.of("platos", "categorias");

    @ConfigProperty(name = "pos.upload.dir")
    String uploadDir;

    public String guardarImagen(FileUpload upload, String tipo) {
        if (upload == null) {
            throw new DatoInvalidoException("Debe enviarse un archivo en el campo 'file'");
        }
        String contentType = upload.contentType();
        if (contentType == null || !CONTENT_TYPES_PERMITIDOS.contains(contentType)) {
            throw new DatoInvalidoException("Solo se permiten imágenes JPG, PNG o WEBP");
        }
        if (upload.size() > MAX_SIZE) {
            throw new DatoInvalidoException("La imagen no puede superar los 5 MB");
        }
        String carpeta = resolverCarpeta(tipo);
        String nombre = UUID.randomUUID() + "." + EXTENSIONES.get(contentType);
        Path destino = Path.of(uploadDir, carpeta);
        try {
            Files.createDirectories(destino);
            Files.move(upload.filePath(), destino.resolve(nombre), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new DatoInvalidoException("No se pudo guardar la imagen: " + e.getMessage());
        }
        return "/uploads/" + carpeta + "/" + nombre;
    }

    private String resolverCarpeta(String tipo) {
        String carpeta = tipo == null || tipo.isBlank() ? "platos" : tipo.trim().toLowerCase();
        if (!CARPETAS_PERMITIDAS.contains(carpeta)) {
            throw new DatoInvalidoException("Tipo no válido. Use 'platos' o 'categorias'");
        }
        return carpeta;
    }
}