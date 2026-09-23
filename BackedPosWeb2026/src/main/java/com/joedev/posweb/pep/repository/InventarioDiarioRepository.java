package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.InventarioDiario;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.LockModeType;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class InventarioDiarioRepository implements PanacheRepositoryBase<InventarioDiario, Integer> {

    public Optional<InventarioDiario> findByFechaAndProducto(LocalDate fecha, Integer idProducto) {
        return find("fecha = ?1 AND idProducto.id = ?2", fecha, idProducto).firstResultOptional();
    }

    public Optional<InventarioDiario> findByFechaAndProductoForUpdate(LocalDate fecha, Integer idProducto) {
        return find("fecha = ?1 AND idProducto.id = ?2", fecha, idProducto)
                .withLock(LockModeType.PESSIMISTIC_WRITE)
                .firstResultOptional();
    }

    public List<InventarioDiario> findByFecha(LocalDate fecha) {
        return find("fecha", fecha).list();
    }

    public List<InventarioDiario> ultimoPorProducto() {
        List<InventarioDiario> todos = find("order by fecha desc, id desc").list();
        Map<Integer, InventarioDiario> ultimos = new LinkedHashMap<>();
        for (InventarioDiario inv : todos) {
            if (inv.getIdProducto() != null) {
                ultimos.putIfAbsent(inv.getIdProducto().getId(), inv);
            }
        }
        return new ArrayList<>(ultimos.values());
    }
}