package com.joedev.posweb.pep.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "caja")
public class Caja {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "caja_id_gen")
    @SequenceGenerator(name = "caja_id_gen", sequenceName = "caja_id_seq", allocationSize = 1)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "fecha_apertura", nullable = false)
    private Instant fechaApertura;

    @Column(name = "fecha_cierre")
    private Instant fechaCierre;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_empleado")
    private Usuario idEmpleado;

    @Column(name = "observaciones", length = Integer.MAX_VALUE)
    private String observaciones;

    @Column(name = "monto_esperado", precision = 10, scale = 2)
    private BigDecimal montoEsperado;

    @Column(name = "monto_real", precision = 10, scale = 2)
    private BigDecimal montoReal;

}