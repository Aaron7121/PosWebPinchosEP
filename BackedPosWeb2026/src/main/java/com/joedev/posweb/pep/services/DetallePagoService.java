package com.joedev.posweb.pep.services;

import com.joedev.posweb.pep.dto.ClientePagoRequest;
import com.joedev.posweb.pep.dto.PagoItemRequest;
import com.joedev.posweb.pep.dto.PagoRequest;
import com.joedev.posweb.pep.dto.ResumenPagoResponse;
import com.joedev.posweb.pep.entity.Cliente;
import com.joedev.posweb.pep.entity.DetallePago;
import com.joedev.posweb.pep.entity.Pedido;
import com.joedev.posweb.pep.exception.ConflictoException;
import com.joedev.posweb.pep.exception.DatoInvalidoException;
import com.joedev.posweb.pep.exception.EntidadNoEncontradaException;
import com.joedev.posweb.pep.repository.CajaRepository;
import com.joedev.posweb.pep.repository.ClienteRepository;
import com.joedev.posweb.pep.repository.DetallePagoRepository;
import com.joedev.posweb.pep.repository.PedidoRepository;
import com.joedev.posweb.pep.stream.NotificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@ApplicationScoped
public class DetallePagoService {

    public static final Set<String> TIPOS_PAGO = Set.of("EFECTIVO", "TRANSFERENCIA");

    @Inject
    DetallePagoRepository repository;

    @Inject
    PedidoRepository pedidoRepository;

    @Inject
    ClienteRepository clienteRepository;

    @Inject
    CajaRepository cajaRepository;

    @Inject
    NotificationService notifier;

    @Inject
    PedidoService pedidoService;

    public List<DetallePago> listarPorPedido(Integer idPedido) {
        obtenerPedido(idPedido);
        return repository.listByPedidoId(idPedido);
    }

    public List<ResumenPagoResponse> resumenDelDia(LocalDate fecha) {
        ZoneId zona = ZoneId.systemDefault();
        OffsetDateTime inicio = fecha.atStartOfDay(zona).toOffsetDateTime();
        OffsetDateTime fin = inicio.plusDays(1);
        List<ResumenPagoResponse> resumen = new ArrayList<>();
        for (Object[] row : repository.resumenPorTipo(inicio, fin)) {
            String tipo = (String) row[0];
            BigDecimal total = row[1] == null ? BigDecimal.ZERO : (BigDecimal) row[1];
            resumen.add(new ResumenPagoResponse(tipo, total));
        }
        return resumen;
    }

    @Transactional
    public List<DetallePago> registrar(PagoRequest request) {
        if (request.idPedido() == null) {
            throw new DatoInvalidoException("Debe indicar el pedido");
        }
        if (request.pagos() == null || request.pagos().isEmpty()) {
            throw new DatoInvalidoException("Debe indicar al menos un método de pago");
        }
        if (cajaRepository.findAbierta().isEmpty()) {
            throw new ConflictoException("Debe abrir caja antes de registrar pagos");
        }

        Pedido pedido = obtenerPedido(request.idPedido());
        if (pedido.getTotal() == null) {
            throw new DatoInvalidoException("El pedido no tiene total definido");
        }

        if (request.cliente() != null && tieneDatos(request.cliente())) {
            pedido.setIdCliente(resolverCliente(request.cliente()));
            pedidoRepository.persistAndFlush(pedido);
        }

        BigDecimal sumaNueva = BigDecimal.ZERO;
        for (PagoItemRequest item : request.pagos()) {
            if (item.tipo() == null || !TIPOS_PAGO.contains(item.tipo())) {
                throw new DatoInvalidoException("El tipo de pago debe ser uno de: " + TIPOS_PAGO);
            }
            if (item.monto() == null || item.monto().signum() <= 0) {
                throw new DatoInvalidoException("El monto de cada método de pago debe ser mayor a cero");
            }
            sumaNueva = sumaNueva.add(item.monto());
        }

        BigDecimal totalPagado = repository.sumByPedidoId(request.idPedido()).add(sumaNueva);
        if (totalPagado.compareTo(pedido.getTotal()) > 0) {
            throw new ConflictoException("El pago excede el total del pedido");
        }

        List<DetallePago> creados = new ArrayList<>();
        for (PagoItemRequest item : request.pagos()) {
            DetallePago pago = new DetallePago();
            pago.setIdPedido(pedido);
            pago.setTipo(item.tipo());
            pago.setTotal(item.monto().setScale(2, RoundingMode.HALF_UP));
            pago.setFecha(OffsetDateTime.now());
            repository.persist(pago);
            creados.add(pago);
        }

        boolean pagadoCompleto = totalPagado.compareTo(pedido.getTotal()) == 0;
        if (pagadoCompleto) {
            pedido.setEstadoPago("PAGADO");
            pedidoService.sincronizarEstadoConPago(pedido);
            pedidoRepository.persistAndFlush(pedido);
        }
        repository.flush();

        notifier.emitir("pedido:actualizado", Map.of("id", pedido.getId()));
        if (pagadoCompleto) {
            notifier.emitir("pedido:cobrado", Map.of("id", pedido.getId()));
        }
        notifier.emitir("caja:modificado", Map.of());
        return creados;
    }

    @Transactional
    public void anular(Integer id) {
        DetallePago pago = repository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("El pago con id " + id + " no existe"));
        Pedido pedido = pago.getIdPedido();
        repository.delete(pago);
        repository.flush();

        if (pedido != null && pedido.getTotal() != null) {
            BigDecimal restante = repository.sumByPedidoId(pedido.getId());
            if (restante.compareTo(pedido.getTotal()) < 0 && "PAGADO".equals(pedido.getEstadoPago())) {
                pedido.setEstadoPago("PENDIENTE");
                pedidoService.sincronizarEstadoConPago(pedido);
                pedidoRepository.persistAndFlush(pedido);
            }
            notifier.emitir("pedido:actualizado", Map.of("id", pedido.getId()));
            notifier.emitir("caja:modificado", Map.of());
        }
    }

    private Pedido obtenerPedido(Integer id) {
        return pedidoRepository.findByIdOptional(id)
                .orElseThrow(() -> new EntidadNoEncontradaException("El pedido con id " + id + " no existe"));
    }

    private boolean tieneDatos(ClientePagoRequest cliente) {
        return !esVacio(cliente.cedula())
                || !esVacio(cliente.nombre())
                || !esVacio(cliente.telefono())
                || !esVacio(cliente.correo());
    }

    private boolean esVacio(String valor) {
        return valor == null || valor.isBlank();
    }

    private Cliente resolverCliente(ClientePagoRequest datos) {
        if (!esVacio(datos.cedula())) {
            Optional<Cliente> existente = clienteRepository.findByCedula(datos.cedula().trim());
            if (existente.isPresent()) {
                return existente.get();
            }
        }
        Cliente cliente = new Cliente();
        cliente.setNombre(esVacio(datos.nombre()) ? null : datos.nombre().trim());
        cliente.setCedula(esVacio(datos.cedula()) ? null : datos.cedula().trim());
        cliente.setTelefono(esVacio(datos.telefono()) ? null : datos.telefono().trim());
        cliente.setCorreo(esVacio(datos.correo()) ? null : datos.correo().trim());
        cliente.setActivo(true);
        clienteRepository.persistAndFlush(cliente);
        return cliente;
    }
}
