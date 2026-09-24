package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.dto.DetalleRequest;
import com.joedev.posweb.pep.dto.PedidoRequest;
import com.joedev.posweb.pep.entity.Caja;
import com.joedev.posweb.pep.entity.Cliente;
import com.joedev.posweb.pep.entity.DetallePedido;
import com.joedev.posweb.pep.entity.InventarioDiario;
import com.joedev.posweb.pep.entity.MovInventario;
import com.joedev.posweb.pep.entity.Pedido;
import com.joedev.posweb.pep.entity.Plato;
import com.joedev.posweb.pep.entity.Producto;
import com.joedev.posweb.pep.entity.RecetaPlatoProducto;
import com.joedev.posweb.pep.exception.ConflictoException;
import com.joedev.posweb.pep.exception.DatoInvalidoException;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
import com.joedev.posweb.pep.repository.CajaRepository;
import com.joedev.posweb.pep.repository.ClienteRepository;
import com.joedev.posweb.pep.repository.DetallePedidoRepository;
import com.joedev.posweb.pep.repository.InventarioDiarioRepository;
import com.joedev.posweb.pep.repository.MovInventarioRepository;
import com.joedev.posweb.pep.repository.PedidoRepository;
import com.joedev.posweb.pep.repository.PlatoRepository;
import com.joedev.posweb.pep.repository.RecetaPlatoProductoRepository;
import com.joedev.posweb.pep.stream.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@ApplicationScoped
public class PedidoService {

    public static final Set<String> ESTADOS_PEDIDO = Set.of("PENDIENTE", "ENTREGADO", "COMPLETADO", "CANCELADO");
    public static final Set<String> ESTADOS_PAGO = Set.of("PENDIENTE", "PAGADO");

    @Inject
    PedidoRepository repository;

    @Inject
    DetallePedidoRepository detalleRepository;

    @Inject
    PlatoRepository platoRepository;

    @Inject
    ClienteRepository clienteRepository;

    @Inject
    CajaRepository cajaRepository;

    @Inject
    RecetaPlatoProductoRepository recetaRepository;

    @Inject
    MovInventarioRepository movRepository;

    @Inject
    InventarioDiarioRepository inventarioRepository;

    @Inject
    UsuarioActualService usuarioActual;

    @Inject
    NotificationService notifier;

    @Inject
    IdempotenciaService idempotencia;

    @Transactional
    public List<Pedido> listarTodos() {
        Optional<Caja> abierta = cajaRepository.findAbierta();
        if (abierta.isEmpty()) {
            return List.of();
        }
        OffsetDateTime desde = abierta.get().getFechaApertura().atOffset(ZoneOffset.UTC);
        List<Pedido> pedidos = repository.find("fecha >= ?1 order by fecha desc", desde).list();
        for (Pedido pedido : pedidos) {
            String estadoAnterior = pedido.getEstadoPedido();
            sincronizarEstadoConPago(pedido);
            if (!estadoAnterior.equals(pedido.getEstadoPedido())) {
                repository.persistAndFlush(pedido);
            }
        }
        return pedidos;
    }

