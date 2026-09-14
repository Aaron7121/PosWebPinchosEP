package com.joedev.posweb.pep.stream;

import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.operators.multi.processors.BroadcastProcessor;
import io.smallrye.mutiny.operators.multi.processors.SerializedProcessor;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Status;
import jakarta.transaction.Synchronization;
import jakarta.transaction.TransactionSynchronizationRegistry;

import java.time.Duration;

@ApplicationScoped
public class NotificationService {

    private final BroadcastProcessor<Notificacion> processor = BroadcastProcessor.create();
    private final SerializedProcessor<Notificacion, Notificacion> bus = processor.serialized();

    @Inject
    TransactionSynchronizationRegistry txSync;

    public Multi<Notificacion> suscribir() {
        Multi<Notificacion> heartbeat = Multi.createFrom().ticks()
                .every(Duration.ofSeconds(25))
                .map(tick -> new Notificacion("ping", null));
        return Multi.createBy().merging().streams(
                Multi.createFrom().publisher(bus),
                heartbeat
        );
    }

    public void emitir(String type, Object data) {
        if (txSync == null) {
            bus.onNext(new Notificacion(type, data));
            return;
        }

        int status = txSync.getTransactionStatus();
        if (status == Status.STATUS_ACTIVE) {
            Notificacion notificacion = new Notificacion(type, data);
            try {
                txSync.registerInterposedSynchronization(new Synchronization() {
                    @Override
                    public void beforeCompletion() {
                        // No requiere acción antes de commit
                    }

                    @Override
                    public void afterCompletion(int estado) {
                        if (estado == Status.STATUS_COMMITTED) {
                            bus.onNext(notificacion);
                        }
                    }
                });
            } catch (IllegalStateException e) {
                // Transacción no apta para registrar sincronización: se descarta la notificación
            }
        } else if (status == Status.STATUS_NO_TRANSACTION) {
            bus.onNext(new Notificacion(type, data));
        }
    }
}
