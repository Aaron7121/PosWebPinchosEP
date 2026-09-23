package com.joedev.posweb.pep.repository;

import com.joedev.posweb.pep.entity.Pedido;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.Query;
import jakarta.persistence.EntityManager;
import jakarta.inject.Inject;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class EstadisticasRepository implements PanacheRepositoryBase<Pedido, Integer> {

    @Inject
    EntityManager em;

    /**
     * Obtiene los 10 platos más vendidos en un rango de fechas
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getPlatosTopVentas(LocalDate desde, LocalDate hasta, String tipoServicio) {
        String sql = "SELECT new map(" +
            "p.id as idPlato, " +
            "p.nombre as nombrePlato, " +
            "SUM(dp.cantidad) as cantidadVendida, " +
            "SUM(dp.subtotal) as totalVentas, " +
            "CAST(AVG(dp.precioUnitario) AS java.math.BigDecimal) as precioPromedio) " +
            "FROM Pedido ped " +
            "JOIN DetallePedido dp ON ped.id = dp.idPedido.id " +
            "JOIN Plato p ON dp.idPlato.id = p.id " +
            "WHERE CAST(ped.fecha AS java.time.LocalDate) BETWEEN ?1 AND ?2 " +
            "AND ped.estadoPago = 'PAGADO' ";
        
        if (tipoServicio != null && !tipoServicio.isBlank()) {
            sql += "AND ped.tipoServicio = ?4 ";
        }
        
        sql += "GROUP BY p.id, p.nombre " +
            "ORDER BY cantidadVendida DESC ";
        
        Query query = em.createQuery(sql);
        query.setParameter(1, desde);
        query.setParameter(2, hasta);
        query.setMaxResults(10);
        if (tipoServicio != null && !tipoServicio.isBlank()) {
            query.setParameter(4, tipoServicio);
        }
        
        return query.getResultList();
    }

    /**
     * Obtiene los 5 platos menos vendidos en un rango de fechas
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getPlatosBottomVentas(LocalDate desde, LocalDate hasta, String tipoServicio) {
        String sql = "SELECT new map(" +
            "p.id as idPlato, " +
            "p.nombre as nombrePlato, " +
            "SUM(dp.cantidad) as cantidadVendida, " +
            "SUM(dp.subtotal) as totalVentas, " +
            "CAST(AVG(dp.precioUnitario) AS java.math.BigDecimal) as precioPromedio) " +
            "FROM Pedido ped " +
            "JOIN DetallePedido dp ON ped.id = dp.idPedido.id " +
            "JOIN Plato p ON dp.idPlato.id = p.id " +
            "WHERE CAST(ped.fecha AS java.time.LocalDate) BETWEEN ?1 AND ?2 " +
            "AND ped.estadoPago = 'PAGADO' ";
        
        if (tipoServicio != null && !tipoServicio.isBlank()) {
            sql += "AND ped.tipoServicio = ?4 ";
        }
        
        sql += "GROUP BY p.id, p.nombre " +
            "ORDER BY cantidadVendida ASC ";
        
        Query query = em.createQuery(sql);
        query.setParameter(1, desde);
        query.setParameter(2, hasta);
        query.setMaxResults(5);
        if (tipoServicio != null && !tipoServicio.isBlank()) {
            query.setParameter(4, tipoServicio);
        }
        
        return query.getResultList();
    }

    /**
     * Obtiene ventas agrupadas por semana
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getVentasSemanales(LocalDate desde, LocalDate hasta, String tipoServicio) {
        String sql = "SELECT new map(" +
            "FUNCTION('date_part', 'week', ped.fecha) as semana, " +
            "EXTRACT(YEAR FROM ped.fecha) as año, " +
            "COALESCE(SUM(ped.total), 0) as totalVentas, " +
            "COUNT(ped.id) as cantidadPedidos, " +
            "COALESCE(SUM(dp.cantidad), 0) as cantidadPlatos) " +
            "FROM Pedido ped " +
            "LEFT JOIN DetallePedido dp ON ped.id = dp.idPedido.id " +
            "WHERE CAST(ped.fecha AS java.time.LocalDate) BETWEEN ?1 AND ?2 " +
            "AND ped.estadoPago = 'PAGADO' ";
        
        if (tipoServicio != null && !tipoServicio.isBlank()) {
            sql += "AND ped.tipoServicio = ?4 ";
        }
        
        sql += "GROUP BY FUNCTION('date_part', 'week', ped.fecha), EXTRACT(YEAR FROM ped.fecha) " +
            "ORDER BY EXTRACT(YEAR FROM ped.fecha), FUNCTION('date_part', 'week', ped.fecha)";
        
        Query query = em.createQuery(sql);
        query.setParameter(1, desde);
        query.setParameter(2, hasta);
        if (tipoServicio != null && !tipoServicio.isBlank()) {
            query.setParameter(4, tipoServicio);
        }
        
        return query.getResultList();
    }

    /**
     * Obtiene ventas agrupadas por mes
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getVentasMensuales(LocalDate desde, LocalDate hasta, String tipoServicio) {
        String sql = "SELECT new map(" +
            "EXTRACT(MONTH FROM ped.fecha) as mes, " +
            "EXTRACT(YEAR FROM ped.fecha) as año, " +
            "COALESCE(SUM(ped.total), 0) as totalVentas, " +
            "COUNT(ped.id) as cantidadPedidos, " +
            "COALESCE(SUM(dp.cantidad), 0) as cantidadPlatos) " +
            "FROM Pedido ped " +
            "LEFT JOIN DetallePedido dp ON ped.id = dp.idPedido.id " +
            "WHERE CAST(ped.fecha AS java.time.LocalDate) BETWEEN ?1 AND ?2 " +
            "AND ped.estadoPago = 'PAGADO' ";
        
        if (tipoServicio != null && !tipoServicio.isBlank()) {
            sql += "AND ped.tipoServicio = ?4 ";
        }
        
        sql += "GROUP BY EXTRACT(MONTH FROM ped.fecha), EXTRACT(YEAR FROM ped.fecha) " +
            "ORDER BY EXTRACT(YEAR FROM ped.fecha), EXTRACT(MONTH FROM ped.fecha)";
        
        Query query = em.createQuery(sql);
        query.setParameter(1, desde);
        query.setParameter(2, hasta);
        if (tipoServicio != null && !tipoServicio.isBlank()) {
            query.setParameter(4, tipoServicio);
        }
        
        return query.getResultList();
    }

    /**
     * Obtiene los días con más pedidos y ganancia diaria (ingresos reales por pedidos pagados)
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getDiasConMasPedidos(LocalDate desde, LocalDate hasta, String tipoServicio) {
        String sql = "SELECT new map(" +
            "CAST(ped.fecha AS java.time.LocalDate) as fecha, " +
            "COUNT(DISTINCT ped.id) as cantidadPedidos, " +
            "COALESCE(SUM(CASE WHEN ped.estadoPago = 'PAGADO' THEN ped.total ELSE 0 END), 0) as gananciaDelDia, " +
            "FUNCTION('date_part', 'dow', ped.fecha) as diaSemana) " +
            "FROM Pedido ped " +
            "WHERE CAST(ped.fecha AS java.time.LocalDate) BETWEEN ?1 AND ?2 ";
        
        if (tipoServicio != null && !tipoServicio.isBlank()) {
            sql += "AND ped.tipoServicio = ?4 ";
        }
        
        sql += "GROUP BY CAST(ped.fecha AS java.time.LocalDate), FUNCTION('date_part', 'dow', ped.fecha) " +
            "ORDER BY cantidadPedidos DESC";
        
        Query query = em.createQuery(sql);
        query.setParameter(1, desde);
        query.setParameter(2, hasta);
        if (tipoServicio != null && !tipoServicio.isBlank()) {
            query.setParameter(4, tipoServicio);
        }
        
        return query.getResultList();
    }

    /**
     * Obtiene métricas de rendimiento para un mes específico (ingresos reales por pedidos pagados)
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getRendimientoMensual(Integer mes, Integer año) {
        String sql = "SELECT new map(" +
            "?1 as mes, " +
            "?2 as año, " +
            "COALESCE(SUM(ped.total), 0) as totalIngresos, " +
            "COUNT(DISTINCT ped.id) as totalPedidos, " +
            "COUNT(DISTINCT CAST(ped.fecha AS java.time.LocalDate)) as diasConActividad) " +
            "FROM Pedido ped " +
            "WHERE EXTRACT(MONTH FROM ped.fecha) = ?1 " +
            "AND EXTRACT(YEAR FROM ped.fecha) = ?2 " +
            "AND ped.estadoPago = 'PAGADO'";
        
        Query query = em.createQuery(sql);
        query.setParameter(1, mes);
        query.setParameter(2, año);
        
        List<Map<String, Object>> results = query.getResultList();
        if (results.isEmpty()) {
            return Map.of();
        }
        
        return results.get(0);
    }
}
