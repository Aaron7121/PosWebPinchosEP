package com.joedev.posweb.pep.stream;

import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.operators.multi.processors.BroadcastProcessor;
import io.smallrye.mutiny.operators.multi.processors.SerializedProcessor;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class NotificationService {

    private final BroadcastProcessor<Notificacion> processor = BroadcastProcessor.create();
    private final SerializedProcessor<Notificacion, Notificacion> bus = processor.serialized();

    public Multi<Notificacion> suscribir() {
        return Multi.createFrom().publisher(bus);
    }

    public void emitir(String type, Object data) {
        bus.onNext(new Notificacion(type, data));
    }
}