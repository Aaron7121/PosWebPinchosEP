package com.joedev.posweb.pep.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "mov_inventario")
public class MovInventario {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "mov_inventario_id_gen")
    @SequenceGenerator(name = "mov_inventario_id_gen", sequenceName = "mov_inventario_id_mov_seq", allocationSize = 1)
    @Column(name = "id_mov", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_producto")
    private com.joedev.posweb.pep.entity.Producto idProducto;

    @Column(name = "fecha")
    private Instant fecha;

    @Column(name = "tipo_movimiento", nullable = false, length = 50)
    private String tipoMovimiento;

    @Column(name = "cantidad", nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidad;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pedido")
    private com.joedev.posweb.pep.entity.Pedido idPedido;

}