package com.joedev.posweb.pep.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Optimiza las imagenes ya subidas: genera una version WebP, actualiza la ruta en BD
 * y mueve el original a uploads/_respaldo (no se borra nada).
 */
@ApplicationScoped
public class MigracionImagenesService {

    private static final String PREFIJO = "/uploads/";
    private static final long UMBRAL_WEBP_BYTES = 300L * 1024;
    private static final Map<String, String> FORMATOS = Map.of("jpg", "jpeg", "jpeg", "jpeg", "png", "png", "webp", "webp");

    @ConfigProperty(name = "pos.upload.dir")
    String uploadDir;

    @Inject
    EntityManager em;

    @Inject
    ImagenOptimizador optimizador;

    @Transactional
    public Map<String, Object> migrar() {
        Path base = Path.of(uploadDir).toAbsolutePath().normalize();
        Set<String> rutas = new LinkedHashSet<>();
        rutas.addAll(em.createQuery("select p.img from Plato p where p.img like :p", String.class)
                .setParameter("p", PREFIJO + "%").getResultList());
        rutas.addAll(em.createQuery("select c.img from CategoriaPlato c where c.img like :p", String.class)
                .setParameter("p", PREFIJO + "%").getResultList());

        int optimizadas = 0;
        int omitidas = 0;
        long bytesAntes = 0;
        long bytesDespues = 0;
        List<String> errores = new ArrayList<>();
        Map<String, String> nuevas = new HashMap<>();

        for (String ruta : rutas) {
            Path origen = base.resolve(ruta.substring(PREFIJO.length())).normalize();
            if (!origen.startsWith(base) || !Files.isRegularFile(origen)) {
                errores.add(ruta + ": archivo no encontrado");
                continue;
            }
            String nombre = origen.getFileName().toString();
            String extension = nombre.substring(nombre.lastIndexOf('.') + 1).toLowerCase();
            String formato = FORMATOS.get(extension);
            try {
                long tamano = Files.size(origen);
                if (formato == null || ("webp".equals(extension) && tamano <= UMBRAL_WEBP_BYTES)) {
                    omitidas++;
                    continue;
                }
                Path destino = origen.resolveSibling(UUID.randomUUID() + ".webp");
                if (!optimizador.aWebp(origen, formato, destino)) {
                    errores.add(ruta + ": fallo la conversion");
                    continue;
                }
                Path respaldo = base.resolve("_respaldo").resolve(base.relativize(origen));
                Files.createDirectories(respaldo.getParent());
                Files.move(origen, respaldo, StandardCopyOption.REPLACE_EXISTING);
                nuevas.put(ruta, PREFIJO + base.relativize(destino).toString().replace('\\', '/'));
                bytesAntes += tamano;
                bytesDespues += Files.size(destino);
                optimizadas++;
            } catch (IOException e) {
                errores.add(ruta + ": " + e.getMessage());
            }
        }

        nuevas.forEach((vieja, nueva) -> {
            em.createQuery("update Plato p set p.img = :n where p.img = :v")
                    .setParameter("n", nueva).setParameter("v", vieja).executeUpdate();
            em.createQuery("update CategoriaPlato c set c.img = :n where c.img = :v")
                    .setParameter("n", nueva).setParameter("v", vieja).executeUpdate();
        });

        return Map.of(
                "optimizadas", optimizadas,
                "omitidas", omitidas,
                "mbAntes", Math.round(bytesAntes / 1048576.0 * 10) / 10.0,
                "mbDespues", Math.round(bytesDespues / 1048576.0 * 10) / 10.0,
                "errores", errores);
    }
}
