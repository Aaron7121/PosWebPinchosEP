package com.joedev.posweb.pep.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "plato")
public class Plato {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "plato_id_gen")
    @SequenceGenerator(name = "plato_id_gen", sequenceName = "plato_id_plato_seq", allocationSize = 1)
    @Column(name = "id_plato", nullable = false)
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "descripcion", length = Integer.MAX_VALUE)
    private String descripcion;

    @Column(name = "precio", nullable = false, precision = 8, scale = 2)
    private BigDecimal precio;

    @Column(name = "img", length = Integer.MAX_VALUE)
    private String img;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_categoria")
    private CategoriaPlato idCategoria;

    @ColumnDefault("true")
    @Column(name = "activo")
    private Boolean activo;

}