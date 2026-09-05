package com.joedev.posweb.pep.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "receta_plato_producto")
public class RecetaPlatoProducto {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "receta_plato_producto_id_gen")
    @SequenceGenerator(name = "receta_plato_producto_id_gen", sequenceName = "receta_plato_producto_id_receta_seq", allocationSize = 1)
    @Column(name = "id_receta", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_plato")
    private Plato idPlato;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_producto")
    private Producto idProducto;

    @Column(name = "cantidad", precision = 8, scale = 2)
    private BigDecimal cantidad;

}