package com.joedev.posweb.pep.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

@Getter
@Setter
@Entity
@Table(name = "direccion")
public class Direccion {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "direccion_id_gen")
    @SequenceGenerator(name = "direccion_id_gen", sequenceName = "direccion_id_direccion_seq", allocationSize = 1)
    @Column(name = "id_direccion", nullable = false)
    private Integer id;

    @Column(name = "calle_principal", length = 100)
    private String callePrincipal;

    @Column(name = "calle_secundaria", length = 100)
    private String calleSecundaria;

    @Column(name = "ciudad", length = 50)
    private String ciudad;

    @Column(name = "sector", length = 50)
    private String sector;

    @ColumnDefault("true")
    @Column(name = "activo", nullable = false)
    private Boolean activo = false;

}