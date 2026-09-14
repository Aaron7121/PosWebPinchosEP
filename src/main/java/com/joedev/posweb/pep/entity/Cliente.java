package com.joedev.posweb.pep.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

@Getter
@Setter
@Entity
@Table(name = "cliente")
public class Cliente {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "cliente_id_gen")
    @SequenceGenerator(name = "cliente_id_gen", sequenceName = "cliente_id_cliente_seq", allocationSize = 1)
    @Column(name = "id_cliente", nullable = false)
    private Integer id;

    @Column(name = "nombre", length = 20)
    private String nombre;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "correo", length = 100)
    private String correo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_direccion")
    private com.joedev.posweb.pep.entity.Direccion idDireccion;

    @Column(name = "cedula", length = Integer.MAX_VALUE)
    private String cedula;

    @ColumnDefault("true")
    @Column(name = "activo", nullable = false)
    private Boolean activo = false;

}