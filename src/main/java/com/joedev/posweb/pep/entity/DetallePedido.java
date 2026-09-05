package com.joedev.posweb.pep.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "detalle_pedido")
public class DetallePedido {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "detalle_pedido_id_gen")
    @SequenceGenerator(name = "detalle_pedido_id_gen", sequenceName = "detalle_pedido_id_detalle_seq", allocationSize = 1)
    @Column(name = "id_detalle", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pedido")
    private com.joedev.posweb.pep.entity.Pedido idPedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_plato")
    private com.joedev.posweb.pep.entity.Plato idPlato;

    @Column(name = "cantidad")
    private Integer cantidad;

    @Column(name = "subtotal", precision = 8, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "precio_unitario", precision = 8, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "tipo_pago", length = 20)
    private String tipoPago;

}