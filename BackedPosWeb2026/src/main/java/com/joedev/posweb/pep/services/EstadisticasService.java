package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.dto.*;
import com.joedev.posweb.pep.repository.EstadisticasRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class EstadisticasService {

    @Inject
    EstadisticasRepository repository;

    /**
     * Obtiene los platos más vendidos transformados a DTOs
     */
    public List<PlatoVentasDTO> getPlatosTopVentas(LocalDate desde, LocalDate hasta, String tipoServicio) {
        List<Map<String, Object>> results = repository.getPlatosTopVentas(desde, hasta, tipoServicio);
        List<PlatoVentasDTO> dtos = new ArrayList<>();
        
        for (Map<String, Object> row : results) {
            dtos.add(new PlatoVentasDTO(
                ((Number) row.get("idPlato")).intValue(),
                (String) row.get("nombrePlato"),
                ((Number) row.get("cantidadVendida")).intValue(),
                (BigDecimal) row.get("totalVentas"),
                (BigDecimal) row.get("precioPromedio")
            ));
        }
        
        return dtos;
    }

    /**
     * Obtiene los platos menos vendidos transformados a DTOs
     */
    public List<PlatoVentasDTO> getPlatosBottomVentas(LocalDate desde, LocalDate hasta, String tipoServicio) {
        List<Map<String, Object>> results = repository.getPlatosBottomVentas(desde, hasta, tipoServicio);
        List<PlatoVentasDTO> dtos = new ArrayList<>();
        
        for (Map<String, Object> row : results) {
            dtos.add(new PlatoVentasDTO(
                ((Number) row.get("idPlato")).intValue(),
                (String) row.get("nombrePlato"),
                ((Number) row.get("cantidadVendida")).intValue(),
                (BigDecimal) row.get("totalVentas"),
                (BigDecimal) row.get("precioPromedio")
            ));
        }
        
        return dtos;
    }

    /**
     * Obtiene ventas semanales transformadas a DTOs
     */
    public List<VentasSemanaMesDTO> getVentasSemanales(LocalDate desde, LocalDate hasta, String tipoServicio) {
        List<Map<String, Object>> results = repository.getVentasSemanales(desde, hasta, tipoServicio);
        List<VentasSemanaMesDTO> dtos = new ArrayList<>();
        
        for (Map<String, Object> row : results) {
            Integer cantidadPedidos = ((Number) row.get("cantidadPedidos")).intValue();
            BigDecimal totalVentas = (BigDecimal) row.get("totalVentas");
            BigDecimal ticketPromedio = cantidadPedidos > 0 
                ? totalVentas.divide(new BigDecimal(cantidadPedidos), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
            
            dtos.add(new VentasSemanaMesDTO(
                ((Number) row.get("semana")).intValue(),
                null,
                ((Number) row.get("año")).intValue(),
                totalVentas,
                cantidadPedidos,
                ticketPromedio,
                ((Number) row.get("cantidadPlatos")).intValue()
            ));
        }
        
        return dtos;
    }

    /**
     * Obtiene ventas mensuales transformadas a DTOs
     */
    public List<VentasSemanaMesDTO> getVentasMensuales(LocalDate desde, LocalDate hasta, String tipoServicio) {
        List<Map<String, Object>> results = repository.getVentasMensuales(desde, hasta, tipoServicio);
        List<VentasSemanaMesDTO> dtos = new ArrayList<>();
        
        for (Map<String, Object> row : results) {
            Integer cantidadPedidos = ((Number) row.get("cantidadPedidos")).intValue();
            BigDecimal totalVentas = (BigDecimal) row.get("totalVentas");
            BigDecimal ticketPromedio = cantidadPedidos > 0 
                ? totalVentas.divide(new BigDecimal(cantidadPedidos), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
            
            dtos.add(new VentasSemanaMesDTO(
                null,
                ((Number) row.get("mes")).intValue(),
                ((Number) row.get("año")).intValue(),
                totalVentas,
                cantidadPedidos,
                ticketPromedio,
                ((Number) row.get("cantidadPlatos")).intValue()
            ));
        }
        
        return dtos;
    }

    /**
     * Obtiene dashboard de días con más pedidos transformado a DTOs
     */
    public List<DiaConMasPedidosDTO> getDashboardMensual(LocalDate desde, LocalDate hasta, String tipoServicio) {
        List<Map<String, Object>> results = repository.getDiasConMasPedidos(desde, hasta, tipoServicio);
        List<DiaConMasPedidosDTO> dtos = new ArrayList<>();
        
        for (Map<String, Object> row : results) {
            dtos.add(new DiaConMasPedidosDTO(
                (LocalDate) row.get("fecha"),
                ((Number) row.get("cantidadPedidos")).intValue(),
                (BigDecimal) row.get("gananciaDelDia"),
                ((Number) row.get("diaSemana")).intValue()
            ));
        }
        
        return dtos;
    }

    /**
     * Obtiene métricas de rendimiento mensual
     */
    public RendimientoMensualDTO getRendimientoMensual(Integer mes, Integer año) {
        Map<String, Object> result = repository.getRendimientoMensual(mes, año);
        
        if (result.isEmpty()) {
            return new RendimientoMensualDTO(mes, año, BigDecimal.ZERO, 0, BigDecimal.ZERO, BigDecimal.ZERO, 0, BigDecimal.ZERO);
        }
        
        BigDecimal totalIngresos = (BigDecimal) result.get("totalIngresos");
        Integer totalPedidos = ((Number) result.get("totalPedidos")).intValue();
        Integer diasConActividad = ((Number) result.get("diasConActividad")).intValue();
        
        BigDecimal promedioIngresosPorDia = diasConActividad > 0
            ? totalIngresos.divide(new BigDecimal(diasConActividad), 2, java.math.RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        
        BigDecimal promedioVentasPorPedido = totalPedidos > 0
            ? totalIngresos.divide(new BigDecimal(totalPedidos), 2, java.math.RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        
        return new RendimientoMensualDTO(
            mes,
            año,
            totalIngresos,
            totalPedidos,
            promedioIngresosPorDia,
            promedioVentasPorPedido,
            diasConActividad,
            promedioVentasPorPedido
        );
    }
}
