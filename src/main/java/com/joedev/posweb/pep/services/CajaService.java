package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.Caja;
import com.joedev.posweb.pep.exception.ConflictoException;
import com.joedev.posweb.pep.exception.DatoInvalidoException;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
import com.joedev.posweb.pep.repository.CajaRepository;
import com.joedev.posweb.pep.repository.InventarioDiarioRepository;
import com.joedev.posweb.pep.stream.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class CajaService {

    @Inject
    CajaRepository repository;

    @Inject
    InventarioDiarioRepository inventarioRepository;

    @Inject
    UsuarioActualService usuarioActual;

    @Inject
    NotificationService notifier;

    public List<Caja> listarTodos() {
        return repository.list("order by fechaApertura desc");
    }

    public Caja obtenerPorId(Long id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("La caja con id " + id + " no existe"));
    }

    public Caja obtenerAbierta() {
        return repository.findAbierta().orElse(null);
    }

    @Transactional
    public Caja abrir(BigDecimal montoEsperado, String observaciones) {
        if (montoEsperado == null || montoEsperado.signum() < 0) {
            throw new DatoInvalidoException("El monto esperado es obligatorio y no puede ser negativo");
        }
        long inventarioDelDia = inventarioRepository.count("fecha", LocalDate.now());
        if (inventarioDelDia == 0) {
            throw new ConflictoException("Debe registrar el inventario del día antes de abrir la caja");
        }
        if (repository.findAbierta().isPresent()) {
            throw new ConflictoException("Ya existe una caja abierta. Debe cerrarla antes de abrir una nueva");
        }

        Caja caja = new Caja();
        caja.setFechaApertura(Instant.now());
        caja.setIdEmpleado(usuarioActual.getUsuario());
        caja.setMontoEsperado(montoEsperado);
        caja.setObservaciones(observaciones);
        repository.persistAndFlush(caja);
        notifier.emitir("caja:modificado", Map.of("id", caja.getId()));
        return caja;
    }

    @Transactional
    public Caja cerrar(Long id, BigDecimal montoReal) {
        if (montoReal == null || montoReal.signum() < 0) {
            throw new DatoInvalidoException("El monto real es obligatorio y no puede ser negativo");
        }
        Caja caja = repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("La caja con id " + id + " no existe"));
        if (caja.getFechaCierre() != null) {
            throw new ConflictoException("La caja ya está cerrada");
        }
        caja.setFechaCierre(Instant.now());
        caja.setMontoReal(montoReal);
        repository.persistAndFlush(caja);
        notifier.emitir("caja:modificado", Map.of("id", id));
        return caja;
    }
}