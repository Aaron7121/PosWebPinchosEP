package com.joedev.posweb.pep.services;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Redimensiona y convierte imagenes a WebP usando ImageMagick.
 * Si la herramienta no esta instalada (p. ej. desarrollo en Windows) devuelve false
 * y el llamador conserva el archivo original.
 */
@ApplicationScoped
public class ImagenOptimizador {

    private static final Logger LOG = Logger.getLogger(ImagenOptimizador.class);

    @ConfigProperty(name = "pos.imagen.comando", defaultValue = "magick")
    String comando;

    @ConfigProperty(name = "pos.imagen.max-px", defaultValue = "800")
    int maxPx;

    @ConfigProperty(name = "pos.imagen.calidad", defaultValue = "80")
    int calidad;

    /** formato: jpeg, png o webp; fuerza el decoder para no depender del contenido del archivo. */
    public boolean aWebp(Path origen, String formato, Path destino) {
        return aWebp(origen, formato, destino, maxPx);
    }

    public boolean aWebp(Path origen, String formato, Path destino, int lado) {
        try {
            Process proceso = new ProcessBuilder(List.of(
                    comando,
                    formato + ":" + origen.toAbsolutePath() + "[0]",
                    "-auto-orient",
                    "-resize", lado + "x" + lado + ">",
                    "-strip",
                    "-quality", String.valueOf(calidad),
                    "webp:" + destino.toAbsolutePath()))
                    .redirectErrorStream(true)
                    .start();
            if (!proceso.waitFor(60, TimeUnit.SECONDS)) {
                proceso.destroyForcibly();
                LOG.warn("Timeout optimizando imagen " + origen);
                return false;
            }
            boolean ok = proceso.exitValue() == 0 && Files.exists(destino) && Files.size(destino) > 0;
            if (!ok) {
                LOG.warn("No se pudo optimizar " + origen + " (exit " + proceso.exitValue() + ")");
                Files.deleteIfExists(destino);
            }
            return ok;
        } catch (Exception e) {
            LOG.warn("Optimizador de imagenes no disponible: " + e.getMessage());
            return false;
        }
    }
}
