package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.entity.InventarioDiario;
import com.joedev.posweb.pep.exception.ConflictoException;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CajaServiceTest {

    @Test
    void noPermiteAbrirOtraCajaMientrasLaAnteriorSigueAbiertaTrasTresDias() {
        LocalDate fechaApertura = LocalDate.of(2026, 10, 1);
        LocalDate fechaIntento = fechaApertura.plusDays(3);
        List<InventarioDiario> inventarios = List.of(inventario(fechaIntento));

        assertEquals(LocalDate.of(2026, 10, 4), fechaIntento);
        assertThrows(ConflictoException.class, () ->
                CajaService.validarPuedeAbrir(fechaIntento, true, inventarios)
        );
    }

    @Test
    void elInventarioDeDiasAnterioresNoPermiteAbrirCajaEnElCuartoDia() {
        LocalDate fechaInventarioAnterior = LocalDate.of(2026, 10, 1);
        LocalDate fechaActual = fechaInventarioAnterior.plusDays(3);
        List<InventarioDiario> inventarios = List.of(inventario(fechaInventarioAnterior));

        assertEquals(LocalDate.of(2026, 10, 4), fechaActual);
        assertThrows(ConflictoException.class, () ->
                CajaService.validarPuedeAbrir(fechaActual, false, inventarios)
        );
    }

    @Test
    void permiteAbrirCajaCerradaCuandoYaExisteInventarioDelDiaActual() {
        LocalDate fechaActual = LocalDate.of(2026, 10, 4);
        List<InventarioDiario> inventarios = List.of(inventario(fechaActual));

        assertDoesNotThrow(() ->
                CajaService.validarPuedeAbrir(fechaActual, false, inventarios)
        );
    }

    @Test
    void obtieneLaFechaDeEcuadorAunqueEnUtcYaSeaElDiaSiguiente() {
        Instant instante = Instant.parse("2026-10-07T04:30:00Z");

        assertEquals(LocalDate.of(2026, 10, 6), CajaService.fechaNegocio(instante));
    }

    private static InventarioDiario inventario(LocalDate fecha) {
        InventarioDiario inventario = new InventarioDiario();
        inventario.setFecha(fecha);
        return inventario;
    }
}
