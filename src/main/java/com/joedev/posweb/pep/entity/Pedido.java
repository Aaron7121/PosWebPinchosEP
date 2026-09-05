package com.joedev.posweb.pep.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "pedido")
public class Pedido {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "pedido_id_gen")
    @SequenceGenerator(name = "pedido_id_gen", sequenceName = "pedido_id_pedido_seq", allocationSize = 1)
    @Column(name = "id_pedido", nullable = false)
    private Integer id;

    @Column(name = "fecha")
    private OffsetDateTime fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente")
    private Cliente idCliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_empleado")
    private Usuario idEmpleado;

    @Column(name = "total", precision = 10, scale = 2)
    private BigDecimal total;

    @Column(name = "tipo_servicio", length = 50)
    private String tipoServicio;

    @Column(name = "num_mesa")
    private Integer numMesa;

    @Column(name = "comentario", length = Integer.MAX_VALUE)
    private String comentario;

    @ColumnDefault("'PENDIENTE'")
    @Column(name = "estado_pedido", length = 20)
    private String estadoPedido;

    @ColumnDefault("'PENDIENTE'")
    @Column(name = "estado_pago", length = 20)
    private String estadoPago;

}