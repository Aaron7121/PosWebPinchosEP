package com.joedev.posweb.pep.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

@Getter
@Setter
@Entity
@Table(name = "categoria_plato")
public class CategoriaPlato {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "categoria_plato_id_gen")
    @SequenceGenerator(name = "categoria_plato_id_gen", sequenceName = "categoria_plato_id_seq", allocationSize = 1)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @ColumnDefault("true")
    @Column(name = "activo")
    private Boolean activo;

    @Column(name = "img")
    private String img;

}