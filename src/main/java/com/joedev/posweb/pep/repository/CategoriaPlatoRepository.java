package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.CategoriaPlato;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class CategoriaPlatoRepository implements PanacheRepositoryBase<CategoriaPlato, Integer> {

    public List<CategoriaPlato> listActivas() {
        return find("activo", true).list();
    }

    public List<CategoriaPlato> listRaicesActivas() {
        return find("activo = true and categoriaPadre is null order by nombre").list();
    }

    public List<CategoriaPlato> listHijasActivas(Integer idCategoriaPadre) {
        return find("activo = true and categoriaPadre.id = ?1 order by nombre", idCategoriaPadre).list();
    }

    public boolean existeNombreEnRaiz(String nombre, Integer idExcluido) {
        return count("lower(nombre) = lower(?1) and categoriaPadre is null and (?2 is null or id <> ?2)",
                nombre, idExcluido) > 0;
    }

    public boolean existeNombreBajoPadre(String nombre, Integer idCategoriaPadre, Integer idExcluido) {
        return count("lower(nombre) = lower(?1) and categoriaPadre.id = ?2 and (?3 is null or id <> ?3)",
                nombre, idCategoriaPadre, idExcluido) > 0;
    }

    public boolean tieneHijas(Integer idCategoria) {
        return count("categoriaPadre.id", idCategoria) > 0;
    }
}