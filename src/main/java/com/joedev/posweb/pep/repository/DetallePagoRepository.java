package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.DetallePago;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@ApplicationScoped
public class DetallePagoRepository implements PanacheRepositoryBase<DetallePago, Integer> {

    public List<DetallePago> listByPedidoId(Integer idPedido) {
        return find("idPedido.id", idPedido).list();
    }

    public BigDecimal sumByPedidoId(Integer idPedido) {
        BigDecimal total = getEntityManager()
                .createQuery("select coalesce(sum(d.total), 0) from DetallePago d where d.idPedido.id = :id", BigDecimal.class)
                .setParameter("id", idPedido)
                .getSingleResult();
        return total == null ? BigDecimal.ZERO : total;
    }

    public List<Object[]> resumenPorTipo(OffsetDateTime inicio, OffsetDateTime fin) {
        return getEntityManager()
                .createQuery("select d.tipo, sum(d.total) from DetallePago d where d.fecha >= :inicio and d.fecha < :fin group by d.tipo", Object[].class)
                .setParameter("inicio", inicio)
                .setParameter("fin", fin)
                .getResultList();
    }
}
