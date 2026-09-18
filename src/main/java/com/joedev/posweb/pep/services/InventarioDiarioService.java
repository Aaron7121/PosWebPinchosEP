package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.dto.AjusteInventarioRequest;
import com.joedev.posweb.pep.dto.InventarioItemRequest;
import com.joedev.posweb.pep.entity.InventarioDiario;
import com.joedev.posweb.pep.entity.MovInventario;
import com.joedev.posweb.pep.entity.Producto;
import com.joedev.posweb.pep.exception.ConflictoException;
import com.joedev.posweb.pep.exception.DatoInvalidoException;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
import com.joedev.posweb.pep.repository.CajaRepository;
import com.joedev.posweb.pep.repository.InventarioDiarioRepository;
import com.joedev.posweb.pep.repository.MovInventarioRepository;
import com.joedev.posweb.pep.repository.ProductoRepository;
import com.joedev.posweb.pep.stream.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class InventarioDiarioService {

    @Inject
    InventarioDiarioRepository repository;

    @Inject
    CajaRepository cajaRepository;

    @Inject
    MovInventarioRepository movRepository;

    @Inject
    ProductoRepository productoRepository;

    @Inject
    NotificationService notifier;

    public List<InventarioDiario> listarTodos() {
        return repository.list("order by fecha desc");
    }

    public List<InventarioDiario> listarPorFecha(LocalDate fecha) {
        return repository.findByFecha(fecha);
    }

    public List<InventarioDiario> ultimoPorProducto() {
        return repository.ultimoPorProducto();
    }

    public InventarioDiario obtenerPorId(Integer id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("El registro de inventario con id " + id + " no existe"));
    }

    public static void validarFechaCajaInventario(LocalDate fechaInventario, LocalDate fechaCaja) {
        if (fechaInventario == null) {
            throw new DatoInvalidoException("La fecha es obligatoria");
        }

        if (fechaCaja == null) {
            if (!fechaInventario.equals(LocalDate.now())) {
                throw new ConflictoException("El inventario debe registrarse para la fecha actual antes de abrir la caja");
            }
            return;
        }

        if (!fechaInventario.equals(fechaCaja)) {
            throw new ConflictoException("El inventario debe corresponder a la fecha de la caja abierta: " + fechaCaja);
        }
    }

    @Transactional
    public List<InventarioDiario> registrarLote(LocalDate fecha, List<InventarioItemRequest> items) {
        validarFechaSegunCajaActiva(fecha);
        if (items == null || items.isEmpty()) {
            throw new DatoInvalidoException("Debe enviar al menos un producto para registrar el inventario");
        }

        List<InventarioDiario> resultado = new ArrayList<>();
        for (InventarioItemRequest item : items) {
            if (item.idProducto() == null) {
                throw new DatoInvalidoException("El idProducto es obligatorio en cada registro");
            }
            if (item.cantidadInicial() == null || item.cantidadInicial().signum() < 0) {
                throw new DatoInvalidoException("La cantidad inicial del producto " + item.idProducto() + " es obligatoria y no puede ser negativa");
            }
            Producto producto = productoRepository.findByIdOptional(item.idProducto())
                    .orElseThrow(() -> new EntidadNoEncontradaException("El producto con id " + item.idProducto() + " no existe"));

            if (repository.findByFechaAndProducto(fecha, producto.getId()).isPresent()) {
                continue;
            }

            InventarioDiario registro = new InventarioDiario();
            registro.setFecha(fecha);
            registro.setIdProducto(producto);
            registro.setCantidadInicial(item.cantidadInicial());
            registro.setCantidadActual(item.cantidadInicial());
            repository.persist(registro);
            crearMovimiento(producto, "ENTRADA", item.cantidadInicial());
            resultado.add(registro);
        }
        repository.flush();
        notifier.emitir("inventario:modificado", Map.of("fecha", fecha.toString()));
        return resultado;
    }

    @Transactional
    public InventarioDiario registrarEntrada(LocalDate fecha, AjusteInventarioRequest request) {
        validarFechaSegunCajaActiva(fecha);
        Producto producto = validarProducto(request.idProducto());
        BigDecimal cantidad = validarCantidad(request.cantidad(), "entrada");
        InventarioDiario registro = aplicarEntrada(fecha, producto, cantidad);
        repository.flush();
        notifier.emitir("inventario:modificado", Map.of("fecha", fecha.toString()));
        return registro;
    }

    @Transactional
    public List<InventarioDiario> registrarEntradaLote(LocalDate fecha, List<AjusteInventarioRequest> items) {
        validarFechaSegunCajaActiva(fecha);
        if (items == null || items.isEmpty()) {
            throw new DatoInvalidoException("Debe enviar al menos un producto");
        }
        List<InventarioDiario> resultado = new ArrayList<>();
        for (AjusteInventarioRequest item : items) {
            Producto producto = validarProducto(item.idProducto());
            BigDecimal cantidad = validarCantidad(item.cantidad(), "entrada");
            resultado.add(aplicarEntrada(fecha, producto, cantidad));
        }
        repository.flush();
        notifier.emitir("inventario:modificado", Map.of("fecha", fecha.toString()));
        return resultado;
    }

    @Transactional
    public InventarioDiario registrarSalida(LocalDate fecha, AjusteInventarioRequest request) {
        validarFechaSegunCajaActiva(fecha);
        Producto producto = validarProducto(request.idProducto());
        BigDecimal cantidad = validarCantidad(request.cantidad(), "salida");
        InventarioDiario registro = aplicarSalida(fecha, producto, cantidad);
        repository.flush();
        notifier.emitir("inventario:modificado", Map.of("fecha", fecha.toString()));
        return registro;
    }

    @Transactional
    public List<InventarioDiario> registrarSalidaLote(LocalDate fecha, List<AjusteInventarioRequest> items) {
        validarFechaSegunCajaActiva(fecha);
        if (items == null || items.isEmpty()) {
            throw new DatoInvalidoException("Debe enviar al menos un producto");
        }
        List<InventarioDiario> resultado = new ArrayList<>();
        for (AjusteInventarioRequest item : items) {
            Producto producto = validarProducto(item.idProducto());
            BigDecimal cantidad = validarCantidad(item.cantidad(), "salida");
            resultado.add(aplicarSalida(fecha, producto, cantidad));
        }
        repository.flush();
        notifier.emitir("inventario:modificado", Map.of("fecha", fecha.toString()));
        return resultado;
    }

    private void validarFecha(LocalDate fecha) {
        if (fecha == null) {
            throw new DatoInvalidoException("La fecha es obligatoria");
        }
    }

    private void validarFechaSegunCajaActiva(LocalDate fecha) {
        validarFecha(fecha);
        LocalDate fechaCaja = cajaRepository.findAbierta()
                .map(caja -> caja.getFechaApertura().atZone(ZoneId.systemDefault()).toLocalDate())
                .orElse(null);
        validarFechaCajaInventario(fecha, fechaCaja);
    }

    private Producto validarProducto(Integer idProducto) {
        if (idProducto == null) {
            throw new DatoInvalidoException("El idProducto es obligatorio");
        }
        return productoRepository.findByIdOptional(idProducto)
                .orElseThrow(() -> new EntidadNoEncontradaException("El producto con id " + idProducto + " no existe"));
    }

    private BigDecimal validarCantidad(BigDecimal cantidad, String operacion) {
        if (cantidad == null || cantidad.signum() <= 0) {
            throw new DatoInvalidoException("La cantidad de " + operacion + " debe ser mayor a cero");
        }
        return cantidad;
    }

    private InventarioDiario aplicarEntrada(LocalDate fecha, Producto producto, BigDecimal cantidad) {
        InventarioDiario registro = repository.findByFechaAndProducto(fecha, producto.getId())
                .orElseGet(InventarioDiario::new);
        if (registro.getId() == null) {
            registro.setFecha(fecha);
            registro.setIdProducto(producto);
            registro.setCantidadInicial(cantidad);
            registro.setCantidadActual(cantidad);
        } else {
            registro.setCantidadInicial(registro.getCantidadInicial().add(cantidad));
            registro.setCantidadActual(registro.getCantidadActual().add(cantidad));
        }
        repository.persist(registro);
        crearMovimiento(producto, "ENTRADA", cantidad);
        return registro;
    }

    private InventarioDiario aplicarSalida(LocalDate fecha, Producto producto, BigDecimal cantidad) {
        InventarioDiario registro = repository.findByFechaAndProductoForUpdate(fecha, producto.getId())
                .orElseThrow(() -> new ConflictoException("No hay inventario registrado hoy para el producto " + producto.getNombre() + ". Registra la apertura del día"));
        if (registro.getCantidadActual().compareTo(cantidad) < 0) {
            throw new ConflictoException("Stock insuficiente: solo hay " + registro.getCantidadActual() + " de " + producto.getNombre());
        }
        registro.setCantidadActual(registro.getCantidadActual().subtract(cantidad));
        repository.persist(registro);
        crearMovimiento(producto, "SALIDA", cantidad);
        return registro;
    }

    private void crearMovimiento(Producto producto, String tipo, BigDecimal cantidad) {
        if (cantidad == null || cantidad.signum() == 0) {
            return;
        }
        MovInventario movimiento = new MovInventario();
        movimiento.setIdProducto(producto);
        movimiento.setFecha(Instant.now());
        movimiento.setTipoMovimiento(tipo);
        movimiento.setCantidad(cantidad);
        movRepository.persist(movimiento);
    }

    @Transactional
    public InventarioDiario actualizar(Integer id, InventarioDiario inventarioDiario) {
        if (repository.findByIdOptional(id).isEmpty()) {
            throw new EntidadNoEncontradaException("El registro de inventario con id " + id + " no existe");
        }
        inventarioDiario.setId(id);
        InventarioDiario actualizado = repository.getEntityManager().merge(inventarioDiario);
        notifier.emitir("inventario:modificado", Map.of("id", id));
        return actualizado;
    }

    @Transactional
    public void eliminar(Integer id) {
        if (!repository.deleteById(id)) {
            throw new EntidadNoEncontradaException("El registro de inventario con id " + id + " no existe");
        }
        notifier.emitir("inventario:modificado", Map.of("id", id));
    }
}