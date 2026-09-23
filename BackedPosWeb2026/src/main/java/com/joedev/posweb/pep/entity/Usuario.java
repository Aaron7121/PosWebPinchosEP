package com.joedev.posweb.pep.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

@Entity
@Table(name = "usuario")
@Getter
@Setter
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "usuario_id_gen")
    @SequenceGenerator(name = "usuario_id_gen", sequenceName = "empleado_id_empleado_seq", allocationSize = 1)
    @Column(name = "id_empleado", nullable = false)
    private Integer id;

    @Column(name = "nombre", length = 100)
    private String nombre;

    @Column(name = "cedula", length = 20)
    private String cedula;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "correo", length = 100)
    private String correo;

    @Column(name = "cargo", length = 50)
    private String cargo;

    @Column(name = "usuario", nullable = false)
    private String usuario;

    @JsonIgnore
    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "rol", length = 50)
    private String rol;

    @ColumnDefault("true")
    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_direccion")
    private Direccion direccion;

}