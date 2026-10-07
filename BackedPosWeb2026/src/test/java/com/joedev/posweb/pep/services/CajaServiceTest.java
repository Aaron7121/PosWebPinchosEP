package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.exception.ConflictoException;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CajaServiceTest {

    @Test
    void noPermiteAbrirOtraCajaMientrasLaAnteriorSigueAbiertaTrasTresDias() {
        LocalDate fechaApertura = LocalDate.of(2026, 10, 1);
        LocalDate fechaIntento = fechaApertura.plusDays(3);

        assertEquals(LocalDate.of(2026, 10, 4), fechaIntento);
        assertThrows(ConflictoException.class, () ->
                CajaService.validarPuedeAbrir(true, 1)
        );
    }

    @Test
    void elInventarioDeDiasAnterioresNoPermiteAbrirCajaEnElCuartoDia() {
        LocalDate fechaInventarioAnterior = LocalDate.of(2026, 10, 1);
        LocalDate fechaActual = fechaInventarioAnterior.plusDays(3);

        assertEquals(LocalDate.of(2026, 10, 4), fechaActual);
        assertThrows(ConflictoException.class, () ->
                CajaService.validarPuedeAbrir(false, 0)
        );
    }

    @Test
    void permiteAbrirCajaCerradaCuandoYaExisteInventarioDelDiaActual() {
        assertDoesNotThrow(() -> CajaService.validarPuedeAbrir(false, 1));
    }

    @Test
    void obtieneLaFechaDeEcuadorAunqueEnUtcYaSeaElDiaSiguiente() {
        Instant instante = Instant.parse("2026-10-07T04:30:00Z");

        assertEquals(LocalDate.of(2026, 10, 6), CajaService.fechaNegocio(instante));
    }
}