    public Pedido obtenerPorId(Integer id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("El pedido con id " + id + " no existe"));
    }

    public List<DetallePedido> listarDetalles(Integer idPedido) {
        obtenerEntidad(idPedido);
        return detalleRepository.listByPedidoId(idPedido);
    }

    @Transactional
    public Pedido crear(PedidoRequest request) {
        String key = request.idempotencyKey();
        boolean conKey = key != null && !key.isBlank();
        boolean reservado = conKey && idempotencia.reservar(key);

        if (conKey && !reservado) {
            Integer existenteId = idempotencia.pedidoIdDe(key);
            if (existenteId != null) {
                Optional<Pedido> existente = repository.findByIdOptional(existenteId);
                if (existente.isPresent()) {
                    return existente.get();
                }
            }
            throw new ConflictoException("Solicitud duplicada en proceso. Intenta de nuevo en unos segundos");
        }

        try {
            Pedido pedido = registrar(request);
            if (reservado) {
                idempotencia.completar(key, pedido.getId());
            }
            return pedido;
        } catch (RuntimeException e) {
            if (reservado) {
                idempotencia.liberar(key);
            }
            throw e;
        }
    }

    private Pedido registrar(PedidoRequest request) {
        if (request.detalles() == null || request.detalles().isEmpty()) {
            throw new DatoInvalidoException("El pedido debe incluir al menos un detalle");
        }
        if (cajaRepository.findAbierta().isEmpty()) {
            throw new ConflictoException("Debe abrir caja antes de registrar pedidos");
        }

        Pedido pedido = new Pedido();
        pedido.setFecha(OffsetDateTime.now());
        pedido.setIdEmpleado(usuarioActual.getUsuario());
        pedido.setTipoServicio(request.tipoServicio());
        pedido.setNumMesa(request.numMesa());
        pedido.setComentario(request.comentario());
        pedido.setEstadoPedido("PENDIENTE");
        pedido.setEstadoPago("PENDIENTE");
        if (request.idCliente() != null) {
            Cliente cliente = clienteRepository.findByIdOptional(request.idCliente())
                    .orElseThrow(() -> new EntidadNoEncontradaException("El cliente con id " + request.idCliente() + " no existe"));
            pedido.setIdCliente(cliente);
        }
        repository.persist(pedido);

        BigDecimal total = BigDecimal.ZERO;
        for (DetalleRequest detalleRequest : request.detalles()) {
            if (detalleRequest.idPlato() == null) {
                throw new DatoInvalidoException("El detalle debe indicar el plato");
            }
            if (detalleRequest.cantidad() == null || detalleRequest.cantidad() <= 0) {
                throw new DatoInvalidoException("La cantidad del plato debe ser mayor a cero");
            }
            Plato plato = platoRepository.findByIdOptional(detalleRequest.idPlato())
                    .orElseThrow(() -> new EntidadNoEncontradaException("El plato con id " + detalleRequest.idPlato() + " no existe"));
            if (plato.getPrecio() == null) {
                throw new DatoInvalidoException("El plato " + plato.getNombre() + " no tiene precio definido");
            }

            DetallePedido detalle = new DetallePedido();
            detalle.setIdPedido(pedido);
            detalle.setIdPlato(plato);
            detalle.setCantidad(detalleRequest.cantidad());
            detalle.setPrecioUnitario(plato.getPrecio());
            detalle.setSubtotal(plato.getPrecio()
                    .multiply(BigDecimal.valueOf(detalleRequest.cantidad()))
                    .setScale(2, RoundingMode.HALF_UP));
            detalleRepository.persist(detalle);
            total = total.add(detalle.getSubtotal());

            descontarStock(pedido, plato, detalleRequest.cantidad());
        }

        pedido.setTotal(total.setScale(2, RoundingMode.HALF_UP));
        repository.persistAndFlush(pedido);
        notifier.emitir("pedido:nuevo", Map.of("id", pedido.getId(), "total", pedido.getTotal()));
        notifier.emitir("inventario:modificado", Map.of());
        return pedido;
    }

    @Transactional
    public Pedido actualizar(Integer id, PedidoRequest request) {
        if (request.detalles() == null || request.detalles().isEmpty()) {
            throw new DatoInvalidoException("El pedido debe incluir al menos un detalle");
        }

        Pedido pedido = obtenerEntidad(id);
        if (!"PENDIENTE".equals(pedido.getEstadoPedido())) {
            throw new ConflictoException("Solo se pueden editar pedidos pendientes");
        }

        if (request.tipoServicio() != null) {
            pedido.setTipoServicio(request.tipoServicio());
        }
        pedido.setNumMesa(request.numMesa());
        pedido.setComentario(request.comentario());
        if (request.idCliente() != null) {
            Cliente cliente = clienteRepository.findByIdOptional(request.idCliente())
                    .orElseThrow(() -> new EntidadNoEncontradaException("El cliente con id " + request.idCliente() + " no existe"));
            pedido.setIdCliente(cliente);
        } else {
            pedido.setIdCliente(null);
        }

        for (DetallePedido detalleActual : detalleRepository.listByPedidoId(id)) {
            for (RecetaPlatoProducto receta : recetaRepository.listByPlatoId(detalleActual.getIdPlato().getId())) {
                Producto producto = receta.getIdProducto();
                if (producto == null || Boolean.FALSE.equals(producto.getEsContable()) || receta.getCantidad() == null) {
                    continue;
                }
                BigDecimal cantidadDevolver = receta.getCantidad()
                        .multiply(BigDecimal.valueOf(detalleActual.getCantidad()))
                        .setScale(2, RoundingMode.HALF_UP);
                crearMovimiento(producto, pedido, "DEVOLUCION", cantidadDevolver);
            }
            detalleRepository.delete(detalleActual);
        }

        BigDecimal total = BigDecimal.ZERO;
        for (DetalleRequest detalleRequest : request.detalles()) {
            if (detalleRequest.idPlato() == null) {
                throw new DatoInvalidoException("El detalle debe indicar el plato");
            }
            if (detalleRequest.cantidad() == null || detalleRequest.cantidad() <= 0) {
                throw new DatoInvalidoException("La cantidad del plato debe ser mayor a cero");
            }
            Plato plato = platoRepository.findByIdOptional(detalleRequest.idPlato())
                    .orElseThrow(() -> new EntidadNoEncontradaException("El plato con id " + detalleRequest.idPlato() + " no existe"));
            if (plato.getPrecio() == null) {
                throw new DatoInvalidoException("El plato " + plato.getNombre() + " no tiene precio definido");
            }

            DetallePedido detalle = new DetallePedido();
            detalle.setIdPedido(pedido);
            detalle.setIdPlato(plato);
            detalle.setCantidad(detalleRequest.cantidad());
            detalle.setPrecioUnitario(plato.getPrecio());
            detalle.setSubtotal(plato.getPrecio()
                    .multiply(BigDecimal.valueOf(detalleRequest.cantidad()))
                    .setScale(2, RoundingMode.HALF_UP));
            detalleRepository.persist(detalle);
            total = total.add(detalle.getSubtotal());

            descontarStock(pedido, plato, detalleRequest.cantidad());
        }

        pedido.setTotal(total.setScale(2, RoundingMode.HALF_UP));
        repository.persistAndFlush(pedido);
        notifier.emitir("pedido:actualizado", Map.of("id", id));
        notifier.emitir("inventario:modificado", Map.of());
        return pedido;
    }

    @Transactional
    public Pedido cancelar(Integer id) {
        Pedido pedido = obtenerEntidad(id);
        if ("CANCELADO".equals(pedido.getEstadoPedido())) {
            throw new ConflictoException("El pedido ya está cancelado");
        }
        if ("ENTREGADO".equals(pedido.getEstadoPedido()) || "COMPLETADO".equals(pedido.getEstadoPedido())) {
            throw new ConflictoException("No se puede cancelar un pedido entregado");
        }

        pedido.setEstadoPedido("CANCELADO");
        repository.persistAndFlush(pedido);

        for (DetallePedido detalle : detalleRepository.listByPedidoId(id)) {
            for (RecetaPlatoProducto receta : recetaRepository.listByPlatoId(detalle.getIdPlato().getId())) {
                Producto producto = receta.getIdProducto();
                if (producto == null || Boolean.FALSE.equals(producto.getEsContable()) || receta.getCantidad() == null) {
                    continue;
                }
                BigDecimal cantidadDevolver = receta.getCantidad()
                        .multiply(BigDecimal.valueOf(detalle.getCantidad()))
                        .setScale(2, RoundingMode.HALF_UP);
                crearMovimiento(producto, pedido, "DEVOLUCION", cantidadDevolver);
            }
        }

        notifier.emitir("pedido:actualizado", Map.of("id", id));
        notifier.emitir("inventario:modificado", Map.of());
        return pedido;
    }

    @Transactional
    public Pedido cambiarEstado(Integer id, String estado) {
        if (estado == null || !ESTADOS_PEDIDO.contains(estado)) {
            throw new DatoInvalidoException("El estado del pedido debe ser uno de: " + ESTADOS_PEDIDO);
        }
        Pedido pedido = obtenerEntidad(id);
        if ("COMPLETADO".equals(estado) && !"PAGADO".equals(pedido.getEstadoPago())) {
            throw new DatoInvalidoException("Un pedido solo puede completarse cuando está pagado");
        }
        pedido.setEstadoPedido(estado);
        sincronizarEstadoConPago(pedido);
        repository.persistAndFlush(pedido);
        notifier.emitir("pedido:actualizado", Map.of("id", id));
        if ("ENTREGADO".equals(estado)) {
            notifier.emitir("pedido:listo", Map.of("id", id, "total", pedido.getTotal()));
        }
        return pedido;
    }

    @Transactional
    public Pedido cambiarEstadoPago(Integer id, String estado) {
        if (estado == null || !ESTADOS_PAGO.contains(estado)) {
            throw new DatoInvalidoException("El estado de pago debe ser uno de: " + ESTADOS_PAGO);
        }
        Pedido pedido = obtenerEntidad(id);
        pedido.setEstadoPago(estado);
        sincronizarEstadoConPago(pedido);
        repository.persistAndFlush(pedido);
        notifier.emitir("pedido:actualizado", Map.of("id", id));
        return pedido;
    }

    public void sincronizarEstadoConPago(Pedido pedido) {
        if ("CANCELADO".equals(pedido.getEstadoPedido())) {
            return;
        }
        if ("ENTREGADO".equals(pedido.getEstadoPedido()) && "PAGADO".equals(pedido.getEstadoPago())) {
            pedido.setEstadoPedido("COMPLETADO");
        } else if ("COMPLETADO".equals(pedido.getEstadoPedido()) && !"PAGADO".equals(pedido.getEstadoPago())) {
            pedido.setEstadoPedido("ENTREGADO");
        }
    }

    private void descontarStock(Pedido pedido, Plato plato, Integer cantidad) {
        for (RecetaPlatoProducto receta : recetaRepository.listByPlatoId(plato.getId())) {
            Producto producto = receta.getIdProducto();
            if (producto == null || Boolean.FALSE.equals(producto.getEsContable()) || receta.getCantidad() == null) {
                continue;
            }
            BigDecimal cantidadSalida = receta.getCantidad()
                    .multiply(BigDecimal.valueOf(cantidad))
                    .setScale(2, RoundingMode.HALF_UP);
            crearMovimiento(producto, pedido, "SALIDA", cantidadSalida);
        }
    }

    private void crearMovimiento(Producto producto, Pedido pedido, String tipo, BigDecimal cantidad) {
        MovInventario movimiento = new MovInventario();
        movimiento.setIdProducto(producto);
        movimiento.setFecha(Instant.now());
        movimiento.setTipoMovimiento(tipo);
        movimiento.setCantidad(cantidad);
        movimiento.setIdPedido(pedido);
        movRepository.persist(movimiento);
        actualizarStock(producto, tipo, cantidad);
    }

    private void actualizarStock(Producto producto, String tipo, BigDecimal cantidad) {
        if (Boolean.FALSE.equals(producto.getEsContable())) {
            return;
        }
        LocalDate fechaInventario = cajaRepository.findAbierta()
                .map(caja -> caja.getFechaApertura().atZone(ZoneOffset.UTC).toLocalDate())
                .orElseThrow(() -> new ConflictoException("Debe abrir caja antes de registrar pedidos"));
        Optional<InventarioDiario> registro = inventarioRepository.findByFechaAndProductoForUpdate(
                fechaInventario,
                producto.getId());
        if (registro.isEmpty()) {
            throw new ConflictoException("No hay inventario registrado para la fecha de caja del producto " + producto.getNombre() + ". Registra el inventario antes de continuar");
        }
        InventarioDiario inventario = registro.get();
        BigDecimal nuevo = "SALIDA".equals(tipo)
                ? inventario.getCantidadActual().subtract(cantidad)
                : inventario.getCantidadActual().add(cantidad);
        if (nuevo.signum() < 0) {
            throw new ConflictoException("Stock insuficiente del producto " + producto.getNombre() + " para realizar el pedido");
        }
        inventario.setCantidadActual(nuevo);
    }

    private Pedido obtenerEntidad(Integer id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("El pedido con id " + id + " no existe"));
    }
}