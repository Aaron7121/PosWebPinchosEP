package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.exception.ConflictoException;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class InventarioDiarioServiceTest {

    @Test
    void debePermitirInventarioDelMismoDiaDeLaCajaActiva() {
        LocalDate fechaCaja = LocalDate.of(2026, 9, 18);

        assertDoesNotThrow(() ->
                InventarioDiarioService.validarFechaCajaInventario(fechaCaja, fechaCaja)
        );
    }

    @Test
    void debeBloquearInventarioDeOtroDiaCuandoHayCajaActiva() {
        LocalDate fechaCaja = LocalDate.of(2026, 9, 18);
        LocalDate fechaInventario = LocalDate.of(2026, 9, 19);

        assertThrows(ConflictoException.class, () ->
                InventarioDiarioService.validarFechaCajaInventario(fechaInventario, fechaCaja)
        );
    }
}
