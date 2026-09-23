package com.joedev.posweb.pep.rest;

import com.joedev.posweb.pep.dto.*;
import com.joedev.posweb.pep.services.EstadisticasService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RolesAllowed({"ADMIN", "COLABORADOR"})
@Path("/api/estadisticas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EstadisticasResource {

    @Inject
    EstadisticasService service;

    /**
     * GET /api/estadisticas/platos-top
     * Obtiene los 10 platos más vendidos en un rango de fechas
     */
    @GET
    @Path("/platos-top")
    public List<PlatoVentasDTO> getPlatosTop(
            @QueryParam("desde") String desdeStr,
            @QueryParam("hasta") String hastaStr,
            @QueryParam("tipoServicio") String tipoServicio) {
        
        LocalDate desde = LocalDate.parse(desdeStr);
        LocalDate hasta = LocalDate.parse(hastaStr);
        
        validarRangoFechas(desde, hasta);
        return service.getPlatosTopVentas(desde, hasta, tipoServicio);
    }

    /**
     * GET /api/estadisticas/platos-bottom
     * Obtiene los 5 platos menos vendidos en un rango de fechas
     */
    @GET
    @Path("/platos-bottom")
    public List<PlatoVentasDTO> getPlatosBottom(
            @QueryParam("desde") String desdeStr,
            @QueryParam("hasta") String hastaStr,
            @QueryParam("tipoServicio") String tipoServicio) {
        
        LocalDate desde = LocalDate.parse(desdeStr);
        LocalDate hasta = LocalDate.parse(hastaStr);
        
        validarRangoFechas(desde, hasta);
        return service.getPlatosBottomVentas(desde, hasta, tipoServicio);
    }

    /**
     * GET /api/estadisticas/ventas
     * Obtiene ventas agrupadas por semana y mes
     * Retorna: { "semanales": [...], "mensuales": [...] }
     */
    @GET
    @Path("/ventas")
    public Map<String, Object> getVentas(
            @QueryParam("desde") String desdeStr,
            @QueryParam("hasta") String hastaStr,
            @QueryParam("tipoServicio") String tipoServicio) {
        
        LocalDate desde = LocalDate.parse(desdeStr);
        LocalDate hasta = LocalDate.parse(hastaStr);
        
        validarRangoFechas(desde, hasta);
        
        List<VentasSemanaMesDTO> semanales = service.getVentasSemanales(desde, hasta, tipoServicio);
        List<VentasSemanaMesDTO> mensuales = service.getVentasMensuales(desde, hasta, tipoServicio);
        
        return Map.of(
            "semanales", semanales,
            "mensuales", mensuales
        );
    }

    /**
     * GET /api/estadisticas/dashboard-mensual
     * Obtiene dashboard de días con más pedidos y ganancia diaria
     */
    @GET
    @Path("/dashboard-mensual")
    public List<DiaConMasPedidosDTO> getDashboardMensual(
            @QueryParam("desde") String desdeStr,
            @QueryParam("hasta") String hastaStr,
            @QueryParam("tipoServicio") String tipoServicio) {
        
        LocalDate desde = LocalDate.parse(desdeStr);
        LocalDate hasta = LocalDate.parse(hastaStr);
        
        validarRangoFechas(desde, hasta);
        return service.getDashboardMensual(desde, hasta, tipoServicio);
    }

    /**
     * GET /api/estadisticas/rendimiento
     * Obtiene métricas de rendimiento para un mes específico
     */
    @GET
    @Path("/rendimiento")
    public RendimientoMensualDTO getRendimiento(
            @QueryParam("mes") Integer mes,
            @QueryParam("año") Integer año) {
        
        validarMesAño(mes, año);
        return service.getRendimientoMensual(mes, año);
    }

    /**
     * Valida que el rango de fechas sea válido
     */
    private void validarRangoFechas(LocalDate desde, LocalDate hasta) {
        if (desde == null || hasta == null) {
            throw new BadRequestException("Las fechas 'desde' y 'hasta' son obligatorias");
        }
        if (desde.isAfter(hasta)) {
            throw new BadRequestException("La fecha 'desde' no puede ser posterior a 'hasta'");
        }
    }

    /**
     * Valida que mes y año sean válidos
     */
    private void validarMesAño(Integer mes, Integer año) {
        if (mes == null || año == null) {
            throw new BadRequestException("Los parámetros 'mes' y 'año' son obligatorios");
        }
        if (mes < 1 || mes > 12) {
            throw new BadRequestException("El mes debe estar entre 1 y 12");
        }
        if (año < 2000 || año > 2100) {
            throw new BadRequestException("El año debe estar entre 2000 y 2100");
        }
    }
}
