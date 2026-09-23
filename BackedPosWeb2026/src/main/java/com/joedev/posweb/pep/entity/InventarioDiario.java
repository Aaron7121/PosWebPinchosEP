package com.joedev.posweb.pep.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "inventario_diario")
public class InventarioDiario {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "inventario_diario_id_gen")
    @SequenceGenerator(name = "inventario_diario_id_gen", sequenceName = "inventario_diario_id_inventario_seq", allocationSize = 1)
    @Column(name = "id_inventario", nullable = false)
    private Integer id;

    @Column(name = "fecha")
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_producto")
    private com.joedev.posweb.pep.entity.Producto idProducto;

    @Column(name = "cantidad_inicial", nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadInicial;

    @Column(name = "cantidad_actual", nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadActual;

}