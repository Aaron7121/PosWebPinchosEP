package com.joedev.posweb.pep.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "detalle_pago")
public class DetallePago {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "detalle_pago_id_gen")
    @SequenceGenerator(name = "detalle_pago_id_gen", sequenceName = "detalle_pago_id_pago_seq", allocationSize = 1)
    @Column(name = "id_pago", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pedido")
    private Pedido idPedido;

    @Column(name = "tipo", length = 255)
    private String tipo;

    @Column(name = "total", precision = 10, scale = 2)
    private BigDecimal total;

    @Column(name = "fecha")
    private OffsetDateTime fecha;

}
