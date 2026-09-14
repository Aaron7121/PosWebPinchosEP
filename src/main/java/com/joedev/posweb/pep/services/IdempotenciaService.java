package com.joedev.posweb.pep.services;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class IdempotenciaService {

    private static final long TTL_PENDIENTE_MS = 120_000L;
    private static final long TTL_COMPLETADO_MS = 10 * 60_000L;

    private final ConcurrentHashMap<String, Entrada> mapa = new ConcurrentHashMap<>();

    public boolean reservar(String key) {
        limpiar();
        return mapa.putIfAbsent(key, new Entrada(null, System.currentTimeMillis())) == null;
    }

    public Integer pedidoIdDe(String key) {
        Entrada entrada = mapa.get(key);
        return entrada == null ? null : entrada.pedidoId;
    }

    public void completar(String key, Integer pedidoId) {
        Entrada entrada = mapa.get(key);
        if (entrada != null) {
            entrada.pedidoId = pedidoId;
            entrada.timestamp = System.currentTimeMillis();
        }
    }

    public void liberar(String key) {
        mapa.remove(key);
    }

    private void limpiar() {
        long ahora = System.currentTimeMillis();
        mapa.entrySet().removeIf(e -> {
            Entrada entrada = e.getValue();
            long ttl = entrada.pedidoId == null ? TTL_PENDIENTE_MS : TTL_COMPLETADO_MS;
            return (ahora - entrada.timestamp) > ttl;
        });
    }

    private static final class Entrada {
        volatile Integer pedidoId;
        volatile long timestamp;

        Entrada(Integer pedidoId, long timestamp) {
            this.pedidoId = pedidoId;
            this.timestamp = timestamp;
        }
    }
}
